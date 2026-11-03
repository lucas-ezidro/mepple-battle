import type { NextConfig } from "next";

export const gameImageRemotePatterns = [
  { protocol: "https", hostname: "ludopedia.com.br" },
  { protocol: "https", hostname: "**.ludopedia.com.br" },
  { protocol: "https", hostname: "storage.googleapis.com" },
] satisfies NonNullable<NextConfig["images"]>["remotePatterns"];

export function isGameImageSource(src: string) {
  if (src.startsWith("/") && !src.startsWith("//") && !src.includes("\\")) return true;
  if (!URL.canParse(src)) return false;

  const url = new URL(src);
  return gameImageRemotePatterns.some(({ protocol, hostname }) =>
    url.protocol === `${protocol}:` && (hostname.startsWith("**.")
      ? url.hostname.endsWith(hostname.slice(2))
      : url.hostname === hostname)
  );
}
