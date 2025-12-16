/**
 * 消息输入组件属性测试
 * 使用 fast-check 进行属性测试
 * 
 * **Feature: ui-redesign, Property 10: 输入框高度自适应**
 * **Validates: Requirements 9.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  INPUT_MIN_ROWS,
  INPUT_MAX_ROWS,
  LINE_HEIGHT_PX,
  calculateInputHeight,
} from '../MessageInput';

// ============ 生成器 ============

/**
 * 生成单行文本（不包含换行符）
 */
const singleLineTextArb = fc.string({ minLength: 0, maxLength: 200 }).filter(s => !s.includes('\n'));

/**
 * 生成指定行数的多行文本
 */
const multiLineTextArb = (minLines: number, maxLines: number) =>
  fc.array(singleLineTextArb, { minLength: minLines, maxLength: maxLines })
    .map(lines => lines.join('\n'));

/**
 * 生成任意行数的文本
 */
const anyTextArb = fc.oneof(
  singleLineTextArb,
  multiLineTextArb(1, 3),
  multiLineTextArb(3, 6),
  multiLineTextArb(6, 10),
  multiLineTextArb(10, 20)
);

// ============ 属性测试 ============

describe('消息输入组件属性测试', () => {
  /**
   * **Feature: ui-redesign, Property 10: 输入框高度自适应**
   * 
   * 对于任意多行文本输入，输入框高度应在最小 1 行和最大 6 行之间自动调整
   * 
   * **Validates: Requirements 9.3**
   */
  describe('Property 10: 输入框高度自适应', () => {
    it('单行文本应使用最小高度', () => {
      fc.assert(
        fc.property(singleLineTextArb, (text) => {
          const height = calculateInputHeight(text);
          const expectedHeight = INPUT_MIN_ROWS * LINE_HEIGHT_PX;
          
          expect(height).toBe(expectedHeight);
        }),
        { numRuns: 100 }
      );
    });

    it('多行文本高度应与行数成正比（在限制范围内）', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: INPUT_MAX_ROWS }),
          (lineCount) => {
            // 生成指定行数的文本
            const lines = Array(lineCount).fill('test line');
            const text = lines.join('\n');
            
            const height = calculateInputHeight(text);
            const expectedHeight = lineCount * LINE_HEIGHT_PX;
            
            expect(height).toBe(expectedHeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('超过最大行数的文本应使用最大高度', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: INPUT_MAX_ROWS + 1, max: 20 }),
          (lineCount) => {
            // 生成超过最大行数的文本
            const lines = Array(lineCount).fill('test line');
            const text = lines.join('\n');
            
            const height = calculateInputHeight(text);
            const maxHeight = INPUT_MAX_ROWS * LINE_HEIGHT_PX;
            
            expect(height).toBe(maxHeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('高度始终在最小和最大范围内', () => {
      fc.assert(
        fc.property(anyTextArb, (text) => {
          const height = calculateInputHeight(text);
          const minHeight = INPUT_MIN_ROWS * LINE_HEIGHT_PX;
          const maxHeight = INPUT_MAX_ROWS * LINE_HEIGHT_PX;
          
          expect(height).toBeGreaterThanOrEqual(minHeight);
          expect(height).toBeLessThanOrEqual(maxHeight);
        }),
        { numRuns: 100 }
      );
    });

    it('空文本应使用最小高度', () => {
      const height = calculateInputHeight('');
      const expectedHeight = INPUT_MIN_ROWS * LINE_HEIGHT_PX;
      
      expect(height).toBe(expectedHeight);
    });

    it('高度计算是确定性的（相同输入产生相同输出）', () => {
      fc.assert(
        fc.property(anyTextArb, (text) => {
          const height1 = calculateInputHeight(text);
          const height2 = calculateInputHeight(text);
          
          expect(height1).toBe(height2);
        }),
        { numRuns: 100 }
      );
    });

    it('添加换行符应增加高度（在限制范围内）', () => {
      fc.assert(
        fc.property(
          singleLineTextArb,
          fc.integer({ min: 1, max: INPUT_MAX_ROWS - 1 }),
          (baseLine, additionalLines) => {
            const textWithoutNewlines = baseLine;
            const textWithNewlines = baseLine + '\n'.repeat(additionalLines);
            
            const heightWithout = calculateInputHeight(textWithoutNewlines);
            const heightWith = calculateInputHeight(textWithNewlines);
            
            // 添加换行符后高度应该增加或保持不变（如果已达到最大）
            expect(heightWith).toBeGreaterThanOrEqual(heightWithout);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('行数计算正确', () => {
      fc.assert(
        fc.property(
          fc.array(singleLineTextArb, { minLength: 1, maxLength: 15 }),
          (lines) => {
            const text = lines.join('\n');
            const actualLineCount = text.split('\n').length;
            const clampedLineCount = Math.max(INPUT_MIN_ROWS, Math.min(actualLineCount, INPUT_MAX_ROWS));
            
            const height = calculateInputHeight(text);
            const expectedHeight = clampedLineCount * LINE_HEIGHT_PX;
            
            expect(height).toBe(expectedHeight);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('输入框高度常量验证', () => {
  it('最小行数应为正整数', () => {
    expect(INPUT_MIN_ROWS).toBeGreaterThan(0);
    expect(Number.isInteger(INPUT_MIN_ROWS)).toBe(true);
  });

  it('最大行数应大于最小行数', () => {
    expect(INPUT_MAX_ROWS).toBeGreaterThan(INPUT_MIN_ROWS);
  });

  it('行高应为正数', () => {
    expect(LINE_HEIGHT_PX).toBeGreaterThan(0);
  });

  it('最小行数应为 1', () => {
    expect(INPUT_MIN_ROWS).toBe(1);
  });

  it('最大行数应为 6', () => {
    expect(INPUT_MAX_ROWS).toBe(6);
  });
});
