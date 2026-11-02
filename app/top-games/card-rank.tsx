'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronDown, Pencil, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { RANK_LABELS } from "./helpers";
import { CreateRank, type RankDraft } from "./create-rank";
import { RankGames } from "./rank-games";
import type { LudopediaGamesResponse } from "@/client/get-ludopedia-games";
import { createRank, deleteRank, getRanks, updateRank, type RankRecord } from "@/client/ranks-api";

type Rank = RankRecord;

export function CardRank() {
  const queryClient = useQueryClient();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<RankDraft | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGames, setEditingGames] = useState<LudopediaGamesResponse[] | undefined>(undefined);
  const hasTop100 = ranks.some((rank) => rank.type === "100");

  useEffect(() => {
    getRanks()
      .then(setRanks)
      .catch((err) => {
        if (err instanceof Error && err.message === "not_authenticated") {
          setNeedsAuth(true);
        } else {
          toast.error("Não foi possível carregar seus tops");
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const closeEditor = () => {
    setDraft(null);
    setEditingId(null);
    setEditingGames(undefined);
  };

  const invalidateSocialRanks = () => {
    void queryClient.invalidateQueries({ queryKey: ["posts"] });
    void queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  const handleFinish = async (games: LudopediaGamesResponse[]) => {
    if (!draft) return;

    setIsSaving(true);
    try {
      const saved = editingId
        ? await updateRank(editingId, draft, games)
        : await createRank(draft, games);

      setRanks((prev) =>
        editingId ? prev.map((rank) => (rank.id === editingId ? saved : rank)) : [...prev, saved]
      );
      closeEditor();
      invalidateSocialRanks();
    } catch (err) {
      if (err instanceof Error && err.message === "not_authenticated") {
        setNeedsAuth(true);
      } else {
        toast.error(err instanceof Error ? err.message : "Falha ao salvar o top");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (rank: Rank) => {
    const { id, games, ...draftData } = rank;
    setEditingId(id);
    setEditingGames(games);
    setDraft(draftData);
    setExpandedId(null);
  };

  const removeRank = async (rank: Rank) => {
    const previous = ranks;
    setRanks((prev) => prev.filter((r) => r.id !== rank.id));

    try {
      await deleteRank(rank.id);
      invalidateSocialRanks();
    } catch (err) {
      setRanks(previous);
      if (err instanceof Error && err.message === "not_authenticated") {
        setNeedsAuth(true);
      } else {
        toast.error(err instanceof Error ? err.message : "Falha ao remover o top");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="mt-24 flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Carregando seus tops...
      </div>
    );
  }

  if (needsAuth) {
    return (
      <Card className="w-full max-w-md mt-24">
        <CardContent className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Sua sessão expirou. Entre novamente para criar e salvar seus tops.
          </p>
          <a href="/login?next=%2Ftop-games" className={buttonVariants()}>
            Entrar
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {draft ? (
        <RankGames
          key={editingId ?? "new"}
          rank={draft}
          initialGames={editingGames}
          onBack={closeEditor}
          onFinish={handleFinish}
          isSaving={isSaving}
        />
      ) : (
        <CreateRank hasTop100={hasTop100} onCreate={setDraft} />
      )}

      <div className="w-full max-w-md flex flex-col gap-2">
        {ranks.map((rank) => {
          const topGame = rank.games[0];
          const isExpanded = expandedId === rank.id;

          return (
            <Card key={rank.id} size="sm">
              <CardContent className="flex-col items-stretch gap-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    {topGame && (
                      <Image
                        src={topGame.thumb}
                        alt={topGame.nm_jogo}
                        width={36}
                        height={36}
                        className="size-9 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex flex-col">
                      <span className="text-sm font-medium">
                        {rank.type === "100" ? rank.year : rank.theme}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {RANK_LABELS[rank.type]}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={isExpanded ? "Fechar top" : "Ver top"}
                    onClick={() => setExpandedId(isExpanded ? null : rank.id)}
                  >
                    <ChevronDown
                      className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
                    />
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                    <ol className="flex flex-col gap-1.5">
                      {rank.games.map((game, index) => (
                        <li key={game.id_jogo} className="flex items-center gap-2 text-sm">
                          <span className="w-6 shrink-0 text-xs font-medium text-muted-foreground">
                            {index + 1}º
                          </span>
                          <Image
                            src={game.thumb}
                            alt={game.nm_jogo}
                            width={28}
                            height={28}
                            className="size-7 shrink-0 rounded object-cover"
                          />
                          <span className="min-w-0 flex-1">{game.nm_jogo}</span>
                        </li>
                      ))}
                    </ol>
                    <Button
                      type="button"
                      className="mt-4"
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(rank)}
                    >
                      <Pencil />
                      Editar rank
                    </Button>
                    
                    <Button
                      type="button"
                      className="mt-4"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRank(rank)}
                    >
                      <Trash />
                      Remover rank
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  )
}
