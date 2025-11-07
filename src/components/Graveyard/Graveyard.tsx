import React, { useMemo, memo } from 'react';
import { Skull, Trash2 } from 'lucide-react';
import Pinyin from 'tiny-pinyin';

interface GraveyardProps {
  graveyard: string[];
  onClear?: () => void;
}

/**
 * 坟场区域组件
 * 显示所有被猜错的字符，提供清空功能
 * 使用React.memo优化渲染性能
 */
export const Graveyard: React.FC<GraveyardProps> = memo(({ graveyard, onClear }) => {
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

  if (graveyard.length === 0) {
    return (
      <div className="card-flat section text-center sm:mb-0 m-4">
        <div className="flex items-center justify-center mb-4">
          <Skull className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">坟场</h3>
        <p className="text-gray-500 text-sm">
          还没有猜错的字符
        </p>
      </div>
    );
  }

  return (
    <div className="card-flat section sm:mb-0 mx-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg section-title flex items-center">
          <Skull className="w-5 h-5 mr-2 text-red-500" />
          坟场
        </h3>
        {onClear && graveyard.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 transition-colors duration-200"
            title="清空坟场"
          >
            <Trash2 className="w-4 h-4" />
            <span>清空</span>
          </button>
        )}
      </div>

      {/* 按首字母/拼音分组显示（A-Z；数字与符号归 "#"） */}
      <div className="graveyard-scroll">
        {[
          ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
          '#',
        ].map((groupKey) => {
          const items = groupedMap.get(groupKey) || [];
          if (items.length === 0) return null;
          return (
            <div className="graveyard-group" key={`group-${groupKey}`}>
              <div className="graveyard-group-label">{groupKey}</div>
              <div className="graveyard-group-content">
                {items.map((char, index) => (
                  <span key={`${groupKey}-${char}-${index}`} className="graveyard-char" title={char}>
                    {char}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 提示信息 */}
      {uniqueChars.length > 10 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 提示：坟场字符较多，建议换个思路继续猜测！
          </p>
        </div>
      )}
    </div>
  );
});

// 添加显示名称用于调试
Graveyard.displayName = 'Graveyard';