/**
 * Modal 组件
 * 带有缩放+淡入/淡出动画的模态窗口
 * 
 * Requirements: 2.4, 2.5, 2.6
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { durationValues, easings } from '../../design/tokens';
import { useReducedMotion } from './index';

// ============================================
// 类型定义
// ============================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 子元素 */
  children: React.ReactNode;
  /** 尺寸 */
  size?: ModalSize;
  /** 标题 */
  title?: string;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 点击遮罩是否关闭 */
  closeOnOverlayClick?: boolean;
  /** 按 ESC 是否关闭 */
  closeOnEsc?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 遮罩类名 */
  overlayClassName?: string;
  /** 打开动画完成回调 */
  onOpened?: () => void;
  /** 关闭动画完成回调 */
  onClosed?: () => void;
}

// ============================================
// 尺寸配置
// ============================================

const sizeStyles: Record<ModalSize, React.CSSProperties> = {
  sm: {
    maxWidth: '400px',
    width: '90%',
  },
  md: {
    maxWidth: '600px',
    width: '90%',
  },
  lg: {
    maxWidth: '800px',
    width: '90%',
  },
  xl: {
    maxWidth: '1000px',
    width: '90%',
  },
  full: {
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    margin: 0,
    borderRadius: 0,
  },
};

// ============================================
// Modal 组件
// ============================================

/**
 * Modal 组件
 * 
 * Requirements:
 * - 2.4: 模态窗口打开时使用缩放+淡入动画（从 95% 缩放到 100%）
 * - 2.5: 模态窗口关闭时使用缩放+淡出动画（从 100% 缩放到 95%）
 * - 2.6: 尊重用户的 prefers-reduced-motion 系统设置
 */
export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  title,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
  overlayClassName = '',
  onOpened,
  onClosed,
}: ModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [shouldRender, setShouldRender] = useState(false);
  const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting' | 'exited'>('exited');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const duration = prefersReducedMotion ? 0 : durationValues.normal;

  // 处理打开/关闭动画
  useEffect(() => {
    if (isOpen) {
      // 保存当前焦点元素
      previousActiveElement.current = document.activeElement;
      
      setShouldRender(true);
      // 使用 requestAnimationFrame 确保 DOM 已更新
      requestAnimationFrame(() => {
        setAnimationState('entering');
        
        const timer = setTimeout(() => {
          setAnimationState('entered');
          onOpened?.();
          // 聚焦到模态框
          modalRef.current?.focus();
        }, duration);
        
        return () => clearTimeout(timer);
      });
    } else if (shouldRender) {
      setAnimationState('exiting');
      
      const timer = setTimeout(() => {
        setAnimationState('exited');
        setShouldRender(false);
        onClosed?.();
        // 恢复之前的焦点
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onOpened, onClosed, shouldRender]);

  // 处理 ESC 键关闭
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // 锁定背景滚动
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 处理遮罩点击
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // 不渲染
  if (!shouldRender) {
    return null;
  }

  // 计算动画样式
  const getOverlayStyles = (): React.CSSProperties => {
    const isAnimating = animationState === 'entering' || animationState === 'exiting';
    
    return {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      opacity: animationState === 'entering' || animationState === 'exited' ? 0 : 1,
      transition: isAnimating ? `opacity ${duration}ms ${easings.easeOut}` : undefined,
    };
  };

  const getModalStyles = (): React.CSSProperties => {
    const isAnimating = animationState === 'entering' || animationState === 'exiting';
    const isHidden = animationState === 'entering' || animationState === 'exited';
    
    return {
      ...sizeStyles[size],
      backgroundColor: 'var(--bg-primary, #ffffff)',
      borderRadius: size === 'full' ? 0 : '12px',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      maxHeight: size === 'full' ? '100%' : '90vh',
      display: 'flex',
      flexDirection: 'column',
      outline: 'none',
      opacity: isHidden ? 0 : 1,
      transform: isHidden ? 'scale(0.95)' : 'scale(1)',
      transition: isAnimating
        ? `opacity ${duration}ms ${easings.easeOut}, transform ${duration}ms ${easings.easeOut}`
        : undefined,
    };
  };

  const modalContent = (
    <div
      style={getOverlayStyles()}
      className={overlayClassName}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        style={getModalStyles()}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {/* 头部 */}
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color, #e4e4e7)',
              flexShrink: 0,
            }}
          >
            {title && (
              <h2
                id="modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #18181b)',
                }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary, #71717a)',
                  transition: `background-color ${durationValues.fast}ms ${easings.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f4f4f5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="关闭"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5L5 15M5 5l10 10" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* 内容区域 */}
        <div
          style={{
            padding: '24px',
            overflow: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body
  return createPortal(modalContent, document.body);
}

// ============================================
// 导出
// ============================================

export default Modal;
