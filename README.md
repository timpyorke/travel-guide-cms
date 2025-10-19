# Travel Guide CMS

A modern, scalable content management system built with React, TypeScript, and FireCMS. Features dynamic collection management, multi-language support, and a clean architecture for maintaining travel content, marketing materials, and product catalogs.

## ✨ Key Features

- **🔥 Dynamic Collections**: Create and configure CMS collections at runtime through the admin interface
- **🌍 Multi-language Support**: Built-in localization system with support for English, Spanish, and French
- **🏗️ Clean Architecture**: Service layer, custom hooks, and reusable UI components for maintainable code
- **⚡ Real-time Updates**: Live data synchronization with Firebase Firestore
- **📁 File Management**: Integrated Firebase Storage with drag-and-drop file uploads
- **🔐 Flexible Permissions**: Granular access control per collection and operation
- **🎨 Modern UI**: Built with FireCMS 3 and TailwindCSS for a responsive, accessible interface
- **🛡️ Type Safety**: Comprehensive TypeScript coverage with 94.7% reduction in any types

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite 7
- **CMS Framework**: FireCMS 3 (beta)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: TailwindCSS + PostCSS
- **Development**: ESLint + Modern build tooling

## Prerequisites

- Node.js 18 or later
- npm 9+ or Yarn 1.22+
- Firebase CLI (`npm install -g firebase-tools`) for deployment
- A Firebase project with Firestore, Storage, and Authentication enabled

## 🚀 Quick Start

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd travel-guide-cms
npm install
# or
yarn install
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable the following services:
   - **Authentication** (Google and/or Email/Password providers)
   - **Firestore Database** (start in test mode, configure rules later)
   - **Storage** (start in test mode, configure rules later)
3. Get your Firebase configuration from Project Settings → Web apps
4. Copy your configuration to `src/firebase_config.ts`:
   ```typescript
   export const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id",
   };
   ```

### 3. Development Server

