import { useState } from "react";
import { Download } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import type { RegistrosFilters } from "./types";

interface Response {
  url: string;
  filename: string;
  count: string;
  truncated?: string;
  limit?: string;
}

export function ExportButton({ filters }: { filters: RegistrosFilters }) {
  const [loading, setLoading] = useState(false);

  const onExport = async () => {
    setLoading(true);
    try {
      const callable = httpsCallable<RegistrosFilters, Response>(
        functions,
        "export_registros_xls",
      );
      const { data } = await callable(filters);
      if (data.truncated === "true") {
        alert(
          `El archivo incluye solo los primeros ${data.limit} registros (los más recientes). Aplica filtros más estrictos si necesitas ver más.`,
        );
      }
      window.open(data.url, "_blank");
    } catch (err) {
      console.error(err);
      alert("No se pudo generar el XLS. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primario-soft)] hover:underline disabled:opacity-60"
    >
      <Download className="size-4" />
      {loading ? "Generando..." : "Descargar XLS"}
    </button>
  );
}
