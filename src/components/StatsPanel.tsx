import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CompetitionResult, ExperimentResult } from '../types';
import { AGENT_COLORS } from '../types';
import HeuristicChart from './HeuristicChart';

interface StatsPanelProps {
  competitionResults: CompetitionResult[];
  experimentResults: ExperimentResult[];
}

export default function StatsPanel({
  competitionResults, experimentResults,
}: StatsPanelProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (competitionResults.length > 0 || experimentResults.length > 0) {
      setShow(true);
    }
  }, [competitionResults.length, experimentResults.length]);

  const thCls = 'px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider';
  const tdCls = 'px-4 py-2.5 text-sm tabular-nums';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <button
        onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150"
      >
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          实验结果
        </h2>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${show ? 'rotate-180' : ''}`} />
      </button>

      {show && (
        <div className="px-5 pb-5 space-y-8 border-t border-zinc-100 dark:border-zinc-800">
          {/* Competition table */}
          <div className="pt-5">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">竞赛统计</h3>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className={thCls}>智能体</th>
                    <th className={thCls}>获胜</th>
                    <th className={thCls}>平均路径</th>
                    <th className={thCls}>探索节点</th>
                    <th className={thCls}>规划时间</th>
                    <th className={thCls}>碰撞率</th>
                  </tr>
                </thead>
                <tbody>
                  {competitionResults.length > 0 ? (
                    competitionResults.map(result => (
                      <tr key={result.agentId} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className={tdCls}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: AGENT_COLORS[result.agentId % AGENT_COLORS.length] }}
                            />
                            智能体 {result.agentId + 1}
                          </div>
                        </td>
                        <td className={tdCls}>{result.wins}</td>
                        <td className={tdCls}>{result.averagePathLength.toFixed(1)}</td>
                        <td className={tdCls}>{result.averageExploredNodes.toFixed(0)}</td>
                        <td className={tdCls}>{result.averagePathfindingTime.toFixed(1)}ms</td>
                        <td className={tdCls}>{(result.collisionRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-zinc-400">
                        运行实验后将显示竞赛结果
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Heuristic chart */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">启发式性能对比</h3>
            <HeuristicChart data={experimentResults} />
          </div>
        </div>
      )}
    </div>
  );
}
