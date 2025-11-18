import React from 'react';
import { SettingBoardIcon } from '../assets/settingBoard';

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
        <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div className="max-w-2xl mx-auto p-4 pb-0 bg-[var(--color-surface)] rounded-none min-h-[calc(15vh)]">

            <div className="mb-4 justify-center flex"><SettingBoardIcon /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 速查表位置设置 */}
              <div>
                <div className="text-[var(--color-text)] mb-2">速查表位置</div>
                <div className="flex items-center gap-0">
                  {renderOption('下', 'bottom')}
                  {renderOption('左', 'left')}
                  {renderOption('右', 'right')}
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">更改后，速查表唤起时将在所选位置显示。</p>
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