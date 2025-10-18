import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

/**
 * Reusable button component
 */
export const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    className = "",
    children,
    ...props
}) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantClasses = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
        secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
        ghost: "bg-transparent hover:bg-gray-50 text-gray-700 focus:ring-gray-500"
    };

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    const disabledClasses = "opacity-50 cursor-not-allowed";
    const fullWidthClasses = fullWidth ? "w-full" : "";

    const isDisabled = disabled || loading;

    return (
        <button
            disabled={isDisabled}
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? disabledClasses : ""}
        ${fullWidthClasses}
        ${className}
      `.trim()}
            {...props}
        >
            {loading && (
                <div
                    className="animate-spin rounded-full border-2 border-transparent border-t-current h-4 w-4 mr-2"
                    role="status"
                    aria-hidden="true"
                />
            )}
            {children}
        </button>
    );
};