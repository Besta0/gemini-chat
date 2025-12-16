/**
 * 思考程度选择器组件
 * 用于选择 Gemini 3 Pro 的思考程度（low/high）
 * Requirements: 1.1, 1.2, 6.4
 */

import React from 'react';
import type { ThinkingLevel } from '../../types/models';

/**
 * 思考程度选择器属性
 */
export interface ThinkingLevelSelectorProps {
  /** 当前思考程度 */
  value: ThinkingLevel;
  /** 变更回调 */
  onChange: (level: ThinkingLevel) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 显示模式：完整或紧凑 */
  variant?: 'full' | 'compact';
}

/**
 * 思考程度选项配置
 */
const THINKING_LEVEL_OPTIONS: Array<{
  value: ThinkingLevel;
  label: string;
  description: string;
}> = [
  {
    value: 'low',
    label: '低',
    description: '快速响应，适合简单任务',
  },
  {
    value: 'high',
    label: '高',
    description: '深度推理，适合复杂问题',
  },
];

/**
 * 思考程度选择器组件
 * 支持 full 和 compact 两种显示模式
 */
export const ThinkingLevelSelector: React.FC<ThinkingLevelSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  variant = 'full',
}) => {
  // 紧凑模式：使用简单的按钮组
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-[var(--text-secondary)] mr-1">思考:</span>
        <div className="flex rounded-md overflow-hidden border border-[var(--border-primary)]">
          {THINKING_LEVEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`
                px-2 py-0.5 text-xs font-medium transition-colors
                ${value === option.value
                  ? 'bg-[var(--color-primary-500)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 完整模式：显示详细描述
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        思考程度
      </label>
      <div className="flex gap-2">
        {THINKING_LEVEL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 px-3 py-2 rounded-lg border-2 transition-all
              ${value === option.value
                ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]'
                : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="text-center">
              <div
                className={`
                  text-sm font-medium
                  ${value === option.value
                    ? 'text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]'
                    : 'text-[var(--text-primary)]'
                  }
                `}
              >
                {option.label}
              </div>
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThinkingLevelSelector;
