/**
 * 聊天窗口顶部工具栏组件（简化版）
 * 仅显示标题和设置按钮
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { touchTargets } from '../../design/tokens';

// ============ 类型定义 ============

export interface ChatHeaderProps {
  /** 聊天窗口 ID */
  windowId: string;
  /** 窗口标题 */
  title: string;
  /** 打开配置面板回调 */
  onOpenConfig: () => void;
}

// ============ 主组件 ============

/**
 * 简化的聊天窗口顶部工具栏
 * 
 * Requirements:
 * - 6.1: 移除模型选择下拉菜单
 * - 6.2: 移除配置状态标签
 * - 6.3: 仅保留标题和设置按钮
 * - 6.4: 设置按钮点击打开毛玻璃配置面板
 */
export function ChatHeader({ windowId: _windowId, title, onOpenConfig }: ChatHeaderProps) {
  return (
    <div className="
      flex items-center justify-between px-4 py-3
      border-b border-neutral-200 dark:border-neutral-700
      bg-white dark:bg-neutral-900
    ">
      {/* 左侧：标题 */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-md">
          {title || '新程序'}
        </h1>
      </div>

      {/* 右侧：设置按钮 - Requirements: 6.4 */}
      <button
        onClick={onOpenConfig}
        className="
          p-2 rounded-lg
          hover:bg-neutral-100 dark:hover:bg-neutral-800
          text-neutral-500 dark:text-neutral-400
          hover:text-neutral-700 dark:hover:text-neutral-200
          transition-colors
        "
        style={{ minHeight: touchTargets.minimum, minWidth: touchTargets.minimum }}
        title="打开配置面板"
        aria-label="打开配置面板"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

// ============ 图标组件 ============

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export default ChatHeader;
