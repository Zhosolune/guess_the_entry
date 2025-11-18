/**
 * 游戏状态类型定义
 */

// 游戏领域分类
export type GameCategory = 
  | '自然' 
  | '天文' 
  | '地理' 
  | '动漫' 
  | '影视' 
  | '游戏' 
  | '体育' 
  | '历史' 
  | 'ACGN' 
  | '随机';

// 词条数据结构
export interface EntryData {
  entry: string; // 词条名称
  encyclopedia: string; // 百科内容
  category: GameCategory;
  metadata?: {
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    source: string;
  };
}

// 游戏状态
export type GameStatus = 'start' | 'playing' | 'victory' | 'error';

// 新的游戏状态接口
export interface GameState {
  gameId: string;
  gameStatus: GameStatus;
  category: GameCategory;
  currentEntry: EntryData | null;
  revealedChars: Set<string>;
  guessedChars: Set<string>;
  graveyard: string[];
  attempts: number;
  hintCount: number;
  hintUsed: boolean;
  startTime: number;
  isLoading: boolean;
  error: string | null;
}

// 游戏统计接口
export interface GameStats {
  totalTime: number; // 总用时（秒）
  totalAttempts: number; // 总尝试次数
  victory: boolean; // 是否胜利
  category: GameCategory; // 游戏领域
  entry: string; // 词条名称
  currentStreak: number; // 当前连胜次数
  maxStreak: number; // 最高连胜次数
  totalGames: number; // 总游戏次数
  victoryCount: number; // 胜利次数
  totalWins: number; // 总胜利次数
  bestTime: number | null; // 最佳时间（秒）
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  timestamp?: number;
}

// 游戏配置
export interface GameConfig {
  categories: GameCategory[];
  maxAttempts: number;
  timeLimit: number; // 时间限制（秒），0表示无限制
}

// 遮盖算法配置
export interface MaskConfig {
  maskChinese: boolean; // 是否遮盖中文字符
  maskEnglish: boolean; // 是否遮盖英文字符
  maskNumbers: boolean; // 是否遮盖数字
  maskPunctuation: boolean; // 是否遮盖标点符号
  customMasks: Record<string, boolean>; // 自定义遮盖规则
}