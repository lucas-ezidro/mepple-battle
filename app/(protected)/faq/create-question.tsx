"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFaqQuestion } from "@/client/faq-api";
import { getLudopediaGames, type LudopediaGamesResponse } from "@/client/get-ludopedia-games";
import { faqQuestionInputSchema } from "@/lib/faq-schema";
import { SocialErrorNotice } from "@/components/social/shared";

interface SelectedGame {
  gameId: number;
  name: string;
  thumb: string;
}

export function CreateQuestion() {
  const id = useId();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [theme, setTheme] = useState("");
  const [game, setGame] = useState<SelectedGame | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LudopediaGamesResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedQuery = query.trim();
  useEffect(() => {
    if (trimmedQuery.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);
      getLudopediaGames(trimmedQuery, { signal: controller.signal })
        .then((games) => setResults(games))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setResults([]);
        })
        .finally(() => setIsSearching(false));
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = faqQuestionInputSchema.safeParse({
      title, body, theme: theme.trim() || undefined, game: game ?? undefined,
    });
    if (!parsed.success) {
      setError(new Error(parsed.error.issues[0].message));
      return;
    }
    setPending(true);
    setError(null);
    try {
      await createFaqQuestion(parsed.data);
      setTitle("");
      setBody("");
      setTheme("");
      setGame(null);
      setQuery("");
      await queryClient.invalidateQueries({ queryKey: ["faq-questions"] });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Não foi possível publicar sua dúvida."));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tire sua dúvida sobre jogos de tabuleiro</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-title`}>Título</Label>
            <Input id={`${id}-title`} value={title} onChange={(event) => setTitle(event.target.value)}
              maxLength={140} required placeholder="Ex: Como funciona o desempate no Catan?" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-body`}>Descreva sua dúvida</Label>
            <textarea id={`${id}-body`} value={body} onChange={(event) => setBody(event.target.value)}
              maxLength={4000} required rows={4}
              className="w-full min-w-0 resize-y rounded-md border border-input bg-background p-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-theme`}>Tema (opcional)</Label>
            <Input id={`${id}-theme`} value={theme} onChange={(event) => setTheme(event.target.value)}
              maxLength={60} placeholder="Ex: regras, estratégia, componentes" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-game`}>Jogo relacionado (opcional)</Label>
            {game ? (
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-border p-2">
                <Image src={game.thumb} alt="" width={28} height={28} unoptimized
                  className="size-7 shrink-0 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm">{game.name}</span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remover jogo selecionado"
                  onClick={() => setGame(null)}>
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <Input id={`${id}-game`} value={query} onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar jogo na Ludopedia" autoComplete="off" />
                {isSearching && <span className="text-xs text-muted-foreground">Buscando jogos...</span>}
                {trimmedQuery.length >= 2 && results.length > 0 && (
                  <ul className="flex flex-col overflow-hidden rounded-md border border-border">
                    {results.map((result) => (
                      <li key={result.id_jogo}>
                        <button type="button" onClick={() => {
                          setGame({ gameId: result.id_jogo, name: result.nm_jogo, thumb: result.thumb });
                          setQuery("");
                          setResults([]);
                        }} className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-muted">
                          <Image src={result.thumb} alt="" width={28} height={28} unoptimized
                            className="size-7 shrink-0 rounded object-cover" />
                          <span className="min-w-0 flex-1">{result.nm_jogo}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
          {error && <SocialErrorNotice error={error} />}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Publicando..." : "Publicar dúvida"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
