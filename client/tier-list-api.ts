import type { TierListDTO, TierListUpdateInput } from "@/lib/tier-list-schema";

export type { TierListDTO };

async function extractError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getTierList(): Promise<TierListDTO> {
  const response = await fetch("/api/tier-lists", { cache: "no-store" });

  if (response.status === 401) {
    throw new Error("not_authenticated");
  }
  if (!response.ok) {
    throw new Error(await extractError(response, "Falha ao buscar o tier list"));
  }

  return response.json();
}

export async function saveTierList(input: TierListUpdateInput): Promise<TierListDTO> {
  const response = await fetch("/api/tier-lists", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    throw new Error("not_authenticated");
  }
  if (!response.ok) {
    throw new Error(await extractError(response, "Falha ao salvar o tier list"));
  }

  return response.json();
}

export async function publishTierList(): Promise<{ id: string }> {
  const response = await fetch("/api/tier-list-posts", { method: "POST" });

  if (response.status === 401) {
    throw new Error("not_authenticated");
  }
  if (!response.ok) {
    throw new Error(await extractError(response, "Falha ao publicar o tier list"));
  }

  return response.json();
}
