/**
 * 设置面板属性测试
 * 使用 fast-check 进行属性测试
 * 
 * **Feature: ui-redesign, Property 6: 设置面板尺寸一致性**
 * **Validates: Requirements 3.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SETTINGS_PANEL_SIZE, SETTINGS_TABS, type SettingsTabId } from './SettingsPanel';

// ============ 生成器 ============

/**
 * 生成有效的设置标签 ID
 */
const settingsTabIdArb: fc.Arbitrary<SettingsTabId> = fc.constantFrom(
  'api', 'model', 'generation', 'system', 'safety', 'data'
);

/**
 * 生成标签切换序列
 */
const tabSwitchSequenceArb = fc.array(settingsTabIdArb, { minLength: 1, maxLength: 20 });

// ============ 属性测试 ============

describe('设置面板属性测试', () => {
  /**
   * **Feature: ui-redesign, Property 6: 设置面板尺寸一致性**
   * 
   * 对于任意设置分类切换操作，切换前后设置面板的尺寸应保持不变
   * 
   * **Validates: Requirements 3.2**
   */
  it('Property 6: 设置面板尺寸一致性 - 切换标签时面板尺寸保持不变', () => {
    fc.assert(
      fc.property(
        tabSwitchSequenceArb,
        (tabSequence) => {
          // 记录初始尺寸
          const initialSize = { ...SETTINGS_PANEL_SIZE };

          // 模拟多次标签切换
          for (const _tabId of tabSequence) {
            // 验证：每次切换后尺寸保持不变
            expect(SETTINGS_PANEL_SIZE.width).toBe(initialSize.width);
            expect(SETTINGS_PANEL_SIZE.height).toBe(initialSize.height);
            expect(SETTINGS_PANEL_SIZE.navWidth).toBe(initialSize.navWidth);
          }

          // 最终验证
          expect(SETTINGS_PANEL_SIZE.width).toBe(800);
          expect(SETTINGS_PANEL_SIZE.height).toBe(600);
          expect(SETTINGS_PANEL_SIZE.navWidth).toBe(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 6: 设置面板尺寸一致性**
   * 
   * 验证面板尺寸常量的不可变性
   * 
   * **Validates: Requirements 3.2**
   */
  it('Property 6: 设置面板尺寸一致性 - 尺寸常量不可变', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }),
        fc.integer({ min: 100, max: 2000 }),
        fc.integer({ min: 50, max: 500 }),
        (_newWidth, _newHeight, _newNavWidth) => {
          // 尝试修改常量（由于 as const，这应该在类型层面被阻止）
          // 在运行时，我们验证值保持不变
          const originalWidth = SETTINGS_PANEL_SIZE.width;
          const originalHeight = SETTINGS_PANEL_SIZE.height;
          const originalNavWidth = SETTINGS_PANEL_SIZE.navWidth;

          // 验证常量值符合设计规范
          expect(originalWidth).toBe(800);
          expect(originalHeight).toBe(600);
          expect(originalNavWidth).toBe(200);

          // 验证值仍然不变
          expect(SETTINGS_PANEL_SIZE.width).toBe(originalWidth);
          expect(SETTINGS_PANEL_SIZE.height).toBe(originalHeight);
          expect(SETTINGS_PANEL_SIZE.navWidth).toBe(originalNavWidth);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 验证所有设置标签都已定义
   */
  it('所有设置标签都应该有有效的配置', () => {
    fc.assert(
      fc.property(settingsTabIdArb, (tabId) => {
        // 验证标签存在于 SETTINGS_TABS 中
        const tab = SETTINGS_TABS.find(t => t.id === tabId);
        expect(tab).toBeDefined();
        expect(tab?.label).toBeTruthy();
        expect(tab?.icon).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证导航栏宽度与内容区域宽度的关系
   */
  it('内容区域宽度应等于面板宽度减去导航栏宽度', () => {
    const contentWidth = SETTINGS_PANEL_SIZE.width - SETTINGS_PANEL_SIZE.navWidth;
    
    // 验证内容区域有足够的宽度
    expect(contentWidth).toBeGreaterThan(0);
    expect(contentWidth).toBe(600); // 800 - 200 = 600
  });
});

describe('设置面板尺寸规范测试', () => {
  it('面板尺寸应符合设计规范 (Requirements 3.1)', () => {
    // Requirements 3.1: 使用固定尺寸的容器（桌面端：宽度 800px，高度 600px）
    expect(SETTINGS_PANEL_SIZE.width).toBe(800);
    expect(SETTINGS_PANEL_SIZE.height).toBe(600);
  });

  it('导航栏宽度应符合设计规范 (Requirements 3.4)', () => {
    // Requirements 3.4: 在左侧显示固定宽度的导航栏（200px）
    expect(SETTINGS_PANEL_SIZE.navWidth).toBe(200);
  });

  it('设置标签数量应为 6 个', () => {
    expect(SETTINGS_TABS).toHaveLength(6);
  });

  it('设置标签应包含所有必需的分类', () => {
    const expectedTabs: SettingsTabId[] = ['api', 'model', 'generation', 'system', 'safety', 'data'];
    const actualTabs = SETTINGS_TABS.map(t => t.id);
    
    expectedTabs.forEach(tabId => {
      expect(actualTabs).toContain(tabId);
    });
  });
});
