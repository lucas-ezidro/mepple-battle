import type { TierListDTO } from "../../lib/tier-list-schema";

export interface TierGame {
  gameId: number;
  name: string;
  thumb: string;
}

export interface TierColumn {
  id: string;
  label: string;
  games: TierGame[];
}

export interface TierBoard {
  pool: TierGame[];
  columns: TierColumn[];
}

export const DEFAULT_COLUMN_LABELS = ["S", "A", "B", "C", "D"];

// Cycled by row index so extra columns added by the user still get a distinct accent color.
export const COLUMN_COLORS = [
  "bg-rose-500/80",
  "bg-orange-500/80",
  "bg-amber-500/80",
  "bg-lime-500/80",
  "bg-emerald-500/80",
  "bg-sky-500/80",
  "bg-violet-500/80",
  "bg-zinc-500/80",
];

export function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createDefaultBoard(): TierBoard {
  return {
    pool: [],
    columns: DEFAULT_COLUMN_LABELS.map((label) => ({ id: createId(), label, games: [] })),
  };
}

export function boardFromDTO(dto: TierListDTO): TierBoard {
  return {
    pool: dto.pool,
    columns: dto.columns.map((column) => ({ id: column.id, label: column.label, games: column.games })),
  };
}

export function boardToUpdateInput(board: TierBoard) {
  return {
    pool: board.pool,
    columns: board.columns.map((column) => ({ label: column.label, games: column.games })),
  };
}

export function allGameIds(board: TierBoard): Set<number> {
  const ids = new Set<number>();
  for (const game of board.pool) ids.add(game.gameId);
  for (const column of board.columns) {
    for (const game of column.games) ids.add(game.gameId);
  }
  return ids;
}

export type ContainerId = "pool" | `column:${string}`;

export function addGameToPool(board: TierBoard, game: TierGame): TierBoard {
  if (allGameIds(board).has(game.gameId)) return board;
  return { ...board, pool: [...board.pool, game] };
}

export function removeGame(board: TierBoard, gameId: number): TierBoard {
  return {
    pool: board.pool.filter((game) => game.gameId !== gameId),
    columns: board.columns.map((column) => ({
      ...column,
      games: column.games.filter((game) => game.gameId !== gameId),
    })),
  };
}

export function addColumn(board: TierBoard): TierBoard {
  return { ...board, columns: [...board.columns, { id: createId(), label: "Nova coluna", games: [] }] };
}

export function removeColumn(board: TierBoard, columnId: string): TierBoard {
  const column = board.columns.find((item) => item.id === columnId);
  if (!column) return board;

  return {
    pool: [...board.pool, ...column.games],
    columns: board.columns.filter((item) => item.id !== columnId),
  };
}

export function renameColumn(board: TierBoard, columnId: string, label: string): TierBoard {
  return {
    ...board,
    columns: board.columns.map((column) => (column.id === columnId ? { ...column, label } : column)),
  };
}

export function moveGame(
  board: TierBoard,
  gameId: number,
  destContainer: ContainerId,
  destIndex: number
): TierBoard {
  let moved: TierGame | undefined;

  const pool = board.pool.filter((game) => {
    if (game.gameId !== gameId) return true;
    moved = game;
    return false;
  });

  const columns = board.columns.map((column) => {
    if (moved) return column;
    const games = column.games.filter((game) => {
      if (game.gameId !== gameId) return true;
      moved = game;
      return false;
    });
    return games.length === column.games.length ? column : { ...column, games };
  });

  if (!moved) return board;
  const next: TierBoard = { pool, columns };

  if (destContainer === "pool") {
    const nextPool = [...next.pool];
    nextPool.splice(Math.min(destIndex, nextPool.length), 0, moved);
    return { ...next, pool: nextPool };
  }

  const columnId = destContainer.slice("column:".length);
  return {
    ...next,
    columns: next.columns.map((column) => {
      if (column.id !== columnId) return column;
      const games = [...column.games];
      games.splice(Math.min(destIndex, games.length), 0, moved!);
      return { ...column, games };
    }),
  };
}
