import React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    indeterminate?: boolean;
}

/**
 * Reusable checkbox component
 */
export const Checkbox: React.FC<CheckboxProps> = ({
    label,
    error,
    helperText,
    indeterminate = false,
    className = "",
    ...props
}) => {
    const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    const baseCheckboxClasses = "h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2";
    const normalClasses = "text-blue-600 focus:ring-blue-500";
    const errorClasses = "text-red-600 border-red-300 focus:ring-red-500";

    return (
        <div className="flex items-start">
            <div className="flex items-center h-5">
                <input
                    ref={checkboxRef}
                    id={checkboxId}
                    type="checkbox"
                    className={`
            ${baseCheckboxClasses}
            ${hasError ? errorClasses : normalClasses}
            ${className}
          `.trim()}
                    aria-invalid={hasError}
                    aria-describedby={
                        error ? `${checkboxId}-error` :
                            helperText ? `${checkboxId}-helper` :
                                undefined
                    }
                    {...props}
                />
            </div>
            <div className="ml-3 text-sm">
                {label && (
                    <label
                        htmlFor={checkboxId}
                        className="font-medium text-gray-700 cursor-pointer"
                    >
                        {label}
                    </label>
                )}
                {error && (
                    <p
                        id={`${checkboxId}-error`}
                        className="text-red-600 mt-1"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p
                        id={`${checkboxId}-helper`}
                        className="text-gray-500 mt-1"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        </div>
    );
};