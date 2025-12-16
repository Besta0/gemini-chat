/**
 * 侧边栏搜索过滤属性测试
 * 使用 fast-check 进行属性测试
 * 
 * **Feature: ui-redesign, Property 8: 侧边栏搜索过滤**
 * **Validates: Requirements 7.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterChatWindows } from './SearchBar';

// ============ 生成器 ============

/**
 * 生成有效的聊天窗口标题
 */
const titleArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * 生成简单的聊天窗口对象（只包含 title 字段）
 */
const chatWindowArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: titleArb,
});

/**
 * 生成聊天窗口列表
 */
const chatWindowListArb = fc.array(chatWindowArb, { minLength: 0, maxLength: 20 });

/**
 * 生成搜索关键词
 */
const searchTermArb = fc.string({ minLength: 0, maxLength: 50 });

// ============ 属性测试 ============

describe('侧边栏搜索过滤属性测试', () => {
  /**
   * **Feature: ui-redesign, Property 8: 侧边栏搜索过滤**
   * 
   * 对于任意搜索关键词，过滤后的聊天窗口列表应只包含标题匹配该关键词的窗口
   * 
   * **Validates: Requirements 7.6**
   */
  it('Property 8: 侧边栏搜索过滤 - 过滤结果只包含标题匹配关键词的窗口', () => {
    fc.assert(
      fc.property(
        chatWindowListArb,
        searchTermArb,
        (windows, searchTerm) => {
          // 执行过滤
          const filteredWindows = filterChatWindows(windows, searchTerm);
          
          // 如果搜索词为空或只有空白字符，应返回全部窗口
          if (!searchTerm.trim()) {
            expect(filteredWindows).toEqual(windows);
            return;
          }
          
          const normalizedSearch = searchTerm.toLowerCase().trim();
          
          // 验证：所有过滤结果的标题都包含搜索关键词（不区分大小写）
          for (const window of filteredWindows) {
            const normalizedTitle = window.title.toLowerCase();
            expect(normalizedTitle).toContain(normalizedSearch);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 8: 侧边栏搜索过滤**
   * 
   * 对于任意搜索关键词，过滤结果不应包含标题不匹配关键词的窗口
   * 
   * **Validates: Requirements 7.6**
   */
  it('Property 8: 侧边栏搜索过滤 - 过滤结果不包含标题不匹配关键词的窗口', () => {
    fc.assert(
      fc.property(
        chatWindowListArb,
        searchTermArb,
        (windows, searchTerm) => {
          // 执行过滤
          const filteredWindows = filterChatWindows(windows, searchTerm);
          
          // 如果搜索词为空或只有空白字符，应返回全部窗口
          if (!searchTerm.trim()) {
            expect(filteredWindows).toEqual(windows);
            return;
          }
          
          const normalizedSearch = searchTerm.toLowerCase().trim();
          
          // 获取被过滤掉的窗口
          const filteredIds = new Set(filteredWindows.map(w => w.id));
          const excludedWindows = windows.filter(w => !filteredIds.has(w.id));
          
          // 验证：所有被排除的窗口的标题都不包含搜索关键词
          for (const window of excludedWindows) {
            const normalizedTitle = window.title.toLowerCase();
            expect(normalizedTitle).not.toContain(normalizedSearch);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 8: 侧边栏搜索过滤**
   * 
   * 对于任意聊天窗口列表，空搜索词应返回全部窗口
   * 
   * **Validates: Requirements 7.6**
   */
  it('Property 8: 侧边栏搜索过滤 - 空搜索词返回全部窗口', () => {
    fc.assert(
      fc.property(
        chatWindowListArb,
        fc.constantFrom('', ' ', '  ', '\t', '\n', '   '),
        (windows, emptySearchTerm) => {
          // 执行过滤
          const filteredWindows = filterChatWindows(windows, emptySearchTerm);
          
          // 验证：返回全部窗口
          expect(filteredWindows).toEqual(windows);
          expect(filteredWindows.length).toBe(windows.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 8: 侧边栏搜索过滤**
   * 
   * 对于任意聊天窗口列表，过滤结果的数量应小于等于原列表数量
   * 
   * **Validates: Requirements 7.6**
   */
  it('Property 8: 侧边栏搜索过滤 - 过滤结果数量不超过原列表', () => {
    fc.assert(
      fc.property(
        chatWindowListArb,
        searchTermArb,
        (windows, searchTerm) => {
          // 执行过滤
          const filteredWindows = filterChatWindows(windows, searchTerm);
          
          // 验证：过滤结果数量不超过原列表
          expect(filteredWindows.length).toBeLessThanOrEqual(windows.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 8: 侧边栏搜索过滤**
   * 
   * 对于任意聊天窗口列表，过滤结果应保持原有顺序
   * 
   * **Validates: Requirements 7.6**
   */
  it('Property 8: 侧边栏搜索过滤 - 过滤结果保持原有顺序', () => {
    fc.assert(
      fc.property(
        chatWindowListArb,
        searchTermArb,
        (windows, searchTerm) => {
          // 执行过滤
          const filteredWindows = filterChatWindows(windows, searchTerm);
          
          // 获取过滤结果在原列表中的索引
          const filteredIndices = filteredWindows.map(fw => 
            windows.findIndex(w => w.id === fw.id)
          );
          
          // 验证：索引应该是递增的（保持原有顺序）
          for (let i = 1; i < filteredIndices.length; i++) {
            expect(filteredIndices[i]).toBeGreaterThan(filteredIndices[i - 1]!);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 8: 侧边栏搜索过滤**
   * 
   * 对于任意聊天窗口，如果其标题包含搜索词，则该窗口应出现在过滤结果中
   * 
   * **Validates: Requirements 7.6**
   */
  it('Property 8: 侧边栏搜索过滤 - 标题包含搜索词的窗口必须出现在结果中', () => {
    fc.assert(
      fc.property(
        chatWindowListArb,
        searchTermArb.filter(s => s.trim().length > 0),
        (windows, searchTerm) => {
          // 执行过滤
          const filteredWindows = filterChatWindows(windows, searchTerm);
          const filteredIds = new Set(filteredWindows.map(w => w.id));
          
          const normalizedSearch = searchTerm.toLowerCase().trim();
          
          // 验证：所有标题包含搜索词的窗口都应出现在结果中
          for (const window of windows) {
            const normalizedTitle = window.title.toLowerCase();
            if (normalizedTitle.includes(normalizedSearch)) {
              expect(filteredIds.has(window.id)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 8: 侧边栏搜索过滤**
   * 
   * 搜索应不区分大小写
   * 
   * **Validates: Requirements 7.6**
   */
  it('Property 8: 侧边栏搜索过滤 - 搜索不区分大小写', () => {
    fc.assert(
      fc.property(
        chatWindowListArb,
        searchTermArb.filter(s => s.trim().length > 0),
        (windows, searchTerm) => {
          // 使用原始搜索词过滤
          const filteredLower = filterChatWindows(windows, searchTerm.toLowerCase());
          const filteredUpper = filterChatWindows(windows, searchTerm.toUpperCase());
          const filteredOriginal = filterChatWindows(windows, searchTerm);
          
          // 验证：不同大小写的搜索词应返回相同结果
          expect(filteredLower.map(w => w.id)).toEqual(filteredUpper.map(w => w.id));
          expect(filteredLower.map(w => w.id)).toEqual(filteredOriginal.map(w => w.id));
        }
      ),
      { numRuns: 100 }
    );
  });
});
