import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClasificacionBadge } from "@/components/ClasificacionBadge";
import { cn } from "@/lib/utils";
import type { Campania, Registro } from "./types";

const campaniaTagStyles: Record<Campania, { label: string; className: string }> = {
  jerseys: {
    label: "Jerseys",
    className:
      "border-[var(--color-primario-soft)]/50 bg-[var(--color-primario-soft)]/10 text-[var(--color-primario-soft)]",
  },
  huevo_campeon: {
    label: "Huevo Campeón",
    className:
      "border-[var(--color-naranja)]/50 bg-[var(--color-naranja)]/10 text-[var(--color-naranja)]",
  },
};

function CampaniaTag({ value }: { value: Campania | undefined }) {
  if (!value) return <span className="text-[var(--color-texto-soft)]">—</span>;
  const { label, className } = campaniaTagStyles[value];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        className,
      )}
    >
      {label}
    </span>
  );
}

interface Props {
  data: Registro[];
  loading: boolean;
  onView: (r: Registro) => void;
}

export function RegistrosTable({ data, loading, onView }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "Fecha_registro", desc: true },
  ]);

  const columns = useMemo<ColumnDef<Registro>[]>(
    () => [
      {
        accessorKey: "Fecha_registro",
        header: "Fecha y hora registro",
        cell: ({ row }) => {
          const ts = row.original.Fecha_registro;
          return ts ? format(ts.toDate(), "EEE dd/MMM/yy HH:mm", { locale: es }) : "—";
        },
      },
      {
        accessorKey: "campania",
        header: "Campaña",
        cell: ({ getValue }) => <CampaniaTag value={getValue() as Campania | undefined} />,
      },
      {
        accessorKey: "Folio_ticket",
        header: "Folio de Ticket",
        cell: ({ getValue }) => (getValue() as string) ?? "—",
      },
      {
        accessorKey: "Sucursal_ticket",
        header: "Sucursal",
        cell: ({ getValue }) => (getValue() as string) ?? "—",
      },
      {
        accessorKey: "ID_registro",
        header: "ID de registro",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue() as string}</span>
        ),
      },
      { accessorKey: "Nombre_registro", header: "Nombre del participante" },
      { accessorKey: "Whatsapp_registro", header: "WhatsApp" },
      {
        accessorKey: "Clasificacion_registro",
        header: "Estado",
        cell: ({ getValue }) => (
          <ClasificacionBadge value={getValue() as Registro["Clasificacion_registro"]} />
        ),
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => onView(row.original)}
            className="text-xs font-medium text-[var(--color-primario-soft)] hover:underline"
          >
            Ver detalle
          </button>
        ),
      },
    ],
    [onView],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)]">
      <table className="w-full text-xs whitespace-nowrap border-separate border-spacing-0">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-[var(--color-fondo-2)]">
              {hg.headers.map((header, idx) => (
                <th
                  key={header.id}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-texto-muted)]",
                    idx === 0 && "rounded-l-[var(--radius-card)]",
                    idx === hg.headers.length - 1 && "rounded-r-[var(--radius-card)]",
                    header.column.getCanSort() && "cursor-pointer select-none",
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && header.column.getIsSorted() ? (
                      <ArrowUpDown className="size-3" />
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[var(--color-texto-soft)]"
              >
                Cargando...
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[var(--color-texto-soft)]"
              >
                No hay registros que coincidan con los filtros.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors hover:bg-[var(--color-hover)]/40",
                  i % 2 === 0
                    ? "bg-[var(--color-fondo-1)]"
                    : "bg-[var(--color-gris)]",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-3 text-[var(--color-texto)]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
