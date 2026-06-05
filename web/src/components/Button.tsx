import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primario-soft)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-fondo-1)] disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primario)] text-[var(--color-blanco)] hover:bg-[var(--color-primario-hover)]",
        hover:
          "bg-[var(--color-primario-hover)] text-[var(--color-blanco)]",
        disabled:
          "bg-[var(--color-gris)] text-[var(--color-gris-2)] cursor-not-allowed",
        success:
          "bg-[var(--color-verde)] text-[var(--color-blanco)] hover:opacity-90",
        warning:
          "bg-[var(--color-naranja)] text-[var(--color-fondo-1)] hover:opacity-90",
        error:
          "bg-[var(--color-rojo)] text-[var(--color-blanco)] hover:opacity-90",
        loading:
          "bg-[var(--color-primario)] text-[var(--color-blanco)] cursor-wait",
        ghost:
          "bg-transparent text-[var(--color-texto)] hover:bg-[var(--color-gris)]",
        outline:
          "border border-[var(--color-gris-4)] bg-transparent text-[var(--color-texto)] hover:bg-[var(--color-gris)]",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
      width: {
        auto: "w-auto",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      width: "auto",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, width, loading, leftIcon, rightIcon, children, disabled, ...props },
    ref,
  ) => {
    const effectiveVariant = loading ? "loading" : disabled ? "disabled" : variant;
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant: effectiveVariant, size, width }), className)}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = "Button";
