import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputDropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  children?: ReactNode;
}

export const InputDropdown = forwardRef<HTMLSelectElement, InputDropdownProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
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
            "relative flex items-center h-10 rounded-[var(--radius-input)] border bg-[var(--color-gris)]",
            "border-[var(--color-gris-4)] focus-within:border-[var(--color-primario)]",
            error && "border-[var(--color-rojo)]",
          )}
        >
          <select
            ref={ref}
            id={inputId}
            className={cn(
              "appearance-none w-full h-full bg-transparent text-sm text-[var(--color-texto)] px-3 pr-9 outline-none",
              !props.value && "text-[var(--color-gris-2)]",
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[var(--color-fondo-3)]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 size-4 text-[var(--color-gris-2)]" />
        </div>
        {error && <p className="text-xs text-[var(--color-rojo)]">{error}</p>}
      </div>
    );
  },
);
InputDropdown.displayName = "InputDropdown";
