/**
 * 游戏领域常量
 * 统一与 types/game.types.ts 中的 `GameCategory` 类型（中文枚举）保持一致
 */
import type { GameCategory } from '../types/game.types';

/**
 * 可选项字典：以中文类型为键，值为显示文案（此处与键一致，便于后续自定义）
 */
export const CATEGORIES: Record<GameCategory, string> = {
  '自然': '自然',
  '天文': '天文',
  '地理': '地理',
  '动漫': '动漫',
  '影视': '影视',
  '游戏': '游戏',
  '体育': '体育',
  '历史': '历史',
  'ACGN': 'ACGN',
  '随机': '随机'
};

/**
 * 默认遮盖字符
 */
export const MASK_CHAR = '■';

/**
 * 最大尝试次数限制
 */
export const MAX_ATTEMPTS = 100;

/**
 * 游戏状态常量
 */
export const GAME_STATUS = {
  START: 'start',
  PLAYING: 'playing',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
} as const;

/**
 * API 配置常量
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30秒超时
  RETRY_ATTEMPTS: 3, // 重试次数
  RETRY_DELAY: 1000 // 重试延迟（毫秒）
} as const;