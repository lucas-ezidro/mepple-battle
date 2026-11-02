"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { socialRequest } from "@/client/social-api";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/lib/social-schema";
import { SocialErrorNotice, UserLink } from "./shared";
import { PostStream } from "./post-stream";

function Profile({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["user", id],
    queryFn: ({ signal }) => socialRequest<UserProfile>(`/api/users/${encodeURIComponent(id)}`, { signal }),
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const profile = query.data;
  const follow = async () => {
    if (!profile) return;
    setPending(true);
    setError(null);
    try {
      const updated = await socialRequest<UserProfile>(`/api/users/${id}/follow`, {
        method: profile.isFollowing ? "DELETE" : "PUT",
      });
      queryClient.setQueryData(["user", id], updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posts", "/api/feed"] }),
        queryClient.invalidateQueries({ queryKey: ["follow-counts"] }),
        queryClient.invalidateQueries({ queryKey: ["user"] }),
      ]);
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Não foi possível atualizar a conexão."));
    } finally { setPending(false); }
  };
  return (
    <main className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6 p-4 sm:p-6 wrap-anywhere">
      <Link href="/" className="self-start text-sm underline underline-offset-4">Voltar ao feed</Link>
      <h1 className="text-2xl font-semibold">Perfil do jogador</h1>
      {query.isPending && <p role="status">Carregando perfil...</p>}
      {query.error && <SocialErrorNotice error={query.error} retry={() => { void query.refetch(); }} />}
      {profile && <>
        <section aria-label="Dados do jogador" className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4">
          <UserLink key={profile.avatarUrl} user={profile} />
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div><dt className="text-xs text-muted-foreground">Seguidores</dt><dd>{profile.followers}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Seguindo</dt><dd>{profile.following}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Tops</dt><dd>{profile.tops}</dd></div>
          </dl>
          {profile.isSelf
            ? <Link href="/profile" className="text-sm underline underline-offset-4">Editar meu perfil</Link>
            : <Button onClick={follow} disabled={pending} aria-pressed={profile.isFollowing}
                variant={profile.isFollowing ? "outline" : "default"} className="self-start">
                {pending ? "Atualizando..." : profile.isFollowing ? "Deixar de seguir" : "Seguir"}
              </Button>}
          {error && <SocialErrorNotice error={error} />}
        </section>
        <h2 className="text-lg font-semibold">Tops publicados</h2>
        <PostStream path={`/api/users/${encodeURIComponent(id)}/ranks`} emptyMessage="Este usuário ainda não criou tops." />
      </>}
    </main>
  );
}

export function PublicProfile({ id }: { id: string }) {
  return <Profile key={id} id={id} />;
}
