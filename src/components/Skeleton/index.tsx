/**
 * 骨架屏组件库
 * 提供加载状态的占位符组件
 * 
 * Requirements: 11.2, 11.3, 11.4
 */

import React from 'react';

// ============================================
// 基础骨架屏组件
// ============================================

export interface SkeletonProps {
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 圆角 */
  borderRadius?: string | number;
  /** 是否为圆形 */
  circle?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否启用动画 */
  animate?: boolean;
}

/**
 * 通用骨架屏组件
 * 显示闪烁动画表示加载中状态
 * 
 * Requirements: 11.4 - 骨架屏使用闪烁动画表示加载中状态
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  circle = false,
  className = '',
  animate = true,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : (typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius),
  };

  return (
    <div
      className={`
        bg-slate-200 dark:bg-slate-700
        ${animate ? 'animate-skeleton-pulse' : ''}
        ${className}
      `.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}


// ============================================
// 文本骨架屏
// ============================================

export interface SkeletonTextProps {
  /** 行数 */
  lines?: number;
  /** 最后一行宽度百分比 */
  lastLineWidth?: string;
  /** 行间距 */
  gap?: string | number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 文本骨架屏组件
 * 模拟多行文本的加载状态
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  gap = '8px',
  className = '',
}: SkeletonTextProps) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ gap: typeof gap === 'number' ? `${gap}px` : gap }}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height="0.875rem"
        />
      ))}
    </div>
  );
}

// ============================================
// 头像骨架屏
// ============================================

export interface SkeletonAvatarProps {
  /** 尺寸 */
  size?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 头像骨架屏组件
 */
export function SkeletonAvatar({
  size = 40,
  className = '',
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      circle
      className={className}
    />
  );
}

// ============================================
// 对话列表骨架屏
// ============================================

export interface ChatWindowSkeletonProps {
  /** 显示数量 */
  count?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 对话列表骨架屏组件
 * 模拟聊天窗口卡片列表的加载状态
 * 
 * Requirements: 11.2 - 对话列表加载时显示骨架屏占位符
 */
export function ChatWindowSkeleton({
  count = 5,
  className = '',
}: ChatWindowSkeletonProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ChatWindowCardSkeleton key={index} delay={index * 100} />
      ))}
    </div>
  );
}

/**
 * 单个聊天窗口卡片骨架屏
 */
function ChatWindowCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-2">
        <Skeleton width="60%" height="1rem" borderRadius="4px" />
        <Skeleton width="40px" height="0.75rem" borderRadius="4px" />
      </div>
      {/* 模型标签 */}
      <div className="flex items-center gap-2 mb-2">
        <Skeleton width="80px" height="1.25rem" borderRadius="9999px" />
      </div>
      {/* 时间戳 */}
      <Skeleton width="100px" height="0.75rem" borderRadius="4px" />
    </div>
  );
}


// ============================================
// 消息列表骨架屏
// ============================================

export interface MessageSkeletonProps {
  /** 显示数量 */
  count?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 消息列表骨架屏组件
 * 模拟消息历史的加载状态
 * 
 * Requirements: 11.3 - 消息历史加载时显示消息骨架屏
 */
export function MessageSkeleton({
  count = 6,
  className = '',
}: MessageSkeletonProps) {
  // 生成交替的用户/AI消息模式
  const messages = Array.from({ length: count }).map((_, index) => ({
    isUser: index % 2 === 0,
    lines: index % 2 === 0 ? 1 : Math.floor(Math.random() * 2) + 2,
  }));

  return (
    <div className={`flex flex-col gap-4 p-4 ${className}`}>
      {messages.map((msg, index) => (
        <MessageBubbleSkeleton
          key={index}
          isUser={msg.isUser}
          lines={msg.lines}
          delay={index * 80}
        />
      ))}
    </div>
  );
}

/**
 * 单个消息气泡骨架屏
 */
function MessageBubbleSkeleton({
  isUser,
  lines = 2,
  delay = 0,
}: {
  isUser: boolean;
  lines?: number;
  delay?: number;
}) {
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`
          max-w-[70%] p-3 rounded-lg
          ${isUser
            ? 'bg-blue-100 dark:bg-blue-900/30 rounded-br-sm'
            : 'bg-slate-100 dark:bg-slate-800 rounded-bl-sm'
          }
        `}
      >
        {/* 消息内容 */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              width={index === lines - 1 ? '70%' : '100%'}
              height="0.875rem"
              borderRadius="4px"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 侧边栏骨架屏
// ============================================

export interface SidebarSkeletonProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * 侧边栏骨架屏组件
 * 包含搜索栏和对话列表的完整骨架屏
 */
export function SidebarSkeleton({ className = '' }: SidebarSkeletonProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 搜索栏骨架屏 */}
      <div className="p-3">
        <Skeleton width="100%" height="40px" borderRadius="8px" />
      </div>
      {/* 新建按钮骨架屏 */}
      <div className="px-3 pb-3">
        <Skeleton width="100%" height="36px" borderRadius="8px" />
      </div>
      {/* 对话列表骨架屏 */}
      <div className="flex-1 overflow-hidden px-3">
        <ChatWindowSkeleton count={6} />
      </div>
    </div>
  );
}

// ============================================
// 聊天区域骨架屏
// ============================================

export interface ChatAreaSkeletonProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * 聊天区域骨架屏组件
 * 包含子话题标签、消息列表和输入框的完整骨架屏
 */
export function ChatAreaSkeleton({ className = '' }: ChatAreaSkeletonProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 顶部工具栏骨架屏 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Skeleton width="120px" height="1.25rem" borderRadius="4px" />
          <Skeleton width="80px" height="1.5rem" borderRadius="9999px" />
        </div>
        <Skeleton width="32px" height="32px" borderRadius="8px" />
      </div>
      
      {/* 子话题标签骨架屏 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === 0 ? '80px' : '60px'}
            height="32px"
            borderRadius="8px"
          />
        ))}
        <Skeleton width="32px" height="32px" borderRadius="8px" />
      </div>
      
      {/* 消息列表骨架屏 */}
      <div className="flex-1 overflow-hidden">
        <MessageSkeleton count={5} />
      </div>
      
      {/* 输入框骨架屏 */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-end gap-3">
          <Skeleton width="100%" height="44px" borderRadius="12px" className="flex-1" />
          <Skeleton width="44px" height="44px" borderRadius="12px" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// 设置面板骨架屏
// ============================================

export interface SettingsSkeletonProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * 设置面板骨架屏组件
 */
export function SettingsSkeleton({ className = '' }: SettingsSkeletonProps) {
  return (
    <div className={`flex h-full ${className}`}>
      {/* 左侧导航骨架屏 */}
      <div className="w-[200px] border-r border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              width="100%"
              height="40px"
              borderRadius="8px"
            />
          ))}
        </div>
      </div>
      
      {/* 右侧内容骨架屏 */}
      <div className="flex-1 p-6">
        {/* 标题 */}
        <Skeleton width="200px" height="1.5rem" borderRadius="4px" className="mb-6" />
        
        {/* 表单项 */}
        <div className="flex flex-col gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton width="100px" height="0.875rem" borderRadius="4px" />
              <Skeleton width="100%" height="40px" borderRadius="8px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
