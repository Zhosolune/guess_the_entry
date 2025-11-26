import React, { useState, useEffect } from 'react';
import { GameInfoText } from '../assets/gameInfo';
import { PasteIcon } from '../assets/pasteIcon';
import { toast } from 'sonner';

interface GameInfoDrawerProps {
  /**
   * 是否打开游戏信息抽屉
   */
  isOpen: boolean;
  /**
   * 关闭抽屉的回调
   */
  onClose: () => void;
}

/**
 * 游戏信息抽屉组件（从顶部栏下方向下展开）
 * - 顶部定位在 TopBar 下方，层级最高
 * - 支持点击遮罩区域关闭
 * - 抽屉底边水平居中放置关闭按钮（X）
 * - 内含游戏信息项：当前词条、游戏状态、游戏进度
 */
const GameInfoDrawer: React.FC<GameInfoDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  /**
   * 处理遮罩点击
   * 若点击的是遮罩（非抽屉内容），则关闭游戏信息抽屉
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

  const [inviteCode, setInviteCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const verified = localStorage.getItem('site_verification_passed') === 'true';
    if (verified) {
      setVerificationStatus('success');
      setInviteCode('CGJB');
    }
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setInviteCode(val);
    if (verificationStatus !== 'idle') {
      setVerificationStatus('idle');
    }
  };

  const handleVerify = () => {
    if (inviteCode === 'CGJB') {
      localStorage.setItem('site_verification_passed', 'true');
      setVerificationStatus('success');
    } else {
      localStorage.removeItem('site_verification_passed');
      setVerificationStatus('error');
    }
  };

  /**
   * 处理粘贴功能
   */
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInviteCode(text.trim().toUpperCase());
        if (verificationStatus !== 'idle') {
          setVerificationStatus('idle');
        }
        toast.success('已粘贴剪贴板内容');
      }
    } catch (err) {
      console.error('无法读取剪贴板:', err);
      toast.error('无法读取剪贴板内容');
    }
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

      {/* 抽屉本体：位于 TopBar 下方，滑动进入 */}
      <div
        className={`fixed top-[var(--topbar-h)] left-0 right-0 z-[48] transform transition-transform duration-200 ${
          isOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
        role="dialog"
        aria-modal={isOpen}
        aria-label="游戏信息面板"
        onClick={stopPropagation}
      >
        <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div className="max-w-2xl mx-auto px-3 section pb-0 bg-[var(--color-surface)] rounded-none min-h-[calc(15vh)]">
            <div className="mb-4 mx-auto max-w-2xl justify-center flex"><GameInfoText /></div>
            <div className="space-y-2 text-[var(--color-text-muted)]">
              <p>1、选择一个你感兴趣的领域，系统将随机生成一个词条</p>
              <p>2、输入单个汉字进行猜测，正确的字符会显示出来</p>
              <p>3、猜错的字符会被添加到“坟场”区域</p>
              <p>4、完全揭示词条内容即可获胜！</p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                邀请码验证（启用内置模型）
              </label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={handleCodeChange}
                    placeholder="请输入邀请码"
                    className="w-full px-3 py-2 pr-10 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none transition-colors uppercase"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerify();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors p-1"
                    title="粘贴剪贴板内容"
                  >
                    <PasteIcon />
                  </button>
                </div>
                <button
                  onClick={handleVerify}
                  disabled={inviteCode.length !== 4}
                  className={`p-2 text-white rounded transition-all ${
                    verificationStatus === 'success' 
                      ? 'bg-green-500 hover:opacity-90' 
                      : verificationStatus === 'error'
                      ? 'bg-red-500 hover:opacity-90'
                      : inviteCode.length !== 4
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[var(--color-primary)] hover:opacity-90'
                  }`}
                  aria-label="验证邀请码"
                >
                  {verificationStatus === 'success' ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : verificationStatus === 'error' ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                输入正确的邀请码并点击确认后，将解锁内置的大模型。如果您拥有自己的 DeepSeek API Key，可以在设置中配置，无需邀请码。
              </p>
            </div>

          </div>
          {/* 底边居中关闭按钮 */}
          <div className="flex justify-center">
            <button
              type="button"
              className="hover:text-[var(--color-primary)] focus:outline-none p-2"
              onClick={onClose}
              aria-label="关闭游戏信息"
              title="关闭游戏信息"
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

export default GameInfoDrawer;
