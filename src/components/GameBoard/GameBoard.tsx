import React, { useState, useCallback, useMemo, memo } from 'react';
import { EntryData, GameStatus } from '../../types/game.types';
import { useKeyboard } from '../../hooks/useKeyboard';
import { toast } from 'sonner';

interface GameBoardProps {
  entryData: EntryData;
  guessedChars: Set<string>;
  revealedChars: Set<string>;
  attempts: number;
  onGuess: (char: string) => void;
  isLoading: boolean;
  error: string | null;
  gameTime: number;
  /** 游戏状态：用于触发胜利动画与自动揭示 */
  gameStatus: GameStatus;
  /**
   * 再来一局回调
   * 在胜利后替代输入框显示，点击后返回初始界面
   */
  onRestart?: () => void;
}

/**
 * 游戏主界面组件
 * 显示被遮盖的词条和百科内容，处理玩家输入和猜测
 * 使用React.memo优化渲染性能
 */
export const GameBoard: React.FC<GameBoardProps> = memo(({ 
  entryData,
  guessedChars,
  revealedChars,
  attempts,
  onGuess,
  isLoading,
  error,
  gameTime,
  gameStatus,
  onRestart
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showVictory, setShowVictory] = useState(false);
  const [autoReveal, setAutoReveal] = useState(false);
  const [newlyRevealed, setNewlyRevealed] = useState<string[]>([]);
  // 记录已触发过揭示动画的字符，避免重复动画
  const [animatedChars, setAnimatedChars] = useState<Set<string>>(new Set());

  // 使用useMemo缓存计算结果
  const progress = useMemo(() => {
    const totalChars = entryData.entry.length + entryData.encyclopedia.length;
    const revealedCount = revealedChars.size;
    return totalChars > 0 ? Math.round((revealedCount / totalChars) * 100) : 0;
  }, [entryData, revealedChars]);

  const guessedCharsSet = useMemo(() => guessedChars, [guessedChars]);

  /**
   * 判断是否为标点符号（中英文）
   * 用于在渲染时不进行遮罩，并占用一个统一的字符块。
   * 
   * @param char - 需要判断的单个字符
   * @returns 是否为标点符号
   */
  const isPunctuation = useCallback((char: string): boolean => {
    const regex = /[，。！？、；：“”‘’（）《》〈〉【】—…·.,;:!?'"(){}\[\]<>\-]/;
    return regex.test(char);
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

  // 格式化时间显示
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [gameTime]);

  /**
   * 处理键盘输入
   * 接受一个已提交的单字符（汉字或英文字母），
   * 在通过校验后触发猜测并清空输入框。
   *
   * @param char - 单个字符输入
   */
  const handleKeyboardInput = useCallback((char: string) => {
    if (isLoading || !char) return;
    
    // 验证输入
    if (!/^[一-龥a-zA-Z]$/.test(char)) {
      toast.error('请输入单个汉字或英文字母');
      return;
    }

    // 检查是否已经猜过
    if (guessedCharsSet.has(char)) {
      toast.info(`已经猜过"${char}"了`);
      return;
    }

    // 执行猜测
    onGuess(char);
    setInputValue('');
  }, [isLoading, guessedCharsSet, onGuess]);

  /**
   * 处理输入框变化
   * 允许完整输入法拼音组合过程，不限制长度；
   * 仅在提交时进行单字符校验。
   *
   * @param e - 输入事件
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  }, []);

  /**
   * 处理表单提交
   * 在提交时进行单字符校验，避免打字过程被打断。
   *
   * @param e - 表单提交事件
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleKeyboardInput(inputValue);
  }, [inputValue, handleKeyboardInput]);

  // 使用键盘Hook
  useKeyboard(handleKeyboardInput);

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

      return (
        <span
          key={item.key}
          className={`${base} masked-char`}
          aria-hidden={true}
        />
      );
    });
  }, [newlyRevealed, autoReveal]);

  /**
   * 监听新揭示的字符，仅在首次揭示时触发动画
   * 通过对比 revealedChars 与 animatedChars，找出需要动画的字符。
   */
  React.useEffect(() => {
    const toAnimate = Array.from(revealedChars).filter(c => !animatedChars.has(c));
    if (toAnimate.length > 0) {
      setNewlyRevealed(toAnimate);
      setTimeout(() => {
        setNewlyRevealed([]);
        setAnimatedChars(prev => {
          const next = new Set(prev);
          toAnimate.forEach(c => next.add(c));
          return next;
        });
      }, 1000);
    }
  }, [revealedChars, animatedChars]);

  /**
   * 监听胜利状态以播放成功动画并自动揭示剩余字符
   * 胜利后播放 1.5s 成功动画，然后将未猜出的字符以灰色边框样式显示。
   */
  React.useEffect(() => {
    if (gameStatus === 'victory') {
      if (!showVictory) {
        setShowVictory(true);
      }
      // 取消动画：不展示成功横幅，不做延迟，立即自动揭示剩余字符
      setAutoReveal(true);
    } else {
      setAutoReveal(false);
      setShowVictory(false);
    }
  }, [gameStatus, showVictory, formattedTime, attempts]);

  if (error) {
    return (
      <div className="card-flat section text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">游戏出错</h3>
        <p className="text-[var(--color-text-muted)] mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-flat"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="px-4">
      {/* 输入区域 / 胜利庆祝与再来一局 */}
      {gameStatus !== 'victory' ? (
        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="来猜~"
              className="form-input flex-1"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue}
              className="btn-primary"
            >
              确认
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 mb-4 card-flat section p-4 text-center">
          <div className="text-2xl">恭喜通关！</div>
          <div className="text-[var(--color-text-muted)]">用时 {formattedTime}，尝试 {attempts} 次</div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onRestart && onRestart()}
          >
            再来一局
          </button>
        </div>
      )}
      <div className="card-flat section p-4">
        <div className="justify-center">
          {/* 词条标题 */}
          <div className="w-full text-2xl leading-relaxed rounded-lg break-all justify-center flex flex-wrap gap-1 mb-4">
          {renderMaskedContent(entryContent)}
        </div>

        {/* 百科内容 */}
        <div className="w-full text-base leading-relaxed rounded-lg break-all flex flex-wrap gap-1">
          {renderMaskedContent(encyclopediaContent)}
        </div>
        </div>
        
      </div>
    </div>
  );
});

// 添加显示名称用于调试
GameBoard.displayName = 'GameBoard';