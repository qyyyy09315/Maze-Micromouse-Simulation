import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CompetitionResult, ExperimentResult } from '../types';
import { AGENT_COLORS } from '../types';
import HeuristicChart from './HeuristicChart';

interface StatsPanelProps {
  competitionResults: CompetitionResult[];
  experimentResults: ExperimentResult[];
}

function useIsDark() {
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export default function StatsPanel({ competitionResults, experimentResults }: StatsPanelProps) {
  const [show, setShow] = useState(false);
  const isDark = useIsDark();

  useEffect(() => {
    if (competitionResults.length > 0 || experimentResults.length > 0) setShow(true);
  }, [competitionResults.length, experimentResults.length]);

  const clr = (i: number) => AGENT_COLORS[i % AGENT_COLORS.length];

  return (
    <div className={`border rounded ${isDark ? 'border-stone-700 bg-stone-800' : 'border-stone-300 bg-white'}`}>
      <button
        onClick={() => setShow(!show)}
        className={`w-full flex items-center justify-between px-5 py-3 text-left ${isDark ? 'hover:bg-stone-700/50' : 'hover:bg-stone-50'} transition-colors duration-150`}
      >
        <h2 className="text-base font-semibold tracking-tight">实验结果与统计</h2>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${show ? 'rotate-180' : ''} ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
      </button>

      {show && (
        <div className={`px-5 pb-5 space-y-8 border-t ${isDark ? 'border-stone-700' : 'border-stone-200'}`}>
          {/* 表 1：竞赛统计 */}
          <div className="pt-5">
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>表 1：智能体竞赛统计</h3>
            <div className="overflow-x-auto">
              <table className={`min-w-full text-sm`}>
                <thead>
                  <tr className={`border-b-2 ${isDark ? 'border-stone-600' : 'border-stone-400'}`}>
                    <th className="px-3 py-2 text-left font-semibold text-xs tracking-wide uppercase">智能体</th>
                    <th className="px-3 py-2 text-right font-semibold text-xs tracking-wide uppercase tabular-nums">获胜次数</th>
                    <th className="px-3 py-2 text-right font-semibold text-xs tracking-wide uppercase tabular-nums">平均路径长度</th>
                    <th className="px-3 py-2 text-right font-semibold text-xs tracking-wide uppercase tabular-nums">平均探索节点数</th>
                    <th className="px-3 py-2 text-right font-semibold text-xs tracking-wide uppercase tabular-nums">平均规划时间</th>
                    <th className="px-3 py-2 text-right font-semibold text-xs tracking-wide uppercase tabular-nums">碰撞率</th>
                  </tr>
                </thead>
                <tbody>
                  {competitionResults.length > 0 ? (
                    competitionResults.map((r, i) => (
                      <tr key={r.agentId} className={`border-b ${isDark ? 'border-stone-700' : 'border-stone-200'}`}>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: clr(i) }} />
                            智能体 {r.agentId + 1}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono">{r.wins}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono">{r.averagePathLength.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono">{r.averageExploredNodes.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono">{r.averagePathfindingTime.toFixed(1)}ms</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono">{(r.collisionRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className={`px-3 py-6 text-center text-sm ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        暂无竞赛数据 — 运行实验后将自动显示结果
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 图 2：启发式对比 */}
          <div>
            <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>图 2：启发式函数探索效率对比</h3>
            <p className={`text-xs mb-3 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>障碍率 5%–40%，纵轴为探索节点数（越少效率越高）</p>
            <HeuristicChart data={experimentResults} />
          </div>
        </div>
      )}
    </div>
  );
}
