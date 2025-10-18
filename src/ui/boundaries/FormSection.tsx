import React from "react";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { SuccessMessage } from "../components/SuccessMessage";

export interface FormSectionProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    error?: string | null;
    success?: string | null;
    onErrorDismiss?: () => void;
    onSuccessDismiss?: () => void;
    className?: string;
}

/**
 * Form section component with integrated error and success state handling
 */
export const FormSection: React.FC<FormSectionProps> = ({
    title,
    description,
    children,
    error,
    success,
    onErrorDismiss,
    onSuccessDismiss,
    className = ""
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            {(title || description) && (
                <div>
                    {title && (
                        <h3 className="text-lg font-medium text-gray-900">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="mt-1 text-sm text-gray-600">
                            {description}
                        </p>
                    )}
                </div>
            )}

            {error && (
                <ErrorDisplay
                    error={error}
                    onDismiss={onErrorDismiss}
                    variant="inline"
                />
            )}

            {success && (
                <SuccessMessage
                    message={success}
                    onDismiss={onSuccessDismiss}
                    variant="inline"
                />
            )}

            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
};