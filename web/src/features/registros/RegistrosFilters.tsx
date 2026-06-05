import { Search, X } from "lucide-react";
import { Button } from "@/components/Button";
import { DateInput } from "@/components/DateInput";
import { emptyFilters, type RegistrosFilters } from "./types";

interface Props {
  value: RegistrosFilters;
  onChange: (next: RegistrosFilters) => void;
}

const inlineLabel = "text-sm text-[var(--color-texto-soft)] whitespace-nowrap";
const fieldShell =
  "flex items-center gap-2 h-10 rounded-[var(--radius-input)] border border-[var(--color-gris-4)] bg-[var(--color-gris)] px-3 text-sm text-[var(--color-texto)] focus-within:border-[var(--color-primario)]";
const inputClass =
  "flex-1 bg-transparent outline-none placeholder:text-[var(--color-gris-2)]";

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className={fieldShell}>
      <Search className="size-4 text-[var(--color-gris-2)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className={fieldShell + " min-w-[140px]"}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass + " appearance-none cursor-pointer"}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--color-fondo-3)]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RegistrosFiltersBar({ value, onChange }: Props) {
  const set = <K extends keyof RegistrosFilters>(key: K, v: RegistrosFilters[K]) =>
    onChange({ ...value, [key]: v });

  const hasFilters = Object.values(value).some((v) => v !== "");

  return (
    <div className="flex flex-col gap-3">
      {/* Fila 1: filtros con etiqueta inline */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className={inlineLabel}>Registro</span>
          <DateInput
            value={value.fechaRegistroDesde}
            onChange={(v) => set("fechaRegistroDesde", v)}
            className="min-w-[150px]"
          />
          <span className="text-[var(--color-gris-2)]">–</span>
          <DateInput
            value={value.fechaRegistroHasta}
            onChange={(v) => set("fechaRegistroHasta", v)}
            className="min-w-[150px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={inlineLabel}>Ticket</span>
          <DateInput
            value={value.fechaTicketDesde}
            onChange={(v) => set("fechaTicketDesde", v)}
            className="min-w-[150px]"
          />
          <span className="text-[var(--color-gris-2)]">–</span>
          <DateInput
            value={value.fechaTicketHasta}
            onChange={(v) => set("fechaTicketHasta", v)}
            className="min-w-[150px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={inlineLabel}>Campaña</span>
          <SelectField
            value={value.campania}
            onChange={(v) => set("campania", v as RegistrosFilters["campania"])}
            placeholder="Todas"
            options={[
              { value: "jerseys", label: "Jerseys" },
              { value: "huevo_campeon", label: "Huevo Campeón" },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={inlineLabel}>Estado de registro</span>
          <SelectField
            value={value.clasificacion}
            onChange={(v) => set("clasificacion", v as RegistrosFilters["clasificacion"])}
            placeholder="Todos"
            options={[
              { value: "VALIDO", label: "VÁLIDO" },
              { value: "INVALIDO", label: "INVÁLIDO" },
            ]}
          />
        </div>
      </div>

      {/* Fila 2: campos de texto con lupa */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SearchField
          value={value.folio}
          onChange={(v) => set("folio", v)}
          placeholder="Folio de Ticket"
        />
        <SearchField
          value={value.idRegistro}
          onChange={(v) => set("idRegistro", v)}
          placeholder="ID de registro"
        />
        <SearchField
          value={value.nombre}
          onChange={(v) => set("nombre", v)}
          placeholder="Nombre del participante"
        />
        <SearchField
          value={value.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          placeholder="WhatsApp"
        />
      </div>

      {hasFilters && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<X className="size-4" />}
            onClick={() => onChange(emptyFilters)}
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
