import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function checkAuthRateLimit(kind: "login" | "register", email: string) {
  const key = `${kind}:${createHash("sha256").update(email).digest("hex")}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  await prisma.authRateLimit.deleteMany({ where: { expiresAt: { lte: now } } });
  const [limit] = await prisma.$queryRaw<{ attempts: number; expiresAt: Date }[]>`
    INSERT INTO "AuthRateLimit" ("key", "attempts", "expiresAt")
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "attempts" = CASE WHEN "AuthRateLimit"."expiresAt" <= ${now}
        THEN 1 ELSE LEAST("AuthRateLimit"."attempts" + 1, 11) END,
      "expiresAt" = CASE WHEN "AuthRateLimit"."expiresAt" <= ${now}
        THEN ${expiresAt} ELSE "AuthRateLimit"."expiresAt" END
    RETURNING "attempts", "expiresAt"
  `;
  if (!limit) throw new Error("Falha ao verificar limite de autenticação");
  return {
    allowed: limit.attempts <= 10,
    retryAfter: Math.max(1, Math.ceil((limit.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}
