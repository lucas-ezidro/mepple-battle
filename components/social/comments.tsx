"use client";

import { useId, useState, type FormEvent } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { socialRequest } from "@/client/social-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { commentInputSchema, type SocialComment, type SocialPage } from "@/lib/social-schema";
import { LikeButton, SocialErrorNotice, useSocialPages, UserLink, userLabel } from "./shared";

export type PostKind = "rank" | "tier-list" | "faq";

const POST_CONFIG: Record<PostKind, { path: string; likeKind: "comment" | "tier-list-comment" | "faq-comment"; listQueryKey: string }> = {
  rank: { path: "ranks", likeKind: "comment", listQueryKey: "posts" },
  "tier-list": { path: "tier-list-posts", likeKind: "tier-list-comment", listQueryKey: "posts" },
  faq: { path: "faq", likeKind: "faq-comment", listQueryKey: "faq-questions" },
};

function postPath(postKind: PostKind, postId: string) {
  return `/api/${POST_CONFIG[postKind].path}/${postId}`;
}

function CommentForm({ postKind, postId, parentId }: {
  postKind: PostKind; postId: string; parentId?: string;
}) {
  const id = useId();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = commentInputSchema.safeParse({ body, ...(parentId ? { parentId } : {}) });
    if (!parsed.success) { setError(new Error(parsed.error.issues[0].message)); return; }
    setPending(true);
    setError(null);
    try {
      const result = await socialRequest<{ id: string; commentCount: number }>(
        `${postPath(postKind, postId)}/comments`, { method: "POST", body: JSON.stringify(parsed.data) });
      setBody("");
      queryClient.setQueriesData<InfiniteData<SocialPage<{ id: string; commentCount: number }>>>({
        queryKey: [POST_CONFIG[postKind].listQueryKey],
      }, (data) => data && ({
        ...data,
        pages: data.pages.map((page) => ({
          ...page, items: page.items.map((post) => post.id === postId ? { ...post, commentCount: result.commentCount } : post),
        })),
      }));
      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Não foi possível publicar o comentário."));
    } finally { setPending(false); }
  };
  return (
    <form onSubmit={submit} className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{parentId ? "Sua resposta" : "Seu comentário"}</Label>
      <textarea id={id} value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000}
        required rows={3} disabled={pending} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        className="w-full min-w-0 resize-y rounded-md border border-input bg-background p-2 text-sm" />
      {error && <div id={`${id}-error`}><SocialErrorNotice error={error} /></div>}
      <Button type="submit" className="self-start" size="sm" disabled={pending || !body.trim()}>
        {pending ? "Publicando..." : parentId ? "Publicar resposta" : "Publicar comentário"}
      </Button>
    </form>
  );
}

function CommentItem({ comment, postKind, postId, level }: {
  comment: SocialComment; postKind: PostKind; postId: string; level: number;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="min-w-0">
      <article aria-label={`Comentário de ${userLabel(comment.author)}`} className="flex min-w-0 flex-col gap-2">
        <UserLink user={comment.author} />
        <p className="whitespace-pre-wrap text-sm wrap-anywhere">{comment.body}</p>
        <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">
          {new Date(comment.createdAt).toLocaleString("pt-BR")}
        </time>
        <div className="flex flex-wrap items-start gap-1">
          <LikeButton id={comment.id} kind={POST_CONFIG[postKind].likeKind} initial={comment.likes} />
          <Button size="sm" variant="ghost" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
            {expanded ? "Ocultar respostas" : comment.replyCount > 0
              ? `Ver respostas (${comment.replyCount})` : "Responder"}
          </Button>
        </div>
        {expanded && (
          <div className={level < 3 ? "min-w-0 ml-1 border-l border-border pl-3" : "min-w-0"}>
            <p className="mb-3 text-xs text-muted-foreground">Respondendo a {userLabel(comment.author)}</p>
            <CommentList postKind={postKind} postId={postId} parentId={comment.id} level={level + 1} />
          </div>
        )}
      </article>
    </li>
  );
}

export function CommentList({ postKind, postId, parentId, level = 0 }: {
  postKind: PostKind; postId: string; parentId?: string; level?: number;
}) {
  const path = `${postPath(postKind, postId)}/comments${parentId ? `?parentId=${encodeURIComponent(parentId)}` : ""}`;
  const query = useSocialPages<SocialComment>(path, ["comments", postId, parentId ?? "root"]);
  const comments = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <section aria-label={parentId ? "Respostas" : "Comentários"} className="flex min-w-0 flex-col gap-4">
      <CommentForm postKind={postKind} postId={postId} parentId={parentId} />
      {query.isPending && <p role="status" className="text-sm text-muted-foreground">Carregando comentários...</p>}
      {query.error && <SocialErrorNotice error={query.error} retry={() => { void query.refetch(); }} />}
      {!query.isPending && !query.error && !comments.length && (
        <p className="text-sm text-muted-foreground">{parentId ? "Nenhuma resposta ainda." : "Seja o primeiro a comentar."}</p>
      )}
      <ul className="flex min-w-0 flex-col gap-5">
        {comments.map((comment) => <CommentItem key={comment.id} comment={comment} postKind={postKind} postId={postId}
          level={level} />)}
      </ul>
      {query.hasNextPage && (
        <Button size="sm" variant="outline" className="self-start" disabled={query.isFetching} onClick={() => { void query.fetchNextPage(); }}>
          {query.isFetchingNextPage ? "Carregando..." : "Mais comentários"}
        </Button>
      )}
    </section>
  );
}
