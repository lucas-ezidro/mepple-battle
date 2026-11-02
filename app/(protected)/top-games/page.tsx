import { CardRank } from "@/app/top-games/card-rank"

export default function TopGames() {
  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 p-4 sm:p-6 lg:p-10 flex flex-col items-center gap-6 scroll-smooth wrap-anywhere">
      <div className="text-center gap-2 flex flex-col">
        <h1 className="text-l font-semibold">A Batalha dos Meeples: qual é o seu Top Jogos?</h1>
        <p className="text-sm text-zinc-400">Organize sua estante, pontue cada partida e monte o pódio definitivo.</p>
      </div>

      <CardRank />
    </main>
  );
}
