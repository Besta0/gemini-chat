/**
 * 存储服务属性测试 - ChatWindow CRUD 操作
 * **Feature: ui-redesign, Property 13: 存储 CRUD 操作一致性**
 * **Validates: Requirements 12.5**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  saveChatWindow,
  getChatWindow,
  getAllChatWindows,
  deleteChatWindow,
  addSubTopic,
  updateSubTopic,
  deleteSubTopic,
  getSubTopic,
  deleteDatabase,
} from './storage';
import type { ChatWindow, SubTopic, ChatWindowConfig } from '../types';
import type { GenerationConfig, SafetySetting, HarmCategory, HarmBlockThreshold } from '../types';
import type { Message, Attachment } from '../types';

// ============ 生成器定义 ============

/**
 * 生成有效的 HarmCategory
 */
const harmCategoryArb = fc.constantFrom<HarmCategory>(
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT'
);

/**
 * 生成有效的 HarmBlockThreshold
 */
const harmBlockThresholdArb = fc.constantFrom<HarmBlockThreshold>(
  'BLOCK_NONE',
  'BLOCK_LOW_AND_ABOVE',
  'BLOCK_MEDIUM_AND_ABOVE',
  'BLOCK_ONLY_HIGH'
);

/**
 * 生成有效的 SafetySetting
 */
const safetySettingArb: fc.Arbitrary<SafetySetting> = fc.record({
  category: harmCategoryArb,
  threshold: harmBlockThresholdArb,
});

/**
 * 生成有效的 GenerationConfig
 */
const generationConfigArb: fc.Arbitrary<GenerationConfig> = fc.record({
  temperature: fc.double({ min: 0, max: 2, noNaN: true }),
  topP: fc.double({ min: 0, max: 1, noNaN: true }),
  topK: fc.integer({ min: 1, max: 100 }),
  maxOutputTokens: fc.option(fc.integer({ min: 1, max: 8192 }), { nil: undefined }),
  stopSequences: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }), { nil: undefined }),
});

/**
 * 生成有效的 ChatWindowConfig
 */
const chatWindowConfigArb: fc.Arbitrary<ChatWindowConfig> = fc.record({
  model: fc.string({ minLength: 1, maxLength: 50 }),
  generationConfig: generationConfigArb,
  systemInstruction: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  safetySettings: fc.option(fc.array(safetySettingArb, { maxLength: 4 }), { nil: undefined }),
});

/**
 * 生成有效的附件
 */
const attachmentArb: fc.Arbitrary<Attachment> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom<'image' | 'file'>('image', 'file'),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  mimeType: fc.constantFrom('image/jpeg', 'image/png', 'application/pdf', 'text/plain'),
  data: fc.base64String({ minLength: 10, maxLength: 100 }),
  size: fc.integer({ min: 1, max: 1000000 }),
});

/**
 * 生成有效的消息
 */
const messageArb: fc.Arbitrary<Message> = fc.record({
  id: fc.uuid(),
  role: fc.constantFrom<'user' | 'model'>('user', 'model'),
  content: fc.string({ maxLength: 500 }),
  attachments: fc.option(fc.array(attachmentArb, { maxLength: 3 }), { nil: undefined }),
  timestamp: fc.integer({ min: 0, max: Date.now() }),
});

/**
 * 生成有效的子话题
 */
const subTopicArb: fc.Arbitrary<SubTopic> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  messages: fc.array(messageArb, { maxLength: 10 }),
  createdAt: fc.integer({ min: 0, max: Date.now() }),
  updatedAt: fc.integer({ min: 0, max: Date.now() }),
});

/**
 * 生成有效的聊天窗口
 */
const chatWindowArb: fc.Arbitrary<ChatWindow> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  config: chatWindowConfigArb,
  subTopics: fc.array(subTopicArb, { minLength: 1, maxLength: 5 }),
  activeSubTopicId: fc.uuid(),
  createdAt: fc.integer({ min: 0, max: Date.now() }),
  updatedAt: fc.integer({ min: 0, max: Date.now() }),
}).map(window => {
  // 确保 activeSubTopicId 是 subTopics 中的一个
  if (window.subTopics.length > 0 && window.subTopics[0]) {
    window.activeSubTopicId = window.subTopics[0].id;
  }
  return window;
});

