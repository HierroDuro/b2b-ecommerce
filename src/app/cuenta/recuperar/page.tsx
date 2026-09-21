import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto flex max-w-md flex-col justify-center px-6 pb-24"
        style={{ paddingTop: "calc(var(--header-h) + 48px)", minHeight: "70vh" }}
      >
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="mb-1 text-xl font-semibold text-foreground">Recuperar contraseña</h1>
          <div className="mb-6" />
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/cuenta/ingresar" className="text-primary hover:underline">
              Volver a ingresar
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