Start the development server (configured to run on port 3000):

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`. If port 3000 is unavailable, Vite will automatically find the next available port.

### 4. Authentication

- Navigate to the login page
- Authenticate with an approved user account
- The `myAuthenticator` function in `src/App.tsx` can be customized for additional access restrictions

## 📁 Project Architecture

```
src/
├── services/              # Data access layer
│   ├── CmsCollectionService.ts    # Collection CRUD operations
│   └── StorageService.ts          # File upload/management
├── hooks/                 # Business logic layer
│   ├── useCmsCollections.ts       # Collection state management
│   ├── useStorageBrowser.ts       # File browser functionality
│   └── useCollectionForm.ts       # Form validation & submission
├── ui/                    # Reusable UI components
│   ├── components/                # Base components (Button, Input, etc.)
│   └── boundaries/                # Error boundaries
├── views/                 # Page-level components
│   ├── CmsCollectionForm.tsx      # Collection configuration form
│   └── StorageBrowser.tsx         # File management interface
├── utils/                 # Utility functions
│   ├── validation.ts              # Form validation helpers
│   └── storage.ts                 # File processing utilities
├── constants/             # Centralized constants
│   ├── labels.ts                  # UI text constants
│   ├── dataTypes.ts               # CMS data type definitions
│   └── properties.ts              # Property configuration constants
├── collections/           # Static collection definitions
│   ├── demo.tsx                   # Example collection showcase
│   ├── products.tsx               # Product catalog
│   └── CmsCollections.tsx         # Dynamic collection system
├── localization/          # Multi-language support
│   └── index.ts                   # Supported locales configuration
├── types/                 # TypeScript type definitions
├── App.tsx                # Application root & FireCMS setup
├── firebase_config.ts     # Firebase project configuration
└── main.tsx               # React application entry point
```

### Architecture Principles

- **Separation of Concerns**: Clear boundaries between data access (services), business logic (hooks), and presentation (UI/views)
- **Centralized Constants**: All strings, configuration values, and magic numbers are centralized for consistency
- **Type Safety**: Comprehensive TypeScript coverage with strict typing and minimal use of `any`
- **Error Boundaries**: Graceful error handling at component and application levels
- **Async State Management**: Proper loading states, error handling, and real-time data synchronization

## 📜 Available Scripts

| Command           | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `npm run dev`     | Start development server on port 3000 (with automatic fallback) |
| `npm run build`   | Build production bundle with TypeScript type checking           |
| `npm run preview` | Build and serve production bundle locally for testing           |
| `npm run deploy`  | Build and deploy to Firebase Hosting                            |
| `npm run lint`    | Run ESLint code quality checks                                  |

## 🔧 Firebase Configuration

### Security Rules

Configure Firestore and Storage security rules based on your requirements:

**Firestore Rules Example:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write CMS collections
    match /cms_collections/{document} {
      allow read, write: if request.auth != null;
    }

    // Custom rules for your content collections
    match /{collection}/{document} {
      allow read: if resource.data.published == true || request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**Storage Rules Example:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

### Authentication Configuration

- **Providers**: Configure in `src/App.tsx:51` via `signInOptions`
- **Custom Authentication**: Modify `myAuthenticator` in `src/App.tsx:22` for domain restrictions or role-based access
- **Firebase Console**: Enable desired authentication methods in Firebase Console → Authentication → Sign-in method

## 🎛️ Collection Management

### Static Collections

Predefined collections are located in `src/collections/`:

- **Demo (`demo.tsx`)**: Showcases all FireCMS field types and validation options
- **Products (`products.tsx`)**: E-commerce product catalog with rich metadata
- **CmsCollections (`CmsCollections.tsx`)**: Meta-collection for managing dynamic collections

### Dynamic Collections

Create collections at runtime through the CMS interface:

1. Navigate to "CMS Collections" in the admin panel
2. Click "Add New Collection"
3. Configure collection properties:
   - **Basic Info**: ID, name, description, Firestore path
   - **Organization**: Group and icon for navigation
   - **Permissions**: Read, create, edit, delete access
   - **Properties**: Field definitions with data types and validation

**Supported Property Types:**

- **Text**: Single-line and multi-line strings with optional markdown
- **Numbers**: Integer and decimal validation
- **Booleans**: Checkbox toggles
- **Dates**: Date and datetime pickers
- **Files**: Firebase Storage integration with type/size restrictions
- **References**: Links to other Firestore collections
- **Arrays**: Lists of strings, numbers, or references
- **Enums**: Dropdown selections with predefined values

### Localization System

Enable multi-language content with the localization system:

1. **Supported Locales**: English (en), Spanish (es), French (fr)
2. **Property Localization**: Check "Localized" option for any string field
3. **Collection Localization**: Translate collection names and descriptions
4. **Runtime Locale**: Collections adapt based on user's language preference

**Example Localized Property:**

```typescript
{
  key: "title",
  name: "Title",
  dataType: "string",
  localized: true  // Creates separate fields for each language
}
```

## 🔐 Authentication and Authorization

### User Authentication

- **Firebase Auth**: Handles user sign-in and session management
- **Supported Providers**: Google OAuth, Email/Password (configurable)
- **Custom Authenticator**: Additional validation logic in `myAuthenticator` function

### Permission System

Configure granular permissions for each collection:

```typescript
permissions: {
  read: true,     // View collection data
  create: true,   // Add new entities
  edit: true,     // Modify existing entities
  delete: false   // Remove entities (often restricted)
}
```

### Access Control Strategies

- **Domain Restrictions**: Limit access by email domain
- **Role-Based Access**: Use Firebase custom claims
- **Collection-Level**: Different permissions per collection
- **Operation-Level**: Granular control over CRUD operations

## 🚀 Deployment

### Prerequisites

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Set target project in `.firebaserc` or use `--project <project-id>`

### Deploy to Firebase Hosting

```bash
# Build and deploy in one command
npm run deploy

# Manual deployment
npm run build
firebase deploy --only hosting
```

### Environment Configuration

For production deployments:

1. Update Firebase security rules for production
2. Configure environment-specific settings
3. Set up custom domains if needed
4. Configure Firebase performance monitoring

## 🛠️ Development Guidelines

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency rules
- **Constants**: Centralized in `/src/constants/` for maintainability
- **Error Handling**: Comprehensive error boundaries and validation

### Best Practices

1. **Services**: Keep data access logic in service layer
2. **Hooks**: Encapsulate business logic in custom hooks
3. **Components**: Create reusable UI components in `/src/ui/`
4. **Types**: Define interfaces in `/src/types/`
5. **Constants**: Use centralized constants for all strings and values

### Testing Strategy

- Component testing with React Testing Library
- Service layer unit tests
- Integration tests for Firebase operations
- E2E testing for critical user flows

## 📚 Additional Resources

- [FireCMS Documentation](https://firecms.co/docs) - Comprehensive CMS framework guide
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup) - Backend configuration
- [Vite Documentation](https://vitejs.dev/guide/) - Build tool and development server
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type system reference
- [TailwindCSS](https://tailwindcss.com/docs) - Utility-first CSS framework

For detailed implementation information, see the [CmsCollections documentation](./docs/CmsCollections.md).
