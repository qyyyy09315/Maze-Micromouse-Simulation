import {
  Play, Pause, RotateCcw,
} from 'lucide-react';
import type {
  HeuristicType, PathfindingAlgorithm, Position,
} from '../types';
import { MIN_MAZE_SIZE, MAX_MAZE_SIZE, MAX_AGENTS } from '../types';

interface ControlPanelProps {
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

  const inputCls = 'w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow duration-200';
  const labelCls = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5';
  const btnSmall = 'px-2.5 py-1.5 text-sm rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-150 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed';
  const btnMain = 'inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-5 tracking-tight">
        实验设置
      </h2>

      <div className="space-y-4">
        {/* Agent count */}
        <div>
          <label className={labelCls}>智能体数量</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setAgentCount(Math.max(1, agentCount - 1))} disabled={isRunning}
              className={btnSmall}>−</button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{agentCount}</span>
            <button onClick={() => setAgentCount(Math.min(MAX_AGENTS, agentCount + 1))} disabled={isRunning}
              className={btnSmall}>+</button>
          </div>
        </div>

        {/* Maze size */}
        <div>
          <label className={labelCls}>迷宫大小 {mazeSize}×{mazeSize}</label>
          <div className="flex items-center gap-2">
            <input type="number" min={MIN_MAZE_SIZE} max={MAX_MAZE_SIZE} step={10} value={mazeSize}
              onChange={e => setMazeSize(Math.max(MIN_MAZE_SIZE, Math.min(MAX_MAZE_SIZE, parseInt(e.target.value) || 20)))}
              disabled={isRunning} className={inputCls} />
            <button onClick={() => setMazeSize(Math.max(MIN_MAZE_SIZE, mazeSize - 10))} disabled={isRunning}
              className={btnSmall}>−</button>
            <button onClick={() => setMazeSize(Math.min(MAX_MAZE_SIZE, mazeSize + 10))} disabled={isRunning}
              className={btnSmall}>+</button>
          </div>
          {mazeSize > 100 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
              大迷宫建议使用 1–2 个智能体
            </p>
          )}
        </div>

        {/* Obstacle rate */}
        <div>
          <label className={labelCls}>障碍率 {(obstacleRate * 100).toFixed(0)}%</label>
          <input type="range" min="0.1" max="0.5" step="0.05" value={obstacleRate}
            onChange={e => setObstacleRate(parseFloat(e.target.value))}
            disabled={isRunning}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500" />
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">10% — 50%，超过 50% 可能不可解</p>
        </div>

        {/* Heuristic */}
        <div>
          <label className={labelCls}>启发函数</label>
          <select value={selectedHeuristic} onChange={e => setSelectedHeuristic(e.target.value as HeuristicType | 'auto')}
            disabled={isRunning} className={inputCls}>
            <option value="auto">自动选择</option>
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
            <option value="astar">A*</option>
            <option value="bfs">BFS</option>
          </select>
        </div>

        {/* Same start */}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="sameStart" checked={useSameStart}
            onChange={e => setUseSameStart(e.target.checked)} disabled={isRunning}
            className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="sameStart" className="text-sm text-zinc-700 dark:text-zinc-300">
            同一起点出发
          </label>
        </div>

        {/* Visualization */}
        <div>
          <label className={labelCls}>可视化</label>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showExploration" checked={showExploration}
                onChange={e => setShowExploration(e.target.checked)} disabled={isRunning}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="showExploration" className="text-sm text-zinc-700 dark:text-zinc-300">搜索过程</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showPath" checked={showPath}
                onChange={e => setShowPath(e.target.checked)} disabled={isRunning}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="showPath" className="text-sm text-zinc-700 dark:text-zinc-300">规划路径</label>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                速度 {visualizationSpeed}ms
              </label>
              <input type="range" min="10" max="200" step="10" value={visualizationSpeed}
                onChange={e => setVisualizationSpeed(parseInt(e.target.value))}
                disabled={isRunning}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500" />
            </div>
          </div>
        </div>

        {/* Maze source */}
        <div>
          <label className={labelCls}>迷宫来源</label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-1.5">
              <input type="radio" name="mazeSource" value="random" checked={mazeSource === 'random'}
                onChange={() => setMazeSource('random')} disabled={isRunning}
                className="h-4 w-4 border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">随机</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" name="mazeSource" value="file" checked={mazeSource === 'file'}
                onChange={() => setMazeSource('file')} disabled={isRunning}
                className="h-4 w-4 border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">文件</span>
            </label>
          </div>

          {mazeSource === 'file' && (
            <div className="mb-3">
              <input type="file" accept=".txt" onChange={onFileUpload} disabled={isRunning}
                className="w-full text-sm text-zinc-500 dark:text-zinc-400
                  file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0
                  file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700
                  dark:file:bg-indigo-900/30 dark:file:text-indigo-300 hover:file:bg-indigo-100" />
              {mazeFileName && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">{mazeFileName}</p>
              )}
            </div>
          )}

          <div className="space-y-2.5">
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">起点 (x, y)</label>
              <div className="flex gap-2">
                <input type="number" min="0" max={mazeSize - 1} value={customStart.x}
                  onChange={e => setCustomStart({ ...customStart, x: parseInt(e.target.value) })}
                  disabled={isRunning} className={`${inputCls} w-20`} />
                <input type="number" min="0" max={mazeSize - 1} value={customStart.y}
                  onChange={e => setCustomStart({ ...customStart, y: parseInt(e.target.value) })}
                  disabled={isRunning} className={`${inputCls} w-20`} />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">终点 (x, y)</label>
              <div className="flex gap-2">
                <input type="number" min="0" max={mazeSize - 1} value={customGoal.x}
                  onChange={e => setCustomGoal({ ...customGoal, x: parseInt(e.target.value) })}
                  disabled={isRunning} className={`${inputCls} w-20`} />
                <input type="number" min="0" max={mazeSize - 1} value={customGoal.y}
                  onChange={e => setCustomGoal({ ...customGoal, y: parseInt(e.target.value) })}
                  disabled={isRunning} className={`${inputCls} w-20`} />
              </div>
            </div>
          </div>
        </div>

        {/* Per-agent config */}
        {agentCount > 1 && (
          <>
            <div>
              <label className={labelCls}>各智能体启发函数</label>
              <div className="space-y-1.5">
                {Array.from({ length: agentCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16">智能体 {i + 1}</span>
                    <select value={agentHeuristics[i]}
                      onChange={e => {
                        const next = [...agentHeuristics];
                        next[i] = e.target.value as HeuristicType | 'auto';
                        setAgentHeuristics(next);
                      }}
                      disabled={isRunning}
                      className={`${inputCls} flex-1 text-xs`}>
                      <option value="auto">自动</option>
                      <option value="manhattan">曼哈顿</option>
                      <option value="euclidean">欧几里得</option>
                      <option value="diagonal">对角线</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>各智能体算法</label>
              <div className="space-y-1.5">
                {Array.from({ length: agentCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16">智能体 {i + 1}</span>
                    <select value={agentAlgorithms[i]}
                      onChange={e => {
                        const next = [...agentAlgorithms];
                        next[i] = e.target.value as PathfindingAlgorithm;
                        setAgentAlgorithms(next);
                      }}
                      disabled={isRunning}
                      className={`${inputCls} flex-1 text-xs`}>
                      <option value="astar">A*</option>
                      <option value="bfs">BFS</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {!isRunning ? (
            <button onClick={onStart}
              className={`${btnMain} bg-indigo-600 text-white hover:bg-indigo-700`}>
              <Play className="w-4 h-4 mr-1.5" />开始实验
            </button>
          ) : isPaused ? (
            <button onClick={onResume}
              className={`${btnMain} bg-emerald-600 text-white hover:bg-emerald-700`}>
              <Play className="w-4 h-4 mr-1.5" />继续
            </button>
          ) : (
            <button onClick={onPause}
              className={`${btnMain} bg-amber-500 text-white hover:bg-amber-600`}>
              <Pause className="w-4 h-4 mr-1.5" />暂停
            </button>
          )}
          <button onClick={onReset}
            className={`${btnMain} bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700`}>
            <RotateCcw className="w-4 h-4 mr-1.5" />重置
          </button>
        </div>
      </div>
    </div>
  );
}
