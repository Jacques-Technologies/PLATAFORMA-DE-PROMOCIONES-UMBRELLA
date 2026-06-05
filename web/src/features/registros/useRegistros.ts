import { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
  type DocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Registro, RegistrosFilters } from "./types";

export const PAGE_SIZE = 1000;

function startOfDay(value: string): Timestamp {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

function endOfDay(value: string): Timestamp {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return Timestamp.fromDate(d);
}

/** Construye los `where` server-side para todos los filtros. */
function buildFilterConstraints(filters: RegistrosFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (filters.campania) {
    constraints.push(where("campania", "==", filters.campania));
  }
  if (filters.clasificacion) {
    constraints.push(where("Clasificacion_registro", "==", filters.clasificacion));
  }
  if (filters.sucursal) {
    constraints.push(where("Sucursal_ticket", "==", filters.sucursal));
  }
  if (filters.fechaRegistroDesde) {
    constraints.push(where("Fecha_registro", ">=", startOfDay(filters.fechaRegistroDesde)));
  }
  if (filters.fechaRegistroHasta) {
    constraints.push(where("Fecha_registro", "<=", endOfDay(filters.fechaRegistroHasta)));
  }
  if (filters.fechaTicketDesde) {
    constraints.push(where("Fecha_ticket", ">=", startOfDay(filters.fechaTicketDesde)));
  }
  if (filters.fechaTicketHasta) {
    constraints.push(where("Fecha_ticket", "<=", endOfDay(filters.fechaTicketHasta)));
  }

  // Prefix match para campos de texto: >= valor && <= valor + ''
  // Cada uno es un par de inequalities adicional.
  const addPrefix = (field: string, value: string) => {
    if (!value) return;
    constraints.push(where(field, ">=", value));
    constraints.push(where(field, "<=", value + ""));
  };
  addPrefix("ID_registro", filters.idRegistro);
  addPrefix("Folio_ticket", filters.folio);
  addPrefix("Nombre_registro", filters.nombre);
  addPrefix("Whatsapp_registro", filters.whatsapp);

  return constraints;
}

interface PageState {
  /** Cursor con el cual se llamó a startAfter para esta página. null = primera página. */
  cursor: DocumentSnapshot | null;
}

interface UseRegistrosResult {
  data: Registro[];
  firstDoc: DocumentSnapshot | null;
  lastDoc: DocumentSnapshot | null;
  total: number | null;
  loading: boolean;
  error: Error | null;
}

export function useRegistros(
  filters: RegistrosFilters,
  page: PageState,
): UseRegistrosResult {
  const [state, setState] = useState<UseRegistrosResult>({
    data: [],
    firstDoc: null,
    lastDoc: null,
    total: null,
    loading: true,
    error: null,
  });

  const filterKey = JSON.stringify(filters);
  const cursorKey = page.cursor?.id ?? "root";

  // Suscripción real-time a la página actual
  useEffect(() => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const constraints = buildFilterConstraints(filters);
    const baseQuery = query(
      collection(db, "registros"),
      ...constraints,
      orderBy("Fecha_registro", "desc"),
    );

    const pagedQuery = page.cursor
      ? query(baseQuery, startAfter(page.cursor), limit(PAGE_SIZE))
      : query(baseQuery, limit(PAGE_SIZE));

    const unsub = onSnapshot(
      pagedQuery,
      (snap) => {
        const docs = snap.docs;
        const data = docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Registro, "id">) }));
        setState((s) => ({
          ...s,
          data,
          firstDoc: docs[0] ?? null,
          lastDoc: docs[docs.length - 1] ?? null,
          loading: false,
          error: null,
        }));
      },
      (err) => {
        console.error("[useRegistros] snapshot error:", err);
        setState((s) => ({
          ...s,
          data: [],
          firstDoc: null,
          lastDoc: null,
          loading: false,
          error: err as Error,
        }));
      },
    );

    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, cursorKey]);

  // Conteo total — se ejecuta solo cuando cambian filtros (no cuando cambia la página)
  useEffect(() => {
    let cancelled = false;
    const constraints = buildFilterConstraints(filters);
    const countQuery = query(collection(db, "registros"), ...constraints);
    getCountFromServer(countQuery)
      .then((snap) => {
        if (!cancelled) {
          setState((s) => ({ ...s, total: snap.data().count }));
        }
      })
      .catch((err) => {
        console.warn("[useRegistros] count error:", err);
        if (!cancelled) setState((s) => ({ ...s, total: null }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  return state;
}
