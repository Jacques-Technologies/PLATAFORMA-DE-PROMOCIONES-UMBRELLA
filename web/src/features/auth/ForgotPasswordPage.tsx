import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { Mail, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/Button";
import { InputTextField } from "@/components/InputTextField";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { AuthLayout } from "./AuthLayout";

const schema = z.object({ email: z.string().email("Correo no válido") });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      auth.languageCode = "es";
      await sendPasswordResetEmail(auth, values.email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
    } catch {
      // Por seguridad mostramos el dialog igual aunque el correo no exista
    } finally {
      setOpen(true);
    }
  };

  return (
    <AuthLayout greeting="¿Olvidaste tu contraseña?">
      <p className="text-sm text-[var(--color-texto-soft)]">
        Ingrese su correo para enviarle una liga y restablecer la contraseña.
      </p>
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
        <Button type="submit" width="full" loading={isSubmitting}>
          Enviar
        </Button>
      </form>
      <Link
        to="/login"
        className="inline-flex items-center justify-center gap-1 text-sm text-[var(--color-primario-soft)] hover:underline"
      >
        <ArrowLeft className="size-4" /> Ir a Iniciar sesión
      </Link>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Correo enviado</DialogTitle>
          <DialogDescription>
            Se ha enviado el correo para restablecer la contraseña. Por favor, revise su bandeja de
            entrada.
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
