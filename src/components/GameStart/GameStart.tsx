import React, { useState, useCallback, memo } from 'react';
import { CATEGORIES } from '../../constants/game.constants';
import { Play, Settings, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AppError, ErrorType } from '../../utils/errorHandler';

import { GameCategory } from '../../types/game.types';

interface GameStartProps {
  onStartGame: (category: GameCategory, enableHints: boolean) => void;
  onOpenSettings?: () => void;
  onOpenGameInfo?: () => void;
  isLoading: boolean;
  initialHintsEnabled?: boolean;
}

/**
 * 游戏开始界面组件
 * 提供领域选择和游戏开始功能
 * 使用React.memo优化渲染性能
 */
export const GameStart: React.FC<GameStartProps> = memo(({ onStartGame, onOpenSettings, onOpenGameInfo, isLoading, initialHintsEnabled }) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | ''>('');
  const [hoveredCategory, setHoveredCategory] = useState<string>('');
  const [enableHints, setEnableHints] = useState<boolean>(initialHintsEnabled ?? true);
  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false);

  React.useEffect(() => {
    if (typeof initialHintsEnabled === 'boolean') {
      setEnableHints(initialHintsEnabled);
    }
  }, [initialHintsEnabled]);

  /**
   * 处理领域选择
   */
  const handleCategorySelect = useCallback((category: GameCategory) => {
    setSelectedCategory(category);
  }, []);

  /**
   * 切换“开启提示”滑动开关状态
   *
   * 功能描述：在开始页滑动开关点击时反转 `enableHints` 状态，用于控制游戏界面提示按钮的启用/禁用。
   * 参数说明：无
   * 返回值说明：void
   * 异常说明：无
   */
  const handleToggleHints = useCallback((): void => {
    setEnableHints((prev) => !prev);
  }, []);

  // 随机选项策略：使用“随机”类别，不提前暴露具体领域

  /**
   * 处理游戏开始
   * 
   * 功能描述：
   * - 校验是否选择领域；
   * - 将“开启提示”开关状态随领域一起传给上层；
   * 
   * 参数说明：无（使用组件内部状态 `selectedCategory` 与 `enableHints`）
   * 返回值说明：Promise<void>
   * 异常说明：
   * - 若未选择领域，抛出用户可见错误提示（toast），不调用上层回调。
   */
  const handleStartGame = useCallback(async (): Promise<void> => {
    if (!selectedCategory) {
      toast.error('请先选择一个领域');
      return;
    }

    try {
      await onStartGame(selectedCategory as GameCategory, enableHints);
    } catch (error: any) {
      console.error('游戏开始失败:', error);
      
      // 检查是否为配置错误（缺少API Key）
      if (error instanceof AppError && error.type === ErrorType.CONFIG_ERROR) {
        setShowAuthDialog(true);
        return;
      }
      // 兼容可能未被正确转换为AppError的情况
      if (error?.code === 'MISSING_API_KEY') {
        setShowAuthDialog(true);
        return;
      }

      toast.error(error.message || '游戏开始失败，请稍后重试');
    }
  }, [selectedCategory, enableHints, onStartGame]);

  return (
    <div className=" bg-[var(--color-surface)] flex justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* 顶部栏承载标题与规则弹窗，主页内容整体下移 */}

        {/* 领域选择 */}
        <div className="text-2xl font-semibold text-[var(--color-text)] mb-4 text-center">选择领域</div>
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
            className="btn-primary px-4 py-3"
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
          {/* 开始按钮下方：开启提示滑动开关（默认开启） */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-[var(--color-text)] select-none">开启提示</span>
            <button
              type="button"
              role="switch"
              aria-checked={enableHints}
              aria-label="开启提示"
              onClick={handleToggleHints}
              className={`relative inline-flex w-8 h-5 rounded-full transition-colors duration-200 focus:outline-none ${enableHints ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${enableHints ? 'translate-x-3' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* 加载提示 */}
        {isLoading && (
          <div className="mt-4 text-center text-[var(--color-text-muted)] text-sm">
            <p>正在生成词条，请稍候...</p>
            <div className="mt-2">
              <div className="inline-flex space-x-1">
                <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 配置提示对话框 */}
      {showAuthDialog && (
        <div className="fixed inset-0 z-50 flex justify-center items-start pt-[20vh] bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-md w-full p-6 border border-[var(--color-border)] animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">需要配置 API Key</h3>
              <p className="text-[var(--color-text-muted)] mb-6 leading-relaxed">
                检测到您未配置 API Key 或验证码。
                <br/>
                请先在设置中配置 API Key，或输入邀请码以启用游戏。
              </p>
              
              <div className="flex flex-col w-full gap-3">
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => {
                      setShowAuthDialog(false);
                      onOpenGameInfo?.();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    去填写
                  </button>
                  <button 
                    onClick={() => {
                      setShowAuthDialog(false);
                      onOpenSettings?.();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    去设置
                  </button>
                </div>
                <button 
                  onClick={() => setShowAuthDialog(false)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors font-medium"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// 添加显示名称用于调试
GameStart.displayName = 'GameStart';