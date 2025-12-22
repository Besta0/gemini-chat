/**
 * InlineMessageEditor 组件属性测试
 * Feature: message-editing-improvements
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { InlineMessageEditor } from './InlineMessageEditor';
import type { Message } from '../../types/models';

describe('InlineMessageEditor 属性测试', () => {
  /**
   * Feature: message-editing-improvements, Property 2: 文本区域高度自适应
   * 验证: 需求 1.3
   * 
   * 对于任意内容长度，编辑器的文本区域应该配置正确的 CSS 属性以支持高度自适应
   */
  it('属性 2: 文本区域高度自适应', () => {
    fc.assert(
      fc.property(
        // 生成随机消息
        fc.record({
          id: fc.uuid(),
          role: fc.constant('user' as const),
          content: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        fc.boolean(), // isLastUserMessage
        (message: Message, isLastUserMessage: boolean) => {
          const onSave = vi.fn();
          const onSaveAndResend = vi.fn();
          const onCancel = vi.fn();

          // 渲染组件
          const { container } = render(
            <InlineMessageEditor
              message={message}
              isLastUserMessage={isLastUserMessage}
              onSave={onSave}
              onSaveAndResend={onSaveAndResend}
              onCancel={onCancel}
            />
          );

          // 查找文本区域
          const textarea = container.querySelector('textarea');
          expect(textarea).toBeTruthy();

          if (textarea) {
            // 验证 textarea 的关键 CSS 属性
            const className = textarea.className;
            
            // 1. 验证 overflow 设置为 hidden（避免滚动条）
            expect(className).toContain('overflow-hidden');
            
            // 2. 验证 resize 设置为 none（禁止手动调整大小）
            expect(className).toContain('resize-none');
            
            // 3. 验证初始内容已正确设置
            expect(textarea.value).toBe(message.content);
            
            // 4. 验证 rows 属性设置为 1（初始单行）
            expect(textarea.rows).toBe(1);
          }
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });

  /**
   * Feature: message-editing-improvements, Property 6: Escape键取消编辑
   * 验证: 需求 3.1
   * 
   * 对于任意编辑中的消息，按Escape键应该取消编辑并恢复原始内容
   */
  it('属性 6: Escape键取消编辑', () => {
    fc.assert(
      fc.property(
        // 生成随机消息
        fc.record({
          id: fc.uuid(),
          role: fc.constant('user' as const),
          content: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        fc.boolean(), // isLastUserMessage
        (message: Message, isLastUserMessage: boolean) => {
          const onSave = vi.fn();
          const onSaveAndResend = vi.fn();
          const onCancel = vi.fn();

          // 渲染组件
          const { container } = render(
            <InlineMessageEditor
              message={message}
              isLastUserMessage={isLastUserMessage}
              onSave={onSave}
              onSaveAndResend={onSaveAndResend}
              onCancel={onCancel}
            />
          );

          // 查找文本区域
          const textarea = container.querySelector('textarea');
          expect(textarea).toBeTruthy();

          if (textarea) {
            // 模拟按下 Escape 键
            fireEvent.keyDown(textarea, {
              key: 'Escape',
              bubbles: true,
              cancelable: true,
            });

            // 验证 onCancel 被调用
            expect(onCancel).toHaveBeenCalledTimes(1);
            
            // 验证 onSave 和 onSaveAndResend 没有被调用
            expect(onSave).not.toHaveBeenCalled();
            expect(onSaveAndResend).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });

  /**
   * Feature: message-editing-improvements, Property 7: Ctrl+Enter触发正确操作
   * 验证: 需求 3.2
   * 
   * 对于任意编辑中的消息，按Ctrl+Enter应该根据消息位置触发保存或保存并重新发送
   */
  it('属性 7: Ctrl+Enter触发正确操作', () => {
    fc.assert(
      fc.property(
        // 生成随机消息和修改后的内容（确保不同）
        fc.tuple(
          fc.record({
            id: fc.uuid(),
            role: fc.constant('user' as const),
            content: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
            timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
          }),
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0)
        ).filter(([msg, newContent]) => msg.content !== newContent),
        fc.boolean(), // isLastUserMessage
        ([message, newContent]: [Message, string], isLastUserMessage: boolean) => {
          const onSave = vi.fn();
          const onSaveAndResend = vi.fn();
          const onCancel = vi.fn();

          // 渲染组件
          const { container } = render(
            <InlineMessageEditor
              message={message}
              isLastUserMessage={isLastUserMessage}
              onSave={onSave}
              onSaveAndResend={onSaveAndResend}
              onCancel={onCancel}
            />
          );

          // 查找文本区域
          const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
          expect(textarea).toBeTruthy();

          if (textarea) {
            // 修改内容 - 使用 fireEvent.change 来正确触发 React 的 onChange
            fireEvent.change(textarea, { target: { value: newContent } });

            // 模拟按下 Ctrl+Enter 键
            fireEvent.keyDown(textarea, {
              key: 'Enter',
              ctrlKey: true,
              bubbles: true,
              cancelable: true,
            });

            // 根据消息位置验证正确的回调被调用
            if (isLastUserMessage) {
              // 最后一条消息应该调用 onSaveAndResend
              expect(onSaveAndResend).toHaveBeenCalledTimes(1);
              expect(onSaveAndResend).toHaveBeenCalledWith(newContent);
              expect(onSave).not.toHaveBeenCalled();
            } else {
              // 历史消息应该调用 onSave
              expect(onSave).toHaveBeenCalledTimes(1);
              expect(onSave).toHaveBeenCalledWith(newContent);
              expect(onSaveAndResend).not.toHaveBeenCalled();
            }
            
            // onCancel 不应该被调用
            expect(onCancel).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });

  /**
   * Feature: message-editing-improvements, Property 8: 空白内容验证
   * 验证: 需求 3.3
   * 
   * 对于任意由空白字符组成的字符串，尝试保存时应该被拒绝并显示错误提示
   */
  it('属性 8: 空白内容验证', () => {
    fc.assert(
      fc.property(
        // 生成随机消息
        fc.record({
          id: fc.uuid(),
          role: fc.constant('user' as const),
          content: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        // 生成空白字符串（空格、制表符、换行符等）
        fc.stringMatching(/^[\s]+$/),
        fc.boolean(), // isLastUserMessage
        (message: Message, whitespaceContent: string, isLastUserMessage: boolean) => {
          const onSave = vi.fn();
          const onSaveAndResend = vi.fn();
          const onCancel = vi.fn();

          // 渲染组件
          const { container } = render(
            <InlineMessageEditor
              message={message}
              isLastUserMessage={isLastUserMessage}
              onSave={onSave}
              onSaveAndResend={onSaveAndResend}
              onCancel={onCancel}
            />
          );

          // 查找文本区域
          const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
          expect(textarea).toBeTruthy();

          if (textarea) {
            // 修改内容为空白字符串
            fireEvent.change(textarea, { target: { value: whitespaceContent } });

            // 查找保存按钮（根据消息位置不同，按钮文本不同）
            const buttons = container.querySelectorAll('button');
            const saveButton = Array.from(buttons).find(btn => 
              btn.textContent?.includes('保存') && !btn.textContent?.includes('取消')
            );

            // 尝试点击保存按钮
            if (saveButton) {
              fireEvent.click(saveButton);
            }

            // 验证回调没有被调用（因为内容验证失败）
            expect(onSave).not.toHaveBeenCalled();
            expect(onSaveAndResend).not.toHaveBeenCalled();

            // 验证显示错误提示
            const errorMessage = container.querySelector('.text-red-500');
            expect(errorMessage).toBeTruthy();
            expect(errorMessage?.textContent).toContain('消息内容不能为空');
          }
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });

  /**
   * Feature: message-editing-improvements, Property 9: 相同内容不触发保存
   * 验证: 需求 3.4
   * 
   * 对于任意消息，如果编辑后的内容与原内容相同，应该直接退出编辑模式而不调用保存回调
   */
  it('属性 9: 相同内容不触发保存', () => {
    fc.assert(
      fc.property(
        // 生成随机消息
        fc.record({
          id: fc.uuid(),
          role: fc.constant('user' as const),
          content: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        fc.boolean(), // isLastUserMessage
        (message: Message, isLastUserMessage: boolean) => {
          const onSave = vi.fn();
          const onSaveAndResend = vi.fn();
          const onCancel = vi.fn();

          // 渲染组件
          const { container } = render(
            <InlineMessageEditor
              message={message}
              isLastUserMessage={isLastUserMessage}
              onSave={onSave}
              onSaveAndResend={onSaveAndResend}
              onCancel={onCancel}
            />
          );

          // 查找文本区域
          const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
          expect(textarea).toBeTruthy();

          if (textarea) {
            // 内容保持不变（初始值就是 message.content）
            // 查找保存按钮
            const buttons = container.querySelectorAll('button');
            const saveButton = Array.from(buttons).find(btn => 
              btn.textContent?.includes('保存') && !btn.textContent?.includes('取消')
            );

            // 点击保存按钮
            if (saveButton) {
              fireEvent.click(saveButton);
            }

            // 验证 onCancel 被调用（因为内容相同）
            expect(onCancel).toHaveBeenCalledTimes(1);

            // 验证 onSave 和 onSaveAndResend 没有被调用
            expect(onSave).not.toHaveBeenCalled();
            expect(onSaveAndResend).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });

  /**
   * 单元测试：验证不同位置显示正确按钮
   * 需求: 1.4, 1.5
   */
  describe('按钮显示逻辑', () => {
    it('最后一条消息只显示"保存并重新发送"按钮', () => {
      const message: Message = {
        id: 'test-1',
        role: 'user',
        content: '测试消息',
        timestamp: Date.now(),
      };

      const { container } = render(
        <InlineMessageEditor
          message={message}
          isLastUserMessage={true}
          onSave={vi.fn()}
          onSaveAndResend={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // 查找所有按钮
      const buttons = container.querySelectorAll('button');
      
      // 应该有 2 个按钮："保存并重新发送" 和 "取消"
      expect(buttons.length).toBe(2);
      
      // 验证按钮文本
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent);
      expect(buttonTexts).toContain('保存并重新发送');
      expect(buttonTexts).toContain('取消');
      expect(buttonTexts).not.toContain('仅保存');
    });

    it('历史消息显示"仅保存"和"保存并重新发送"两个按钮', () => {
      const message: Message = {
        id: 'test-2',
        role: 'user',
        content: '历史消息',
        timestamp: Date.now(),
      };

      const { container } = render(
        <InlineMessageEditor
          message={message}
          isLastUserMessage={false}
          onSave={vi.fn()}
          onSaveAndResend={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // 查找所有按钮
      const buttons = container.querySelectorAll('button');
      
      // 应该有 3 个按钮："仅保存"、"保存并重新发送" 和 "取消"
      expect(buttons.length).toBe(3);
      
      // 验证按钮文本
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent);
      expect(buttonTexts).toContain('仅保存');
      expect(buttonTexts).toContain('保存并重新发送');
      expect(buttonTexts).toContain('取消');
    });
  });
});
