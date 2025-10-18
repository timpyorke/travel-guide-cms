# Travel Guide CMS

Travel Guide CMS is a FireCMS-powered admin panel that manages travel content,
marketing banners, and product information backed by Firebase. It is configured
as a single-page React application built with Vite and TypeScript.

## Tech Stack
- React 18 + TypeScript
- Vite 7 for development and bundling
- FireCMS 3 (beta) UI framework
- Firebase Authentication, Firestore, and Storage
- TailwindCSS for styling utilities

## Prerequisites
- Node.js 18 or later
- npm 9+ or Yarn 1.22+
- Firebase CLI (`npm install -g firebase-tools`) for deployment
- A Firebase project with Firestore, Storage, and Authentication enabled

## Local Setup
1. Install dependencies (choose one package manager):
   ```bash
   npm install
   # or
   yarn install
   ```
2. Configure Firebase:
   - Create a Firebase project if you do not have one.
   - Enable Firestore, Storage, and Authentication (Google and/or Email/Password).
   - Copy your app credentials into `src/firebase_config.ts`.
3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
4. Open the provided local URL and authenticate with an allowed user.

## Firebase Configuration
- `src/firebase_config.ts`: Holds the `firebaseConfig` used by `useInitialiseFirebase`.
- Authentication providers are configured in `src/App.tsx:51` via `signInOptions`.
- Ensure Firestore and Storage security rules align with your desired permissions.
- The `myAuthenticator` callback in `src/App.tsx:22` can be customized to restrict access (e.g., based on custom claims or email domain).

## Available Scripts
- `npm run dev` / `yarn dev`: Start the Vite development server.
- `npm run build` / `yarn build`: Build the production bundle and run TypeScript type checking.
- `npm run preview` / `yarn preview`: Build and serve the production bundle locally.
- `npm run deploy` / `yarn deploy`: Build and deploy hosting to Firebase using the configured project.

## Project Structure
```
src/
├── App.tsx                 # FireCMS setup, navigation, and authentication wiring
├── collections/            # FireCMS collection definitions
│   ├── banner.tsx          # Banners collection (content group)
│   ├── products.tsx        # Products collection (e-commerce group)
│   └── demo.tsx            # Demo collection showcasing FireCMS property types
├── firebase_config.ts      # Firebase project credentials
├── main.tsx                # React entry point
└── index.css               # Global styles (Tailwind entry)
```

## FireCMS Configuration
- `FireCMS` initialization, navigation, and theming live in `src/App.tsx`.
- `useBuildNavigationController` binds the registered collections so they appear in the left-hand navigation.
- `useValidateAuthenticator` validates the Firebase user before granting access to the main CMS view.
- `ModeControllerProvider` exposes light/dark mode and persists preferences using `useBuildLocalConfigurationPersistence`.

## Collections
- **Demo (`src/collections/demo.tsx`)**: Demonstrates FireCMS field types—validation, markdown, maps, references, and `oneOf` content blocks.
- **Banners (`src/collections/banner.tsx`)**: Minimal collection for marketing banners with validated destination URLs.
- **Products (`src/collections/products.tsx`)**: Rich product schema including price validation, self-referencing relationships, asset storage, category enums, metadata maps, and conditional logic on the `published` flag.

To add a new collection, create a file under `src/collections`, export it via `buildCollection`, and append it to the `collections` array in `src/App.tsx:36`.

### Dynamic Collections
- Firestore collection path `cms_collections` is watched at runtime (`src/hooks/useDynamicCollections.ts`) and merged into the CMS navigation automatically.
- Each document should describe a collection using the schema in `src/types/dynamic_collections.ts`.
- Example document payload:
  ```json
  {
    "id": "locations",
    "path": "locations",
    "name": "Locations",
    "group": "Travel",
    "icon": "Place",
    "permissions": { "read": true, "create": true, "edit": true, "delete": false },
    "properties": [
      { "key": "title", "dataType": "string", "required": true },
      { "key": "slug", "dataType": "string", "description": "URL friendly identifier" },
      { "key": "published", "dataType": "boolean" },
      { "key": "heroImage", "dataType": "string", "name": "Hero image URL" },
      { "key": "tags", "dataType": "array", "of": { "dataType": "string" } }
    ]
  }
  ```
- Supported property types: scalar (`string`, `number`, `boolean`, `date`, `date_time`), references, and arrays of strings or references (with optional enum values for string arrays). Invalid config entries are ignored with console warnings to avoid crashing the CMS.

## Authentication and Authorization
- Firebase Authentication controls who can sign in. Update `signInOptions` in `src/App.tsx:51` to adjust providers.
- Implement fine-grained access rules in the `permissions` block of each collection (see `src/collections/products.tsx:28`).
- Customize the `myAuthenticator` function in `src/App.tsx:22` to enforce domain restrictions or role-based access using Firebase custom claims.

## Deployment
1. Ensure you are logged in with the Firebase CLI: `firebase login`.
2. Set the target project in `.firebaserc` or pass `--project <id>`.
3. Deploy hosting:
   ```bash
   npm run deploy
   # or
   yarn deploy
   ```
   The script builds the app and runs `firebase deploy --only hosting`.

## Useful References
- [FireCMS Documentation](https://firecms.co/docs)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Vite Documentation](https://vitejs.dev/guide/)
