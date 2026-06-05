import { LogOut, ChevronDown } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/features/auth/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name ?? email ?? "").trim();
  if (!source) return "??";
  const parts = source.replace(/@.+$/, "").split(/[\s.]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function displayName(name: string | null | undefined, email: string | null | undefined) {
  return name?.trim() || email?.split("@")[0] || "Usuario";
}

export function AppHeader() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="flex h-[70px] items-center justify-between bg-[var(--color-fondo-1)] px-8 border-b border-[var(--color-gris-4)]">
      <img src="/assets/logo-blanco.png" alt="JTech" className="h-8 object-contain" />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-[var(--color-gris)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primario-soft)]">
          <span className="flex size-9 items-center justify-center rounded-full bg-[var(--color-primario)] text-sm font-semibold text-[var(--color-blanco)]">
            {initials(user?.displayName, user?.email)}
          </span>
          <span className="hidden flex-col items-start leading-tight md:flex">
            <span className="text-sm font-medium text-[var(--color-blanco)]">
              {displayName(user?.displayName, user?.email)}
            </span>
            <span className="text-xs text-[var(--color-texto-muted)]">¡Qué tal!</span>
          </span>
          <ChevronDown className="size-4 text-[var(--color-gris-2)]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="size-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
