import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type Clasificacion = "VALIDO" | "INVALIDO";

const labels: Record<Clasificacion, string> = {
  VALIDO: "VÁLIDO",
  INVALIDO: "INVÁLIDO",
};

/** Badge tipo pill con fondo (para la tabla del listado). */
export function ClasificacionBadge({
  value,
  className,
}: {
  value: Clasificacion;
  className?: string;
}) {
  const isValid = value === "VALIDO";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        isValid
          ? "border-[var(--color-verde)]/50 bg-[var(--color-verde)]/10 text-[var(--color-verde)]"
          : "border-[var(--color-rojo)]/50 bg-[var(--color-rojo)]/10 text-[var(--color-rojo)]",
        className,
      )}
    >
      {isValid ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
      {labels[value]}
    </span>
  );
}

/** Texto coloreado plano (para el detalle, dentro de una caja-input). */
export function ClasificacionText({
  value,
  className,
}: {
  value: Clasificacion;
  className?: string;
}) {
  const isValid = value === "VALIDO";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold",
        isValid ? "text-[var(--color-verde)]" : "text-[var(--color-rojo)]",
        className,
      )}
    >
      {isValid ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
      {labels[value]}
    </span>
  );
}
