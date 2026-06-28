import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  Maze, Position, Agent, HeuristicType, PathfindingAlgorithm,
  AgentStrategy, CompetitionResult, Cell,
} from '../types';
import { AGENT_COLORS } from '../types';
import {
  aStarPathfinding, bfsPathfinding, generateMaze,
  checkCollisions, euclideanDistance,
} from '../algorithms';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────

function clampPosition(pos: Position, size: number): Position {
  return {
    x: Math.max(0, Math.min(size - 1, pos.x)),
    y: Math.max(0, Math.min(size - 1, pos.y)),
  };
}

function isValidPos(p: Position, size: number): boolean {
  return p.x >= 0 && p.x < size && p.y >= 0 && p.y < size;
}

function getCenterPosition(size: number): Position {
  return { x: Math.floor(size / 2), y: Math.floor(size / 2) };
}

function findPath(
  maze: Maze,
  start: Position,
  goal: Position,
  algorithm: PathfindingAlgorithm,
  heuristicType: HeuristicType | 'auto',
) {
  if (algorithm === 'bfs') return bfsPathfinding(maze, start, goal);
  return aStarPathfinding(
    maze, start, goal,
    heuristicType === 'auto' ? undefined : heuristicType,
  );
}

function parseMazeFile(content: string, mazeSize: number): Maze | null {
  const rows = content.trim().split('\n').map(r => r.trim());
  if (rows.length !== mazeSize) return null;

  const maze: Maze = [];
  for (let y = 0; y < rows.length; y++) {
    if (rows[y].length !== mazeSize) return null;
    const row: Cell[] = [];
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch !== '0' && ch !== '1') return null;
      row.push({ type: ch === '1' ? 'obstacle' : 'empty' });
    }
    maze.push(row);
  }
  return maze;
}

// ─── Hook ─────────────────────────────────────────────────

export interface SimulationConfig {
  mazeSize: number;
  obstacleRate: number;
  agentCount: number;
  selectedHeuristic: HeuristicType | 'auto';
  selectedAlgorithm: PathfindingAlgorithm;
  agentHeuristics: (HeuristicType | 'auto')[];
  agentAlgorithms: PathfindingAlgorithm[];
  useSameStart: boolean;
  showExploration: boolean;
  showPath: boolean;
  visualizationSpeed: number;
  mazeSource: 'random' | 'file';
  customStart: Position;
  customGoal: Position;
  fileContent: string;
}

