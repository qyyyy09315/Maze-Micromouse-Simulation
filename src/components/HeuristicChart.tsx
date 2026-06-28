import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ExperimentResult } from '../types';

interface HeuristicChartProps {
  data: ExperimentResult[];
}

export default function HeuristicChart({ data }: HeuristicChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        点击"启发式对比"按钮运行实验
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="obstacleRate"
            label={{ value: '障碍率', position: 'insideBottom', offset: -5 }}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
          />
          <YAxis label={{ value: '路径长度', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            formatter={(value: number) => [`${value}`, '']}
            labelFormatter={v => `障碍率: ${(Number(v) * 100).toFixed(0)}%`}
          />
          <Legend />
          <Line type="monotone" dataKey="manhattanNodes" name="曼哈顿距离" stroke="#FF6B6B" strokeWidth={2} activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="euclideanNodes" name="欧几里得距离" stroke="#4ECDC4" strokeWidth={2} />
          <Line type="monotone" dataKey="diagonalNodes" name="对角线优化" stroke="#45B7D1" strokeWidth={2} />
          <Line type="monotone" dataKey="optimalNodes" name="最优路径" stroke="#FFD166" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
