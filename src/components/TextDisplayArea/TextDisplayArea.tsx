import React, { memo, useCallback, useMemo, useLayoutEffect, useRef } from 'react';
import { EntryData, GameStatus } from '../../types/game.types';

interface TextDisplayAreaProps {
  /**
   * 词条数据
   */
  entryData: EntryData;
  /**
   * 已揭示的字符集合
   */
  revealedChars: Set<string>;
  /**
   * 新揭示的字符数组（用于动画）
   */
  newlyRevealed: string[];
  /**
   * 是否自动揭示剩余字符（胜利状态）
   */
  autoReveal: boolean;
  /**
   * 是否为移动端布局：移动端保持 fixed 填满剩余空间；桌面端采用自然流布局
   */
  isMobileLayout?: boolean;
  /**
   * 游戏状态
   */
  gameStatus: GameStatus;
}

/**
 * 文本显示区域组件
 * 显示被遮盖的词条和百科内容，保持原有的遮罩渲染逻辑
 * 内容区域可滚动，占满剩余高度
 */
export const TextDisplayArea: React.FC<TextDisplayAreaProps> = memo(({ 
  entryData,
  revealedChars,
  newlyRevealed,
  autoReveal,
  isMobileLayout = true,
  gameStatus,
}) => {
  /**
   * 判断是否为标点符号（中英文）
   * 用于在渲染时不进行遮罩，并占用一个统一的字符块。
   * 
   * @param char - 需要判断的单个字符
   * @returns 是否为标点符号
   */
  const isPunctuation = useCallback((char: string): boolean => {
    return /[\p{P}\p{S}]/u.test(char);
  }, []);

  // 格式化词条和百科内容
  const entryContent = useMemo(() => {
    return entryData.entry.split('').map((char, index) => {
      const isPunc = isPunctuation(char);
      return {
        char,
        revealed: isPunc || revealedChars.has(char),
        key: `entry-${index}`,
        isPunctuation: isPunc
      };
    });
  }, [entryData.entry, revealedChars, isPunctuation]);

  const encyclopediaContent = useMemo(() => {
    return entryData.encyclopedia.split('').map((char, index) => {
      const isPunc = isPunctuation(char);
      return {
        char,
        revealed: isPunc || revealedChars.has(char),
        key: `encyclopedia-${index}`,
        isPunctuation: isPunc
      };
    });
  }, [entryData.encyclopedia, revealedChars, isPunctuation]);

  /**
   * 渲染遮盖/揭示的内容为统一的字符块
   * - 非遮罩：已揭示字符，与遮罩块同尺寸，支持首次揭示动画
   * - 遮罩：显示方块字符，占位并保持统一尺寸
   * - 标点：永不遮罩，但仍占用一个统一字符块且不触发揭示动画
   * 
   * @param items - 需要渲染的字符项列表
   * @returns React节点数组
   */
  const renderMaskedContent = useCallback((items: Array<{char: string, revealed: boolean, key: string, isPunctuation?: boolean}>) => {
    return items.map((item) => {
      const isNewlyRevealed = newlyRevealed.includes(item.char);
      const base = 'char-block';

      // 标点：不遮罩，不动画
      if (item.isPunctuation) {
        return (
          <span key={item.key} className={`${base} revealed-char`}>
            {item.char}
          </span>
        );
      }

      if (item.revealed) {
        return (
          <span
            key={item.key}
            className={`${base} revealed-char ${isNewlyRevealed ? 'reveal-animation' : ''}`}
          >
            {item.char}
          </span>
        );
      }

      // 胜利后未猜出的字符以灰色边框自动揭示
      if (autoReveal) {
        return (
          <span key={item.key} className={`${base} auto-revealed-char`}>
            {item.char}
          </span>
        );
      }

      return <span key={item.key} className={`${base} masked-char`} aria-hidden={true} />;
    });
  }, [newlyRevealed, autoReveal]);

  // 百科内容容器引用，用于应用自适应左右内边距
  const encyclopediaContainerRef = useRef<HTMLDivElement | null>(null);

  /**
   * 计算并应用百科内容容器的自适应左右内边距，使单行能够容纳整数量的字符块（含间距）
   * 算法：取容器可用宽度、字符块宽度与容器 gap，选择最大可容纳的整数字块列数 k，
   * 将剩余空间平均分配到左右内边距。
   *
   * 参数：无（使用 encyclopediaContainerRef 当前 DOM 引用）
   * 返回：无（直接设置容器 style.paddingLeft/Right）
   * 异常：当无法测量（如无子元素 .char-block）时，不抛异常，回退为 0 内边距。
   */
  const applyAdaptivePadding = useCallback((): void => {
    const container = encyclopediaContainerRef.current;
    if (!container) return;

    // 可用宽度（含内容区，受 box-sizing 影响）。这里选用 clientWidth 更稳妥。
    const available = container.clientWidth;
    const style = getComputedStyle(container);
    const gapPx = parseFloat(style.gap || '0');

    const blockEl = container.querySelector<HTMLElement>('.char-block');
    const blockWidth = blockEl ? blockEl.getBoundingClientRect().width : 0;

    // 无法测量时，回退为 0 内边距
    if (available <= 0 || blockWidth <= 0) {
      container.style.paddingLeft = '0px';
      container.style.paddingRight = '0px';
      return;
    }

    // 计算最大可容纳的整数字块列数 k
    const k = Math.max(1, Math.floor((available + gapPx) / (blockWidth + gapPx)));
    const targetContentWidth = k * blockWidth + (k - 1) * gapPx;
    const padX = Math.max(0, Math.floor((available - targetContentWidth) / 2));

    container.style.paddingLeft = `${padX}px`;
    container.style.paddingRight = `${padX}px`;
  }, []);

  // 初始化与尺寸变化时自适应
  useLayoutEffect(() => {
    applyAdaptivePadding();

    const container = encyclopediaContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      applyAdaptivePadding();
    });
    ro.observe(container);

    const onResize = () => applyAdaptivePadding();
    window.addEventListener('resize', onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
    // 依赖于百科内容长度变化（揭示过程可能影响布局重排）
  }, [applyAdaptivePadding, encyclopediaContent.length]);

  const maxCardHeight = 'calc(100vh - var(--topbar-h) - var(--infobar-h) - var(--searchbar-h) - var(--bottombar-h) - 32px)';
  const maxCardContentHeight = 'calc(100vh - var(--topbar-h) - var(--infobar-h) - var(--searchbar-h) - var(--bottombar-h) - 56px)';
  const maxSuccessCardHeight = 'calc(100vh - var(--topbar-h) - var(--infobar-h) - var(--searchbar-h) - var(--bottombar-h) - 32px - var(--searchbar-offset))';
  const maxSuccessCardContentHeight = 'calc(100vh - var(--topbar-h) - var(--infobar-h) - var(--searchbar-h) - var(--bottombar-h) - 56px - var(--searchbar-offset))';
  const cardMax = gameStatus == 'victory' ? maxSuccessCardHeight : maxCardHeight;
  const contentMax = gameStatus == 'victory' ? maxSuccessCardContentHeight : maxCardContentHeight;

  if (isMobileLayout) {
    return (
      <div
        className="fixed left-0 right-0 z-10 overflow-hidden px-4 py-4"
        style={{
          // 使文本区域仅占据"顶部搜索栏"与"底部工具栏"之间的空间
          top: gameStatus == 'victory' ? 'calc(var(--topbar-h) + var(--infobar-h) + var(--searchbar-h) + var(--searchbar-offset))' :'calc(var(--topbar-h) + var(--infobar-h) + var(--searchbar-h))',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="container mx-auto max-w-4xl h-full">
          <div className="card-flat section p-2 pt-4 h-full" style={{ maxHeight: cardMax }}>
            <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pb-2" style={{ maxHeight: contentMax }}>
              {/* 词条标题 */}
              <div className="w-full text-2xl leading-relaxed rounded-lg break-all justify-center flex flex-wrap gap-1 flex-none">
                {renderMaskedContent(entryContent)}
              </div>

              {/* 百科内容（自适应左右内边距） */}
              <div ref={encyclopediaContainerRef} className="w-full text-base leading-relaxed rounded-lg break-all flex flex-wrap gap-1">
                {renderMaskedContent(encyclopediaContent)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 桌面端：采用自然流布局，放在搜索栏下方，底部工具栏跟随其后
  return (
    <div className="px-4 py-4" style={{ marginTop: 'calc(var(--topbar-h) + var(--infobar-h) + var(--searchbar-h))' }}>
      <div className="container mx-auto max-w-4xl">
        <div className="card-flat section p-2 pt-4">
          <div className="flex flex-col gap-4">
            {/* 词条标题 */}
            <div className="w-full text-2xl leading-relaxed rounded-lg break-all justify-center flex flex-wrap gap-1">
              {renderMaskedContent(entryContent)}
            </div>

            {/* 百科内容（自适应左右内边距） */}
            <div ref={encyclopediaContainerRef} className="w-full text-base leading-relaxed rounded-lg break-all flex flex-wrap gap-1">
              {renderMaskedContent(encyclopediaContent)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// 添加显示名称用于调试
TextDisplayArea.displayName = 'TextDisplayArea';