import type { Maze, Position, PathfindingResult } from '../types';

const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

interface BFSNode {
  position: Position;
  parent?: BFSNode;
}

/**
 * BFS pathfinding with double-pointer queue (O(1) dequeue).
 * Replaces Array.shift() which is O(n) per call.
 */
export function bfsPathfinding(
  maze: Maze,
  start: Position,
  goal: Position,
): PathfindingResult {
  const size = maze.length;
  if (size === 0 || !isValid(start, size) || !isValid(goal, size)) {
    return { path: [], exploredNodes: [], time: 0 };
  }

  const startTime = performance.now();
  const visited = new Set<string>();
  const exploredNodes: Position[] = [];

  // Double-pointer queue: O(1) enqueue and dequeue
  const queue: BFSNode[] = [];
  let head = 0;

  queue.push({ position: { ...start } });
  visited.add(`${start.x},${start.y}`);

  while (head < queue.length) {
    const current = queue[head++];

    exploredNodes.push(current.position);

    if (current.position.x === goal.x && current.position.y === goal.y) {
      const path = reconstructPath(current);
      return { path, exploredNodes, time: performance.now() - startTime };
    }

    for (const dir of DIRECTIONS) {
      const nx = current.position.x + dir.x;
      const ny = current.position.y + dir.y;

      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
      if (maze[ny][nx].type === 'obstacle') continue;

      const nKey = `${nx},${ny}`;
      if (visited.has(nKey)) continue;

      visited.add(nKey);
      queue.push({
        position: { x: nx, y: ny },
        parent: current,
      });
    }
  }

  return { path: [], exploredNodes, time: performance.now() - startTime };
}

function reconstructPath(node: BFSNode): Position[] {
  const path: Position[] = [];
  let current: BFSNode | undefined = node;
  while (current) {
    path.push(current.position);
    current = current.parent;
  }
  return path.reverse();
}

function isValid(p: Position, size: number): boolean {
  return p.x >= 0 && p.x < size && p.y >= 0 && p.y < size;
}
