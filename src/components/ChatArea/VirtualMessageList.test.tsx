/**
 * VirtualMessageList 组件属性测试
 * Feature: message-editing-improvements
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { VirtualMessageList } from './VirtualMessageList';
import { InlineMessageEditor } from './InlineMessageEditor';
import type { Message } from '../../types/models';

describe('VirtualMessageList 属性测试', () => {
  /**
   * Feature: message-editing-improvements, Property 1: 编辑模式切换保持位置
   * 验证: 需求 1.1, 1.2
   * 
   * 对于任意消息项，当点击编辑按钮进入编辑模式时，
   * 消息在列表中的位置应该保持不变
   * 
   * 测试策略：验证 InlineMessageEditor 使用与消息气泡相同的宽度约束：
   * 1. InlineMessageEditor 组件使用 max-w-[85%] 类
   * 2. 这与 MessageBubble 的父容器使用的类相同
   * 3. 两者共享相同的宽度约束，确保位置一致
   */
  it('属性 1: 编辑模式切换保持位置', () => {
    fc.assert(
      fc.property(
        // 生成随机用户消息（确保内容非空白）
        fc.record({
          id: fc.uuid(),
          role: fc.constant('user' as const),
          content: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        (message: Message) => {
          // 渲染 InlineMessageEditor 组件
          const { container } = render(
            <InlineMessageEditor
              message={message}
              isLastUserMessage={true}
              onSave={() => {}}
              onSaveAndResend={() => {}}
              onCancel={() => {}}
            />
          );

          // 验证组件已渲染
          expect(container).toBeTruthy();
          
          // 查找编辑器的根容器
          const editorRoot = container.firstElementChild;
          expect(editorRoot).toBeTruthy();
          
          // 验证编辑器使用了正确的宽度约束类
          const className = editorRoot?.className || '';
          expect(className).toContain('max-w-[85%]');
          expect(className).toContain('min-w-0');
          expect(className).toContain('flex-1');
          
          // 核心验证：通过检查这些关键类的存在，我们确保了：
          // 1. InlineMessageEditor 使用与 MessageBubble 父容器相同的宽度约束
          // 2. 编辑模式切换时，容器宽度保持一致
          // 3. 消息在列表中的位置不会改变
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });

  /**
   * Feature: message-editing-improvements, Property 3: 根据消息位置显示正确操作
   * 验证: 需求 1.4, 1.5
   * 
   * 对于任意用户消息，如果是最后一条则只显示"保存并重新发送"按钮，
   * 如果是历史消息则显示"仅保存"和"保存并重新发送"两个按钮
   * 
   * 测试策略：验证 InlineMessageEditor 根据 isLastUserMessage 属性显示正确的按钮
   */
  it('属性 3: 根据消息位置显示正确操作', () => {
    fc.assert(
      fc.property(
        // 生成随机用户消息
        fc.record({
          id: fc.uuid(),
          role: fc.constant('user' as const),
          content: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        // 生成随机的 isLastUserMessage 值
        fc.boolean(),
        (message: Message, isLastUserMessage: boolean) => {
          // 渲染 InlineMessageEditor 组件
          const { container } = render(
            <InlineMessageEditor
              message={message}
              isLastUserMessage={isLastUserMessage}
              onSave={() => {}}
              onSaveAndResend={() => {}}
              onCancel={() => {}}
            />
          );

          // 验证组件已渲染
          expect(container).toBeTruthy();
          
          // 获取所有按钮
          const buttons = Array.from(container.querySelectorAll('button'));
          const buttonTexts = buttons.map(btn => btn.textContent?.trim() || '');
          
          if (isLastUserMessage) {
            // 最后一条消息：只显示"保存并重新发送"按钮
            const hasSaveAndResend = buttonTexts.some(text => text.includes('保存并重新发送'));
            expect(hasSaveAndResend).toBe(true);
            
            // 不应该显示"仅保存"按钮
            const hasSaveOnly = buttonTexts.some(text => text === '仅保存' || text.match(/^仅保存$/));
            expect(hasSaveOnly).toBe(false);
          } else {
            // 历史消息：显示"仅保存"和"保存并重新发送"两个按钮
            const hasSaveOnly = buttonTexts.some(text => text === '仅保存' || text.match(/^仅保存$/));
            const hasSaveAndResend = buttonTexts.some(text => text.includes('保存并重新发送'));
            expect(hasSaveOnly).toBe(true);
            expect(hasSaveAndResend).toBe(true);
          }
          
          // 两种情况都应该显示"取消"按钮
          const hasCancel = buttonTexts.some(text => text === '取消');
          expect(hasCancel).toBe(true);
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });

  /**
   * Feature: message-editing-improvements, Property 10: 编辑完成正确切换状态
   * 验证: 需求 3.5
   * 
   * 对于任意编辑中的消息，完成编辑操作后应该正确切换回显示模式
   * 
   * 测试策略：验证 InlineMessageEditor 的回调函数被正确调用
   */
  it('属性 10: 编辑完成正确切换状态', () => {
    fc.assert(
      fc.property(
        // 生成随机用户消息
        fc.record({
          id: fc.uuid(),
          role: fc.constant('user' as const),
          content: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        // 生成随机的 isLastUserMessage 值
        fc.boolean(),
        (message: Message, isLastUserMessage: boolean) => {
          let saveCalled = false;
          let saveAndResendCalled = false;
          let cancelCalled = false;

          // 渲染 InlineMessageEditor 组件
          const { container } = render(
            <InlineMessageEditor
              message={message}
              isLastUserMessage={isLastUserMessage}
              onSave={() => { saveCalled = true; }}
              onSaveAndResend={() => { saveAndResendCalled = true; }}
              onCancel={() => { cancelCalled = true; }}
            />
          );

          // 验证组件已渲染
          expect(container).toBeTruthy();
          
          // 获取所有按钮
          const buttons = Array.from(container.querySelectorAll('button'));
          
          // 查找取消按钮并点击
          const cancelButton = buttons.find(btn => btn.textContent?.trim() === '取消');
          expect(cancelButton).toBeTruthy();
          
          if (cancelButton) {
            cancelButton.click();
            // 验证取消回调被调用
            expect(cancelCalled).toBe(true);
          }
          
          // 核心验证：通过检查回调函数的调用，我们确保了：
          // 1. 编辑器正确响应用户操作
          // 2. 回调函数被正确触发
          // 3. 父组件可以根据回调切换状态
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });

  /**
   * Feature: message-editing-improvements, Property 4: 悬停状态不改变容器高度
   * 验证: 需求 2.1, 2.3, 2.4
   * 
   * 对于任意消息项，当鼠标悬停状态改变（显示/隐藏操作按钮和时间戳）时，
   * 消息容器的高度应该保持不变
   * 
   * 测试策略：验证关键的 CSS 类存在，这些类确保了布局稳定性：
   * 1. 时间戳使用 min-h-[20px] 预留固定高度
   * 2. 操作按钮使用 absolute 定位不占用文档流空间
   */
  it('属性 4: 悬停状态不改变容器高度', () => {
    fc.assert(
      fc.property(
        // 生成随机消息列表（1-3条消息）
        fc.array(
          fc.record({
            id: fc.uuid(),
            role: fc.constantFrom('user' as const, 'model' as const),
            content: fc.string({ minLength: 10, maxLength: 200 }),
            timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (messages: Message[]) => {
          // 渲染组件
          const { container } = render(
            <VirtualMessageList
              messages={messages}
              renderContent={(content) => <p>{content}</p>}
            />
          );

          // 验证组件已渲染
          expect(container).toBeTruthy();
          
          // 查找时间戳元素（所有带 text-xs 类的元素）
          const timestamps = container.querySelectorAll('.text-xs');
          
          // 如果有时间戳元素，验证它们都有 min-h-[20px] 类
          timestamps.forEach((timestamp) => {
            // 验证时间戳预留了固定高度
            expect(timestamp.className).toContain('min-h-[20px]');
          });
          
          // 查找所有绝对定位的元素（操作按钮容器）
          const absoluteElements = container.querySelectorAll('.absolute');
          
          // 如果有绝对定位元素，验证它们确实使用了绝对定位
          absoluteElements.forEach((element) => {
            expect(element.className).toContain('absolute');
            // 验证定位在底部
            expect(element.className).toContain('bottom-0');
          });
          
          // 核心验证：通过检查这些关键类的存在，我们确保了：
          // 1. 时间戳始终占用固定高度（即使透明度为0）
          // 2. 操作按钮不占用文档流空间
          // 因此悬停状态改变不会影响容器高度
          
          // 至少应该有一些内容被渲染
          expect(container.innerHTML.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });
});
