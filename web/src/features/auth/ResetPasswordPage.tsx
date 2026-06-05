import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Lock, Check } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/Button";
import { InputTextField } from "@/components/InputTextField";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { AuthLayout } from "./AuthLayout";

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = params.get("oobCode");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!oobCode) {
      setCodeError("Liga inválida o expirada.");
      return;
    }
    verifyPasswordResetCode(auth, oobCode).catch(() =>
      setCodeError("Liga inválida o expirada."),
    );
  }, [oobCode]);

  const onSubmit = async (values: FormValues) => {
    if (!oobCode) return;
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      setDone(true);
    } catch {
      setCodeError("No se pudo cambiar la contraseña. Solicita una liga nueva.");
    }
  };

  return (
    <AuthLayout greeting="Nueva contraseña">
      <p className="text-sm text-[var(--color-texto-soft)]">
        Define una contraseña segura para tu cuenta.
      </p>
      {codeError ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-input)] border border-[var(--color-rojo)]/40 bg-[var(--color-rojo)]/10 px-3 py-2 text-sm text-[var(--color-rojo)]">
            {codeError}
          </div>
          <Link
            to="/forgot-password"
            className="text-center text-sm text-[var(--color-primario-soft)] hover:underline"
          >
            Solicitar liga nueva
          </Link>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <InputTextField
            label="Ingrese nueva contraseña"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="size-4" />}
            error={errors.password?.message}
            {...register("password")}
          />
          <InputTextField
            label="Confirme contraseña"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="size-4" />}
            error={errors.confirm?.message}
            {...register("confirm")}
          />
          <Button type="submit" width="full" loading={isSubmitting}>
            Confirmar
          </Button>
        </form>
      )}

      <Dialog open={done} onOpenChange={(open) => !open && navigate("/login")}>
        <DialogContent hideClose className="bg-[var(--color-fondo-2)]">
          <div className="flex flex-col items-center gap-6 py-2 text-center">
            <span className="inline-flex items-center justify-center rounded-md bg-[var(--color-verde)] p-2.5">
              <Check className="size-4.5 text-[var(--color-blanco)]" strokeWidth={3} />
            </span>
            <h2 className="text-2xl font-semibold text-[var(--color-blanco)]">
              Nueva contraseña lista
            </h2>
            <p className="text-sm text-[var(--color-blanco)]">
              Tu contraseña fue actualizada con éxito. Inicia sesión para continuar.
            </p>
            <Button variant="success" width="full" onClick={() => navigate("/login")}>
              Ir a Iniciar sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
