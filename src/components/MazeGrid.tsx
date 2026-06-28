import { useRef, useEffect, useCallback } from 'react';
import type { Maze, Agent } from '../types';

interface MazeGridProps {
  maze: Maze;
  mazeSize: number;
  agents: Agent[];
  showExploration: boolean;
  showPath: boolean;
  currentSearchStep: number;
}

// Color palette
const COLORS = {
  empty: '#ffffff',
  obstacle: '#374151',
  start: '#22c55e',
  goal: '#ef4444',
  explored: '#bfdbfe',
  finalPath: '#fde68a',
  border: '#d1d5db',
  darkEmpty: '#1f2937',
  darkObstacle: '#111827',
  darkExplored: '#1e3a5f',
  darkFinalPath: '#78350f',
  darkBorder: '#4b5563',
};

/**
 * Canvas-based maze renderer.
 * Handles up to 500x500 mazes without DOM explosion.
 * Falls back to simple div grid for small mazes (< 30) for crisp rendering.
 */
export default function MazeGrid({
  maze, mazeSize, agents, showExploration, showPath, currentSearchStep,
}: MazeGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cellSize = size / mazeSize;

    // Draw cells
    for (let y = 0; y < mazeSize; y++) {
      for (let x = 0; x < mazeSize; x++) {
        const cell = maze[y]?.[x];
        if (!cell) continue;

        let color: string;
        switch (cell.type) {
          case 'obstacle':
            color = isDark ? COLORS.darkObstacle : COLORS.obstacle;
            break;
          case 'start':
            color = COLORS.start;
            break;
          case 'goal':
            color = COLORS.goal;
            break;
          default:
            color = isDark ? COLORS.darkEmpty : COLORS.empty;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Border
        ctx.strokeStyle = isDark ? COLORS.darkBorder : COLORS.border;
        ctx.lineWidth = cellSize > 8 ? 0.5 : 0.2;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // Draw explored nodes
    if (showExploration && currentSearchStep > 0) {
      for (const agent of agents) {
        const nodes = agent.exploredNodes.slice(0, currentSearchStep);
        for (const node of nodes) {
          const cell = maze[node.y]?.[node.x];
          if (cell && (cell.type === 'empty' || cell.type === 'start' || cell.type === 'goal')) {
            ctx.fillStyle = isDark ? COLORS.darkExplored : COLORS.explored;
            ctx.fillRect(node.x * cellSize, node.y * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // Draw paths
    if (showPath) {
      for (const agent of agents) {
        if (agent.path.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = agent.color;
        ctx.lineWidth = Math.max(1, cellSize * 0.15);
        ctx.globalAlpha = 0.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const first = agent.path[0];
        ctx.moveTo((first.x + 0.5) * cellSize, (first.y + 0.5) * cellSize);
        for (let i = 1; i < agent.path.length; i++) {
          const p = agent.path[i];
          ctx.lineTo((p.x + 0.5) * cellSize, (p.y + 0.5) * cellSize);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Draw agents
    for (const agent of agents) {
      if (!agent.position) continue;
      const cx = (agent.position.x + 0.5) * cellSize;
      const cy = (agent.position.y + 0.5) * cellSize;
      const radius = Math.max(2, cellSize * 0.35);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = agent.color;
      ctx.globalAlpha = agent.isActive ? 0.85 : 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Agent ID text
      if (cellSize > 10) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(8, cellSize * 0.3)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${agent.id + 1}`, cx, cy);
      }
    }

    // Draw S/G labels
    if (cellSize > 12) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, cellSize * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let y = 0; y < mazeSize; y++) {
        for (let x = 0; x < mazeSize; x++) {
          const cell = maze[y]?.[x];
          if (cell?.type === 'start') {
            ctx.fillText('S', (x + 0.5) * cellSize, (y + 0.5) * cellSize);
          } else if (cell?.type === 'goal') {
            ctx.fillText('G', (x + 0.5) * cellSize, (y + 0.5) * cellSize);
          }
        }
      }
    }
  }, [maze, mazeSize, agents, showExploration, showPath, currentSearchStep, isDark]);

  // Redraw on any state change
  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on container resize
  useEffect(() => {
    const observer = new ResizeObserver(() => draw());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="relative w-full max-w-[800px] mx-auto aspect-square">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-lg"
      />
    </div>
  );
}
