import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Github, Sun, Moon } from 'lucide-react';
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
  // ── Theme ──
  const { theme, toggleTheme } = useTheme();

  // ── Config state ──
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

  // Sync per-agent arrays when count changes
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

  // Update customGoal to center on maze size change, clamp customStart to bounds
  useEffect(() => {
    const size = mazeSize;
    setCustomGoal({ x: Math.floor(size / 2), y: Math.floor(size / 2) });
    // Clamp customStart to prevent out-of-bounds crash when maze shrinks
    setCustomStart(prev => ({
      x: Math.min(prev.x, size - 1),
      y: Math.min(prev.y, size - 1),
    }));
  }, [mazeSize]);

  // ── Simulation hook ──
  const simulation = useMazeSimulation({
    mazeSize, obstacleRate, agentCount,
    selectedHeuristic, selectedAlgorithm,
    agentHeuristics, agentAlgorithms,
    useSameStart, showExploration, showPath, visualizationSpeed,
    mazeSource, customStart, customGoal, fileContent,
  });

  // ── Experiment hook ──
  const experiment = useExperiment(mazeSize);

  // ── File upload handler ──
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      {/* Header */}
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
              onClick={experiment.runHeuristicComparison}
              disabled={experiment.isRunning}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50"
            >
              <BarChart3 className={`w-4 h-4 mr-2 ${experiment.isRunning ? 'animate-spin' : ''}`} />
              {experiment.isRunning
                ? `对比中 ${experiment.progress}/8...`
                : '启发式对比'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'dark' ? '切换亮色模式' : '切换暗色模式'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a
              href="https://github.com/qyyyy09315/Maze-Micromouse-Simulation"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Control panel */}
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

          {/* Right: Maze + Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 overflow-hidden">
              <MazeGrid
                maze={simulation.maze}
                mazeSize={mazeSize}
                agents={simulation.agents}
                showExploration={showExploration}
                showPath={showPath}
                currentSearchStep={simulation.currentSearchStep}
              />
            </div>

            <StatsPanel
              competitionResults={simulation.competitionResults}
              experimentResults={experiment.experimentResults}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 shadow-inner mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 电脑鼠迷宫实验系统 | 启发式优化与多智能体竞赛
          </p>
        </div>
      </footer>
    </div>
  );
}
