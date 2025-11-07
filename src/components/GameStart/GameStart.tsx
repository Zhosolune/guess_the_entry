import React, { useState, useCallback, memo } from 'react';
import { CATEGORIES } from '../../constants/game.constants';
import { Play } from 'lucide-react';
import { toast } from 'sonner';

import { GameCategory } from '../../types/game.types';

interface GameStartProps {
  onStartGame: (category: GameCategory) => void;
  isLoading: boolean;
}

/**
 * 游戏开始界面组件
 * 提供领域选择和游戏开始功能
 * 使用React.memo优化渲染性能
 */
export const GameStart: React.FC<GameStartProps> = memo(({ onStartGame, isLoading }) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | ''>('');
  const [hoveredCategory, setHoveredCategory] = useState<string>('');

  /**
   * 处理领域选择
   */
  const handleCategorySelect = useCallback((category: GameCategory) => {
    setSelectedCategory(category);
  }, []);

  // 随机选项策略：使用“随机”类别，不提前暴露具体领域

  /**
   * 处理游戏开始
   */
  const handleStartGame = useCallback(async () => {
    if (!selectedCategory) {
      toast.error('请先选择一个领域');
      return;
    }

    try {
      await onStartGame(selectedCategory);
    } catch (error) {
      console.error('游戏开始失败:', error);
      toast.error('游戏开始失败，请稍后重试');
    }
  }, [selectedCategory, onStartGame]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* 顶部栏承载标题与规则弹窗，主页内容整体下移 */}

        {/* 领域选择 */}
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4 text-center">选择领域</h2>
        <div className="card-flat section mb-6">
          {/* 常规领域网格（不含“随机”） */}
          <div className="grid grid-cols-2 md:grid-cols-3 text-[var(--color-text)] gap-3 mb-4">
            {Object.entries(CATEGORIES)
              .filter(([key]) => key !== '随机')
              .map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleCategorySelect(key as GameCategory)}
                  onMouseEnter={() => setHoveredCategory(key)}
                  onMouseLeave={() => setHoveredCategory('')}
                  className={`category-card transition-all duration-200 ${selectedCategory === key ? 'selected' : ''}`}
                  disabled={isLoading}
                >
                  <span className="font-medium">{label as string}</span>
                  {selectedCategory === key && (
                    <div className="absolute left-2 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: '#4CAF50' }}></div>
                  )}
                </button>
              ))}
          </div>

          {/* 底部“随机”选项（独占一行，与其他按钮等宽，水平居中） */}
          <div className="flex justify-center items-center">
            <button
              onClick={() => handleCategorySelect('随机')}
              disabled={isLoading}
              className={`category-card transition-all duration-200 w-1/2 md:w-1/3 ${selectedCategory === '随机' ? 'selected' : ''}`}
            >
              <span className="font-medium">随机</span>
              {selectedCategory === '随机' && (
                <div className="absolute left-2 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: '#4CAF50' }}></div>
              )}
            </button>
          </div>
        </div>

        {/* 开始游戏按钮 */}
        <div className="text-center">
          <button
            onClick={handleStartGame}
            disabled={!selectedCategory || isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2"></div>
                正在生成词条...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                开始游戏
              </>
            )}
          </button>
        </div>

        {/* 加载提示 */}
        {isLoading && (
          <div className="mt-4 text-center text-[var(--color-text-muted)] text-sm">
            <p>正在生成词条，请稍候...</p>
            <div className="mt-2">
              <div className="inline-flex space-x-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// 添加显示名称用于调试
GameStart.displayName = 'GameStart';