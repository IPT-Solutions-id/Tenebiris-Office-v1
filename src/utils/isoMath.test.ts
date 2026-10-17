import test from 'node:test';
import assert from 'node:assert/strict';
import { gridToIso, isoToGrid, calculateDepth, gridDistance, isInViewport } from './isoMath.ts';

test('gridToIso transforms origin (0, 0) correctly', () => {
  const config = { tileWidth: 64, tileHeight: 32, originX: 400, originY: 100 };
  const result = gridToIso(0, 0, config);
  assert.equal(result.x, 400);
  assert.equal(result.y, 100);
});

test('gridToIso transforms diagonal tile (2, 2)', () => {
  const config = { tileWidth: 64, tileHeight: 32, originX: 400, originY: 100 };
  const result = gridToIso(2, 2, config);
  // dx = (2 - 2) * 32 = 0; dy = (2 + 2) * 16 = 64
  assert.equal(result.x, 400);
  assert.equal(result.y, 164);
});

test('isoToGrid inverts gridToIso', () => {
  const config = { tileWidth: 64, tileHeight: 32, originX: 300, originY: 150 };
  const iso = gridToIso(5, 3, config);
  const grid = isoToGrid(iso.x, iso.y, config);
  assert.equal(Math.round(grid.x), 5);
  assert.equal(Math.round(grid.y), 3);
});

test('calculateDepth produces correct ordering', () => {
  const depthBack = calculateDepth(1, 1);
  const depthFront = calculateDepth(3, 4);
  assert.ok(depthFront > depthBack, 'Front tile must have higher depth than back tile');
});

test('gridDistance computes Euclidean distance correctly', () => {
  const d = gridDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
  assert.equal(d, 5);
});

test('isInViewport evaluates boundaries correctly', () => {
  assert.equal(isInViewport({ x: 100, y: 100 }, 800, 600), true);
  assert.equal(isInViewport({ x: -100, y: 100 }, 800, 600, 64), false);
});
