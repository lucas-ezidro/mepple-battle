import type { RankDraft } from "@/app/top-games/create-rank";
import type { LudopediaGamesResponse } from "./get-ludopedia-games";

export interface RankRecord extends RankDraft {
  id: string;
  games: LudopediaGamesResponse[];
}

interface RankApiGame {
  position: number;
  gameId: number;
  name: string;
  thumb: string;
}

interface RankApiResponse {
  id: string;
  type: RankDraft["type"];
  year: number | null;
  theme: string | null;
  games: RankApiGame[];
}

function toRankRecord(rank: RankApiResponse): RankRecord {
  return {
    id: rank.id,
    type: rank.type,
    year: rank.year ?? undefined,
    theme: rank.theme ?? undefined,
    games: rank.games.map((game) => ({
      id_jogo: game.gameId,
      nm_jogo: game.name,
      nm_original: game.name,
      thumb: game.thumb,
      link: "",
    })),
  };
}

function toApiBody(draft: RankDraft, games: LudopediaGamesResponse[]) {
  return {
    type: draft.type,
    year: draft.year,
    theme: draft.theme,
    games: games.map((game) => ({
      id_jogo: game.id_jogo,
      nm_jogo: game.nm_jogo,
      thumb: game.thumb,
    })),
  };
}

async function extractError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchRanks(path: string): Promise<RankRecord[]> {
  const response = await fetch(path, { cache: "no-store" });

  if (response.status === 401) {
    throw new Error("not_authenticated");
  }
  if (!response.ok) {
    throw new Error("Falha ao buscar os tops");
  }

  const data: RankApiResponse[] = await response.json();
  return data.map(toRankRecord);
}

export function getRanks(): Promise<RankRecord[]> {
  return fetchRanks("/api/ranks");
}

export function getProfileRanks(): Promise<RankRecord[]> {
  return fetchRanks("/api/profile/ranks");
}

export async function createRank(
  draft: RankDraft,
  games: LudopediaGamesResponse[]
): Promise<RankRecord> {
  const response = await fetch("/api/ranks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiBody(draft, games)),
  });

  if (response.status === 401) {
    throw new Error("not_authenticated");
  }
  if (!response.ok) {
    throw new Error(await extractError(response, "Falha ao criar o top"));
  }

  return toRankRecord(await response.json());
}

export async function updateRank(
  id: string,
  draft: RankDraft,
  games: LudopediaGamesResponse[]
): Promise<RankRecord> {
  const response = await fetch(`/api/ranks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiBody(draft, games)),
  });

  if (response.status === 401) {
    throw new Error("not_authenticated");
  }
  if (!response.ok) {
    throw new Error(await extractError(response, "Falha ao atualizar o top"));
  }

  return toRankRecord(await response.json());
}

export async function deleteRank(id: string): Promise<void> {
  const response = await fetch(`/api/ranks/${id}`, { method: "DELETE" });

  if (response.status === 401) {
    throw new Error("not_authenticated");
  }
  if (!response.ok) {
    throw new Error(await extractError(response, "Falha ao remover o top"));
  }
}
