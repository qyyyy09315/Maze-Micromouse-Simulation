import type { HeuristicType, PathfindingAlgorithm, Position } from '../types';
import { MIN_MAZE_SIZE, MAX_MAZE_SIZE, MAX_AGENTS } from '../types';

interface ControlPanelProps {
  agentCount: number; setAgentCount: (n: number) => void;
  mazeSize: number; setMazeSize: (n: number) => void;
  obstacleRate: number; setObstacleRate: (n: number) => void;
  selectedHeuristic: HeuristicType | 'auto'; setSelectedHeuristic: (h: HeuristicType | 'auto') => void;
  selectedAlgorithm: PathfindingAlgorithm; setSelectedAlgorithm: (a: PathfindingAlgorithm) => void;
  agentHeuristics: (HeuristicType | 'auto')[]; setAgentHeuristics: (h: (HeuristicType | 'auto')[]) => void;
  agentAlgorithms: PathfindingAlgorithm[]; setAgentAlgorithms: (a: PathfindingAlgorithm[]) => void;
  useSameStart: boolean; setUseSameStart: (v: boolean) => void;
  showExploration: boolean; setShowExploration: (v: boolean) => void;
  showPath: boolean; setShowPath: (v: boolean) => void;
  visualizationSpeed: number; setVisualizationSpeed: (v: number) => void;
  mazeSource: 'random' | 'file'; setMazeSource: (s: 'random' | 'file') => void;
  customStart: Position; setCustomStart: (p: Position) => void;
  customGoal: Position; setCustomGoal: (p: Position) => void;
  isRunning: boolean; isPaused: boolean;
  onStart: () => void; onPause: () => void; onResume: () => void; onReset: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mazeFileName?: string;
}

function useIsDark() {
  const [d, setD] = React.useState(false);
  React.useEffect(() => {
    setD(document.documentElement.classList.contains('dark'));
    const o = new MutationObserver(() => setD(document.documentElement.classList.contains('dark')));
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => o.disconnect();
  }, []);
  return d;
}

