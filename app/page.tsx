import { Suspense } from "react";
import { HomeActions } from "@/components/auth/session-controls";
import { getCurrentSession } from "@/lib/session";
import { Feed } from "@/components/social/feed";

async function HomeContent() {
  if (await getCurrentSession()) return <Feed />;
  return (
    <main className="mx-auto flex w-full max-w-3xl min-w-0 flex-col items-center gap-6 p-4 text-center sm:p-6 lg:p-10 wrap-anywhere">
      <h1 className="text-3xl font-bold">A Batalha dos Meeples</h1>
      <p className="max-w-xl text-muted-foreground">
        Organize seus jogos favoritos, crie seus tops e compartilhe sua paixão por jogos de tabuleiro.
      </p>
      <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Carregando...</p>}>
        <HomeActions />
      </Suspense>
    </main>
  )
}

export default function Home() {
  return <Suspense fallback={<p role="status" className="p-4 text-sm text-muted-foreground">Carregando...</p>}>
    <HomeContent />
  </Suspense>;
}
