# Travel Guide CMS - API Reference

## Service Layer

### CmsCollectionService

Handles all CMS collection operations with Firebase Firestore.

#### Methods

##### `getCmsCollections()`

Retrieves all CMS collection configurations from Firestore.

```typescript
const collections = await CmsCollectionService.getCmsCollections();
```

**Returns:** `Promise<CmsCollectionConfig[]>`

##### `getCmsCollectionById(id: string)`

Retrieves a specific collection configuration by ID.

```typescript
const collection = await CmsCollectionService.getCmsCollectionById("products");
```

**Parameters:**

- `id: string` - Collection identifier

**Returns:** `Promise<CmsCollectionConfig | null>`

##### `createCmsCollection(collection: CmsCollectionConfig)`

Creates a new CMS collection configuration.

```typescript
await CmsCollectionService.createCmsCollection({
  id: 'blog_posts',
  name: 'Blog Posts',
  path: 'posts',
  properties: [...]
});
```

**Parameters:**

- `collection: CmsCollectionConfig` - Complete collection configuration

**Returns:** `Promise<void>`

##### `updateCmsCollection(collection: CmsCollectionConfig)`

Updates an existing collection configuration.

```typescript
await CmsCollectionService.updateCmsCollection(updatedCollection);
```

**Parameters:**

- `collection: CmsCollectionConfig` - Updated collection configuration

**Returns:** `Promise<void>`

##### `deleteCmsCollection(id: string)`

Deletes a collection configuration.

```typescript
await CmsCollectionService.deleteCmsCollection("old_collection");
```

**Parameters:**

- `id: string` - Collection identifier to delete

**Returns:** `Promise<void>`

##### `subscribeToCmsCollections(callback: (collections: CmsCollectionConfig[]) => void)`

Sets up real-time subscription to collection changes.

```typescript
const unsubscribe = CmsCollectionService.subscribeToCmsCollections(
  (collections) => {
    console.log("Collections updated:", collections);
  }
);

// Cleanup
unsubscribe();
```

**Parameters:**

- `callback: (collections: CmsCollectionConfig[]) => void` - Function called on updates

**Returns:** `() => void` - Unsubscribe function

### StorageService

Manages file operations with Firebase Storage.

#### Methods

##### `uploadFile(file: File, path: string, onProgress?: (progress: number) => void)`

Uploads a file to Firebase Storage.

```typescript
const downloadURL = await StorageService.uploadFile(
  file,
  "images/hero.jpg",
  (progress) => console.log(`Upload: ${progress}%`)
);
```

**Parameters:**

- `file: File` - File to upload
- `path: string` - Storage path
- `onProgress?: (progress: number) => void` - Progress callback

**Returns:** `Promise<string>` - Download URL

##### `deleteFile(path: string)`

Deletes a file from Firebase Storage.

```typescript
await StorageService.deleteFile("images/old-hero.jpg");
```

**Parameters:**

- `path: string` - Storage path to delete

**Returns:** `Promise<void>`

##### `listFiles(path: string)`

Lists files in a storage directory.

```typescript
const files = await StorageService.listFiles("images/");
```

**Parameters:**

- `path: string` - Directory path

**Returns:** `Promise<StorageFile[]>`

## Custom Hooks

### useCmsCollections

Manages CMS collection state with real-time updates.

```typescript
const { collections, loading, error } = useCmsCollections(firebaseApp, locale);
```

**Parameters:**

- `firebaseApp: FirebaseApp` - Firebase application instance
- `locale?: string` - Current locale for localization

**Returns:**

```typescript
{
  collections: EntityCollection[],
  loading: boolean,
  error: Error | null
}
```

### useCollectionForm

Handles collection form state and validation.

```typescript
const {
  formData,
  errors,
  isValid,
  isSubmitting,
  handleChange,
  handleSubmit,
  resetForm,
} = useCollectionForm(initialData, onSubmit);
```

**Parameters:**

- `initialData?: CmsCollectionConfig` - Initial form values
- `onSubmit: (data: CmsCollectionConfig) => Promise<void>` - Submit handler

