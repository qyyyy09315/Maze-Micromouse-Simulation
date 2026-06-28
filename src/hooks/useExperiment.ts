import { useState, useCallback, useEffect, useRef } from 'react';
import type { ExperimentResult, Maze, Position, Cell } from '../types';
import { aStarPathfinding, bfsPathfinding } from '../algorithms';
import { toast } from 'sonner';

/**
 * Generates a solvable maze with random obstacles (not recursive-backtracking).
 * This creates open spaces where different heuristics make different decisions,
 * making the heuristic comparison meaningful.
 */
function generateOpenMaze(size: number, rate: number, start: Position, goal: Position): Maze {
  const total = size * size;
  const target = Math.floor(total * rate);

  // Start with all-empty grid
  const maze: Maze = [];
  for (let y = 0; y < size; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < size; x++) {
      row.push({ type: 'empty' });
    }
    maze.push(row);
  }

  // Collect all cells except start/goal
  const cells: Position[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x === start.x && y === start.y) || (x === goal.x && y === goal.y)) continue;
      cells.push({ x, y });
    }
  }

  // Shuffle and add obstacles in batches, verifying solvability
  fisherYates(cells);
  const added: Position[] = [];

  for (let i = 0; i < Math.min(target, cells.length); i++) {
    const { x, y } = cells[i];
    maze[y][x].type = 'obstacle';
    added.push({ x, y });
  }

  // Verify solvability; binary-search reduce if blocked
  if (bfsPathfinding(maze, start, goal).path.length === 0) {
    for (const { x, y } of added) maze[y][x].type = 'empty';
    // Binary search for max solvable obstacles
    let lo = 0, hi = added.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      for (let i = 0; i < mid; i++) maze[added[i].y][added[i].x].type = 'obstacle';
      if (bfsPathfinding(maze, start, goal).path.length > 0) {
        lo = mid;
      } else {
        for (let i = 0; i < mid; i++) maze[added[i].y][added[i].x].type = 'empty';
        hi = mid - 1;
      }
    }
    for (let i = 0; i < lo; i++) maze[added[i].y][added[i].x].type = 'obstacle';
    for (let i = lo; i < added.length; i++) maze[added[i].y][added[i].x].type = 'empty';
  }

  maze[start.y][start.x].type = 'start';
  maze[goal.y][goal.x].type = 'goal';
  return maze;
}

/**
 * Fisher-Yates shuffle in-place.
 */
function fisherYates<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Hook for running heuristic comparison experiments.
 * Tests A* with three heuristics across obstacle rates 5%–40%.
 * Uses open-grid mazes (random obstacles) so heuristics show meaningful
 * differences in explored node counts.
 */
export function useExperiment(mazeSize: number) {
  const [experimentResults, setExperimentResults] = useState<ExperimentResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const mazeSizeRef = useRef(mazeSize);
  mazeSizeRef.current = mazeSize;

  // Clear stale results when maze size changes
  useEffect(() => {
    setExperimentResults([]);
    setProgress(0);
  }, [mazeSize]);

  const runHeuristicComparison = useCallback(() => {
    setIsRunning(true);
    setProgress(0);

    setTimeout(() => {
      const size = mazeSizeRef.current;
      const results: ExperimentResult[] = [];
      const start: Position = { x: 0, y: 0 };
      const goal: Position = { x: size - 1, y: size - 1 };

      // Lower rates show heuristic differences better (more open space)
      const rates = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40];

      for (let i = 0; i < rates.length; i++) {
        const rate = rates[i];
        const testMaze = generateOpenMaze(size, rate, start, goal);

        const manhattan = aStarPathfinding(testMaze, start, goal, 'manhattan');
        const euclidean = aStarPathfinding(testMaze, start, goal, 'euclidean');
        const diagonal = aStarPathfinding(testMaze, start, goal, 'diagonal');

        results.push({
          obstacleRate: rate,
          // Use explored node counts — the meaningful metric for heuristic comparison.
          // A* always finds the optimal path with any admissible heuristic,
          // so path.length is identical; exploredNodes shows the efficiency gain.
          manhattanNodes: manhattan.exploredNodes.length,
          euclideanNodes: euclidean.exploredNodes.length,
          diagonalNodes: diagonal.exploredNodes.length,
          optimalNodes: Math.min(
            manhattan.exploredNodes.length,
            euclidean.exploredNodes.length,
            diagonal.exploredNodes.length,
          ),
        });

        setProgress(i + 1);
      }

      setExperimentResults(results);
      setIsRunning(false);
      toast.success('启发式对比实验完成！');
    }, 50);
  }, []);

  return { experimentResults, isRunning, progress, runHeuristicComparison };
}
