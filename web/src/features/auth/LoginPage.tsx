import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Mail, Lock } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/Button";
import { InputTextField } from "@/components/InputTextField";
import { useAuth } from "./useAuth";
import { AuthLayout } from "./AuthLayout";

const schema = z.object({
  email: z.string().email("Correo no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
    } catch {
      setServerError(
        "Credenciales incorrectas, intenta de nuevo o da clic en ¿Olvidaste tu contraseña?",
      );
    }
  };

  if (!authLoading && user && isAdmin) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  return (
    <AuthLayout greeting="¡Bienvenido de regreso!">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <InputTextField
          label="Correo"
          type="email"
          placeholder="usuario@ejemplo.com"
          leftIcon={<Mail className="size-4" />}
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <InputTextField
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="size-4" />}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {serverError && (
          <div className="rounded-[var(--radius-input)] border border-[var(--color-rojo)]/40 bg-[var(--color-rojo)]/10 px-3 py-2 text-xs text-[var(--color-rojo)]">
            {serverError}
          </div>
        )}
        <Button type="submit" width="full" loading={isSubmitting}>
          Iniciar sesión
        </Button>
      </form>
      <Link
        to="/forgot-password"
        className="text-center text-sm text-[var(--color-primario-soft)] hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </AuthLayout>
  );
}
