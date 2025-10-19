import React from "react";
import { LOADING_TEXT_SAVING as _LOADING_TEXT_SAVING } from "../../constants";

export interface LoadingSpinnerProps {
    size?: "small" | "medium" | "large";
    message?: string;
    className?: string;
}

/**
 * Reusable loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = "medium",
    message = "Loading...",
    className = ""
}) => {
    const sizeClasses = {
        small: "w-4 h-4",
        medium: "w-8 h-8",
        large: "w-12 h-12"
    };

    return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
            <div
                className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
                role="status"
                aria-label={message}
            />
            {message && (
                <p className="mt-2 text-sm text-gray-600" aria-live="polite">
                    {message}
                </p>
            )}
        </div>
    );
};