// ============ 测试套件 ============

describe('ChatWindow 存储 CRUD 属性测试', () => {
  // 每个测试前删除数据库确保干净状态
  beforeEach(async () => {
    await deleteDatabase();
  });

  // 每个测试后关闭数据库连接
  afterEach(async () => {
    await deleteDatabase();
  });

  /**
   * **Feature: ui-redesign, Property 13: 存储 CRUD 操作一致性**
   * *对于任意* ChatWindow 数据，创建后读取应返回相同数据
   * **Validates: Requirements 12.5**
   */
  it('Property 13.1: ChatWindow 创建后读取应返回相同数据', async () => {
    await fc.assert(
      fc.asyncProperty(chatWindowArb, async (chatWindow) => {
        // 每次迭代前删除数据库确保干净状态
        await deleteDatabase();

        // 保存聊天窗口
        await saveChatWindow(chatWindow);

        // 读取聊天窗口
        const retrieved = await getChatWindow(chatWindow.id);

        // 验证往返一致性
        expect(retrieved).toEqual(chatWindow);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 13: 存储 CRUD 操作一致性**
   * *对于任意* ChatWindow 数据，更新后读取应返回更新后的数据
   * **Validates: Requirements 12.5**
   */
  it('Property 13.2: ChatWindow 更新后读取应返回更新后的数据', async () => {
    await fc.assert(
      fc.asyncProperty(
        chatWindowArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        async (chatWindow, newTitle) => {
          // 每次迭代前删除数据库确保干净状态
          await deleteDatabase();

          // 保存原始聊天窗口
          await saveChatWindow(chatWindow);

          // 更新聊天窗口
          const updatedWindow = { ...chatWindow, title: newTitle, updatedAt: Date.now() };
          await saveChatWindow(updatedWindow);

          // 读取聊天窗口
          const retrieved = await getChatWindow(chatWindow.id);

          // 验证更新后的数据
          expect(retrieved?.title).toEqual(newTitle);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 13: 存储 CRUD 操作一致性**
   * *对于任意* ChatWindow 数据，删除后读取应返回 null
   * **Validates: Requirements 12.5**
   */
  it('Property 13.3: ChatWindow 删除后读取应返回 null', async () => {
    await fc.assert(
      fc.asyncProperty(chatWindowArb, async (chatWindow) => {
        // 每次迭代前删除数据库确保干净状态
        await deleteDatabase();

        // 保存聊天窗口
        await saveChatWindow(chatWindow);

        // 验证保存成功
        const saved = await getChatWindow(chatWindow.id);
        expect(saved).not.toBeNull();

        // 删除聊天窗口
        await deleteChatWindow(chatWindow.id);

        // 读取聊天窗口
        const retrieved = await getChatWindow(chatWindow.id);

        // 验证删除后返回 null
        expect(retrieved).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 13: 存储 CRUD 操作一致性**
   * *对于任意* 多个 ChatWindow 数据，getAllChatWindows 应返回所有保存的窗口
   * **Validates: Requirements 12.5**
   */
  it('Property 13.4: getAllChatWindows 应返回所有保存的窗口', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(chatWindowArb, { minLength: 1, maxLength: 5 }).map(windows => {
          // 确保每个窗口有唯一的 ID
          const uniqueIds = new Set<string>();
          return windows.filter(w => {
            if (uniqueIds.has(w.id)) return false;
            uniqueIds.add(w.id);
            return true;
          });
        }),
        async (chatWindows) => {
          // 每次迭代前删除数据库确保干净状态
          await deleteDatabase();

          // 保存所有聊天窗口
          for (const window of chatWindows) {
            await saveChatWindow(window);
          }

          // 获取所有聊天窗口
          const retrieved = await getAllChatWindows();

          // 验证数量一致
          expect(retrieved.length).toEqual(chatWindows.length);

          // 验证所有窗口都存在
          const retrievedIds = new Set(retrieved.map(w => w.id));
          for (const window of chatWindows) {
            expect(retrievedIds.has(window.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('SubTopic 存储 CRUD 属性测试', () => {
  // 每个测试前删除数据库确保干净状态
  beforeEach(async () => {
    await deleteDatabase();
  });

  // 每个测试后关闭数据库连接
  afterEach(async () => {
    await deleteDatabase();
  });

  /**
   * **Feature: ui-redesign, Property 13: 存储 CRUD 操作一致性**
   * *对于任意* SubTopic 数据，添加到 ChatWindow 后应能正确读取
   * **Validates: Requirements 12.5**
   */
  it('Property 13.5: SubTopic 添加后应能正确读取', async () => {
    await fc.assert(
      fc.asyncProperty(chatWindowArb, subTopicArb, async (chatWindow, newSubTopic) => {
        // 每次迭代前删除数据库确保干净状态
        await deleteDatabase();

        // 保存聊天窗口
        await saveChatWindow(chatWindow);

        // 添加子话题
        await addSubTopic(chatWindow.id, newSubTopic);

        // 读取子话题
        const retrieved = await getSubTopic(chatWindow.id, newSubTopic.id);

        // 验证子话题存在
        expect(retrieved).toEqual(newSubTopic);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 13: 存储 CRUD 操作一致性**
   * *对于任意* SubTopic 数据，更新后应返回更新后的数据
   * **Validates: Requirements 12.5**
   */
  it('Property 13.6: SubTopic 更新后应返回更新后的数据', async () => {
    await fc.assert(
      fc.asyncProperty(
        chatWindowArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        async (chatWindow, newTitle) => {
          // 每次迭代前删除数据库确保干净状态
          await deleteDatabase();

          // 确保有子话题
          const firstSubTopic = chatWindow.subTopics[0];
          if (!firstSubTopic) return;

          // 保存聊天窗口
          await saveChatWindow(chatWindow);

          const subTopicId = firstSubTopic.id;

          // 更新子话题
          await updateSubTopic(chatWindow.id, subTopicId, { title: newTitle });

          // 读取子话题
          const retrieved = await getSubTopic(chatWindow.id, subTopicId);

          // 验证更新后的数据
          expect(retrieved?.title).toEqual(newTitle);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 13: 存储 CRUD 操作一致性**
   * *对于任意* SubTopic 数据，删除后应返回 null
   * **Validates: Requirements 12.5**
   */
  it('Property 13.7: SubTopic 删除后应返回 null', async () => {
    await fc.assert(
      fc.asyncProperty(chatWindowArb, async (chatWindow) => {
        // 每次迭代前删除数据库确保干净状态
        await deleteDatabase();

        // 确保有多个子话题（至少2个，因为删除后需要保留至少一个）
        const secondSubTopic = chatWindow.subTopics[1];
        if (!secondSubTopic) return;

        // 保存聊天窗口
        await saveChatWindow(chatWindow);

        const subTopicId = secondSubTopic.id;

        // 验证子话题存在
        const before = await getSubTopic(chatWindow.id, subTopicId);
        expect(before).not.toBeNull();

        // 删除子话题
        await deleteSubTopic(chatWindow.id, subTopicId);

        // 读取子话题
        const retrieved = await getSubTopic(chatWindow.id, subTopicId);

        // 验证删除后返回 null
        expect(retrieved).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});


// ============ 导入导出属性测试 ============

import {
  exportAllDataV2,
  importDataV2,
  importDataAuto,
  saveSettings,
  getSettings,
} from './storage';
import type { AppSettings } from '../types';

/**
 * 生成有效的主题模式
 */
const themeModeArb = fc.constantFrom<'light' | 'dark' | 'system'>('light', 'dark', 'system');

/**
 * 生成有效的 AppSettings
 */
const appSettingsArb: fc.Arbitrary<AppSettings> = fc.record({
  apiEndpoint: fc.webUrl(),
  apiKey: fc.string({ minLength: 0, maxLength: 100 }),
  currentModel: fc.string({ minLength: 1, maxLength: 50 }),
  generationConfig: generationConfigArb,
  safetySettings: fc.array(safetySettingArb, { maxLength: 4 }),
  systemInstruction: fc.string({ maxLength: 1000 }),
  theme: themeModeArb,
  sidebarCollapsed: fc.boolean(),
});

describe('导入导出数据一致性属性测试', () => {
  // 每个测试前删除数据库确保干净状态
  beforeEach(async () => {
    await deleteDatabase();
  });

  // 每个测试后关闭数据库连接
  afterEach(async () => {
    await deleteDatabase();
  });

  /**
   * **Feature: ui-redesign, Property 14: 导入导出数据一致性**
   * *对于任意* 导出的数据，重新导入后应与原始数据一致
   * **Validates: Requirements 12.6**
   */
  it('Property 14.1: ChatWindow 导出后导入应保持数据一致', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(chatWindowArb, { minLength: 1, maxLength: 5 }).map(windows => {
          // 确保每个窗口有唯一的 ID
          const uniqueIds = new Set<string>();
          return windows.filter(w => {
            if (uniqueIds.has(w.id)) return false;
            uniqueIds.add(w.id);
            return true;
          });
        }),
        appSettingsArb,
        async (chatWindows, settings) => {
          // 每次迭代前删除数据库确保干净状态
          await deleteDatabase();

          // 保存原始数据
          await saveSettings(settings);
          for (const window of chatWindows) {
            await saveChatWindow(window);
          }

          // 导出数据
          const exportedJson = await exportAllDataV2();

          // 删除数据库确保干净状态
          await deleteDatabase();

          // 导入数据
          await importDataV2(exportedJson);

          // 验证设置恢复
          const retrievedSettings = await getSettings();
          expect(retrievedSettings).toEqual(settings);

          // 验证聊天窗口恢复
          const retrievedWindows = await getAllChatWindows();

          // 按 ID 排序以便比较（因为导出/导入可能改变顺序）
          const sortedOriginal = [...chatWindows].sort((a, b) => a.id.localeCompare(b.id));
          const sortedRetrieved = [...retrievedWindows].sort((a, b) => a.id.localeCompare(b.id));

          expect(sortedRetrieved).toEqual(sortedOriginal);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 14: 导入导出数据一致性**
   * *对于任意* 导出的数据，使用智能导入后应与原始数据一致
   * **Validates: Requirements 12.6**
   */
  it('Property 14.2: 智能导入应正确识别新版格式', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(chatWindowArb, { minLength: 1, maxLength: 3 }).map(windows => {
          // 确保每个窗口有唯一的 ID
          const uniqueIds = new Set<string>();
          return windows.filter(w => {
            if (uniqueIds.has(w.id)) return false;
            uniqueIds.add(w.id);
            return true;
          });
        }),
        appSettingsArb,
        async (chatWindows, settings) => {
          // 每次迭代前删除数据库确保干净状态
          await deleteDatabase();

          // 保存原始数据
          await saveSettings(settings);
          for (const window of chatWindows) {
            await saveChatWindow(window);
          }

          // 导出数据（新版格式）
          const exportedJson = await exportAllDataV2();

          // 删除数据库确保干净状态
          await deleteDatabase();

          // 使用智能导入
          await importDataAuto(exportedJson);

          // 验证设置恢复
          const retrievedSettings = await getSettings();
          expect(retrievedSettings).toEqual(settings);

          // 验证聊天窗口恢复
          const retrievedWindows = await getAllChatWindows();

          // 按 ID 排序以便比较
          const sortedOriginal = [...chatWindows].sort((a, b) => a.id.localeCompare(b.id));
          const sortedRetrieved = [...retrievedWindows].sort((a, b) => a.id.localeCompare(b.id));

          expect(sortedRetrieved).toEqual(sortedOriginal);
        }
      ),
      { numRuns: 100 }
    );
  });
});
