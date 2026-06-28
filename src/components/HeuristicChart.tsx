import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ExperimentResult } from '../types';
import { AGENT_COLORS } from '../types';

interface HeuristicChartProps {
  data: ExperimentResult[];
}

const STROKES = {
  manhattan: AGENT_COLORS[0], // red
  euclidean: AGENT_COLORS[1], // teal
  diagonal: AGENT_COLORS[2], // blue
  optimal: '#f59e0b',        // amber
};

export default function HeuristicChart({ data }: HeuristicChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
        点击顶部「启发式对比」按钮运行实验
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis
            dataKey="obstacleRate"
            tick={{ fontSize: 12 }}
            tickFormatter={v => `${(Number(v) * 100).toFixed(0)}%`}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
              fontSize: '13px',
            }}
            formatter={(value: number) => [value.toLocaleString(), '']}
            labelFormatter={v => `障碍率 ${(Number(v) * 100).toFixed(0)}%`}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />
          <Line
            type="monotone"
            dataKey="manhattanNodes"
            name="曼哈顿"
            stroke={STROKES.manhattan}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="euclideanNodes"
            name="欧几里得"
            stroke={STROKES.euclidean}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="diagonalNodes"
            name="对角线"
            stroke={STROKES.diagonal}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="optimalNodes"
            name="最优"
            stroke={STROKES.optimal}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
