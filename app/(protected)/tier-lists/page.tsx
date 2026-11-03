import { TierListBoard } from "@/app/tier-lists/tier-list-board";

export default function TierListsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl min-w-0 flex-col items-center gap-6 p-4 sm:p-6 lg:p-10 wrap-anywhere">
      <div className="text-center gap-2 flex flex-col">
        <h1 className="text-l font-semibold">Monte seu tier list de jogos</h1>
        <p className="text-sm text-zinc-400">
          Busque jogos, arraste para as colunas e organize do seu jeito.
        </p>
      </div>

      <TierListBoard />
    </main>
  );
}
