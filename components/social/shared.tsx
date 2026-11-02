"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { QueryClient, QueryClientProvider, useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { CircleUserRound, Heart } from "lucide-react";
import { SocialApiError, socialRequest } from "@/client/social-api";
import { Button } from "@/components/ui/button";
import type { LikeState, SocialComment, SocialPage, SocialPost, SocialUser } from "@/lib/social-schema";

export function SocialProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function useSocialPages<T>(path: string, queryKey: string[]) {
  return useInfiniteQuery({
    queryKey,
    initialPageParam: "",
    queryFn: ({ pageParam, signal }) => {
      const query = pageParam ? `${path.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(pageParam)}` : "";
      return socialRequest<SocialPage<T>>(`${path}${query}`, { signal });
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function SocialErrorNotice({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div role="alert" className="flex min-w-0 flex-col items-start gap-2 text-sm text-destructive wrap-anywhere">
      <p>{error.message}</p>
      {error instanceof SocialApiError && error.status === 401
        ? <a href="/login?next=%2F" className="underline">Entrar</a>
        : retry && <Button variant="outline" size="sm" onClick={retry}>Tentar novamente</Button>}
    </div>
  );
}

export function userLabel(user: SocialUser) {
  return user.fullName || user.username || "Jogador";
}

export function UserLink({ user }: { user: SocialUser }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link href={`/users/${encodeURIComponent(user.id)}`} className="flex min-w-0 items-center gap-2">
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {user.avatarUrl && !failed
          ? <Image src={user.avatarUrl} alt="" width={40} height={40} unoptimized
              referrerPolicy="no-referrer" className="size-full object-cover" onError={() => setFailed(true)} />
          : <CircleUserRound aria-hidden="true" className="size-7 text-muted-foreground" />}
      </span>
      <span className="min-w-0 wrap-anywhere">
        <span className="block text-sm font-medium">{userLabel(user)}</span>
        {user.username && <span className="block text-xs text-muted-foreground">@{user.username}</span>}
      </span>
    </Link>
  );
}

export function LikeButton({ id, kind, initial }: { id: string; kind: "rank" | "comment"; initial: LikeState }) {
  const queryClient = useQueryClient();
  const target = kind === "rank" ? "top" : "comentário";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const like = async () => {
    setPending(true);
    setError(null);
    try {
      const updated = await socialRequest<LikeState>(`/api/${kind === "rank" ? "ranks" : "comments"}/${id}/likes`, {
        method: initial.liked ? "DELETE" : "PUT",
      });
      queryClient.setQueriesData<InfiniteData<SocialPage<SocialPost | SocialComment>>>({
        queryKey: [kind === "rank" ? "posts" : "comments"],
      }, (data) => data && ({
        ...data,
        pages: data.pages.map((page) => ({
          ...page, items: page.items.map((item) => item.id === id ? { ...item, likes: updated } : item),
        })),
      }));
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Não foi possível atualizar a curtida."));
    } finally { setPending(false); }
  };
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Button variant="ghost" size="sm" aria-pressed={initial.liked} disabled={pending} onClick={like}
        aria-label={`${initial.liked ? "Remover curtida do" : "Curtir"} ${target}`}>
        <Heart aria-hidden="true" className={initial.liked ? "fill-rose-500 text-rose-500" : ""} />
        <span>{initial.count}</span>
      </Button>
      {error && <SocialErrorNotice error={error} />}
    </div>
  );
}
