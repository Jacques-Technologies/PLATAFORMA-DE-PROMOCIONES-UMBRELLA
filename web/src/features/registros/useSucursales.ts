import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SucursalParticipante {
  numero: string;
  nombre: string;
  activa: boolean;
}

export function useSucursales() {
  const [data, setData] = useState<SucursalParticipante[]>([]);

  useEffect(() => {
    return onSnapshot(
      collection(db, "sucursales_participantes"),
      (snap) => {
        setData(
          snap.docs
            .map((d) => d.data() as SucursalParticipante)
            .filter((s) => s.activa)
            .sort((a, b) => a.numero.localeCompare(b.numero)),
        );
      },
      () => setData([]),
    );
  }, []);

  return data;
}
