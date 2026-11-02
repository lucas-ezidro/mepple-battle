import assert from "node:assert/strict";
import test from "node:test";
import {
  commentInputSchema, decodeSocialCursor, encodeSocialCursor, searchUsersSchema,
  socialCursorWhere, socialFeedWhere,
} from "../lib/social-schema";

test("comments and replies reject empty, oversized and unexpected inputs", () => {
  assert.deepEqual(commentInputSchema.parse({ body: "  Comentário  " }), { body: "Comentário" });
  assert.deepEqual(commentInputSchema.parse({ body: "Resposta", parentId: "parent" }), {
    body: "Resposta", parentId: "parent",
  });
  assert.equal(commentInputSchema.safeParse({ body: "a".repeat(2000) }).success, true);
  for (const payload of [
    { body: " " }, { body: "a".repeat(2001) }, { body: "text", parentId: "" },
    { body: "text", userId: "someone-else" }, { body: "text", rankId: "other-rank" },
  ]) assert.equal(commentInputSchema.safeParse(payload).success, false);
});

test("user discovery requires a bounded nonempty name", () => {
  assert.equal(searchUsersSchema.parse("  Jogador  "), "Jogador");
  for (const search of ["", " ", "a", "a".repeat(81)]) {
    assert.equal(searchUsersSchema.safeParse(search).success, false);
  }
});

test("pagination cursors preserve both time and id and reject tampering", () => {
  const date = new Date("2026-11-02T18:00:00.000Z");
  const encoded = encodeSocialCursor({ id: "post-id", createdAt: date });
  assert.deepEqual(decodeSocialCursor(encoded), { id: "post-id", createdAt: date.toISOString() });
  assert.equal(decodeSocialCursor(null), null);
  for (const value of [
    "", "*", "a".repeat(513),
    Buffer.from(JSON.stringify({ id: "post-id", createdAt: "invalid" })).toString("base64url"),
    Buffer.from(JSON.stringify({ id: "post-id", createdAt: date.toISOString(), userId: "other" })).toString("base64url"),
  ]) assert.throws(() => decodeSocialCursor(value), /invalid_cursor/);
  assert.deepEqual(socialCursorWhere(null), {});
  assert.deepEqual(socialCursorWhere(decodeSocialCursor(encoded)), {
    OR: [{ createdAt: { lt: date } }, { createdAt: date, id: { lt: "post-id" } }],
  });
});

test("the feed includes the viewer's tops and tops by followed users", () => {
  assert.deepEqual(socialFeedWhere("viewer-id"), {
    OR: [
      { userId: "viewer-id" },
      { user: { followers: { some: { followerId: "viewer-id" } } } },
    ],
  });
});