export function useMazeSimulation(config: SimulationConfig) {
  const [maze, setMaze] = useState<Maze>(() =>
    generateMaze(config.mazeSize, config.obstacleRate, config.customStart, config.customGoal),
  );
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [competitionResults, setCompetitionResults] = useState<CompetitionResult[]>([]);
  const [currentSearchStep, setCurrentSearchStep] = useState(0);
  const [isVisualizing, setIsVisualizing] = useState(false);

  // Refs for accessing latest values inside intervals/callbacks
  const configRef = useRef(config);
  configRef.current = config;
  const agentsRef = useRef(agents);
  agentsRef.current = agents;
  const mazeRef = useRef(maze);
  mazeRef.current = maze;
  const resultsRef = useRef(competitionResults);
  resultsRef.current = competitionResults;
  const tickRef = useRef(0);

  // ✅ Base maze ref — stores the original maze structure for reference.
  // Dynamic obstacle adjustment only modifies cells that were 'empty' in the
  // base maze, preserving structural walls.
  const baseMazeRef = useRef<Maze | null>(null);

  // ── Regenerate maze when size/obstacle/start changes ──
  useEffect(() => {
    const center = getCenterPosition(config.mazeSize);
    const goal = config.customGoal.x === 0 && config.customGoal.y === 0 ? center : config.customGoal;
    const newMaze = generateMaze(config.mazeSize, config.obstacleRate, config.customStart, goal);
    setMaze(newMaze);
    // Deep-copy as base reference for dynamic obstacle adjustment
    baseMazeRef.current = newMaze.map(row => row.map(cell => ({ ...cell })));
  }, [config.mazeSize, config.obstacleRate, config.customStart]);

  // ── Initialize agents ──
  const initializeAgents = useCallback(() => {
    const cfg = configRef.current;
    const m = mazeRef.current;
    const size = m.length;
    const goal = cfg.customGoal;
    const newAgents: Agent[] = [];
    let commonStart: Position | null = null;
    const strategies: AgentStrategy[] = ['follower', 'competitor', 'random'];

    for (let i = 0; i < cfg.agentCount; i++) {
      let startPos: Position;
      if (cfg.useSameStart && commonStart) {
        startPos = commonStart;
      } else {
        const cs = cfg.customStart;
        if (
          cs && isValidPos(cs, size) &&
          m[cs.y][cs.x].type !== 'obstacle' &&
          !(cs.x === goal.x && cs.y === goal.y)
        ) {
          startPos = cs;
        } else {
          do {
            startPos = {
              x: Math.floor(Math.random() * size),
              y: Math.floor(Math.random() * size),
            };
          } while (
            m[startPos.y][startPos.x].type === 'obstacle' ||
            (startPos.x === goal.x && startPos.y === goal.y)
          );
        }
        if (cfg.useSameStart) commonStart = startPos;
      }

      const heuristic = cfg.agentHeuristics[i] || cfg.selectedHeuristic;
      const algorithm = cfg.agentAlgorithms[i] || cfg.selectedAlgorithm;
      const result = findPath(m, startPos, goal, algorithm, heuristic);

      newAgents.push({
        id: i,
        position: clampPosition(startPos, size),
        previousPosition: null,
        path: result.path.length > 0
          ? result.path.map(p => clampPosition(p, size))
          : [clampPosition(startPos, size)],
        exploredNodes: result.exploredNodes,
        color: AGENT_COLORS[i % AGENT_COLORS.length],
        isActive: true,
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        stepsTaken: 0,
        collisions: 0,
        heuristicType: heuristic,
        pathfindingAlgorithm: algorithm,
        pathfindingTime: result.time,
      });
    }

    setAgents(newAgents);
  }, []); // reads everything from refs

  // ── Start experiment ──
  const startExperiment = useCallback(() => {
    if (agentsRef.current.length === 0) initializeAgents();
    setIsRunning(true);
    setIsPaused(false);
    setCurrentSearchStep(0);
  }, [initializeAgents]);

  // ── Pause / Resume ──
  const pauseExperiment = useCallback(() => setIsPaused(true), []);
  const resumeExperiment = useCallback(() => setIsPaused(false), []);

  // ── Reset ──
  const resetExperiment = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    tickRef.current = 0;
    const cfg = configRef.current;
    const center = getCenterPosition(cfg.mazeSize);

    if (cfg.mazeSource === 'file' && cfg.fileContent) {
      const fileMaze = parseMazeFile(cfg.fileContent, cfg.mazeSize);
      if (fileMaze) {
        fileMaze[cfg.customStart.y][cfg.customStart.x].type = 'start';
        fileMaze[center.y][center.x].type = 'goal';
        setMaze(fileMaze);
        baseMazeRef.current = fileMaze.map(row => row.map(cell => ({ ...cell })));
        // Initialize agents after maze is set
        setTimeout(() => {
          mazeRef.current = fileMaze;
          initializeAgents();
        }, 0);
        return;
      }
    }

    const newMaze = generateMaze(cfg.mazeSize, cfg.obstacleRate, cfg.customStart, center);
    setMaze(newMaze);
    baseMazeRef.current = newMaze.map(row => row.map(cell => ({ ...cell })));
    setTimeout(() => {
      mazeRef.current = newMaze;
      initializeAgents();
    }, 0);
  }, [initializeAgents]);

  // ── Simulation tick ──
  const simulationTick = useCallback(() => {
    const cfg = configRef.current;
    const m = mazeRef.current;
    const size = m.length;
    const goal = cfg.customGoal;

    setAgents(prevAgents => {
      const updated = prevAgents.map(a => ({ ...a }));
      const active = updated.filter(a => a.isActive && a.position);

      // Find leading agent
      const leader = active.length > 0
        ? active.reduce((prev, cur) =>
            euclideanDistance(cur.position, goal) < euclideanDistance(prev.position, goal) ? cur : prev,
          )
        : null;

      for (let i = 0; i < updated.length; i++) {
        const agent = updated[i];
        if (!agent.isActive || !agent.position) continue;

        // Check goal
        if (agent.position.x === goal.x && agent.position.y === goal.y) {
          updated[i] = { ...agent, isActive: false };
          continue;
        }

        const agentHeuristic = agent.heuristicType === 'auto' ? undefined : agent.heuristicType;
        let targetPos: Position | null = null;

        // Strategy logic
        switch (agent.strategy) {
          case 'follower': {
            if (leader && leader.id !== agent.id && leader.position) {
              // Follow the leader by pathfinding toward its current position
              const toLeader = findPath(m, agent.position, leader.position, agent.pathfindingAlgorithm, agent.heuristicType);
              if (toLeader.path.length > 1) {
                const next = toLeader.path[1];
                if (next && isValidPos(next, size) && m[next.y]?.[next.x]?.type !== 'obstacle') {
                  targetPos = next;
                }
              }
            }
            break;
          }
          case 'competitor': {
            if (leader && leader.id !== agent.id && leader.position) {
              const leadResult = agent.pathfindingAlgorithm === 'bfs'
                ? bfsPathfinding(m, leader.position, goal)
                : aStarPathfinding(m, leader.position, goal, agentHeuristic);
              if (leadResult.path.length > 2) {
                const interceptIdx = Math.min(3, leadResult.path.length - 1);
                const interceptPt = leadResult.path[interceptIdx];
                if (interceptPt && isValidPos(interceptPt, size)) {
                  const toIntercept = agent.pathfindingAlgorithm === 'bfs'
                    ? bfsPathfinding(m, agent.position, interceptPt)
                    : aStarPathfinding(m, agent.position, interceptPt, agentHeuristic);
                  if (toIntercept.path.length > 1) {
                    const next = toIntercept.path[1];
                    if (next && isValidPos(next, size)) targetPos = next;
                  }
                }
              }
            }
            break;
          }
          case 'random': {
            if (Math.random() < 0.1) {
              const dirs = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
              ];
              const valid = dirs
                .map(d => ({ x: agent.position.x + d.x, y: agent.position.y + d.y }))
                .filter(p =>
                  isValidPos(p, size) &&
                  m[p.y] && m[p.y][p.x] && m[p.y][p.x].type !== 'obstacle',
                );
              if (valid.length > 0) targetPos = valid[Math.floor(Math.random() * valid.length)];
            }
            break;
          }
        }

        // Default: follow own path or recalculate
        if (!targetPos) {
          const path = agent.path;
          const nextIdx = agent.stepsTaken + 1;

          if (
            path.length > nextIdx &&
            path[nextIdx] &&
            isValidPos(path[nextIdx], size) &&
            m[path[nextIdx].y] && m[path[nextIdx].y][path[nextIdx].x] &&
            m[path[nextIdx].y][path[nextIdx].x].type !== 'obstacle'
          ) {
            targetPos = path[nextIdx];
          } else {
            // Recalculate path
            const result = findPath(m, agent.position, goal, agent.pathfindingAlgorithm, agent.heuristicType);
            if (result.path.length > 0) {
              updated[i].path = result.path;
              targetPos = result.path[1] || result.path[0];
            } else {
              // Stuck — try random move
              const dirs = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
              ];
              const valid = dirs
                .map(d => ({ x: agent.position.x + d.x, y: agent.position.y + d.y }))
                .filter(p =>
                  isValidPos(p, size) &&
                  m[p.y] && m[p.y][p.x] && m[p.y][p.x].type !== 'obstacle',
                );
              if (valid.length > 0) {
                targetPos = valid[Math.floor(Math.random() * valid.length)];
              } else {
                updated[i] = { ...agent, isActive: false };
                continue;
              }
            }
          }
        }

        if (targetPos) {
          updated[i] = {
            ...agent,
            position: clampPosition(targetPos, size),
            previousPosition: { ...agent.position },
            stepsTaken: agent.stepsTaken + 1,
          };
        }
      }

      // Collision detection
      const collisions = checkCollisions(updated, m, size);
      if (collisions.length > 0) {
        toast.info(`碰撞：智能体 ${collisions.join(', ')}`);
      }

      // Check completion
      const allDone = updated.every(a => !a.isActive);
      if (allDone) {
        setIsRunning(false);
        const goalAgents = updated.filter(
          a => a.position && a.position.x === goal.x && a.position.y === goal.y,
        );
        if (goalAgents.length > 0) {
          goalAgents.sort((a, b) =>
            a.stepsTaken !== b.stepsTaken ? a.stepsTaken - b.stepsTaken : a.id - b.id,
          );
          const winner = goalAgents[0];
          toast.success(`竞赛结束！获胜者：智能体 ${winner.id + 1}`);

          // Update competition results with raw data accumulation
          setCompetitionResults(prev => {
            const next = [...prev];
            const idx = next.findIndex(r => r.agentId === winner.id);
            const steps = winner.stepsTaken || 1; // avoid div-by-zero
            const newResult = {
              agentId: winner.id,
              wins: 1,
              averagePathLength: winner.stepsTaken,
              averageExploredNodes: winner.exploredNodes.length,
              averagePathfindingTime: winner.pathfindingTime || 0,
              collisionRate: winner.collisions / steps,
            };
            if (idx >= 0) {
              const old = next[idx];
              const w = old.wins;
              next[idx] = {
                agentId: old.agentId,
                wins: w + 1,
                averagePathLength: (old.averagePathLength * w + newResult.averagePathLength) / (w + 1),
                averageExploredNodes: (old.averageExploredNodes * w + newResult.averageExploredNodes) / (w + 1),
                averagePathfindingTime: (old.averagePathfindingTime * w + newResult.averagePathfindingTime) / (w + 1),
                collisionRate: (old.collisionRate * w + newResult.collisionRate) / (w + 1),
              };
            } else {
              next.push(newResult);
            }
            return next;
          });
        }
      }

      return updated;
    });
  }, []);

  // ── Dynamic obstacle adjustment (every ~10s) ──
  // Only adds/removes obstacles from cells that were originally 'empty' in
  // the base maze, preserving structural walls that were 'obstacle' originally.
  const dynamicObstacleTick = useCallback(() => {
    const cfg = configRef.current;
    const base = baseMazeRef.current;
    if (!isRunning || isPaused || !base) return;

    tickRef.current++;
    if (tickRef.current % 50 === 0) {
      const change = (Math.random() - 0.5) * 0.1;
      const newRate = Math.max(0.1, Math.min(0.5, cfg.obstacleRate + change));

      setMaze(prev => {
        // Only adjust cells that were 'empty' in the original base maze
        const adjusted = prev.map((row, y) =>
          row.map((cell, x) => {
            const baseType = base[y]?.[x]?.type;
            // Never modify structural walls, start, or goal
            if (baseType !== 'empty') return { ...cell };
            // Never modify start/goal positions
            if (
              (x === cfg.customStart.x && y === cfg.customStart.y) ||
              (x === cfg.customGoal.x && y === cfg.customGoal.y)
            ) return { ...cell };
            return { ...cell };
          }),
        );

        // Count current obstacles among modifiable cells
        let currentObstacles = 0;
        let modifiableCount = 0;
        for (let y = 0; y < adjusted.length; y++) {
          for (let x = 0; x < adjusted[y].length; x++) {
            if (base[y][x].type === 'empty') {
              modifiableCount++;
              if (adjusted[y][x].type === 'obstacle') currentObstacles++;
            }
          }
        }

        if (modifiableCount === 0) return adjusted;

        const targetObstacles = Math.round(newRate * modifiableCount);

        if (targetObstacles > currentObstacles) {
          // Add obstacles
          let added = 0;
          let safety = 0;
          const toAdd = targetObstacles - currentObstacles;
          while (added < toAdd && safety++ < modifiableCount * 2) {
            const x = Math.floor(Math.random() * adjusted[0].length);
            const y = Math.floor(Math.random() * adjusted.length);
            if (base[y][x].type !== 'empty') continue;
            if (
              (x === cfg.customStart.x && y === cfg.customStart.y) ||
              (x === cfg.customGoal.x && y === cfg.customGoal.y) ||
              adjusted[y][x].type === 'obstacle'
            ) continue;
            adjusted[y][x].type = 'obstacle';
            added++;
          }
        } else if (targetObstacles < currentObstacles) {
          // Remove obstacles — only from originally-empty cells
          let removed = 0;
          let safety = 0;
          const toRemove = currentObstacles - targetObstacles;
          while (removed < toRemove && safety++ < modifiableCount * 2) {
            const x = Math.floor(Math.random() * adjusted[0].length);
            const y = Math.floor(Math.random() * adjusted.length);
            if (base[y][x].type !== 'empty') continue;
            if (adjusted[y][x].type !== 'obstacle') continue;
            adjusted[y][x].type = 'empty';
            removed++;
          }
        }

        // Clear obstacles under active agents
        for (const agent of agentsRef.current) {
          if (agent.isActive && agent.position && isValidPos(agent.position, cfg.mazeSize)) {
            if (adjusted[agent.position.y][agent.position.x].type === 'obstacle') {
              adjusted[agent.position.y][agent.position.x].type = 'empty';
            }
          }
        }

        return adjusted;
      });

      toast.info(`迷宫障碍率已调整为：${(newRate * 100).toFixed(0)}%`);
    }
  }, [isRunning, isPaused]);

  // ── Visualization animation ──
  useEffect(() => {
    if (!isRunning || isPaused || !config.showExploration) return;

    const maxNodes = Math.max(...agents.map(a => a.exploredNodes.length), 0);
    if (maxNodes === 0) return;

    setIsVisualizing(true);
    setCurrentSearchStep(0);

    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step <= maxNodes) {
        setCurrentSearchStep(step);
      } else {
        setIsVisualizing(false);
        clearInterval(timer);
      }
    }, config.visualizationSpeed);

    return () => clearInterval(timer);
  }, [isRunning, isPaused, agents.length, config.showExploration, config.visualizationSpeed]);

  // ── Main simulation loop ──
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      simulationTick();
      dynamicObstacleTick();
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, simulationTick, dynamicObstacleTick]);

  // ── File parsing ──
  const loadMazeFile = useCallback((content: string): boolean => {
    const cfg = configRef.current;
    const parsed = parseMazeFile(content, cfg.mazeSize);
    if (!parsed) {
      toast.error('无效的迷宫文件：行列数不匹配或包含非法字符');
      return false;
    }
    parsed[cfg.customStart.y][cfg.customStart.x].type = 'start';
    const center = getCenterPosition(cfg.mazeSize);
    parsed[center.y][center.x].type = 'goal';
    setMaze(parsed);
    mazeRef.current = parsed;
    baseMazeRef.current = parsed.map(row => row.map(cell => ({ ...cell })));
    toast.success('迷宫文件解析成功！');
    return true;
  }, []);

  return {
    maze,
    agents,
    isRunning,
    isPaused,
    competitionResults,
    currentSearchStep,
    isVisualizing,
    initializeAgents,
    startExperiment,
    pauseExperiment,
    resumeExperiment,
    resetExperiment,
    loadMazeFile,
    setMaze,
  };
}
