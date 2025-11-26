import React, { useEffect, useState } from 'react';
import { SettingBoardIcon } from '../assets/settingBoard';
import { getDeepSeekApiKey, saveDeepSeekApiKey } from '../utils/storage';

export type QuickRefPosition = 'bottom' | 'left' | 'right';

interface SettingsDrawerProps {
  /**
   * 是否打开设置抽屉
   */
  isOpen: boolean;
  /**
   * 关闭抽屉的回调
   */
  onClose: () => void;
  /**
   * 当前速查表位置设置
   */
  quickRefPosition: QuickRefPosition;
  /**
   * 更改速查表位置设置
   */
  onChangeQuickRefPosition: (pos: QuickRefPosition) => void;
}

/**
 * 设置抽屉组件（从顶部栏下方向下展开）
 * - 顶部定位在 TopBar 下方，层级最高
 * - 支持点击遮罩区域关闭
 * - 抽屉底边水平居中放置关闭按钮（X）
 * - 内含设置项：速查表位置（下/左/右），变更后立即回调生效
 */
const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  quickRefPosition,
  onChangeQuickRefPosition,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getDeepSeekApiKey().then(key => setApiKey(key || ''));
    }
  }, [isOpen]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setApiKey(newValue);
    saveDeepSeekApiKey(newValue);
  };

  /**
   * 处理遮罩点击
   * 若点击的是遮罩（非抽屉内容），则关闭设置抽屉
   *
   * @returns void
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    onClose();
  };

  /**
   * 阻止内容区域事件冒泡，避免误关闭
   *
   * @param e React.MouseEvent<HTMLDivElement>
   * @returns void
   */
  const stopPropagation = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  /**
   * 渲染速查表位置单选项
   *
   * @param label string 选项显示文案
   * @param value QuickRefPosition 对应枚举值
   * @returns JSX.Element
   */
  const renderOption = (label: string, value: QuickRefPosition): JSX.Element => {
    const active = quickRefPosition === value;
    return (
      <button
        type="button"
        onClick={() => onChangeQuickRefPosition(value)}
        className={`px-3 py-1 rounded-md border border-transparent text-sm transition-colors ${
          active
            ? 'bg-[var(--color-primary)] text-white border-transparent'
            : 'bg-[var(--color-bg-card)] text-[var(--color-text)]  hover:border-[var(--color-primary)]'
        }`}
        style={{
          borderRadius: '0',
        }}
        aria-pressed={active}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[45] bg-transparent"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-[var(--topbar-h)] left-0 right-0 z-[48] transform transition-transform duration-200 ${
          isOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
        role="dialog"
        aria-modal={isOpen}
        aria-label="设置面板"
        onClick={stopPropagation}
      >
        <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)] max-h-[calc(100vh-var(--topbar-h)-var(--bottombar-h))] overflow-y-auto no-scrollbar">
          <div className="max-w-3xl mx-auto p-4 pb-0 bg-[var(--color-surface)] rounded-none min-h-[calc(15vh)]">

            <div className="mb-4 justify-center flex"><SettingBoardIcon /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 速查表位置设置 */}
              <div>
                <div className="text-[var(--color-text)] mb-2 font-medium">速查表位置</div>
                <div className="flex items-center gap-0">
                  {renderOption('下', 'bottom')}
                  {renderOption('左', 'left')}
                  {renderOption('右', 'right')}
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">更改后，速查表唤起时将在所选位置显示。</p>
              </div>

              {/* API 设置 */}
              <div>
                <div className="text-[var(--color-text)] mb-2 font-medium">API 设置 (DeepSeek)</div>
                <form 
                  className="relative"
                  onSubmit={(e) => e.preventDefault()}
                  autoComplete="off"
                >
                  <input
                    type="text"
                    name="deepseek-username"
                    autoComplete="username"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
                  />
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="输入 API Key (sk-...)"
                    autoComplete="new-password"
                    name="deepseek-api-key"
                    className="w-full px-2 py-1 text-sm bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    {showKey ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </form>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Key 仅保存在本地浏览器。如未设置，将尝试使用默认配置。
                </p>
              </div>
            </div>

          </div>
          {/* 底边居中关闭按钮 */}
          <div className="flex justify-center">
            <button
              type="button"
              className="hover:text-[var(--color-primary)] focus:outline-none p-2"
              onClick={onClose}
              aria-label="关闭设置"
              title="关闭设置"
            >
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 10l10 10l-1.4 1.4l-8.6-8.6l-8.6 8.6L6 20z" fill="currentColor"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsDrawer;
