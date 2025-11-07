/**
 * 本地存储服务
 * 
 * 功能：
 * - 游戏状态持久化
 * - 本地数据管理
 * - 状态恢复
 */

import { GameState } from '@/types/game.types';

/**
 * 本地存储服务
 * 用于保存和加载游戏状态
 */

const STORAGE_KEY = 'guess_the_entry_game_state';
const STATS_KEY = 'guess_the_entry_game_stats';

/**
 * 游戏统计接口
 */
interface GameStats {
  totalGames: number;
  totalVictories: number;
  totalTime: number;
  totalAttempts: number;
  bestTime: number;
  bestAttempts: number;
}

/**
 * 验证游戏状态数据
 */
function validateGameState(data: any): data is GameState {
  return (
    data &&
    typeof data.gameId === 'string' &&
    typeof data.gameStatus === 'string' &&
    typeof data.category === 'string' &&
    (data.currentEntry === null || (
      data.currentEntry &&
      typeof data.currentEntry.entry === 'string' &&
      typeof data.currentEntry.encyclopedia === 'string' &&
      typeof data.currentEntry.category === 'string'
    )) &&
    data.revealedChars instanceof Array &&
    data.guessedChars instanceof Array &&
    Array.isArray(data.graveyard) &&
    typeof data.attempts === 'number' &&
    typeof data.startTime === 'number' &&
    typeof data.isLoading === 'boolean' &&
    (data.error === null || typeof data.error === 'string')
  );
}

/**
 * 序列化游戏状态
 */
function serializeGameState(state: GameState): string {
  const serialized = {
    ...state,
    revealedChars: Array.from(state.revealedChars),
    guessedChars: Array.from(state.guessedChars)
  };
  return JSON.stringify(serialized);
}

/**
 * 反序列化游戏状态
 */
function deserializeGameState(data: string): GameState | null {
  try {
    const parsed = JSON.parse(data);
    
    // 转换数组回Set
    if (parsed.revealedChars && Array.isArray(parsed.revealedChars)) {
      parsed.revealedChars = new Set(parsed.revealedChars);
    }
    
    if (parsed.guessedChars && Array.isArray(parsed.guessedChars)) {
      parsed.guessedChars = new Set(parsed.guessedChars);
    }
    
    return validateGameState(parsed) ? parsed : null;
  } catch (error) {
    console.error('反序列化游戏状态失败:', error);
    return null;
  }
}

/**
 * 保存游戏状态
 */
export function saveGameState(state: GameState): void {
  try {
    const serialized = serializeGameState(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    console.log('游戏状态已保存');
  } catch (error) {
    console.error('保存游戏状态失败:', error);
    throw new Error('无法保存游戏状态');
  }
}

/**
 * 加载游戏状态
 */
export function loadGameState(): GameState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return null;
    }

    const state = deserializeGameState(serialized);
    if (!state) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    console.log('游戏状态已加载');
    return state;
  } catch (error) {
    console.error('加载游戏状态失败:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * 清除游戏状态
 */
export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('游戏状态已清除');
  } catch (error) {
    console.error('清除游戏状态失败:', error);
  }
}

/**
 * 保存游戏统计
 */
export function saveGameStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('保存游戏统计失败:', error);
  }
}

/**
 * 加载游戏统计
 */
export function loadGameStats(): GameStats {
  try {
    const serialized = localStorage.getItem(STATS_KEY);
    if (!serialized) {
      return {
        totalGames: 0,
        totalVictories: 0,
        totalTime: 0,
        totalAttempts: 0,
        bestTime: Infinity,
        bestAttempts: Infinity
      };
    }

    const stats = JSON.parse(serialized);
    return {
      totalGames: stats.totalGames || 0,
      totalVictories: stats.totalVictories || 0,
      totalTime: stats.totalTime || 0,
      totalAttempts: stats.totalAttempts || 0,
      bestTime: stats.bestTime || Infinity,
      bestAttempts: stats.bestAttempts || Infinity
    };
  } catch (error) {
    console.error('加载游戏统计失败:', error);
    return {
      totalGames: 0,
      totalVictories: 0,
      totalTime: 0,
      totalAttempts: 0,
      bestTime: Infinity,
      bestAttempts: Infinity
    };
  }
}

/**
 * 更新游戏统计
 */
export function updateGameStats(victory: boolean, time: number, attempts: number): GameStats {
  try {
    const stats = loadGameStats();
    
    stats.totalGames += 1;
    stats.totalTime += time;
    stats.totalAttempts += attempts;
    
    if (victory) {
      stats.totalVictories += 1;
      if (time < stats.bestTime) {
        stats.bestTime = time;
      }
      if (attempts < stats.bestAttempts) {
        stats.bestAttempts = attempts;
      }
    }
    
    saveGameStats(stats);
    return stats;
  } catch (error) {
    console.error('更新游戏统计失败:', error);
    throw new Error('无法更新游戏统计');
  }
}

/**
 * 清除所有存储数据
 */
export function clearAllStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_KEY);
    console.log('所有存储数据已清除');
  } catch (error) {
    console.error('清除存储数据失败:', error);
  }
}