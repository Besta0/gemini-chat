/**
 * 动画组件库
 * 提供流畅的交互动画组件和工具
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.6
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from 'react';
import { durationValues, easings } from '../../design/tokens';

// ============================================
// useReducedMotion Hook
// ============================================

/**
 * 检测用户是否偏好减少动画
 * 尊重用户的 prefers-reduced-motion 系统设置
 * 
 * Requirements: 2.6
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // 服务端渲染时默认返回 false
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // 监听系统设置变化
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

// ============================================
// 动画上下文
// ============================================

interface AnimationContextValue {
  /** 是否禁用动画 */
  disabled: boolean;
  /** 动画时长倍数 */
  durationMultiplier: number;
}

const AnimationContext = createContext<AnimationContextValue>({
  disabled: false,
  durationMultiplier: 1,
});

/**
 * 动画上下文提供者
 */
export function AnimationProvider({
  children,
  disabled = false,
  durationMultiplier = 1,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  durationMultiplier?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  
  const value = useMemo(() => ({
    disabled: disabled || prefersReducedMotion,
    durationMultiplier: prefersReducedMotion ? 0 : durationMultiplier,
  }), [disabled, prefersReducedMotion, durationMultiplier]);

  return React.createElement(
    AnimationContext.Provider,
    { value },
    children
  );
}

/**
 * 使用动画上下文
 */
export function useAnimationContext(): AnimationContextValue {
  return useContext(AnimationContext);
}

// ============================================
// 动画类型定义
// ============================================

export type AnimationType = 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown';

export interface AnimationConfig {
  /** 动画类型 */
  type: AnimationType;
  /** 动画时长（毫秒） */
  duration: number;
  /** 缓动函数 */
  easing: string;
  /** 延迟（毫秒） */
  delay?: number;
}

// ============================================
// AnimatedPresence 组件
// ============================================

export interface AnimatedPresenceProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 是否显示 */
  show: boolean;
  /** 动画类型 */
  animation?: AnimationType;
  /** 动画时长 */
  duration?: number;
  /** 进入动画完成回调 */
  onEntered?: () => void;
  /** 退出动画完成回调 */
  onExited?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 动画存在组件
 * 处理元素的进入和退出动画
 * 
 * Requirements: 2.2 - 页面元素出现或消失时使用淡入淡出动画
 */
export function AnimatedPresence({
  children,
  show,
  animation = 'fade',
  duration = durationValues.normal,
  onEntered,
  onExited,
  className = '',
}: AnimatedPresenceProps) {
  const { disabled, durationMultiplier } = useAnimationContext();
  const [shouldRender, setShouldRender] = useState(show);
  const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
    show ? 'entered' : 'exited'
  );
  const elementRef = useRef<HTMLDivElement>(null);

  const actualDuration = disabled ? 0 : duration * durationMultiplier;

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setAnimationState('entering');
      
      const timer = setTimeout(() => {
        setAnimationState('entered');
        onEntered?.();
      }, actualDuration);
      
      return () => clearTimeout(timer);
    } else {
      setAnimationState('exiting');
      
      const timer = setTimeout(() => {
        setAnimationState('exited');
        setShouldRender(false);
        onExited?.();
      }, actualDuration);
      
      return () => clearTimeout(timer);
    }
  }, [show, actualDuration, onEntered, onExited]);

  if (!shouldRender) {
    return null;
  }

  const getAnimationStyles = (): React.CSSProperties => {
    const isEntering = animationState === 'entering';
    const isExiting = animationState === 'exiting';
    const isAnimating = isEntering || isExiting;

    const baseStyles: React.CSSProperties = {
      transition: isAnimating
        ? `all ${actualDuration}ms ${easings.easeOut}`
        : undefined,
    };

    switch (animation) {
      case 'fade':
        return {
          ...baseStyles,
          opacity: isEntering || animationState === 'exited' ? 0 : 1,
        };
      
      case 'scale':
        return {
          ...baseStyles,
          opacity: isEntering || animationState === 'exited' ? 0 : 1,
          transform: isEntering || animationState === 'exited' 
            ? 'scale(0.95)' 
            : 'scale(1)',
        };
      
      case 'slide':
        return {
          ...baseStyles,
          opacity: isEntering || animationState === 'exited' ? 0 : 1,
          transform: isEntering || animationState === 'exited'
            ? 'translateX(20px)'
            : 'translateX(0)',
        };
      
      case 'slideUp':
        return {
          ...baseStyles,
          opacity: isEntering || animationState === 'exited' ? 0 : 1,
          transform: isEntering || animationState === 'exited'
            ? 'translateY(10px)'
            : 'translateY(0)',
        };
      
      case 'slideDown':
        return {
          ...baseStyles,
          opacity: isEntering || animationState === 'exited' ? 0 : 1,
          transform: isEntering || animationState === 'exited'
            ? 'translateY(-10px)'
            : 'translateY(0)',
        };
      
      default:
        return baseStyles;
    }
  };

  return React.createElement(
    'div',
    {
      ref: elementRef,
      className,
      style: getAnimationStyles(),
    },
    children
  );
}

