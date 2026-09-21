import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto flex max-w-md flex-col justify-center px-6 pb-24"
        style={{ paddingTop: "calc(var(--header-h) + 48px)", minHeight: "70vh" }}
      >
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="mb-1 text-xl font-semibold text-foreground">Elegir nueva contraseña</h1>
          <div className="mb-6" />
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-destructive">
              Falta el token de recuperación. Pedí un nuevo enlace desde{" "}
              <a href="/cuenta/recuperar" className="text-primary underline">
                acá
              </a>
              .
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
