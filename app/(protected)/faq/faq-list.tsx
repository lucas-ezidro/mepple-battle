"use client";

import { useId, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameThumbnail } from "@/components/ranks/game-thumbnail";
import type { SocialFaqQuestion } from "@/lib/social-schema";
import { LikeButton, SocialErrorNotice, useSocialPages, UserLink } from "@/components/social/shared";
import { CommentList } from "@/components/social/comments";

function matchesSearch(question: SocialFaqQuestion, search: string) {
  return question.title.toLowerCase().includes(search)
    || question.body.toLowerCase().includes(search)
    || (question.theme?.toLowerCase().includes(search) ?? false)
    || (question.game?.name.toLowerCase().includes(search) ?? false);
}

function QuestionCard({ question }: { question: SocialFaqQuestion }) {
  const [comments, setComments] = useState(false);
  return (
    <article aria-label={`Dúvida: ${question.title}`} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <UserLink user={question.author} />
      <div className="min-w-0">
        <h2 className="font-semibold wrap-anywhere">{question.title}</h2>
        <time dateTime={question.createdAt} className="text-xs text-muted-foreground">
          {new Date(question.createdAt).toLocaleString("pt-BR")}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-sm wrap-anywhere">{question.body}</p>
      {(question.theme || question.game) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {question.theme && <span className="rounded-full border border-border px-2 py-0.5">{question.theme}</span>}
          {question.game && (
            <span className="flex items-center gap-1.5 rounded-full border border-border py-0.5 pr-2 pl-0.5">
              <GameThumbnail src={question.game.thumb} name={question.game.name} size={28} decorative />
              {question.game.name}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-start gap-2 border-t border-border pt-3">
        <LikeButton id={question.id} kind="faq" initial={question.likes} />
        <Button variant="ghost" size="sm" aria-expanded={comments} onClick={() => setComments(!comments)}>
          <MessageCircle aria-hidden="true" /> Respostas ({question.commentCount})
        </Button>
      </div>
      {comments && <CommentList postKind="faq" postId={question.id} />}
    </article>
  );
}

export function FaqList() {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const query = useSocialPages<SocialFaqQuestion>("/api/faq", ["faq-questions", "/api/faq"]);
  const questions = query.data?.pages.flatMap((page) => page.items) ?? [];
  const trimmedSearch = search.trim().toLowerCase();
  const filtered = trimmedSearch ? questions.filter((question) => matchesSearch(question, trimmedSearch)) : questions;

  return (
    <section aria-label="Dúvidas sobre jogos" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={searchId}>Buscar por tema ou jogo</Label>
        <Input id={searchId} value={search} onChange={(event) => setSearch(event.target.value)}
          placeholder="Ex: regras, estratégia, Catan" autoComplete="off" />
      </div>
      {query.isPending && <p role="status" className="text-sm text-muted-foreground">Carregando dúvidas...</p>}
      {query.error && <SocialErrorNotice error={query.error} retry={() => { void query.refetch(); }} />}
      {!query.isPending && !query.error && filtered.length === 0 && (
        <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
          {questions.length === 0
            ? "Ainda não há dúvidas publicadas. Seja o primeiro a perguntar!"
            : "Nenhuma dúvida encontrada para essa busca."}
        </p>
      )}
      <div className="flex min-w-0 flex-col gap-4">
        {filtered.map((question) => <QuestionCard key={question.id} question={question} />)}
      </div>
      {query.hasNextPage && (
        <Button variant="outline" disabled={query.isFetching} onClick={() => { void query.fetchNextPage(); }}>
          {query.isFetchingNextPage ? "Carregando..." : "Carregar mais dúvidas"}
        </Button>
      )}
    </section>
  );
}
