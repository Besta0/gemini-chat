/**
 * 存储服务属性测试
 * **Feature: gemini-chat, Property 1: 设置存储往返一致性**
 * **Feature: gemini-chat, Property 11: 导入导出往返一致性**
 * **验证: 需求 1.3, 2.2, 5.5, 10.1, 10.2, 10.4, 10.6**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  saveSettings,
  getSettings,
  saveConversation,
  getAllConversations,
  exportAllData,
  importData,
  deleteDatabase,
  saveModelConfigs,
  loadModelConfigs,
  resetModelConfigs,
} from './storage';
import type { AppSettings, Conversation, Message, Attachment, ModelConfig, ApiProvider, ThinkingLevel, MediaResolution } from '../types';
import type { GenerationConfig, SafetySetting, HarmCategory, HarmBlockThreshold } from '../types';
import { GEMINI_MODELS } from '../types';

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

// ============ 测试套件 ============

describe('存储服务属性测试', () => {
  // 每个测试前删除数据库确保干净状态
  beforeEach(async () => {
    await deleteDatabase();
  });

  // 每个测试后关闭数据库连接
  afterEach(async () => {
    await deleteDatabase();
  });

  /**
   * **Feature: gemini-chat, Property 1: 设置存储往返一致性**
   * *对于任意* 有效的 AppSettings 对象，保存到存储后再读取，应该得到等价的设置对象。
   * **验证: 需求 1.3, 2.2, 5.5**
   */
  it('Property 1: 设置存储往返一致性', async () => {
    await fc.assert(
      fc.asyncProperty(appSettingsArb, async (settings) => {
        // 保存设置
        await saveSettings(settings);

        // 读取设置
        const retrieved = await getSettings();

        // 验证往返一致性
        expect(retrieved).toEqual(settings);
      }),
      { numRuns: 100 }
    );
  });
});

// ============ 导入导出属性测试生成器 ============

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
 * 生成有效的对话
 */
const conversationArb: fc.Arbitrary<Conversation> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  messages: fc.array(messageArb, { maxLength: 10 }),
  model: fc.string({ minLength: 1, maxLength: 50 }),
  systemInstruction: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  createdAt: fc.integer({ min: 0, max: Date.now() }),
  updatedAt: fc.integer({ min: 0, max: Date.now() }),
});

