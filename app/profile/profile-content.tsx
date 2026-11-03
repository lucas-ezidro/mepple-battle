"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, CircleUserRound, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFollowCounts, getProfile } from "@/client/profile-api";
import { getProfileRanks, type RankRecord } from "@/client/ranks-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { GameThumbnail } from "@/components/ranks/game-thumbnail";
import type { ProfileDetails } from "@/lib/profile-schema";
import { RANK_LABELS } from "@/app/top-games/helpers";
import { ProfileForm } from "./profile-form";

type ProfileState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "error" }
  | { status: "ready"; profile: ProfileDetails; ranks: RankRecord[] };

function ProfileFollowCounts() {
  const query = useQuery({ queryKey: ["follow-counts"], queryFn: getFollowCounts });
  if (query.isPending) return <p role="status" className="text-sm text-muted-foreground">Carregando conexões...</p>;
  if (query.error) return (
    <div role="alert" className="flex flex-col items-start gap-2">
      <p className="text-sm text-destructive">{query.error.message === "not_authenticated"
        ? "Sua sessão expirou. Entre novamente." : "Não foi possível carregar suas conexões."}</p>
      {query.error.message === "not_authenticated"
        ? <a href="/login?next=%2Fprofile" className={buttonVariants({ size: "sm" })}>Entrar</a>
        : <Button size="sm" variant="outline" onClick={() => { void query.refetch(); }}>Tentar novamente</Button>}
    </div>
  );
  return (
    <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4">
      <div>
        <dt className="text-sm text-muted-foreground">Seguidores</dt>
        <dd className="mt-1 text-xl font-semibold">{query.data.followers.toLocaleString("pt-BR")}</dd>
      </div>
      <div>
        <dt className="text-sm text-muted-foreground">Seguindo</dt>
        <dd className="mt-1 text-xl font-semibold">{query.data.following.toLocaleString("pt-BR")}</dd>
      </div>
    </dl>
  );
}

function ProfileAvatar({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-muted">
        {url && !failed ? (
          <Image
            src={url}
            alt="Foto de perfil"
            width={96}
            height={96}
            unoptimized
            referrerPolicy="no-referrer"
            className="size-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <CircleUserRound className="size-14 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      {failed && <span className="max-w-28 text-center text-xs text-muted-foreground">Foto indisponível</span>}
    </div>
  );
}

function ProfileRanks({ ranks }: { ranks: RankRecord[] }) {
  return (
    <section aria-labelledby="profile-ranks-title" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="profile-ranks-title" className="text-lg font-semibold">Meus tops ({ranks.length})</h2>
        <Link href="/top-games" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Gerenciar tops
        </Link>
      </div>

      {ranks.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Você ainda não criou nenhum top.</p>
            <Link href="/top-games" className={buttonVariants({ className: "self-start" })}>
              Criar top
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex min-w-0 flex-col gap-2">
          {ranks.map((rank) => (
            <li key={rank.id}>
              <details className="group rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  {rank.games[0] && (
                    <GameThumbnail src={rank.games[0].thumb} name={rank.games[0].nm_jogo} size={36} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{RANK_LABELS[rank.type]}</p>
                    <p className="text-sm text-muted-foreground">
                      {rank.type === "100"
                        ? rank.year ?? "Ano não informado"
                        : rank.theme || "Tema não informado"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {rank.games.length} {rank.games.length === 1 ? "jogo" : "jogos"}
                  </span>
                  <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <ol className="flex flex-col gap-2 border-t border-border p-4">
                  {rank.games.map((game, index) => (
                    <li key={game.id_jogo} className="flex min-w-0 items-center gap-2 text-sm">
                      <span className="w-7 shrink-0 text-muted-foreground">{index + 1}º</span>
                      <GameThumbnail src={game.thumb} name={game.nm_jogo} size={28} decorative />
                      <span className="min-w-0">{game.nm_jogo}</span>
                    </li>
                  ))}
                </ol>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ProfileContent() {
  const [state, setState] = useState<ProfileState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let active = true;

    getProfile()
      .then(async (profile) => {
        return { profile, ranks: await getProfileRanks() };
      })
      .then((data) => {
        if (active) setState({ status: "ready", ...data });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof Error && error.message === "not_authenticated") {
          setState({ status: "unauthenticated" });
        } else {
          setState({ status: "error" });
        }
      });

    return () => { active = false; };
  }, [attempt]);

  return (
    <main className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-10 wrap-anywhere">
      <div>
        <h1 className="text-2xl font-semibold">Meu perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seus dados, conexões e tops em um só lugar.
        </p>
      </div>

      {state.status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Spinner /> Carregando perfil...
        </div>
      )}

      {state.status === "unauthenticated" && (
        <Card>
          <CardContent className="items-start">
            <p className="text-sm text-muted-foreground">
              Sua sessão expirou. Entre novamente para acessar seu perfil.
            </p>
            <a href="/login?next=%2Fprofile" className={buttonVariants()}>
              Entrar
            </a>
          </CardContent>
        </Card>
      )}

      {state.status === "error" && (
        <Card>
          <CardContent className="items-start">
            <p className="text-sm text-destructive" role="alert">
              Não foi possível carregar seu perfil. Tente novamente.
            </p>
            <Button type="button" variant="outline" onClick={() => {
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {state.status === "ready" && (
        <>
          <Card>
            <CardContent className="gap-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex w-full min-w-0 items-center gap-4 sm:w-auto sm:flex-1">
                  <ProfileAvatar key={state.profile.avatarUrl ?? "empty"} url={state.profile.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">
                      {state.profile.fullName || state.profile.username || "Seu perfil"}
                    </h2>
                    <p className="text-sm text-muted-foreground">Sua conta na Batalha dos Meeples</p>
                  </div>
                </div>
                {!editing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil /> Editar perfil
                  </Button>
                )}
              </div>

              <dl className="grid min-w-0 gap-4 sm:grid-cols-3">
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Nome de usuário</dt>
                  <dd className="mt-1 text-sm">{state.profile.username || "Não informado"}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">E-mail</dt>
                  <dd className="mt-1 text-sm">{state.profile.email || "Não informado"}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Nome completo</dt>
                  <dd className="mt-1 text-sm">{state.profile.fullName || "Não informado"}</dd>
                </div>
              </dl>

              <ProfileFollowCounts />
              <div className="flex flex-col items-start gap-2 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  A conexão com a Ludopedia é opcional e serve para recuperar tops da sua conta anterior.
                </p>
                <a href="/api/auth/ludopedia/login?returnTo=%2Fprofile"
                  className={buttonVariants({ variant: "outline", className: "max-w-full" })}>
                  Conectar com Ludopedia
                </a>
              </div>
            </CardContent>
          </Card>

          {editing && (
            <ProfileForm
              profile={state.profile}
              onCancel={() => setEditing(false)}
              onSaved={(profile) => {
                setState({ ...state, profile });
                setEditing(false);
              }}
              onUnauthenticated={() => {
                setEditing(false);
                setState({ status: "unauthenticated" });
              }}
            />
          )}

          <ProfileRanks ranks={state.ranks} />
        </>
      )}
    </main>
  );
}
