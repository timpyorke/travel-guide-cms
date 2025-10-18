import {
    VALIDATION_COLLECTION_ID_REQUIRED,
    VALIDATION_COLLECTION_ID_FORMAT,
    VALIDATION_COLLECTION_NAME_REQUIRED,
    VALIDATION_FIRESTORE_PATH_REQUIRED,
    VALIDATION_ONE_PROPERTY_REQUIRED,
    VALIDATION_PROPERTY_KEY_REQUIRED,
    VALIDATION_REFERENCE_PATH_REQUIRED,
    VALIDATION_ARRAY_REFERENCE_PATH_REQUIRED,
    VALIDATION_STORAGE_FOLDER_REQUIRED,
    VALIDATION_INVALID_FILE_SIZE,
    VALIDATION_FOLDER_NAME_REQUIRED,
    VALIDATION_FOLDER_NAME_NO_SLASH,
    VALIDATION_FOLDER_NAME_LETTERS_NUMBERS,
    COLLECTION_ID_REGEX,
    ZERO_LENGTH
} from "../constants";
import type { CollectionFormData, PropertyFormData } from "../types";

/**
 * Validation utilities for CMS collection forms
 */
export class FormValidator {
    /**
     * Validate collection form data
     */
    static validateCollectionForm(state: CollectionFormData): string | null {
        if (!state.collectionId) {
            return VALIDATION_COLLECTION_ID_REQUIRED;
        }

        if (!COLLECTION_ID_REGEX.test(state.collectionId)) {
            return VALIDATION_COLLECTION_ID_FORMAT;
        }

        if (!state.name) {
            return VALIDATION_COLLECTION_NAME_REQUIRED;
        }

        if (!state.path) {
            return VALIDATION_FIRESTORE_PATH_REQUIRED;
        }

        if (!state.properties.length) {
            return VALIDATION_ONE_PROPERTY_REQUIRED;
        }

        for (const property of state.properties) {
            const propertyError = this.validateProperty(property);
            if (propertyError) {
                return propertyError;
            }
        }

        return null;
    }

    /**
     * Validate individual property
     */
    static validateProperty(property: PropertyFormData): string | null {
        if (!property.key) {
            return VALIDATION_PROPERTY_KEY_REQUIRED;
        }

        if (property.dataType === "reference" && !property.referencePath) {
            return `Property "${property.key}" ${VALIDATION_REFERENCE_PATH_REQUIRED}`;
        }

        if (property.dataType === "array") {
            if (property.arrayOfType === "reference" && !property.arrayReferencePath) {
                return `Array property "${property.key}" ${VALIDATION_ARRAY_REFERENCE_PATH_REQUIRED}`;
            }
        }

        if (property.dataType === "string" && property.storageEnabled && !property.storagePath) {
            return `Property "${property.key || "unnamed"}" ${VALIDATION_STORAGE_FOLDER_REQUIRED}`;
        }

        if (property.dataType === "string" && property.storageEnabled && property.storageMaxSize) {
            const numericSize = Number(property.storageMaxSize);
            if (Number.isNaN(numericSize) || numericSize < 0) {
                return `Property "${property.key || "unnamed"}" ${VALIDATION_INVALID_FILE_SIZE}`;
            }
        }

        return null;
    }

    /**
     * Validate folder name
     */
    static validateFolderName(name: string): string | null {
        const trimmedName = name.trim();

        if (!trimmedName) {
            return VALIDATION_FOLDER_NAME_REQUIRED;
        }

        if (trimmedName.includes("/")) {
            return VALIDATION_FOLDER_NAME_NO_SLASH;
        }

        const sanitized = trimmedName.replace(/(^[\\.]+)|[^a-zA-Z0-9-_]/g, "_");
        if (!sanitized) {
            return VALIDATION_FOLDER_NAME_LETTERS_NUMBERS;
        }

        return null;
    }
}

/**
 * Utility functions for form data transformation
 */
export class FormUtils {
    /**
     * Check if array has items
     */
    static hasItems<T>(array: T[]): boolean {
        return array.length > ZERO_LENGTH;
    }

    /**
     * Check if string is non-empty after trimming
     */
    static isNonEmptyString(value: unknown): value is string {
        return typeof value === "string" && value.trim().length > ZERO_LENGTH;
    }

    /**
     * Convert enum values list to object
     */
    static listToEnumValues(values: string[]): Record<string, string> | undefined {
        const trimmedValues = values.map((value) => value.trim()).filter((value) => !!value);
        if (!trimmedValues.length) return undefined;

        return trimmedValues.reduce((acc, current) => {
            acc[current] = current;
            return acc;
        }, {} as Record<string, string>);
    }

    /**
     * Convert enum values object to list
     */
    static enumValuesToList(enumValues?: Record<string, string>): string[] {
        return enumValues ? Object.keys(enumValues) : [];
    }

    /**
     * Sanitize form state by trimming all string values
     */
    static sanitizeCollectionForm(state: CollectionFormData): CollectionFormData {
        return {
            ...state,
            collectionId: state.collectionId.trim(),
            name: state.name.trim(),
            path: state.path.trim(),
            group: state.group.trim(),
            icon: state.icon.trim(),
            description: state.description.trim(),
            permissions: { ...state.permissions },
            properties: state.properties.map((property) => this.sanitizeProperty(property)),
            localizations: Object.entries(state.localizations).reduce((acc, [locale, values]) => {
                acc[locale] = {
                    name: values.name.trim(),
                    description: values.description.trim(),
                    group: values.group.trim()
                };
                return acc;
            }, {} as Record<string, any>)
        };
    }

    /**
     * Sanitize individual property
     */
    static sanitizeProperty(property: PropertyFormData): PropertyFormData {
        return {
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
        };
    }
}