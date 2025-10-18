import React from "react";
import { FirebaseApp } from "firebase/app";
import { useCollectionForm } from "../hooks/useCollectionForm";
import {
    ErrorBoundary,
    AsyncBoundary,
    FormSection,
    Input,
    Textarea,
    Select,
    Checkbox,
    Button,
    SelectOption
} from "../ui";
import {
    LABEL_COLLECTION_ID,
    LABEL_DISPLAY_NAME,
    LABEL_FIRESTORE_PATH,
    LABEL_GROUP_OPTIONAL,
    LABEL_DESCRIPTION_OPTIONAL,
    BUTTON_TEXT_SAVE_CHANGES,
    BUTTON_TEXT_CREATE_COLLECTION,
    BUTTON_TEXT_RESET_FORM,
    BUTTON_TEXT_ADD_PROPERTY,
    STRING_DATA_TYPE,
    NUMBER_DATA_TYPE,
    BOOLEAN_DATA_TYPE,
    DATE_DATA_TYPE,
    REFERENCE_DATA_TYPE,
    ARRAY_DATA_TYPE
} from "../constants";

export interface CollectionFormViewProps {
    firebaseApp: FirebaseApp;
    collectionId?: string;
    onSaveSuccess?: (collectionId: string) => void;
    onCancel?: () => void;
    className?: string;
}

const DATA_TYPE_OPTIONS: SelectOption[] = [
    { value: STRING_DATA_TYPE, label: "String" },
    { value: NUMBER_DATA_TYPE, label: "Number" },
    { value: BOOLEAN_DATA_TYPE, label: "Boolean" },
    { value: DATE_DATA_TYPE, label: "Date" },
    { value: REFERENCE_DATA_TYPE, label: "Reference" },
    { value: ARRAY_DATA_TYPE, label: "Array" }
];

/**
 * View component for Collection Form - handles presentation only
 */
