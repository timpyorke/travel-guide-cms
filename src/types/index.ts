// Core Firebase Types
export interface FirebaseError {
    code: string;
    message: string;
    name: string;
}

// Property Configuration Types
export interface PropertyBase {
    dataType: string;
    name?: string;
    description?: string;
    required?: boolean;
}

export interface StringProperty extends PropertyBase {
    dataType: 'string';
    enumValues?: Record<string, string>;
    multiline?: boolean;
    markdown?: boolean;
    defaultValue?: string;
    storage?: StorageConfig;
}

export interface NumberProperty extends PropertyBase {
    dataType: 'number';
    min?: number;
    max?: number;
    defaultValue?: number;
}

export interface BooleanProperty extends PropertyBase {
    dataType: 'boolean';
    defaultValue?: boolean;
}

export interface DateProperty extends PropertyBase {
    dataType: 'date';
    mode: 'date' | 'date_time';
    autoValue?: 'on_create' | 'on_update' | 'on_create_update';
}

export interface ReferenceProperty extends PropertyBase {
    dataType: 'reference';
    path: string;
}

export interface ArrayProperty extends PropertyBase {
    dataType: 'array';
    of: StringProperty | ReferenceProperty;
}

export interface MapProperty extends PropertyBase {
    dataType: 'map';
    expanded?: boolean;
    properties: Record<string, PropertyDefinition>;
}

export type PropertyDefinition =
    | StringProperty
    | NumberProperty
    | BooleanProperty
    | DateProperty
    | ReferenceProperty
    | ArrayProperty
    | MapProperty;

// Dynamic property builder type for CMS property construction
export interface DynamicProperty {
    dataType: string;
    name?: string;
    description?: string;
    required?: boolean;
    validation?: { required: boolean };
    enumValues?: Record<string, string>;
    mode?: 'date' | 'date_time';
    autoValue?: 'on_create' | 'on_update' | 'on_create_update';
    path?: string;
    of?: PropertyArrayConfig;
    defaultValue?: string;
    multiline?: boolean;
    markdown?: boolean;
    storage?: StorageConfig;
    expanded?: boolean;
    properties?: Record<string, DynamicProperty>;
}

// Storage Configuration
export interface StorageConfig {
    storagePath: string;
    acceptedFiles?: string[];
    maxSize?: number;
}

// CMS Collection Types
export interface CmsCollectionData {
    id: string;
    name: string;
    description?: string;
    path: string;
    group?: string;
    icon?: string;
    permissions: CmsCollectionPermissions;
    properties: Record<string, PropertyDefinition>;
    localizations?: Record<string, CmsCollectionLocalization>;
}

export interface CmsCollectionPermissions {
    read: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export interface CmsCollectionLocalization {
    name?: string;
    description?: string;
    group?: string;
}

// Form State Types
export interface PropertyFormData {
    id: string;
    key: string;
    name: string;
    description: string;
    dataType: string;
    required: boolean;
    enumValues: string[];
    referencePath: string;
    arrayOfType: string;
    arrayEnumValues: string[];
    arrayReferencePath: string;
    storageEnabled: boolean;
    storagePath: string;
    storageAcceptedFiles: string;
    storageMaxSize: string;
    defaultValue: string;
    localized: boolean;
    multiline: boolean;
    markdown: boolean;
    autoValue?: 'on_create' | 'on_update' | 'on_create_update';
}

export interface LocalizationFormData {
    name: string;
    description: string;
    group: string;
}

export interface CollectionFormData {
    collectionId: string;
    name: string;
    path: string;
    group: string;
    icon: string;
    description: string;
    permissions: CmsCollectionPermissions;
    properties: PropertyFormData[];
    localizations: Record<string, LocalizationFormData>;
}

// Storage Browser Types
export interface StorageBrowserItem {
    name: string;
    fullPath: string;
    isFolder: boolean;
    size?: number;
    updated?: Date;
}

export type SelectionMode = 'file' | 'folder';

export interface StoragePickerState {
    propertyIndex: number;
    target: 'storagePath' | 'defaultValue';
    selectionMode: SelectionMode;
    initialPath?: string;
}

// Global Types
export interface GlobalThis {
    crypto?: {
        randomUUID?: () => string;
    };
}

// Error Types
export interface ErrorWithMessage {
    message?: string;
}

export interface UnknownError extends Error {
    code?: string;
}

// Upload Progress Types
export interface UploadSnapshot {
    bytesTransferred: number;
    totalBytes: number;
}

// Firebase Metadata Types
export interface FirebaseStorageMetadata {
    size: number;
    updated?: string;
    name: string;
    fullPath: string;
}

// Customization Controller Type (for FireCMS)
export interface CustomizationController {
    locale?: string;
}

// Property Payload Types
export interface PropertyPayload {
    key: string;
    dataType: string;
    name?: string;
    description?: string;
    required?: boolean;
    enumValues?: Record<string, string>;
    path?: string;
    of?: PropertyArrayConfig;
    storage?: StorageConfig;
    autoValue?: 'on_create' | 'on_update' | 'on_create_update';
    defaultValue?: string;
    localized?: boolean;
    multiline?: boolean;
    markdown?: boolean;
}

export interface PropertyArrayConfig {
    dataType: string;
    enumValues?: Record<string, string>;
    path?: string;
    mode?: 'date' | 'date_time';
    storage?: StorageConfig;
}

// Collection Payload Types
export interface CollectionPayload {
    id: string;
    name: string;
    description?: string;
    path: string;
    group?: string;
    icon?: string;
    permissions: CmsCollectionPermissions;
    properties: PropertyPayload[];
    localizations?: Record<string, Record<string, string>>;
}