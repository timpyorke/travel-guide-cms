# Security Configuration Guide

## GitHub Secrets Setup

To properly secure your CI/CD pipeline, you need to configure the following secrets in your GitHub repository.

### Required Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

#### Firebase Configuration Secrets

These secrets contain your Firebase project configuration:

| Secret Name                         | Description                     | Example Value                             |
| ----------------------------------- | ------------------------------- | ----------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase API Key                | `AIzaSyBQk6gOafl1UG-f_NERIj3pnslwkcw9u7c` |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase Auth Domain            | `your-project.firebaseapp.com`            |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase Project ID             | `your-project-id`                         |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase Storage Bucket         | `your-project.appspot.com`                |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID    | `123456789012`                            |
| `VITE_FIREBASE_APP_ID`              | Firebase App ID                 | `1:123456789012:web:abcdef123456`         |
| `VITE_FIREBASE_MEASUREMENT_ID`      | Google Analytics Measurement ID | `G-XXXXXXXXXX`                            |

#### Deployment Secrets

| Secret Name      | Description        | How to Get                      |
| ---------------- | ------------------ | ------------------------------- |
| `FIREBASE_TOKEN` | Firebase CLI Token | Run `firebase login:ci` locally |

### How to Get Firebase Configuration Values

1. **Firebase Console**: Go to [Firebase Console](https://console.firebase.google.com)
2. **Select Project**: Choose your project
3. **Project Settings**: Click the gear icon → Project settings
4. **General Tab**: Scroll down to "Your apps" section
5. **Web App**: Click on your web app or create one if needed
6. **Copy Values**: Copy each configuration value to the corresponding GitHub secret

### How to Get Firebase Token

1. **Install Firebase CLI**: `npm install -g firebase-tools`
2. **Login**: Run `firebase login:ci`
3. **Copy Token**: Copy the generated token to `FIREBASE_TOKEN` secret

## Environment File Setup

### Local Development

1. **Copy Example**: `cp .env.example .env`
2. **Fill Values**: Replace placeholder values with your actual Firebase configuration
3. **Never Commit**: The `.env` file is already in `.gitignore`

### Production Environment

The CI/CD pipeline automatically creates the `.env` file using GitHub secrets during deployment.

## Security Best Practices

### 1. Secret Management

- ✅ **Use GitHub Secrets**: Never commit sensitive values to git
- ✅ **Environment Variables**: Load configuration from environment
- ✅ **Principle of Least Privilege**: Only grant necessary permissions
- ❌ **Avoid Hardcoding**: Never hardcode API keys in source code

### 2. Firebase Security Rules

#### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // CMS Collections - Admin only
    match /cms_collections/{document} {
      allow read, write: if request.auth != null
        && request.auth.token.admin == true;
    }

    // Public content with authentication for writes
    match /{collection}/{document} {
      allow read: if resource.data.published == true ||
        (request.auth != null && request.auth.token.admin == true);
      allow write: if request.auth != null &&
        request.auth.token.admin == true;
    }
  }
}
```

#### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read, authenticated write with size limits
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.admin == true
        && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

### 3. Authentication Configuration

#### Custom Claims Setup

```typescript
// Add admin claims to specific users
const admin = require("firebase-admin");

async function setAdminClaim(uid: string) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
}
```

#### Domain Restrictions

```typescript
// In src/App.tsx - Restrict by email domain
const myAuthenticator = async ({ user }: AuthContext) => {
  if (!user?.email?.endsWith("@yourdomain.com")) {
    throw new Error("Unauthorized domain");
  }
  return true;
};
```

### 4. Content Security Policy

Add to your hosting configuration:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-eval' https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com;
"
/>
```

## Deployment Security Checklist

### Pre-Deployment

- [ ] All secrets configured in GitHub
- [ ] Firebase security rules reviewed and tested
- [ ] Environment variables validated
- [ ] Authentication configuration tested
- [ ] Admin user accounts configured

### Post-Deployment

- [ ] Security rules deployed and active
- [ ] Admin authentication working
- [ ] Public content properly restricted
- [ ] File upload permissions working
- [ ] Error monitoring enabled

## Monitoring and Alerts

### Firebase Security

1. **Authentication Monitoring**: Monitor failed login attempts
2. **Security Rules**: Review rule violations in Firebase Console
3. **Usage Monitoring**: Track API usage and quotas

### Application Security

1. **Error Tracking**: Use Firebase Crashlytics or Sentry
2. **Performance**: Monitor Core Web Vitals
3. **Dependency Scanning**: Regular security audits with `npm audit`

## Emergency Procedures

### Compromised Secrets

1. **Immediate**: Disable compromised API keys in Firebase Console
2. **Rotate**: Generate new keys and update GitHub secrets
3. **Redeploy**: Trigger new deployment with updated secrets
4. **Monitor**: Watch for unauthorized usage

### Security Breach

1. **Isolate**: Temporarily disable affected services
2. **Assess**: Determine scope of breach
3. **Mitigate**: Patch vulnerabilities and rotate credentials
4. **Communicate**: Notify stakeholders of resolution

## Additional Resources

- [Firebase Security Documentation](https://firebase.google.com/docs/security)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [OWASP Security Guidelines](https://owasp.org/www-project-application-security-verification-standard/)
