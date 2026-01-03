import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayCircle, PauseCircle, RotateCcw, Settings, 
  ChevronDown, BarChart3, Zap, Award, Github 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 类型定义
type Position = { x: number; y: number };
type CellType = 'empty' | 'obstacle' | 'start' | 'goal' | 'path' | 'agent' | 'explored' | 'current-path' | 'final-path';
type Cell = { type: CellType; agentId?: number };
type Maze = Cell[][];
type HeuristicType = 'manhattan' | 'euclidean' | 'diagonal';
type AgentStrategy = 'follower' | 'competitor' | 'random';
type PathfindingAlgorithm = 'bfs' | 'astar';

interface Agent {
  id: number;
  position: Position;
  path: Position[];
  exploredNodes: Position[]; // 记录搜索过程中探索的节点
  color: string;
  isActive: boolean;
  strategy: AgentStrategy;
  stepsTaken: number;
  collisions: number;
  heuristicType: HeuristicType | 'auto';
  pathfindingAlgorithm: PathfindingAlgorithm;
  pathfindingTime?: number; // 记录路径规划时间（ms）
}

interface ExperimentResult {
  obstacleRate: number;
  manhattanNodes: number;
  euclideanNodes: number;
  diagonalNodes: number;
  optimalNodes: number;
}

interface CompetitionResult {
  agentId: number;
  wins: number;
  averagePathLength: number;
  averageExploredNodes: number;
  averagePathfindingTime: number;
  collisionRate: number;
}

// 常量定义
// 迷宫默认大小
const DEFAULT_MAZE_SIZE = 20;
const AGENT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
const DEFAULT_OBSTACLE_RATE = 0.3;

// 辅助函数：检查位置是否在迷宫边界内
const isValidPosition = (position: Position, size: number): boolean => {
  return position && 
         typeof position.x === 'number' && 
         typeof position.y === 'number' && 
         position.x >= 0 && 
         position.x < size && 
         position.y >= 0 && 
         position.y < size;
};

// 辅助函数：确保位置在迷宫边界内
const clampPosition = (position: Position, size: number): Position => {
  return {
    x: Math.max(0, Math.min(size - 1, position.x)),
    y: Math.max(0, Math.min(size - 1, position.y))
  };
};



// 迷宫生成函数（单起点单终点版本）
const generateMaze = (size: number, obstacleRate: number, customStart?: Position, customGoal?: Position, recursionDepth: number = 0): Maze => {
  // 防止无限递归，设置最大递归深度
  const MAX_RECURSION_DEPTH = 10;
  if (recursionDepth >= MAX_RECURSION_DEPTH) {
    console.warn('Max recursion depth reached, returning maze with guaranteed path');
    // 确保至少有一条从起点到终点的路径
    const maze: Maze = [];
    // 使用自定义起点或默认左上角
    const start = customStart || { x: 0, y: 0 };
    // 使用自定义终点或默认右下角
    const goal = customGoal || { x: size - 1, y: size - 1 };
    
    // 初始化迷宫，所有单元格都是障碍物
    for (let y = 0; y < size; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < size; x++) {
        row.push({ type: 'obstacle' });
      }
      maze.push(row);
    }
    
    // 创建一条简单的路径
    for (let x = 0; x <= goal.x; x++) {
      if (x < size) {
        maze[start.y][x].type = 'empty';
      }
    }
    for (let y = start.y; y <= goal.y; y++) {
      if (y < size) {
        maze[y][goal.x].type = 'empty';
      }
    }
    
    // 设置起点和终点
    maze[start.y][start.x].type = 'start';
    maze[goal.y][goal.x].type = 'goal';
    
    return maze;
  }
  const maze: Maze = [];
  
  // 使用自定义起点或默认左上角
  const start = customStart || { x: 0, y: 0 };
  // 使用自定义终点或默认右下角
  const goal = customGoal || { x: size - 1, y: size - 1 };
  
  // 初始化迷宫，所有单元格都是障碍物
  for (let y = 0; y < size; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < size; x++) {
      row.push({ type: 'obstacle' });
    }
    maze.push(row);
  }

  // 使用递归回溯算法生成从起点到终点的路径
  const visited: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));
  const stack: Position[] = [];
  
  // 从起点开始
  let current: Position = { ...start };
  visited[current.y][current.x] = true;
  maze[current.y][current.x].type = 'empty';
  stack.push(current);
  
  // 定义四个方向：上、右、下、左
  const directions = [
    { x: 0, y: -1 }, // 上
    { x: 1, y: 0 },  // 右
    { x: 0, y: 1 },  // 下
    { x: -1, y: 0 }  // 左
  ];
  
  // 递归回溯算法生成迷宫路径
  while (stack.length > 0) {
    // 随机打乱方向顺序
    const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
    
    let found = false;
    for (const dir of shuffledDirections) {
      // 计算下一个单元格的位置
      const next: Position = {
        x: current.x + dir.x * 2, // 跳过一个单元格，用于创建墙壁
        y: current.y + dir.y * 2
      };
      
      // 检查下一个单元格是否在迷宫范围内且未被访问
      if (next.x >= 0 && next.x < size && next.y >= 0 && next.y < size && !visited[next.y][next.x]) {
        // 标记下一个单元格为已访问
        visited[next.y][next.x] = true;
        maze[next.y][next.x].type = 'empty';
        
        // 移除当前单元格和下一个单元格之间的墙壁
        const wall: Position = {
          x: current.x + dir.x,
          y: current.y + dir.y
        };
        maze[wall.y][wall.x].type = 'empty';
        
        // 将当前单元格推入栈
        stack.push(current);
        
        // 移动到下一个单元格
        current = next;
        found = true;
        break;
      }
    }
    
    // 如果没有找到未访问的相邻单元格，则回溯
    if (!found) {
      current = stack.pop()!;
    }
  }
  
  // 确保起点和终点都是空的
  maze[start.y][start.x].type = 'empty';
  maze[goal.y][goal.x].type = 'empty';
  
  // 先找到一条保证的路径，确保在高障碍率下仍有解
  const guaranteedPath = bfsPathfinding(maze, start, goal).path;
  const guaranteedPathSet = new Set(guaranteedPath.map(p => `${p.x},${p.y}`));
  
  // 统计当前迷宫中空单元格的数量
  let currentEmptyCells = 0;
  // 收集所有可用于设置障碍物的空单元格（非保证路径上的）
  const emptyCells: Position[] = [];
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (maze[y][x].type === 'empty') {
        currentEmptyCells++;
        const posKey = `${x},${y}`;
        // 只考虑非保证路径上的空单元格
        if ((x !== start.x || y !== start.y) && 
            (x !== goal.x || y !== goal.y) && 
            !guaranteedPathSet.has(posKey)) {
          emptyCells.push({ x, y });
        }
      }
    }
  }
  
  // 根据障碍率计算需要添加的障碍物数量
  const totalCells = size * size;
  const targetObstacles = Math.floor(totalCells * obstacleRate);
  const currentObstacles = totalCells - currentEmptyCells;
  const obstaclesToAdd = Math.max(0, targetObstacles - currentObstacles);
  
  // 随机打乱空单元格顺序
  emptyCells.sort(() => Math.random() - 0.5);
  
  // 在非保证路径的空单元格中随机添加障碍物
  for (let i = 0; i < obstaclesToAdd && i < emptyCells.length; i++) {
    const { x, y } = emptyCells[i];
    // 保存当前状态，以便在需要时恢复
    const originalType = maze[y][x].type;
    maze[y][x].type = 'obstacle';
    
    // 检查添加障碍物后迷宫是否仍然可解
    const pathCheck = bfsPathfinding(maze, start, goal);
    if (pathCheck.path.length === 0) {
      // 如果迷宫不可解，恢复原状态
      maze[y][x].type = originalType;
    }
  }
  
  // 验证迷宫是否有解，如果没有则重新生成
  let pathResult = bfsPathfinding(maze, start, goal);
  if (pathResult.path.length === 0) {
    // 如果没有路径，重新生成迷宫
    return generateMaze(size, obstacleRate, customStart, customGoal, recursionDepth + 1);
  }
  
  // 设置起点和终点
  maze[start.y][start.x].type = 'start';
  maze[goal.y][goal.x].type = 'goal';
  
  return maze;
};

