import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const InputTextField = forwardRef<HTMLInputElement, InputTextFieldProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-texto-soft)]"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center gap-2 h-10 rounded-[var(--radius-input)] border bg-[var(--color-gris)] px-3",
            "border-[var(--color-gris-4)]",
            "focus-within:border-[var(--color-primario)]",
            error && "border-[var(--color-rojo)]",
          )}
        >
          {leftIcon && <span className="text-[var(--color-gris-2)]">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-1 bg-transparent text-sm text-[var(--color-texto)] outline-none placeholder:text-[var(--color-gris-2)] disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            {...props}
          />
          {rightIcon && <span className="text-[var(--color-gris-2)]">{rightIcon}</span>}
        </div>
        {error ? (
          <p className="text-xs text-[var(--color-rojo)]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[var(--color-gris-2)]">{hint}</p>
        ) : null}
      </div>
    );
  },
);
InputTextField.displayName = "InputTextField";
