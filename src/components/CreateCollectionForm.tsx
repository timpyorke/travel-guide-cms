import React, { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FirebaseApp } from "firebase/app";
import {
    doc,
    getFirestore,
    setDoc
} from "firebase/firestore";
import {
    Alert,
    Button,
    Paper,
    TextField,
    Typography
} from "@firecms/ui";

type ScalarDataType =
    "string"
    | "number"
    | "boolean"
    | "date"
    | "date_time";

type PropertyDataType = ScalarDataType | "reference" | "array";

type ArrayInnerType = "string" | "reference";

type PermissionState = {
    read: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
};

type PropertyFormState = {
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
};

const emptyProperty = (): PropertyFormState => ({
    key: "",
    name: "",
    description: "",
    dataType: "string",
    required: false,
    enumValues: [],
    referencePath: "",
    arrayOfType: "string",
    arrayEnumValues: [],
    arrayReferencePath: ""
});

export type CreateCollectionFormProps = {
    firebaseApp: FirebaseApp;
};

export const CreateCollectionForm: React.FC<CreateCollectionFormProps> = ({ firebaseApp }) => {

    const firestore = useMemo(() => getFirestore(firebaseApp), [firebaseApp]);
    const navigate = useNavigate();

    const [collectionId, setCollectionId] = useState("");
    const [name, setName] = useState("");
    const [path, setPath] = useState("");
    const [group, setGroup] = useState("");
    const [icon, setIcon] = useState("");
    const [description, setDescription] = useState("");
    const [permissions, setPermissions] = useState<PermissionState>({
        read: true,
        create: true,
        edit: true,
        delete: false
    });
    const [properties, setProperties] = useState<PropertyFormState[]>([emptyProperty()]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handlePermissionToggle = (field: keyof PermissionState) => {
        setPermissions((current) => ({
            ...current,
            [field]: !current[field]
        }));
    };

    const handlePropertyChange = <K extends keyof PropertyFormState>(index: number, key: K, value: PropertyFormState[K]) => {
        setProperties((current) => {
            const next = [...current];
            next[index] = {
                ...next[index],
                [key]: value
            };

            if (key === "dataType") {
                if (value !== "string") {
                    next[index].enumValues = [];
                }
                if (value !== "reference") {
                    next[index].referencePath = "";
                }
                if (value !== "array") {
                    next[index].arrayOfType = "string";
                    next[index].arrayEnumValues = [];
                    next[index].arrayReferencePath = "";
                }
            }

            if (key === "arrayOfType") {
                if (value !== "string") {
                    next[index].arrayEnumValues = [];
                }
                if (value !== "reference") {
                    next[index].arrayReferencePath = "";
                }
            }
            return next;
        });
    };

    const addProperty = () => {
        setProperties((current) => [...current, emptyProperty()]);
    };

    const removeProperty = (index: number) => {
        setProperties((current) => current.length === 1
            ? current
            : current.filter((_, propertyIndex) => propertyIndex !== index));
    };

    const resetForm = () => {
        setCollectionId("");
        setName("");
        setPath("");
        setGroup("");
        setIcon("");
        setDescription("");
        setPermissions({
            read: true,
            create: true,
            edit: true,
            delete: false
        });
        setProperties([emptyProperty()]);
    };

    const toEnumValues = (values: string[]): Record<string, string> | undefined => {
        if (!values.length) return undefined;
        return values.reduce((acc, current) => {
            const trimmed = current.trim();
            if (trimmed) acc[trimmed] = trimmed;
            return acc;
        }, {} as Record<string, string>);
    };

    const validateForm = (): string | null => {
        if (!collectionId.trim()) {
            return "Collection ID is required.";
        }
        if (!/^[a-zA-Z0-9_\-]+$/.test(collectionId.trim())) {
            return "Collection ID can only contain letters, numbers, dashes, and underscores.";
        }
        if (!name.trim()) {
            return "Collection name is required.";
        }
        if (!path.trim()) {
            return "Firestore path is required.";
        }
        const trimmedId = collectionId.trim();
        if (properties.some((property) => !property.key.trim())) {
            return "All properties require a field key.";
        }
        for (const property of properties) {
            if (property.dataType === "reference" && !property.referencePath.trim()) {
                return `Property "${property.key || "unnamed"}" requires a reference path.`;
            }
            if (property.dataType === "array") {
                if (property.arrayOfType === "reference" && !property.arrayReferencePath.trim()) {
                    return `Array property "${property.key || "unnamed"}" requires a reference path.`;
                }
            }
        }
        return null;
    };

    const buildPropertyPayload = (property: PropertyFormState) => {
        const base: Record<string, any> = {
            key: property.key.trim(),
            dataType: property.dataType
        };

        if (property.name.trim()) base.name = property.name.trim();
        if (property.description.trim()) base.description = property.description.trim();
        if (property.required) base.required = true;

        if (property.dataType === "string") {
            const enumValues = toEnumValues(property.enumValues);
            if (enumValues) {
                base.enumValues = enumValues;
            }
        }

        if (property.dataType === "reference") {
            base.path = property.referencePath.trim();
        }

        if (property.dataType === "array") {
            const of: Record<string, any> = {
                dataType: property.arrayOfType
            };

            if (property.arrayOfType === "string") {
                const enumValues = toEnumValues(property.arrayEnumValues);
                if (enumValues) {
                    of.enumValues = enumValues;
                }
            }
            if (property.arrayOfType === "reference" && property.arrayReferencePath.trim()) {
                of.path = property.arrayReferencePath.trim();
            }
            base.of = of;
        }

        return base;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        const validationError = validateForm();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                id: collectionId.trim(),
                name: name.trim(),
                description: description.trim() || undefined,
                path: path.trim(),
                group: group.trim() || undefined,
                icon: icon.trim() || undefined,
                permissions,
                properties: properties.map(buildPropertyPayload)
            };

            await setDoc(doc(firestore, "cms_collections", collectionId.trim()), payload);

            setSuccessMessage(`Collection "${name.trim()}" saved successfully.`);
            resetForm();
        } catch (error: any) {
            console.error("Error creating collection", error);
            setErrorMessage(error?.message || "Unexpected error creating collection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex justify-center px-4 py-8">
            <Paper className="w-full max-w-4xl p-6 md:p-8">
                <div className="flex flex-col gap-4 mb-6">
                    <Typography variant="h5">Create CMS Collection</Typography>
                    <Typography variant="body1" color="secondary">
                        Configure the metadata for a FireCMS collection stored in Firestore under <code>cms_collections</code>.
                        These definitions can be loaded dynamically by the CMS at runtime.
                    </Typography>
                </div>

                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

                    {errorMessage && <Alert color="error" onDismiss={() => setErrorMessage(null)}>{errorMessage}</Alert>}
                    {successMessage && <Alert color="success" onDismiss={() => setSuccessMessage(null)}>{successMessage}</Alert>}

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            label="Collection ID"
                            value={collectionId}
                            onChange={(e) => setCollectionId(e.target.value)}
                            placeholder="e.g. locations"
                            required
                        />
                        <TextField
                            label="Display Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Locations"
                            required
                        />
                        <TextField
                            label="Firestore Path"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            placeholder="locations"
                            required
                        />
                        <TextField
                            label="Group (optional)"
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            placeholder="Travel"
                        />
                        <TextField
                            label="Icon (optional)"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            placeholder="Place"
                        />
                    </section>

                    <TextField
                        label="Description (optional)"
                        multiline
                        minRows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explain the purpose of this collection for other editors."
                    />

                    <section>
                        <Typography variant="subtitle1" className="mb-2">Permissions</Typography>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(["read", "create", "edit", "delete"] as (keyof PermissionState)[]).map((permissionKey) => (
                                <button
                                    key={permissionKey}
                                    type="button"
                                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                                        permissions[permissionKey]
                                            ? "bg-primary text-white border-primary"
                                            : "bg-surface-100 dark:bg-surface-800 text-text-secondary border-surface-300 dark:border-surface-600"
                                    }`}
                                    onClick={() => handlePermissionToggle(permissionKey)}
                                >
                                    {permissionKey.charAt(0).toUpperCase() + permissionKey.slice(1)}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <Typography variant="subtitle1">Properties</Typography>
                            <Button onClick={addProperty} size="small" color="primary">
                                Add property
                            </Button>
                        </div>

                        <div className="flex flex-col gap-6">
                            {properties.map((property, index) => (
                                <div key={index} className="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <Typography variant="subtitle2">Field {index + 1}</Typography>
                                        {properties.length > 1 && (
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="error"
                                                onClick={() => removeProperty(index)}
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
                                        />
                                        <TextField
                                            label="Display name (optional)"
                                            value={property.name}
                                            onChange={(event) => handlePropertyChange(index, "name", event.target.value)}
                                            placeholder="Title"
                                        />
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                                                Data type
                                            </label>
                                            <select
                                                className="h-12 rounded-md border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3"
                                                value={property.dataType}
                                                onChange={(event) => handlePropertyChange(index, "dataType", event.target.value as PropertyDataType)}
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
                                    />

                                    {property.dataType === "string" && (
                                        <TextField
                                            label="Enum values (optional)"
                                            multiline
                                            minRows={2}
                                            value={property.enumValues.join("\n")}
                                            onChange={(event) => handlePropertyChange(
                                                index,
                                                "enumValues",
                                                event.target.value.split("\n").map((value) => value.trim()).filter(Boolean)
                                            )}
                                            placeholder="Add one value per line"
                                        />
                                    )}

                                    {property.dataType === "reference" && (
                                        <TextField
                                            label="Reference path"
                                            value={property.referencePath}
                                            onChange={(event) => handlePropertyChange(index, "referencePath", event.target.value)}
                                            placeholder="e.g. products"
                                            required
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
                                                        event.target.value.split("\n").map((value) => value.trim()).filter(Boolean)
                                                    )}
                                                    placeholder="Add one value per line"
                                                />
                                            )}

                                            {property.arrayOfType === "reference" && (
                                                <TextField
                                                    label="Reference path"
                                                    value={property.arrayReferencePath}
                                                    onChange={(event) => handlePropertyChange(index, "arrayReferencePath", event.target.value)}
                                                    placeholder="e.g. products"
                                                    required
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
                            onClick={() => {
                                resetForm();
                                setSuccessMessage(null);
                                setErrorMessage(null);
                            }}
                        >
                            Reset form
                        </Button>
                        <div className="flex gap-3">
                            <Button
                                variant="outlined"
                                color="neutral"
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : "Create collection"}
                            </Button>
                        </div>
                    </div>
                </form>
            </Paper>
        </div>
    );
};