// 启发函数实现
const manhattanDistance = (current: Position, goal: Position): number => {
  // 添加参数验证
  if (!current || !goal || typeof current.x !== 'number' || typeof current.y !== 'number' || 
      typeof goal.x !== 'number' || typeof goal.y !== 'number') {
    return 0;
  }
  return Math.abs(current.x - goal.x) + Math.abs(current.y - goal.y);
};

const euclideanDistance = (current: Position, goal: Position): number => {
  // 添加参数验证
  if (!current || !goal || typeof current.x !== 'number' || typeof current.y !== 'number' || 
      typeof goal.x !== 'number' || typeof goal.y !== 'number') {
    return 0;
  }
  return Math.sqrt(
    Math.pow(current.x - goal.x, 2) + Math.pow(current.y - goal.y, 2)
  );
};

const diagonalDistance = (current: Position, goal: Position): number => {
  // 添加参数验证
  if (!current || !goal || typeof current.x !== 'number' || typeof current.y !== 'number' || 
      typeof goal.x !== 'number' || typeof goal.y !== 'number') {
    return 0;
  }
  const dx = Math.abs(current.x - goal.x);
  const dy = Math.abs(current.y - goal.y);
  const D = 1;
  const D2 = Math.sqrt(2);
  return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
};

// 动态选择启发函数
const getHeuristicFunction = (obstacleRate: number, heuristicType?: HeuristicType) => {
  if (heuristicType) {
    switch (heuristicType) {
      case 'manhattan':
        return manhattanDistance;
      case 'euclidean':
        return euclideanDistance;
      case 'diagonal':
        return diagonalDistance;
      default:
        return manhattanDistance;
    }
  }
  
  // 根据障碍率自动选择
  if (obstacleRate < 0.2) {
    return manhattanDistance;
  } else if (obstacleRate < 0.4) {
    return euclideanDistance;
  } else {
    return diagonalDistance;
  }
};

// A*算法实现 - 返回路径、探索的节点和运行时间
const aStarPathfinding = (
  maze: Maze,
  start: Position,
  goal: Position,
  heuristicType?: HeuristicType
): { path: Position[]; exploredNodes: Position[]; time: number } => {
  // 参数验证
  if (!maze || !start || !goal || !maze.length || !maze[0].length || 
      !isValidPosition(start, maze.length) || !isValidPosition(goal, maze.length)) {
    console.error('Invalid parameters in aStarPathfinding');
    return { path: [], exploredNodes: [], time: 0 };
  }
  
  const startTime = performance.now(); // 开始计时
  
  try {
    const obstacleRate = calculateObstacleRate(maze);
    const heuristic = getHeuristicFunction(obstacleRate, heuristicType);
    
    interface Node {
      position: Position;
      g: number; // 从起点到当前节点的实际代价
      h: number; // 从当前节点到目标节点的估计代价
      f: number; // 总代价 f = g + h
      parent?: Node;
    }
    
    const openSet: Node[] = [];
    const closedSet: Set<string> = new Set();
    const exploredNodes: Position[] = []; // 记录探索的节点
    
    // 计算初始启发值时添加防御性编程
    let initialH = 0;
    try {
      initialH = heuristic(start, goal);
      // 确保启发值是有效的数字
      if (isNaN(initialH)) {
        initialH = 0;
      }
    } catch (error) {
      initialH = 0;
    }
    
    const startNode: Node = {
      position: { ...start },
      g: 0,
      h: initialH,
      f: initialH
    };
    
    openSet.push(startNode);
    
    while (openSet.length > 0) {
      // 找到f值最小的节点
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }
      
      const current = openSet.splice(currentIndex, 1)[0];
      
      // 到达目标
      if (current.position.x === goal.x && current.position.y === goal.y) {
        const path: Position[] = [];
        let currentNode: Node | undefined = current;
        
        while (currentNode) {
          path.push(currentNode.position);
          currentNode = currentNode.parent;
        }
        
        // 确保路径上的所有点都在迷宫边界内
        const size = maze.length;
        const clampedPath = path.reverse().map(pos => clampPosition(pos, size));
        const endTime = performance.now(); // 结束计时
        return { path: clampedPath, exploredNodes, time: endTime - startTime };
      }
      
      // 标记为已访问并记录探索节点
      closedSet.add(`${current.position.x},${current.position.y}`);
      exploredNodes.push(current.position);
      
      // 检查所有相邻节点
      const directions = [
        { x: 0, y: -1 }, // 上
        { x: 1, y: 0 },  // 右
        { x: 0, y: 1 },  // 下
        { x: -1, y: 0 }  // 左
      ];
      
      for (const dir of directions) {
        const neighborPos = {
          x: current.position.x + dir.x,
          y: current.position.y + dir.y
        };
        
        // 检查边界和障碍物
        if (
          neighborPos.x < 0 ||
          neighborPos.x >= maze[0].length ||
          neighborPos.y < 0 ||
          neighborPos.y >= maze.length ||
          !maze[neighborPos.y] ||
          !maze[neighborPos.y][neighborPos.x] ||
          maze[neighborPos.y][neighborPos.x].type === 'obstacle'
        ) {
          continue;
        }
        
        // 检查是否已访问
        if (closedSet.has(`${neighborPos.x},${neighborPos.y}`)) {
          continue;
        }
        
        // 计算代价，添加防御性编程
        const gScore = current.g + 1;
        let hScore = 0;
        try {
          hScore = heuristic(neighborPos, goal);
          // 确保启发值是有效的数字
          if (isNaN(hScore)) {
            hScore = 0;
          }
        } catch (error) {
          hScore = 0;
        }
        const fScore = gScore + hScore;
        
        // 检查是否已经在开放列表中
        const existingIndex = openSet.findIndex(
          node => node.position.x === neighborPos.x && node.position.y === neighborPos.y
        );
        
        if (existingIndex === -1) {
          // 添加到开放列表
          openSet.push({
            position: neighborPos,
            g: gScore,
            h: hScore,
            f: fScore,
            parent: current
          });
        } else if (gScore < openSet[existingIndex].g) {
          // 更新已存在的节点
          openSet[existingIndex].g = gScore;
          openSet[existingIndex].f = fScore;
          openSet[existingIndex].parent = current;
        }
      }
    }
  } catch (error) {
    console.error('Error in aStarPathfinding:', error);
    const endTime = performance.now(); // 结束计时
    return { path: [], exploredNodes: [], time: endTime - startTime };
  }
  
  // 没有找到路径
  const endTime = performance.now(); // 结束计时
  return { path: [], exploredNodes: [], time: endTime - startTime };
};

