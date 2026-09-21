"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  customerLoginSchema,
  type CustomerLoginInput,
} from "@/lib/validations/customer-auth.schema";

interface CustomerLoginFormProps {
  onSuccess: () => void;
  onSwitchToForgotPassword?: () => void;
}

export function CustomerLoginForm({ onSuccess, onSwitchToForgotPassword }: CustomerLoginFormProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerLoginInput>({
    resolver: zodResolver(customerLoginSchema),
  });

  const onSubmit = async (values: CustomerLoginInput) => {
    setServerError(null);
    const result = await signIn("customer", { ...values, redirect: false });

    if (result?.error) {
      setServerError("Email o contraseña incorrectos.");
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Contraseña</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {serverError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
      </Button>

      {/* In the auth dialog the parent swaps views in place; on the standalone
          /cuenta/ingresar page there's no parent callback, so link to the
          recovery page instead — otherwise the option simply never appears. */}
      {onSwitchToForgotPassword ? (
        <button
          type="button"
          onClick={onSwitchToForgotPassword}
          className="w-full text-center text-sm text-primary hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
      ) : (
        <Link
          href="/cuenta/recuperar"
          className="block w-full text-center text-sm text-primary hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      )}
    </form>
  );
}
