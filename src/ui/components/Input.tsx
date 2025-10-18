import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

/**
 * Reusable input component
 */
export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    fullWidth = false,
    className = "",
    ...props
}) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const baseInputClasses = "block px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm";
    const normalClasses = "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500";
    const fullWidthClasses = fullWidth ? "w-full" : "";

    return (
        <div className={fullWidth ? "w-full" : ""}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`
          ${baseInputClasses}
          ${hasError ? errorClasses : normalClasses}
          ${fullWidthClasses}
          ${className}
        `.trim()}
                aria-invalid={hasError}
                aria-describedby={
                    error ? `${inputId}-error` :
                        helperText ? `${inputId}-helper` :
                            undefined
                }
                {...props}
            />
            {error && (
                <p
                    id={`${inputId}-error`}
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                >
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p
                    id={`${inputId}-helper`}
                    className="mt-1 text-sm text-gray-500"
                >
                    {helperText}
                </p>
            )}
        </div>
    );
};