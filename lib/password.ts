import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const parameters = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

// Missing accounts still perform the same password derivation as existing accounts.
export const DUMMY_PASSWORD_HASH = "scrypt$32768$8$3$01010101010101010101010101010101$1d5afc89706f105d7f6d88afea027fe602d51094d8ac37f2882eaffaf30f2803cafb4a81b9244c8ad31b7c270103b56571f4bdea686eb37341d7e2b8745e5305";

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, parameters, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$32768$8$3$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const match = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(encoded);
  if (!match) throw new Error("Formato de hash de senha inválido");
  const actual = await derive(password, Buffer.from(match[1], "hex"));
  return timingSafeEqual(actual, Buffer.from(match[2], "hex"));
}
