import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { logProfileError } from "@/lib/profile-errors";

export async function GET(request: Request) {
  try {
    await getCurrentUserId();
    const accessToken = process.env.LUDOPEDIA_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      console.error("[GET /api/ludopedia/games] Token do catálogo não configurado");
      return NextResponse.json({
        error: "A busca de jogos está indisponível. Configure o token da Ludopedia no servidor.",
      }, { status: 503 });
    }
    const ludopediaUrl = new URL("https://ludopedia.com.br/api/v1/jogos");
    const search = new URL(request.url).searchParams.get("search") ?? "";
    if (search) ludopediaUrl.searchParams.set("search", search);
    ludopediaUrl.searchParams.set("rows", "20");
    const response = await fetch(ludopediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) {
      console.error("[GET /api/ludopedia/games] Token do catálogo recusado", response.status);
      return NextResponse.json({
        error: "A busca de jogos está indisponível. Atualize o token da Ludopedia no servidor.",
      }, { status: 503 });
    }
    if (!response.ok) {
      console.error("[GET /api/ludopedia/games] Falha na Ludopedia", response.status);
      return NextResponse.json({ error: "Falha ao buscar jogos na Ludopedia" }, { status: 502 });
    }
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("jogos" in data) || !Array.isArray(data.jogos)) {
      throw new Error("Resposta de jogos da Ludopedia inválida");
    }
    return NextResponse.json(data.jogos, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    logProfileError("[GET /api/ludopedia/games] Falha ao buscar jogos", error);
    return NextResponse.json({ error: "Falha ao buscar jogos na Ludopedia" }, { status: 502 });
  }
}
