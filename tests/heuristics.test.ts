import { describe, it, expect } from 'vitest';
import {
  manhattanDistance,
  euclideanDistance,
  diagonalDistance,
  getHeuristicFunction,
} from '../src/algorithms/heuristics';

describe('Heuristic Functions', () => {
  it('manhattan distance should be |dx| + |dy|', () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
    expect(manhattanDistance({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });

  it('euclidean distance should be sqrt(dx² + dy²)', () => {
    expect(euclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(euclideanDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });

  it('diagonal distance should use Chebyshev-like formula', () => {
    const d = diagonalDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
    // D*(dx+dy) + (D2-2D)*min(dx,dy) = 1*7 + (√2-2)*3 ≈ 7 + (1.414-2)*3 ≈ 7 - 1.757 ≈ 5.243
    expect(d).toBeCloseTo(5.243, 2);
  });

  it('all heuristics should return 0 for same position', () => {
    const pos = { x: 5, y: 5 };
    expect(manhattanDistance(pos, pos)).toBe(0);
    expect(euclideanDistance(pos, pos)).toBe(0);
    expect(diagonalDistance(pos, pos)).toBe(0);
  });

  it('getHeuristicFunction should return correct function', () => {
    const manhattan = getHeuristicFunction(0.3, 'manhattan');
    expect(manhattan({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);

    const euclidean = getHeuristicFunction(0.3, 'euclidean');
    expect(euclidean({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('auto mode should select based on obstacle rate', () => {
    const pos1 = { x: 0, y: 0 };
    const pos2 = { x: 3, y: 4 };

    // Low obstacle rate → Manhattan
    const low = getHeuristicFunction(0.1);
    expect(low(pos1, pos2)).toBe(7);

    // Medium → Euclidean
    const mid = getHeuristicFunction(0.3);
    expect(mid(pos1, pos2)).toBe(5);

    // High → Diagonal
    const high = getHeuristicFunction(0.5);
    expect(high(pos1, pos2)).toBeCloseTo(5.243, 2);
  });
});
