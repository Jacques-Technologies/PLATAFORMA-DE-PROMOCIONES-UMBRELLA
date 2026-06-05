import type { Timestamp } from "firebase/firestore";

export type Clasificacion = "VALIDO" | "INVALIDO";
export type Trivia = "yes" | "no";
export type Campania = "jerseys" | "huevo_campeon";

export interface Registro {
  id: string;
  ID_registro: string;
  campania?: Campania;
  Fecha_registro: Timestamp;
  Nombre_registro: string;
  Whatsapp_registro: string;
  Trivia_registro: Trivia;
  Fecha_ticket: Timestamp | null;
  Folio_ticket: string | null;
  Sucursal_ticket: string | null;
  Monto_ticket: number | null;
  Kg_bistec: number | null;
  Archivo_path?: string | null;
  Archivo_url?: string | null;
  Archivo_url_origen?: string | null;
  Clasificacion_registro: Clasificacion;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface RegistrosFilters {
  fechaRegistroDesde: string;
  fechaRegistroHasta: string;
  fechaTicketDesde: string;
  fechaTicketHasta: string;
  campania: "" | Campania;
  clasificacion: "" | Clasificacion;
  sucursal: string;
  folio: string;
  idRegistro: string;
  nombre: string;
  whatsapp: string;
}

export const emptyFilters: RegistrosFilters = {
  fechaRegistroDesde: "",
  fechaRegistroHasta: "",
  fechaTicketDesde: "",
  fechaTicketHasta: "",
  campania: "",
  clasificacion: "",
  sucursal: "",
  folio: "",
  idRegistro: "",
  nombre: "",
  whatsapp: "",
};

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Default: semana actual (lunes–domingo) + VÁLIDO. */
export function getDefaultFilters(): RegistrosFilters {
  const today = new Date();
  const daysFromMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    ...emptyFilters,
    fechaRegistroDesde: fmtDate(monday),
    fechaRegistroHasta: fmtDate(sunday),
    clasificacion: "VALIDO",
  };
}