// ============================================
// AnimatedList 组件
// ============================================

export interface AnimatedListProps<T> {
  /** 列表项数据 */
  items: T[];
  /** 获取唯一键 */
  keyExtractor: (item: T) => string;
  /** 渲染列表项 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** 动画类型 */
  animation?: 'slide' | 'fade';
  /** 动画时长 */
  duration?: number;
  /** 交错延迟（毫秒） */
  staggerDelay?: number;
  /** 容器类名 */
  className?: string;
  /** 列表项类名 */
  itemClassName?: string;
}

/**
 * 动画列表组件
 * 处理列表项的添加和删除动画
 * 
 * Requirements: 2.3 - 列表项被添加或删除时使用滑动动画过渡
 */
export function AnimatedList<T>({
  items,
  keyExtractor,
  renderItem,
  animation = 'slide',
  duration = durationValues.slow,
  staggerDelay = 50,
  className = '',
  itemClassName = '',
}: AnimatedListProps<T>) {
  const { disabled, durationMultiplier } = useAnimationContext();
  const [renderedItems, setRenderedItems] = useState<Map<string, { item: T; state: 'entering' | 'entered' | 'exiting' }>>(
    new Map()
  );
  const prevItemsRef = useRef<string[]>([]);

  const actualDuration = disabled ? 0 : duration * durationMultiplier;

  useEffect(() => {
    const currentKeys = items.map(keyExtractor);
    const prevKeys = prevItemsRef.current;

    // 找出新增的项
    const addedKeys = currentKeys.filter(key => !prevKeys.includes(key));
    // 找出删除的项
    const removedKeys = prevKeys.filter(key => !currentKeys.includes(key));

    setRenderedItems(prev => {
      const next = new Map(prev);

      // 标记删除的项为 exiting
      removedKeys.forEach(key => {
        const existing = next.get(key);
        if (existing) {
          next.set(key, { ...existing, state: 'exiting' });
        }
      });

      // 添加新项为 entering
      items.forEach((item) => {
        const key = keyExtractor(item);
        if (addedKeys.includes(key)) {
          next.set(key, { item, state: 'entering' });
        } else if (!removedKeys.includes(key)) {
          const existing = next.get(key);
          if (existing) {
            next.set(key, { item, state: existing.state === 'entering' ? 'entering' : 'entered' });
          } else {
            next.set(key, { item, state: 'entered' });
          }
        }
      });

      return next;
    });

    // 处理进入动画完成
    if (addedKeys.length > 0) {
      const timer = setTimeout(() => {
        setRenderedItems(prev => {
          const next = new Map(prev);
          addedKeys.forEach(key => {
            const existing = next.get(key);
            if (existing && existing.state === 'entering') {
              next.set(key, { ...existing, state: 'entered' });
            }
          });
          return next;
        });
      }, actualDuration);

      // 清理定时器
      const cleanup = () => clearTimeout(timer);
      prevItemsRef.current = currentKeys;
      return cleanup;
    }

    // 处理退出动画完成
    if (removedKeys.length > 0) {
      const timer = setTimeout(() => {
        setRenderedItems(prev => {
          const next = new Map(prev);
          removedKeys.forEach(key => {
            next.delete(key);
          });
          return next;
        });
      }, actualDuration);

      prevItemsRef.current = currentKeys;
      return () => clearTimeout(timer);
    }

    prevItemsRef.current = currentKeys;
  }, [items, keyExtractor, actualDuration]);

  // 初始化渲染项
  useEffect(() => {
    if (renderedItems.size === 0 && items.length > 0) {
      const initial = new Map<string, { item: T; state: 'entering' | 'entered' | 'exiting' }>();
      items.forEach(item => {
        initial.set(keyExtractor(item), { item, state: 'entered' });
      });
      setRenderedItems(initial);
      prevItemsRef.current = items.map(keyExtractor);
    }
  }, [items, keyExtractor, renderedItems.size]);

  const getItemStyles = (state: 'entering' | 'entered' | 'exiting', index: number): React.CSSProperties => {
    const delay = disabled ? 0 : index * staggerDelay;
    const isAnimating = state === 'entering' || state === 'exiting';

    const baseStyles: React.CSSProperties = {
      transition: isAnimating
        ? `all ${actualDuration}ms ${easings.easeOut} ${delay}ms`
        : undefined,
    };

    if (animation === 'slide') {
      return {
        ...baseStyles,
        opacity: state === 'entering' || state === 'exiting' ? 0 : 1,
        transform: state === 'entering'
          ? 'translateX(-20px)'
          : state === 'exiting'
            ? 'translateX(20px)'
            : 'translateX(0)',
      };
    }

    // fade 动画
    return {
      ...baseStyles,
      opacity: state === 'entering' || state === 'exiting' ? 0 : 1,
    };
  };

  // 按照原始顺序排列渲染项
  const orderedItems = items.map(item => {
    const key = keyExtractor(item);
    return renderedItems.get(key) || { item, state: 'entered' as const };
  });

  // 添加正在退出的项
  const exitingItems: Array<{ key: string; item: T; state: 'exiting' }> = [];
  renderedItems.forEach((value, key) => {
    if (value.state === 'exiting') {
      exitingItems.push({ key, item: value.item, state: 'exiting' });
    }
  });

  return React.createElement(
    'div',
    { className },
    [
      ...orderedItems.map(({ item, state }, index) =>
        React.createElement(
          'div',
          {
            key: keyExtractor(item),
            className: itemClassName,
            style: getItemStyles(state, index),
          },
          renderItem(item, index)
        )
      ),
      ...exitingItems.map(({ key, item, state }, exitIndex) =>
        React.createElement(
          'div',
          {
            key,
            className: itemClassName,
            style: getItemStyles(state, orderedItems.length + exitIndex),
          },
          renderItem(item, -1)
        )
      ),
    ]
  );
}

// ============================================
// 按钮涟漪效果 Hook
// ============================================

export interface RippleConfig {
  /** 涟漪颜色 */
  color?: string;
  /** 动画时长 */
  duration?: number;
}

/**
 * 按钮涟漪效果 Hook
 * 
 * Requirements: 2.1 - 用户点击按钮时显示涟漪效果
 */
export function useRipple(config: RippleConfig = {}) {
  const { disabled } = useAnimationContext();
  const { color = 'rgba(255, 255, 255, 0.3)', duration = durationValues.fast } = config;
  const containerRef = useRef<HTMLElement>(null);

  const createRipple = useCallback((event: React.MouseEvent) => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: ${color};
      border-radius: 50%;
      transform: scale(0);
      animation: ripple ${duration}ms ${easings.easeOut};
      pointer-events: none;
    `;

    // 添加动画关键帧
    if (!document.getElementById('ripple-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, duration);
  }, [disabled, color, duration]);

  return { containerRef, createRipple };
}

// ============================================
// 导出
// ============================================

export { durations, durationValues, easings } from '../../design/tokens';
