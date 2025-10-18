import React, { Component, ErrorInfo, ReactNode } from "react";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { Button } from "../components/Button";
import { BUTTON_TEXT_RESET_FORM, ERROR_MESSAGE_UNEXPECTED_ERROR } from "../../constants";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: Array<unknown>;
    resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    prevResetKeys: Array<unknown>;
}

/**
 * React Error Boundary component for graceful error handling
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            prevResetKeys: props.resetKeys || []
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error
        };
    }

    static getDerivedStateFromProps(
        props: ErrorBoundaryProps,
        state: ErrorBoundaryState
    ): Partial<ErrorBoundaryState> | null {
        const { resetKeys = [], resetOnPropsChange = true } = props;
        const { prevResetKeys } = state;

        // Reset error state if resetKeys have changed
        if (
            resetOnPropsChange &&
            state.hasError &&
            resetKeys.length > 0 &&
            (resetKeys.length !== prevResetKeys.length ||
                resetKeys.some((key, index) => key !== prevResetKeys[index]))
        ) {
            return {
                hasError: false,
                error: null,
                errorInfo: null,
                prevResetKeys: resetKeys
            };
        }

        if (resetKeys !== prevResetKeys) {
            return {
                prevResetKeys: resetKeys
            };
        }

        return null;
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({
            errorInfo
        });

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log error to console in development
        if (process.env.NODE_ENV === "development") {
            console.error("ErrorBoundary caught an error:", error, errorInfo);
        }
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            // Use custom fallback if provided
            if (fallback) {
                return fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8">
                        <div>
                            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                                Something went wrong
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                An unexpected error occurred. Please try again.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <ErrorDisplay
                                error={error?.message || ERROR_MESSAGE_UNEXPECTED_ERROR}
                                variant="alert"
                            />

                            <Button
                                onClick={this.handleReset}
                                variant="primary"
                                fullWidth
                            >
                                {BUTTON_TEXT_RESET_FORM}
                            </Button>
                        </div>

                        {process.env.NODE_ENV === "development" && error && (
                            <details className="mt-4 p-4 bg-gray-100 rounded-md text-sm">
                                <summary className="cursor-pointer font-medium text-gray-700">
                                    Error Details (Development)
                                </summary>
                                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return children;
    }
}