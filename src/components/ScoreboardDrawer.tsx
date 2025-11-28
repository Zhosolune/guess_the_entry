import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { initState } from '../utils/stateManager';
import { CATEGORIES } from '../constants/game.constants';
import { ACTUAL_CATEGORIES } from '../utils/categoryMapper';
import { ScoreBoardIcon } from '../assets/scoreBoard';

interface ScoreboardDrawerProps {
  /**
   * 是否打开计分板抽屉
   */
  isOpen: boolean;
  /**
   * 关闭抽屉的回调
   */
  onClose: () => void;
  currentHintCount?: number;
  perfectVictory?: boolean;
}

/**
 * 计分板抽屉组件（从顶部栏下方向下展开）
 * - 顶部定位在 TopBar 下方，层级最高
 * - 支持点击遮罩区域关闭
 * - 抽屉底边水平居中放置关闭按钮（X）
 * - 内含设置项：速查表位置（下/左/右），变更后立即回调生效
 */
const ScoreboardDrawer: React.FC<ScoreboardDrawerProps> = ({
  isOpen,
  onClose,
  currentHintCount = 0,
  perfectVictory = false,
}) => {
  interface GameRecord { gameId: string; entry: string; category: string; attempts: number; hitCount: number; wrongCount: number; hintCount: number; timeSpentSec: number; victoryProgress: number; perfect: boolean; timestamp: number; date: string }
  interface Aggregates { totalGames: number; totalSuccess: number; perfectSuccess: number; avgTimeSec: number; avgAttempts: number; avgProgress: number; avgHintCount: number }

  const [aggregates, setAggregates] = useState<Aggregates>({ totalGames: 0, totalSuccess: 0, perfectSuccess: 0, avgTimeSec: 0, avgAttempts: 0, avgProgress: 0, avgHintCount: 0 });

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const s = await initState();
        const totalGames = s.stats.totalGames || 0;
        const totalSuccess = s.stats.totalSuccess || 0;
        const records = (s.stats.records || []) as GameRecord[];
        const perfectSuccess = records.filter(i => i.perfect === true).length;
        const avgTimeSec = records.length ? Math.round((records.reduce((sum, i) => sum + (i.timeSpentSec || 0), 0)) / records.length) : 0;
        const avgAttempts = records.length ? Math.round((records.reduce((sum, i) => sum + (i.attempts || 0), 0)) / records.length) : 0;
        const avgProgress = records.length ? Math.round((records.reduce((sum, i) => sum + (i.victoryProgress || 0), 0)) / records.length) : 0;
        const hinted = records.filter(i => typeof i.hintCount === 'number' && (i.hintCount as number) > 0);
        const avgHintCount = hinted.length ? Number((hinted.reduce((sum, i) => sum + (i.hintCount || 0), 0) / hinted.length).toFixed(2)) : 0;
        setAggregates({ totalGames, totalSuccess, perfectSuccess, avgTimeSec, avgAttempts, avgProgress, avgHintCount });
      } catch {}
    })();
  }, [isOpen]);

  const formatSeconds = (sec: number): string => {
    if (!sec || sec <= 0) return '0秒';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}分${s}秒` : `${s}秒`;
  };

  const winRate = useMemo(() => {
    if (aggregates.totalGames === 0) return 0;
    return Math.round((aggregates.totalSuccess / aggregates.totalGames) * 100);
  }, [aggregates.totalGames, aggregates.totalSuccess]);

  const metrics = useMemo(() => {
    return [
      { label: '游戏次数', value: String(aggregates.totalGames) },
      { label: '获胜次数', value: String(aggregates.totalSuccess) },
      { label: '完美胜利', value: String(aggregates.perfectSuccess) },
      { label: '胜率', value: `${winRate}%` },
      { label: '平均提示', value: String(aggregates.avgHintCount) },
      { label: '平均尝试', value: String(aggregates.avgAttempts) },
      { label: '平均用时', value: formatSeconds(aggregates.avgTimeSec) },
      { label: '平均进度', value: `${aggregates.avgProgress}%` }
    ];
  }, [aggregates, winRate]);

  const drawerClasses = `${'fixed top-[var(--topbar-h)] left-0 right-0 z-[48] transform transition-transform duration-200'} ${isOpen ? 'translate-y-0' : '-translate-y-full pointer-events-none'}`;

  const keys: string[] = useMemo(() => ACTUAL_CATEGORIES.slice() as unknown as string[], []);
  /**
   * 聚合领域统计数据，计算各领域的胜利次数、平均用时、平均尝试、平均进度、平均提示以及总用时
   * @param timeList 每局用时列表（含领域）
   * @param attemptsList 每局尝试次数列表（含领域）
   * @param percentList 每局通关进度列表（含领域、提示次数、完美标记）
   * @returns 各领域聚合指标映射
   */
  const buildCategoryAgg = useCallback((records: GameRecord[]) => {
    const init = Object.fromEntries(keys.map((k) => [k, { victories: 0, avgTime: 0, avgAttempts: 0, avgProgress: 0, avgHints: 0, perfectRate: 0, totalTime: 0 }]));
    const grouped: Record<string, { victories: number; avgTime: number; avgAttempts: number; avgProgress: number; avgHints: number; perfectRate: number; totalTime: number }> = init as any;
    const byCat: Record<string, GameRecord[]> = Object.fromEntries(keys.map((k) => [k, []]));
    records.forEach(i => { const cat = (i.category || '') as string; if (keys.includes(cat)) byCat[cat].push(i); });
    keys.forEach((k) => {
      const list = byCat[k];
      const victories = list.length;
      const avgTime = list.length ? Math.round(list.reduce((s, i) => s + (i.timeSpentSec || 0), 0) / list.length) : 0;
      const totalTime = list.reduce((s, i) => s + (i.timeSpentSec || 0), 0);
      const avgAttempts = list.length ? Math.round(list.reduce((s, i) => s + (i.attempts || 0), 0) / list.length) : 0;
      const avgProgress = list.length ? Math.round(list.reduce((s, i) => s + (i.victoryProgress || 0), 0) / list.length) : 0;
      const hinted = list.filter(i => typeof i.hintCount === 'number');
      const avgHints = hinted.length ? Number((hinted.reduce((s, i) => s + (i.hintCount || 0), 0) / hinted.length).toFixed(2)) : 0;
      const perfectRate = list.length ? Math.round((list.filter(i => i.perfect === true).length / list.length) * 100) : 0;
      grouped[k] = { victories, avgTime, avgAttempts, avgProgress, avgHints, perfectRate, totalTime };
    });
    return grouped;
  }, [keys]);

  const [abilityChartData, setAbilityChartData] = useState<Record<string, number>>(Object.fromEntries(keys.map(k => [k, 0])));
  const [profileChartData, setProfileChartData] = useState<Record<string, number>>({ 速度: 0, 精度: 0, 独立: 0, 均衡: 0, 进度: 0 });

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const s = await initState();
        const records = (s.stats.records || []) as GameRecord[];
        const agg = buildCategoryAgg(records);
        const sumVictories = keys.reduce((acc, k) => acc + (agg[k]?.victories || 0), 0);
        const sumTime = keys.reduce((acc, k) => acc + (agg[k]?.totalTime || 0), 0);
        const τ = 240; const α = 20; const β = 4;
        const ability: Record<string, number> = {};
        keys.forEach((k) => {
          const a = agg[k];
          const hasTime = a.avgTime > 0;
          const hasAttempts = a.avgAttempts > 0;
          const hasProgress = a.avgProgress > 0;
          const hasHints = a.avgHints > 0;
          const hasPerf = a.perfectRate > 0;

          const S_time = hasTime ? 100 * Math.exp(-a.avgTime / τ) : undefined;
          const S_attempt = hasAttempts ? 100 * Math.exp(-a.avgAttempts / α) : undefined;
          const S_hint = hasHints ? 100 * Math.exp(-a.avgHints / β) : undefined;
          const S_prog = hasProgress ? a.avgProgress : undefined;
          const S_perf = hasPerf ? a.perfectRate : undefined;

          const weights: { key: string; w: number; v?: number }[] = [
            { key: 'prog', w: 0.25, v: S_prog },
            { key: 'time', w: 0.25, v: S_time },
            { key: 'attempt', w: 0.20, v: S_attempt },
            { key: 'hint', w: 0.15, v: S_hint },
            { key: 'perf', w: 0.15, v: S_perf },
          ];
          const available = weights.filter(i => typeof i.v === 'number');
          const wsum = available.reduce((s, i) => s + i.w, 0);
          const Ability = wsum > 0 ? available.reduce((s, i) => s + (i.v as number) * i.w, 0) / wsum : 0;
          ability[k] = Math.round(Math.max(0, Math.min(Ability, 100)));
        });
        setAbilityChartData(ability);
        const avgTimeSecLocal = records.length ? Math.round((records.reduce((sum, i) => sum + (i.timeSpentSec || 0), 0)) / records.length) : 0;
        const avgAttemptsLocal = records.length ? Math.round((records.reduce((sum, i) => sum + (i.attempts || 0), 0)) / records.length) : 0;
        const avgProgressLocal = records.length ? Math.round((records.reduce((sum, i) => sum + (i.victoryProgress || 0), 0)) / records.length) : 0;
        const hintedLocal = records.filter(i => typeof i.hintCount === 'number');
        const avgHintCountLocal = hintedLocal.length ? Number((hintedLocal.reduce((sum, i) => sum + (i.hintCount || 0), 0) / hintedLocal.length).toFixed(2)) : 0;
        const perfectSuccessLocal = records.filter(i => i.perfect === true).length;
        const totalSuccessLocal = records.length;
        const speed = avgTimeSecLocal > 0 ? Math.min(100, Math.max(0, 100 * Math.exp(-avgTimeSecLocal / τ))) : 0;
        const sumCorrect = records.reduce((sum, i) => sum + (i.hitCount || 0), 0);
        const sumWrong = records.reduce((sum, i) => sum + (i.wrongCount || 0), 0);
        const accuracy = (sumCorrect + sumWrong) > 0 ? Math.round(100 * (sumCorrect / (sumCorrect + sumWrong))) : 0;
        const hintDiscipline = records.length === 0 ? 0 : (avgHintCountLocal === 0
          ? 100
          : Math.min(100, Math.max(0, 100 * Math.exp(-avgHintCountLocal / β))));
        // 均衡度 = 领域丰富度（香农熵归一）与成绩均衡度（能力变异系数的反向）综合
        const victoryCounts = keys.map(k => (agg[k]?.victories || 0));
        const sumVictoriesLocal2 = victoryCounts.reduce((s, v) => s + v, 0);
        let richnessEntropy = 0;
        if (sumVictoriesLocal2 > 0 && keys.length > 0) {
          const p = victoryCounts.map(v => v / sumVictoriesLocal2).filter(pi => pi > 0);
          const H = -p.reduce((s, pi) => s + pi * Math.log(pi), 0);
          const Hnorm = Math.log(keys.length) > 0 ? (H / Math.log(keys.length)) : 0;
          richnessEntropy = 100 * Math.max(0, Math.min(Hnorm, 1));
        }
        const abilityValsForBalanced = keys.filter(k => (agg[k]?.victories || 0) > 0 && typeof ability[k] === 'number').map(k => ability[k]);
        let balanceAbility = 0;
        if (abilityValsForBalanced.length > 0) {
          const meanA = abilityValsForBalanced.reduce((s, v) => s + v, 0) / abilityValsForBalanced.length;
          if (meanA > 0) {
            const stdA = Math.sqrt(abilityValsForBalanced.reduce((s, v) => s + Math.pow(v - meanA, 2), 0) / abilityValsForBalanced.length);
            const cv = stdA / meanA; // 变异系数
            balanceAbility = 100 * (1 - Math.min(1, cv));
          }
        }
        const balance = Math.round(Math.max(0, Math.min(100, (richnessEntropy + balanceAbility) / 2)));
        const progressInv = 5 + 95 * (1 - (avgProgressLocal / 100));
        const progressScore = records.length === 0 ? 0 : Math.max(1, Math.min(99, Math.round(progressInv)));
        setProfileChartData({ 速度: Math.round(speed), 精度: accuracy, 独立: Math.round(hintDiscipline), 均衡: balance, 进度: progressScore });
      } catch {}
    })();
  }, [isOpen, buildCategoryAgg, keys]);

  /**
   * 雷达图组件
   * @param title 图表标题
   * @param data 各领域分值（0~100）映射
   * @returns SVG 雷达图，边缘主题色、内部主题色浅色填充
   */
  const RadarChart: React.FC<{ title: string; data: Record<string, number> }> = ({ title, data }) => {
    const size = 320; const center = size / 2; const radius = center - 32;
    const cats = Object.keys(data);
    const angleStep = (2 * Math.PI) / cats.length;
    const points = cats.map((k, idx) => {
      const value = Math.max(0, Math.min((data[k] || 0), 100));
      const r = (value / 100) * radius;
      const angle = -Math.PI / 2 + idx * angleStep;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    const [hovered, setHovered] = useState(false);
    return (
      <div className="w-full">
        <div className="text-[var(--color-text-secondary)] mb-2 text-center">{title}</div>
        <div className="rounded flex justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={1} />
            {[0.2,0.4,0.6,0.8].map((f,i) => (
              <circle key={i} cx={center} cy={center} r={radius*f} fill="none" stroke="var(--color-border)" strokeWidth={0.5} opacity={0.5} />
            ))}
            {cats.map((k, idx) => {
              const angle = -Math.PI / 2 + idx * angleStep;
              const x = center + radius * Math.cos(angle);
              const y = center + radius * Math.sin(angle);
              const lx = center + (radius + 16) * Math.cos(angle);
              const ly = center + (radius + 16) * Math.sin(angle);
              return (
                <g key={k}>
                  <line x1={center} y1={center} x2={x} y2={y} stroke="var(--color-border)" strokeWidth={0.5} />
                  <text x={lx} y={ly} fill="var(--color-text)" fontSize="14" textAnchor="middle" alignmentBaseline="middle">{(CATEGORIES as Record<string, string>)[k] ?? k}</text>
                </g>
              );
            })}
            <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ transition: 'transform 160ms ease', transform: hovered ? 'scale(1.03)' : 'scale(1)', transformOrigin: '50% 50%' }}>
              <polygon points={points} fill="var(--color-primary)" fillOpacity={0.18} stroke="var(--color-primary)" strokeWidth={2} />
              {hovered && cats.map((k, idx) => {
                const value = Math.max(0, Math.min((data[k] || 0), 100));
                const r = (value / 100) * radius;
                const angle = -Math.PI / 2 + idx * angleStep;
                const labelR = Math.min(radius - 20, r + 13);
                const vx = center + labelR * Math.cos(angle);
                const vy = center + labelR * Math.sin(angle);
                return (
                  <text key={`val-${k}`} x={vx} y={vy} fill="var(--color-text)" fontSize="16" textAnchor="middle" alignmentBaseline="middle">{value}</text>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    );
  };
  /**
   * 处理遮罩点击
   * 若点击的是遮罩（非抽屉内容），则关闭计分板抽屉
   *
   * @returns void
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    onClose();
  };

  /**
   * 阻止内容区域事件冒泡，避免误关闭
   *
   * @param e React.MouseEvent<HTMLDivElement>
   * @returns void
   */
  const stopPropagation = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[45] bg-transparent"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <div
        className={drawerClasses}
        role="dialog"
        aria-modal={isOpen}
        aria-label="计分板面板"
        onClick={stopPropagation}
      >
        <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)] max-h-[calc(100vh-var(--topbar-h)-var(--bottombar-h))] overflow-y-auto no-scrollbar">
          <div className="max-w-3xl mx-auto p-4 section rounded-none min-h-[calc(15vh)]">
            <div className="mb-4 mx-auto max-w-2xl justify-center flex"><ScoreBoardIcon /></div>
            <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {metrics.map((m, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center py-2 rounded">
                  <div className="text-3xl font-semi leading-6 text-[var(--color-text)]">{m.value}</div>
                  <div className="mt-1 text-[var(--color-text-muted)]">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4">  { /*  bg-[var(--color-surface-2)] */}
  <div className="grid grid-cols-1 md:grid-cols-2">
    <RadarChart title="领域能力" data={abilityChartData} />
    <RadarChart title="玩家五维" data={profileChartData} />
  </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              className="hover:text-[var(--color-primary)] focus:outline-none p-2"
              onClick={onClose}
              aria-label="关闭计分板"
              title="关闭计分板"
            >
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 10l10 10l-1.4 1.4l-8.6-8.6l-8.6 8.6L6 20z" fill="currentColor"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScoreboardDrawer;