// BFS路径规划算法（基线实现）- 返回路径、探索的节点和运行时间
const bfsPathfinding = (maze: Maze, start: Position, goal: Position): { path: Position[]; exploredNodes: Position[]; time: number } => {
  // 参数验证
  if (!maze || !start || !goal || !maze.length || !maze[0].length || 
      !isValidPosition(start, maze.length) || !isValidPosition(goal, maze.length)) {
    console.error('Invalid parameters in bfsPathfinding');
    return { path: [], exploredNodes: [], time: 0 };
  }
  
  const startTime = performance.now(); // 开始计时
  
  try {
    interface Node {
      position: Position;
      parent?: Node;
    }
    
    const queue: Node[] = [];
    const visited: Set<string> = new Set();
    const exploredNodes: Position[] = []; // 记录探索的节点
    
    const startNode: Node = {
      position: { ...start }
    };
    
    queue.push(startNode);
    visited.add(`${start.x},${start.y}`);
    
    // 检查所有相邻节点的方向
    const directions = [
      { x: 0, y: -1 }, // 上
      { x: 1, y: 0 },  // 右
      { x: 0, y: 1 },  // 下
      { x: -1, y: 0 }  // 左
    ];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // 记录探索节点
      exploredNodes.push(current.position);
      
      // 到达目标
      if (current.position.x === goal.x && current.position.y === goal.y) {
        const path: Position[] = [];
        let currentNode: Node | undefined = current;
        
        while (currentNode) {
          path.push(currentNode.position);
          currentNode = currentNode.parent;
        }
        
        // 确保路径上的所有点都在迷宫边界内
        const size = maze.length;
        const clampedPath = path.reverse().map(pos => clampPosition(pos, size));
        const endTime = performance.now(); // 结束计时
        return { path: clampedPath, exploredNodes, time: endTime - startTime };
      }
      
      for (const dir of directions) {
        const neighborPos = {
          x: current.position.x + dir.x,
          y: current.position.y + dir.y
        };
        
        // 检查边界和障碍物
        if (
          neighborPos.x < 0 ||
          neighborPos.x >= maze[0].length ||
          neighborPos.y < 0 ||
          neighborPos.y >= maze.length ||
          !maze[neighborPos.y] ||
          !maze[neighborPos.y][neighborPos.x] ||
          maze[neighborPos.y][neighborPos.x].type === 'obstacle'
        ) {
          continue;
        }
        
        // 检查是否已访问
        const neighborKey = `${neighborPos.x},${neighborPos.y}`;
        if (visited.has(neighborKey)) {
          continue;
        }
        
        // 添加到队列
        queue.push({
          position: neighborPos,
          parent: current
        });
        visited.add(neighborKey);
      }
    }
  } catch (error) {
    console.error('Error in bfsPathfinding:', error);
    const endTime = performance.now(); // 结束计时
    return { path: [], exploredNodes: [], time: endTime - startTime };
  }
  
  // 没有找到路径
  const endTime = performance.now(); // 结束计时
  return { path: [], exploredNodes: [], time: endTime - startTime };
};

// 计算障碍率
const calculateObstacleRate = (maze: Maze): number => {
  let obstacleCount = 0;
  const totalCells = maze.length * maze[0].length;
  
  for (const row of maze) {
    for (const cell of row) {
      if (cell.type === 'obstacle') {
        obstacleCount++;
      }
    }
  }
  
  return obstacleCount / totalCells;
};

// 动态调整迷宫障碍率
const adjustObstacleRate = (maze: Maze, targetRate: number, startPos?: Position, goalPos?: Position): Maze => {
  const newMaze = maze.map(row => row.map(cell => ({ ...cell })));
  const totalCells = newMaze.length * newMaze[0].length;
  const currentRate = calculateObstacleRate(newMaze);
  const currentObstacles = Math.round(currentRate * totalCells);
  const targetObstacles = Math.round(targetRate * totalCells);
  
  // 避免改变起点和终点
  const defaultStartPos = { x: 0, y: 0 };
  const defaultGoalPos = { x: newMaze[0].length - 1, y: newMaze.length - 1 };
  const actualStartPos = startPos || defaultStartPos;
  const actualGoalPos = goalPos || defaultGoalPos;
  
  if (targetObstacles > currentObstacles) {
    // 需要添加障碍物
    let added = 0;
    while (added < targetObstacles - currentObstacles) {
      const x = Math.floor(Math.random() * newMaze[0].length);
      const y = Math.floor(Math.random() * newMaze.length);
      
      // 跳过起点、终点和已有的障碍物
      if (
        (x === actualStartPos.x && y === actualStartPos.y) ||
        (x === actualGoalPos.x && y === actualGoalPos.y) ||
        newMaze[y][x].type === 'obstacle'
      ) {
        continue;
      }
      
      newMaze[y][x].type = 'obstacle';
      added++;
    }
  } else if (targetObstacles < currentObstacles) {
    // 需要移除障碍物
    let removed = 0;
    while (removed < currentObstacles - targetObstacles) {
      const x = Math.floor(Math.random() * newMaze[0].length);
      const y = Math.floor(Math.random() * newMaze.length);
      
      // 只移除障碍物
      if (newMaze[y][x].type !== 'obstacle') {
        continue;
      }
      
      newMaze[y][x].type = 'empty';
      removed++;
    }
  }
  
  return newMaze;
};

