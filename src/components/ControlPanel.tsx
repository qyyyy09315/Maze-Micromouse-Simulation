import {
  PlayCircle, PauseCircle, RotateCcw, Settings,
} from 'lucide-react';
import type {
  HeuristicType, PathfindingAlgorithm, Position,
} from '../types';
import { MIN_MAZE_SIZE, MAX_MAZE_SIZE, MAX_AGENTS } from '../types';

interface ControlPanelProps {
  // Config
  agentCount: number;
  setAgentCount: (n: number) => void;
  mazeSize: number;
  setMazeSize: (n: number) => void;
  obstacleRate: number;
  setObstacleRate: (n: number) => void;
  selectedHeuristic: HeuristicType | 'auto';
  setSelectedHeuristic: (h: HeuristicType | 'auto') => void;
  selectedAlgorithm: PathfindingAlgorithm;
  setSelectedAlgorithm: (a: PathfindingAlgorithm) => void;
  agentHeuristics: (HeuristicType | 'auto')[];
  setAgentHeuristics: (h: (HeuristicType | 'auto')[]) => void;
  agentAlgorithms: PathfindingAlgorithm[];
  setAgentAlgorithms: (a: PathfindingAlgorithm[]) => void;
  useSameStart: boolean;
  setUseSameStart: (v: boolean) => void;
  showExploration: boolean;
  setShowExploration: (v: boolean) => void;
  showPath: boolean;
  setShowPath: (v: boolean) => void;
  visualizationSpeed: number;
  setVisualizationSpeed: (v: number) => void;
  mazeSource: 'random' | 'file';
  setMazeSource: (s: 'random' | 'file') => void;
  customStart: Position;
  setCustomStart: (p: Position) => void;
  customGoal: Position;
  setCustomGoal: (p: Position) => void;
  isRunning: boolean;
  isPaused: boolean;
  // Actions
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mazeFileName?: string;
}

