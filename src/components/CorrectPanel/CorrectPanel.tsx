import React, { useMemo } from 'react';
import { CheckCircle } from 'lucide-react';

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
  const correctList = useMemo(() => {
    return Array.from(guessedChars).filter(ch => ch.trim().length > 0);
  }, [guessedChars]);

  return (
    <div className="card-flat section mx-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg section-title">已猜对字符</h3>
      </div>
      {correctList.length === 0 ? (
        <p className="text-sm text-emerald-600">暂无已猜对字符</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {correctList.map((ch, idx) => (
            <span key={`${ch}-${idx}`} className="correct-char" title={ch}>
              {ch}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CorrectPanel;