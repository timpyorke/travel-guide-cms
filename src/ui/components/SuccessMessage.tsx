import React from "react";
import { BUTTON_TEXT_CLOSE } from "../../constants";

export interface SuccessMessageProps {
    message: string | null;
    onDismiss?: () => void;
    className?: string;
    variant?: "inline" | "alert" | "toast";
}

/**
 * Reusable success message component
 */
export const SuccessMessage: React.FC<SuccessMessageProps> = ({
    message,
    onDismiss,
    className = "",
    variant = "inline"
}) => {
    if (!message) return null;

    const baseClasses = "rounded-md p-4 text-sm";
    const variantClasses = {
        inline: "bg-green-50 text-green-700 border border-green-200",
        alert: "bg-green-100 text-green-800 border-l-4 border-green-500",
        toast: "bg-green-600 text-white shadow-lg"
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center flex-1">
                    <svg
                        className="h-4 w-4 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <p>{message}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className={`ml-4 flex-shrink-0 rounded-md p-1 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 ${variant === "toast"
                                ? "text-white focus:ring-white"
                                : "text-green-400 hover:text-green-500 focus:ring-green-500"
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