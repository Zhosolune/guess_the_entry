import React, { useState, useCallback, useMemo, memo } from 'react';
import { EntryData, GameStatus } from '../../types/game.types';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useDeviceProfile } from '../../hooks/useDeviceProfile';
import { toast } from 'sonner';
import { GameInfoBar } from '../GameInfoBar/GameInfoBar';
import { SearchInput } from '../SearchInput/SearchInput';
import { TextDisplayArea } from '../TextDisplayArea/TextDisplayArea';
import { BottomToolbar } from '../BottomToolbar/BottomToolbar';
import { MobileLayout } from './MobileLayout';
import { DesktopLayout } from './DesktopLayout';

interface GameLayoutProps {
  entryData: EntryData;
  guessedChars: Set<string>;
  revealedChars: Set<string>;
  graveyard: string[];
  attempts: number;
  onGuess: (char: string) => void;
  isLoading: boolean;
  error: string | null;
  gameTime: number;
  gameStatus: GameStatus;
  /** 是否开启提示按钮 */
  hintsEnabled: boolean;
  onRestart?: () => void;
  onToggleQuickRef?: () => void;
  /** 速查表是否打开（用于固定按钮主题色） */
  quickRefOpen?: boolean;
  onHintSelect?: (char: string) => void;
}

/**
 * 游戏布局组件
 * 整合所有游戏界面组件，实现固定布局结构
 * 顶部栏吸顶，底部工具栏吸底，文本区域可滚动
 */
export const GameLayout: React.FC<GameLayoutProps> = memo(({ 
  entryData,
  guessedChars,
  revealedChars,
  graveyard,
  attempts,
  onGuess,
  onHintSelect,
  isLoading,
  error,
  gameTime,
  gameStatus,
  hintsEnabled,
  onRestart,
  onToggleQuickRef,
  quickRefOpen = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [newlyRevealed, setNewlyRevealed] = useState<string[]>([]);
  // 记录已触发过揭示动画的字符，避免重复动画
  const [animatedChars, setAnimatedChars] = useState<Set<string>>(new Set());
  const [hintActive, setHintActive] = useState<boolean>(false);
  const [hintSelectMode, setHintSelectMode] = useState<boolean>(false);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(false);

  // 格式化时间显示
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [gameTime]);

  /**
   * 计算游戏进度（不统计标点符号）
   * 基于"位置"统计：仅对非标点字符计算总数与揭示数。
   * 重复汉字在 revealed 集合中被揭示一次后，其所有出现位置视为揭示。
   */
  const gameProgress = useMemo(() => {
    const isPunctuation = (char: string): boolean => /[\p{P}\p{S}]/u.test(char);
    
    const { entry, encyclopedia } = entryData;
    const entryChars = entry.split('');
    const encyChars = encyclopedia.split('');

    const totalPositions = entryChars.filter(c => !isPunctuation(c)).length + encyChars.filter(c => !isPunctuation(c)).length;
    const revealedPositions = entryChars.filter(c => !isPunctuation(c) && revealedChars.has(c)).length
      + encyChars.filter(c => !isPunctuation(c) && revealedChars.has(c)).length;

    return totalPositions > 0 ? Math.round((revealedPositions / totalPositions) * 100) : 0;
  }, [entryData, revealedChars]);

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
    if (!/^[\u4e00-\u9fa5]$/.test(char)) {
      toast.info('请输入中文字符');
      setInputValue('');
      return;
    }

    // 检查是否已经猜过
    if (guessedChars.has(char) || graveyard.includes(char)) {
      toast.info(`已经猜过"${char}"了`);
      setInputValue('');
      return;
    }

    // 执行猜测
    onGuess(char);
    setInputValue('');
  }, [isLoading, guessedChars, graveyard, onGuess]);

  /**
   * 处理输入框值变化
   */
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback(() => {
    handleKeyboardInput(inputValue);
  }, [inputValue, handleKeyboardInput]);

  // 使用键盘Hook
  useKeyboard(handleKeyboardInput);

  React.useEffect(() => {
    if (gameStatus !== 'victory') {
      setOverlayVisible(false);
    }
  }, [gameStatus]);

  /**
   * 处理提示按钮点击
   */
  const handleHintClick = useCallback((): void => {
    if (gameStatus !== 'playing') return;
    setHintActive(prev => {
      const next = !prev;
      setHintSelectMode(next);
      if (next) {
        toast.info('提示已开启：点击未揭示字符进行揭示');
      } else {
        toast.info('提示已关闭');
      }
      return next;
    });
  }, [gameStatus]);

  const handleHintSelect = useCallback((char: string) => {
    setHintActive(false);
    setHintSelectMode(false);
    if (typeof onHintSelect === 'function') {
      onHintSelect(char);
    }
  }, [onHintSelect]);

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

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
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
      </div>
    );
  }

  const { isMobile } = useDeviceProfile();
  const Container = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Container>
      {/* 游戏信息栏 */}
      <GameInfoBar 
        formattedTime={formattedTime}
        attempts={attempts}
        gameProgress={gameProgress}
      />

      {/* 胜利状态：在原搜索栏区域显示操作按钮 */}
      {gameStatus === 'victory' && (
        <div className="fixed left-0 right-0 top-[var(--topbar-h)] z-40 bg-[var(--color-surface)] h-[calc(var(--searchbar-h)+var(--infobar-h))]">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              <div className="text-emerald-600 text-lg font-semibold py-1">恭喜通关！</div>
              <div className="text-xs text-[var(--color-text-muted)]">可以选择查看词条内容或再来一局</div>
              <div className="mt-2 flex justify-center gap-3">
                <button
                  type="button"
                  className="btn-secondary btn-compact-mobile"
                  onClick={() => setOverlayVisible(v => !v)}
                >
                  {overlayVisible ? '隐藏遮罩' : '显示遮罩'}
                </button>
                <button
                  type="button"
                  className="btn-secondary-success btn-compact-mobile"
                  onClick={() => onRestart && onRestart()}
                >
                  再来一局
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 搜索输入框 */}
      {gameStatus !== 'victory' && (
        <SearchInput
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
          showSubmitButton={true}
        />
      )}

      {/* 文本显示区域 */}
      <TextDisplayArea
        entryData={entryData}
        revealedChars={revealedChars}
        newlyRevealed={newlyRevealed}
        autoReveal={overlayVisible}
        isMobileLayout={isMobile}
        gameStatus={gameStatus}
        hintSelectMode={hintSelectMode}
        onHintSelect={handleHintSelect}
      />

      {/* 底部工具栏 */}
      <BottomToolbar
        onHintClick={handleHintClick}
        onToggleQuickRef={onToggleQuickRef}
        disabled={isLoading}
        hintsEnabled={hintsEnabled}
        fixed={isMobile}
        quickRefOpen={quickRefOpen}
        hintActive={hintActive}
      />
      
    </Container>
  );
});

// 添加显示名称用于调试
GameLayout.displayName = 'GameLayout';