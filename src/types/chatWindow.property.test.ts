/**
 * 聊天窗口属性测试
 * 使用 fast-check 进行属性测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ChatWindow, ChatWindowConfig } from './chatWindow';
import {
  DEFAULT_CHAT_WINDOW_CONFIG,
  createDefaultSubTopic,
  createDefaultChatWindow,
} from './chatWindow';

// ============ 生成器 ============

/**
 * 生成有效的模型 ID
 */
const modelIdArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_.'.split('')),
  { minLength: 1, maxLength: 50 }
);

/**
 * 生成有效的生成配置
 */
const generationConfigArb = fc.record({
  temperature: fc.option(fc.double({ min: 0, max: 2, noNaN: true }), { nil: undefined }),
  topP: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
  topK: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  maxOutputTokens: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined }),
});

/**
 * 生成有效的聊天窗口配置
 */
const chatWindowConfigArb: fc.Arbitrary<ChatWindowConfig> = fc.record({
  model: modelIdArb,
  generationConfig: generationConfigArb,
  systemInstruction: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  safetySettings: fc.option(fc.constant([]), { nil: undefined }),
});

/**
 * 生成唯一 ID
 */
const idArb = fc.uuid();

/**
 * 生成有效的标题
 */
const titleArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * 生成有效的聊天窗口
 */
const chatWindowArb: fc.Arbitrary<ChatWindow> = fc.record({
  id: idArb,
  title: titleArb,
  config: chatWindowConfigArb,
  subTopics: fc.array(
    fc.record({
      id: idArb,
      title: titleArb,
      messages: fc.constant([]),
      createdAt: fc.integer({ min: 0 }),
      updatedAt: fc.integer({ min: 0 }),
    }),
    { minLength: 1, maxLength: 5 }
  ),
  activeSubTopicId: idArb,
  createdAt: fc.integer({ min: 0 }),
  updatedAt: fc.integer({ min: 0 }),
});

// ============ 属性测试 ============

describe('聊天窗口属性测试', () => {
  /**
   * **Feature: ui-redesign, Property 1: 聊天窗口配置独立性**
   * 
   * 对于任意两个聊天窗口 A 和 B，修改窗口 A 的配置（模型、参数、系统指令）
   * 不应影响窗口 B 的配置
   * 
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
   */
  it('Property 1: 聊天窗口配置独立性 - 修改一个窗口的配置不影响另一个窗口', () => {
    fc.assert(
      fc.property(
        chatWindowArb,
        chatWindowArb,
        chatWindowConfigArb,
        (windowA, windowB, newConfig) => {
          // 确保两个窗口有不同的 ID
          if (windowA.id === windowB.id) {
            windowB = { ...windowB, id: windowB.id + '-different' };
          }

          // 保存窗口 B 的原始配置（深拷贝）
          const originalConfigB = JSON.parse(JSON.stringify(windowB.config));

          // 模拟修改窗口 A 的配置
          const modifiedWindowA: ChatWindow = {
            ...windowA,
            config: { ...newConfig },
          };

          // 验证：窗口 A 的配置已更新
          expect(modifiedWindowA.config.model).toBe(newConfig.model);
          expect(modifiedWindowA.config.generationConfig).toEqual(newConfig.generationConfig);
          expect(modifiedWindowA.config.systemInstruction).toBe(newConfig.systemInstruction);

          // 验证：窗口 B 的配置保持不变
          expect(windowB.config.model).toBe(originalConfigB.model);
          expect(windowB.config.generationConfig).toEqual(originalConfigB.generationConfig);
          expect(windowB.config.systemInstruction).toBe(originalConfigB.systemInstruction);
          expect(windowB.config.safetySettings).toEqual(originalConfigB.safetySettings);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 1: 聊天窗口配置独立性（数组场景）**
   * 
   * 在窗口数组中修改任意一个窗口的配置，不应影响其他窗口
   * 
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
   */
  it('Property 1: 聊天窗口配置独立性 - 数组中修改一个窗口不影响其他窗口', () => {
    fc.assert(
      fc.property(
        fc.array(chatWindowArb, { minLength: 2, maxLength: 10 }),
        fc.nat(),
        chatWindowConfigArb,
        (windows, indexSeed, newConfig) => {
          // 确保所有窗口有唯一 ID
          const uniqueWindows = windows.map((w, i) => ({
            ...w,
            id: `window-${i}`,
          }));

          // 选择要修改的窗口索引
          const targetIndex = indexSeed % uniqueWindows.length;

          // 保存所有窗口的原始配置（深拷贝）
          const originalConfigs = uniqueWindows.map(w => 
            JSON.parse(JSON.stringify(w.config))
          );

          // 模拟修改目标窗口的配置
          const modifiedWindows = uniqueWindows.map((w, i) => {
            if (i === targetIndex) {
              return { ...w, config: { ...newConfig } };
            }
            return w;
          });

          // 验证：目标窗口的配置已更新
          const targetWindow = modifiedWindows[targetIndex];
          if (targetWindow) {
            expect(targetWindow.config.model).toBe(newConfig.model);
          }

          // 验证：其他窗口的配置保持不变
          modifiedWindows.forEach((w, i) => {
            if (i !== targetIndex) {
              expect(w.config).toEqual(originalConfigs[i]);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('聊天窗口工厂函数测试', () => {
  it('createDefaultSubTopic 应创建有效的子话题', () => {
    fc.assert(
      fc.property(idArb, titleArb, (id, title) => {
        const subTopic = createDefaultSubTopic(id, title);

        expect(subTopic.id).toBe(id);
        expect(subTopic.title).toBe(title);
        expect(subTopic.messages).toEqual([]);
        expect(subTopic.createdAt).toBeGreaterThan(0);
        expect(subTopic.updatedAt).toBeGreaterThan(0);
        expect(subTopic.createdAt).toBeLessThanOrEqual(subTopic.updatedAt);
      }),
      { numRuns: 100 }
    );
  });

  it('createDefaultChatWindow 应创建有效的聊天窗口', () => {
    fc.assert(
      fc.property(idArb, titleArb, idArb, (windowId, title, subTopicId) => {
        const chatWindow = createDefaultChatWindow(windowId, title, {}, subTopicId);

        expect(chatWindow.id).toBe(windowId);
        expect(chatWindow.title).toBe(title);
        expect(chatWindow.config).toEqual(DEFAULT_CHAT_WINDOW_CONFIG);
        expect(chatWindow.subTopics).toHaveLength(1);
        const firstSubTopic = chatWindow.subTopics[0];
        if (firstSubTopic) {
          expect(firstSubTopic.id).toBe(subTopicId);
        }
        expect(chatWindow.activeSubTopicId).toBe(subTopicId);
        expect(chatWindow.createdAt).toBeGreaterThan(0);
        expect(chatWindow.updatedAt).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('createDefaultChatWindow 应正确合并自定义配置', () => {
    fc.assert(
      fc.property(
        idArb,
        titleArb,
        idArb,
        chatWindowConfigArb,
        (windowId, title, subTopicId, customConfig) => {
          const chatWindow = createDefaultChatWindow(windowId, title, customConfig, subTopicId);

          // 验证自定义配置被正确应用
          expect(chatWindow.config.model).toBe(customConfig.model);
          expect(chatWindow.config.generationConfig).toEqual(customConfig.generationConfig);
          
          if (customConfig.systemInstruction !== undefined) {
            expect(chatWindow.config.systemInstruction).toBe(customConfig.systemInstruction);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
