"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { CustomerLoginForm } from "@/components/auth/customer-login-form";

export function LoginPageContent() {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-card">
      <h1 className="mb-1 text-xl font-semibold text-foreground">Ingresar</h1>
      <p className="mb-6 text-sm text-muted-foreground">Accedé a tu cuenta para ver tus consultas.</p>
      <CustomerLoginForm onSuccess={() => router.push("/")} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <Link href="/cuenta/registro" className="text-primary hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
