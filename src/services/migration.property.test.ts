/**
 * 数据迁移属性测试
 * 使用 fast-check 进行属性测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { LegacyConversation } from '../types/chatWindow';
import type { Message, Attachment } from '../types/models';
import {
  migrateConversationToChatWindow,
  migrateConversationsToChatWindows,
  isLegacyConversation,
  isChatWindow,
  getStorageVersion,
  setStorageVersion,
  resetStorageVersion,
  needsMigration,
  CURRENT_STORAGE_VERSION,
  LEGACY_STORAGE_VERSION,
} from './migration';

// ============ 生成器 ============

/**
 * 生成有效的附件
 */
const attachmentArb: fc.Arbitrary<Attachment> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('image', 'file') as fc.Arbitrary<'image' | 'file'>,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  mimeType: fc.constantFrom('image/png', 'image/jpeg', 'application/pdf', 'text/plain'),
  data: fc.base64String({ minLength: 10, maxLength: 100 }),
  size: fc.integer({ min: 1, max: 10000000 }),
});

/**
 * 生成有效的消息
 */
const messageArb: fc.Arbitrary<Message> = fc.record({
  id: fc.uuid(),
  role: fc.constantFrom('user', 'model') as fc.Arbitrary<'user' | 'model'>,
  content: fc.string({ maxLength: 1000 }),
  attachments: fc.option(fc.array(attachmentArb, { maxLength: 3 }), { nil: undefined }),
  timestamp: fc.integer({ min: 0 }),
});

/**
 * 生成有效的模型 ID
 */
const modelIdArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_.'.split('')),
  { minLength: 1, maxLength: 50 }
);

/**
 * 生成有效的旧版对话
 */
const legacyConversationArb: fc.Arbitrary<LegacyConversation> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  messages: fc.array(messageArb, { minLength: 0, maxLength: 20 }),
  model: modelIdArb,
  systemInstruction: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  createdAt: fc.integer({ min: 0 }),
  updatedAt: fc.integer({ min: 0 }),
});

// ============ 属性测试 ============

