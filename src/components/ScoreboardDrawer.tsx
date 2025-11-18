import React, { useEffect, useMemo, useState } from 'react';
import { initState } from '../utils/stateManager';
import { CATEGORIES } from '../constants/game.constants';
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
  interface StatsItem { gameId: string; timeSpent?: number; attempts?: number; percent?: number; hintCount?: number; perfect?: boolean }
  interface Aggregates { totalGames: number; totalSuccess: number; perfectSuccess: number; avgTimeSec: number; avgAttempts: number; avgProgress: number; avgHintCount: number }

  const [aggregates, setAggregates] = useState<Aggregates>({ totalGames: 0, totalSuccess: 0, perfectSuccess: 0, avgTimeSec: 0, avgAttempts: 0, avgProgress: 0, avgHintCount: 0 });

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const s = await initState();
        const totalGames = s.stats.totalGames || 0;
        const totalSuccess = s.stats.totalSuccess || 0;
        const timeList = (s.stats.gameTime || []) as StatsItem[];
        const attemptsList = (s.stats.attempts || []) as StatsItem[];
        const percentList = (s.stats.completionPercent || []) as StatsItem[];
        const perfectSuccess = percentList.filter(i => i.perfect === true).length;
        const avgTimeSec = timeList.length ? Math.round((timeList.reduce((sum, i) => sum + (i.timeSpent || 0), 0)) / timeList.length) : 0;
        const completedGameIds = new Set(percentList.map(i => i.gameId));
        const attemptsOnCompleted = attemptsList.filter(i => completedGameIds.has(i.gameId));
        const avgAttempts = attemptsOnCompleted.length ? Math.round((attemptsOnCompleted.reduce((sum, i) => sum + (i.attempts || 0), 0)) / attemptsOnCompleted.length) : 0;
        const avgProgress = percentList.length ? Math.round((percentList.reduce((sum, i) => sum + (i.percent || 0), 0)) / percentList.length) : 0;
        const hinted = percentList.filter(i => typeof i.hintCount === 'number' && (i.hintCount as number) > 0);
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

  const computeCategoryScores = (): Record<string, number> => {
    const scores: Record<string, number> = {};
    Object.keys(CATEGORIES).forEach((k) => { scores[k] = 0; });
    return scores;
  };
  const categoryScores = computeCategoryScores();
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
        aria-label="设置面板"
        onClick={stopPropagation}
      >
        <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)] max-h-[calc(100vh-var(--topbar-h)-var(--bottombar-h))] overflow-y-auto no-scrollbar">
          <div className="max-w-2xl mx-auto p-4 section rounded-none min-h-[calc(15vh)]">
            <div className="mb-4 justify-center flex"><ScoreBoardIcon /></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {metrics.map((m, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center py-2 rounded">
                  <div className="text-3xl font-semi leading-6 text-[var(--color-text)]">{m.value}</div>
                  <div className="mt-1 text-[var(--color-text-muted)]">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="w-full p-4 mt-4 bg-[var(--color-surface-2)]">
              <div className="text-[var(--color-text-secondary)] mb-2">不同领域能力评分</div>
              <div className="rounded p-3">
                <div className="space-y-2">
                  {Object.entries(CATEGORIES).map(([key, label]) => {
                    const val = Math.max(0, Math.min(categoryScores[key] ?? 0, 100));
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-16 text-xs text-[var(--color-text-secondary)] truncate">{label}</div>
                        <div className="relative flex-1 h-4 rounded bg-[var(--color-surface)] overflow-hidden">
                          <div className="relative h-full bg-[var(--color-primary)] opacity-70" style={{ width: `${val}%` }} />
                        </div>
                        <div className="w-10 text-xs text-[var(--color-text-secondary)] text-right">{val}%</div>
                      </div>
                    );
                  })}
                </div>
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