import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FirebaseApp } from "firebase/app";
import {
    doc,
    getDoc,
    getFirestore,
    setDoc
} from "firebase/firestore";
import {
    Alert,
    Button,
    CircularProgress,
    Paper,
    TextField,
    Typography
} from "@firecms/ui";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../localization";

const ICON_OPTIONS = [
    "place",
    "map",
    "photo",
    "star",
    "home",
    "flight",
    "hotel",
    "workspace_premium",
    "language",
    "local_library",
    "directions_car",
    "restaurant",
    "celebration",
    "local_activity"
] as const;

import { useSnackbarController } from "@firecms/core";
import { StorageBrowserDialog } from "./storage/StorageBrowser";
import type {
    CmsCollectionConfig,
    CmsCollectionPermissions,
    CmsPropertyConfig
} from "../collections/CmsCollections";
import { DEFAULT_CMS_COLLECTION_PERMISSIONS } from "../collections/CmsCollections";

type ScalarDataType =
    "string"
    | "number"
    | "boolean"
    | "date"
    | "date_time";

type PropertyDataType = ScalarDataType | "reference" | "array";

type ArrayInnerType = "string" | "reference";

type PermissionState = Required<CmsCollectionPermissions>;

const generatePropertyId = (): string => {
    const randomUUID = (globalThis as any)?.crypto?.randomUUID?.();
    if (randomUUID) return randomUUID;
    return `prop_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
};

type PropertyFormState = {
    id: string;
    key: string;
    name: string;
    description: string;
    dataType: PropertyDataType;
    required: boolean;
    enumValues: string[];
    referencePath: string;
    arrayOfType: ArrayInnerType;
    arrayEnumValues: string[];
    arrayReferencePath: string;
    storageEnabled: boolean;
    storagePath: string;
    storageAcceptedFiles: string;
    storageMaxSize: string;
    defaultValue: string;
    localized: boolean;
};

type FormState = {
    collectionId: string;
    name: string;
    path: string;
    group: string;
    icon: string;
    description: string;
    permissions: PermissionState;
    properties: PropertyFormState[];
    localizations: Record<string, LocalizationFormState>;
};

type StoragePickerState = {
    propertyIndex: number;
    target: "storagePath" | "defaultValue";
    selectionMode: "file" | "folder";
    initialPath?: string;
};

type LocalizationFormState = {
    name: string;
    description: string;
    group: string;
};

const emptyLocalization = (): LocalizationFormState => ({
    name: "",
    description: "",
    group: ""
});

const buildEmptyLocalizations = (): Record<string, LocalizationFormState> => {
    return SUPPORTED_LOCALES.reduce((acc, { code }) => {
        acc[code] = emptyLocalization();
        return acc;
    }, {} as Record<string, LocalizationFormState>);
};

const createEmptyProperty = (): PropertyFormState => ({
    id: generatePropertyId(),
    key: "",
    name: "",
    description: "",
    dataType: "string",
    required: false,
    enumValues: [],
    referencePath: "",
    arrayOfType: "string",
    arrayEnumValues: [],
    arrayReferencePath: "",
    storageEnabled: false,
    storagePath: "",
    storageAcceptedFiles: "",
    storageMaxSize: "",
    defaultValue: "",
    localized: false
});

const createEmptyFormState = (): FormState => ({
    collectionId: "",
    name: "",
    path: "",
    group: "",
    icon: "",
    description: "",
    permissions: {
        read: DEFAULT_CMS_COLLECTION_PERMISSIONS.read,
        create: DEFAULT_CMS_COLLECTION_PERMISSIONS.create,
        edit: DEFAULT_CMS_COLLECTION_PERMISSIONS.edit,
        delete: DEFAULT_CMS_COLLECTION_PERMISSIONS.delete
    },
    properties: [createEmptyProperty()],
    localizations: buildEmptyLocalizations()
});

const cloneFormState = (state: FormState): FormState => ({
    ...state,
    permissions: { ...state.permissions },
    properties: state.properties.map((property) => ({
        ...property,
        enumValues: [...property.enumValues],
        arrayEnumValues: [...property.arrayEnumValues]
    })),
    localizations: Object.entries(state.localizations).reduce((acc, [locale, values]) => {
        acc[locale] = { ...values };
        return acc;
    }, {} as Record<string, LocalizationFormState>)
});

const enumValuesToList = (enumValues?: Record<string, string>): string[] =>
    enumValues ? Object.keys(enumValues) : [];

const listToEnumValues = (values: string[]): Record<string, string> | undefined => {
    const trimmedValues = values.map((value) => value.trim()).filter((value) => !!value);
    if (!trimmedValues.length) return undefined;
    return trimmedValues.reduce((acc, current) => {
        acc[current] = current;
        return acc;
    }, {} as Record<string, string>);
};

const cmsPropertyToFormState = (propertyConfig?: CmsPropertyConfig): PropertyFormState => {
    if (!propertyConfig) return createEmptyProperty();
    const dataType = (propertyConfig.dataType ?? "string") as PropertyDataType;
    const property: PropertyFormState = {
        id: generatePropertyId(),
        key: propertyConfig.key?.trim() ?? "",
        name: propertyConfig.name?.trim() ?? "",
        description: propertyConfig.description?.trim() ?? "",
        dataType,
        required: propertyConfig.required === true,
        enumValues: enumValuesToList(propertyConfig.enumValues),
        referencePath: propertyConfig.path?.trim() ?? "",
        arrayOfType: "string",
        arrayEnumValues: [],
        arrayReferencePath: "",
        storageEnabled: dataType === "string" && !!propertyConfig.storage?.storagePath,
        storagePath: propertyConfig.storage?.storagePath?.trim() ?? "",
        storageAcceptedFiles: propertyConfig.storage?.acceptedFiles?.join(", ") ?? "",
        storageMaxSize: propertyConfig.storage?.maxSize
            ? (propertyConfig.storage.maxSize / (1024 * 1024)).toString()
            : "",
        defaultValue: propertyConfig.defaultValue?.trim() ?? "",
        localized: propertyConfig.localized === true
    };

    if (dataType === "array") {
        const arrayConfig = propertyConfig.of;
        const arrayDataType = (arrayConfig?.dataType ?? "string") as ArrayInnerType;
        property.arrayOfType = arrayDataType;
        property.arrayEnumValues = arrayDataType === "string" ? enumValuesToList(arrayConfig?.enumValues) : [];
        property.arrayReferencePath = arrayDataType === "reference"
            ? arrayConfig?.path?.trim() ?? ""
            : "";
    }

    if (dataType !== "string") {
        property.storageEnabled = false;
        property.storagePath = "";
        property.storageAcceptedFiles = "";
        property.storageMaxSize = "";
        property.defaultValue = "";
    }

    return property;
};

const cmsConfigToFormState = (config: CmsCollectionConfig): FormState => ({
    collectionId: config.id?.trim() ?? "",
    name: config.name?.trim() ?? "",
    path: config.path?.trim() ?? "",
    group: config.group?.trim() ?? "",
    icon: config.icon?.toString().trim() ?? "",
    description: config.description?.trim() ?? "",
    permissions: {
        read: config.permissions?.read ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.read,
        create: config.permissions?.create ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.create,
        edit: config.permissions?.edit ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.edit,
        delete: config.permissions?.delete ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.delete
    },
    properties: Array.isArray(config.properties) && config.properties.length > 0
        ? config.properties.map(cmsPropertyToFormState)
        : [createEmptyProperty()],
    localizations: (() => {
        const localizationState = buildEmptyLocalizations();
        SUPPORTED_LOCALES.forEach(({ code }) => {
            const localized = config.localizations?.[code];
            if (localized?.name) localizationState[code].name = localized.name;
            if (localized?.description) localizationState[code].description = localized.description;
            if (localized?.group) localizationState[code].group = localized.group;
        });
        localizationState[DEFAULT_LOCALE] = {
            name: config.name?.trim() ?? localizationState[DEFAULT_LOCALE].name,
            description: config.description?.trim() ?? localizationState[DEFAULT_LOCALE].description,
            group: config.group?.trim() ?? localizationState[DEFAULT_LOCALE].group
        };
        return localizationState;
    })()
});

const sanitizeFormState = (state: FormState): FormState => ({
    ...state,
    collectionId: state.collectionId.trim(),
    name: state.name.trim(),
    path: state.path.trim(),
    group: state.group.trim(),
    icon: state.icon.trim(),
    description: state.description.trim(),
    permissions: { ...state.permissions },
    properties: state.properties.map((property) => ({
        ...property,
        key: property.key.trim(),
        name: property.name.trim(),
        description: property.description.trim(),
        referencePath: property.referencePath.trim(),
        arrayReferencePath: property.arrayReferencePath.trim(),
        enumValues: property.enumValues.map((value) => value.trim()).filter(Boolean),
        arrayEnumValues: property.arrayEnumValues.map((value) => value.trim()).filter(Boolean),
        storagePath: property.storagePath.trim(),
        storageAcceptedFiles: property.storageAcceptedFiles
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
            .join(", "),
        storageMaxSize: property.storageMaxSize.trim(),
        defaultValue: property.defaultValue.trim()
    })),
    localizations: Object.entries(state.localizations).reduce((acc, [locale, values]) => {
        acc[locale] = {
            name: values.name.trim(),
            description: values.description.trim(),
            group: values.group.trim()
        };
        return acc;
    }, {} as Record<string, LocalizationFormState>)
});

const validateForm = (state: FormState): string | null => {
    if (!state.collectionId) {
        return "Collection ID is required.";
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(state.collectionId)) {
        return "Collection ID can only contain letters, numbers, dashes, and underscores.";
    }
    if (!state.name) {
        return "Collection name is required.";
    }
    if (!state.path) {
        return "Firestore path is required.";
    }
    if (!state.properties.length) {
        return "At least one property is required.";
    }
    for (const property of state.properties) {
        if (!property.key) {
            return "All properties require a field key.";
        }
        if (property.dataType === "reference" && !property.referencePath) {
            return `Property "${property.key}" requires a reference path.`;
        }
        if (property.dataType === "array") {
            if (property.arrayOfType === "reference" && !property.arrayReferencePath) {
                return `Array property "${property.key}" requires a reference path.`;
            }
        }
        if (property.dataType === "string" && property.storageEnabled && !property.storagePath) {
            return `Property "${property.key || "unnamed"}" requires a storage folder.`;
        }
        if (property.dataType === "string" && property.storageEnabled && property.storageMaxSize) {
            const numericSize = Number(property.storageMaxSize);
            if (Number.isNaN(numericSize) || numericSize < 0) {
                return `Property "${property.key || "unnamed"}" has an invalid max file size.`;
            }
        }
    }
    return null;
};

const buildPropertyPayload = (property: PropertyFormState) => {
    const {
        id: _id,
        ...rest
    } = property;
    const baseProperty = rest;
    const base: Record<string, any> = {
        key: baseProperty.key,
        dataType: baseProperty.dataType
    };

    if (baseProperty.name) base.name = baseProperty.name;
    if (baseProperty.description) base.description = baseProperty.description;
    if (baseProperty.required) base.required = true;

    if (baseProperty.dataType === "string") {
        const enumValues = listToEnumValues(baseProperty.enumValues);
        if (enumValues) base.enumValues = enumValues;
    }

    if (baseProperty.dataType === "reference") {
        base.path = baseProperty.referencePath;
    }

    if (baseProperty.dataType === "array") {
        const of: Record<string, any> = {
            dataType: baseProperty.arrayOfType
        };
        if (baseProperty.arrayOfType === "string") {
            const enumValues = listToEnumValues(baseProperty.arrayEnumValues);
            if (enumValues) {
                of.enumValues = enumValues;
            }
        }
        if (baseProperty.arrayOfType === "reference" && baseProperty.arrayReferencePath) {
            of.path = baseProperty.arrayReferencePath;
        }
        base.of = of;
    }

    if (baseProperty.dataType === "string" && baseProperty.storageEnabled && baseProperty.storagePath) {
        const acceptedFiles = baseProperty.storageAcceptedFiles
            ? baseProperty.storageAcceptedFiles.split(",").map((value) => value.trim()).filter(Boolean)
            : undefined;
        const maxSizeBytes = baseProperty.storageMaxSize
            ? Math.round(Number(baseProperty.storageMaxSize) * 1024 * 1024)
            : undefined;
        base.storage = {
            storagePath: baseProperty.storagePath,
            acceptedFiles,
            maxSize: maxSizeBytes && !Number.isNaN(maxSizeBytes) ? maxSizeBytes : undefined
        };
    }

    if (baseProperty.defaultValue) {
        base.defaultValue = baseProperty.defaultValue;
    }

    if (baseProperty.localized) {
        base.localized = true;
    }

    return base;
};

const buildPermissionsPayload = (permissions: PermissionState): PermissionState => ({
    read: permissions.read,
    create: permissions.create,
    edit: permissions.edit,
    delete: permissions.delete
});

export type CmsCollectionFormProps = {
    firebaseApp: FirebaseApp;
    collectionId?: string;
};

export const CmsCollectionForm: React.FC<CmsCollectionFormProps> = ({
    firebaseApp,
    collectionId: initialCollectionId
}) => {

    const firestore = useMemo(() => getFirestore(firebaseApp), [firebaseApp]);
    const navigate = useNavigate();
    const isEditMode = Boolean(initialCollectionId);
    const snackbar = useSnackbarController();

    const [formState, setFormState] = useState<FormState>(() => createEmptyFormState());
    const [initialSnapshot, setInitialSnapshot] = useState<FormState>(() => createEmptyFormState());

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState<boolean>(isEditMode);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [storagePicker, setStoragePicker] = useState<StoragePickerState | null>(null);

    const applySnapshot = useCallback((snapshot: FormState) => {
        setFormState(cloneFormState(snapshot));
        setInitialSnapshot(cloneFormState(snapshot));
    }, []);

    useEffect(() => {
        if (!isEditMode) {
            const defaultState = createEmptyFormState();
            applySnapshot(defaultState);
            setLoadingExisting(false);
            return;
        }

        let isCancelled = false;
        setLoadingExisting(true);
        const loadCollection = async () => {
            try {
                const docRef = doc(firestore, "cms_collections", initialCollectionId as string);
                const docSnapshot = await getDoc(docRef);
                if (!docSnapshot.exists()) {
                    if (!isCancelled) {
                        const fallbackState = {
                            ...createEmptyFormState(),
                            collectionId: initialCollectionId as string
                        };
                        applySnapshot(fallbackState);
                        setErrorMessage(`Collection "${initialCollectionId}" was not found. Create it now or choose another identifier.`);
                    }
                    return;
                }
                const data = docSnapshot.data() as CmsCollectionConfig;
                const stateFromConfig = cmsConfigToFormState({
                    ...data,
                    id: data.id ?? initialCollectionId
                });
                if (!isCancelled) {
                    applySnapshot(stateFromConfig);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                }
            } catch (error: any) {
                if (!isCancelled) {
                    setErrorMessage(error?.message ?? "Unexpected error loading the collection.");
                }
            } finally {
                if (!isCancelled) {
                    setLoadingExisting(false);
                }
            }
        };

        loadCollection();

        return () => {
            isCancelled = true;
        };

    }, [applySnapshot, firestore, initialCollectionId, isEditMode]);

    const handlePermissionToggle = (field: keyof PermissionState) => {
        setFormState((current) => ({
            ...current,
            permissions: {
                ...current.permissions,
                [field]: !current.permissions[field]
            }
        }));
    };

    const handleLocalizationChange = (localeCode: string, field: keyof LocalizationFormState, value: string) => {
        setFormState((current) => {
            const entry = current.localizations[localeCode] ?? emptyLocalization();
            const updatedLocalizations = {
                ...current.localizations,
                [localeCode]: {
                    ...entry,
                    [field]: value
                }
            };
            const updatedState: FormState = {
                ...current,
                localizations: updatedLocalizations
            };
            if (localeCode === DEFAULT_LOCALE) {
                if (field === "name") updatedState.name = value;
                if (field === "description") updatedState.description = value;
                if (field === "group") updatedState.group = value;
            }
            return updatedState;
        });
    };

    const handlePropertyChange = <K extends keyof PropertyFormState>(index: number, key: K, value: PropertyFormState[K]) => {
        setFormState((current) => {
            const properties = current.properties.map((property, propertyIndex) => {
                if (propertyIndex !== index) return property;
                const updated: PropertyFormState = {
                    ...property,
                    [key]: value
                };

                if (key === "dataType") {
                    if (value !== "string") {
                        updated.enumValues = [];
                    }
                    if (value !== "reference") {
                        updated.referencePath = "";
                    }
                    if (value !== "array") {
                        updated.arrayOfType = "string";
                        updated.arrayEnumValues = [];
                        updated.arrayReferencePath = "";
                    }
                    if (value !== "string") {
                        updated.storageEnabled = false;
                        updated.storagePath = "";
                        updated.storageAcceptedFiles = "";
                        updated.storageMaxSize = "";
                        updated.defaultValue = "";
                        updated.localized = false;
                    }
                }

                if (key === "arrayOfType") {
                    if (value !== "string") {
                        updated.arrayEnumValues = [];
                    }
                    if (value !== "reference") {
                        updated.arrayReferencePath = "";
                    }
                }

                if (key === "storageEnabled" && value === false) {
                    updated.storagePath = "";
                    updated.storageAcceptedFiles = "";
                    updated.storageMaxSize = "";
                    updated.defaultValue = "";
                }

                if (key === "localized" && value === true) {
                    updated.storageEnabled = false;
                    updated.storagePath = "";
                    updated.storageAcceptedFiles = "";
                    updated.storageMaxSize = "";
                    updated.defaultValue = "";
                }

                return updated;
            });
            return {
                ...current,
                properties
            };
        });
    };

    const openStoragePicker = (propertyIndex: number, target: "storagePath" | "defaultValue") => {
        const property = formState.properties[propertyIndex];
        setStoragePicker({
            propertyIndex,
            target,
            selectionMode: target === "storagePath" ? "folder" : "file",
            initialPath: target === "storagePath" ? property.storagePath : property.defaultValue
        });
    };

    const closeStoragePicker = () => setStoragePicker(null);

    const handleStorageSelect = (path: string) => {
        if (!storagePicker) return;
        setFormState((current) => {
            const properties = current.properties.map((property, index) => {
                if (index !== storagePicker.propertyIndex) return property;
                const updated = { ...property };
                if (storagePicker.target === "storagePath") {
                    updated.storagePath = path;
                    updated.storageEnabled = true;
                } else {
                    updated.defaultValue = path;
                }
                return updated;
            });
            return {
                ...current,
                properties
            };
        });
        setStoragePicker(null);
    };

    const addProperty = () => {
        setFormState((current) => ({
            ...current,
            properties: [...current.properties, createEmptyProperty()]
        }));
    };

    const removeProperty = (index: number) => {
        setFormState((current) => {
            if (current.properties.length === 1) return current;
            return {
                ...current,
                properties: current.properties.filter((_, propertyIndex) => propertyIndex !== index)
            };
        });
    };

    const resetForm = () => {
        setFormState(cloneFormState(initialSnapshot));
        setSuccessMessage(null);
        setErrorMessage(null);
    };

    const sanitizedCurrentState = useMemo(() => sanitizeFormState(formState), [formState]);
    const sanitizedInitialState = useMemo(() => sanitizeFormState(initialSnapshot), [initialSnapshot]);
    const isDirty = useMemo(() => JSON.stringify(sanitizedCurrentState) !== JSON.stringify(sanitizedInitialState),
        [sanitizedCurrentState, sanitizedInitialState]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        const sanitizedState = sanitizedCurrentState;
        const validationError = validateForm(sanitizedState);
        if (validationError) {
            setErrorMessage(validationError);
            snackbar.open({
                type: "error",
                message: validationError,
                autoHideDuration: 4500
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                id: sanitizedState.collectionId,
                name: sanitizedState.name,
                description: sanitizedState.description || undefined,
                path: sanitizedState.path,
                group: sanitizedState.group || undefined,
                icon: sanitizedState.icon || undefined,
                permissions: buildPermissionsPayload(sanitizedState.permissions),
                properties: sanitizedState.properties.map(buildPropertyPayload)
            };

            const localizationPayload = Object.entries(sanitizedState.localizations).reduce((acc, [locale, values]) => {
                if (locale === DEFAULT_LOCALE) return acc;
                const entries: Record<string, string> = {};
                if (values.name) entries.name = values.name;
                if (values.description) entries.description = values.description;
                if (values.group) entries.group = values.group;
                if (Object.keys(entries).length > 0) {
                    acc[locale] = entries;
                }
                return acc;
            }, {} as Record<string, Record<string, string>>);

            if (Object.keys(localizationPayload).length > 0) {
                (payload as any).localizations = localizationPayload;
            }

            await setDoc(doc(firestore, "cms_collections", sanitizedState.collectionId), payload);

            if (isEditMode) {
                setSuccessMessage(`Collection "${sanitizedState.name}" updated successfully.`);
                snackbar.open({
                    type: "success",
                    message: `Collection "${sanitizedState.name}" saved`,
                    autoHideDuration: 4000
                });
                applySnapshot(sanitizedState);
            } else {
                setSuccessMessage(`Collection "${sanitizedState.name}" created successfully.`);
                snackbar.open({
                    type: "success",
                    message: `Collection "${sanitizedState.name}" created`,
                    autoHideDuration: 4000
                });
                const defaultState = createEmptyFormState();
                applySnapshot(defaultState);
            }
        } catch (error: any) {
            console.error("Error saving collection", error);
            setErrorMessage(error?.message ?? "Unexpected error saving the collection.");
            snackbar.open({
                type: "error",
                message: error?.message ?? "Unexpected error saving the collection.",
                autoHideDuration: 5000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formBusy = isSubmitting || loadingExisting;
    const submitDisabled = formBusy || !isDirty;

    return (
        <div className="w-full flex justify-center px-4 py-8">
            <Paper className="w-full max-w-4xl p-6 md:p-8">
                <div className="flex flex-col gap-2 mb-6">
                    <Typography variant="h5">
                        {isEditMode ? "Edit CMS Collection" : "Create CMS Collection"}
                    </Typography>
                    <Typography variant="body1" color="secondary">
                        {isEditMode
                            ? "Update the metadata used to render this collection inside FireCMS."
                            : "Configure the metadata for a FireCMS collection stored under cms_collections."}
                    </Typography>
                </div>

                {(errorMessage || successMessage) && (
                    <div className="flex flex-col gap-3 mb-4">
                        {errorMessage && (
                            <Alert color="error" onDismiss={() => setErrorMessage(null)}>
                                {errorMessage}
                            </Alert>
                        )}
                        {successMessage && (
                            <Alert color="success" onDismiss={() => setSuccessMessage(null)}>
                                {successMessage}
                            </Alert>
                        )}
                    </div>
                )}

                {loadingExisting && (
                    <div className="flex justify-center py-8">
                        <CircularProgress />
                    </div>
                )}

                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            label="Collection ID"
                            value={formState.collectionId}
                            onChange={(event) => setFormState((current) => ({
                                ...current,
                                collectionId: event.target.value
                            }))}
                            placeholder="e.g. locations"
                            required
                            disabled={formBusy || isEditMode}
                        />
                        <TextField
                            label="Display name"
                            value={formState.name}
                            onChange={(event) => setFormState((current) => {
                                const value = event.target.value;
                                const defaultLocalization = current.localizations[DEFAULT_LOCALE] ?? emptyLocalization();
                                return {
                                    ...current,
                                    name: value,
                                    localizations: {
                                        ...current.localizations,
                                        [DEFAULT_LOCALE]: {
                                            ...defaultLocalization,
                                            name: value
                                        }
                                    }
                                };
                            })}
                            placeholder="Locations"
                            required
                            disabled={formBusy}
                        />
                        <TextField
                            label="Firestore path"
                            value={formState.path}
                            onChange={(event) => setFormState((current) => ({
                                ...current,
                                path: event.target.value
                            }))}
                            placeholder="locations"
                            required
                            disabled={formBusy}
                        />
                        <TextField
                            label="Group (optional)"
                            value={formState.group}
                            onChange={(event) => setFormState((current) => {
                                const value = event.target.value;
                                const defaultLocalization = current.localizations[DEFAULT_LOCALE] ?? emptyLocalization();
                                return {
                                    ...current,
                                    group: value,
                                    localizations: {
                                        ...current.localizations,
                                        [DEFAULT_LOCALE]: {
                                            ...defaultLocalization,
                                            group: value
                                        }
                                    }
                                };
                            })}
                            placeholder="Travel"
                            disabled={formBusy}
                        />
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                                Icon (optional)
                            </label>
                            <div className="flex items-center gap-2">
                                <select
                                    className="h-12 rounded-md border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3"
                                    value={formState.icon || ""}
                                    onChange={(event) => setFormState((current) => ({
                                        ...current,
                                        icon: event.target.value
                                    }))}
                                    disabled={formBusy}
                                >
                                    <option value="">None</option>
                                    {ICON_OPTIONS.map((iconKey) => (
                                        <option key={iconKey} value={iconKey}>
                                            {iconKey.replaceAll("_", "-")}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    <TextField
                        label="Description (optional)"
                        multiline
                        minRows={3}
                        value={formState.description}
                        onChange={(event) => setFormState((current) => {
                            const value = event.target.value;
                            const defaultLocalization = current.localizations[DEFAULT_LOCALE] ?? emptyLocalization();
                            return {
                                ...current,
                                description: value,
                                localizations: {
                                    ...current.localizations,
                                    [DEFAULT_LOCALE]: {
                                        ...defaultLocalization,
                                        description: value
                                    }
                                }
                            };
                        })}
                        placeholder="Explain the purpose of this collection for other editors."
                        disabled={formBusy}
                    />

                    {SUPPORTED_LOCALES.filter((locale) => locale.code !== DEFAULT_LOCALE).length > 0 && (
                        <section className="flex flex-col gap-4">
                            <Typography variant="subtitle1" className="mt-2">Localized content</Typography>
                            {SUPPORTED_LOCALES.filter((locale) => locale.code !== DEFAULT_LOCALE).map((locale) => {
                                const localization = formState.localizations[locale.code] ?? emptyLocalization();
                                return (
                                    <div key={locale.code} className="border border-surface-200 dark:border-surface-700 rounded-md p-4 flex flex-col gap-3">
                                        <Typography variant="subtitle2">{locale.label}</Typography>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <TextField
                                                label="Name"
                                                value={localization.name}
                                                onChange={(event) => handleLocalizationChange(locale.code, "name", event.target.value)}
                                                placeholder="Localized name"
                                                disabled={formBusy}
                                            />
                                            <TextField
                                                label="Group"
                                                value={localization.group}
                                                onChange={(event) => handleLocalizationChange(locale.code, "group", event.target.value)}
                                                placeholder="Localized group"
                                                disabled={formBusy}
                                            />
                                            <TextField
                                                label="Description"
                                                multiline
                                                minRows={2}
                                                value={localization.description}
                                                onChange={(event) => handleLocalizationChange(locale.code, "description", event.target.value)}
                                                placeholder="Localized description"
                                                disabled={formBusy}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    )}

                    <section>
                        <Typography variant="subtitle1" className="mb-2">Permissions</Typography>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(["read", "create", "edit", "delete"] as (keyof PermissionState)[]).map((permissionKey) => (
                                <button
                                    key={permissionKey}
                                    type="button"
                                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${formState.permissions[permissionKey]
                                        ? "bg-primary text-white border-primary"
                                        : "bg-surface-100 dark:bg-surface-800 text-text-secondary border-surface-300 dark:border-surface-600"
                                        } ${formBusy ? "opacity-60 cursor-not-allowed" : ""}`}
                                    onClick={() => !formBusy && handlePermissionToggle(permissionKey)}
                                    disabled={formBusy}
                                >
                                    {permissionKey.charAt(0).toUpperCase() + permissionKey.slice(1)}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <Typography variant="subtitle1">Properties</Typography>
                            <Button
                                onClick={addProperty}
                                size="small"
                                color="primary"
                                disabled={formBusy}
                            >
                                Add property
                            </Button>
                        </div>

                        <div className="flex flex-col gap-6">
                            {formState.properties.map((property, index) => (
                                <div
                                    key={property.id}
                                    className="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-4"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <Typography variant="subtitle2">Field {index + 1}</Typography>
                                        {formState.properties.length > 1 && (
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="error"
                                                onClick={() => removeProperty(index)}
                                                disabled={formBusy}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <TextField
                                            label="Field key"
                                            value={property.key}
                                            onChange={(event) => handlePropertyChange(index, "key", event.target.value)}
                                            placeholder="title"
                                            required
                                            disabled={formBusy}
                                        />
                                        <TextField
                                            label="Display name (optional)"
                                            value={property.name}
                                            onChange={(event) => handlePropertyChange(index, "name", event.target.value)}
                                            placeholder="Title"
                                            disabled={formBusy}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                                                Data type
                                            </label>
                                            <select
                                                className="h-12 rounded-md border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3"
                                                value={property.dataType}
                                                onChange={(event) => handlePropertyChange(index, "dataType", event.target.value as PropertyDataType)}
                                                disabled={formBusy}
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="date">Date</option>
                                                <option value="date_time">Date &amp; time</option>
                                                <option value="reference">Reference</option>
                                                <option value="array">Array</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                id={`required-${index}`}
                                                type="checkbox"
                                                checked={property.required}
                                                onChange={(event) => handlePropertyChange(index, "required", event.target.checked)}
                                                disabled={formBusy}
                                            />
                                            <label htmlFor={`required-${index}`} className="text-sm text-text-secondary dark:text-text-secondary-dark">
                                                Required
                                            </label>
                                        </div>
                                    </div>

                                    <TextField
                                        label="Description (optional)"
                                        multiline
                                        minRows={2}
                                        value={property.description}
                                        onChange={(event) => handlePropertyChange(index, "description", event.target.value)}
                                        placeholder="Help other editors understand this field."
                                        disabled={formBusy}
                                    />

                                    {property.dataType === "string" && (
                                        <div className="flex flex-col gap-3 border border-surface-200 dark:border-surface-700 rounded-md p-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    id={`storage-enabled-${index}`}
                                                    type="checkbox"
                                                    checked={property.storageEnabled}
                                                    onChange={(event) => handlePropertyChange(index, "storageEnabled", event.target.checked)}
                                                    disabled={formBusy}
                                                />
                                                <label htmlFor={`storage-enabled-${index}`} className="text-sm text-text-secondary dark:text-text-secondary-dark">
                                                    Enable storage upload field
                                                </label>
                                            </div>
                                            {property.storageEnabled && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <TextField
                                                        label="Storage folder"
                                                        value={property.storagePath}
                                                        onChange={(event) => handlePropertyChange(index, "storagePath", event.target.value)}
                                                        placeholder="images"
                                                        disabled={formBusy}
                                                    />
                                                    <div className="flex items-end gap-2">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => openStoragePicker(index, "storagePath")}
                                                            disabled={formBusy}
                                                        >
                                                            Browse storage
                                                        </Button>
                                                        {property.storagePath && (
                                                            <Button
                                                                size="small"
                                                                variant="text"
                                                                onClick={() => handlePropertyChange(index, "storagePath", "")}
                                                                disabled={formBusy}
                                                            >
                                                                Clear
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <TextField
                                                        label="Accepted file types (comma separated)"
                                                        value={property.storageAcceptedFiles}
                                                        onChange={(event) => handlePropertyChange(index, "storageAcceptedFiles", event.target.value)}
                                                        placeholder="image/*,application/pdf"
                                                        disabled={formBusy}
                                                    />
                                                    <TextField
                                                        label="Max file size (MB)"
                                                        value={property.storageMaxSize}
                                                        onChange={(event) => handlePropertyChange(index, "storageMaxSize", event.target.value)}
                                                        type="number"
                                                        placeholder="10"
                                                        disabled={formBusy}
                                                    />
                                                    <TextField
                                                        label="Default value (file path)"
                                                        value={property.defaultValue}
                                                        onChange={(event) => handlePropertyChange(index, "defaultValue", event.target.value)}
                                                        placeholder="Optional path to an existing file"
                                                        disabled={formBusy}
                                                    />
                                                    <div className="flex items-end gap-2">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => openStoragePicker(index, "defaultValue")}
                                                            disabled={formBusy}
                                                        >
                                                            Select file
                                                        </Button>
                                                        {property.defaultValue && (
                                                            <Button
                                                                size="small"
                                                                variant="text"
                                                                onClick={() => handlePropertyChange(index, "defaultValue", "")}
                                                                disabled={formBusy}
                                                            >
                                                                Clear
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {property.dataType === "string" && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                id={`localized-${index}`}
                                                type="checkbox"
                                                checked={property.localized}
                                                onChange={(event) => handlePropertyChange(index, "localized", event.target.checked)}
                                                disabled={formBusy}
                                            />
                                            <label htmlFor={`localized-${index}`} className="text-sm text-text-secondary dark:text-text-secondary-dark">
                                                Localize this field (per locale string values)
                                            </label>
                                        </div>
                                    )}

                                    {property.dataType === "string" && (
                                        <TextField
                                            label="Enum values (optional)"
                                            multiline
                                            minRows={2}
                                            value={property.enumValues.join("\n")}
                                            onChange={(event) => handlePropertyChange(
                                                index,
                                                "enumValues",
                                                event.target.value.split("\n")
                                            )}
                                            placeholder="Add one value per line"
                                            disabled={formBusy}
                                        />
                                    )}

                                    {property.dataType === "reference" && (
                                        <TextField
                                            label="Reference path"
                                            value={property.referencePath}
                                            onChange={(event) => handlePropertyChange(index, "referencePath", event.target.value)}
                                            placeholder="e.g. products"
                                            required
                                            disabled={formBusy}
                                        />
                                    )}

                                    {property.dataType === "array" && (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                                                    Array item type
                                                </label>
                                                <select
                                                    className="h-12 rounded-md border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3"
                                                    value={property.arrayOfType}
                                                    onChange={(event) => handlePropertyChange(index, "arrayOfType", event.target.value as ArrayInnerType)}
                                                    disabled={formBusy}
                                                >
                                                    <option value="string">String</option>
                                                    <option value="reference">Reference</option>
                                                </select>
                                            </div>

                                            {property.arrayOfType === "string" && (
                                                <TextField
                                                    label="Enum values (optional)"
                                                    multiline
                                                    minRows={2}
                                                    value={property.arrayEnumValues.join("\n")}
                                                    onChange={(event) => handlePropertyChange(
                                                        index,
                                                        "arrayEnumValues",
                                                        event.target.value.split("\n")
                                                    )}
                                                    placeholder="Add one value per line"
                                                    disabled={formBusy}
                                                />
                                            )}

                                            {property.arrayOfType === "reference" && (
                                                <TextField
                                                    label="Reference path"
                                                    value={property.arrayReferencePath}
                                                    onChange={(event) => handlePropertyChange(index, "arrayReferencePath", event.target.value)}
                                                    placeholder="e.g. products"
                                                    required
                                                    disabled={formBusy}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <Button
                            variant="text"
                            color="neutral"
                            onClick={resetForm}
                            disabled={formBusy}
                        >
                            Reset form
                        </Button>
                        <div className="flex gap-3">
                            <Button
                                variant="outlined"
                                color="neutral"
                                onClick={() => navigate(-1)}
                                disabled={formBusy}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                disabled={submitDisabled}
                            >
                                {isEditMode
                                    ? (isSubmitting ? "Saving..." : "Save changes")
                                    : (isSubmitting ? "Creating..." : "Create collection")}
                            </Button>
                        </div>
                    </div>
                </form>
            </Paper>
            <StorageBrowserDialog
                firebaseApp={firebaseApp}
                open={Boolean(storagePicker)}
                onClose={closeStoragePicker}
                selectionMode={storagePicker?.selectionMode ?? "file"}
                initialPath={storagePicker?.initialPath}
                onSelect={(path) => handleStorageSelect(path)}
                title={storagePicker?.target === "storagePath" ? "Select storage folder" : "Select file"}
            />
        </div>
    );
};