export default function ControlPanel(props: ControlPanelProps) {
  const {
    agentCount, setAgentCount,
    mazeSize, setMazeSize,
    obstacleRate, setObstacleRate,
    selectedHeuristic, setSelectedHeuristic,
    selectedAlgorithm, setSelectedAlgorithm,
    agentHeuristics, setAgentHeuristics,
    agentAlgorithms, setAgentAlgorithms,
    useSameStart, setUseSameStart,
    showExploration, setShowExploration,
    showPath, setShowPath,
    visualizationSpeed, setVisualizationSpeed,
    mazeSource, setMazeSource,
    customStart, setCustomStart,
    customGoal, setCustomGoal,
    isRunning,
    isPaused,
    onStart, onPause, onResume, onReset,
    onFileUpload, mazeFileName,
  } = props;

  const inputCls = 'w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <Settings className="w-5 h-5 mr-2 text-blue-500" />
        实验设置
      </h2>

      <div className="space-y-5">
        {/* Agent count */}
        <div>
          <label className={labelCls}>智能体数量</label>
          <div className="flex items-center space-x-4">
            <button onClick={() => setAgentCount(Math.max(1, agentCount - 1))} disabled={isRunning}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">-</button>
            <span className="text-lg font-medium">{agentCount}</span>
            <button onClick={() => setAgentCount(Math.min(MAX_AGENTS, agentCount + 1))} disabled={isRunning}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">+</button>
          </div>
        </div>

        {/* Maze size */}
        <div>
          <label className={labelCls}>迷宫大小: {mazeSize}×{mazeSize}</label>
          <div className="flex items-center space-x-2">
            <input type="number" min={MIN_MAZE_SIZE} max={MAX_MAZE_SIZE} step={10} value={mazeSize}
              onChange={e => setMazeSize(Math.max(MIN_MAZE_SIZE, Math.min(MAX_MAZE_SIZE, parseInt(e.target.value) || 20)))}
              disabled={isRunning} className={inputCls} />
            <button onClick={() => setMazeSize(Math.max(MIN_MAZE_SIZE, mazeSize - 10))} disabled={isRunning}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">-</button>
            <button onClick={() => setMazeSize(Math.min(MAX_MAZE_SIZE, mazeSize + 10))} disabled={isRunning}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">+</button>
          </div>
        </div>

        {/* Obstacle rate */}
        <div>
          <label className={labelCls}>障碍率: {(obstacleRate * 100).toFixed(0)}%</label>
          <input type="range" min="0.1" max="0.8" step="0.05" value={obstacleRate}
            onChange={e => setObstacleRate(parseFloat(e.target.value))}
            disabled={isRunning}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
        </div>

        {/* Heuristic */}
        <div>
          <label className={labelCls}>启发函数</label>
          <select value={selectedHeuristic} onChange={e => setSelectedHeuristic(e.target.value as HeuristicType | 'auto')}
            disabled={isRunning} className={inputCls}>
            <option value="auto">自动选择（基于障碍率）</option>
            <option value="manhattan">曼哈顿距离</option>
            <option value="euclidean">欧几里得距离</option>
            <option value="diagonal">对角线优化</option>
          </select>
        </div>

        {/* Algorithm */}
        <div>
          <label className={labelCls}>路径规划算法</label>
          <select value={selectedAlgorithm} onChange={e => setSelectedAlgorithm(e.target.value as PathfindingAlgorithm)}
            disabled={isRunning} className={inputCls}>
            <option value="astar">A* 算法</option>
            <option value="bfs">BFS 算法</option>
          </select>
        </div>

        {/* Same start */}
        <div className="flex items-center">
          <input type="checkbox" id="sameStart" checked={useSameStart}
            onChange={e => setUseSameStart(e.target.checked)} disabled={isRunning}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
          <label htmlFor="sameStart" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            智能体从同一起点出发
          </label>
        </div>

        {/* Visualization */}
        <div>
          <label className={labelCls}>可视化选项</label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input type="checkbox" id="showExploration" checked={showExploration}
                onChange={e => setShowExploration(e.target.checked)} disabled={isRunning}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="showExploration" className="text-sm font-medium text-gray-700 dark:text-gray-300">显示搜索过程</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="showPath" checked={showPath}
                onChange={e => setShowPath(e.target.checked)} disabled={isRunning}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="showPath" className="text-sm font-medium text-gray-700 dark:text-gray-300">显示路径</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                可视化速度: {visualizationSpeed}ms
              </label>
              <input type="range" min="10" max="200" step="10" value={visualizationSpeed}
                onChange={e => setVisualizationSpeed(parseInt(e.target.value))}
                disabled={isRunning}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Maze source */}
        <div>
          <label className={labelCls}>迷宫来源</label>
          <div className="flex space-x-4 mb-3">
            <label className="flex items-center">
              <input type="radio" name="mazeSource" value="random" checked={mazeSource === 'random'}
                onChange={() => setMazeSource('random')} disabled={isRunning}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              随机生成
            </label>
            <label className="flex items-center">
              <input type="radio" name="mazeSource" value="file" checked={mazeSource === 'file'}
                onChange={() => setMazeSource('file')} disabled={isRunning}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              文件导入
            </label>
          </div>

          {mazeSource === 'file' && (
            <div className="mb-3">
              <input type="file" accept=".txt" onChange={onFileUpload} disabled={isRunning}
                className="w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                  dark:file:bg-blue-700 dark:file:text-blue-200 hover:file:bg-blue-100" />
              {mazeFileName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">已选择文件: {mazeFileName}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">起点坐标 (x, y)</label>
              <div className="flex space-x-2">
                <input type="number" min="0" max={mazeSize - 1} value={customStart.x}
                  onChange={e => setCustomStart({ ...customStart, x: parseInt(e.target.value) })}
                  disabled={isRunning} className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" min="0" max={mazeSize - 1} value={customStart.y}
                  onChange={e => setCustomStart({ ...customStart, y: parseInt(e.target.value) })}
                  disabled={isRunning} className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">终点坐标 (x, y)</label>
              <div className="flex space-x-2">
                <input type="number" min="0" max={mazeSize - 1} value={customGoal.x}
                  onChange={e => setCustomGoal({ ...customGoal, x: parseInt(e.target.value) })}
                  disabled={isRunning} className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" min="0" max={mazeSize - 1} value={customGoal.y}
                  onChange={e => setCustomGoal({ ...customGoal, y: parseInt(e.target.value) })}
                  disabled={isRunning} className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Per-agent heuristics */}
        {agentCount > 1 && (
          <div>
            <label className={labelCls}>各智能体启发函数</label>
            <div className="space-y-2">
              {Array.from({ length: agentCount }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-16">智能体 {i + 1}:</span>
                  <select value={agentHeuristics[i]}
                    onChange={e => {
                      const next = [...agentHeuristics];
                      next[i] = e.target.value as HeuristicType | 'auto';
                      setAgentHeuristics(next);
                    }}
                    disabled={isRunning}
                    className="flex-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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

        {/* Per-agent algorithms */}
        {agentCount > 1 && (
          <div>
            <label className={labelCls}>各智能体路径规划算法</label>
            <div className="space-y-2">
              {Array.from({ length: agentCount }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-16">智能体 {i + 1}:</span>
                  <select value={agentAlgorithms[i]}
                    onChange={e => {
                      const next = [...agentAlgorithms];
                      next[i] = e.target.value as PathfindingAlgorithm;
                      setAgentAlgorithms(next);
                    }}
                    disabled={isRunning}
                    className="flex-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="astar">A* 算法</option>
                    <option value="bfs">BFS 算法</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex flex-col space-y-3 mt-6">
          {!isRunning ? (
            <button onClick={onStart}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium">
              <PlayCircle className="w-5 h-5 mr-2" />开始实验
            </button>
          ) : isPaused ? (
            <button onClick={onResume}
              className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium">
              <PlayCircle className="w-5 h-5 mr-2" />继续实验
            </button>
          ) : (
            <button onClick={onPause}
              className="flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all font-medium">
              <PauseCircle className="w-5 h-5 mr-2" />暂停实验
            </button>
          )}
          <button onClick={onReset}
            className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all font-medium">
            <RotateCcw className="w-5 h-5 mr-2" />重置实验
          </button>
        </div>
      </div>
    </div>
  );
}
