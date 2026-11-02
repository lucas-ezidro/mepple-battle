import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { LudopediaNotice } from "@/components/auth/ludopedia-notice";

async function RequireSession({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return <><Suspense fallback={null}><LudopediaNotice /></Suspense>{children}</>;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-muted-foreground" role="status">Verificando sessão...</p>}>
      <RequireSession>{children}</RequireSession>
    </Suspense>
  );
}
