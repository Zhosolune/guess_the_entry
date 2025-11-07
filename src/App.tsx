import React, { useCallback, memo, useMemo } from 'react';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './utils/errorHandler';
import { GameStart } from './components/GameStart/GameStart';
import { GameBoard } from './components/GameBoard/GameBoard';
import { Graveyard } from './components/Graveyard/Graveyard';
import { CorrectPanel } from './components/CorrectPanel/CorrectPanel';
import { useGameState } from './hooks/useGameState';
import { useTimestampTimer } from './hooks/useTimer';
import { GameCategory } from './types/game.types';
import TopBar from './components/TopBar';

/**
 * 主应用组件
 * 协调整个游戏的流程和状态管理
 * 使用React.memo优化渲染性能
 */
const App: React.FC = memo(() => {
  const {
    gameState,
    initializeGame,
    handleGuess,
    resetGame,
    clearError
  } = useGameState();

  const { totalSeconds: time, start, stop: stopTimer, reset: resetTimer } = useTimestampTimer();

  /**
   * 处理游戏开始
   */
  const handleStartGame = useCallback(async (category: GameCategory) => {
    try {
      clearError();
      start();
      await initializeGame(category);
    } catch (error) {
      console.error('游戏初始化失败:', error);
      stopTimer();
      resetTimer();
    }
  }, [clearError, start, initializeGame, stopTimer, resetTimer]);

  /**
   * 处理猜测
   */
  const handleGameGuess = useCallback(async (char: string) => {
    try {
      clearError();
      await handleGuess(char);
    } catch (error) {
      console.error('猜测处理失败:', error);
    }
  }, [clearError, handleGuess]);

  /**
   * 计算游戏进度（不统计标点符号）
   * 基于“位置”统计：仅对非标点字符计算总数与揭示数。
   * 重复汉字在 revealed 集合中被揭示一次后，其所有出现位置视为揭示。
   */
  const gameProgress = useMemo(() => {
    if (!gameState.currentEntry) return 0;
    const isPunctuation = (char: string): boolean => /[，。！？、；：“”‘’（）《》〈〉【】—…·.,;:!?'"(){}\[\]<>\-]/.test(char);

    const { entry, encyclopedia } = gameState.currentEntry;
    const entryChars = entry.split('');
    const encyChars = encyclopedia.split('');

    const totalPositions = entryChars.filter(c => !isPunctuation(c)).length + encyChars.filter(c => !isPunctuation(c)).length;
    const revealedPositions = entryChars.filter(c => !isPunctuation(c) && gameState.revealedChars.has(c)).length
      + encyChars.filter(c => !isPunctuation(c) && gameState.revealedChars.has(c)).length;

    return totalPositions > 0 ? Math.round((revealedPositions / totalPositions) * 100) : 0;
  }, [gameState.currentEntry, gameState.revealedChars]);

  /**
   * 格式化时间显示
   */
  const formattedTime = useMemo(() => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [time]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--color-bg-app)]">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        {/* 顶部栏（吸顶，集成进度条） */}
        <TopBar 
          title="词条猜测游戏" 
          progress={gameState.gameStatus === 'playing' ? gameProgress : undefined}
        />
        
        {gameState.gameStatus === 'start' && (
          <GameStart 
            onStartGame={handleStartGame}
            isLoading={gameState.isLoading}
          />
        )}

        {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'victory') && gameState.currentEntry && (
          <div className="container mx-auto max-w-6xl">
            <div className="mb-4">
              {/* 顶部栏正下方的居中统计（缩小字号） */}
              <div className="flex items-center justify-center gap-4 mt-1 text-xs text-[var(--color-text-muted)]">
                <div><span className="font-medium">时间: {formattedTime}</span></div>
                <div><span className="font-medium">尝试: {gameState.attempts}</span></div>
                <div><span className="font-medium">进度: {gameProgress}%</span></div>
              </div>
            </div>

            <div className="grid grid-cols- lg:grid-cols-2 gap-4">
              <div className="lg:col-span-1">
                <GameBoard
                  entryData={gameState.currentEntry}
                  guessedChars={gameState.guessedChars}
                  revealedChars={gameState.revealedChars}
                  attempts={gameState.attempts}
                  onGuess={handleGameGuess}
                  isLoading={gameState.isLoading}
                  error={gameState.error}
                  gameTime={time}
                  gameStatus={gameState.gameStatus}
                  /**
                   * 再来一局回调：停止与重置计时器，重置游戏到初始界面
                   */
                  onRestart={() => {
                    try {
                      stopTimer();
                      resetTimer();
                      resetGame();
                    } catch (e) {
                      console.error('重置失败:', e);
                    }
                  }}
                />
              </div>
              
              <div className="lg:col-span-1 space-y-4">
                <Graveyard
                  graveyard={gameState.graveyard}
                />
                <CorrectPanel guessedChars={gameState.guessedChars} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
});

// 添加显示名称用于调试
App.displayName = 'App';

export default App;
