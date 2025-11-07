import React, { useState, memo } from 'react';
import { Info, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface TopBarProps {
  /**
   * 顶部栏标题文案
   */
  title?: string;
  /**
   * 游戏进度（0-100），当提供该值时在顶部栏底部显示满屏宽进度条
   */
  progress?: number;
}

/**
 * 顶部栏组件（吸顶）
 * - 左侧：信息按钮，点击弹出游戏规则弹窗
 * - 中间：标题居中显示
 * - 右侧：主题切换按钮（明暗主题）
 */
export const TopBar: React.FC<TopBarProps> = memo(({ title = '词条猜测游戏', progress }) => {
  const { isDark, toggleTheme } = useTheme();
  const [showRules, setShowRules] = useState<boolean>(false);

  /**
   * 打开规则弹窗
   */
  const openRules = (): void => {
    setShowRules(true);
  };

  /**
   * 关闭规则弹窗
   */
  const closeRules = (): void => {
    setShowRules(false);
  };

  // 当有进度时，移除常规底部边框，由进度条承载视觉分隔
  const headerClass = `sticky top-0 z-50 bg-[var(--color-surface)] ${progress !== undefined ? '' : 'border-b border-[var(--color-border)]'}`;

  return (
    <header className={headerClass}>
      <div className="container mx-auto max-w-6xl px-4 h-14 grid grid-cols-3 items-center">
        {/* 左侧信息按钮 */}
        <div className="justify-self-start">
          <button
            onClick={openRules}
            className="inline-flex items-center p-2 text-[var(--color-text)] hover:text-[var(--color-primary)] focus:outline-none"
            aria-label="信息"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* 中间居中标题 */}
        <div className="justify-self-center">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </div>

        {/* 右侧主题切换 */}
        <div className="justify-self-end">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center p-2 text-[var(--color-text)] hover:text-[var(--color-primary)] focus:outline-none"
            aria-label="切换主题"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 顶部栏底部满屏宽进度条 */}
      {typeof progress === 'number' && (
        <div className="w-full h-1 bg-gray-200">
          <div
            className="progress-fill h-1"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          ></div>
        </div>
      )}

      {/* 游戏规则弹窗 */}
      {showRules && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={closeRules}>
          <div className="card-flat section max-w-lg w-full bg-[var(--color-surface)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">游戏规则</h2>
              <button className="btn-flat" onClick={closeRules}>关闭</button>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>1、选择一个你感兴趣的领域，系统将随机生成一个词条</p>
              <p>2、输入单个汉字进行猜测，正确的字符会显示出来</p>
              <p>3、猜错的字符会被添加到“坟场”区域</p>
              <p>4、完全揭示词条内容即可获胜！</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

// 添加显示名称用于调试
TopBar.displayName = 'TopBar';

export default TopBar;