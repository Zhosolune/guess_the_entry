import { useState, useCallback, useEffect } from 'react';
import { GameState, GameStats, GameCategory, EntryData } from '../types/game.types';
import { generateEntry } from '../services/deepseek';
import { selectRandomCategory } from '../utils/categoryMapper';
import { saveGameState, loadGameState, clearGameState, addExcludedEntry, updateGameStats } from '../utils/stateManager';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandler';

/**
 * 游戏状态管理Hook
 * 管理游戏核心状态、流程和持久化
 * 
 * 主要功能：
 * - 游戏状态管理：词条、遮盖内容、已揭示位置、坟场等
 * - 游戏流程控制：初始化、猜测处理、胜利检测、重置等
 * - 数据持久化：自动保存和加载游戏状态
 * - 错误处理：统一的错误处理和降级方案
 * 
 * 状态说明：
 * - entry: 原始词条
 * - encyclopedia: 原始百科内容
 * - maskedEntry: 遮盖后的词条
 * - maskedEncyclopedia: 遮盖后的百科内容
 * - revealedPositions: 已揭示的位置集合
 * - graveyard: 错误猜测的字符数组
 * - gameStarted: 游戏是否开始
 * - gameWon: 游戏是否获胜
 * - attempts: 猜测次数
 * - currentTime: 游戏开始时间
 * - category: 当前领域分类
 * - isLoading: 是否正在加载
 * - error: 错误信息
 * 
 * @example
 * ```typescript
 * const { gameState, initializeGame, handleGuess, resetGame } = useGameState();
 * ```
 */

