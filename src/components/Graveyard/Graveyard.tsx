import React, { useMemo, memo, useState, useCallback } from 'react';
import { Skull } from 'lucide-react';
import Pinyin from 'tiny-pinyin';
import { initState, setUIPanels } from '../../utils/stateManager';

interface GraveyardProps {
  graveyard: string[];
}

/**
 * 坟场区域组件
 * 显示所有被猜错的字符，提供清空功能
 * 使用React.memo优化渲染性能
 */
export const Graveyard: React.FC<GraveyardProps> = memo(({ graveyard }) => {
  // 使用useMemo缓存计算结果，避免重复计算
  const uniqueChars = useMemo(() => {
    return Array.from(new Set(graveyard));
  }, [graveyard]);

  const totalWrongGuesses = graveyard.length;

  /**
   * 计算分组标签（A-Z 或 #）。
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
  const groupedMap = useMemo(() => {
    const map = new Map<string, string[]>();
    uniqueChars.forEach((char) => {
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
  }, [uniqueChars]);

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
    // 末项高亮：取坟场数组的最后一个元素作为当前高亮目标
    const lastWrongChar = graveyard.length > 0 ? graveyard[graveyard.length - 1] : null;
    order.forEach((groupKey) => {
      const items = map.get(groupKey) || [];
      if (items.length === 0) return;
      if (withLabels) {
        nodes.push(
          <span className="graveyard-group-chip" key={`chip-${groupKey}`} aria-label={`组 ${groupKey}`}>
            {groupKey}
          </span>
        );
      }
      items.forEach((char, index) => {
        const isLast = lastWrongChar !== null && char === lastWrongChar;
        nodes.push(
          <span
            key={`${groupKey}-${char}-${index}`}
            className={`graveyard-char${isLast ? ' last-added' : ''}`}
          >
            {char}
          </span>
        );
      });
    });
    return nodes;
  };

  /**
   * 标签显示切换状态
   * 控制是否显示分组首字母标签，默认不显示。
   * 提供按钮交互以在显示/隐藏之间切换。
   * @returns 无返回值
   */
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const toggleLabels = useCallback((): void => {
    setShowLabels((prev) => {
      const next = !prev;
      setUIPanels({ graveyardShowLabels: next }).catch(() => {});
      return next;
    });
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const persisted = await initState();
        if (typeof persisted?.ui?.graveyardShowLabels === 'boolean') {
          setShowLabels(!!persisted.ui.graveyardShowLabels);
        }
      } catch {}
    })();
  }, []);

  if (graveyard.length === 0) {
    return (
      <div className="card-flat p-4 text-center sm:mb-0 mx-4">
        <div className="flex items-center justify-center mb-4">
          <Skull className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-semi text-[var(--color-text-muted)] mb-2">坟场</h3>
        <p className="text-[var(--color-text-muted)] text-sm">
          还没有猜错的字符
        </p>
      </div>
    );
  }

  return (
    <div className="card-flat p-4 sm:mb-0 mx-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg section-title flex items-center">
          <Skull className="w-5 h-5 mr-2 text-red-500" />
          坟场
        </h3>
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

      {/* 行内“分组标签 + 字块”流式布局（A-Z；数字与符号归 "#"） */}
      <div className="mt-4">
        <div className={`graveyard-stream ${showLabels ? 'labels-visible' : ''}`}>
          {renderGroupedStream(groupedMap, showLabels)}
        </div>
      </div>
    </div>
  );
});

// 添加显示名称用于调试
Graveyard.displayName = 'Graveyard';