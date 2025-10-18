import React from "react";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    options: SelectOption[];
    placeholder?: string;
}

/**
 * Reusable select component
 */
export const Select: React.FC<SelectProps> = ({
    label,
    error,
    helperText,
    fullWidth = false,
    options,
    placeholder,
    className = "",
    ...props
}) => {
    const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const baseSelectClasses = "block px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm bg-white";
    const normalClasses = "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500";
    const fullWidthClasses = fullWidth ? "w-full" : "";

    return (
        <div className={fullWidth ? "w-full" : ""}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={`
          ${baseSelectClasses}
          ${hasError ? errorClasses : normalClasses}
          ${fullWidthClasses}
          ${className}
        `.trim()}
                aria-invalid={hasError}
                aria-describedby={
                    error ? `${selectId}-error` :
                        helperText ? `${selectId}-helper` :
                            undefined
                }
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p
                    id={`${selectId}-error`}
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                >
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p
                    id={`${selectId}-helper`}
                    className="mt-1 text-sm text-gray-500"
                >
                    {helperText}
                </p>
            )}
        </div>
    );
};