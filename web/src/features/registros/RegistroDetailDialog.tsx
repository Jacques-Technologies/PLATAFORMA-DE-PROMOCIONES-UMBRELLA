import { useEffect, useState } from "react";
import { ref, getDownloadURL } from "firebase/storage";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download } from "lucide-react";
import { storage } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/Dialog";
import { ClasificacionText } from "@/components/ClasificacionBadge";
import type { Registro } from "./types";

function formatDate(ts: Registro["Fecha_registro"] | null) {
  if (!ts) return "—";
  return format(ts.toDate(), "EEE dd/MMM/yy HH:mm", { locale: es });
}

function formatMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

function FieldBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--color-texto-soft)]">
        {label}
      </span>
      <div className="flex h-10 items-center rounded-[var(--radius-input)] border border-[var(--color-gris-4)] bg-[var(--color-gris)] px-3 text-sm text-[var(--color-texto)]">
        {children}
      </div>
    </div>
  );
}

interface Props {
  registro: Registro | null;
  onClose: () => void;
}

export function RegistroDetailDialog({ registro, onClose }: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgUrl(null);
    setImgError(false);
    if (!registro) return;
    // Si ya tenemos una signed URL persistida, úsala directo.
    if (registro.Archivo_url) {
      setImgUrl(registro.Archivo_url);
      return;
    }
    // Fallback: regenerar URL desde el path GCS (si existe).
    if (registro.Archivo_path) {
      getDownloadURL(ref(storage, registro.Archivo_path))
        .then(setImgUrl)
        .catch(() => setImgError(true));
      return;
    }
    setImgError(true);
  }, [registro?.Archivo_url, registro?.Archivo_path, registro]);

  const isHuevoCampeon = registro?.campania === "huevo_campeon";

  return (
    <Dialog open={registro !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[min(92vw,720px)] max-h-[90vh] overflow-y-auto p-6">
        {registro && (
          <>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">Detalle de registro</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-x-4 gap-y-4">
              <FieldBox label="ID de registro">
                <span className="font-mono">{registro.ID_registro}</span>
              </FieldBox>
              <FieldBox label="Fecha y hora registro">
                {formatDate(registro.Fecha_registro)}
              </FieldBox>
              <FieldBox label="Estado de registro">
                <ClasificacionText value={registro.Clasificacion_registro} />
              </FieldBox>

              <FieldBox label="Nombre del participante">
                {registro.Nombre_registro}
              </FieldBox>
              <FieldBox label="Número de WhatsApp">
                {registro.Whatsapp_registro}
              </FieldBox>
              <FieldBox label="¿Respondió correcto?">
                {registro.Trivia_registro === "yes" ? "Sí" : "No"}
              </FieldBox>

              {!isHuevoCampeon && (
                <FieldBox label="Fecha y hora de Ticket">
                  {formatDate(registro.Fecha_ticket)}
                </FieldBox>
              )}
              <FieldBox label="Folio de Ticket">
                {registro.Folio_ticket ?? "—"}
              </FieldBox>
              {!isHuevoCampeon && (
                <FieldBox label="Sucursal">
                  {registro.Sucursal_ticket ?? "—"}
                </FieldBox>
              )}

              {!isHuevoCampeon && (
                <FieldBox label="Monto total">
                  {formatMoney(registro.Monto_ticket)}
                </FieldBox>
              )}
              {!isHuevoCampeon && (
                <FieldBox label="KG">
                  {registro.Kg_bistec != null
                    ? `${registro.Kg_bistec.toLocaleString("es-MX", { maximumFractionDigits: 3 })} kg`
                    : "—"}
                </FieldBox>
              )}
              <FieldBox label="Archivo de Ticket">
                {imgUrl ? (
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--color-primario-soft)] hover:underline"
                  >
                    <Download className="size-3.5" /> Descargar aquí
                  </a>
                ) : imgError ? (
                  <span className="text-[var(--color-gris-2)]">No disponible</span>
                ) : (
                  <span className="text-[var(--color-gris-2)]">Cargando...</span>
                )}
              </FieldBox>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
