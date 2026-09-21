import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isResetTokenValid } from "@/lib/password-reset";

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
  // Check the link up front so an expired/used one says so immediately,
  // instead of letting the person type a new password and only then fail.
  const valid = token ? await isResetTokenValid(token) : false;

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
          {token && valid ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este enlace no es válido, ya se usó o venció. Por seguridad los enlaces duran 1 hora y
                se pueden usar una sola vez.
              </p>
              <a
                href="/cuenta/recuperar"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Pedir un nuevo enlace
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
