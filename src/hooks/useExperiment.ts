import { useState, useCallback } from 'react';
import type { ExperimentResult, Maze, Position } from '../types';
import { generateMaze, aStarPathfinding } from '../algorithms';
import { toast } from 'sonner';

/**
 * Hook for running heuristic comparison experiments.
 * Tests A* with different heuristics across varying obstacle rates.
 */
export function useExperiment(mazeSize: number) {
  const [experimentResults, setExperimentResults] = useState<ExperimentResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHeuristicComparison = useCallback(() => {
    setIsRunning(true);
    const results: ExperimentResult[] = [];
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: mazeSize - 1, y: mazeSize - 1 };

    for (let rate = 0.1; rate <= 0.5; rate += 0.1) {
      const testMaze: Maze = generateMaze(mazeSize, rate);

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
    }

    setExperimentResults(results);
    setIsRunning(false);
    toast.success('启发式对比实验完成！');
  }, [mazeSize]);

  return { experimentResults, isRunning, runHeuristicComparison };
}
