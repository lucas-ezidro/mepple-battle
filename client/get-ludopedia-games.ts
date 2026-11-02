export interface LudopediaGamesResponse {
  id_jogo: number
  nm_jogo: string
  nm_original: string
  thumb: string
  link: string
}

export const getLudopediaGames = async (
  search = "",
  options?: { signal?: AbortSignal }
): Promise<LudopediaGamesResponse[]> => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const response = await fetch(`/api/ludopedia/games?${params.toString()}`, {
    signal: options?.signal,
  });

  if (response.status === 401) {
    throw new Error("not_authenticated");
  }
  if (!response.ok) {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      throw new Error(data.error);
    }
    throw new Error(`Falha ao buscar jogos na Ludopedia (${response.status})`);
  }

  const data = await response.json();
  return data;
}