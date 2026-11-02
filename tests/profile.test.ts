import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { exchangeCodeForTokens, getLudopediaAuthorizeUrl, getLudopediaReturnPath } from "../client/ludopedia-oauth";
import { profileSchema, profileUpdateSchema } from "../lib/profile-schema";
import { logProfileError } from "../lib/profile-errors";

function mockLudopediaCredentials(t: TestContext) {
  for (const [name, value] of [
    ["LUDOPEDIA_APP_ID", "test-app-id"],
    ["LUDOPEDIA_APP_KEY", "test-app-key"],
  ]) {
    const previous = process.env[name];
    process.env[name] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[name];
      else process.env[name] = previous;
    });
  }
}

test("Ludopedia authorization uses the documented endpoint and preserves OAuth state", (t) => {
  mockLudopediaCredentials(t);
  const callback = "http://localhost:3000/api/auth/ludopedia/callback";
  const url = new URL(getLudopediaAuthorizeUrl(callback, "test-state"));
  assert.equal(url.origin, "https://ludopedia.com.br");
  assert.equal(url.pathname, "/oauth");
  assert.equal(url.searchParams.get("app_id"), "test-app-id");
  assert.equal(url.searchParams.get("redirect_uri"), callback);
  assert.equal(url.searchParams.get("state"), "test-state");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.has("client_secret"), false);
  assert.equal(url.searchParams.has("app_key"), false);
});

test("Ludopedia token exchange uses client_id and client_secret, never legacy parameter names", async (t) => {
  mockLudopediaCredentials(t);
  const callback = "http://localhost:3000/api/auth/ludopedia/callback";
  const fetchMock = t.mock.method(globalThis, "fetch", async (
    input: Parameters<typeof fetch>[0], init?: RequestInit
  ) => {
    assert.equal(input, "https://ludopedia.com.br/tokenrequest");
    assert.ok(init);
    assert.equal(init.method, "POST");
    assert.ok(init.body instanceof URLSearchParams);
    assert.equal(init.body.get("grant_type"), "authorization_code");
    assert.equal(init.body.get("code"), "test-code");
    assert.equal(init.body.get("client_id"), "test-app-id");
    assert.equal(init.body.get("client_secret"), "test-app-key");
    assert.equal(init.body.get("redirect_uri"), callback);
    assert.equal(init.body.has("app_id"), false);
    assert.equal(init.body.has("app_key"), false);
    return Response.json({ access_token: "test-access-token", expires_in: 3600 });
  });
  const before = Date.now();
  const tokens = await exchangeCodeForTokens("test-code", callback);
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(tokens.accessToken, "test-access-token");
  assert.ok(tokens.expiresAt >= before + 3600000);
});

test("profile fields are trimmed, email normalized and optional fields can be empty", () => {
  const result = profileSchema.parse({
    username: "  jogadora  ",
    email: "  JOGOS@example.com  ",
    fullName: "  Nome Completo  ",
    avatarUrl: "  https://example.com/avatar.png  ",
  });
  assert.deepEqual(result, {
    username: "jogadora",
    email: "jogos@example.com",
    fullName: "Nome Completo",
    avatarUrl: "https://example.com/avatar.png",
  });
  assert.equal(profileSchema.safeParse({
    username: "", email: "jogos@example.com", fullName: "", avatarUrl: "",
  }).success, true);
  assert.equal(profileUpdateSchema.safeParse({ email: "" }).success, false);
});

test("profile validation rejects invalid fields and respects length limits", () => {
  const valid = { username: "", email: "jogos@example.com", fullName: "", avatarUrl: "" };
  assert.equal(profileSchema.safeParse({ ...valid, email: "invalid" }).success, false);
  assert.equal(profileSchema.safeParse({ ...valid, avatarUrl: "http://example.com/photo" }).success, false);
  assert.equal(profileSchema.safeParse({ ...valid, avatarUrl: "https://user:pass@example.com/photo" }).success, false);
  assert.equal(profileSchema.safeParse({ ...valid, avatarUrl: "javascript:alert(1)" }).success, false);
  assert.equal(profileSchema.safeParse({ ...valid, username: "a".repeat(64) }).success, true);
  assert.equal(profileSchema.safeParse({ ...valid, username: "a".repeat(65) }).success, false);
  assert.equal(profileSchema.safeParse({ ...valid, fullName: "a".repeat(120) }).success, true);
  assert.equal(profileSchema.safeParse({ ...valid, fullName: "a".repeat(121) }).success, false);
});

test("profile updates allow partial changes but reject empty and unknown payloads", () => {
  assert.deepEqual(profileUpdateSchema.parse({ fullName: "  Ana  " }), { fullName: "Ana" });
  assert.deepEqual(profileUpdateSchema.parse({ avatarUrl: "" }), { avatarUrl: "" });
  assert.equal(profileUpdateSchema.safeParse({}).success, false);
  assert.equal(profileUpdateSchema.safeParse({ username: "jogador", admin: true }).success, false);
  assert.equal(profileUpdateSchema.safeParse({ email: null }).success, false);
});

test("Ludopedia return paths cannot redirect to an external site", () => {
  assert.equal(getLudopediaReturnPath("/profile"), "/profile");
  for (const path of [null, undefined, "/top-games", "//example.com", "https://example.com"]) {
    assert.equal(getLudopediaReturnPath(path), "/top-games");
  }
});

test("server diagnostics remain readable without logging sensitive error details", (t) => {
  const logger = t.mock.method(console, "error", () => {});
  const error = Object.assign(new TypeError("sensitive request data"), {
    code: "TEST_ERROR",
    cause: Object.assign(new Error("sensitive connection data"), { code: "TEST_CAUSE" }),
  });
  logProfileError("Registration failed", error);
  assert.deepEqual(logger.mock.calls[0].arguments, [
    "Registration failed",
    JSON.stringify({ name: "TypeError", code: "TEST_ERROR", causeCode: "TEST_CAUSE" }),
  ]);
  logProfileError("Registration failed", { secret: "sensitive value" });
  assert.deepEqual(logger.mock.calls[1].arguments, [
    "Registration failed", JSON.stringify({ type: "object" }),
  ]);
});
