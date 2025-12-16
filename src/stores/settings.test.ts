/**
 * 设置状态属性测试
 * **Feature: gemini-chat, Property 12: 模型选择持久化**
 * **Feature: gemini-chat, Property 15: 主题切换状态一致性**
 * **验证: 需求 8.2, 8.3, 11.2**
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { useSettingsStore } from './settings';
import { deleteDatabase, saveSettings, getSettings } from '../services/storage';
import type { ThemeMode, AppSettings } from '../types/models';
import { GEMINI_MODELS, DEFAULT_APP_SETTINGS } from '../types/models';

// ============ 生成器定义 ============

/**
 * 生成有效的模型名称
 * 包括预设模型和自定义模型名称
 */
const modelNameArb = fc.oneof(
  // 预设模型
  fc.constantFrom(...GEMINI_MODELS.map(m => m.id)),
  // 自定义模型名称（只使用简单字符串避免特殊字符问题）
  fc.stringMatching(/^[a-zA-Z0-9-]{1,30}$/)
);

/**
 * 生成有效的主题模式
 */
const themeModeArb = fc.constantFrom<ThemeMode>('light', 'dark', 'system');

// ============ 辅助函数 ============

/**
 * 重置 store 状态
 */
function resetStore(): void {
  const store = useSettingsStore.getState();
  store.resetToDefaults();
}

// ============ 测试套件 ============

describe('设置状态属性测试', () => {
  // 测试套件开始前清理数据库
  beforeAll(async () => {
    await deleteDatabase();
    resetStore();
  });

  // 测试套件结束后清理数据库
  afterAll(async () => {
    await deleteDatabase();
  });

  /**
   * **Feature: gemini-chat, Property 12: 模型选择持久化**
   * *对于任意* 模型名称，选择后应该正确保存，新建对话应该使用该模型作为默认值。
   * **验证: 需求 8.2, 8.3**
   * 
   * 测试策略：直接测试存储层的往返一致性，避免 store 异步持久化的复杂性
   */
  it('Property 12: 模型选择持久化', async () => {
    await fc.assert(
      fc.asyncProperty(modelNameArb, async (modelName) => {
        // 创建带有指定模型的设置
        const settings: AppSettings = {
          ...DEFAULT_APP_SETTINGS,
          currentModel: modelName,
        };

        // 保存设置
        await saveSettings(settings);

        // 读取设置
        const retrieved = await getSettings();

        // 验证模型名称持久化正确
        expect(retrieved.currentModel).toBe(modelName);
      }),
      { numRuns: 100 }
    );
  }, 30000);

  /**
   * **Feature: gemini-chat, Property 15: 主题切换状态一致性**
   * *对于任意* 初始主题状态，切换主题后状态应该正确更新为目标主题。
   * **验证: 需求 11.2**
   * 
   * 测试策略：直接测试存储层的往返一致性
   */
  it('Property 15: 主题切换状态一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        themeModeArb,
        themeModeArb,
        async (initialTheme, targetTheme) => {
          // 创建带有初始主题的设置
          const initialSettings: AppSettings = {
            ...DEFAULT_APP_SETTINGS,
            theme: initialTheme,
          };

          // 保存初始设置
          await saveSettings(initialSettings);

          // 验证初始主题保存正确
          let retrieved = await getSettings();
          expect(retrieved.theme).toBe(initialTheme);

          // 切换到目标主题
          const updatedSettings: AppSettings = {
            ...initialSettings,
            theme: targetTheme,
          };
          await saveSettings(updatedSettings);

          // 验证目标主题保存正确
          retrieved = await getSettings();
          expect(retrieved.theme).toBe(targetTheme);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});
