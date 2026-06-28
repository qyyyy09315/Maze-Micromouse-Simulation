import { useState } from 'react';
import { Award, ChevronDown } from 'lucide-react';
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setShow(!show)}>
        <h2 className="text-xl font-semibold flex items-center">
          <Award className="w-5 h-5 mr-2 text-purple-500" />
          实验结果与统计
        </h2>
        <ChevronDown className={`w-5 h-5 transition-transform ${show ? 'rotate-180' : ''}`} />
      </div>

      {show && (
        <div className="mt-6 space-y-8">
          {/* Competition results table */}
          <div>
            <h3 className="text-lg font-medium mb-4">竞赛结果</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">智能体</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">获胜次数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">平均路径长度</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">平均探索节点数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">平均规划时间(ms)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">碰撞率</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {competitionResults.length > 0 ? (
                    competitionResults.map(result => (
                      <tr key={result.agentId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: AGENT_COLORS[result.agentId % AGENT_COLORS.length] }} />
                            智能体 {result.agentId + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{result.wins}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{result.averagePathLength.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{result.averageExploredNodes.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{result.averagePathfindingTime.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{(result.collisionRate * 100).toFixed(2)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        暂无竞赛结果
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Heuristic comparison chart */}
          <div>
            <h3 className="text-lg font-medium mb-4">启发式函数性能对比</h3>
            <HeuristicChart data={experimentResults} />
          </div>
        </div>
      )}
    </div>
  );
}
