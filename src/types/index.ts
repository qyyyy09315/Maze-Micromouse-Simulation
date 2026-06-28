export type Position = { x: number; y: number };

export type CellType =
  | 'empty'
  | 'obstacle'
  | 'start'
  | 'goal'
  | 'explored'
  | 'final-path';

export type Cell = { type: CellType; agentId?: number };
export type Maze = Cell[][];

export type HeuristicType = 'manhattan' | 'euclidean' | 'diagonal';
export type AgentStrategy = 'follower' | 'competitor' | 'random';
export type PathfindingAlgorithm = 'bfs' | 'astar';

export interface Agent {
  id: number;
  position: Position;
  previousPosition: Position | null;
  path: Position[];
  exploredNodes: Position[];
  color: string;
  isActive: boolean;
  strategy: AgentStrategy;
  stepsTaken: number;
  collisions: number;
  heuristicType: HeuristicType | 'auto';
  pathfindingAlgorithm: PathfindingAlgorithm;
  pathfindingTime?: number;
}

export interface ExperimentResult {
  obstacleRate: number;
  manhattanNodes: number;
  euclideanNodes: number;
  diagonalNodes: number;
  optimalNodes: number;
}

export interface CompetitionResult {
  agentId: number;
  wins: number;
  averagePathLength: number;
  averageExploredNodes: number;
  averagePathfindingTime: number;
  collisionRate: number;
}

export interface PathfindingResult {
  path: Position[];
  exploredNodes: Position[];
  time: number;
}

export const DEFAULT_MAZE_SIZE = 20;
export const DEFAULT_OBSTACLE_RATE = 0.3;
export const AGENT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
export const MAX_AGENTS = 5;
export const MIN_MAZE_SIZE = 10;
export const MAX_MAZE_SIZE = 500;

// ── Simulation timing constants ──
export const SIM_TICK_MS = 200;
export const EXPERIMENT_DEFER_MS = 50;
export const COLLISION_MAX_ROUNDS = 10;

// ── Rendering thresholds ──
export const CELL_SIZE_LABEL_THRESHOLD = 10;
export const CELL_SIZE_SG_THRESHOLD = 12;
export const CELL_SIZE_BORDER_THRESHOLD = 6;
