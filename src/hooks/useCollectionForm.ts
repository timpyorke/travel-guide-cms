import { useState, useCallback, useMemo } from "react";
import { FirebaseApp } from "firebase/app";
import { createCmsCollectionService } from "../services/cmsCollectionService";
import { FormValidator, FormUtils } from "../utils/validation";
import { ObjectUtils, IdUtils } from "../utils/common";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../localization";
import { DEFAULT_CMS_COLLECTION_PERMISSIONS, ZERO_LENGTH, EMPTY_STRING } from "../constants";
import type {
    CollectionFormData,
    PropertyFormData,
    LocalizationFormData,
    CmsCollectionConfig,
    CmsCollectionPermissions
} from "../types";

export interface UseCollectionFormResult {
    formState: CollectionFormData;
    initialSnapshot: CollectionFormData;
    isDirty: boolean;
    isSubmitting: boolean;
    loadingExisting: boolean;
    successMessage: string | null;
    errorMessage: string | null;
    updateFormState: (updates: Partial<CollectionFormData>) => void;
    updateProperty: <K extends keyof PropertyFormData>(index: number, key: K, value: PropertyFormData[K]) => void;
    updateLocalization: (localeCode: string, field: keyof LocalizationFormData, value: string) => void;
    addProperty: () => void;
    removeProperty: (index: number) => void;
    resetForm: () => void;
    loadCollection: (collectionId: string) => Promise<void>;
    saveCollection: () => Promise<void>;
    togglePermission: (field: keyof CmsCollectionPermissions) => void;
}

const createEmptyProperty = (): PropertyFormData => ({
    id: IdUtils.generatePropertyId(),
    key: EMPTY_STRING,
    name: EMPTY_STRING,
    description: EMPTY_STRING,
    dataType: "string",
    required: false,
    enumValues: [],
    referencePath: EMPTY_STRING,
    arrayOfType: "string",
    arrayEnumValues: [],
    arrayReferencePath: EMPTY_STRING,
    storageEnabled: false,
    storagePath: EMPTY_STRING,
    storageAcceptedFiles: EMPTY_STRING,
    storageMaxSize: EMPTY_STRING,
    defaultValue: EMPTY_STRING,
    localized: false,
    multiline: false,
    markdown: false,
    autoValue: undefined
});

const createEmptyLocalization = (): LocalizationFormData => ({
    name: EMPTY_STRING,
    description: EMPTY_STRING,
    group: EMPTY_STRING
});

const buildEmptyLocalizations = (): Record<string, LocalizationFormData> => {
    return SUPPORTED_LOCALES.reduce((acc, { code }) => {
        acc[code] = createEmptyLocalization();
        return acc;
    }, {} as Record<string, LocalizationFormData>);
};

const createEmptyFormState = (): CollectionFormData => ({
    collectionId: EMPTY_STRING,
    name: EMPTY_STRING,
    path: EMPTY_STRING,
    group: EMPTY_STRING,
    icon: EMPTY_STRING,
    description: EMPTY_STRING,
    permissions: {
        read: DEFAULT_CMS_COLLECTION_PERMISSIONS.read,
        create: DEFAULT_CMS_COLLECTION_PERMISSIONS.create,
        edit: DEFAULT_CMS_COLLECTION_PERMISSIONS.edit,
        delete: DEFAULT_CMS_COLLECTION_PERMISSIONS.delete
    },
    properties: [createEmptyProperty()],
    localizations: buildEmptyLocalizations()
});

/**
 * Custom hook for collection form management
 */
