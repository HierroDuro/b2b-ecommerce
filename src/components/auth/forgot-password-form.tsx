"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/actions/customer-auth-actions";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/customer-auth.schema";

/** Matches the server-side cooldown between two reset emails. */
const RESEND_SECONDS = 60;

export function ForgotPasswordForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<{ email: string; masked: string } | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const [resending, setResending] = React.useState(false);
  // Set only when no mailbox is configured: the link is shown instead of emailed.
  const [resetUrl, setResetUrl] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const send = async (email: string) => {
    setServerError(null);
    const result = await requestPasswordReset({ email });

    if (!result.success) {
      setServerError(result.message);
      return false;
    }

    if (result.resetUrl) {
      setResetUrl(result.resetUrl);
      return true;
    }

    setSentTo({ email, masked: result.maskedEmail ?? email });
    setSecondsLeft(RESEND_SECONDS);
    return true;
  };

  const onSubmit = async (values: ForgotPasswordInput) => {
    await send(values.email);
  };

  const onResend = async () => {
    if (!sentTo || secondsLeft > 0) return;
    setResending(true);
    await send(sentTo.email);
    setResending(false);
  };

  if (resetUrl) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-7 w-7" />
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Tu enlace está listo</h2>
          <p className="text-sm text-muted-foreground">
            Tocá el botón para elegir una contraseña nueva. El enlace vale 1 hora y se puede usar
            una sola vez.
          </p>
        </div>
        <a
          href={resetUrl}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Elegir nueva contraseña
        </a>
        <button
          type="button"
          onClick={() => setResetUrl(null)}
          className="w-full text-sm text-primary hover:underline"
        >
          Usar otro email
        </button>
      </div>
    );
  }

  if (sentTo) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-7 w-7" />
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Revisá tu correo</h2>
          <p className="text-sm text-muted-foreground">
            Si <strong className="text-foreground">{sentTo.masked}</strong> está registrado, te
            enviamos un correo con las instrucciones para elegir una contraseña nueva.
          </p>
          <p className="text-xs text-muted-foreground">
            El enlace vence en 1 hora. Si no lo ves, fijate en la carpeta de spam.
          </p>
        </div>

        {serverError && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {serverError}
          </p>
        )}

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={secondsLeft > 0 || resending}
            onClick={onResend}
          >
            {resending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : secondsLeft > 0 ? (
              `Reenviar correo en ${secondsLeft} s`
            ) : (
              "Reenviar correo"
            )}
          </Button>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="w-full text-sm text-primary hover:underline"
          >
            Usar otro email
          </button>
        </div>

      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Ingresá el email de tu cuenta y te ayudamos a elegir una contraseña nueva.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">Email</Label>
        <Input id="forgot-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {serverError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
      </Button>
    </form>
  );
}
