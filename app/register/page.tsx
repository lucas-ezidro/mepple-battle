import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full min-w-0 justify-center p-4 sm:p-6 lg:p-10 wrap-anywhere">
      <Suspense fallback={<p role="status">Carregando formulário...</p>}>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