export const CollectionFormView: React.FC<CollectionFormViewProps> = ({
    firebaseApp,
    collectionId,
    onSaveSuccess,
    onCancel,
    className = ""
}) => {
    const {
        formState,
        isDirty,
        isSubmitting,
        loadingExisting,
        successMessage,
        errorMessage,
        updateFormState,
        updateProperty,
        addProperty,
        removeProperty,
        resetForm,
        loadCollection,
        saveCollection,
        togglePermission
    } = useCollectionForm(firebaseApp);

    // Load existing collection on mount
    React.useEffect(() => {
        if (collectionId) {
            loadCollection(collectionId);
        }
    }, [collectionId, loadCollection]);

    // Handle save success callback
    React.useEffect(() => {
        if (successMessage && onSaveSuccess) {
            onSaveSuccess(formState.collectionId);
        }
    }, [successMessage, onSaveSuccess, formState.collectionId]);

    const handleSave = async () => {
        await saveCollection();
    };

    const isEditMode = Boolean(collectionId);

    return (
        <ErrorBoundary>
            <div className={`max-w-4xl mx-auto space-y-8 ${className}`}>
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            {isEditMode ? "Edit Collection" : "Create New Collection"}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            {isEditMode
                                ? "Modify the collection configuration below."
                                : "Configure your new collection properties and settings."
                            }
                        </p>
                    </div>

                    <AsyncBoundary
                        loading={loadingExisting}
                        loadingMessage="Loading collection..."
                    >
                        <div className="p-6 space-y-8">
                            {/* Basic Information */}
                            <FormSection
                                title="Basic Information"
                                description="Configure the basic properties of your collection."
                                error={errorMessage}
                                success={successMessage}
                            >
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <Input
                                        label={LABEL_COLLECTION_ID}
                                        value={formState.collectionId}
                                        onChange={(e) => updateFormState({ collectionId: e.target.value })}
                                        placeholder="users"
                                        required
                                        fullWidth
                                    />

                                    <Input
                                        label={LABEL_DISPLAY_NAME}
                                        value={formState.name}
                                        onChange={(e) => updateFormState({ name: e.target.value })}
                                        placeholder="Users"
                                        required
                                        fullWidth
                                    />

                                    <Input
                                        label={LABEL_FIRESTORE_PATH}
                                        value={formState.path}
                                        onChange={(e) => updateFormState({ path: e.target.value })}
                                        placeholder="users"
                                        required
                                        fullWidth
                                    />

                                    <Input
                                        label={LABEL_GROUP_OPTIONAL}
                                        value={formState.group}
                                        onChange={(e) => updateFormState({ group: e.target.value })}
                                        placeholder="Content"
                                        fullWidth
                                    />
                                </div>

                                <Textarea
                                    label={LABEL_DESCRIPTION_OPTIONAL}
                                    value={formState.description}
                                    onChange={(e) => updateFormState({ description: e.target.value })}
                                    placeholder="Describe what this collection is used for..."
                                    rows={3}
                                    fullWidth
                                />
                            </FormSection>

                            {/* Permissions */}
                            <FormSection
                                title="Permissions"
                                description="Control who can perform actions on this collection."
                            >
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    <Checkbox
                                        label="Read"
                                        checked={formState.permissions.read}
                                        onChange={() => togglePermission("read")}
                                    />
                                    <Checkbox
                                        label="Create"
                                        checked={formState.permissions.create}
                                        onChange={() => togglePermission("create")}
                                    />
                                    <Checkbox
                                        label="Edit"
                                        checked={formState.permissions.edit}
                                        onChange={() => togglePermission("edit")}
                                    />
                                    <Checkbox
                                        label="Delete"
                                        checked={formState.permissions.delete}
                                        onChange={() => togglePermission("delete")}
                                    />
                                </div>
                            </FormSection>

                            {/* Properties */}
                            <FormSection
                                title="Properties"
                                description="Define the fields that will be available in this collection."
                            >
                                <div className="space-y-4">
                                    {formState.properties.map((property, index) => (
                                        <PropertyField
                                            key={property.id}
                                            property={property}
                                            index={index}
                                            onUpdate={(idx, key, value) => updateProperty(idx, key as any, value)}
                                            onRemove={removeProperty}
                                            canRemove={formState.properties.length > 1}
                                        />
                                    ))}

                                    <Button
                                        variant="secondary"
                                        onClick={addProperty}
                                        className="w-full"
                                    >
                                        {BUTTON_TEXT_ADD_PROPERTY}
                                    </Button>
                                </div>
                            </FormSection>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                                <div className="flex space-x-3">
                                    <Button
                                        variant="primary"
                                        onClick={handleSave}
                                        loading={isSubmitting}
                                        disabled={!isDirty}
                                    >
                                        {isEditMode ? BUTTON_TEXT_SAVE_CHANGES : BUTTON_TEXT_CREATE_COLLECTION}
                                    </Button>

                                    {isDirty && (
                                        <Button
                                            variant="secondary"
                                            onClick={resetForm}
                                            disabled={isSubmitting}
                                        >
                                            {BUTTON_TEXT_RESET_FORM}
                                        </Button>
                                    )}
                                </div>

                                {onCancel && (
                                    <Button
                                        variant="ghost"
                                        onClick={onCancel}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </AsyncBoundary>
                </div>
            </div>
        </ErrorBoundary>
    );
};

interface PropertyFieldProps {
    property: any; // PropertyFormData type
    index: number;
    onUpdate: <K extends keyof any>(index: number, key: K, value: any) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
}

const PropertyField: React.FC<PropertyFieldProps> = ({
    property,
    index,
    onUpdate,
    onRemove,
    canRemove
}) => {
    return (
        <div className="p-4 border border-gray-200 rounded-lg space-y-4">
            <div className="flex items-start justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                    Property {index + 1}
                </h4>
                {canRemove && (
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onRemove(index)}
                    >
                        Remove
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Field Key"
                    value={property.key}
                    onChange={(e) => onUpdate(index, "key", e.target.value)}
                    placeholder="field_name"
                    required
                    fullWidth
                />

                <Input
                    label="Display Name"
                    value={property.name}
                    onChange={(e) => onUpdate(index, "name", e.target.value)}
                    placeholder="Field Name"
                    fullWidth
                />

                <Select
                    label="Data Type"
                    value={property.dataType}
                    onChange={(e) => onUpdate(index, "dataType", e.target.value)}
                    options={DATA_TYPE_OPTIONS}
                    required
                    fullWidth
                />

                <div className="flex items-center space-x-4 pt-6">
                    <Checkbox
                        label="Required"
                        checked={property.required}
                        onChange={(e) => onUpdate(index, "required", e.target.checked)}
                    />
                </div>
            </div>

            <Textarea
                label="Description"
                value={property.description}
                onChange={(e) => onUpdate(index, "description", e.target.value)}
                placeholder="Describe this field..."
                rows={2}
                fullWidth
            />
        </div>
    );
};