import React from 'react';
import { Graveyard } from './Graveyard/Graveyard';
import CorrectPanel from './CorrectPanel/CorrectPanel';

export interface QuickRefDrawerProps {
  /** 是否显示抽屉 */
  isOpen: boolean;
  /** 关闭抽屉回调 */
  onClose: () => void;
  /** 坟场数据（错误字符列表） */
  graveyard: string[];
  /** 已猜对字符集合 */
  guessedChars: Set<string>;
  /** 抽屉位置：bottom/left/right，默认 bottom */
  position?: 'bottom' | 'left' | 'right';
}

/**
 * 速查表抽屉组件
 * 
 * 功能描述：
 * - 以抽屉形式显示“坟场”与“已猜对字符”两块内容；默认隐藏，通过按钮或关闭图标切换。
 * 
 * 参数说明：
 * - isOpen: 是否显示抽屉。
 * - onClose: 关闭抽屉的回调函数。
 * - graveyard: 传入坟场的错误字符数组。
 * - guessedChars: 传入已猜对字符的集合。
 * 
 * 返回值说明：
 * - React 元素，用于呈现底部抽屉；当未打开时仍渲染但通过 transform 隐藏。
 * 
 * 异常说明：
 * - 本组件不抛出异常；交互错误通过控制台输出或父组件处理。
 */
export const QuickRefDrawer: React.FC<QuickRefDrawerProps> = ({ isOpen, onClose, graveyard, guessedChars, position = 'bottom' }) => {
  /**
   * 记录上一次的位置，用于判断是否需要禁用过渡动画
   */
  const prevPositionRef = React.useRef<'bottom' | 'left' | 'right'>(position);
  /**
   * 当位置变更时，更新引用值
   */
  React.useEffect(() => {
    prevPositionRef.current = position;
  }, [position]);

  /**
   * 关闭按钮点击处理
   * 
   * 功能描述：
   * - 在触发关闭前主动移除当前按钮焦点，避免后续容器设置 `aria-hidden` 时其后代仍保留焦点引发可访问性告警。
   * 
   * 参数说明：
   * - e: 鼠标点击事件对象，类型为 React.MouseEvent<HTMLButtonElement>。
   * 
   * 返回值说明：
   * - 无返回值（void）。
   * 
   * 异常说明：
   * - 本函数不抛出异常；如出现异常将被忽略，不影响 `onClose` 的执行。
   */
  const handleCloseClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    try {
      // 先移除关闭按钮的焦点，避免 aria-hidden 与保留焦点冲突
      e.currentTarget.blur();
    } catch {
      // 忽略可能的运行时异常
    }
    onClose();
  };
  /**
   * 计算容器定位样式
   * 根据 position 切换抽屉的定位边与入场/退场动画方向
   *
   * @returns string Tailwind 类名
   */
  const containerClass = React.useMemo<string>(() => {
    // 仅在开/关时使用过渡动画；位置变更时禁用动画
    const samePosition = prevPositionRef.current === position;
    const transition = samePosition ? 'transition-transform duration-200' : '';
    if (position === 'left') {
      // 侧边抽屉需避让顶部栏高度，并额外留出 4px 间距
      return `fixed left-0 top-[calc(var(--topbar-h)+4px)] bottom-0 z-40 transform ${transition} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    }
    if (position === 'right') {
      // 侧边抽屉需避让顶部栏高度，并额外留出 4px 间距
      return `fixed right-0 top-[calc(var(--topbar-h)+4px)] bottom-0 z-40 transform ${transition} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;
    }
    // default bottom
    return `fixed bottom-0 inset-x-0 z-40 transform ${transition} ${isOpen ? 'translate-y-0' : 'translate-y-full'}`;
  }, [position, isOpen]);

  /**
   * 计算内部容器样式（尺寸与边距）
   * 底部抽屉需要预留底部工具栏高度；侧边抽屉需要设置宽度与满高
   *
   * @returns string Tailwind 类名
   */
  const innerClass = React.useMemo<string>(() => {
    if (position === 'left' || position === 'right') {
      // 侧边：仅在内侧添加边框（右侧加左边框；左侧加右边框）
      const sideBorder = position === 'right' ? 'border-l' : 'border-r';
      return `bg-[var(--color-surface)] ${sideBorder} border-[var(--color-border)] h-full w-[86vw] md:w-[420px]`;
    }
    return 'px-2 bg-[var(--color-surface)] border-t border-[var(--color-border)] mb-[var(--bottombar-h)] pb-2';
  }, [position]);

  /**
   * 计算滚动区域高度
   * 侧边抽屉使用满高，底部抽屉维持原有最大高度逻辑
   */
  const scrollClass = React.useMemo<string>(() => {
    if (position === 'left' || position === 'right') {
      return 'h-full overflow-y-auto py-2';
    }
    return 'max-h-[50vh] md:max-h-[50vh] overflow-y-auto';
  }, [position]);
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-hidden={!isOpen}
      className={containerClass}
    >
      {/* 样式说明：抽屉背景不透明以提升可读性 */}
      <div className={innerClass}>
        <div className="flex items-center justify-between py-2 mx-4">
          <div className="text-xl font-semi text-[var(--color-text)]">速查表</div>
          <button
            type="button"
            aria-label="关闭速查表"
            title="关闭"
            onClick={handleCloseClick}
            className="inline-flex items-center p-2 text-[var(--color-text)] hover:text-[var(--color-primary)] focus:outline-none"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区：滚动容器 */}
        <div className={scrollClass}>
          {position === 'left' || position === 'right' ? (
            // 左右侧：改为纵向排列，便于窄宽侧栏阅读
            <div className="flex flex-col gap-4">
              <Graveyard graveyard={graveyard} />
              <CorrectPanel guessedChars={guessedChars} />
            </div>
          ) : (
            // 底部：保持原横向并排布局
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Graveyard graveyard={graveyard} />
              <CorrectPanel guessedChars={guessedChars} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickRefDrawer;