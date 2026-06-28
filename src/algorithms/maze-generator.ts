import type { Maze, Position } from '../types';
import { bfsPathfinding } from './bfs';

const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

const MAX_RECURSION_DEPTH = 10;

function isValidPos(p: Position, size: number): boolean {
  return p.x >= 0 && p.x < size && p.y >= 0 && p.y < size;
}

/**
 * Generate a maze using recursive backtracking + BFS solvability guarantee.
 * Optimized: batch obstacle placement with single BFS verification at end,
 * instead of per-obstacle BFS check.
 */
export function generateMaze(
  size: number,
  obstacleRate: number,
  customStart?: Position,
  customGoal?: Position,
  recursionDepth = 0,
): Maze {
  // Clamp positions to maze bounds to prevent out-of-bounds crashes
  let start: Position = customStart && isValidPos(customStart, size)
    ? { ...customStart }
    : { x: 0, y: 0 };
  let goal: Position = customGoal && isValidPos(customGoal, size)
    ? { ...customGoal }
    : { x: size - 1, y: size - 1 };

  // Fallback for max recursion depth
  if (recursionDepth >= MAX_RECURSION_DEPTH) {
    return buildFallbackMaze(size, start, goal);
  }

  // Initialize all-obstacle grid
  const maze: Maze = [];
  for (let y = 0; y < size; y++) {
    const row: { type: string; agentId?: number }[] = [];
    for (let x = 0; x < size; x++) {
      row.push({ type: 'obstacle' });
    }
    maze.push(row as Maze[0]);
  }

  // Recursive backtracking to carve passages
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const stack: Position[] = [];

  let current: Position = { ...start };
  visited[current.y][current.x] = true;
  maze[current.y][current.x].type = 'empty';
  stack.push(current);

  while (stack.length > 0) {
    const shuffled = shuffleArray(DIRECTIONS);
    let found = false;

    for (const dir of shuffled) {
      const next: Position = {
        x: current.x + dir.x * 2,
        y: current.y + dir.y * 2,
      };

      if (
        next.x >= 0 && next.x < size &&
        next.y >= 0 && next.y < size &&
        !visited[next.y][next.x]
      ) {
        visited[next.y][next.x] = true;
        maze[next.y][next.x].type = 'empty';
        maze[current.y + dir.y][current.x + dir.x].type = 'empty';
        stack.push(current);
        current = next;
        found = true;
        break;
      }
    }

    if (!found) {
      current = stack.pop()!;
    }
  }

  // Ensure start and goal are empty
  maze[start.y][start.x].type = 'empty';
  maze[goal.y][goal.x].type = 'empty';

  // Find guaranteed path to protect
  const guaranteedPath = bfsPathfinding(maze, start, goal).path;
  const guaranteedPathSet = new Set(guaranteedPath.map(p => `${p.x},${p.y}`));

  // Collect empty cells that are NOT on the guaranteed path
  const emptyCells: Position[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (
        maze[y][x].type === 'empty' &&
        !(x === start.x && y === start.y) &&
        !(x === goal.x && y === goal.y) &&
        !guaranteedPathSet.has(`${x},${y}`)
      ) {
        emptyCells.push({ x, y });
      }
    }
  }

  // Batch obstacle placement: calculate how many to add, shuffle, add them all
  const totalCells = size * size;
  const targetObstacles = Math.floor(totalCells * obstacleRate);
  let currentObstacles = 0;
  for (const row of maze) {
    for (const cell of row) {
      if (cell.type === 'obstacle') currentObstacles++;
    }
  }
  const obstaclesToAdd = Math.max(0, targetObstacles - currentObstacles);

  shuffleArray(emptyCells);

  // Add obstacles in batch (no per-obstacle BFS check)
  const added: Position[] = [];
  for (let i = 0; i < Math.min(obstaclesToAdd, emptyCells.length); i++) {
    const { x, y } = emptyCells[i];
    maze[y][x].type = 'obstacle';
    added.push({ x, y });
  }

  // Single BFS verification at the end
  const pathResult = bfsPathfinding(maze, start, goal);
  if (pathResult.path.length === 0) {
    // Undo all added obstacles and retry with fewer
    for (const { x, y } of added) {
      maze[y][x].type = 'empty';
    }
    // Binary search for max obstacles that keep solvability
    const solvable = findMaxSolvableObstacles(maze, emptyCells, start, goal);
    for (let i = 0; i < solvable; i++) {
      maze[emptyCells[i].y][emptyCells[i].x].type = 'obstacle';
    }
  }

  // Final solvability check — regenerate if still unsolvable
  const finalCheck = bfsPathfinding(maze, start, goal);
  if (finalCheck.path.length === 0) {
    return generateMaze(size, obstacleRate, customStart, customGoal, recursionDepth + 1);
  }

  maze[start.y][start.x].type = 'start';
  maze[goal.y][goal.x].type = 'goal';
  return maze;
}

/**
 * Binary search for the maximum number of obstacles from the shuffled list
 * that can be added while keeping the maze solvable.
 */
function findMaxSolvableObstacles(
  maze: Maze,
  emptyCells: Position[],
  start: Position,
  goal: Position,
): number {
  let lo = 0;
  let hi = emptyCells.length;

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    // Apply mid obstacles
    const added: Position[] = [];
    for (let i = 0; i < mid && i < emptyCells.length; i++) {
      const { x, y } = emptyCells[i];
      if (maze[y][x].type !== 'obstacle') {
        maze[y][x].type = 'obstacle';
        added.push({ x, y });
      }
    }

    const result = bfsPathfinding(maze, start, goal);

    // Undo
    for (const { x, y } of added) {
      maze[y][x].type = 'empty';
    }

    if (result.path.length > 0) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}

function buildFallbackMaze(size: number, start: Position, goal: Position): Maze {
  const maze: Maze = [];
  for (let y = 0; y < size; y++) {
    const row: { type: string; agentId?: number }[] = [];
    for (let x = 0; x < size; x++) {
      row.push({ type: 'obstacle' });
    }
    maze.push(row as Maze[0]);
  }
  for (let x = 0; x <= goal.x && x < size; x++) {
    maze[start.y][x].type = 'empty';
  }
  for (let y = start.y; y <= goal.y && y < size; y++) {
    maze[y][goal.x].type = 'empty';
  }
  maze[start.y][start.x].type = 'start';
  maze[goal.y][goal.x].type = 'goal';
  return maze;
}

/** Fisher-Yates shuffle — unbiased, O(n) */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
