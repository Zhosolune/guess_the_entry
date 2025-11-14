import React, { useCallback, memo, useMemo } from 'react';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './utils/errorHandler';
import { GameStart } from './components/GameStart/GameStart';
import { GameLayout } from './components/GameLayout/GameLayout';
import QuickRefDrawer from './components/QuickRefDrawer';
import ScoreboardDrawer from './components/ScoreboardDrawer';
import GameInfoDrawer from './components/GameInfoDrawer';
import SettingsDrawer, { QuickRefPosition } from './components/SettingsDrawer';
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

  const { totalSeconds: time, start, stop: stopTimer, reset: resetTimer, formatTime } = useTimestampTimer();
  /**
   * 冻结显示用时（胜利后停止计时但保留最终显示）
   */
  const [finalSeconds, setFinalSeconds] = React.useState<number | null>(null);

  /**
   * 速查表抽屉显隐状态（默认隐藏）
   */
  const [isQuickRefOpen, setIsQuickRefOpen] = React.useState<boolean>(false);

  /**
   * 游戏信息抽屉显隐状态（默认隐藏）
   */
  const [isGameInfoOpen, setIsGameInfoOpen] = React.useState<boolean>(false);

  /**
   * 设置抽屉显隐状态（默认隐藏）
   */
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  
  /**
   * 计分板抽屉显隐状态（默认隐藏）
   */
  const [isScoreboardOpen, setIsScoreboardOpen] = React.useState<boolean>(false);

  /**
   * 速查表位置设置（默认 bottom）
   * bottom/left/right
   */
  const [quickRefPosition, setQuickRefPosition] = React.useState<QuickRefPosition>('bottom');

  /**
   * 处理游戏开始
   * 
   * 功能描述：
   * - 初始化游戏并启动计时；
   * - 接收“开启提示”开关状态并下发到游戏界面；
   * 
   * 参数说明：
   * - category: GameCategory 选择的领域
   * - enableHints: boolean 是否开启提示按钮
   * 返回值说明：Promise<void>
   * 异常说明：初始化失败时停止计时并重置。
   */
  const [hintsEnabled, setHintsEnabled] = React.useState<boolean>(true);
  const handleStartGame = useCallback(async (category: GameCategory, enableHints: boolean) => {
    try {
      clearError();
      // 开始新局前清空最终用时冻结
      setFinalSeconds(null);
      start();
      setHintsEnabled(enableHints);
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
    const secondsToShow = gameState.gameStatus === 'victory' && finalSeconds !== null ? finalSeconds : time;
    return formatTime(secondsToShow);
  }, [time, finalSeconds, formatTime, gameState.gameStatus]);

  /**
   * 监听胜利状态：停止计时并冻结最终用时显示
   * - 停止计时器后 `totalSeconds` 会归零，因此需在停止前记录最终秒数
   */
  React.useEffect(() => {
    /**
     * 胜利态冻结一次最终用时并停止计时
     * 注意：移除对 time 的无条件写入，避免 stop 后 time=0 覆盖冻结值
     */
    if (gameState.gameStatus === 'victory' && finalSeconds === null) {
      setFinalSeconds(time);
      stopTimer();
    }
  }, [gameState.gameStatus, finalSeconds, time, stopTimer]);

  /**
   * 关闭所有抽屉
   * 保证全局互斥：任意时刻仅一个抽屉处于打开状态
   *
   * @returns void
   */
  const closeAllDrawers = React.useCallback((): void => {
    setIsSettingsOpen(false);
    setIsScoreboardOpen(false);
  }, []);

  /**
   * 设置按钮点击处理
   * 仅在游戏界面时提供，初始页面不渲染设置按钮
   * 互斥策略：当即将开启设置抽屉时，关闭其他抽屉
   */
  const handleOpenSettings = React.useCallback((): void => {
    setIsSettingsOpen(prev => {
      const next = !prev;
      if (next) {
        // 打开设置抽屉 -> 关闭其他抽屉
        setIsScoreboardOpen(false);
        setIsGameInfoOpen(false);
      }
      return next;
    });
  }, []);

  /**
   * 计分板按钮点击处理
   * 仅在游戏界面时提供，初始页面不渲染计分板按钮
   * 互斥策略：当即将开启计分板抽屉时，关闭其他抽屉
   */
  const handleOpenScoreboard = React.useCallback((): void => {
    setIsScoreboardOpen(prev => {
      const next = !prev;
      if (next) {
        // 打开计分板抽屉 -> 关闭其他抽屉
        setIsSettingsOpen(false);
        setIsGameInfoOpen(false);
      }
      return next;
    });
  }, []);

  /**
   * 游戏信息按钮点击处理
   * 仅在游戏界面时提供，初始页面不渲染游戏信息按钮
   * 互斥策略：当即将开启游戏信息抽屉时，关闭其他抽屉
   */
  const handleOpenGameInfo = React.useCallback((): void => {
    setIsGameInfoOpen(prev => {
      const next = !prev;
      if (next) {
        // 打开游戏信息抽屉 -> 关闭其他抽屉
        setIsSettingsOpen(false);
        setIsScoreboardOpen(false);
      }
      return next;
    });
  }, []);

  const showSettingsButton = (gameState.gameStatus === 'playing' || gameState.gameStatus === 'victory');
  const showScoreboardButton = (gameState.gameStatus === 'playing' || gameState.gameStatus === 'victory');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--color-bg-app)] flex flex-col">
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
          progress={gameState.gameStatus === 'playing' ? gameProgress : undefined}
          onOpenScoreboard={showScoreboardButton ? handleOpenScoreboard : undefined}
          scoreboardOpen={showScoreboardButton ? isScoreboardOpen : false}
          onOpenSettings={showSettingsButton ? handleOpenSettings : undefined}
          settingsOpen={showSettingsButton ? isSettingsOpen : false}
          onOpenGameInfo={handleOpenGameInfo}
          gameInfoOpen={isGameInfoOpen}
        />
        
        {gameState.gameStatus === 'start' && (
          <div className="flex items-center justify-center mt-[calc(var(--topbar-h))]">
            <GameStart 
              onStartGame={handleStartGame}
              isLoading={gameState.isLoading}
            />
          </div>
        )}

        {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'victory') && gameState.currentEntry && (
          <div className="flex-1 flex flex-col overflow-hidden">
          <GameLayout
            entryData={gameState.currentEntry}
            guessedChars={gameState.guessedChars}
            revealedChars={gameState.revealedChars}
            graveyard={gameState.graveyard}
            attempts={gameState.attempts}
            onGuess={handleGameGuess}
            isLoading={gameState.isLoading}
            error={gameState.error}
            gameTime={gameState.gameStatus === 'victory' && finalSeconds !== null ? finalSeconds : time}
              gameStatus={gameState.gameStatus}
              hintsEnabled={hintsEnabled}
              quickRefOpen={isQuickRefOpen}
          onRestart={() => {
            try {
              stopTimer();
              resetTimer();
              setFinalSeconds(null);
              resetGame();
              setIsQuickRefOpen(false);
              setIsSettingsOpen(false);
            } catch (e) {
              console.error('重置失败:', e);
            }
          }}
          onToggleQuickRef={() => {
            setIsQuickRefOpen(prev => {
              const next = !prev;
              // if (next) {
              //   // 打开速查表 -> 关闭其他抽屉
              //   setIsSettingsOpen(false);
              //   setIsScoreboardOpen(false);
              // }
              return next;
            });
          }}
        />
      </div>
    )}
    {/* 游戏信息抽屉（TopBar 下方，最上层） */}
    <GameInfoDrawer
      isOpen={isGameInfoOpen}
      onClose={() => setIsGameInfoOpen(false)}
    />
    {/* 速查表抽屉（全局固定定位，默认隐藏） */}
    {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'victory') && (
      <QuickRefDrawer
        isOpen={isQuickRefOpen}
        onClose={() => setIsQuickRefOpen(false)}
        graveyard={gameState.graveyard}
        guessedChars={gameState.guessedChars}
        position={quickRefPosition}
      />
    )}
    {/* 设置抽屉（TopBar 下方，最上层） */}
    {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'victory') && (
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        quickRefPosition={quickRefPosition}
        onChangeQuickRefPosition={(pos) => setQuickRefPosition(pos)}
      />
    )}
    {/* 计分板抽屉（TopBar 下方，最上层） */}
    {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'victory') && (
      <ScoreboardDrawer
        isOpen={isScoreboardOpen}
        onClose={() => setIsScoreboardOpen(false)}
      />
    )}
  </div>
  </ErrorBoundary>
  );
});

// 添加显示名称用于调试
App.displayName = 'App';

export default App;
