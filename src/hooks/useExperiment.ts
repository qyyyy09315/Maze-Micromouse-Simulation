import { useState, useCallback, useEffect, useRef } from 'react';
import type { ExperimentResult, Maze, Position } from '../types';
import { generateMaze, aStarPathfinding } from '../algorithms';
import { toast } from 'sonner';

/**
 * Hook for running heuristic comparison experiments.
 * Tests A* with three heuristics across obstacle rates 10%–50%.
 * Computation is deferred via setTimeout to avoid blocking the UI.
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

    // Defer to next tick so the loading state renders before heavy computation
    setTimeout(() => {
      const size = mazeSizeRef.current;
      const results: ExperimentResult[] = [];
      const start: Position = { x: 0, y: 0 };
      const goal: Position = { x: size - 1, y: size - 1 };
      const rates = [0.1, 0.2, 0.3, 0.4, 0.5];

      for (let i = 0; i < rates.length; i++) {
        const rate = rates[i];
        const testMaze: Maze = generateMaze(size, rate, start, goal);

        const manhattan = aStarPathfinding(testMaze, start, goal, 'manhattan');
        const euclidean = aStarPathfinding(testMaze, start, goal, 'euclidean');
        const diagonal = aStarPathfinding(testMaze, start, goal, 'diagonal');

        results.push({
          obstacleRate: rate,
          manhattanNodes: manhattan.path.length,
          euclideanNodes: euclidean.path.length,
          diagonalNodes: diagonal.path.length,
          optimalNodes: Math.min(
            manhattan.path.length,
            euclidean.path.length,
            diagonal.path.length,
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
