# CMS Collections Documentation

## Overview

The CMS Collections module provides a dynamic collection management system for FireCMS, allowing runtime creation and configuration of Firestore collections with full localization support.

## Table of Contents

- [Architecture](#architecture)
- [Types](#types)
- [Functions](#functions)
- [Usage Examples](#usage-examples)
- [Localization](#localization)
- [Best Practices](#best-practices)

## Architecture

```
CmsCollections.tsx
├── Types & Interfaces
├── Utility Functions
├── Property Builders
├── Collection Transformation
└── React Hook (useCmsCollections)
```

## Types

### Core Types

#### `CmsCollectionPermissions`

Defines access control for collections.

```typescript
type CmsCollectionPermissions = {
  read?: boolean; // View collection data
  create?: boolean; // Create new entities
  edit?: boolean; // Modify existing entities
  delete?: boolean; // Remove entities
};
```

#### `CmsStorageConfig`

Configuration for file storage integration.

```typescript
type CmsStorageConfig = {
  storagePath?: string; // Firebase Storage path
  acceptedFiles?: string[]; // Allowed file types
  maxSize?: number; // Max file size in MB
};
```

#### `CmsPropertyConfig`

Configuration for individual collection properties.

```typescript
type CmsPropertyConfig = {
  key?: string; // Property identifier
  name?: string; // Display name
  description?: string; // Field description
  dataType?: string; // Data type (string, number, etc.)
  required?: boolean; // Validation requirement
  enumValues?: Record<string, string>; // Dropdown options
  path?: string; // Reference collection path
  of?: CmsArrayPropertyConfig; // Array item configuration
  storage?: CmsStorageConfig; // File storage settings
  defaultValue?: string; // Default field value
  localized?: boolean; // Enable localization
  multiline?: boolean; // Multi-line text input
  markdown?: boolean; // Markdown editor
  autoValue?: "on_create" | "on_update" | "on_create_update";
};
```

#### `CmsCollectionConfig`

Complete collection configuration.

```typescript
type CmsCollectionConfig = {
  id?: string; // Collection identifier
  name?: string; // Collection display name
  description?: string; // Collection description
  path?: string; // Firestore collection path
  group?: string; // Organization group
  icon?: string; // Display icon
  permissions?: CmsCollectionPermissions;
  properties?: CmsPropertyConfig[];
  localizations?: Record<string, CmsCollectionLocalization>;
};
```

## Functions

### Utility Functions

#### `isNonEmptyString(value: unknown): value is string`

Type guard to check for non-empty strings.

```typescript
// Returns true if value is a string with content
const isValid = isNonEmptyString("hello"); // true
const isEmpty = isNonEmptyString(""); // false
const isNull = isNonEmptyString(null); // false
```

#### `normalizePermissions(permissions?: CmsCollectionPermissions)`

Ensures all permission fields have default values.

```typescript
const normalized = normalizePermissions({ read: true });
// Returns: { read: true, create: true, edit: true, delete: true }
```

### Property Builders

#### `buildArrayProperty(config?: CmsArrayPropertyConfig): PropertyArrayConfig | undefined`

Constructs array property configurations for FireCMS.

**Supported Array Types:**

- String arrays with enum values
- Reference arrays with collection paths
- String arrays with file storage
- Date/DateTime arrays

```typescript
// String array with enum
const stringArray = buildArrayProperty({
  dataType: "string",
  enumValues: { option1: "Option 1", option2: "Option 2" },
});

// Reference array
const referenceArray = buildArrayProperty({
  dataType: "reference",
  path: "users",
});
```

#### `buildProperty(config?: CmsPropertyConfig): DynamicProperty | undefined`

Main property builder that handles all data types and configurations.

**Supported Data Types:**

- `string` - Text fields with optional multiline/markdown
- `number` - Numeric fields
- `boolean` - Checkbox/toggle fields
- `date` - Date picker
- `date_time` - Date and time picker
- `reference` - Reference to other collections
- `array` - Arrays of other types
- `map` (generated for localized content)

**Special Features:**

- **Localization**: Automatically creates map structures for multi-language content
- **Storage Integration**: File upload capabilities
- **Validation**: Required field validation
- **Auto Values**: Automatic timestamp generation

#### `applyStringOptions(target: DynamicProperty)`

Internal function that applies string-specific configurations.

**Applied Options:**

- Enum values for dropdown selection
- Storage configuration for file uploads
- Multiline text areas
- Markdown editor integration

### Collection Transformation

#### `snapshotToEntityCollection(snapshot: QueryDocumentSnapshot<DocumentData>, locale?: string): EntityCollection | undefined`

Converts Firestore documents to FireCMS EntityCollection format.

**Process:**

1. Validates required fields (id, path, name)
2. Builds properties using `buildProperty()`
3. Normalizes permissions
4. Applies localization based on active locale
5. Returns FireCMS-compatible collection configuration

## Usage Examples

### Basic Collection Creation

```typescript
const basicCollection: CmsCollectionConfig = {
  id: "blog_posts",
  name: "Blog Posts",
  path: "posts",
  group: "Content",
  properties: [
    {
      key: "title",
      name: "Post Title",
      dataType: "string",
      required: true,
    },
    {
      key: "content",
      name: "Content",
      dataType: "string",
      multiline: true,
      markdown: true,
    },
    {
      key: "publishedAt",
      name: "Published Date",
      dataType: "date_time",
      autoValue: "on_create",
    },
  ],
};
```

### Localized Collection

```typescript
const localizedCollection: CmsCollectionConfig = {
  id: "products",
  name: "Products",
  path: "products",
  properties: [
    {
      key: "name",
      name: "Product Name",
      dataType: "string",
      required: true,
      localized: true, // Creates map with locale-specific values
    },
    {
      key: "description",
      name: "Description",
      dataType: "string",
      multiline: true,
      localized: true,
    },
  ],
  localizations: {
    es: {
      name: "Productos",
      description: "Gestión de productos",
      group: "Contenido",
    },
  },
};
```

### File Storage Integration

```typescript
const mediaCollection: CmsCollectionConfig = {
  id: "gallery",
  name: "Gallery",
  path: "gallery",
  properties: [
    {
      key: "image",
      name: "Image",
      dataType: "string",
      storage: {
        storagePath: "gallery",
        acceptedFiles: ["image/*"],
        maxSize: 5,
      },
    },
    {
      key: "thumbnails",
      name: "Thumbnails",
      dataType: "array",
      of: {
        dataType: "string",
        storage: {
          storagePath: "gallery/thumbs",
          acceptedFiles: ["image/*"],
          maxSize: 1,
        },
      },
    },
  ],
};
```

### Using the Hook

```typescript
import { useCmsCollections } from "./collections/CmsCollections";

function CollectionManager() {
  const { collections, loading, error } = useCmsCollections(firebaseApp, "en");

  if (loading) return <div>Loading collections...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {collections.map((collection) => (
        <div key={collection.id}>
          <h3>{collection.name}</h3>
          <p>{collection.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Localization

### How Localization Works

1. **Property Level**: When `localized: true` is set on a string property, it becomes a map with locale-specific values:

   ```typescript
   // Input: { localized: true, dataType: "string" }
   // Output: Map structure
   {
       dataType: "map",
       properties: {
           en: { dataType: "string" },
           es: { dataType: "string" },
           fr: { dataType: "string" }
       }
   }
   ```

2. **Collection Level**: Collection metadata can be translated:

   ```typescript
   localizations: {
       es: { name: "Artículos", group: "Contenido" },
       fr: { name: "Articles", group: "Contenu" }
   }
   ```

3. **Runtime Locale**: The `useCmsCollections` hook accepts a locale parameter to return localized collection names and descriptions.

### Supported Locales

Locales are defined in `/src/localization/index.ts`:

```typescript
export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];
```

## Best Practices

### Property Configuration

1. **Use Descriptive Keys**: Property keys should be clear and follow naming conventions

   ```typescript
   // Good
   { key: "publishedAt", name: "Published Date" }

   // Avoid
   { key: "pa", name: "Date" }
   ```

2. **Validation Strategy**: Set required fields appropriately

   ```typescript
   {
       key: "email",
       dataType: "string",
       required: true,
       validation: { email: true }  // Additional validation
   }
   ```

3. **Storage Organization**: Use logical storage paths
   ```typescript
   {
       storage: {
           storagePath: "content/images/heroes",  // Organized structure
           acceptedFiles: ["image/jpeg", "image/png"],
           maxSize: 2
       }
   }
   ```

### Performance Considerations

1. **Property Limits**: Keep property count reasonable (< 50 per collection)
2. **Enum Size**: Limit enum options to prevent UI issues
3. **Storage Paths**: Use efficient folder structures
4. **Localization**: Only localize content that needs translation

### Error Handling

The module includes comprehensive error handling:

- Invalid configurations return `undefined`
- Firestore errors are caught and exposed via the hook
- Type validation prevents runtime errors

### Security

- **Permissions**: Always configure appropriate permissions
- **Validation**: Use required fields and validation rules
- **Storage**: Restrict file types and sizes
- **Paths**: Validate Firestore collection paths

## Constants Used

The module uses centralized constants from `/src/constants/`:

- `CMS_COLLECTIONS_PATH`: Firestore collection path
- `DEFAULT_CMS_COLLECTION_PERMISSIONS`: Default permission settings
- Data type constants (`STRING_DATA_TYPE`, `DATE_DATA_TYPE`, etc.)
- UI property constants (`PROPERTY_EXPANDED`, `PROPERTY_MULTILINE`, etc.)

This approach ensures consistency and makes the code maintainable.
