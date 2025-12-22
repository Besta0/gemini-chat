/**
 * MessageActions 组件属性测试
 * Feature: message-editing-improvements
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { MessageActions } from './MessageActions';
import type { Message } from '../../types/models';

describe('MessageActions 属性测试', () => {
  /**
   * Feature: message-editing-improvements, Property 5: 操作按钮容器正确渲染
   * 验证: 需求 2.2
   * 
   * 对于任意消息项，操作按钮容器应该正确渲染，不影响布局稳定性
   */
  it('属性 5: 操作按钮容器正确渲染', () => {
    fc.assert(
      fc.property(
        // 生成随机消息数据
        fc.record({
          id: fc.uuid(),
          role: fc.constantFrom('user' as const, 'model' as const),
          content: fc.string({ minLength: 1, maxLength: 500 }),
          timestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        fc.boolean(), // isUserMessage
        fc.boolean(), // visible
        (message: Message, isUserMessage: boolean, visible: boolean) => {
          // 渲染组件
          const { container } = render(
            <MessageActions
              message={message}
              isUserMessage={isUserMessage}
              visible={visible}
            />
          );

          // 查找操作按钮容器
          const actionsContainer = container.querySelector('div');
          
          // 验证容器存在
          expect(actionsContainer).toBeTruthy();
          
          if (actionsContainer) {
            const className = actionsContainer.className;
            
            // 验证使用 flex 布局
            expect(className).toContain('flex');
            expect(className).toContain('items-center');
            expect(className).toContain('gap-1');
          }
        }
      ),
      { numRuns: 100 } // 运行 100 次迭代
    );
  });
});
