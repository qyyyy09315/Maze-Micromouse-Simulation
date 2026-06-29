import { useRef, useEffect, useCallback } from 'react';
import type { Maze, Agent } from '../types';
import {
  CELL_SIZE_LABEL_THRESHOLD,
  CELL_SIZE_SG_THRESHOLD,
  CELL_SIZE_BORDER_THRESHOLD,
} from '../types';

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
  border: '#d1d5db',
  darkEmpty: '#1f2937',
  darkObstacle: '#111827',
  darkBorder: '#4b5563',
  legendBg: 'rgba(255,255,255,0.85)',
  darkLegendBg: 'rgba(31,41,55,0.85)',
  legendText: '#374151',
  darkLegendText: '#e5e7eb',
};

/** Convert hex color to rgba with custom alpha */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function algoLabel(agent: Agent): string {
  const abbr = agent.pathfindingAlgorithm === 'bfs' ? 'BFS' : 'A*';
  if (agent.heuristicType !== 'auto') return `${abbr}(${agent.heuristicType[0].toUpperCase()})`;
  return abbr;
}

/**
 * Canvas-based maze renderer.
 * Exploration uses per-agent colors so BFS vs A* patterns are visually distinct.
 * Handles up to 500×500 mazes without DOM explosion.
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

    // ── Layer 1: Cell backgrounds ──
    for (let y = 0; y < mazeSize; y++) {
      for (let x = 0; x < mazeSize; x++) {
        const cell = maze[y]?.[x];
        if (!cell) continue;

        let fillColor: string;
        switch (cell.type) {
          case 'obstacle':
            fillColor = isDark ? COLORS.darkObstacle : COLORS.obstacle;
            break;
          case 'start':
            fillColor = COLORS.start;
            break;
          case 'goal':
            fillColor = COLORS.goal;
            break;
          default:
            fillColor = isDark ? COLORS.darkEmpty : COLORS.empty;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Grid line
        ctx.strokeStyle = isDark ? COLORS.darkBorder : COLORS.border;
        ctx.lineWidth = cellSize > 8 ? 0.5 : 0.2;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // ── Layer 2: Explored nodes (per-agent color, semi-transparent) ──
    if (showExploration && currentSearchStep > 0) {
      // Draw higher-ID agents first so lower-ID appear on top (less important agents under)
      const sorted = [...agents].sort((a, b) => b.id - a.id);
      for (const agent of sorted) {
        const nodes = agent.exploredNodes.slice(0, currentSearchStep);
        if (nodes.length === 0) continue;

        const fillColor = hexToRgba(agent.color, isDark ? 0.3 : 0.22);
        const borderColor = hexToRgba(agent.color, 0.5);

        for (const node of nodes) {
          const cell = maze[node.y]?.[node.x];
          if (!cell || cell.type === 'obstacle') continue;

          ctx.fillStyle = fillColor;
          ctx.fillRect(node.x * cellSize, node.y * cellSize, cellSize, cellSize);

          // Subtle border on explored cells for cellSize > 6
          if (cellSize > CELL_SIZE_BORDER_THRESHOLD) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 0.3;
            ctx.strokeRect(
              node.x * cellSize + 0.5,
              node.y * cellSize + 0.5,
              cellSize - 1,
              cellSize - 1,
            );
          }
        }
      }
    }

    // ── Layer 3: Planned paths ──
    if (showPath) {
      for (const agent of agents) {
        if (agent.path.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = agent.color;
        ctx.lineWidth = Math.max(1.5, cellSize * 0.2);
        ctx.globalAlpha = agent.isActive ? 0.65 : 0.25;
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

    // ── Layer 4: Agents ──
    for (const agent of agents) {
      if (!agent.position) continue;
      const cx = (agent.position.x + 0.5) * cellSize;
      const cy = (agent.position.y + 0.5) * cellSize;
      const radius = Math.max(2.5, cellSize * 0.38);

      // Glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)';
      ctx.fill();

      // Agent circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = agent.color;
      ctx.globalAlpha = agent.isActive ? 0.9 : 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Agent ID label
      if (cellSize > CELL_SIZE_LABEL_THRESHOLD) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(8, cellSize * 0.32)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${agent.id + 1}`, cx, cy);
      }
    }

    // ── Layer 5: S / G labels ──
    if (cellSize > CELL_SIZE_SG_THRESHOLD) {
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

    // ── Layer 6: Legend (multi-agent mode) ──
    if (agents.length > 1 && cellSize > 6) {
      const padX = 10;
      const padY = 8;
      const itemH = Math.max(14, cellSize * 0.55);
      const itemW = Math.max(80, cellSize * 5);
      const legendW = itemW + padX * 2;
      const legendH = agents.length * itemH + padY * 2;

      // Background
      ctx.fillStyle = isDark ? COLORS.darkLegendBg : COLORS.legendBg;
      ctx.strokeStyle = isDark ? COLORS.darkBorder : COLORS.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(size - legendW - 6, 6, legendW, legendH, 6);
      ctx.fill();
      ctx.stroke();

      // Items
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const fontSize = Math.max(9, itemH * 0.55);
      ctx.font = `${fontSize}px system-ui, sans-serif`;

      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        const y = 6 + padY + i * itemH + itemH / 2;
        const swatchX = size - legendW - 6 + padX + 4;

        // Color swatch
        ctx.fillStyle = agent.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.roundRect(swatchX, y - itemH * 0.32, itemH * 0.64, itemH * 0.64, 3);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Text
        ctx.fillStyle = isDark ? COLORS.darkLegendText : COLORS.legendText;
        const speed = agent.pathfindingTime
          ? `${agent.pathfindingTime.toFixed(1)}ms`
          : '';
        ctx.fillText(
          `A${agent.id + 1} ${algoLabel(agent)} ${speed}`,
          swatchX + itemH * 0.8,
          y,
        );
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
        className="w-full h-full border border-stone-300 dark:border-stone-600"
      />
    </div>
  );
}
