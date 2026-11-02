import assert from "node:assert/strict";
import test from "node:test";
import { authEmailSchema, loginSchema, registerSchema } from "../lib/auth-schema";
import { getAuthReturnPath, getRequestOrigin, isSameOriginRequest, isSessionToken } from "../lib/auth-policy";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "../lib/password";

test("registration normalizes email and enforces password confirmation and limits", () => {
  const valid = {
    fullName: "  Nome Completo  ", email: "  JOGOS@example.com  ",
    password: "my-test-password", confirmPassword: "my-test-password",
  };
  assert.equal(registerSchema.parse(valid).email, "jogos@example.com");
  assert.equal(registerSchema.parse(valid).fullName, "Nome Completo");
  for (const change of [
    { fullName: "" }, { email: "" }, { email: "invalid" },
    { password: "short", confirmPassword: "short" },
    { confirmPassword: "different" },
    { password: "a".repeat(129), confirmPassword: "a".repeat(129) },
    { admin: true },
  ]) assert.equal(registerSchema.safeParse({ ...valid, ...change }).success, false);
  assert.equal(loginSchema.safeParse({ email: valid.email, password: "" }).success, false);
  assert.equal(authEmailSchema.parse(valid.email), "jogos@example.com");
});

test("password hashes are salted and accept only the correct password", async () => {
  const password = "my-test-password";
  const [first, second] = await Promise.all([hashPassword(password), hashPassword(password)]);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  assert.equal(await verifyPassword(password, DUMMY_PASSWORD_HASH), false);
  await assert.rejects(verifyPassword(password, "invalid"), /hash/);
});

test("return paths cannot escape the protected local destinations", () => {
  for (const path of ["/", "/profile", "/top-games", "/faq", "/tier-lists"]) {
    assert.equal(getAuthReturnPath(path), path);
  }
  for (const path of [null, undefined, "/login", "//example.com", "https://example.com", "/profile?next=evil"]) {
    assert.equal(getAuthReturnPath(path), "/");
  }
});

test("session cookies require a full random-token shape", () => {
  assert.equal(isSessionToken("a".repeat(64)), true);
  for (const value of [undefined, "", "a".repeat(63), "A".repeat(64), "z".repeat(64)]) {
    assert.equal(isSessionToken(value), false);
  }
});

test("mutations must include a matching origin, host and protocol", () => {
  const request = (origin?: string, host = "localhost:3000") => new Request("http://localhost:3000/api/auth/login", {
    headers: { host, ...(origin ? { origin } : {}) },
  });

  assert.equal(isSameOriginRequest(request("http://localhost:3000")), true);
  for (const origin of [undefined, "null", "https://localhost:3000", "http://localhost:4000", "https://example.com"]) {
    assert.equal(isSameOriginRequest(request(origin)), false);
  }
  assert.equal(isSameOriginRequest(request("http://localhost:3000", "example.com")), false);
});

test("OAuth redirects preserve the browser host and port instead of the server bind address", () => {
  for (const host of ["127.0.0.1:3000", "localhost:3000", "app.example.com"]) {
    const request = new Request("https://[::]:3000/api/auth/ludopedia/login", { headers: { host } });
    assert.equal(getRequestOrigin(request), `https://${host}`);
  }
  assert.equal(getRequestOrigin(new Request("https://app.example.com/api")), "https://app.example.com");
});