// 碰撞检测与处理（基于时间步的碰撞检测）
const checkCollisions = (agents: Agent[], mazeSize: number) => {
  // 记录每个位置上的智能体
  const positionMap = new Map<string, Agent[]>();
  
  // 第一遍：收集每个位置的智能体
  agents.forEach(agent => {
    if (!agent.isActive || !agent.position) return;
    
    const posKey = `${agent.position.x},${agent.position.y}`;
    if (!positionMap.has(posKey)) {
      positionMap.set(posKey, []);
    }
    const agentList = positionMap.get(posKey);
    if (agentList) {
      agentList.push(agent);
    }
  });
  
  // 第二遍：处理碰撞
  positionMap.forEach((agentList, _posKey) => {
    if (agentList.length < 2) return;
    
    // 对冲突的智能体按ID排序
    agentList.sort((a, b) => a.id - b.id);
    
    // 根据设计文档：ID小的智能体有优先权，ID大的需要回溯
    for (let i = 1; i < agentList.length; i++) {
      const agent = agentList[i];
      agent.collisions++; // 增加碰撞计数
      
      // 直接向回走或随机移动
      if (agent.path && agent.stepsTaken > 0) {
        // 尝试向回走一步
        const newPos = { ...agent.path[agent.stepsTaken - 1] };
        // 确保移动后的位置在迷宫边界内
        agent.position = clampPosition(newPos, mazeSize);
        agent.stepsTaken = Math.max(0, agent.stepsTaken - 1);
      } else {
        // 如果无法回溯，则随机选择一个相邻的可行位置
        const directions = [
          { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
        ];
        
        // 找到所有可行的相邻位置
        const validPositions = directions
          .map(dir => ({
            x: agent.position.x + dir.x,
            y: agent.position.y + dir.y
          }))
          .filter(pos => 
            isValidPosition(pos, mazeSize) &&
            agents.findIndex(a => 
              a.isActive && a.position && a.position.x === pos.x && a.position.y === pos.y
            ) === -1
          );
        
        if (validPositions.length > 0) {
          // 随机选择一个可行位置
          const randomPos = validPositions[Math.floor(Math.random() * validPositions.length)];
          agent.position = clampPosition(randomPos, mazeSize);
        } else {
          // 如果没有可行的相邻位置，确保当前位置在边界内
          agent.position = clampPosition(agent.position, mazeSize);
        }
      }
    }
    
    // 显示碰撞信息
    const agentIds = agentList.map(a => a.id + 1).join(' 与 ');
    toast.info(`碰撞发生：智能体 ${agentIds}`);
  });
};

// 获取迷宫中心位置
const getCenterPosition = (size: number): Position => {
  return { x: Math.floor(size / 2), y: Math.floor(size / 2) };
};

// 主应用组件
export default function Home() {
  // 状态管理
  const [mazeSize, setMazeSize] = useState(DEFAULT_MAZE_SIZE); // 迷宫大小，最大到500
  const [maze, setMaze] = useState<Maze>(() => generateMaze(mazeSize, DEFAULT_OBSTACLE_RATE));
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [agentCount, setAgentCount] = useState(3);
  const [obstacleRate, setObstacleRate] = useState(DEFAULT_OBSTACLE_RATE);
  const [showStatistics, setShowStatistics] = useState(false);
  const [experimentResults, setExperimentResults] = useState<ExperimentResult[]>([]);
  const [competitionResults, setCompetitionResults] = useState<CompetitionResult[]>([]);
  const [selectedHeuristic, setSelectedHeuristic] = useState<HeuristicType | 'auto'>('auto');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<PathfindingAlgorithm>('astar');
  const [generationCount, setGenerationCount] = useState(0);
  const [useSameStart, setUseSameStart] = useState(false);
  const [agentHeuristics, setAgentHeuristics] = useState<(HeuristicType | 'auto')[]>(
    Array(agentCount).fill(selectedHeuristic)
  );
  const [agentAlgorithms, setAgentAlgorithms] = useState<PathfindingAlgorithm[]>(
    Array(agentCount).fill(selectedAlgorithm)
  );
  
  // 可视化相关状态
  const [showExploration, setShowExploration] = useState(true); // 是否显示搜索过程
  const [showPath, setShowPath] = useState(true); // 是否显示路径
  const [currentSearchStep, setCurrentSearchStep] = useState(0); // 当前搜索步骤
  const [visualizationSpeed, setVisualizationSpeed] = useState(50); // 可视化速度（毫秒）
  const [isVisualizing, setIsVisualizing] = useState(false); // 是否正在可视化搜索过程
  
  // 迷宫输入功能状态
  const [mazeSource, setMazeSource] = useState<'random' | 'file'>('random');
  const [customStart, setCustomStart] = useState<Position>({ x: 0, y: 0 });
  const [customGoal, setCustomGoal] = useState<Position>(() => getCenterPosition(mazeSize));
  const [mazeFile, setMazeFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  
  // 当智能体数量或全局启发函数变化时，更新 agentHeuristics 数组
  useEffect(() => {
    setAgentHeuristics(prev => {
      const newHeuristics = [...prev];
      // 如果智能体数量增加，使用全局选择的启发函数填充新位置
      while (newHeuristics.length < agentCount) {
        newHeuristics.push(selectedHeuristic);
      }
      // 如果智能体数量减少，截断数组
      if (newHeuristics.length > agentCount) {
        newHeuristics.splice(agentCount);
      }
      return newHeuristics;
    });
  }, [agentCount, selectedHeuristic]);

  // 当智能体数量或全局路径规划算法变化时，更新 agentAlgorithms 数组
  useEffect(() => {
    setAgentAlgorithms(prev => {
      const newAlgorithms = [...prev];
      // 如果智能体数量增加，使用全局选择的算法填充新位置
      while (newAlgorithms.length < agentCount) {
        newAlgorithms.push(selectedAlgorithm);
      }
      // 如果智能体数量减少，截断数组
      if (newAlgorithms.length > agentCount) {
        newAlgorithms.splice(agentCount);
      }
      return newAlgorithms;
    });
  }, [agentCount, selectedAlgorithm]);
  
  // 当迷宫大小变化时，重新生成迷宫
  useEffect(() => {
    const centerGoal = getCenterPosition(mazeSize);
    const newMaze = generateMaze(mazeSize, obstacleRate, customStart, centerGoal);
    setMaze(newMaze);
    setCustomGoal(centerGoal);
  }, [mazeSize, obstacleRate, customStart]);

  // 初始化智能体
  const initializeAgents = useCallback(() => {
    const goal = customGoal;
    const newAgents: Agent[] = [];
    let commonStartPos: Position | null = null;
    
    for (let i = 0; i < agentCount; i++) {
      // 为智能体生成起点
      let startPos: Position;
      
      if (useSameStart && commonStartPos) {
        // 如果使用同一起点且已有起点，使用相同的起点
        startPos = commonStartPos;
      } else {
        // 为第一个智能体或不使用同一起点时，使用自定义起点或生成随机起点
        if (mazeSource === 'file' || (mazeSource === 'random' && customStart)) {
          // 如果是文件导入迷宫或用户设置了自定义起点，使用自定义起点
        // 但确保自定义起点不在终点位置上
        const isAtGoal = customStart.x === goal.x && customStart.y === goal.y;
        if (isAtGoal || maze[customStart.y][customStart.x].type === 'obstacle') {
          // 如果自定义起点在终点位置或在障碍物上，生成随机起点
          do {
            startPos = {
              x: Math.floor(Math.random() * mazeSize),
              y: Math.floor(Math.random() * mazeSize)
            };
          } while (
            maze[startPos.y][startPos.x].type === 'obstacle' ||
            (startPos.x === goal.x && startPos.y === goal.y)
          );
        } else {
          startPos = customStart;
        }
        } else {
          // 否则生成随机起点，但避免障碍物和终点位置
        do {
          startPos = {
            x: Math.floor(Math.random() * mazeSize),
            y: Math.floor(Math.random() * mazeSize)
          };
        } while (
          maze[startPos.y][startPos.x].type === 'obstacle' ||
          (startPos.x === goal.x && startPos.y === goal.y)
        );
        }
        
        // 如果使用同一起点，保存这个起点供后续智能体使用
        if (useSameStart) {
          commonStartPos = startPos;
        }
      }
      
      // 为每个智能体计算路径，使用该智能体自己选择的算法和启发函数
      const heuristicType = agentHeuristics[i] || selectedHeuristic;
      const algorithm = agentAlgorithms[i] || selectedAlgorithm;
      let path: Position[];
      
      let pathResult;
      if (algorithm === 'bfs') {
        pathResult = bfsPathfinding(maze, startPos, goal);
      } else {
        pathResult = aStarPathfinding(
          maze,
          startPos,
          goal,
          heuristicType === 'auto' ? undefined : heuristicType
        );
      }
      path = pathResult.path;
      
      const strategies: AgentStrategy[] = ['follower', 'competitor', 'random'];
      
      // 确保智能体初始位置不在终点区域内（这已经在起点生成时处理过）
      newAgents.push({
        id: i,
        position: clampPosition(startPos, mazeSize),
        path: path.length > 0 ? path.map(pos => clampPosition(pos, mazeSize)) : [clampPosition(startPos, mazeSize)],
        exploredNodes: pathResult.exploredNodes || [], // 保存搜索过程中探索的节点
        color: AGENT_COLORS[i % AGENT_COLORS.length],
        isActive: true, // 初始时始终保持活跃，让智能体有机会尝试移动
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        stepsTaken: 0,
        collisions: 0,
        heuristicType: heuristicType,
        pathfindingAlgorithm: algorithm,
        pathfindingTime: pathResult.time // 保存路径规划时间
      });
    }
    
    setAgents(newAgents);
  }, [agentCount, maze, selectedHeuristic, selectedAlgorithm, useSameStart, agentHeuristics, agentAlgorithms]);
  
  // 重置实验
  const resetExperiment = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setGenerationCount(prev => prev + 1);
    
    // 确保目标位置始终是迷宫中心
    const centerGoal = getCenterPosition(mazeSize);
    setCustomGoal(centerGoal);
    
    if (mazeSource === 'file' && mazeFile && fileContent) {
      // 从文件加载迷宫并应用自定义起点/终点
      const fileMaze = parseMazeFile(fileContent);
      if (fileMaze) {
        // 设置起点和终点类型
        fileMaze[customStart.y][customStart.x].type = 'start';
        
        // 设置单个终点
        fileMaze[centerGoal.y][centerGoal.x].type = 'goal';
        
        setMaze(fileMaze);
        initializeAgents();
      } else {
        // 文件解析失败，使用随机生成
        const newMaze = generateMaze(mazeSize, obstacleRate, customStart, centerGoal);
        setMaze(newMaze);
        initializeAgents();
      }
    } else {
      // 随机生成迷宫，使用自定义起点/终点
      const newMaze = generateMaze(mazeSize, obstacleRate, customStart, centerGoal);
      setMaze(newMaze);
      initializeAgents();
    }
  }, [mazeSource, mazeFile, fileContent, customStart, obstacleRate, initializeAgents]);
  
  // 控制可视化搜索过程
  const animateSearchProcess = useCallback(() => {
    if (!isRunning || isPaused || isVisualizing) return;
    
    // 找到最大的探索节点数量
    const maxExploredNodes = Math.max(...agents.map(agent => agent.exploredNodes.length), 0);
    
    if (maxExploredNodes > 0) {
      setIsVisualizing(true);
      setCurrentSearchStep(0);
      
      const animateStep = (step: number) => {
        if (step <= maxExploredNodes && isVisualizing) {
          setCurrentSearchStep(step);
          
          // 动画继续
          setTimeout(() => {
            animateStep(step + 1);
          }, visualizationSpeed);
        } else {
          setIsVisualizing(false);
        }
      };
      
      animateStep(0);
    }
  }, [agents, isRunning, isPaused, isVisualizing, visualizationSpeed]);
  
  // 启动实验
  const startExperiment = () => {
    if (agents.length === 0) {
      initializeAgents();
    }
    setIsRunning(true);
    setIsPaused(false);
    
    // 如果启用了可视化，开始动画展示搜索过程
    if (showExploration) {
      setTimeout(() => {
        animateSearchProcess();
      }, 500); // 延迟一段时间开始可视化
    }
  };
  
  // 暂停实验
  const pauseExperiment = () => {
    setIsPaused(true);
  };
  
  // 继续实验
  const resumeExperiment = () => {
    setIsPaused(false);
  };
  
// 更新智能体位置和策略行为
  const updateAgentPositions = useCallback(() => {
  if (!isRunning || isPaused) return;
  
  setAgents(prevAgents => {
    const goal = customGoal;
    const updatedAgents = [...prevAgents];
    
    // 找出领先的智能体
    const activeAgents = updatedAgents.filter(agent => agent.isActive && agent.position);
    const leadingAgent = activeAgents.length > 0 
      ? activeAgents.reduce((prev, current) => {
          // 确保prev和current的position都存在
          if (!prev.position || !current.position) return prev;
          return euclideanDistance(current.position, goal) < euclideanDistance(prev.position, goal) 
            ? current 
            : prev;
        })
      : null;
    
    // 为每个智能体更新位置和策略
    for (let i = 0; i < updatedAgents.length; i++) {
      const agent = updatedAgents[i];
      if (!agent.isActive || !agent.position) continue;
      
      // 检查是否到达终点（精确匹配终点位置）
      const isAtGoal = agent.position.x === goal.x && agent.position.y === goal.y;
      if (isAtGoal) {
        // 如果到达终点，标记为完成
        updatedAgents[i] = { ...agent, isActive: false };
        continue;
      }
      
      // 获取智能体自己的启发函数
      const agentHeuristic = agent.heuristicType === 'auto' ? undefined : agent.heuristicType;
      
      // 根据不同策略调整路径
      let targetPosition: Position | null = null;
      
      switch (agent.strategy) {
        case 'follower':
          // 跟随策略：如果有领先者，尝试走领先者的路径
          if (leadingAgent && leadingAgent.id !== agent.id && leadingAgent.position && leadingAgent.path) {
            // 尝试找到领先者路径上的下一个位置
            const leadPathIndex = leadingAgent.path.findIndex(
              p => p && p.x === leadingAgent.position.x && p.y === leadingAgent.position.y
            );
            
            if (leadPathIndex >= 0 && leadPathIndex + 1 < leadingAgent.path.length) {
              const leadNextPos = leadingAgent.path[leadPathIndex + 1];
              // 检查该位置是否可行
              if (leadNextPos && isValidPosition(leadNextPos, mazeSize) && 
                  maze[leadNextPos.y] && maze[leadNextPos.y][leadNextPos.x] && 
                  maze[leadNextPos.y][leadNextPos.x].type !== 'obstacle') {
                targetPosition = leadNextPos;
              }
            }
          }
          break;
          
        case 'competitor':
          // 竞争策略：尝试拦截领先者
          if (leadingAgent && leadingAgent.id !== agent.id && leadingAgent.position) {
            // 计算领先者到目标的路径上的一个点进行拦截
            try {
              // 为领先者使用其自己的启发函数和路径规划算法
              const leadingAgentHeuristic = leadingAgent.heuristicType === 'auto' ? undefined : leadingAgent.heuristicType;
              const leadToGoalPath = leadingAgent.pathfindingAlgorithm === 'bfs' 
                ? bfsPathfinding(maze, leadingAgent.position, goal)
                : aStarPathfinding(maze, leadingAgent.position, goal, leadingAgentHeuristic);
              
              if (leadToGoalPath && leadToGoalPath.path.length > 2) {
                // 选择路径上的一个点进行拦截
                const interceptIndex = Math.min(3, leadToGoalPath.path.length - 1);
                const interceptPoint = leadToGoalPath.path[interceptIndex];
                
                if (interceptPoint && isValidPosition(interceptPoint, mazeSize)) {
                  // 计算到拦截点的路径，使用当前智能体自己的启发函数和路径规划算法
                  const interceptPath = agent.pathfindingAlgorithm === 'bfs' 
                    ? bfsPathfinding(maze, agent.position, interceptPoint)
                    : aStarPathfinding(maze, agent.position, interceptPoint, agentHeuristic);
                  
                  if (interceptPath && interceptPath.path.length > 1) {
                    const nextPos = interceptPath.path[1];
                    if (nextPos && isValidPosition(nextPos, mazeSize)) {
                      targetPosition = nextPos;
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error in competitor strategy:', error);
            }
          }
          break;
          
        case 'random':
          // 随机策略：有10%的概率随机改变方向
          if (Math.random() < 0.1) {
            const directions = [
              { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
            ];
            
            // 随机选择一个可行的方向
            const validDirections = directions.filter(dir => {
              const newX = agent.position.x + dir.x;
              const newY = agent.position.y + dir.y;
              return newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize && 
                     maze[newY] && maze[newY][newX] && maze[newY][newX].type !== 'obstacle';
            });
            
            if (validDirections.length > 0) {
              const randomDir = validDirections[Math.floor(Math.random() * validDirections.length)];
              const newPos = {
                x: agent.position.x + randomDir.x,
                y: agent.position.y + randomDir.y
              };
              if (isValidPosition(newPos, mazeSize)) {
                targetPosition = newPos;
              }
            }
          }
          break;
      }
      
      // 如果没有通过策略确定目标位置，则使用A*算法
      if (!targetPosition) {
        try {
          // 检查当前路径是否仍然有效
          let newPath = agent.path ? [...agent.path] : [];
          
          // 验证当前路径的下一个点是否可行
          // 特殊处理：如果路径长度为1且stepsTaken为0，检查智能体是否在终点
          if (newPath.length === 1 && agent.stepsTaken === 0) {
            // 检查是否在终点位置
            const isAtGoal = agent.position.x === goal.x && agent.position.y === goal.y;
            if (isAtGoal) {
              updatedAgents[i] = { ...agent, isActive: false };
              continue;
            }
          }
          
          // 正常路径验证
          if (!newPath.length || newPath.length <= agent.stepsTaken + 1 || 
              !newPath[agent.stepsTaken + 1] || 
              !isValidPosition(newPath[agent.stepsTaken + 1], mazeSize) ||
              !maze[newPath[agent.stepsTaken + 1].y] || 
              !maze[newPath[agent.stepsTaken + 1].y][newPath[agent.stepsTaken + 1].x] ||
              maze[newPath[agent.stepsTaken + 1].y][newPath[agent.stepsTaken + 1].x].type === 'obstacle') {
            // 路径无效，重新计算，使用智能体自己的启发函数和路径规划算法
            const pathResult = agent.pathfindingAlgorithm === 'bfs' 
              ? bfsPathfinding(maze, agent.position, goal)
              : aStarPathfinding(maze, agent.position, goal, agentHeuristic);
            
            newPath = pathResult.path;
            
            if (!newPath || newPath.length === 0) {
              // 如果路径计算失败，尝试随机移动
              const directions = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
              ];
              
              const validDirections = directions.filter(dir => {
                const newX = agent.position.x + dir.x;
                const newY = agent.position.y + dir.y;
                return newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize && 
                       maze[newY] && maze[newY][newX] && maze[newY][newX].type !== 'obstacle';
              });
              
              if (validDirections.length > 0) {
                const randomDir = validDirections[Math.floor(Math.random() * validDirections.length)];
                targetPosition = {
                  x: agent.position.x + randomDir.x,
                  y: agent.position.y + randomDir.y
                };
              } else {
                // 如果没有可行的移动方向，才标记为非活跃
                updatedAgents[i] = { ...agent, isActive: false };
              }
              continue;
            }
          }
          
          if (newPath && newPath.length > agent.stepsTaken + 1 && newPath[agent.stepsTaken + 1]) {
            targetPosition = newPath[agent.stepsTaken + 1];
            updatedAgents[i].path = newPath;
          }
        } catch (error) {
          console.error('Error in pathfinding:', error);
          continue;
        }
      }
      
      // 移动到目标位置，确保在边界内
      if (targetPosition) {
        // 确保目标位置在迷宫边界内
        const clampedPosition = clampPosition(targetPosition, mazeSize);
        updatedAgents[i] = {
          ...agent,
          position: clampedPosition,
          stepsTaken: agent.stepsTaken + 1
        };
      }
    }
    
    // 确保所有智能体的位置都在迷宫边界内
    for (const agent of updatedAgents) {
      if (agent.isActive && agent.position) {
        agent.position = clampPosition(agent.position, mazeSize);
      }
    }
    
    // 检查碰撞（修改为更精确的碰撞检测）
    checkCollisions(updatedAgents, mazeSize);
    
    // 再次确保所有智能体的位置都在迷宫边界内（碰撞处理后）
    for (const agent of updatedAgents) {
      if (agent.isActive && agent.position) {
        agent.position = clampPosition(agent.position, mazeSize);
      }
    }
    
    // 检查是否所有智能体都已完成
    const allCompleted = updatedAgents.every(agent => !agent.isActive);
    if (allCompleted) {
      setIsRunning(false);
      
      // 更新竞赛结果 - 更精确的胜负判定
      const goalAgents = updatedAgents.filter(agent => 
        agent.position && agent.position.x === goal.x && agent.position.y === goal.y
      );
      
      if (goalAgents.length > 0) {
        // 按照设计文档的胜负规则排序: 1.先到出口 2.路径长度 3.ID大小
        goalAgents.sort((a, b) => {
          if (a.stepsTaken !== b.stepsTaken) {
            return a.stepsTaken - b.stepsTaken; // 步数少的优先
          }
          return a.id - b.id; // 步数相同，ID小的优先
        });
        
        toast.success(`竞赛结束！获胜者：智能体 ${goalAgents[0].id + 1}`);
        
        // 更新竞赛统计
        const newCompetitionResults = [...competitionResults];
        const winnerId = goalAgents[0].id;
        
        const existingResultIndex = newCompetitionResults.findIndex(
          result => result.agentId === winnerId
        );
        
        if (existingResultIndex !== -1) {
          newCompetitionResults[existingResultIndex].wins++;
          newCompetitionResults[existingResultIndex].averagePathLength = 
            (newCompetitionResults[existingResultIndex].averagePathLength * 
             (newCompetitionResults[existingResultIndex].wins - 1) + 
             goalAgents[0].stepsTaken) / 
            newCompetitionResults[existingResultIndex].wins;
          newCompetitionResults[existingResultIndex].averageExploredNodes = 
            (newCompetitionResults[existingResultIndex].averageExploredNodes * 
             (newCompetitionResults[existingResultIndex].wins - 1) + 
             goalAgents[0].exploredNodes.length) / 
            newCompetitionResults[existingResultIndex].wins;
          newCompetitionResults[existingResultIndex].averagePathfindingTime = 
            (newCompetitionResults[existingResultIndex].averagePathfindingTime * 
             (newCompetitionResults[existingResultIndex].wins - 1) + 
             (goalAgents[0].pathfindingTime || 0)) / 
            newCompetitionResults[existingResultIndex].wins;
          newCompetitionResults[existingResultIndex].collisionRate = 
            (newCompetitionResults[existingResultIndex].collisionRate * 
             (newCompetitionResults[existingResultIndex].wins - 1) + 
             (goalAgents[0].collisions / goalAgents[0].stepsTaken)) / 
            newCompetitionResults[existingResultIndex].wins;
        } else {
          newCompetitionResults.push({
            agentId: winnerId,
            wins: 1,
            averagePathLength: goalAgents[0].stepsTaken,
            averageExploredNodes: goalAgents[0].exploredNodes.length,
            averagePathfindingTime: goalAgents[0].pathfindingTime || 0,
            collisionRate: goalAgents[0].collisions / goalAgents[0].stepsTaken
          });
        }
        
        setCompetitionResults(newCompetitionResults);
      }
    }
    
    return updatedAgents;
  });
}, [isRunning, isPaused, maze, competitionResults]);
  
  // 定期更新迷宫障碍率（根据设计文档：每10秒变化±5%）
  const updateMazeObstacles = useCallback(() => {
    if (!isRunning || isPaused) return;
    
    // 每10秒调整一次障碍率
    if (generationCount > 0 && generationCount % 50 === 0) { // 50 * 200ms = 10秒
      const change = (Math.random() - 0.5) * 0.1; // ±5% 的变化
      const newRate = Math.max(0.1, Math.min(0.5, obstacleRate + change));
      setObstacleRate(newRate);
      
      // 调整迷宫障碍，并确保所有智能体的位置仍然有效
      setMaze(prevMaze => {
        const adjustedMaze = adjustObstacleRate(prevMaze, newRate);
        
        // 确保智能体所在的格子不是障碍物
        agents.forEach(agent => {
          if (agent.isActive && agent.position && isValidPosition(agent.position, mazeSize) && 
              adjustedMaze[agent.position.y] && adjustedMaze[agent.position.y][agent.position.x] && 
              adjustedMaze[agent.position.y][agent.position.x].type === 'obstacle') {
            // 如果智能体所在位置变成了障碍物，将其改为空地
            adjustedMaze[agent.position.y][agent.position.x].type = 'empty';
          }
        });
        
        return adjustedMaze;
      });
      
      toast.info(`迷宫障碍率已调整为：${(newRate * 100).toFixed(0)}%`);
    }
  }, [isRunning, isPaused, generationCount, obstacleRate, agents]);
  
  // 运行实验模拟
  useEffect(() => {
    if (!isRunning || isPaused) return;
    
    const interval = setInterval(() => {
      updateAgentPositions();
      setGenerationCount(prev => prev + 1);
    }, 200); // 每200ms更新一次
    
    const mazeInterval = setInterval(() => {
      updateMazeObstacles();
    }, 1000); // 每秒检查一次是否需要更新迷宫
    
    return () => {
      clearInterval(interval);
      clearInterval(mazeInterval);
    };
  }, [isRunning, isPaused, updateAgentPositions, updateMazeObstacles]);
  
  // 文件解析函数
  const parseMazeFile = (content: string): Maze | null => {
    const rows = content.trim().split('\n').map(row => row.trim());
    
    // 验证行数是否等于迷宫大小
    if (rows.length !== mazeSize) {
      toast.error(`无效的迷宫文件：行数应为 ${mazeSize}，但实际为 ${rows.length}`);
      return null;
    }
    
    const maze: Maze = [];
    
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      
      // 验证每行的长度是否等于迷宫大小
      if (row.length !== mazeSize) {
        toast.error(`无效的迷宫文件：第 ${y + 1} 行的长度应为 ${mazeSize}，但实际为 ${row.length}`);
        return null;
      }
      
      const cells: Cell[] = [];
      for (let x = 0; x < row.length; x++) {
        const cellChar = row[x];
        
        // 验证每个字符是否为0或1
        if (cellChar !== '0' && cellChar !== '1') {
          toast.error(`无效的迷宫文件：第 ${y + 1} 行第 ${x + 1} 列的字符应为0或1，但实际为 ${cellChar}`);
          return null;
        }
        
        cells.push({ type: cellChar === '1' ? 'obstacle' : 'empty' });
      }
      
      maze.push(cells);
    }
    
    return maze;
  };
  
  // 文件上传处理函数
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'text/plain') {
      toast.error('请上传文本文件 (.txt)');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsedMaze = parseMazeFile(content);
      
      if (parsedMaze) {
        setMazeFile(file);
        setFileContent(content);
        toast.success('迷宫文件解析成功！');
      }
    };
    
    reader.onerror = () => {
      toast.error('文件读取失败');
    };
    
    reader.readAsText(file);
  };
  
  // 运行启发式对比实验
  const runHeuristicComparison = () => {
    const newResults: ExperimentResult[] = [];
    
    // 测试不同障碍率
    for (let rate = 0.1; rate <= 0.5; rate += 0.1) {
      const testMaze = generateMaze(mazeSize, rate);
      const start = { x: 0, y: 0 };
      const goal = { x: mazeSize - 1, y: mazeSize - 1 };
      
      // 测量每种启发函数的节点扩展数（这里简化为路径长度）
      const manhattanPath = aStarPathfinding(testMaze, start, goal, 'manhattan');
      const euclideanPath = aStarPathfinding(testMaze, start, goal, 'euclidean');
      const diagonalPath = aStarPathfinding(testMaze, start, goal, 'diagonal');
      
      newResults.push({
        obstacleRate: rate,
        manhattanNodes: manhattanPath.path.length,
        euclideanNodes: euclideanPath.path.length,
        diagonalNodes: diagonalPath.path.length,
        optimalNodes: Math.min(
          manhattanPath.path.length,
          euclideanPath.path.length,
          diagonalPath.path.length
        )
      });
    }
    
    setExperimentResults(newResults);
    setShowStatistics(true);
    toast.success('启发式对比实验完成！查看下方图表了解不同启发函数在不同障碍率下的性能差异。');
  };
  
  // 渲染迷宫单元格
  const renderMazeCell = (cell: Cell, x: number, y: number) => {
    // 检查是否为探索节点
    const isExplored = showExploration && agents.some(agent => 
      agent.exploredNodes.slice(0, currentSearchStep).some(node => node.x === x && node.y === y)
    );
    
    // 检查是否为路径节点
    const isPathNode = showPath && agents.some(agent => 
      agent.path.some(node => node.x === x && node.y === y)
    );
    
    // 确定单元格类型
    let cellType = cell.type;
    
    // 优先级：起点/终点 > 路径 > 探索节点 > 普通格子
    if (isPathNode) {
      cellType = 'final-path';
    } else if (isExplored && cellType === 'empty') {
      cellType = 'explored';
    }
    
    const cellClasses = cn(
      'w-full h-full border border-gray-300 dark:border-gray-600 flex items-center justify-center transition-all duration-200',
      {
        // 障碍物样式
        'bg-gray-700 dark:bg-gray-900 shadow-inner hover:bg-gray-600 dark:hover:bg-gray-800': cellType === 'obstacle',
        // 起点样式
        'bg-green-500 dark:bg-green-700 text-white font-bold shadow-md hover:bg-green-600 dark:hover:bg-green-800': cellType === 'start',
        // 终点样式
        'bg-red-500 dark:bg-red-700 text-white font-bold shadow-md hover:bg-red-600 dark:hover:bg-red-800': cellType === 'goal',
        // 普通路径样式
        'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700': cellType === 'empty',
        // 探索节点样式
        'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700': cellType === 'explored',
        // 最终路径样式
        'bg-yellow-200 dark:bg-yellow-800/50 border-yellow-300 dark:border-yellow-700': cellType === 'final-path',
        // 当前路径样式
        'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-600': cellType === 'current-path',
      }
    );
    
    return (
      <div key={`${x}-${y}`} className={cellClasses}>
        {cell.type === 'start' && <span className="text-sm">S</span>}
        {cell.type === 'goal' && <span className="text-sm">G</span>}
        {isExplored && cellType === 'explored' && <span className="text-xs opacity-50">*</span>}
      </div>
    );
  };
  
  // 渲染智能体
  const renderAgents = () => {
    return agents.map(agent => (
      <motion.div
        key={agent.id}
        className="absolute rounded-full flex items-center justify-center"
        style={{
          backgroundColor: agent.color,
          opacity: agent.isActive ? 0.8 : 0.4,
          width: `${(1 / mazeSize) * 100}%`,
          height: `${(1 / mazeSize) * 100}%`,
          transform: 'translate(-50%, -50%)',
          left: `${((clampPosition(agent.position, mazeSize).x + 0.5) / mazeSize) * 100}%`,
          top: `${((clampPosition(agent.position, mazeSize).y + 0.5) / mazeSize) * 100}%`,
          zIndex: 10,
        }}
        animate={{
          scale: agent.isActive ? 1.1 : 1,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        <span className="text-white text-xs font-bold">{agent.id + 1}</span>
      </motion.div>
    ));
  };
  
  // 渲染智能体路径
  const renderPaths = () => {
    return agents.map(agent => (
      <svg
        key={`path-${agent.id}`}
        className="absolute inset-0 w-full h-full pointer-events-none z-5"
      >
        {/* 发光效果 */}
        <path
          d={agent.path.length > 1
            ? agent.path.map((pos, i) => {
                const clampedPos = clampPosition(pos, mazeSize);
                const x = ((clampedPos.x + 0.5) / mazeSize) * 100;
                const y = ((clampedPos.y + 0.5) / mazeSize) * 100;
                return i === 0 ? `M ${x}% ${y}%` : `L ${x}% ${y}%`;
              }).join(' ')
            : ''
          }
          stroke={agent.color}
          strokeWidth="5"
          fill="none"
          style={{ filter: 'blur(3px)', opacity: 0.4 }}
        />
        {/* 主路径 */}
        <path
          d={agent.path.length > 1
            ? agent.path.map((pos, i) => {
                const clampedPos = clampPosition(pos, mazeSize);
                const x = ((clampedPos.x + 0.5) / mazeSize) * 100;
                const y = ((clampedPos.y + 0.5) / mazeSize) * 100;
                return i === 0 ? `M ${x}% ${y}%` : `L ${x}% ${y}%`;
              }).join(' ')
            : ''
          }
          stroke={agent.color}
          strokeWidth="2"
          fill="none"
          style={{ opacity: 0.8 }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      {/* 头部 */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              电脑鼠迷宫实验系统
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              启发式优化 + 多智能体竞赛
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={runHeuristicComparison}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              启发式对比
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧控制面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-500" />
                实验设置
              </h2>
              
              <div className="space-y-6">

                
                {/* 智能体数量设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    智能体数量
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setAgentCount(Math.max(1, agentCount - 1))}
                      disabled={isRunning}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium">{agentCount}</span>
                    <button
                      onClick={() => setAgentCount(Math.min(5, agentCount + 1))}
                      disabled={isRunning}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* 迷宫大小设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    迷宫大小: {mazeSize}x{mazeSize}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="10"
                      max="500"
                      step="10"
                      value={mazeSize}
                      onChange={(e) => setMazeSize(Math.max(10, Math.min(500, parseInt(e.target.value) || 20)))}
                      disabled={isRunning}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setMazeSize(Math.max(10, mazeSize - 10))}
                      disabled={isRunning}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setMazeSize(Math.min(500, mazeSize + 10))}
                      disabled={isRunning}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* 障碍率设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    障碍率: {(obstacleRate * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={obstacleRate}
                    onChange={(e) => setObstacleRate(parseFloat(e.target.value))}
                    disabled={isRunning}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                {/* 启发函数选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    启发函数
                  </label>
                  <select
                    value={selectedHeuristic}
                    onChange={(e) => setSelectedHeuristic(e.target.value as HeuristicType | 'auto')}
                    disabled={isRunning}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">自动选择（基于障碍率）</option>
                    <option value="manhattan">曼哈顿距离</option>
                    <option value="euclidean">欧几里得距离</option>
                    <option value="diagonal">对角线优化</option>
                  </select>
                </div>
                
                {/* 路径规划算法选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    路径规划算法
                  </label>
                  <select
                    value={selectedAlgorithm}
                    onChange={(e) => setSelectedAlgorithm(e.target.value as PathfindingAlgorithm)}
                    disabled={isRunning}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="astar">A* 算法</option>
                    <option value="bfs">BFS 算法</option>
                  </select>
                </div>
                
                {/* 同一起点设置 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sameStart"
                    checked={useSameStart}
                    onChange={(e) => setUseSameStart(e.target.checked)}
                    disabled={isRunning}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sameStart" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    智能体从同一起点出发
                  </label>
                </div>
                
                {/* 可视化设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    可视化选项
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showExploration"
                        checked={showExploration}
                        onChange={(e) => setShowExploration(e.target.checked)}
                        disabled={isRunning}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showExploration" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        显示搜索过程
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showPath"
                        checked={showPath}
                        onChange={(e) => setShowPath(e.target.checked)}
                        disabled={isRunning}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showPath" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        显示路径
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        可视化速度: {visualizationSpeed}ms
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        step="10"
                        value={visualizationSpeed}
                        onChange={(e) => setVisualizationSpeed(parseInt(e.target.value))}
                        disabled={isRunning}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 迷宫输入设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    迷宫来源
                  </label>
                  <div className="flex space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mazeSource"
                        value="random"
                        checked={mazeSource === 'random'}
                        onChange={() => setMazeSource('random')}
                        disabled={isRunning}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      随机生成
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mazeSource"
                        value="file"
                        checked={mazeSource === 'file'}
                        onChange={() => setMazeSource('file')}
                        disabled={isRunning}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      文件导入
                    </label>
                  </div>
                  
                  {mazeSource === 'file' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        上传迷宫文件
                      </label>
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                        disabled={isRunning}
                        className="w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-700 dark:file:text-blue-200
                          hover:file:bg-blue-100 dark:hover:file:bg-blue-600"
                      />
                      {mazeFile && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          已选择文件: {mazeFile.name}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      自定义起点坐标 (x, y)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="0"
                        max={mazeSize - 1}
                        value={customStart.x}
                        onChange={(e) => setCustomStart({ ...customStart, x: parseInt(e.target.value) })}
                        disabled={isRunning}
                        className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max={mazeSize - 1}
                        value={customStart.y}
                        onChange={(e) => setCustomStart({ ...customStart, y: parseInt(e.target.value) })}
                        disabled={isRunning}
                        className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      自定义终点坐标 (x, y)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="0"
                        max={mazeSize - 1}
                        value={customGoal.x}
                        onChange={(e) => setCustomGoal({ ...customGoal, x: parseInt(e.target.value) })}
                        disabled={isRunning}
                        className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max={mazeSize - 1}
                        value={customGoal.y}
                        onChange={(e) => setCustomGoal({ ...customGoal, y: parseInt(e.target.value) })}
                        disabled={isRunning}
                        className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 智能体独立启发函数选择 */}
                {agentCount > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      各智能体启发函数
                    </label>
                    <div className="space-y-2">
                      {Array.from({ length: agentCount }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
                            智能体 {index + 1}:
                          </span>
                          <select
                            value={agentHeuristics[index]}
                            onChange={(e) => {
                              const newHeuristics = [...agentHeuristics];
                              newHeuristics[index] = e.target.value as HeuristicType | 'auto';
                              setAgentHeuristics(newHeuristics);
                            }}
                            disabled={isRunning}
                            className="flex-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="auto">自动选择</option>
                            <option value="manhattan">曼哈顿距离</option>
                            <option value="euclidean">欧几里得距离</option>
                            <option value="diagonal">对角线优化</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 智能体独立路径规划算法选择 */}
                {agentCount > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      各智能体路径规划算法
                    </label>
                    <div className="space-y-2">
                      {Array.from({ length: agentCount }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
                            智能体 {index + 1}:
                          </span>
                          <select
                            value={agentAlgorithms[index]}
                            onChange={(e) => {
                              const newAlgorithms = [...agentAlgorithms];
                              newAlgorithms[index] = e.target.value as PathfindingAlgorithm;
                              setAgentAlgorithms(newAlgorithms);
                            }}
                            disabled={isRunning}
                            className="flex-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="astar">A* 算法</option>
                            <option value="bfs">BFS 算法</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 实验控制按钮 */}
                <div className="flex flex-col space-y-3 mt-8">
                  {!isRunning ? (
                    <button
                      onClick={startExperiment}
                      className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      开始实验
                    </button>
                  ) : isPaused ? (
                    <button
                      onClick={resumeExperiment}
                      className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      继续实验
                    </button>
                  ) : (
                    <button
                      onClick={pauseExperiment}
                      className="flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all font-medium"
                    >
                      <PauseCircle className="w-5 h-5 mr-2" />
                      暂停实验
                    </button>
                  )}
                  
                  <button
                    onClick={resetExperiment}
                    className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all font-medium"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    重置实验
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧迷宫和统计 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 迷宫可视化区域 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 overflow-hidden">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                迷宫可视化
              </h2>
              
              <div className="relative w-full max-w-[800px] mx-auto aspect-square">
                <div 
                  className="grid w-full h-full border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300"
                  style={{
                    gridTemplateColumns: `repeat(${mazeSize}, 1fr)`,
                    gridTemplateRows: `repeat(${mazeSize}, 1fr)`
                  }}
                >
                  {maze.map((row, y) =>
                    row.map((cell, x) => renderMazeCell(cell, x, y))
                  )}
                </div>
                {renderPaths()}
                {renderAgents()}
              </div>
            </div>
            
            {/* 统计面板 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setShowStatistics(!showStatistics)}
              >
                <h2 className="text-xl font-semibold flex items-center">
                  <Award className="w-5 h-5 mr-2 text-purple-500" />
                  实验结果与统计
                </h2>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform ${showStatistics ? 'transform rotate-180' : ''}`} 
                />
              </div>
              
              <AnimatePresence>
                {showStatistics && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 space-y-8">
                      {/* 竞赛结果 */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">竞赛结果</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  智能体
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  获胜次数
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  平均路径长度
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  平均探索节点数
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  平均路径规划时间(ms)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  碰撞率
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {competitionResults.length > 0 ? (
                                competitionResults.map((result) => (
                                  <tr key={result.agentId}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div
                                          className="w-4 h-4 rounded-full mr-2"
                                          style={{ backgroundColor: AGENT_COLORS[result.agentId % AGENT_COLORS.length] }}
                                        ></div>
                                        智能体 {result.agentId + 1}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {result.wins}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {result.averagePathLength.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {result.averageExploredNodes.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {result.averagePathfindingTime.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {(result.collisionRate * 100).toFixed(2)}%
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    暂无竞赛结果
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* 启发式对比图表 */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">启发式函数性能对比</h3>
                        <div className="h-80 w-full">
                          {experimentResults.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={experimentResults}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="obstacleRate" 
                                  label={{ value: '障碍率', position: 'insideBottom', offset: -5 }}
                                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                                />
                                <YAxis 
                                  label={{ value: '节点扩展数', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                  formatter={(value) => [`${value}`, '']}
                                  labelFormatter={(value) => `障碍率: ${(value * 100).toFixed(0)}%`}
                                />
                                <Legend />
                                <Line 
                                  type="monotone" 
                                  dataKey="manhattanNodes" 
                                  name="曼哈顿距离" 
                                  stroke="#FF6B6B" 
                                  strokeWidth={2} 
                                  activeDot={{ r: 8 }} 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="euclideanNodes" 
                                  name="欧几里得距离" 
                                  stroke="#4ECDC4" 
                                  strokeWidth={2} 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="diagonalNodes" 
                                  name="对角线优化" 
                                  stroke="#45B7D1" 
                                  strokeWidth={2} 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="optimalNodes" 
                                  name="最优路径" 
                                  stroke="#FFD166" 
                                  strokeWidth={2} 
                                  strokeDasharray="5 5" 
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                              点击"启发式对比"按钮运行实验
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 shadow-inner mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 电脑鼠迷宫实验系统 | 启发式优化与多智能体竞赛
          </p>
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              设计主题：启发式优化 + 多老鼠竞赛系统
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}