/**
 * 游戏状态Hook
 * 提供完整的游戏状态管理和操作方法
 * 
 * @returns 包含游戏状态、统计信息和操作方法的对象
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    gameId: '',
    gameStatus: 'start',
    category: '随机' as GameCategory,
    currentEntry: null,
    revealedChars: new Set(),
    guessedChars: new Set(),
    graveyard: [],
    attempts: 0,
    hintCount: 0,
    hintUsed: false,
    startTime: Date.now(),
    isLoading: false,
    error: null
  });

  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    totalWins: 0,
    totalAttempts: 0,
    bestTime: null,
    currentStreak: 0,
    maxStreak: 0,
    totalTime: 0,
    victoryCount: 0,
    victory: false,
    category: '随机' as GameCategory,
    entry: ''
  });

  /**
   * 初始化游戏
   * 根据选择的领域生成新的词条并开始游戏
   * 
   * @param category - 游戏领域分类
   * @throws AppError - 词条生成失败时抛出错误
   * 
   * 流程：
   * 1. 设置加载状态
   * 2. 调用API生成词条
   * 3. 创建遮盖内容
   * 4. 初始化游戏状态
   * 5. 保存游戏状态
   * 
   * @example
   * ```typescript
   * try {
   *   await initializeGame('nature');
   *   console.log('游戏初始化成功');
   * } catch (error) {
   *   console.error('游戏初始化失败:', error);
   * }
   * ```
   */
  const initializeGame = useCallback(async (category: GameCategory) => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true, error: null }));

      const actualCategory = category === '随机' ? selectRandomCategory() : category;
      const response = await generateEntry(actualCategory);
      // 开发模式打印原始返回，便于定位响应结构问题
      if (import.meta.env.MODE === 'development' || import.meta.env.VITE_DEBUG_API === '1') {
        console.debug('[Game/DEBUG] generateEntry:response', response);
      }
      
      if (!response.success || !response.data) {
        throw new AppError('词条生成失败', ErrorType.API_ERROR, 'GENERATION_FAILED');
      }

      const entryData = response.data;
      
      const newGameState: GameState = {
        gameId: Date.now().toString(),
        gameStatus: 'playing',
        category: actualCategory,
        currentEntry: entryData,
        revealedChars: new Set(),
        guessedChars: new Set(),
        graveyard: [],
        attempts: 0,
        hintCount: 0,
        hintUsed: false,
        startTime: Date.now(),
        isLoading: false,
        error: null
      };

      setGameState(newGameState);
      
      // 保存游戏状态
      try {
        await saveGameState(newGameState);
      } catch (storageError) {
        console.warn('游戏状态保存失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(storageError)));
      }

    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('初始化游戏失败:', ErrorHandler.getErrorLog(appError));
      
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: appError.message
      }));
      
      throw appError;
    }
  }, []);

  /**
   * 处理猜测
   * 处理玩家的字符猜测，更新游戏状态
   * 
   * @param char - 玩家输入的字符
   * @returns 猜测结果，包含是否成功、是否正确、位置信息等
   * 
   * 验证规则：
   * - 游戏必须已开始且未结束
   * - 输入必须为单个字符
   * - 字符必须为有效中文字符
   * - 字符不能已经猜过
   * 
   * 处理逻辑：
   * - 在词条或百科中找到字符位置
   * - 更新已揭示位置集合
   * - 错误猜测添加到坟场
   * - 检查是否获胜
   * - 自动保存游戏状态
   * 
   * @example
   * ```typescript
   * const result = handleGuess('光');
   * if (result.success) {
   *   console.log(result.isCorrect ? '猜对了！' : '猜错了！');
   * }
   * ```
   */
  const handleGuess = useCallback(async (char: string) => {
    if (gameState.gameStatus !== 'playing' || gameState.isLoading) {
      return { success: false, reason: '游戏未开始或已结束' };
    }

    if (!gameState.currentEntry) {
      return { success: false, reason: '游戏数据不完整' };
    }

    // 验证输入
    if (!char || char.length !== 1) {
      throw ErrorHandler.handleValidationError('请输入单个字符', 'char');
    }

    if (!isValidChineseChar(char)) {
      throw ErrorHandler.handleValidationError('请输入有效的中文字符', 'char');
    }

    // 检查是否已经猜过
    if (gameState.revealedChars.has(char) || gameState.guessedChars.has(char) || gameState.graveyard.includes(char)) {
      return { success: false, reason: '该字符已经猜过' };
    }

    const normalizedChar = char.trim();
    const entry = gameState.currentEntry.entry;
    const encyclopedia = gameState.currentEntry.encyclopedia;
    
    // 查找字符在词条中的位置
    const entryPositions = findCharIndices(entry, normalizedChar);
    const encyclopediaPositions = findCharIndices(encyclopedia, normalizedChar);
    
    const newRevealedChars = new Set(gameState.revealedChars);
    const newGuessedChars = new Set(gameState.guessedChars);
    let newGraveyard = [...gameState.graveyard];
    let isCorrect = false;

    if (entryPositions.length > 0 || encyclopediaPositions.length > 0) {
      // 正确猜测
      /**
       * 将正确猜测的字符加入已猜集合与已揭示集合，
       * 以驱动前端取消遮盖显示。
       */
      newGuessedChars.add(normalizedChar);
      newRevealedChars.add(normalizedChar);
      isCorrect = true;
    } else {
      // 错误猜测 - 添加到坟场
      newGraveyard.push(normalizedChar);
    }

    const newGameState: GameState = {
      ...gameState,
      revealedChars: newRevealedChars,
      guessedChars: newGuessedChars,
      graveyard: newGraveyard,
      attempts: gameState.attempts + 1
    };

    // 检查是否获胜
    const won = checkVictory(entry, newGuessedChars);
    if (won) {
      newGameState.gameStatus = 'victory';
      
      // 更新统计
      const gameTime = Date.now() - gameState.startTime;
      setStats(prev => ({
        ...prev,
        totalGames: prev.totalGames + 1,
        totalWins: prev.totalWins + (won ? 1 : 0),
        totalAttempts: prev.totalAttempts + newGameState.attempts,
        bestTime: prev.bestTime ? Math.min(prev.bestTime, gameTime) : gameTime,
        currentStreak: won ? prev.currentStreak + 1 : 0,
        maxStreak: won ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak,
        totalTime: prev.totalTime + gameTime,
        victory: won,
        category: gameState.category,
        entry: gameState.currentEntry?.entry || '',
        victoryCount: won ? prev.victoryCount + 1 : prev.victoryCount
      }));

      // 将本局词条加入排除列表并更新持久化统计
      const entryName = gameState.currentEntry?.entry || '';
      const effectiveCategory = gameState.category;
      try { await addExcludedEntry(entryName, effectiveCategory); } catch (e) {
        console.warn('追加排除词失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(e)));
      }
      try {
        const isPunctuation = (char: string): boolean => /[\p{P}\p{S}]/u.test(char);
        const entryChars = entry.split('');
        const encyChars = (gameState.currentEntry?.encyclopedia || '').split('');
        const totalPositions = entryChars.filter(c => !isPunctuation(c)).length + encyChars.filter(c => !isPunctuation(c)).length;
        const revealedPositions = entryChars.filter(c => !isPunctuation(c) && newGameState.revealedChars.has(c)).length
          + encyChars.filter(c => !isPunctuation(c) && newGameState.revealedChars.has(c)).length;
        const percentAtVictory = totalPositions > 0 ? Math.round((revealedPositions / totalPositions) * 100) : 0;
        await updateGameStats({ gameId: newGameState.gameId, entry: entryName, timeSpent: Math.floor(gameTime / 1000), attempts: newGameState.attempts, category: gameState.category, percent: percentAtVictory, hintCount: newGameState.hintCount, perfect: !newGameState.hintUsed, correctCount: newGameState.guessedChars.size, wrongCount: newGameState.graveyard.length });
      } catch (e) {
        console.warn('更新持久化统计失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(e)));
      }
    }

    setGameState(newGameState);
    
    // 保存游戏状态
    try {
      await saveGameState(newGameState);
    } catch (storageError) {
      console.warn('游戏状态保存失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(storageError)));
    }

    return { 
      success: true, 
      isCorrect, 
      positions: [...entryPositions, ...encyclopediaPositions],
      gameWon: won
    };
  }, [gameState]);

  /**
   * 应用智能提示
   * 
   * 逻辑：
   * 1. 扫描当前词条与百科内容
   * 2. 找出所有未揭示的中文字符
   * 3. 排除词条中包含的字符（防止剧透）
   * 4. 统计剩余字符在百科中出现的频率
   * 5. 选取出现频率最高的字符进行揭示
   * 6. 如果没有可揭示的字符（所有非词条字符都已揭示），则返回提示
   */
  const applySmartHint = useCallback(async () => {
    if (gameState.gameStatus !== 'playing' || gameState.isLoading) {
      return { success: false, reason: '游戏未开始或已结束' };
    }
    if (!gameState.currentEntry) {
      return { success: false, reason: '游戏数据不完整' };
    }

    const { entry, encyclopedia } = gameState.currentEntry;
    const isPunctuation = (char: string): boolean => /[\p{P}\p{S}]/u.test(char);
    const isValidChar = (char: string): boolean => /^[\u4e00-\u9fa5]$/.test(char);

    // 构建词条字符集（用于排除）
    const entryChars = new Set<string>();
    for (const char of entry) {
      if (isValidChar(char)) {
        entryChars.add(char);
      }
    }

    // 统计百科中未揭示字符的频率
    const frequencyMap = new Map<string, number>();
    for (const char of encyclopedia) {
      // 必须是有效汉字、未揭示、且不在词条中
      if (
        isValidChar(char) &&
        !gameState.revealedChars.has(char) &&
        !entryChars.has(char)
      ) {
        frequencyMap.set(char, (frequencyMap.get(char) || 0) + 1);
      }
    }

    // 如果没有可揭示的字符
    if (frequencyMap.size === 0) {
      return { success: false, reason: '没有更多可提示的线索了' };
    }

    // 找出频率最高的字符
    let targetChar = '';
    
    // 将 Map 转为数组进行排序，确保确定性（频率相同时取任意一个即可）
    const sortedEntries = Array.from(frequencyMap.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedEntries.length > 0) {
      targetChar = sortedEntries[0][0];
    } else {
       return { success: false, reason: '没有更多可提示的线索了' };
    }

    // 复用 handleHintSelectChar 的核心逻辑（揭示字符并保存状态）
    // 注意：这里我们直接构造一个新的函数调用或直接执行逻辑，为了避免代码重复，
    // 我们可以将 handleHintSelectChar 重构为通用的 revealCharWithHint 
    // 但为了最小化改动，我们直接在这里执行揭示逻辑。
    
    const newRevealedChars = new Set(gameState.revealedChars);
    const newGuessedChars = new Set(gameState.guessedChars);
    
    // 智能提示揭示的字符，算作已揭示，但不一定算作用户“猜过”的（guessedChars通常指键盘输入）
    // 但为了逻辑统一（revealedChars 用于显示，guessedChars 用于胜利判定和键盘状态），
    // 提示揭示的字符也应当被视为“已解决”，并在键盘上高亮。
    newGuessedChars.add(targetChar);
    newRevealedChars.add(targetChar);

    const newGameState: GameState = {
      ...gameState,
      revealedChars: newRevealedChars,
      guessedChars: newGuessedChars,
      hintUsed: true,
      hintCount: gameState.hintCount + 1
    };

    // 检查是否获胜（理论上提示排除词条字符后不会直接导致获胜，但防御性编程）
    const won = checkVictory(entry, newGuessedChars);
    if (won) {
      newGameState.gameStatus = 'victory';
      const gameTime = Date.now() - gameState.startTime;
      setStats(prev => ({
        ...prev,
        totalGames: prev.totalGames + 1,
        totalWins: prev.totalWins + 1,
        totalAttempts: prev.totalAttempts + newGameState.attempts,
        bestTime: prev.bestTime ? Math.min(prev.bestTime, gameTime) : gameTime,
        currentStreak: prev.currentStreak + 1,
        maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
        totalTime: prev.totalTime + gameTime,
        victory: true,
        category: gameState.category,
        entry: gameState.currentEntry?.entry || '',
        victoryCount: prev.victoryCount + 1
      }));
      const entryName = gameState.currentEntry?.entry || '';
      try {
        await addExcludedEntry(entryName, gameState.category);
      } catch (e) {
        console.warn('追加排除词失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(e)));
      }
      try {
        const entryChars = entry.split('');
        const encyChars = (gameState.currentEntry?.encyclopedia || '').split('');
        const totalPositions = entryChars.filter(c => !isPunctuation(c)).length + encyChars.filter(c => !isPunctuation(c)).length;
        const revealedPositions = entryChars.filter(c => !isPunctuation(c) && newGameState.revealedChars.has(c)).length
          + encyChars.filter(c => !isPunctuation(c) && newGameState.revealedChars.has(c)).length;
        const percentAtVictory = totalPositions > 0 ? Math.round((revealedPositions / totalPositions) * 100) : 0;
        await updateGameStats({ gameId: newGameState.gameId, entry: entryName, timeSpent: Math.floor(gameTime / 1000), attempts: newGameState.attempts, category: gameState.category, percent: percentAtVictory, hintCount: newGameState.hintCount, perfect: !newGameState.hintUsed, correctCount: newGameState.guessedChars.size, wrongCount: newGameState.graveyard.length });
      } catch (e) {
        console.warn('更新持久化统计失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(e)));
      }
    }

    setGameState(newGameState);
    try {
      await saveGameState(newGameState);
    } catch (storageError) {
      console.warn('游戏状态保存失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(storageError)));
    }

    return { success: true, char: targetChar };

  }, [gameState]);

  /**
   * 重置游戏
   * 清除当前游戏状态，准备开始新游戏
   * 
   * 操作：
   * - 清空所有游戏数据
   * - 重置游戏状态
   * - 清除本地存储
   * 
   * @example
   * ```typescript
   * resetGame(); // 重置当前游戏
   * ```
   */
  const resetGame = useCallback(() => {
    try {
      setGameState({
        gameId: '',
        gameStatus: 'start',
        category: '随机' as GameCategory,
        currentEntry: null,
        revealedChars: new Set(),
        guessedChars: new Set(),
        graveyard: [],
        attempts: 0,
        hintCount: 0,
        hintUsed: false,
        startTime: Date.now(),
        isLoading: false,
        error: null
      });

      // 清除保存的游戏状态
      try {
        clearGameState();
      } catch (storageError) {
        console.warn('游戏状态清除失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(storageError)));
      }
    } catch (error) {
      console.error('重置游戏失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(error)));
    }
  }, []);

  /**
   * 更新当前时间
   */
  const updateCurrentTime = useCallback(() => {
    setGameState(prev => ({ ...prev, startTime: Date.now() }));
  }, []);

  /**
   * 加载保存的游戏状态
   */
  const loadSavedGame = useCallback(async (): Promise<GameState | null> => {
    try {
      const savedState = await loadGameState();
      if (savedState) {
        setGameState(savedState);
        return savedState;
      }
      return null;
    } catch (error) {
      console.error('加载保存的游戏状态失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(error)));
      return null;
    }
  }, []);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setGameState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    gameState,
    stats,
    initializeGame,
    handleGuess,
    applySmartHint,
    resetGame,
    updateCurrentTime,
    loadSavedGame,
    clearError
  };
}

/**
 * 创建遮盖内容
 */
function createMaskedContent(entry: string, encyclopedia: string): { maskedEntry: string; maskedEncyclopedia: string } {
  const maskChar = '■';
  
  // 保留标点符号和空格
  const maskText = (text: string) => {
    return text.replace(/[\u4e00-\u9fa5]/g, maskChar);
  };

  return {
    maskedEntry: maskText(entry),
    maskedEncyclopedia: maskText(encyclopedia)
  };
}

/**
 * 查找字符在文本中的位置
 */
function findCharIndices(text: string, char: string): number[] {
  const indices: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === char) {
      indices.push(i);
    }
  }
  return indices;
}

/**
 * 检查是否获胜
 */
function checkVictory(entry: string, guessedChars: Set<string>): boolean {
  // 检查词条中的所有中文字符是否都被猜测过
  for (let i = 0; i < entry.length; i++) {
    if (/[一-龥]/.test(entry[i]) && !guessedChars.has(entry[i])) {
      return false;
    }
  }
  
  return true;
}

/**
 * 验证中文字符
 */
function isValidChineseChar(char: string): boolean {
  return /^[\u4e00-\u9fa5]$/.test(char);
}