export const useCollectionForm = (firebaseApp: FirebaseApp): UseCollectionFormResult => {
    const [formState, setFormState] = useState<CollectionFormData>(() => createEmptyFormState());
    const [initialSnapshot, setInitialSnapshot] = useState<CollectionFormData>(() => createEmptyFormState());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const cmsService = useMemo(() => createCmsCollectionService(firebaseApp), [firebaseApp]);

    const updateFormState = useCallback((updates: Partial<CollectionFormData>) => {
        setFormState(current => ({ ...current, ...updates }));
    }, []);

    const updateProperty = useCallback(<K extends keyof PropertyFormData>(
        index: number,
        key: K,
        value: PropertyFormData[K]
    ) => {
        setFormState(current => {
            const properties = current.properties.map((property, propertyIndex) => {
                if (propertyIndex !== index) return property;

                const updated: PropertyFormData = {
                    ...property,
                    [key]: value
                };

                // Apply business logic for property updates
                if (key === "dataType") {
                    if (value !== "string") {
                        updated.enumValues = [];
                    }
                    if (value !== "reference") {
                        updated.referencePath = EMPTY_STRING;
                    }
                    if (value !== "array") {
                        updated.arrayOfType = "string";
                        updated.arrayEnumValues = [];
                        updated.arrayReferencePath = EMPTY_STRING;
                    }
                    if (value !== "string") {
                        updated.storageEnabled = false;
                        updated.storagePath = EMPTY_STRING;
                        updated.storageAcceptedFiles = EMPTY_STRING;
                        updated.storageMaxSize = EMPTY_STRING;
                        updated.defaultValue = EMPTY_STRING;
                        updated.localized = false;
                    }
                }

                if (key === "arrayOfType") {
                    if (value !== "string") {
                        updated.arrayEnumValues = [];
                    }
                    if (value !== "reference") {
                        updated.arrayReferencePath = EMPTY_STRING;
                    }
                }

                if (key === "storageEnabled" && value === false) {
                    updated.storagePath = EMPTY_STRING;
                    updated.storageAcceptedFiles = EMPTY_STRING;
                    updated.storageMaxSize = EMPTY_STRING;
                    updated.defaultValue = EMPTY_STRING;
                }

                if (key === "localized") {
                    if (value) {
                        updated.storageEnabled = false;
                        updated.storagePath = EMPTY_STRING;
                        updated.storageAcceptedFiles = EMPTY_STRING;
                        updated.storageMaxSize = EMPTY_STRING;
                        updated.defaultValue = EMPTY_STRING;
                    }
                }

                if (key === "markdown" && value === true) {
                    updated.multiline = true;
                }

                return updated;
            });

            return { ...current, properties };
        });
    }, []);

    const updateLocalization = useCallback((
        localeCode: string,
        field: keyof LocalizationFormData,
        value: string
    ) => {
        setFormState(current => {
            const entry = current.localizations[localeCode] ?? createEmptyLocalization();
            const updatedLocalizations = {
                ...current.localizations,
                [localeCode]: {
                    ...entry,
                    [field]: value
                }
            };

            const updatedState: CollectionFormData = {
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
    }, []);

    const togglePermission = useCallback((field: keyof CmsCollectionPermissions) => {
        setFormState(current => ({
            ...current,
            permissions: {
                ...current.permissions,
                [field]: !current.permissions[field]
            }
        }));
    }, []);

    const addProperty = useCallback(() => {
        setFormState(current => ({
            ...current,
            properties: [...current.properties, createEmptyProperty()]
        }));
    }, []);

    const removeProperty = useCallback((index: number) => {
        setFormState(current => {
            if (current.properties.length === 1) return current;
            return {
                ...current,
                properties: current.properties.filter((_, propertyIndex) => propertyIndex !== index)
            };
        });
    }, []);

    const applySnapshot = useCallback((snapshot: CollectionFormData) => {
        setFormState(ObjectUtils.deepClone(snapshot));
        setInitialSnapshot(ObjectUtils.deepClone(snapshot));
    }, []);

    const resetForm = useCallback(() => {
        setFormState(ObjectUtils.deepClone(initialSnapshot));
        setSuccessMessage(null);
        setErrorMessage(null);
    }, [initialSnapshot]);

    const loadCollection = useCallback(async (collectionId: string) => {
        setLoadingExisting(true);
        setErrorMessage(null);

        try {
            const data = await cmsService.getCollection(collectionId);

            if (!data) {
                const fallbackState = {
                    ...createEmptyFormState(),
                    collectionId
                };
                applySnapshot(fallbackState);
                setErrorMessage(`Collection "${collectionId}" was not found. Create it now or choose another identifier.`);
                return;
            }

            // Convert CmsCollectionConfig to CollectionFormData
            const stateFromConfig = convertConfigToFormState(data);
            applySnapshot(stateFromConfig);
            setSuccessMessage(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unexpected error loading the collection.";
            setErrorMessage(errorMessage);
        } finally {
            setLoadingExisting(false);
        }
    }, [cmsService, applySnapshot]);

    const saveCollection = useCallback(async () => {
        setSuccessMessage(null);
        setErrorMessage(null);

        const sanitizedState = FormUtils.sanitizeCollectionForm(formState);
        const validationError = FormValidator.validateCollectionForm(sanitizedState);

        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = buildCollectionPayload(sanitizedState);
            await cmsService.saveCollection(sanitizedState.collectionId, payload);

            setSuccessMessage(`Collection "${sanitizedState.name}" saved successfully.`);
            applySnapshot(sanitizedState);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unexpected error saving the collection.";
            setErrorMessage(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [formState, cmsService, applySnapshot]);

    const sanitizedCurrentState = useMemo(() => FormUtils.sanitizeCollectionForm(formState), [formState]);
    const sanitizedInitialState = useMemo(() => FormUtils.sanitizeCollectionForm(initialSnapshot), [initialSnapshot]);
    const isDirty = useMemo(
        () => JSON.stringify(sanitizedCurrentState) !== JSON.stringify(sanitizedInitialState),
        [sanitizedCurrentState, sanitizedInitialState]
    );

    return {
        formState,
        initialSnapshot,
        isDirty,
        isSubmitting,
        loadingExisting,
        successMessage,
        errorMessage,
        updateFormState,
        updateProperty,
        updateLocalization,
        addProperty,
        removeProperty,
        resetForm,
        loadCollection,
        saveCollection,
        togglePermission
    };
};

// Helper functions
const convertConfigToFormState = (config: CmsCollectionConfig): CollectionFormData => {
    // Implementation similar to cmsConfigToFormState from the original component
    const localizationState = buildEmptyLocalizations();

    SUPPORTED_LOCALES.forEach(({ code }) => {
        const localized = config.localizations?.[code];
        if (localized?.name && localizationState[code]) localizationState[code]!.name = localized.name;
        if (localized?.description && localizationState[code]) localizationState[code]!.description = localized.description;
        if (localized?.group && localizationState[code]) localizationState[code]!.group = localized.group;
    });

    const defaultLocalization = localizationState[DEFAULT_LOCALE];
    if (defaultLocalization) {
        localizationState[DEFAULT_LOCALE] = {
            name: config.name?.trim() ?? defaultLocalization.name,
            description: config.description?.trim() ?? defaultLocalization.description,
            group: config.group?.trim() ?? defaultLocalization.group
        };
    }

    return {
        collectionId: config.id?.trim() ?? EMPTY_STRING,
        name: config.name?.trim() ?? EMPTY_STRING,
        path: config.path?.trim() ?? EMPTY_STRING,
        group: config.group?.trim() ?? EMPTY_STRING,
        icon: config.icon?.toString().trim() ?? EMPTY_STRING,
        description: config.description?.trim() ?? EMPTY_STRING,
        permissions: {
            read: config.permissions?.read ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.read,
            create: config.permissions?.create ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.create,
            edit: config.permissions?.edit ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.edit,
            delete: config.permissions?.delete ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.delete
        },
        properties: Array.isArray(config.properties) && config.properties.length > ZERO_LENGTH
            ? config.properties.map(convertPropertyToFormState)
            : [createEmptyProperty()],
        localizations: localizationState
    };
};

const convertPropertyToFormState = (propertyConfig: any): PropertyFormData => {
    // Simplified conversion - in a real implementation, this would be more comprehensive
    return {
        id: IdUtils.generatePropertyId(),
        key: propertyConfig.key?.trim() ?? EMPTY_STRING,
        name: propertyConfig.name?.trim() ?? EMPTY_STRING,
        description: propertyConfig.description?.trim() ?? EMPTY_STRING,
        dataType: propertyConfig.dataType ?? "string",
        required: propertyConfig.required === true,
        enumValues: FormUtils.enumValuesToList(propertyConfig.enumValues),
        referencePath: propertyConfig.path?.trim() ?? EMPTY_STRING,
        arrayOfType: "string",
        arrayEnumValues: [],
        arrayReferencePath: EMPTY_STRING,
        storageEnabled: false,
        storagePath: EMPTY_STRING,
        storageAcceptedFiles: EMPTY_STRING,
        storageMaxSize: EMPTY_STRING,
        defaultValue: propertyConfig.defaultValue?.trim() ?? EMPTY_STRING,
        localized: propertyConfig.localized === true,
        multiline: propertyConfig.multiline === true,
        markdown: propertyConfig.markdown === true,
        autoValue: propertyConfig.autoValue
    };
};

const buildCollectionPayload = (state: CollectionFormData): CmsCollectionConfig => {
    const localizationPayload = Object.entries(state.localizations).reduce((acc, [locale, values]) => {
        if (locale === DEFAULT_LOCALE) return acc;
        const entries: Record<string, string> = {};
        if (values.name) entries.name = values.name;
        if (values.description) entries.description = values.description;
        if (values.group) entries.group = values.group;
        if (Object.keys(entries).length > ZERO_LENGTH) {
            acc[locale] = entries;
        }
        return acc;
    }, {} as Record<string, Record<string, string>>);

    return {
        id: state.collectionId,
        name: state.name,
        description: state.description || undefined,
        path: state.path,
        group: state.group || undefined,
        icon: state.icon || undefined,
        permissions: state.permissions,
        properties: state.properties.map(buildPropertyPayload),
        ...(Object.keys(localizationPayload).length > ZERO_LENGTH && { localizations: localizationPayload })
    };
};

const buildPropertyPayload = (property: PropertyFormData): any => {
    // Simplified property payload building
    const base: Record<string, unknown> = {
        key: property.key,
        dataType: property.dataType
    };

    if (property.name) base.name = property.name;
    if (property.description) base.description = property.description;
    if (property.required) base.required = true;

    return base;
};