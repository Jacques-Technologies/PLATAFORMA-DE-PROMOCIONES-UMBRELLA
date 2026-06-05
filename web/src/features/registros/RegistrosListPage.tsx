import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DocumentSnapshot } from "firebase/firestore";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { RegistrosFiltersBar } from "./RegistrosFilters";
import { RegistrosTable } from "./RegistrosTable";
import { RegistroDetailDialog } from "./RegistroDetailDialog";
import { ExportButton } from "./ExportButton";
import { PAGE_SIZE, useRegistros } from "./useRegistros";
import { getDefaultFilters, type Registro, type RegistrosFilters } from "./types";

export function RegistrosListPage() {
  const [filters, setFilters] = useState<RegistrosFilters>(() => getDefaultFilters());
  const [selected, setSelected] = useState<Registro | null>(null);

  /** Stack de cursores. Pos 0 = inicio (null). Pos N = cursor de la página N+1. */
  const [cursorStack, setCursorStack] = useState<Array<DocumentSnapshot | null>>([null]);
  const pageIndex = cursorStack.length - 1;
  const currentCursor = cursorStack[pageIndex];

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  /** Reset paginación cuando cambian filtros */
  useEffect(() => {
    setCursorStack([null]);
  }, [filterKey]);

  const { data, lastDoc, total, loading, error } = useRegistros(filters, { cursor: currentCursor });

  const totalPages = total != null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null;
  const canGoNext = data.length === PAGE_SIZE && (totalPages == null || pageIndex + 1 < totalPages);
  const canGoPrev = pageIndex > 0;

  const goNext = () => {
    if (lastDoc) setCursorStack((s) => [...s, lastDoc]);
  };
  const goPrev = () => setCursorStack((s) => s.slice(0, -1));

  const fromIndex = pageIndex * PAGE_SIZE + (data.length > 0 ? 1 : 0);
  const toIndex = pageIndex * PAGE_SIZE + data.length;

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <h1 className="text-3xl font-semibold text-[var(--color-blanco)]">Registros</h1>

        <RegistrosFiltersBar value={filters} onChange={setFilters} />

        {error && (
          <div className="rounded-[var(--radius-card)] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <p className="font-medium">Error al consultar registros</p>
            <p className="mt-1 break-all text-xs opacity-80">{error.message}</p>
            <p className="mt-2 text-xs opacity-70">
              Abre la consola del navegador (F12) — si Firestore pide crear un índice, ahí aparece el link.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[var(--color-texto-muted)]">
          <span>
            {loading
              ? "Cargando..."
              : total != null
                ? `Mostrando ${fromIndex}–${toIndex} de ${total} registro${total === 1 ? "" : "s"}`
                : `${data.length} registro(s) en esta página`}
          </span>
          <ExportButton filters={filters} />
        </div>

        <RegistrosTable data={data} loading={loading} onView={setSelected} />

        {(canGoPrev || canGoNext) && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className="text-[var(--color-texto-muted)]">
              Página {pageIndex + 1}
              {totalPages != null ? ` de ${totalPages}` : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoPrev}
              onClick={goPrev}
              leftIcon={<ChevronLeft className="size-4" />}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoNext}
              onClick={goNext}
              rightIcon={<ChevronRight className="size-4" />}
            >
              Siguiente
            </Button>
          </div>
        )}
      </main>
      <RegistroDetailDialog registro={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
