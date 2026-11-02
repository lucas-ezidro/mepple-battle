'use client'

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { RANK_LABELS } from "./helpers";
import type { RankDraft } from "./create-rank";
import { getLudopediaGames, type LudopediaGamesResponse } from "@/client/get-ludopedia-games";

type Game = LudopediaGamesResponse;

interface RankGamesProps {
  rank: RankDraft;
  initialGames?: Game[];
  onBack: () => void;
  onFinish: (games: Game[]) => void;
  isSaving?: boolean;
}

export function RankGames({ rank, initialGames, onBack, onFinish, isSaving }: RankGamesProps) {
  const limit = Number(rank.type);
  const [results, setResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Game[]>(initialGames ?? []);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const draggingIndex = useRef<number | null>(null);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (sessionExpired || trimmedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);
      getLudopediaGames(trimmedQuery, { signal: controller.signal })
        .then((games) => {
          setResults(games);
          setError(null);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          if (err instanceof Error && err.message === "not_authenticated") {
            setSessionExpired(true);
          } else {
            setError(err instanceof Error && !(err instanceof TypeError)
              ? err.message : "Não foi possível buscar jogos");
          }
        })
        .finally(() => setIsSearching(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery, sessionExpired]);

  const isFull = selected.length >= limit;

  const filteredResults =
    trimmedQuery.length < 2
      ? []
      : results.filter((game) => !selected.some((item) => item.id_jogo === game.id_jogo));

  const addGame = (game: Game) => {
    if (isFull) return;
    setSelected((prev) => [...prev, game]);
    setQuery("");
  };

  const removeGame = (id: number) => {
    setSelected((prev) => prev.filter((game) => game.id_jogo !== id));
  };

  const handlePointerDown = (index: number, id: number) => (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingIndex.current = index;
    setDraggingId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const from = draggingIndex.current;
    if (from === null || !listRef.current) return;

    const items = Array.from(listRef.current.children) as HTMLElement[];
    const to = items.findIndex((item) => {
      const rect = item.getBoundingClientRect();
      return e.clientY >= rect.top && e.clientY <= rect.bottom;
    });

    if (to === -1 || to === from) return;

    setSelected((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    draggingIndex.current = to;
  };

  const handlePointerUp = () => {
    draggingIndex.current = null;
    setDraggingId(null);
  };

  return (
    <Card className="w-full max-w-md mt-24">
      <CardHeader>
        <CardTitle>
          {RANK_LABELS[rank.type]}
          {rank.type === "100" ? ` ${rank.year}` : ` - ${rank.theme}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessionExpired ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">Sua sessão expirou. Entre novamente.</p>
            <a href="/login?next=%2Ftop-games" className={buttonVariants()}>Entrar</a>
          </div>
        ) : (
          <>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="game-search">Buscar jogo</Label>
          <Input
            id="game-search"
            placeholder="Ex: Catan"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isFull}
          />
          {trimmedQuery.length > 0 && trimmedQuery.length < 2 && (
            <span className="text-xs text-muted-foreground">
              Digite ao menos 2 letras para buscar
            </span>
          )}
          {isSearching && (
            <span className="text-xs text-muted-foreground">Buscando jogos...</span>
          )}
          {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
          {filteredResults.length > 0 && (
            <ul className="flex flex-col rounded-md border border-border overflow-hidden">
              {filteredResults.map((game) => (
                <li key={game.id_jogo}>
                  <button
                    type="button"
                    onClick={() => addGame(game)}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <Image
                      src={game.thumb}
                      alt={game.nm_jogo}
                      width={28}
                      height={28}
                      draggable={false}
                      className="size-7 shrink-0 rounded object-cover"
                    />
                    <span className="min-w-0 flex-1">{game.nm_jogo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {isFull && (
            <span className="text-xs text-muted-foreground">
              Limite de {limit} jogos atingido
            </span>
          )}
        </div>

        {selected.length > 0 && (
          <ol ref={listRef} className="flex flex-col gap-1.5">
            {selected.map((game, index) => (
              <li
                key={game.id_jogo}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 transition-[transform,box-shadow] duration-150 ease-out",
                  draggingId === game.id_jogo && "relative z-10 scale-105 shadow-lg"
                )}
              >
                <span
                  onPointerDown={handlePointerDown(index, game.id_jogo)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                >
                  <GripVertical className="size-4" />
                </span>
                <span className="w-6 shrink-0 text-sm font-medium text-muted-foreground">
                  {index + 1}º
                </span>
                <Image
                  src={game.thumb}
                  alt={game.nm_jogo}
                  width={28}
                  height={28}
                  draggable={false}
                  className="size-7 shrink-0 rounded object-cover"
                />
                <span className="min-w-0 flex-1 text-sm">{game.nm_jogo}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remover jogo"
                  onClick={() => removeGame(game.id_jogo)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ol>
        )}
          </>
        )}

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex w-full items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
              Voltar
            </Button>
            <Button
              type="button"
              disabled={selected.length !== limit || isSaving}
              onClick={() => onFinish(selected)}
            >
              {isSaving && <Spinner />}
              Concluir
            </Button>
          </div>
          {selected.length !== limit && (
            <span className="text-xs text-muted-foreground">
              Selecione exatamente {limit} jogos para concluir ({selected.length}/{limit})
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
