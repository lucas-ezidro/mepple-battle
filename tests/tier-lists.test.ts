import assert from "node:assert/strict";
import test from "node:test";
import {
  addColumn,
  addGameToPool,
  allGameIds,
  createDefaultBoard,
  moveGame,
  removeColumn,
  removeGame,
  renameColumn,
  type TierBoard,
} from "../app/tier-lists/helpers";
import { tierListUpdateSchema } from "../lib/tier-list-schema";

function gameFixture(gameId: number) {
  return { gameId, name: `Jogo ${gameId}`, thumb: `https://ludopedia.com.br/${gameId}.jpg` };
}

test("default board starts with the S/A/B/C/D columns and an empty pool", () => {
  const board = createDefaultBoard();
  assert.deepEqual(board.columns.map((column) => column.label), ["S", "A", "B", "C", "D"]);
  assert.equal(board.pool.length, 0);
});

test("addGameToPool appends the game once and ignores duplicates already on the board", () => {
  let board = createDefaultBoard();
  board = addGameToPool(board, gameFixture(1));
  board = moveGame(board, 1, `column:${board.columns[0].id}`, 0);
  board = addGameToPool(board, gameFixture(1));
  assert.equal(board.pool.length, 0);
  assert.equal(board.columns[0].games.length, 1);
});

test("moveGame relocates a game from the pool into a column", () => {
  let board = createDefaultBoard();
  board = addGameToPool(board, gameFixture(1));
  const columnId = board.columns[0].id;
  board = moveGame(board, 1, `column:${columnId}`, 0);

  assert.equal(board.pool.length, 0);
  assert.deepEqual(board.columns[0].games.map((game) => game.gameId), [1]);
});

test("moveGame relocates a game between columns and reorders within a column", () => {
  let board = createDefaultBoard();
  board = addGameToPool(board, gameFixture(1));
  board = addGameToPool(board, gameFixture(2));
  const [colA, colB] = board.columns;
  board = moveGame(board, 1, `column:${colA.id}`, 0);
  board = moveGame(board, 2, `column:${colA.id}`, 0);
  assert.deepEqual(board.columns[0].games.map((game) => game.gameId), [2, 1]);

  board = moveGame(board, 2, `column:${colB.id}`, 0);
  assert.deepEqual(board.columns[0].games.map((game) => game.gameId), [1]);
  assert.deepEqual(board.columns[1].games.map((game) => game.gameId), [2]);
});

test("moveGame is a no-op when the game id is not found on the board", () => {
  const board = createDefaultBoard();
  const next = moveGame(board, 999, "pool", 0);
  assert.equal(next, board);
});

test("removeGame removes a game regardless of where it currently sits", () => {
  let board = createDefaultBoard();
  board = addGameToPool(board, gameFixture(1));
  board = moveGame(board, 1, `column:${board.columns[0].id}`, 0);
  board = removeGame(board, 1);
  assert.equal(allGameIds(board).size, 0);
});

test("addColumn appends a renameable column and removeColumn returns its games to the pool", () => {
  let board: TierBoard = createDefaultBoard();
  board = addColumn(board);
  assert.equal(board.columns.length, 6);

  const newColumn = board.columns[5];
  board = renameColumn(board, newColumn.id, "Favoritos");
  assert.equal(board.columns[5].label, "Favoritos");

  board = addGameToPool(board, gameFixture(1));
  board = moveGame(board, 1, `column:${newColumn.id}`, 0);
  board = removeColumn(board, newColumn.id);

  assert.equal(board.columns.length, 5);
  assert.deepEqual(board.pool.map((game) => game.gameId), [1]);
});

test("tierListUpdateSchema accepts a valid board and rejects duplicate games", () => {
  const valid = {
    pool: [gameFixture(1)],
    columns: [{ label: "S", games: [gameFixture(2)] }],
  };
  assert.equal(tierListUpdateSchema.safeParse(valid).success, true);

  const duplicated = {
    pool: [gameFixture(1)],
    columns: [{ label: "S", games: [gameFixture(1)] }],
  };
  assert.equal(tierListUpdateSchema.safeParse(duplicated).success, false);
});

test("tierListUpdateSchema enforces column count and label limits", () => {
  const noColumns = { pool: [], columns: [] };
  assert.equal(tierListUpdateSchema.safeParse(noColumns).success, false);

  const tooManyColumns = {
    pool: [],
    columns: Array.from({ length: 21 }, (_, index) => ({ label: `C${index}`, games: [] })),
  };
  assert.equal(tierListUpdateSchema.safeParse(tooManyColumns).success, false);

  const blankLabel = { pool: [], columns: [{ label: "  ", games: [] }] };
  assert.equal(tierListUpdateSchema.safeParse(blankLabel).success, false);
});
