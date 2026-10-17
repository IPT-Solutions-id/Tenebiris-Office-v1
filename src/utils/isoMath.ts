/**
 * Isometric projection math utilities for Tenebiris Office
 * Pure mathematical functions for 2.5D coordinate space.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface IsoConfig {
  tileWidth: number;
  tileHeight: number;
  originX: number;
  originY: number;
}

/**
 * Converts grid coordinates (col, row) to isometric 2D screen coordinates
 */
export function gridToIso(col: number, row: number, config: IsoConfig): Point2D {
  const halfW = config.tileWidth / 2;
  const halfH = config.tileHeight / 2;
  const screenX = config.originX + (col - row) * halfW;
  const screenY = config.originY + (col + row) * halfH;
  return { x: Math.round(screenX), y: Math.round(screenY) };
}

/**
 * Converts screen coordinates back to tile coordinates (floating or rounded)
 */
export function isoToGrid(screenX: number, screenY: number, config: IsoConfig): Point2D {
  const halfW = config.tileWidth / 2;
  const halfH = config.tileHeight / 2;
  const dx = screenX - config.originX;
  const dy = screenY - config.originY;

  const col = (dx / halfW + dy / halfH) / 2;
  const row = (dy / halfH - dx / halfW) / 2;
  return { x: col, y: row };
}

/**
 * Depth sorter for isometric objects: objects with higher (col + row) render in front
 */
export function calculateDepth(col: number, row: number, zOffset: number = 0): number {
  return (col + row) * 100 + zOffset;
}

/**
 * Calculates Euclidean distance between two grid points
 */
export function gridDistance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Checks if a point is within viewport bounds
 */
export function isInViewport(
  point: Point2D,
  viewW: number,
  viewH: number,
  margin: number = 64
): boolean {
  return (
    point.x >= -margin &&
    point.x <= viewW + margin &&
    point.y >= -margin &&
    point.y <= viewH + margin
  );
}
