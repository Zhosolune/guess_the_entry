import React from 'react';

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

      {/* 抽屉本体：位于 TopBar 下方，滑动进入 */}
      <div
        className={`fixed top-[var(--topbar-h)] left-0 right-0 z-[48] transform transition-transform duration-200 ${
          isOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
        role="dialog"
        aria-modal={isOpen}
        aria-label="设置面板"
        onClick={stopPropagation}
      >
        <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div className="max-w-2xl mx-auto px-3 section pb-0 bg-[var(--color-surface)] rounded-none min-h-[calc(15vh)]">

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-[var(--color-text-secondary)]">本局提示次数</div>
                <div className="text-base font-medium">{currentHintCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-[var(--color-text-secondary)]">是否完美胜利</div>
                <div className="text-base font-medium">{perfectVictory ? '是' : '否'}</div>
              </div>
            </div>

          </div>
          {/* 底边居中关闭按钮 */}
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