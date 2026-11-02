import assert from "node:assert/strict";
import test from "node:test";
import { getLudopediaGames } from "../client/get-ludopedia-games";

test("catalog search uses the local API without OAuth redirects or provider credentials", async (t) => {
  const games = [{
    id_jogo: 1, nm_jogo: "Jogo teste", nm_original: "Test game", thumb: "/logo3.png", link: "",
  }];
  t.mock.method(globalThis, "fetch", async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    assert.equal(input, "/api/ludopedia/games?search=Jogo+teste");
    assert.equal(init?.headers, undefined);
    return Response.json(games);
  });
  assert.deepEqual(await getLudopediaGames("Jogo teste"), games);
});

test("an expired local session still requires application login", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "not_authenticated" }, { status: 401 }));
  await assert.rejects(getLudopediaGames("test"), /not_authenticated/);
});

test("catalog configuration errors are shown instead of requesting personal OAuth", async (t) => {
  const message = "A busca de jogos está indisponível. Atualize o token da Ludopedia no servidor.";
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: message }, { status: 503 }));
  await assert.rejects(getLudopediaGames("test"), { message });
});

test("an empty catalog result remains a successful empty list", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json([]));
  assert.deepEqual(await getLudopediaGames("test"), []);
});
