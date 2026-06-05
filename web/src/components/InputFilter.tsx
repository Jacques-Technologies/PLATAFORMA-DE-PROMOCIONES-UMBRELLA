import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputFilterProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function InputFilter({ label, children, className }: InputFilterProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 min-w-[180px]", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-texto-muted)]">
        {label}
      </span>
      {children}
    </div>
  );
}
