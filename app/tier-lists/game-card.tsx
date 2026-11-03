"use client";

import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameThumbnail } from "@/components/ranks/game-thumbnail";
import { cn } from "@/lib/utils";
import type { TierGame } from "./helpers";

interface GameCardProps {
  game: TierGame;
  index: number;
  isDragging: boolean;
  onRemove: (gameId: number) => void;
  onPointerDown: (event: React.PointerEvent<HTMLSpanElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLSpanElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLSpanElement>) => void;
}

export function GameCard({ game, index, isDragging, onRemove, onPointerDown, onPointerMove, onPointerUp }: GameCardProps) {
  return (
    <li
      data-tier-game
      data-tier-index={index}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border bg-card py-1 pr-1 pl-1.5 transition-[transform,box-shadow] duration-150 ease-out",
        isDragging && "relative z-20 scale-105 opacity-60 shadow-lg"
      )}
    >
      <span
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </span>
      <GameThumbnail src={game.thumb} name={game.name} size={28} decorative />
      <span className="max-w-28 min-w-0 truncate text-sm">{game.name}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Remover ${game.name}`}
        onClick={() => onRemove(game.gameId)}
      >
        <X />
      </Button>
    </li>
  );
}
