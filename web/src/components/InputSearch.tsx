import { forwardRef, type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const InputSearch = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, placeholder = "Buscar...", ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex items-center gap-2 h-10 rounded-[var(--radius-input)] border bg-[var(--color-gris)] px-3",
          "border-[var(--color-gris-4)] focus-within:border-[var(--color-primario)]",
          className,
        )}
      >
        <Search className="size-4 text-[var(--color-gris-2)]" />
        <input
          ref={ref}
          type="search"
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-[var(--color-texto)] outline-none placeholder:text-[var(--color-gris-2)]"
          {...props}
        />
      </div>
    );
  },
);
InputSearch.displayName = "InputSearch";
