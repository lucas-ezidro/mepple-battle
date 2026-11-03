"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getLudopediaGames, type LudopediaGamesResponse } from "@/client/get-ludopedia-games";
import { getTierList, publishTierList, saveTierList } from "@/client/tier-list-api";
import { GameCard } from "./game-card";
import {
  COLUMN_COLORS,
  addColumn,
  addGameToPool,
  allGameIds,
  boardFromDTO,
  boardToUpdateInput,
  createDefaultBoard,
  moveGame,
  removeColumn,
  removeGame,
  renameColumn,
  type ContainerId,
  type TierBoard,
} from "./helpers";

type LoadState = "loading" | "unauthenticated" | "error" | "ready";

export function TierListBoard() {
  const [state, setState] = useState<LoadState>("loading");
  const [board, setBoard] = useState<TierBoard>(createDefaultBoard);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LudopediaGamesResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ container: ContainerId; index: number } | null>(null);
  const skipNextSave = useRef(true);

  const fetchTierList = () => {
    getTierList()
      .then((dto) => {
        skipNextSave.current = true;
        setBoard(boardFromDTO(dto));
        setState("ready");
      })
      .catch((error: unknown) => {
        setState(error instanceof Error && error.message === "not_authenticated" ? "unauthenticated" : "error");
      });
  };

  const publish = () => {
    setPublishStatus("publishing");
    setPublishError(null);
    publishTierList()
      .then(() => setPublishStatus("success"))
      .catch((error: unknown) => {
        setPublishStatus("error");
        setPublishError(error instanceof Error ? error.message : "Falha ao publicar o tier list");
      });
  };

  useEffect(() => {
    fetchTierList();
  }, []);

  const retryLoad = () => {
    setState("loading");
    fetchTierList();
  };

  useEffect(() => {
    if (state !== "ready") return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      saveTierList(boardToUpdateInput(board))
        .then(() => setSaveStatus("idle"))
        .catch((error: unknown) => {
          if (error instanceof Error && error.message === "not_authenticated") {
            setState("unauthenticated");
          } else {
            setSaveStatus("error");
          }
        });
    }, 600);

    return () => clearTimeout(timer);
  }, [board, state]);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);
      getLudopediaGames(trimmedQuery, { signal: controller.signal })
        .then((games) => {
          setResults(games);
          setSearchError(null);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          if (err instanceof Error && err.message === "not_authenticated") {
            setState("unauthenticated");
          } else {
            setSearchError(err instanceof Error ? err.message : "Não foi possível buscar jogos");
          }
        })
        .finally(() => setIsSearching(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  const selectedIds = allGameIds(board);
  const filteredResults =
    trimmedQuery.length < 2 ? [] : results.filter((game) => !selectedIds.has(game.id_jogo));

  const addGame = (game: LudopediaGamesResponse) => {
    setBoard((prev) => addGameToPool(prev, { gameId: game.id_jogo, name: game.nm_jogo, thumb: game.thumb }));
    setQuery("");
  };

  const handlePointerDown = (gameId: number) => (event: React.PointerEvent<HTMLSpanElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingId(gameId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (draggingId === null) return;
    const el = document.elementFromPoint(event.clientX, event.clientY);
    const containerEl = (el?.closest("[data-tier-container]") ?? null) as HTMLElement | null;
    if (!containerEl) {
      setDropTarget(null);
      return;
    }

    const container = containerEl.dataset.tierContainer as ContainerId;
    const itemEl = (el?.closest("[data-tier-game]") ?? null) as HTMLElement | null;
    let index: number;
    if (itemEl && containerEl.contains(itemEl)) {
      const rect = itemEl.getBoundingClientRect();
      const isAfter = event.clientX > rect.left + rect.width / 2;
      index = Number(itemEl.dataset.tierIndex) + (isAfter ? 1 : 0);
    } else {
      index = containerEl.querySelectorAll("[data-tier-game]").length;
    }
    setDropTarget({ container, index });
  };

  const handlePointerUp = () => {
    if (draggingId !== null && dropTarget) {
      const gameId = draggingId;
      const target = dropTarget;
      setBoard((prev) => moveGame(prev, gameId, target.container, target.index));
    }
    setDraggingId(null);
    setDropTarget(null);
  };

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Spinner /> Carregando tier list...
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="items-start gap-2">
          <p className="text-sm text-muted-foreground">Sua sessão expirou. Entre novamente.</p>
          <a href="/login?next=%2Ftier-lists" className={buttonVariants()}>Entrar</a>
        </CardContent>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="items-start gap-2">
          <p className="text-sm text-destructive" role="alert">Não foi possível carregar seu tier list.</p>
          <Button type="button" variant="outline" onClick={retryLoad}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2">
        {board.columns.map((column, index) => (
          <div key={column.id} className="flex min-w-0 items-stretch overflow-hidden rounded-md border border-border">
            <div
              className={cn(
                "flex w-16 shrink-0 items-center justify-center p-1",
                COLUMN_COLORS[index % COLUMN_COLORS.length]
              )}
            >
              <input
                value={column.label}
                maxLength={40}
                aria-label={`Título da coluna ${index + 1}`}
                onChange={(e) => setBoard((prev) => renameColumn(prev, column.id, e.target.value))}
                className="w-full min-w-0 bg-transparent text-center text-sm font-bold text-white outline-none"
              />
            </div>
            <ul
              data-tier-container={`column:${column.id}`}
              className={cn(
                "flex min-h-14 min-w-0 flex-1 flex-wrap items-start gap-1.5 bg-card p-1.5",
                dropTarget?.container === `column:${column.id}` && "bg-muted"
              )}
            >
              {column.games.map((game, gameIndex) => (
                <GameCard
                  key={game.gameId}
                  game={game}
                  index={gameIndex}
                  isDragging={draggingId === game.gameId}
                  onRemove={(gameId) => setBoard((prev) => removeGame(prev, gameId))}
                  onPointerDown={handlePointerDown(game.gameId)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                />
              ))}
            </ul>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remover coluna ${column.label}`}
              className="m-1 shrink-0 self-start"
              onClick={() => setBoard((prev) => removeColumn(prev, column.id))}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setBoard((prev) => addColumn(prev))}
        >
          <Plus /> Adicionar coluna
        </Button>
      </div>

      <div className="flex flex-col items-start gap-1.5">
        <Button
          type="button"
          size="sm"
          disabled={!board.columns.some((column) => column.games.length > 0) || publishStatus === "publishing"}
          onClick={publish}
        >
          {publishStatus === "publishing" && <Spinner />} Publicar no feed
        </Button>
        {publishStatus === "success" && <span className="text-xs text-muted-foreground">Publicado no feed!</span>}
        {publishStatus === "error" && <span role="alert" className="text-xs text-destructive">{publishError}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tier-list-search">Buscar jogo</Label>
        <Input
          id="tier-list-search"
          placeholder="Ex: Catan"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {trimmedQuery.length > 0 && trimmedQuery.length < 2 && (
          <span className="text-xs text-muted-foreground">Digite ao menos 2 letras para buscar</span>
        )}
        {isSearching && <span className="text-xs text-muted-foreground">Buscando jogos...</span>}
        {searchError && <span role="alert" className="text-xs text-destructive">{searchError}</span>}
        {filteredResults.length > 0 && (
          <ul className="flex flex-col overflow-hidden rounded-md border border-border">
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
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Jogos selecionados ({board.pool.length})</h2>
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground" role="status">
              <Spinner /> Salvando...
            </span>
          )}
          {saveStatus === "error" && <span className="text-xs text-destructive" role="alert">Falha ao salvar</span>}
        </div>
        <ul
          data-tier-container="pool"
          className={cn(
            "flex min-h-16 flex-wrap items-start gap-1.5 rounded-md border border-dashed border-border p-2",
            dropTarget?.container === "pool" && "bg-muted"
          )}
        >
          {board.pool.length === 0 && (
            <li className="text-xs text-muted-foreground">Busque e selecione jogos para começar.</li>
          )}
          {board.pool.map((game, index) => (
            <GameCard
              key={game.gameId}
              game={game}
              index={index}
              isDragging={draggingId === game.gameId}
              onRemove={(gameId) => setBoard((prev) => removeGame(prev, gameId))}
              onPointerDown={handlePointerDown(game.gameId)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
