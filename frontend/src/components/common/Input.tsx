import React from "react";

interface InputProps {
  id?: string;
  type?: "text" | "email" | "password" | "number";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  className?: string;
  variant?: "default" | "center" | "large" | "active-team";
  autoFocus?: boolean;
}

const Input: React.FC<InputProps> = ({
  id,
  type = "text",
  value,
  onChange,
  onKeyPress,
  placeholder,
  label,
  disabled = false,
  required = false,
  maxLength,
  className = "",
  variant = "default",
  autoFocus = false,
}) => {
  const variantClasses = {
    default: "input-field",
    center: "input-field text-center text-2xl font-mono tracking-wider",
    large: "input-field text-lg",
    "active-team": "input-field active-team",
  };

  const inputClasses = `${variantClasses[variant]} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        className={inputClasses}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default Input;
