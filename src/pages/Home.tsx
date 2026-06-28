import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Github } from 'lucide-react';
import type { HeuristicType, PathfindingAlgorithm, Position } from '../types';
import {
  DEFAULT_MAZE_SIZE, DEFAULT_OBSTACLE_RATE,
} from '../types';
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
  const [agentHeuristics, setAgentHeuristics] = useState<(HeuristicType | 'auto')[]>(
    ['auto', 'auto'],
  );
  const [agentAlgorithms, setAgentAlgorithms] = useState<PathfindingAlgorithm[]>(
    ['bfs', 'astar'],
  );
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
    setCustomStart(prev => ({
      x: Math.min(prev.x, size - 1),
      y: Math.min(prev.y, size - 1),
    }));
  }, [mazeSize]);

  const simulation = useMazeSimulation({
    mazeSize, obstacleRate, agentCount,
    selectedHeuristic, selectedAlgorithm,
    agentHeuristics, agentAlgorithms,
    useSameStart, showExploration, showPath, visualizationSpeed,
    mazeSource, customStart, customGoal, fileContent,
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
      const ok = simulation.loadMazeFile(content);
      if (!ok) {
        setFileContent('');
        setMazeFileName('');
      }
    };
    reader.readAsText(file);
  }, [simulation]);

  const btnBase = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';
  const btnPrimary = `${btnBase} px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-zinc-50/80 dark:bg-zinc-950/80 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐭</span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                迷宫电脑鼠实验
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 tracking-wide">
                A* · BFS · 多智能体竞赛
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={experiment.runHeuristicComparison}
              disabled={experiment.isRunning}
              className={`${btnPrimary} text-sm px-4 py-2`}
            >
              <BarChart3 className={`w-4 h-4 mr-1.5 ${experiment.isRunning ? 'animate-spin' : ''}`} />
              {experiment.isRunning
                ? `${experiment.progress}/8`
                : '启发式对比'}
            </button>

            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors duration-200 active:scale-[0.95]"
              title={theme === 'dark' ? '浅色模式' : '深色模式'}
            >
              <span className="text-sm font-medium tabular-nums">
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
            </button>

            <a
              href="https://github.com/qyyyy09315/Maze-Micromouse-Simulation"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors duration-200"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control panel */}
          <div className="lg:col-span-1">
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
          </div>

          {/* Maze + Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-5">
                <MazeGrid
                  maze={simulation.maze}
                  mazeSize={mazeSize}
                  agents={simulation.agents}
                  showExploration={showExploration}
                  showPath={showPath}
                  currentSearchStep={simulation.currentSearchStep}
                />
              </div>
            </div>

            <StatsPanel
              competitionResults={simulation.competitionResults}
              experimentResults={experiment.experimentResults}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            大连海洋大学 · 算法设计与分析 · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
