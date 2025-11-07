/**
 * 游戏状态存储工具
 * 提供本地存储功能，用于保存和加载游戏状态
 */

import { GameState } from '../types/game.types';
import { ErrorHandler, ErrorType, AppError } from './errorHandler';

const STORAGE_KEYS = {
  GAME_STATE: 'guess_the_entry_game_state',
  GAME_STATS: 'guess_the_entry_game_stats'
} as const;

/**
 * 保存游戏状态到本地存储
 * 
 * @param gameState - 要保存的游戏状态
 * @throws AppError - 保存失败时抛出错误
 */
export async function saveGameState(gameState: GameState): Promise<void> {
  try {
    // 将Set转换为数组以便JSON序列化
    const serializedState = {
      ...gameState,
      revealedChars: Array.from(gameState.revealedChars),
      guessedChars: Array.from(gameState.guessedChars)
    };
    
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(serializedState));
  } catch (error) {
    throw new AppError(
      '保存游戏状态失败',
      ErrorType.STORAGE_ERROR,
      'SAVE_FAILED',
      error
    );
  }
}

/**
 * 从本地存储加载游戏状态
 * 
 * @returns 保存的游戏状态，如果没有则返回null
 * @throws AppError - 加载失败时抛出错误
 */
export async function loadGameState(): Promise<GameState | null> {
  try {
    const savedData = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
    
    if (!savedData) {
      return null;
    }
    
    const parsed = JSON.parse(savedData);
    
    // 将数组转换回Set
    return {
      ...parsed,
      revealedChars: new Set(parsed.revealedChars || []),
      guessedChars: new Set(parsed.guessedChars || [])
    };
  } catch (error) {
    throw new AppError(
      '加载游戏状态失败',
      ErrorType.STORAGE_ERROR,
      'LOAD_FAILED',
      error
    );
  }
}

/**
 * 清除本地存储的游戏状态
 * 
 * @throws AppError - 清除失败时抛出错误
 */
export async function clearGameState(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
  } catch (error) {
    throw new AppError(
      '清除游戏状态失败',
      ErrorType.STORAGE_ERROR,
      'CLEAR_FAILED',
      error
    );
  }
}

/**
 * 保存游戏统计信息
 * 
 * @param stats - 游戏统计信息
 * @throws AppError - 保存失败时抛出错误
 */
export async function saveGameStats(stats: any): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(stats));
  } catch (error) {
    throw new AppError(
      '保存游戏统计失败',
      ErrorType.STORAGE_ERROR,
      'SAVE_STATS_FAILED',
      error
    );
  }
}

/**
 * 从本地存储加载游戏统计信息
 * 
 * @returns 保存的游戏统计信息，如果没有则返回null
 * @throws AppError - 加载失败时抛出错误
 */
export async function loadGameStats(): Promise<any | null> {
  try {
    const savedData = localStorage.getItem(STORAGE_KEYS.GAME_STATS);
    
    if (!savedData) {
      return null;
    }
    
    return JSON.parse(savedData);
  } catch (error) {
    throw new AppError(
      '加载游戏统计失败',
      ErrorType.STORAGE_ERROR,
      'LOAD_STATS_FAILED',
      error
    );
  }
}