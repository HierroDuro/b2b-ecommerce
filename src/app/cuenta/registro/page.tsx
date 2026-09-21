import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RegisterPageContent } from "@/components/auth/register-page-content";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto flex max-w-md flex-col justify-center px-6 pb-24"
        style={{ paddingTop: "calc(var(--header-h) + 48px)", minHeight: "70vh" }}
      >
        <RegisterPageContent />
      </main>
      <Footer />
    </div>
  );
}