describe('数据迁移属性测试', () => {
  beforeEach(() => {
    // 重置存储版本
    resetStorageVersion();
  });

  /**
   * **Feature: ui-redesign, Property 12: 数据迁移一致性**
   * 
   * 对于任意旧版 Conversation 数据，迁移到 ChatWindow 后，原有消息内容应完整保留
   * 
   * **Validates: Requirements 12.4**
   */
  it('Property 12: 数据迁移一致性 - 消息内容完整保留', () => {
    fc.assert(
      fc.property(legacyConversationArb, (legacyConv) => {
        // 执行迁移
        const chatWindow = migrateConversationToChatWindow(legacyConv);

        // 验证：消息数量一致
        expect(chatWindow.subTopics).toHaveLength(1);
        const subTopic = chatWindow.subTopics[0];
        if (!subTopic) return;
        expect(subTopic.messages).toHaveLength(legacyConv.messages.length);

        // 验证：每条消息内容完整保留
        legacyConv.messages.forEach((originalMsg, index) => {
          const migratedMsg = subTopic.messages[index];
          if (!migratedMsg) return;
          
          // 验证消息 ID
          expect(migratedMsg.id).toBe(originalMsg.id);
          
          // 验证消息角色
          expect(migratedMsg.role).toBe(originalMsg.role);
          
          // 验证消息内容
          expect(migratedMsg.content).toBe(originalMsg.content);
          
          // 验证时间戳
          expect(migratedMsg.timestamp).toBe(originalMsg.timestamp);
          
          // 验证附件（如果存在）
          if (originalMsg.attachments) {
            expect(migratedMsg.attachments).toEqual(originalMsg.attachments);
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 12: 数据迁移一致性**
   * 
   * 迁移后保留原有的 ID 和标题
   * 
   * **Validates: Requirements 12.4**
   */
  it('Property 12: 数据迁移一致性 - ID 和标题保留', () => {
    fc.assert(
      fc.property(legacyConversationArb, (legacyConv) => {
        const chatWindow = migrateConversationToChatWindow(legacyConv);

        // 验证：ID 保留
        expect(chatWindow.id).toBe(legacyConv.id);

        // 验证：标题保留
        expect(chatWindow.title).toBe(legacyConv.title);

        // 验证：创建时间保留
        expect(chatWindow.createdAt).toBe(legacyConv.createdAt);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 12: 数据迁移一致性**
   * 
   * 迁移后模型和系统指令正确迁移到配置中
   * 
   * **Validates: Requirements 12.4**
   */
  it('Property 12: 数据迁移一致性 - 模型和系统指令迁移到配置', () => {
    fc.assert(
      fc.property(legacyConversationArb, (legacyConv) => {
        const chatWindow = migrateConversationToChatWindow(legacyConv);

        // 验证：模型迁移到配置
        expect(chatWindow.config.model).toBe(legacyConv.model);

        // 验证：系统指令迁移到配置
        if (legacyConv.systemInstruction) {
          expect(chatWindow.config.systemInstruction).toBe(legacyConv.systemInstruction);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 12: 数据迁移一致性**
   * 
   * 批量迁移保持数据一致性
   * 
   * **Validates: Requirements 12.4**
   */
  it('Property 12: 数据迁移一致性 - 批量迁移保持一致性', () => {
    fc.assert(
      fc.property(
        fc.array(legacyConversationArb, { minLength: 1, maxLength: 10 }),
        (legacyConvs) => {
          // 执行批量迁移
          const chatWindows = migrateConversationsToChatWindows(legacyConvs);

          // 验证：数量一致
          expect(chatWindows).toHaveLength(legacyConvs.length);

          // 验证：每个窗口的消息内容完整
          legacyConvs.forEach((legacyConv, index) => {
            const chatWindow = chatWindows[index];
            if (!chatWindow) return;
            
            // ID 一致
            expect(chatWindow.id).toBe(legacyConv.id);
            
            // 消息数量一致
            const firstSubTopic = chatWindow.subTopics[0];
            if (!firstSubTopic) return;
            expect(firstSubTopic.messages).toHaveLength(legacyConv.messages.length);
            
            // 消息内容一致
            legacyConv.messages.forEach((msg, msgIndex) => {
              const migratedMsg = firstSubTopic.messages[msgIndex];
              if (!migratedMsg) return;
              expect(migratedMsg.content).toBe(msg.content);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('数据格式验证测试', () => {
  it('isLegacyConversation 正确识别旧版格式', () => {
    fc.assert(
      fc.property(legacyConversationArb, (legacyConv) => {
        expect(isLegacyConversation(legacyConv)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('isChatWindow 正确识别新版格式', () => {
    fc.assert(
      fc.property(legacyConversationArb, (legacyConv) => {
        const chatWindow = migrateConversationToChatWindow(legacyConv);
        expect(isChatWindow(chatWindow)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('迁移后的数据不再被识别为旧版格式', () => {
    fc.assert(
      fc.property(legacyConversationArb, (legacyConv) => {
        const chatWindow = migrateConversationToChatWindow(legacyConv);
        expect(isLegacyConversation(chatWindow)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('版本检测测试', () => {
  beforeEach(() => {
    resetStorageVersion();
  });

  it('默认版本为旧版', () => {
    expect(getStorageVersion()).toBe(LEGACY_STORAGE_VERSION);
  });

  it('设置版本后可以正确读取', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (version) => {
        setStorageVersion(version);
        expect(getStorageVersion()).toBe(version);
      }),
      { numRuns: 50 }
    );
  });

  it('needsMigration 在旧版本时返回 true', () => {
    resetStorageVersion();
    expect(needsMigration()).toBe(true);
  });

  it('needsMigration 在当前版本时返回 false', () => {
    setStorageVersion(CURRENT_STORAGE_VERSION);
    expect(needsMigration()).toBe(false);
  });
});

describe('迁移结构完整性测试', () => {
  it('迁移后的 ChatWindow 结构完整', () => {
    fc.assert(
      fc.property(legacyConversationArb, (legacyConv) => {
        const chatWindow = migrateConversationToChatWindow(legacyConv);

        // 验证必要字段存在
        expect(chatWindow.id).toBeDefined();
        expect(chatWindow.title).toBeDefined();
        expect(chatWindow.config).toBeDefined();
        expect(chatWindow.subTopics).toBeDefined();
        expect(chatWindow.activeSubTopicId).toBeDefined();
        expect(chatWindow.createdAt).toBeDefined();
        expect(chatWindow.updatedAt).toBeDefined();

        // 验证配置结构
        expect(chatWindow.config.model).toBeDefined();
        expect(chatWindow.config.generationConfig).toBeDefined();

        // 验证子话题结构
        expect(chatWindow.subTopics.length).toBeGreaterThan(0);
        const subTopic = chatWindow.subTopics[0];
        if (!subTopic) return;
        expect(subTopic.id).toBeDefined();
        expect(subTopic.title).toBeDefined();
        expect(subTopic.messages).toBeDefined();
        expect(subTopic.createdAt).toBeDefined();
        expect(subTopic.updatedAt).toBeDefined();

        // 验证 activeSubTopicId 指向有效的子话题
        expect(chatWindow.subTopics.some(st => st.id === chatWindow.activeSubTopicId)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
