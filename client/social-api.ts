export class SocialApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export async function socialRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    if (response.status === 401) throw new SocialApiError("Sua sessão expirou. Entre novamente.", 401);
    const data: unknown = await response.json();
    const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
      ? data.error : "Não foi possível concluir a solicitação.";
    throw new SocialApiError(message, response.status);
  }
  return response.json();
}
