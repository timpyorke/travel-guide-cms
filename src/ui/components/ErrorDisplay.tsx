import React from "react";
import { BUTTON_TEXT_CLOSE } from "../../constants";

export interface ErrorDisplayProps {
    error: string | null;
    onDismiss?: () => void;
    className?: string;
    variant?: "inline" | "alert" | "toast";
}

/**
 * Reusable error display component
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    error,
    onDismiss,
    className = "",
    variant = "inline"
}) => {
    if (!error) return null;

    const baseClasses = "rounded-md p-4 text-sm";
    const variantClasses = {
        inline: "bg-red-50 text-red-700 border border-red-200",
        alert: "bg-red-100 text-red-800 border-l-4 border-red-500",
        toast: "bg-red-600 text-white shadow-lg"
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p>{error}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className={`ml-4 flex-shrink-0 rounded-md p-1 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 ${variant === "toast"
                                ? "text-white focus:ring-white"
                                : "text-red-400 hover:text-red-500 focus:ring-red-500"
                            }`}
                        aria-label={BUTTON_TEXT_CLOSE}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};