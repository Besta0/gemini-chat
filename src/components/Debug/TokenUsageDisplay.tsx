/**
 * Token 使用量显示组件
 * 需求: 7.2, 7.3, 2.1, 2.2, 2.3, 2.4
 * 
 * 显示单条消息的 Token 使用量和对话累计 Token 使用量
 * 支持显示思维链 Token（紫色样式）
 */


import type { TokenUsage } from '../../stores/debug';
import { formatTokenCount, isValidTokenUsage } from '../../services/tokenUsage';

/**
 * 扩展的 Token 使用量类型，支持思维链 Token
 * 需求: 2.1
 */
export interface ExtendedTokenUsage extends TokenUsage {
  /** 思维链 Token 数 */
  thoughtsTokens?: number;
}

// ============ 类型定义 ============

interface TokenUsageDisplayProps {
  /** Token 使用量数据（支持扩展的思维链 Token） */
  tokenUsage: ExtendedTokenUsage | TokenUsage | null | undefined;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

interface TokenUsageSummaryProps {
  /** 累计 Token 使用量 */
  totalUsage: ExtendedTokenUsage | TokenUsage;
  /** 自定义类名 */
  className?: string;
}

// ============ 单条消息 Token 显示 ============

/**
 * Token 使用量显示
 * 需求: 7.2, 2.1, 2.2, 2.3, 2.4
 */
export function TokenUsageDisplay({
  tokenUsage,
  compact = false,
  className = '',
}: TokenUsageDisplayProps) {
  // 数据不可用时显示提示
  if (!tokenUsage || !isValidTokenUsage(tokenUsage)) {
    if (compact) {
      return null;
    }
    return (
      <div className={`text-sm text-neutral-500 dark:text-neutral-400 ${className}`}>
        Token 数据不可用
      </div>
    );
  }

  // 获取思维链 Token 数（如果存在）
  const thoughtsTokens = 'thoughtsTokens' in tokenUsage ? tokenUsage.thoughtsTokens : undefined;
  const hasThoughtsTokens = thoughtsTokens !== undefined && thoughtsTokens > 0;

  // 紧凑模式
  // 需求: 2.4 - 紧凑模式显示总 Token（包括思维链 Token）
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <TokenIcon />
        <span className="text-neutral-600 dark:text-neutral-400">
          {formatTokenCount(tokenUsage.totalTokens)} tokens
          {hasThoughtsTokens && (
            <span className="text-purple-600 dark:text-purple-400 ml-1">
              (+{formatTokenCount(thoughtsTokens)} 思考)
            </span>
          )}
        </span>
      </div>
    );
  }

  // 完整模式
  // 需求: 2.1 - 显示输入、输出、思维链、总计四项 Token
  // 需求: 2.2 - 思维链 Token 使用紫色样式
  // 需求: 2.3 - 仅当 thoughtsTokens > 0 时显示思维链行
  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <TokenIcon />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Token 使用量
        </span>
      </div>

      <div className={`grid gap-4 ${hasThoughtsTokens ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <TokenStatItem
          label="输入"
          value={tokenUsage.promptTokens}
          color="text-blue-600 dark:text-blue-400"
        />
        <TokenStatItem
          label="输出"
          value={tokenUsage.completionTokens}
          color="text-green-600 dark:text-green-400"
        />
        {/* 需求: 2.2, 2.3 - 思维链 Token 显示（紫色样式，仅当 > 0 时显示） */}
        {hasThoughtsTokens && (
          <TokenStatItem
            label="思考"
            value={thoughtsTokens}
            color="text-purple-600 dark:text-purple-400"
          />
        )}
        <TokenStatItem
          label="总计"
          value={tokenUsage.totalTokens}
          color="text-primary-600 dark:text-primary-400"
          highlight
        />
      </div>
    </div>
  );
}

// ============ 对话累计 Token 显示 ============

/**
 * 对话累计 Token 使用量显示
 * 需求: 7.3, 2.1, 2.2, 2.3
 */
export function TokenUsageSummary({
  totalUsage,
  className = '',
}: TokenUsageSummaryProps) {
  if (!isValidTokenUsage(totalUsage)) {
    return null;
  }

  // 获取思维链 Token 数（如果存在）
  const thoughtsTokens = 'thoughtsTokens' in totalUsage ? totalUsage.thoughtsTokens : undefined;
  const hasThoughtsTokens = thoughtsTokens !== undefined && thoughtsTokens > 0;

  return (
    <div className={`p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <TokenIcon />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          对话累计 Token
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">输入</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatTokenCount(totalUsage.promptTokens)}
            </p>
          </div>
          <div className="text-neutral-300 dark:text-neutral-600">+</div>
          <div className="text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">输出</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatTokenCount(totalUsage.completionTokens)}
            </p>
          </div>
          {/* 需求: 2.2, 2.3 - 思维链 Token 显示（紫色样式，仅当 > 0 时显示） */}
          {hasThoughtsTokens && (
            <>
              <div className="text-neutral-300 dark:text-neutral-600">+</div>
              <div className="text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">思考</p>
                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {formatTokenCount(thoughtsTokens)}
                </p>
              </div>
            </>
          )}
          <div className="text-neutral-300 dark:text-neutral-600">=</div>
          <div className="text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">总计</p>
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {formatTokenCount(totalUsage.totalTokens)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Token 统计项组件 ============

interface TokenStatItemProps {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}

function TokenStatItem({ label, value, color, highlight }: TokenStatItemProps) {
  return (
    <div className={`text-center p-2 rounded ${highlight ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>
        {formatTokenCount(value)}
      </p>
    </div>
  );
}

// ============ 图标组件 ============

function TokenIcon() {
  return (
    <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

export default TokenUsageDisplay;
