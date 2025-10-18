import React from "react";
import { DEFAULT_MIN_ROWS } from "../../constants";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    resize?: "none" | "both" | "horizontal" | "vertical";
}

/**
 * Reusable textarea component
 */
export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    helperText,
    fullWidth = false,
    resize = "vertical",
    rows = DEFAULT_MIN_ROWS,
    className = "",
    ...props
}) => {
    const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const baseTextareaClasses = "block px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm";
    const normalClasses = "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500";
    const fullWidthClasses = fullWidth ? "w-full" : "";

    const resizeClasses = {
        none: "resize-none",
        both: "resize",
        horizontal: "resize-x",
        vertical: "resize-y"
    };

    return (
        <div className={fullWidth ? "w-full" : ""}>
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label}
                </label>
            )}
            <textarea
                id={textareaId}
                rows={rows}
                className={`
          ${baseTextareaClasses}
          ${hasError ? errorClasses : normalClasses}
          ${fullWidthClasses}
          ${resizeClasses[resize]}
          ${className}
        `.trim()}
                aria-invalid={hasError}
                aria-describedby={
                    error ? `${textareaId}-error` :
                        helperText ? `${textareaId}-helper` :
                            undefined
                }
                {...props}
            />
            {error && (
                <p
                    id={`${textareaId}-error`}
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                >
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p
                    id={`${textareaId}-helper`}
                    className="mt-1 text-sm text-gray-500"
                >
                    {helperText}
                </p>
            )}
        </div>
    );
};