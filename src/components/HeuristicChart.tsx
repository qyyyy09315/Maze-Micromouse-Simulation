import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ExperimentResult } from '../types';

interface HeuristicChartProps { data: ExperimentResult[]; }

// ColorBrewer Set2 — academic, colorblind-safe palette
const PALETTE = {
  manhattan: '#66c2a5',
  euclidean: '#fc8d62',
  diagonal: '#8da0cb',
  optimal: '#e78ac3',
};

function useIsDark() {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    const o = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => o.disconnect();
  }, []);
  return dark;
}

import React from 'react';

export default function HeuristicChart({ data }: HeuristicChartProps) {
  const isDark = useIsDark();

  if (data.length === 0) {
    return (
      <div className={`h-64 w-full flex items-center justify-center text-sm ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
        点击「启发式对比实验」按钮生成图表
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#44403c' : '#d6d3d1'} />
          <XAxis dataKey="obstacleRate" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
            tickFormatter={v => `${(Number(v) * 100).toFixed(0)}%`} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            contentStyle={{
              borderRadius: 4, border: `1px solid ${isDark ? '#57534e' : '#d6d3d1'}`,
              background: isDark ? '#1c1917' : '#fafaf9', fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
            }}
            formatter={(value: number) => [value.toLocaleString(), '']}
            labelFormatter={v => `障碍率 ${(Number(v) * 100).toFixed(0)}%`}
          />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
          <Line type="monotone" dataKey="manhattanNodes" name="曼哈顿距离" stroke={PALETTE.manhattan} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="euclideanNodes" name="欧几里得距离" stroke={PALETTE.euclidean} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="diagonalNodes" name="对角线优化" stroke={PALETTE.diagonal} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="optimalNodes" name="最优（下界）" stroke={PALETTE.optimal} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
