import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import Pinyin from 'tiny-pinyin';

export interface CorrectPanelProps {
  /** 已猜对的字符集合 */
  guessedChars: Set<string>;
}

/**
 * 已猜对字符面板
 * 展示玩家已猜对的所有字符，采用浅绿色背景、深绿色边框与文字。
 * 仅显示非空白字符，按字符原序列进行去重展示。
 */
export const CorrectPanel: React.FC<CorrectPanelProps> = ({ guessedChars }) => {
  /**
   * 计算已猜对字符列表（去除空白字符）
   * @returns 已猜对的非空白字符数组
   */
  const correctList = useMemo<string[]>(() => {
    return Array.from(guessedChars).filter((ch: string) => ch.trim().length > 0);
  }, [guessedChars]);

  /**
   * 计算分组标签（A-Z 或 #），与坟场区域保持一致。
   * 英文按首字母分组；中文按拼音首字母分组；数字与符号归入“#”。
   * @param char - 单字符
   * @returns 分组标签
   */
  const getGroupKey = (char: string): string => {
    if (/^[a-zA-Z]$/.test(char)) return char.toUpperCase();
    if (/^[\u4e00-\u9fa5]$/.test(char)) {
      try {
        const py = Pinyin && Pinyin.isSupported() ? Pinyin.convertToPinyin(char) : '';
        const initial = py.charAt(0).toUpperCase();
        return /^[A-Z]$/.test(initial) ? initial : '#';
      } catch {
        return '#';
      }
    }
    return '#';
  };

  /**
   * 根据分组标签组织字符，并进行组内排序。
   * 中文按拼音排序；其他按不区分大小写的字符排序。
   */
  const groupedMap = useMemo<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>();
    correctList.forEach((char: string) => {
      const key = getGroupKey(char);
      const list = map.get(key) || [];
      list.push(char);
      map.set(key, list);
    });

    map.forEach((list) => {
      list.sort((a, b) => {
        const isZhA = /^[\u4e00-\u9fa5]$/.test(a);
        const isZhB = /^[\u4e00-\u9fa5]$/.test(b);
        const sa = isZhA && Pinyin.isSupported() ? Pinyin.convertToPinyin(a) : a.toUpperCase();
        const sb = isZhB && Pinyin.isSupported() ? Pinyin.convertToPinyin(b) : b.toUpperCase();
        return sa.localeCompare(sb);
      });
    });

    return map;
  }, [correctList]);

  /**
   * 将分组映射渲染为“流式布局”序列：分组标签 Chip + 该分组的所有字块。
   * 行内顺排，容器自动换行；保持按首字母分隔但不强制每组另起一行。
   * @param map - 分组后的字符映射
   * @param withLabels - 是否显示首字母标签（通过 CSS 可见性控制，始终保留占位）
   * @returns React 节点数组（标签与字块连续排布）
   */
  const renderGroupedStream = (map: Map<string, string[]>, withLabels: boolean): React.ReactNode[] => {
    const order = [
      ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
      '#',
    ];
    const nodes: React.ReactNode[] = [];
    // 末项高亮：根据 guessedChars 的增量识别最新加入的正确字符
    const lastCorrectChar = lastAddedCorrect;
    order.forEach((groupKey) => {
      const items = map.get(groupKey) || [];
      if (items.length === 0) return;
      if (withLabels) {
        nodes.push(
          <span className="graveyard-group-chip" key={`chip-cp-${groupKey}`} aria-label={`组 ${groupKey}`}>
            {groupKey}
          </span>
        );
      }
      items.forEach((char, index) => {
        const isLast = lastCorrectChar !== null && char === lastCorrectChar;
        nodes.push(
          <span
            key={`cp-${groupKey}-${char}-${index}`}
            className={`correct-char${isLast ? ' last-added' : ''}`}
          >
            {char}
          </span>
        );
      });
    });
    return nodes;
  };

  /**
   * 标签显示切换状态：控制是否显示分组首字母标签，默认不显示。
   */
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const toggleLabels = useCallback((): void => {
    setShowLabels((prev) => !prev);
  }, []);

  /**
   * 追踪已猜对字符集合的增量，识别最新加入的字符以进行末项高亮。
   */
  const prevGuessedRef = useRef<Set<string>>(new Set());
  const [lastAddedCorrect, setLastAddedCorrect] = useState<string | null>(null);
  useEffect(() => {
    const prev = prevGuessedRef.current;
    // 如果集合变大，找出新增字符；如果变小（例如重置），清除高亮
    if (guessedChars.size > prev.size) {
      for (const ch of guessedChars) {
        if (!prev.has(ch)) {
          setLastAddedCorrect(ch);
          break;
        }
      }
    } else if (guessedChars.size < prev.size) {
      setLastAddedCorrect(null);
    }
    prevGuessedRef.current = new Set(guessedChars);
  }, [guessedChars]);

  /**
   * 空态渲染（与坟场区域保持一致的卡片样式）
   * 当没有已猜对字符时，显示居中图标、标题与提示文案，均使用 muted 文本颜色。
   * 目的：统一两区域的初始视觉与信息层级，避免样式不一致。
   */
  if (correctList.length === 0) {
    return (
      <div className="card-flat p-4 text-center sm:mb-0 mx-4">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-semi text-[var(--color-text-muted)] mb-2">集博</h3>
        <p className="text-[var(--color-text-muted)] text-sm">还没有猜对的字符</p>
      </div>
    );
  }

  return (
    <div className="card-flat p-4 sm:mb-0 mx-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg section-title">集博</h3>
        </div>
        <button
          type="button"
          onClick={toggleLabels}
          aria-pressed={showLabels}
          title={showLabels ? '隐藏首字母标签' : '显示首字母标签'}
          className="graveyard-icon-btn"
        >
          <span className="icon-letter">A</span>
        </button>
      </div>

      <div className="mt-4">
        <div className={`graveyard-stream ${showLabels ? 'labels-visible' : ''}`}>
          {renderGroupedStream(groupedMap, showLabels)}
        </div>
      </div>
    </div>
  );
};

export default CorrectPanel;