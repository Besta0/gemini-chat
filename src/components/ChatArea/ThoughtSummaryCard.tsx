/**
 * 思维链卡片组件
 * 显示模型的思考过程摘要，支持折叠/展开
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { useState, useRef, useEffect } from 'react';
import { useReducedMotion } from '../motion';
import { durationValues, easings } from '../../design/tokens';

// ============ 类型定义 ============

export interface ThoughtSummaryCardProps {
  /** 思维链内容 */
  content: string;
  /** 是否默认展开 */
  defaultExpanded?: boolean;
}

// ============ 主组件 ============

/**
 * 思维链卡片组件
 * 
 * Requirements:
 * - 6.1: 使用不同的背景色和边框样式与普通内容区分
 * - 6.2: 在摘要前显示"思考过程"标题
 * - 6.3: 支持折叠/展开功能
 * - 6.4: 平滑动画切换显示状态
 */
export function ThoughtSummaryCard({
  content,
  defaultExpanded = true,
}: ThoughtSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // 计算内容高度用于动画
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [content]);

  // 切换展开/折叠状态
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // 动画样式
  const transitionStyle = reducedMotion
    ? {}
    : {
        transition: `all ${durationValues.slow}ms ${easings.easeInOut}`,
      };

  return (
    <div
      className="
        mb-3 rounded-xl overflow-hidden
        bg-gradient-to-r from-purple-50 to-indigo-50
        dark:from-purple-900/20 dark:to-indigo-900/20
        border border-purple-200/60 dark:border-purple-700/40
        shadow-sm
      "
    >
      {/* 标题栏 - Requirements: 6.2, 6.3 */}
      <button
        onClick={handleToggle}
        className="
          w-full flex items-center justify-between
          px-4 py-3
          text-left
          hover:bg-purple-100/50 dark:hover:bg-purple-800/20
          transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50
        "
        aria-expanded={isExpanded}
        aria-controls="thought-content"
      >
        <div className="flex items-center gap-2">
          <ThinkingIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            思考过程
          </span>
        </div>
        <ChevronIcon
          className={`
            w-4 h-4 text-purple-500 dark:text-purple-400
            transform transition-transform duration-200
            ${isExpanded ? 'rotate-180' : 'rotate-0'}
          `}
        />
      </button>

      {/* 内容区域 - Requirements: 6.3, 6.4 */}
      <div
        id="thought-content"
        style={{
          ...transitionStyle,
          height: isExpanded ? contentHeight : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        className="overflow-hidden"
      >
        <div
          ref={contentRef}
          className="
            px-4 pb-4 pt-1
            text-sm text-purple-800/80 dark:text-purple-200/80
            leading-relaxed
            whitespace-pre-wrap break-words
          "
        >
          {content}
        </div>
      </div>
    </div>
  );
}

// ============ 图标组件 ============

/**
 * 思考图标 - 大脑/灯泡样式
 */
function ThinkingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

/**
 * 展开/折叠箭头图标
 */
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export default ThoughtSummaryCard;
