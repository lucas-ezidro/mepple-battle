import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GameThumbnail } from "../components/ranks/game-thumbnail";
import { isGameImageSource } from "../lib/game-images";

test("game images use local paths or the configured HTTPS hosts", () => {
  for (const src of [
    "/logo3.png",
    "https://ludopedia.com.br/jogo.png",
    "https://cdn.ludopedia.com.br/jogo.png?size=small",
    "https://storage.googleapis.com/bucket/jogo.png",
  ]) assert.equal(isGameImageSource(src), true, src);

  for (const src of [
    "", "not a URL", "//ludopedia.com.br/jogo.png", "/\\example.com/jogo.png",
    "http://ludopedia.com.br/jogo.png", "https://ludopedia.com.br.example.com/jogo.png",
    "https://example.com/jogo.png", "data:image/png;base64,abc",
  ]) assert.equal(isGameImageSource(src), false, src);
});

test("rank covers and game rows use the same thumbnail sizes", () => {
  const cover = renderToStaticMarkup(<GameThumbnail src="/logo3.png" name="Catan" size={36} />);
  assert.match(cover, /<img /);
  assert.match(cover, /alt="Catan"/);
  assert.match(cover, /width="36" height="36"/);

  const row = renderToStaticMarkup(
    <GameThumbnail src="/logo3.png" name="Catan" size={28} decorative />
  );
  assert.match(row, /<img /);
  assert.match(row, /alt=""/);
  assert.match(row, /width="28" height="28"/);
});

test("missing and unsupported images display an accessible placeholder", () => {
  for (const src of ["", "https://example.com/game.png"]) {
    const markup = renderToStaticMarkup(<GameThumbnail src={src} name="Catan" size={28} />);
    assert.doesNotMatch(markup, /<img /);
    assert.match(markup, /role="img"/);
    assert.match(markup, /aria-label="Imagem de Catan indisponível"/);
  }
});
