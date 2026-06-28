import { describe, it, expect } from 'vitest';
import { bfsPathfinding } from '../src/algorithms/bfs';
import { aStarPathfinding } from '../src/algorithms/astar';
import type { Maze, Cell } from '../src/types';

function createEmptyMaze(size: number): Maze {
  const maze: Maze = [];
  for (let y = 0; y < size; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < size; x++) {
      row.push({ type: 'empty' });
    }
    maze.push(row);
  }
  return maze;
}

function createMazeWithWall(size: number, wallX: number): Maze {
  const maze = createEmptyMaze(size);
  for (let y = 0; y < size; y++) {
    if (y !== Math.floor(size / 2)) { // leave a gap in the middle row
      maze[y][wallX].type = 'obstacle';
    }
  }
  return maze;
}

describe('BFS Pathfinding', () => {
  it('should find path in empty maze', () => {
    const maze = createEmptyMaze(10);
    const result = bfsPathfinding(maze, { x: 0, y: 0 }, { x: 9, y: 9 });
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual({ x: 0, y: 0 });
    expect(result.path[result.path.length - 1]).toEqual({ x: 9, y: 9 });
  });

  it('should find shortest path in empty maze', () => {
    const maze = createEmptyMaze(10);
    const result = bfsPathfinding(maze, { x: 0, y: 0 }, { x: 9, y: 9 });
    // Shortest Manhattan path = 18 steps + 1 start = 19 nodes
    expect(result.path.length).toBe(19);
  });

  it('should return empty path when blocked', () => {
    const maze = createEmptyMaze(5);
    // Create a complete wall at x=2
    for (let y = 0; y < 5; y++) {
      maze[y][2].type = 'obstacle';
    }
    const result = bfsPathfinding(maze, { x: 0, y: 0 }, { x: 4, y: 4 });
    expect(result.path.length).toBe(0);
  });

  it('should navigate around obstacles', () => {
    const maze = createMazeWithWall(10, 5);
    const result = bfsPathfinding(maze, { x: 0, y: 0 }, { x: 9, y: 9 });
    expect(result.path.length).toBeGreaterThan(0);
    // Path should go through the gap
    expect(result.path.some(p => p.x === 5 && p.y === 5)).toBe(true);
  });

  it('should handle start == goal', () => {
    const maze = createEmptyMaze(5);
    const result = bfsPathfinding(maze, { x: 2, y: 2 }, { x: 2, y: 2 });
    expect(result.path.length).toBe(1);
    expect(result.path[0]).toEqual({ x: 2, y: 2 });
  });

  it('should record explored nodes', () => {
    const maze = createEmptyMaze(5);
    const result = bfsPathfinding(maze, { x: 0, y: 0 }, { x: 4, y: 4 });
    expect(result.exploredNodes.length).toBeGreaterThan(0);
  });

  it('should measure time', () => {
    const maze = createEmptyMaze(5);
    const result = bfsPathfinding(maze, { x: 0, y: 0 }, { x: 4, y: 4 });
    expect(result.time).toBeGreaterThanOrEqual(0);
  });
});

describe('A* Pathfinding', () => {
  it('should find path in empty maze', () => {
    const maze = createEmptyMaze(10);
    const result = aStarPathfinding(maze, { x: 0, y: 0 }, { x: 9, y: 9 });
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual({ x: 0, y: 0 });
    expect(result.path[result.path.length - 1]).toEqual({ x: 9, y: 9 });
  });

  it('should find optimal path in empty maze', () => {
    const maze = createEmptyMaze(10);
    const result = aStarPathfinding(maze, { x: 0, y: 0 }, { x: 9, y: 9 });
    // A* with admissible heuristic should find shortest path
    expect(result.path.length).toBe(19);
  });

  it('should return empty path when blocked', () => {
    const maze = createEmptyMaze(5);
    for (let y = 0; y < 5; y++) {
      maze[y][2].type = 'obstacle';
    }
    const result = aStarPathfinding(maze, { x: 0, y: 0 }, { x: 4, y: 4 });
    expect(result.path.length).toBe(0);
  });

  it('should explore fewer nodes than BFS', () => {
    const maze = createEmptyMaze(20);
    const bfs = bfsPathfinding(maze, { x: 0, y: 0 }, { x: 19, y: 19 });
    const astar = aStarPathfinding(maze, { x: 0, y: 0 }, { x: 19, y: 19 });
    // A* should explore fewer or equal nodes
    expect(astar.exploredNodes.length).toBeLessThanOrEqual(bfs.exploredNodes.length);
  });

  it('should work with different heuristics', () => {
    const maze = createEmptyMaze(10);
    const manhattan = aStarPathfinding(maze, { x: 0, y: 0 }, { x: 9, y: 9 }, 'manhattan');
    const euclidean = aStarPathfinding(maze, { x: 0, y: 0 }, { x: 9, y: 9 }, 'euclidean');
    const diagonal = aStarPathfinding(maze, { x: 0, y: 0 }, { x: 9, y: 9 }, 'diagonal');

    // All should find valid paths
    expect(manhattan.path.length).toBeGreaterThan(0);
    expect(euclidean.path.length).toBeGreaterThan(0);
    expect(diagonal.path.length).toBeGreaterThan(0);
  });
});