**Returns:**

```typescript
{
  formData: CmsCollectionConfig,
  errors: Record<string, string>,
  isValid: boolean,
  isSubmitting: boolean,
  handleChange: (field: string, value: unknown) => void,
  handleSubmit: () => Promise<void>,
  resetForm: () => void
}
```

### useStorageBrowser

Manages file browser state and operations.

```typescript
const { files, currentPath, loading, uploadFile, deleteFile, navigateToPath } =
  useStorageBrowser(initialPath);
```

**Parameters:**

- `initialPath?: string` - Starting directory path

**Returns:**

```typescript
{
  files: StorageFile[],
  currentPath: string,
  loading: boolean,
  uploadFile: (file: File) => Promise<string>,
  deleteFile: (path: string) => Promise<void>,
  navigateToPath: (path: string) => void
}
```

## UI Components

### LoadingSpinner

Displays a loading indicator.

```typescript
<LoadingSpinner size="medium" message="Loading collections..." />
```

**Props:**

- `size?: 'small' | 'medium' | 'large'` - Spinner size
- `message?: string` - Loading message

### ErrorDisplay

Shows error messages with optional retry functionality.

```typescript
<ErrorDisplay error={error} onRetry={() => refetch()} />
```

**Props:**

- `error: Error | string` - Error to display
- `onRetry?: () => void` - Retry function

### Button

Reusable button component.

```typescript
<Button
  variant="primary"
  size="medium"
  loading={isSubmitting}
  onClick={handleClick}
>
  Save Collection
</Button>
```

**Props:**

- `variant?: 'primary' | 'secondary' | 'danger'` - Button style
- `size?: 'small' | 'medium' | 'large'` - Button size
- `loading?: boolean` - Show loading state
- `disabled?: boolean` - Disable button
- `onClick?: () => void` - Click handler
- `children: ReactNode` - Button content

### Input

Form input component with validation.

```typescript
<Input
  label="Collection Name"
  value={name}
  onChange={(value) => setName(value)}
  error={errors.name}
  required
/>
```

**Props:**

- `label: string` - Input label
- `value: string` - Input value
- `onChange: (value: string) => void` - Change handler
- `error?: string` - Validation error
- `required?: boolean` - Required field indicator
- `type?: string` - Input type
- `placeholder?: string` - Placeholder text

## Error Boundaries

### ErrorBoundary

Catches JavaScript errors in component tree.

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

**Props:**

- `children: ReactNode` - Components to wrap
- `fallback: ReactNode` - Error fallback UI

### AsyncErrorBoundary

Handles async errors and Promise rejections.

```typescript
<AsyncErrorBoundary>
  <AsyncComponent />
</AsyncErrorBoundary>
```

## Utilities

### Validation

Form validation helpers.

#### `validateCollectionConfig(config: CmsCollectionConfig)`

Validates a complete collection configuration.

```typescript
const errors = validateCollectionConfig(config);
```

**Returns:** `Record<string, string>` - Validation errors

#### `validatePropertyConfig(property: CmsPropertyConfig)`

Validates a single property configuration.

```typescript
const errors = validatePropertyConfig(property);
```

**Returns:** `Record<string, string>` - Validation errors

### Storage Utilities

File processing and validation.

#### `validateFileType(file: File, allowedTypes: string[])`

Validates file type against allowed types.

```typescript
const isValid = validateFileType(file, ["image/jpeg", "image/png"]);
```

**Returns:** `boolean`

#### `formatFileSize(bytes: number)`

Formats file size for display.

```typescript
const formatted = formatFileSize(1024000); // "1.0 MB"
```

**Returns:** `string`

## Type Definitions

### CmsCollectionConfig

Complete collection configuration interface.

### CmsPropertyConfig

Individual property configuration interface.

### CmsCollectionPermissions

Permission settings for collections.

### StorageFile

File metadata from Firebase Storage.

For detailed type definitions, see `/src/types/` directory.
