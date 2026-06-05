import { useRef } from "react";
import { Calendar } from "lucide-react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateInput({ value, onChange, placeholder = "DD/MMM/AA", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const display = value
    ? format(parse(value, "yyyy-MM-dd", new Date()), "dd/MMM/yy", { locale: es })
    : placeholder;

  const open = () => {
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  };

  return (
    <div
      onClick={open}
      className={cn(
        "relative flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-input)] border border-[var(--color-gris-4)] bg-[var(--color-gris)] px-3 text-sm focus-within:border-[var(--color-primario)]",
        className,
      )}
    >
      <Calendar className="size-4 text-[var(--color-gris-2)]" />
      <span className={cn("flex-1", value ? "text-[var(--color-texto)]" : "text-[var(--color-gris-2)]")}>
        {display}
      </span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </div>
  );
}
