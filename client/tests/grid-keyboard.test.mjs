import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveGridIndex, resolveListIndex } from "@/components/workspace/use-grid-keyboard";

describe("resolveListIndex", () => {
  it("steps one row at a time", () => {
    assert.equal(resolveListIndex(0, "ArrowDown", 5), 1);
    assert.equal(resolveListIndex(3, "ArrowUp", 5), 2);
  });

  it("treats left and right as up and down in a list", () => {
    assert.equal(resolveListIndex(2, "ArrowRight", 5), 3);
    assert.equal(resolveListIndex(2, "ArrowLeft", 5), 1);
  });

  it("stops at both ends instead of wrapping", () => {
    // Wrapping a file list is disorienting: you press Down once too many and
    // land back at the top with no sense that you moved.
    assert.equal(resolveListIndex(4, "ArrowDown", 5), 4);
    assert.equal(resolveListIndex(0, "ArrowUp", 5), 0);
  });

  it("enters the list from nothing", () => {
    assert.equal(resolveListIndex(-1, "ArrowDown", 5), 0);
    assert.equal(resolveListIndex(-1, "ArrowRight", 5), 0);
  });

  it("ignores keys that are not arrows", () => {
    assert.equal(resolveListIndex(1, "Enter", 5), null);
  });
});

describe("resolveGridIndex", () => {
  /** A 3-column grid of `count` cells, 100px wide and 80px tall. */
  const grid = (count, cols = 3) =>
    Array.from({ length: count }, (_, i) => ({
      offsetLeft: (i % cols) * 100,
      offsetTop: Math.floor(i / cols) * 80,
    }));

  it("moves down to the cell directly beneath", () => {
    // index 1 is row 0 col 1; directly below is index 4.
    assert.equal(resolveGridIndex(1, "ArrowDown", grid(9)), 4);
  });

  it("moves up to the cell directly above", () => {
    assert.equal(resolveGridIndex(7, "ArrowUp", grid(9)), 4);
  });

  it("left and right are neighbours, and cross row boundaries", () => {
    assert.equal(resolveGridIndex(4, "ArrowLeft", grid(9)), 3);
    assert.equal(resolveGridIndex(2, "ArrowRight", grid(9)), 3);
  });

  it("adapts to a different column count without being told", () => {
    // The whole reason this resolves geometrically: nothing stores "3 columns",
    // so a resize to 4 across cannot leave a stale number behind.
    assert.equal(resolveGridIndex(1, "ArrowDown", grid(12, 4)), 5);
    assert.equal(resolveGridIndex(0, "ArrowDown", grid(12, 2)), 2);
  });

  it("lands on the nearest cell when the last row is short", () => {
    // 8 cells over 3 columns: last row holds indices 6 and 7 only. From index 5
    // (row 1, col 2) the nearest cell below is 7, not nothing.
    assert.equal(resolveGridIndex(5, "ArrowDown", grid(8)), 7);
  });

  it("returns null at the edges rather than wrapping", () => {
    assert.equal(resolveGridIndex(1, "ArrowUp", grid(9)), null);
    assert.equal(resolveGridIndex(7, "ArrowDown", grid(9)), null);
  });

  it("enters the grid from nothing", () => {
    assert.equal(resolveGridIndex(-1, "ArrowDown", grid(9)), 0);
    assert.equal(resolveGridIndex(-1, "ArrowRight", grid(9)), 0);
  });

  it("clamps at the final cell", () => {
    assert.equal(resolveGridIndex(8, "ArrowRight", grid(9)), 8);
    assert.equal(resolveGridIndex(0, "ArrowLeft", grid(9)), 0);
  });
});
