import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Github } from 'lucide-react';
import type { HeuristicType, PathfindingAlgorithm, Position } from '../types';
import { DEFAULT_MAZE_SIZE, DEFAULT_OBSTACLE_RATE } from '../types';
import { useMazeSimulation } from '../hooks/useMazeSimulation';
import { useExperiment } from '../hooks/useExperiment';
import { useTheme } from '../hooks/useTheme';
import MazeGrid from '../components/MazeGrid';
import ControlPanel from '../components/ControlPanel';
import StatsPanel from '../components/StatsPanel';

export default function Home() {
  const { theme, handleToggleTheme } = useTheme();

  const [mazeSize, setMazeSize] = useState(DEFAULT_MAZE_SIZE);
  const [obstacleRate, setObstacleRate] = useState(DEFAULT_OBSTACLE_RATE);
  const [agentCount, setAgentCount] = useState(2);
  const [selectedHeuristic, setSelectedHeuristic] = useState<HeuristicType | 'auto'>('auto');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<PathfindingAlgorithm>('astar');
  const [agentHeuristics, setAgentHeuristics] = useState<(HeuristicType | 'auto')[]>(['auto', 'auto']);
  const [agentAlgorithms, setAgentAlgorithms] = useState<PathfindingAlgorithm[]>(['bfs', 'astar']);
  const [useSameStart, setUseSameStart] = useState(false);
  const [showExploration, setShowExploration] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [visualizationSpeed, setVisualizationSpeed] = useState(50);
  const [mazeSource, setMazeSource] = useState<'random' | 'file'>('random');
  const [customStart, setCustomStart] = useState<Position>({ x: 0, y: 0 });
  const [customGoal, setCustomGoal] = useState<Position>({ x: 0, y: 0 });
  const [fileContent, setFileContent] = useState('');
  const [mazeFileName, setMazeFileName] = useState('');

  useEffect(() => {
    setAgentHeuristics(prev => {
      const next = [...prev];
      while (next.length < agentCount) next.push(selectedHeuristic);
      if (next.length > agentCount) next.splice(agentCount);
      return next;
    });
  }, [agentCount, selectedHeuristic]);
  useEffect(() => {
    setAgentAlgorithms(prev => {
      const next = [...prev];
      while (next.length < agentCount) next.push(selectedAlgorithm);
      if (next.length > agentCount) next.splice(agentCount);
      return next;
    });
  }, [agentCount, selectedAlgorithm]);
  useEffect(() => {
    const size = mazeSize;
    setCustomGoal({ x: Math.floor(size / 2), y: Math.floor(size / 2) });
    setCustomStart(prev => ({ x: Math.min(prev.x, size - 1), y: Math.min(prev.y, size - 1) }));
  }, [mazeSize]);

  const simulation = useMazeSimulation({
    mazeSize, obstacleRate, agentCount, selectedHeuristic, selectedAlgorithm,
    agentHeuristics, agentAlgorithms, useSameStart, showExploration, showPath,
    visualizationSpeed, mazeSource, customStart, customGoal, fileContent,
  });
  const experiment = useExperiment(mazeSize);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'text/plain') return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      setMazeFileName(file.name);
      if (!simulation.loadMazeFile(content)) { setFileContent(''); setMazeFileName(''); }
    };
    reader.readAsText(file);
  }, [simulation]);

  const isDark = theme === 'dark';
  const btn = 'inline-flex items-center justify-center font-medium rounded text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-stone-900 text-stone-200' : 'bg-stone-50 text-stone-800'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 border-b ${isDark ? 'bg-stone-900/95 border-stone-700' : 'bg-stone-50/95 border-stone-300'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🐭</span>
            <div>
              <h1 className="text-base font-semibold tracking-tight">迷宫电脑鼠实验系统</h1>
              <p className={`text-xs tracking-wide ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>大连海洋大学 · 算法设计与分析</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={experiment.runHeuristicComparison} disabled={experiment.isRunning}
              className={`${btn} px-4 py-1.5 text-sm ${isDark ? 'bg-blue-900 text-blue-100 hover:bg-blue-800' : 'bg-blue-800 text-white hover:bg-blue-900'} disabled:opacity-50`}>
              <BarChart3 className={`w-4 h-4 mr-1.5 ${experiment.isRunning ? 'animate-spin' : ''}`} />
              {experiment.isRunning ? `对比中 ${experiment.progress}/8` : '启发式对比实验'}
            </button>
            <button onClick={handleToggleTheme}
              className={`px-2 py-1 rounded text-sm ${isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'}`}
              title={isDark ? '浅色模式' : '深色模式'}>
              {isDark ? '浅色' : '深色'}
            </button>
            <a href="https://github.com/qyyyy09315/Maze-Micromouse-Simulation" target="_blank" rel="noopener noreferrer"
              className={`${isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'}`}>
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Left sidebar */}
          <aside>
            <ControlPanel
              agentCount={agentCount} setAgentCount={setAgentCount}
              mazeSize={mazeSize} setMazeSize={setMazeSize}
              obstacleRate={obstacleRate} setObstacleRate={setObstacleRate}
              selectedHeuristic={selectedHeuristic} setSelectedHeuristic={setSelectedHeuristic}
              selectedAlgorithm={selectedAlgorithm} setSelectedAlgorithm={setSelectedAlgorithm}
              agentHeuristics={agentHeuristics} setAgentHeuristics={setAgentHeuristics}
              agentAlgorithms={agentAlgorithms} setAgentAlgorithms={setAgentAlgorithms}
              useSameStart={useSameStart} setUseSameStart={setUseSameStart}
              showExploration={showExploration} setShowExploration={setShowExploration}
              showPath={showPath} setShowPath={setShowPath}
              visualizationSpeed={visualizationSpeed} setVisualizationSpeed={setVisualizationSpeed}
              mazeSource={mazeSource} setMazeSource={setMazeSource}
              customStart={customStart} setCustomStart={setCustomStart}
              customGoal={customGoal} setCustomGoal={setCustomGoal}
              isRunning={simulation.isRunning}
              isPaused={simulation.isPaused}
              onStart={simulation.startExperiment}
              onPause={simulation.pauseExperiment}
              onResume={simulation.resumeExperiment}
              onReset={simulation.resetExperiment}
              onFileUpload={handleFileUpload}
              mazeFileName={mazeFileName}
            />
          </aside>

          {/* Right content */}
          <section className="space-y-8">
            <div className={`border rounded ${isDark ? 'border-stone-700 bg-stone-800' : 'border-stone-300 bg-white'}`}>
              <div className="p-4">
                <MazeGrid
                  maze={simulation.maze} mazeSize={mazeSize} agents={simulation.agents}
                  showExploration={showExploration} showPath={showPath}
                  currentSearchStep={simulation.currentSearchStep}
                />
              </div>
              <div className={`px-4 py-2 border-t text-xs ${isDark ? 'border-stone-700 text-stone-400' : 'border-stone-200 text-stone-500'}`}>
                图 1：迷宫可视化 — 蓝色为障碍物，绿色为起点，红色为终点
              </div>
            </div>

            <StatsPanel
              competitionResults={simulation.competitionResults}
              experimentResults={experiment.experimentResults}
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t mt-12 ${isDark ? 'border-stone-700' : 'border-stone-300'}`}>
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs">
            <p className={isDark ? 'text-stone-500' : 'text-stone-400'}>
              大连海洋大学 · 算法设计与分析课程期末项目 · 2026年6月
            </p>
            <p className={isDark ? 'text-stone-500' : 'text-stone-400'}>
              仅供教育研究用途 · MIT License
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
