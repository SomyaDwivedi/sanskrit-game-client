import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "accent" | "success" | "warning";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  icon,
  loading = false,
}) => {
  const baseClasses =
    "border-none border-radius: 12px font-weight: 600 cursor-pointer transition-all text-transform: uppercase letter-spacing: 0.5px display: inline-flex align-items: center justify-content: center position: relative overflow: hidden z-index: 1";

  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    success: "btn-success",
    warning: "btn-warning",
  };

  const sizeClasses = {
    sm: "btn-sm",
    md: "py-3 px-6",
    lg: "py-4 px-8 text-lg",
    xl: "py-6 px-12 text-xl",
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
    >
      {loading && <div className="spinner mr-2"></div>}
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
