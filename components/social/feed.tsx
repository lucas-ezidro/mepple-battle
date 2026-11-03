"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { socialRequest } from "@/client/social-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SocialUser } from "@/lib/social-schema";
import { SocialErrorNotice, UserLink } from "./shared";
import { PostStream } from "./post-stream";

function UserSearch() {
  const id = useId();
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);
  const query = useQuery({
    queryKey: ["users", search],
    enabled: search.length >= 2,
    queryFn: ({ signal }) => socialRequest<SocialUser[]>(`/api/users?q=${encodeURIComponent(search)}`, { signal }),
  });
  return (
    <section aria-label="Encontrar pessoas" className="flex min-w-0 flex-col gap-3 rounded-xl border border-border p-4">
      <Label htmlFor={id}>Encontrar pessoas</Label>
      <Input id={id} value={text} onChange={(event) => setText(event.target.value)} maxLength={80}
        placeholder="Buscar por nome ou username" autoComplete="off" />
      <p className="text-xs text-muted-foreground">Digite pelo menos 2 caracteres e visite um perfil para seguir.</p>
      {search.length >= 2 && <>
        {query.isPending && <p role="status" className="text-sm">Buscando pessoas...</p>}
        {query.error && <SocialErrorNotice error={query.error} retry={() => { void query.refetch(); }} />}
        {query.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>}
        {query.data && <ul className="flex min-w-0 flex-col gap-3">
          {query.data.map((user) => <li key={user.id} className="min-w-0"><UserLink user={user} /></li>)}
        </ul>}
      </>}
    </section>
  );
}

export function Feed() {
  return (
    <main className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6 p-4 sm:p-6 wrap-anywhere">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-extrabold text-center sm:text-left bg-linear-to-l from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(180,83,9,0.35)] tracking-tight"
          >
            The Meepleverse
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-center sm:text-left">Compartilhe suas escolhas. Descubra novas perspectivas</p>
        </div>
        <Link href="/top-games" className="text-sm text-zinc-400 hover:text-zinc-100 hover:underline underline-offset-4 hidden sm:block">Meus tops</Link>
      </div>
      <UserSearch />
      <PostStream path="/api/feed" emptyMessage="Ainda não há tops no seu feed. Crie um top ou encontre pessoas acima e siga seus perfis para acompanhar as publicações." />
    </main>
  );
}
