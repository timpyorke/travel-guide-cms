import React, { Component, ReactNode } from "react";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { LoadingSpinner } from "../components/LoadingSpinner";

interface AsyncBoundaryProps {
    children: ReactNode;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    loadingMessage?: string;
    className?: string;
}

/**
 * Async Boundary component for handling loading and error states
 */
export class AsyncBoundary extends Component<AsyncBoundaryProps> {
    render(): ReactNode {
        const {
            children,
            loading = false,
            error = null,
            onRetry,
            loadingMessage,
            className = ""
        } = this.props;

        if (loading) {
            return (
                <div className={`flex items-center justify-center py-8 ${className}`}>
                    <LoadingSpinner message={loadingMessage} />
                </div>
            );
        }

        if (error) {
            return (
                <div className={`py-4 ${className}`}>
                    <ErrorDisplay
                        error={error}
                        onDismiss={onRetry}
                        variant="alert"
                    />
                </div>
            );
        }

        return children;
    }
}