/**
 * Markdown 渲染组件
 * 需求: 9.1, 9.2, 9.3
 */

import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';

// 引入 KaTeX 样式
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * Markdown 渲染组件
 * 支持 GFM、代码高亮、数学公式渲染
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * 代码块组件（带复制按钮）
 * 需求: 9.2
 */
function CodeBlock({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  
  // 提取语言名称
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  
  // 获取代码文本
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [codeText]);

  return (
    <div className="relative group">
      {/* 语言标签和复制按钮 */}
      <div className="absolute top-0 right-0 flex items-center gap-2 px-2 py-1">
        {language && (
          <span className="text-xs text-slate-400 dark:text-slate-500 uppercase">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          title={copied ? '已复制' : '复制代码'}
        >
          {copied ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <CopyIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      <code className={className} {...props}>
        {children}
      </code>
    </div>
  );
}

/**
 * 自定义 Markdown 组件
 */
const markdownComponents: Components = {
  // 代码块
  // 需求: 9.2
  code({ className, children, ...props }) {
    const isInline = !className;
    
    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-pink-500 dark:text-pink-400 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <CodeBlock className={className} {...props}>
        {children}
      </CodeBlock>
    );
  },

  // 预格式化块
  pre({ children, ...props }) {
    return (
      <pre
        className="overflow-x-auto rounded-lg bg-slate-900 dark:bg-slate-950 p-4 my-4 text-sm"
        {...props}
      >
        {children}
      </pre>
    );
  },

  // 标题
  // 需求: 9.1
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-bold mt-6 mb-4 text-slate-900 dark:text-slate-100" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-bold mt-5 mb-3 text-slate-900 dark:text-slate-100" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-base font-semibold mt-3 mb-2 text-slate-900 dark:text-slate-100" {...props}>
      {children}
    </h4>
  ),

  // 段落
  p: ({ children, ...props }) => (
    <p className="my-2 leading-7" {...props}>
      {children}
    </p>
  ),

  // 列表
  // 需求: 9.1
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside my-2 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),

  // 链接
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
      {...props}
    >
      {children}
    </a>
  ),

  // 强调
  // 需求: 9.1
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // 引用块
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 my-4 italic text-slate-600 dark:text-slate-400"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // 水平线
  hr: (props) => (
    <hr className="my-6 border-slate-200 dark:border-slate-700" {...props} />
  ),

  // 表格（GFM）
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-slate-100 dark:bg-slate-800" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-700" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr {...props}>{children}</tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
      {...props}
    >
      {children}
    </td>
  ),

  // 图片
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt}
      className="max-w-full h-auto rounded-lg my-4"
      loading="lazy"
      {...props}
    />
  ),
};

// ============ 图标组件 ============

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export default MarkdownRenderer;
