"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameThumbnail } from "@/components/ranks/game-thumbnail";
import { COLUMN_COLORS } from "@/app/tier-lists/helpers";
import type { SocialFeedItem, SocialPost, SocialTierListPost } from "@/lib/social-schema";
import { LikeButton, SocialErrorNotice, useSocialPages, UserLink } from "./shared";
import { CommentList } from "./comments";

function RankPost({ post }: { post: SocialPost }) {
  const [comments, setComments] = useState(false);
  return (
    <article aria-label={`Top ${post.type}`} className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <UserLink user={post.author} />
      <div className="flex min-w-0 items-center gap-3">
        {post.games[0] && (
          <GameThumbnail src={post.games[0].thumb} name={post.games[0].name} size={36} />
        )}
        <div className="min-w-0">
          <h2 className="font-semibold wrap-anywhere">Top {post.type}{post.type === "100"
            ? post.year ? ` de ${post.year}` : "" : post.theme ? ` — ${post.theme}` : ""}</h2>
          <time dateTime={post.createdAt} className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleString("pt-BR")}
          </time>
        </div>
      </div>
      <details className="min-w-0">
        <summary className="cursor-pointer text-sm">Ver jogos ({post.games.length})</summary>
        {post.games.length ? (
          <ol className="mt-3 flex min-w-0 flex-col gap-2">
            {post.games.map((game, index) => (
              <li key={`${game.gameId}-${index}`} className="flex min-w-0 items-center gap-2 text-sm">
                <span className="w-6 shrink-0 text-muted-foreground">{index + 1}º</span>
                <GameThumbnail src={game.thumb} name={game.name} size={28} decorative />
                <span className="min-w-0 wrap-anywhere">{game.name}</span>
              </li>
            ))}
          </ol>
        ) : <p className="mt-2 text-sm text-muted-foreground">Este top ainda não possui jogos.</p>}
      </details>
      <div className="flex flex-wrap items-start gap-2 border-t border-border pt-3">
        <LikeButton id={post.id} kind="rank" initial={post.likes} />
        <Button variant="ghost" size="sm" aria-expanded={comments} onClick={() => setComments(!comments)}>
          <MessageCircle aria-hidden="true" /> Comentários ({post.commentCount})
        </Button>
      </div>
      {comments && <CommentList postKind="rank" postId={post.id} />}
    </article>
  );
}

function TierListPost({ post }: { post: SocialTierListPost }) {
  const [comments, setComments] = useState(false);
  return (
    <article aria-label="Tier list" className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <UserLink user={post.author} />
      <div className="min-w-0">
        <h2 className="font-semibold wrap-anywhere">Tier list</h2>
        <time dateTime={post.createdAt} className="text-xs text-muted-foreground">
          {new Date(post.createdAt).toLocaleString("pt-BR")}
        </time>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        {post.columns.map((column, index) => (
          <div key={`${column.label}-${index}`} className="flex min-w-0 items-stretch overflow-hidden rounded-md border border-border">
            <div className={`flex w-16 shrink-0 items-center justify-center p-1 ${COLUMN_COLORS[index % COLUMN_COLORS.length]}`}>
              <span className="w-full min-w-0 truncate text-center text-sm font-bold text-white">{column.label}</span>
            </div>
            <ul className="flex min-h-14 min-w-0 flex-1 flex-wrap items-center gap-1.5 bg-muted/40 p-1.5">
              {column.games.length ? column.games.map((game) => (
                <li key={game.gameId}>
                  <GameThumbnail src={game.thumb} name={game.name} size={28} decorative />
                </li>
              )) : <li className="text-xs text-muted-foreground">Vazio</li>}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-2 border-t border-border pt-3">
        <LikeButton id={post.id} kind="tier-list" initial={post.likes} />
        <Button variant="ghost" size="sm" aria-expanded={comments} onClick={() => setComments(!comments)}>
          <MessageCircle aria-hidden="true" /> Comentários ({post.commentCount})
        </Button>
      </div>
      {comments && <CommentList postKind="tier-list" postId={post.id} />}
    </article>
  );
}

function Post({ post }: { post: SocialFeedItem }) {
  return post.kind === "tier-list" ? <TierListPost post={post} /> : <RankPost post={post} />;
}

export function PostStream({ path, emptyMessage }: { path: string; emptyMessage: string }) {
  const query = useSocialPages<SocialFeedItem>(path, ["posts", path]);
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetching, error, fetchNextPage } = query;
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNextPage || isFetching || error || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { void fetchNextPage(); }
    }, { rootMargin: "200px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, error, fetchNextPage]);
  const posts = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <section aria-label="Tops publicados" className="flex min-w-0 flex-col gap-4">
      {posts.map((post) => <Post key={post.id} post={post} />)}
      {query.isPending && <p role="status" className="text-sm text-muted-foreground">Carregando tops...</p>}
      {query.error && <SocialErrorNotice error={query.error} retry={() => { void query.refetch(); }} />}
      {!query.isPending && !query.error && !posts.length && (
        <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">{emptyMessage}</p>
      )}
      <div ref={sentinel} aria-hidden="true" />
      {hasNextPage && <Button variant="outline" disabled={isFetching} onClick={() => { void fetchNextPage(); }}>
        {query.isFetchingNextPage ? "Carregando..." : "Carregar mais tops"}
      </Button>}
      {!hasNextPage && posts.length > 0 && <p className="text-center text-sm text-muted-foreground">Você viu todos os tops.</p>}
    </section>
  );
}
