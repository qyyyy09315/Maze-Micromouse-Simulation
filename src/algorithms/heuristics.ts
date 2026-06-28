import type { Position, HeuristicType } from '../types';

export const manhattanDistance = (current: Position, goal: Position): number =>
  Math.abs(current.x - goal.x) + Math.abs(current.y - goal.y);

export const euclideanDistance = (current: Position, goal: Position): number =>
  Math.sqrt((current.x - goal.x) ** 2 + (current.y - goal.y) ** 2);

export const diagonalDistance = (current: Position, goal: Position): number => {
  const dx = Math.abs(current.x - goal.x);
  const dy = Math.abs(current.y - goal.y);
  const D = 1;
  const D2 = Math.SQRT2;
  return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
};

/**
 * Select heuristic function based on explicit type or obstacle rate.
 * Auto mode: low obstacle rate → Manhattan, medium → Euclidean, high → Diagonal.
 */
export function getHeuristicFunction(
  obstacleRate: number,
  heuristicType?: HeuristicType,
): (a: Position, b: Position) => number {
  if (heuristicType) {
    switch (heuristicType) {
      case 'manhattan':
        return manhattanDistance;
      case 'euclidean':
        return euclideanDistance;
      case 'diagonal':
        return diagonalDistance;
    }
  }
  // Auto selection based on obstacle density
  if (obstacleRate < 0.2) return manhattanDistance;
  if (obstacleRate < 0.4) return euclideanDistance;
  return diagonalDistance;
}
