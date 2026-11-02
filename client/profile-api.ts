import type { FollowCounts, ProfileDetails, ProfileFormValues } from "@/lib/profile-schema";

async function checkResponse(response: Response, fallback: string) {
  if (response.status === 401) throw new Error("not_authenticated");
  if (response.status === 409) {
    const data: { field?: string } = await response.json();
    throw new Error(data.field === "email" ? "email_taken" : "username_taken");
  }
  if (response.status === 400) throw new Error("invalid_profile");
  if (!response.ok) throw new Error(fallback);
}

export async function getProfile(): Promise<ProfileDetails> {
  const response = await fetch("/api/profile", { cache: "no-store" });
  await checkResponse(response, "Falha ao buscar o perfil");
  return response.json();
}

export async function getFollowCounts(): Promise<FollowCounts> {
  const response = await fetch("/api/profile/follow-counts", { cache: "no-store" });
  await checkResponse(response, "Falha ao buscar seguidores");
  return response.json();
}

export async function updateProfile(values: ProfileFormValues): Promise<ProfileDetails> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  await checkResponse(response, "Falha ao atualizar o perfil");
  return response.json();
}
