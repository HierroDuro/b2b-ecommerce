"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { CustomerRegisterForm } from "@/components/auth/customer-register-form";

export function RegisterPageContent() {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-card">
      <h1 className="mb-1 text-xl font-semibold text-foreground">Crear cuenta</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Registrate para consultar por productos y hacer seguimiento de tus conversaciones.
      </p>
      <CustomerRegisterForm onSuccess={() => router.push("/")} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link href="/cuenta/ingresar" className="text-primary hover:underline">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