describe('导入导出属性测试', () => {
  // 每个测试前删除数据库确保干净状态
  beforeEach(async () => {
    await deleteDatabase();
  });

  // 每个测试后关闭数据库连接
  afterEach(async () => {
    await deleteDatabase();
  });

  /**
   * **Feature: gemini-chat, Property 11: 导入导出往返一致性**
   * *对于任意* 有效的应用数据（对话列表和设置），导出为 JSON 后再导入应该恢复等价的数据。
   * **验证: 需求 10.1, 10.2, 10.4, 10.6**
   */
  it('Property 11: 导入导出往返一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(conversationArb, { maxLength: 5 }),
        appSettingsArb,
        async (conversations, settings) => {
          // 每次迭代前删除数据库确保干净状态
          await deleteDatabase();

          // 保存原始数据
          await saveSettings(settings);
          for (const conv of conversations) {
            await saveConversation(conv);
          }

          // 导出数据
          const exportedJson = await exportAllData();

          // 删除数据库确保干净状态
          await deleteDatabase();

          // 导入数据
          await importData(exportedJson);

          // 验证设置恢复
          const retrievedSettings = await getSettings();
          expect(retrievedSettings).toEqual(settings);

          // 验证对话恢复
          const retrievedConversations = await getAllConversations();
          
          // 按 ID 排序以便比较（因为导出/导入可能改变顺序）
          const sortedOriginal = [...conversations].sort((a, b) => a.id.localeCompare(b.id));
          const sortedRetrieved = [...retrievedConversations].sort((a, b) => a.id.localeCompare(b.id));
          
          expect(sortedRetrieved).toEqual(sortedOriginal);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============ 模型配置属性测试生成器 ============

/**
 * 生成有效的 API 提供商
 */
const apiProviderArb = fc.constantFrom<ApiProvider>('gemini', 'openai');

/**
 * 生成有效的思考深度级别
 */
const thinkingLevelArb = fc.constantFrom<ThinkingLevel>('low', 'high');

/**
 * 生成有效的媒体分辨率
 */
const mediaResolutionArb = fc.constantFrom<MediaResolution>(
  'media_resolution_low',
  'media_resolution_medium',
  'media_resolution_high',
  'media_resolution_ultra_high'
);

/**
 * 生成有效的模型能力
 */
const modelCapabilitiesArb = fc.record({
  supportsThinking: fc.option(fc.boolean(), { nil: undefined }),
  supportsMediaResolution: fc.option(fc.boolean(), { nil: undefined }),
  supportsImageGeneration: fc.option(fc.boolean(), { nil: undefined }),
  maxInputTokens: fc.option(fc.integer({ min: 1, max: 2000000 }), { nil: undefined }),
  maxOutputTokens: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined }),
});

/**
 * 生成有效的高级参数配置
 */
const modelAdvancedConfigArb = fc.record({
  thinkingLevel: fc.option(thinkingLevelArb, { nil: undefined }),
  mediaResolution: fc.option(mediaResolutionArb, { nil: undefined }),
});

/**
 * 生成有效的模型配置
 */
const modelConfigArb: fc.Arbitrary<ModelConfig> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 500 }),
  isCustom: fc.option(fc.boolean(), { nil: undefined }),
  redirectTo: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  capabilities: fc.option(modelCapabilitiesArb, { nil: undefined }),
  advancedConfig: fc.option(modelAdvancedConfigArb, { nil: undefined }),
  provider: fc.option(apiProviderArb, { nil: undefined }),
});

describe('模型配置属性测试', () => {
  // 每个测试前删除数据库确保干净状态
  beforeEach(async () => {
    await deleteDatabase();
  });

  // 每个测试后关闭数据库连接
  afterEach(async () => {
    await deleteDatabase();
  });

  /**
   * **Feature: model-management, Property 7: 持久化往返一致性**
   * *对于任意* 模型配置列表，保存到 IndexedDB 后再加载，应该得到等价的配置列表。
   * **Validates: Requirements 2.5, 5.1, 5.2**
   */
  it('Property 7: 持久化往返一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(modelConfigArb, { minLength: 1, maxLength: 10 }),
        async (configs) => {
          // 每次迭代前删除数据库确保干净状态
          await deleteDatabase();

          // 保存模型配置
          await saveModelConfigs(configs);

          // 加载模型配置
          const retrieved = await loadModelConfigs();

          // 验证往返一致性
          expect(retrieved).toEqual(configs);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: model-management, Property 8: 重置恢复默认值**
   * *对于任意* 用户自定义配置状态，执行重置操作后，模型列表应该与预设的 GEMINI_MODELS 一致。
   * **Validates: Requirements 5.4**
   */
  it('Property 8: 重置恢复默认值', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(modelConfigArb, { minLength: 1, maxLength: 10 }),
        async (customConfigs) => {
          // 每次迭代前删除数据库确保干净状态
          await deleteDatabase();

          // 保存自定义配置
          await saveModelConfigs(customConfigs);

          // 验证自定义配置已保存
          const savedConfigs = await loadModelConfigs();
          expect(savedConfigs).toEqual(customConfigs);

          // 执行重置
          const resetConfigs = await resetModelConfigs();

          // 验证重置后返回预设模型
          const expectedConfigs = GEMINI_MODELS.map(model => ({
            ...model,
            isCustom: false,
            provider: 'gemini' as const,
          }));
          expect(resetConfigs).toEqual(expectedConfigs);

          // 验证再次加载也是预设模型
          const loadedAfterReset = await loadModelConfigs();
          expect(loadedAfterReset).toEqual(expectedConfigs);
        }
      ),
      { numRuns: 100 }
    );
  });
});
