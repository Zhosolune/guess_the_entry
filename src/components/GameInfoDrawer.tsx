import React from 'react';
import ScoreboardDrawer from './ScoreboardDrawer';

interface GameInfoDrawerProps {
  /**
   * 是否打开游戏信息抽屉
   */
  isOpen: boolean;
  /**
   * 关闭抽屉的回调
   */
  onClose: () => void;
}

/**
 * 游戏信息抽屉组件（从顶部栏下方向下展开）
 * - 顶部定位在 TopBar 下方，层级最高
 * - 支持点击遮罩区域关闭
 * - 抽屉底边水平居中放置关闭按钮（X）
 * - 内含游戏信息项：当前词条、游戏状态、游戏进度
 */
const GameInfoDrawer: React.FC<GameInfoDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  /**
   * 处理遮罩点击
   * 若点击的是遮罩（非抽屉内容），则关闭游戏信息抽屉
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
        aria-label="游戏信息面板"
        onClick={stopPropagation}
      >
        <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div className="max-w-2xl mx-auto px-3 section pb-0 bg-[var(--color-surface)] rounded-none min-h-[calc(15vh)]">

            <div className="text-xl font-semi text-[var(--color-text)] pb-3">游戏规则</div>
            <div className="space-y-2 text-[var(--color-text-muted)]">
                  <p>1、选择一个你感兴趣的领域，系统将随机生成一个词条</p>
                  <p>2、输入单个汉字进行猜测，正确的字符会显示出来</p>
                  <p>3、猜错的字符会被添加到“坟场”区域</p>
                  <p>4、完全揭示词条内容即可获胜！</p>
            </div>

          </div>
          {/* 底边居中关闭按钮 */}
          <div className="flex justify-center">
            <button
              type="button"
              className="hover:text-[var(--color-primary)] focus:outline-none p-2"
              onClick={onClose}
              aria-label="关闭游戏信息"
              title="关闭游戏信息"
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

export default GameInfoDrawer;