import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function ControlPanel(props: ControlPanelProps) {
  const {
    agentCount, setAgentCount, mazeSize, setMazeSize, obstacleRate, setObstacleRate,
    selectedHeuristic, setSelectedHeuristic, selectedAlgorithm, setSelectedAlgorithm,
    agentHeuristics, setAgentHeuristics, agentAlgorithms, setAgentAlgorithms,
    useSameStart, setUseSameStart, showExploration, setShowExploration,
    showPath, setShowPath, visualizationSpeed, setVisualizationSpeed,
    mazeSource, setMazeSource, customStart, setCustomStart, customGoal, setCustomGoal,
    isRunning, isPaused, onStart, onPause, onResume, onReset,
    onFileUpload, mazeFileName,
  } = props;
  const isDark = useIsDark();
  const dk = isDark;

  const label = `block text-sm font-medium mb-1 ${dk ? 'text-stone-300' : 'text-stone-600'}`;
  const input = `w-full px-2.5 py-1.5 border rounded text-sm font-mono ${dk ? 'bg-stone-700 border-stone-600 text-stone-200' : 'bg-white border-stone-300 text-stone-800'} focus:outline-none focus:ring-2 focus:ring-blue-800/40 focus:border-blue-800`;
  const select = input;
  const cb = `h-4 w-4 rounded border-stone-300 text-blue-800 focus:ring-blue-800`;
  const btn = `inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800`;
  const range = `w-full h-1.5 rounded-full appearance-none cursor-pointer ${dk ? 'bg-stone-600' : 'bg-stone-200'}`;

  return (
    <div className={`border rounded ${dk ? 'border-stone-700 bg-stone-800' : 'border-stone-300 bg-white'}`}>
      <div className={`px-5 py-3 border-b ${dk ? 'border-stone-700' : 'border-stone-200'}`}>
        <h2 className="text-base font-semibold tracking-tight">实验参数设置</h2>
      </div>
      <div className="p-5 space-y-4">
        {/* Agent count */}
        <div>
          <label className={label}>智能体数量</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setAgentCount(Math.max(1, agentCount - 1))} disabled={isRunning}
              className={`px-2 py-1 border rounded text-sm font-mono ${dk ? 'border-stone-600 text-stone-400' : 'border-stone-300 text-stone-500'} disabled:opacity-30`}>−</button>
            <span className="w-6 text-center text-sm font-mono">{agentCount}</span>
            <button onClick={() => setAgentCount(Math.min(MAX_AGENTS, agentCount + 1))} disabled={isRunning}
              className={`px-2 py-1 border rounded text-sm font-mono ${dk ? 'border-stone-600 text-stone-400' : 'border-stone-300 text-stone-500'} disabled:opacity-30`}>+</button>
          </div>
        </div>

        {/* Maze size */}
        <div>
          <label className={label}>迷宫大小 <span className="font-mono">{mazeSize}×{mazeSize}</span></label>
          <div className="flex items-center gap-2">
            <input type="number" min={MIN_MAZE_SIZE} max={MAX_MAZE_SIZE} step={10} value={mazeSize}
              onChange={e => setMazeSize(Math.max(MIN_MAZE_SIZE, Math.min(MAX_MAZE_SIZE, parseInt(e.target.value) || 20)))}
              disabled={isRunning} className={input} />
            <button onClick={() => setMazeSize(Math.max(MIN_MAZE_SIZE, mazeSize - 10))} disabled={isRunning}
              className={`px-2 py-1 border rounded text-sm font-mono ${dk ? 'border-stone-600 text-stone-400' : 'border-stone-300 text-stone-500'} disabled:opacity-30`}>−</button>
            <button onClick={() => setMazeSize(Math.min(MAX_MAZE_SIZE, mazeSize + 10))} disabled={isRunning}
              className={`px-2 py-1 border rounded text-sm font-mono ${dk ? 'border-stone-600 text-stone-400' : 'border-stone-300 text-stone-500'} disabled:opacity-30`}>+</button>
          </div>
          {mazeSize > 100 && <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">大迷宫建议使用 1–2 个智能体</p>}
        </div>

        {/* Obstacle rate */}
        <div>
          <label className={label}>障碍率 <span className="font-mono">{(obstacleRate * 100).toFixed(0)}%</span></label>
          <input type="range" min="0.1" max="0.5" step="0.05" value={obstacleRate}
            onChange={e => setObstacleRate(parseFloat(e.target.value))} disabled={isRunning} className={range} />
          <p className={`text-xs mt-1 ${dk ? 'text-stone-500' : 'text-stone-400'}`}>合理范围 10%–50%</p>
        </div>

        {/* Heuristic + Algorithm */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>启发函数</label>
            <select value={selectedHeuristic} onChange={e => setSelectedHeuristic(e.target.value as HeuristicType | 'auto')} disabled={isRunning} className={select}>
              <option value="auto">自动选择</option>
              <option value="manhattan">曼哈顿距离</option>
              <option value="euclidean">欧几里得距离</option>
              <option value="diagonal">对角线优化</option>
            </select>
          </div>
          <div>
            <label className={label}>路径规划算法</label>
            <select value={selectedAlgorithm} onChange={e => setSelectedAlgorithm(e.target.value as PathfindingAlgorithm)} disabled={isRunning} className={select}>
              <option value="astar">A*</option>
              <option value="bfs">BFS</option>
            </select>
          </div>
        </div>

        {/* Same start */}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="sameStart" checked={useSameStart} onChange={e => setUseSameStart(e.target.checked)} disabled={isRunning} className={cb} />
          <label htmlFor="sameStart" className={`text-sm ${dk ? 'text-stone-300' : 'text-stone-600'}`}>从同一起点出发</label>
        </div>

        {/* Visualization */}
        <div>
          <label className={label}>可视化选项</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showExploration" checked={showExploration} onChange={e => setShowExploration(e.target.checked)} disabled={isRunning} className={cb} />
              <label htmlFor="showExploration" className={`text-sm ${dk ? 'text-stone-300' : 'text-stone-600'}`}>显示搜索过程</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showPath" checked={showPath} onChange={e => setShowPath(e.target.checked)} disabled={isRunning} className={cb} />
              <label htmlFor="showPath" className={`text-sm ${dk ? 'text-stone-300' : 'text-stone-600'}`}>显示规划路径</label>
            </div>
            <div>
              <label className={`text-xs mb-1 block ${dk ? 'text-stone-400' : 'text-stone-500'}`}>动画速度 <span className="font-mono">{visualizationSpeed}ms</span></label>
              <input type="range" min="10" max="200" step="10" value={visualizationSpeed}
                onChange={e => setVisualizationSpeed(parseInt(e.target.value))} disabled={isRunning} className={range} />
            </div>
          </div>
        </div>

        {/* Maze source */}
        <div>
          <label className={label}>迷宫来源</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-1.5"><input type="radio" name="mazeSource" checked={mazeSource === 'random'} onChange={() => setMazeSource('random')} disabled={isRunning} className={cb} /><span className="text-sm">随机生成</span></label>
            <label className="flex items-center gap-1.5"><input type="radio" name="mazeSource" checked={mazeSource === 'file'} onChange={() => setMazeSource('file')} disabled={isRunning} className={cb} /><span className="text-sm">文件导入</span></label>
          </div>
          {mazeSource === 'file' && (
            <div className="mb-3">
              <input type="file" accept=".txt" onChange={onFileUpload} disabled={isRunning}
                className={`w-full text-sm ${dk ? 'text-stone-400' : 'text-stone-500'} file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-100 file:text-blue-900 dark:file:bg-blue-900 dark:file:text-blue-200`} />
              {mazeFileName && <p className={`text-xs mt-1 ${dk ? 'text-stone-500' : 'text-stone-400'}`}>{mazeFileName}</p>}
            </div>
          )}
          <div className="space-y-2">
            <div>
              <label className={`text-xs mb-1 block ${dk ? 'text-stone-400' : 'text-stone-500'}`}>起点坐标 <span className="font-mono">(x, y)</span></label>
              <div className="flex gap-2">
                <input type="number" min="0" max={mazeSize - 1} value={customStart.x} onChange={e => setCustomStart({ ...customStart, x: parseInt(e.target.value) })} disabled={isRunning} className={`${input} w-20`} />
                <input type="number" min="0" max={mazeSize - 1} value={customStart.y} onChange={e => setCustomStart({ ...customStart, y: parseInt(e.target.value) })} disabled={isRunning} className={`${input} w-20`} />
              </div>
            </div>
            <div>
              <label className={`text-xs mb-1 block ${dk ? 'text-stone-400' : 'text-stone-500'}`}>终点坐标 <span className="font-mono">(x, y)</span></label>
              <div className="flex gap-2">
                <input type="number" min="0" max={mazeSize - 1} value={customGoal.x} onChange={e => setCustomGoal({ ...customGoal, x: parseInt(e.target.value) })} disabled={isRunning} className={`${input} w-20`} />
                <input type="number" min="0" max={mazeSize - 1} value={customGoal.y} onChange={e => setCustomGoal({ ...customGoal, y: parseInt(e.target.value) })} disabled={isRunning} className={`${input} w-20`} />
              </div>
            </div>
          </div>
        </div>

        {/* Per-agent */}
        {agentCount > 1 && (
          <>
            <div>
              <label className={label}>各智能体启发函数</label>
              <div className="space-y-1.5">
                {Array.from({ length: agentCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs w-16 font-mono ${dk ? 'text-stone-400' : 'text-stone-500'}`}>智能体 {i + 1}</span>
                    <select value={agentHeuristics[i]} onChange={e => { const n = [...agentHeuristics]; n[i] = e.target.value as HeuristicType | 'auto'; setAgentHeuristics(n); }} disabled={isRunning} className={`${select} flex-1 text-xs`}>
                      <option value="auto">自动</option><option value="manhattan">曼哈顿</option><option value="euclidean">欧几里得</option><option value="diagonal">对角线</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className={label}>各智能体算法</label>
              <div className="space-y-1.5">
                {Array.from({ length: agentCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs w-16 font-mono ${dk ? 'text-stone-400' : 'text-stone-500'}`}>智能体 {i + 1}</span>
                    <select value={agentAlgorithms[i]} onChange={e => { const n = [...agentAlgorithms]; n[i] = e.target.value as PathfindingAlgorithm; setAgentAlgorithms(n); }} disabled={isRunning} className={`${select} flex-1 text-xs`}>
                      <option value="astar">A*</option><option value="bfs">BFS</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className={`flex flex-col gap-2 pt-2 border-t ${dk ? 'border-stone-700' : 'border-stone-200'}`}>
          {!isRunning ? (
            <button onClick={onStart} className={`${btn} ${dk ? 'bg-blue-900 text-blue-100 hover:bg-blue-800' : 'bg-blue-800 text-white hover:bg-blue-900'}`}><Play className="w-3.5 h-3.5" />开始实验</button>
          ) : isPaused ? (
            <button onClick={onResume} className={`${btn} ${dk ? 'bg-emerald-900 text-emerald-100 hover:bg-emerald-800' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}><Play className="w-3.5 h-3.5" />继续实验</button>
          ) : (
            <button onClick={onPause} className={`${btn} ${dk ? 'bg-amber-900 text-amber-100 hover:bg-amber-800' : 'bg-amber-600 text-white hover:bg-amber-700'}`}><Pause className="w-3.5 h-3.5" />暂停实验</button>
          )}
          <button onClick={onReset} className={`${btn} border ${dk ? 'border-stone-600 text-stone-300 hover:bg-stone-700' : 'border-stone-300 text-stone-600 hover:bg-stone-100'}`}><RotateCcw className="w-3.5 h-3.5" />重置实验</button>
        </div>
      </div>
    </div>
  );
}
