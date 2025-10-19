# Development Guide

## Getting Started

### Local Development Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd travel-guide-cms
   npm install
   ```

2. **Firebase Configuration**

   - Create Firebase project with Firestore, Storage, and Authentication
   - Copy configuration to `src/firebase_config.ts`
   - Enable desired authentication providers

3. **Start Development Server**
   ```bash
   npm run dev  # Starts on localhost:3000
   ```

### Development Tools

- **Vite**: Fast development server with HMR
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **TailwindCSS**: Utility-first styling
- **PostCSS**: CSS processing and optimization

## Architecture Guidelines

### Clean Architecture Principles

```
Presentation Layer (UI/Views)
    ↓
Business Logic Layer (Hooks)
    ↓
Data Access Layer (Services)
    ↓
External Services (Firebase)
```

### Directory Structure

- `/src/services/` - Data access and external API calls
- `/src/hooks/` - Business logic and state management
- `/src/ui/` - Reusable UI components
- `/src/views/` - Page-level components
- `/src/utils/` - Pure utility functions
- `/src/constants/` - Centralized constants
- `/src/types/` - TypeScript type definitions

### Naming Conventions

- **Components**: PascalCase (`CmsCollectionForm`)
- **Hooks**: camelCase starting with 'use' (`useCmsCollections`)
- **Services**: PascalCase with 'Service' suffix (`CmsCollectionService`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_PERMISSIONS`)
- **Types**: PascalCase (`CmsCollectionConfig`)

## Code Quality Standards

### TypeScript Guidelines

1. **Strict Mode**: Enable all strict TypeScript options
2. **No Any**: Avoid `any` type - use proper typing
3. **Interfaces**: Define interfaces for all data structures
4. **Generics**: Use generics for reusable components
5. **Type Guards**: Implement type guards for runtime validation

```typescript
// Good
interface UserConfig {
  id: string;
  name: string;
  permissions: Permission[];
}

// Avoid
const userConfig: any = { ... };
```

### Component Guidelines

1. **Single Responsibility**: One component, one purpose
2. **Props Interface**: Define props interface for all components
3. **Default Props**: Use default parameters instead of defaultProps
4. **Error Boundaries**: Wrap components that might fail
5. **Memoization**: Use React.memo for performance when needed

```typescript
interface ButtonProps {
  variant: "primary" | "secondary";
  children: ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  onClick,
}) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

### Hook Guidelines

1. **Pure Logic**: Keep business logic separate from UI
2. **Error Handling**: Always handle async errors
3. **Cleanup**: Properly cleanup subscriptions and timers
4. **Dependencies**: Minimize effect dependencies
5. **Custom Hooks**: Extract reusable logic into custom hooks

```typescript
const useCmsCollections = (app: FirebaseApp, locale?: string) => {
  const [collections, setCollections] = useState<EntityCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = CmsCollectionService.subscribeToCmsCollections(
      (data) => {
        setCollections(transformCollections(data, locale));
        setLoading(false);
      }
    );

    return unsubscribe; // Cleanup subscription
  }, [app, locale]);

  return { collections, loading, error };
};
```

## Testing Strategy

### Unit Testing

Test individual functions and components in isolation.

```typescript
// utils.test.ts
import { validateEmail } from "../utils/validation";

describe("validateEmail", () => {
  it("should validate correct email format", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("should reject invalid email format", () => {
    expect(validateEmail("invalid-email")).toBe(false);
  });
});
```

### Component Testing

Test component behavior and user interactions.

```typescript
// Button.test.tsx
import { render, fireEvent, screen } from "@testing-library/react";
import { Button } from "../ui/components/Button";

describe("Button", () => {
  it("should call onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing

Test complete user flows and Firebase integration.

```typescript
// cms-collections.integration.test.ts
describe("CMS Collections Integration", () => {
  it("should create and retrieve collection", async () => {
    const config = createTestCollectionConfig();
    await CmsCollectionService.createCmsCollection(config);

    const retrieved = await CmsCollectionService.getCmsCollectionById(
      config.id
    );
    expect(retrieved).toEqual(config);
  });
});
```

## Performance Optimization

### React Performance

1. **React.memo**: Memoize components that receive stable props
2. **useMemo**: Memoize expensive calculations
3. **useCallback**: Memoize event handlers
4. **Lazy Loading**: Use React.lazy for code splitting
5. **Virtual Scrolling**: For large lists

### Firebase Performance

1. **Query Optimization**: Use indexed queries
2. **Data Caching**: Leverage Firestore offline persistence
3. **Batch Operations**: Group multiple writes
4. **Pagination**: Implement proper pagination
5. **Real-time Subscriptions**: Use selectively

### Bundle Optimization

1. **Tree Shaking**: Import only what you need
2. **Code Splitting**: Split by routes and features
3. **Asset Optimization**: Optimize images and files
4. **CDN Usage**: Use Firebase CDN for static assets

## Error Handling

### Error Boundaries

Implement error boundaries at strategic levels:

```typescript
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### Async Error Handling

Handle async operations properly:

```typescript
const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (operation: () => Promise<void>) => {
    try {
      setLoading(true);
      setError(null);
      await operation();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
};
```

## Security Best Practices

### Firebase Security

1. **Security Rules**: Implement proper Firestore and Storage rules
2. **Authentication**: Validate user permissions
3. **Data Validation**: Validate all inputs on client and server
4. **Principle of Least Privilege**: Grant minimal necessary permissions

### Code Security

1. **Input Sanitization**: Sanitize all user inputs
2. **XSS Prevention**: Use proper escaping for dynamic content
3. **CSRF Protection**: Implement CSRF tokens for sensitive operations
4. **Dependency Auditing**: Regularly audit and update dependencies

## Deployment Guidelines

### Build Process

1. **Type Checking**: Ensure no TypeScript errors
2. **Linting**: Fix all ESLint warnings
3. **Testing**: Run all tests
4. **Bundle Analysis**: Check bundle size
5. **Performance Testing**: Validate performance metrics

### Production Deployment

1. **Environment Variables**: Use environment-specific configs
2. **Security Rules**: Deploy production Firebase rules
3. **Performance Monitoring**: Enable Firebase Performance
4. **Error Tracking**: Set up error monitoring
5. **Analytics**: Configure usage analytics

### Continuous Integration

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Vite automatically finds available ports
2. **Firebase Config**: Ensure all required services are enabled
3. **Type Errors**: Check TypeScript configuration and imports
4. **Build Failures**: Verify all dependencies are installed
5. **Authentication Issues**: Check Firebase Auth configuration

### Debug Tools

1. **React DevTools**: Component inspection and profiling
2. **Firebase Emulator**: Local development environment
3. **Network Tab**: Monitor API calls and performance
4. **Console Logs**: Strategic logging for debugging
5. **Error Boundaries**: Catch and display runtime errors

### Performance Monitoring

1. **Firebase Performance**: Monitor app performance
2. **Web Vitals**: Track Core Web Vitals metrics
3. **Bundle Analyzer**: Analyze bundle composition
4. **Lighthouse**: Regular performance audits
5. **Real User Monitoring**: Track actual user performance

## Contributing Guidelines

### Pull Request Process

1. Create feature branch from main
2. Implement changes following code standards
3. Add tests for new functionality
4. Update documentation as needed
5. Submit pull request with clear description

### Code Review Checklist

- [ ] Code follows established patterns
- [ ] All tests pass
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Performance considerations addressed
- [ ] Documentation updated
- [ ] Security implications reviewed

### Commit Message Format

```
type(scope): brief description

Detailed explanation of changes made.

Fixes #123
```

Types: feat, fix, docs, style, refactor, test, chore
