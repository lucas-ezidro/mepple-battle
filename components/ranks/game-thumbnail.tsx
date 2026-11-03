"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { isGameImageSource } from "../../lib/game-images";

interface GameThumbnailProps {
  src: string;
  name: string;
  size: 28 | 36;
  decorative?: boolean;
}

export function GameThumbnail({ src, name, size, decorative = false }: GameThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const sizeClass = size === 28 ? "size-7" : "size-9";

  if (!isGameImageSource(src) || failedSrc === src) {
    return (
      <span
        role="img"
        aria-label={`Imagem de ${name} indisponível`}
        title={`Imagem de ${name} indisponível`}
        className={`flex ${sizeClass} shrink-0 items-center justify-center rounded bg-muted text-muted-foreground`}
      >
        <ImageOff aria-hidden="true" className="size-4" />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={decorative ? "" : name}
      width={size}
      height={size}
      className={`${sizeClass} shrink-0 rounded object-cover`}
      onError={() => setFailedSrc(src)}
    />
  );
}
