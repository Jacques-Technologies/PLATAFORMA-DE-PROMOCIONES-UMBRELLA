import type { ReactNode } from "react";

export function AuthLayout({
  greeting,
  children,
}: {
  greeting: string;
  children: ReactNode;
}) {
  return (
    <div className="grid h-screen w-screen grid-cols-1 lg:grid-cols-2 bg-[var(--color-fondo-2)]">
      <aside
        className="relative hidden lg:block"
        style={{
          backgroundImage: "url(/assets/login-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div aria-hidden className="absolute inset-0 bg-black/15" />
      </aside>
      <main className="flex items-center justify-center bg-[var(--color-fondo-2)] p-6 lg:p-12">
        <div className="w-full max-w-md flex flex-col gap-6">
          <img
            src="/assets/logo-blanco.png"
            alt="JTech"
            className="h-10 self-start object-contain"
          />
          <h1 className="text-3xl font-semibold text-[var(--color-blanco)]">{greeting}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
