/**
 * 消息内容属性测试
 * **Feature: gemini-chat, Property 10: 多模态消息构建正确性**
 * **Feature: gemini-chat, Property 14: 消息内容保持原样**
 * **验证: 需求 6.3, 6.5, 9.4**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  messageToGeminiContent,
  buildMessageParts,
  extractTextFromParts,
  countInlineDataParts,
} from './message';
import type { Message, Attachment } from '../types/models';
import { SUPPORTED_IMAGE_TYPES, SUPPORTED_DOCUMENT_TYPES } from '../types/models';

// ============ 生成器定义 ============

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 生成有效的消息内容
 * 包含各种字符：字母、数字、中文、空格、换行、特殊字符
 */
const messageContentArb = fc.oneof(
  // 普通文本
  fc.string({ minLength: 1, maxLength: 500 }),
  // 包含换行的文本
  fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 })
    .map(lines => lines.join('\n')),
  // 包含特殊字符的文本
  fc.stringMatching(/^[\w\s\u4e00-\u9fa5!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{1,200}$/),
  // Markdown 格式文本
  fc.tuple(
    fc.constantFrom('# ', '## ', '### ', '**', '*', '`', '```\n', '- ', '1. '),
    fc.string({ minLength: 1, maxLength: 100 })
  ).map(([prefix, text]) => prefix + text),
);

/**
 * 生成有效的 MIME 类型
 */
const mimeTypeArb = fc.constantFrom(
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_DOCUMENT_TYPES
);

/**
 * 生成有效的 base64 数据
 */
const base64DataArb = fc.uint8Array({ minLength: 1, maxLength: 100 })
  .map(bytes => {
    // 将字节数组转换为 base64
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary);
  });

/**
 * 生成有效的附件对象
 */
const attachmentArb: fc.Arbitrary<Attachment> = fc.record({
  id: fc.constant('').map(() => generateId()),
  type: fc.constantFrom<'image' | 'file'>('image', 'file'),
  name: fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}\.(jpg|png|pdf|txt|js)$/),
  mimeType: mimeTypeArb,
  data: base64DataArb,
  size: fc.integer({ min: 1, max: 1000000 }),
});

/**
 * 生成有效的消息对象
 */
const messageArb: fc.Arbitrary<Message> = fc.record({
  id: fc.constant('').map(() => generateId()),
  role: fc.constantFrom<'user' | 'model'>('user', 'model'),
  content: messageContentArb,
  attachments: fc.oneof(
    fc.constant(undefined),
    fc.array(attachmentArb, { minLength: 0, maxLength: 5 })
  ),
  timestamp: fc.integer({ min: 0 }),
});

/**
 * 生成带附件的消息对象
 */
const messageWithAttachmentsArb: fc.Arbitrary<Message> = fc.record({
  id: fc.constant('').map(() => generateId()),
  role: fc.constantFrom<'user' | 'model'>('user', 'model'),
  content: messageContentArb,
  attachments: fc.array(attachmentArb, { minLength: 1, maxLength: 5 }),
  timestamp: fc.integer({ min: 0 }),
});

// ============ 测试套件 ============

describe('消息内容属性测试', () => {
  /**
   * **Feature: gemini-chat, Property 10: 多模态消息构建正确性**
   * *对于任意* 文本内容和附件列表组合，构建的消息 parts 数组应该包含所有文本和附件，
   * 且附件使用正确的 inlineData 格式。
   * **验证: 需求 6.3, 6.5**
   */
  it('Property 10: 多模态消息构建正确性', () => {
    fc.assert(
      fc.property(
        messageContentArb,
        fc.array(attachmentArb, { minLength: 0, maxLength: 5 }),
        (content, attachments) => {
          // 构建消息 parts
          const parts = buildMessageParts(content, attachments);

          // 验证文本内容被包含
          if (content) {
            const extractedText = extractTextFromParts(parts);
            expect(extractedText).toBe(content);
          }

          // 验证附件数量正确
          const inlineDataCount = countInlineDataParts(parts);
          expect(inlineDataCount).toBe(attachments.length);

          // 验证每个附件都使用正确的 inlineData 格式
          const inlineDataParts = parts.filter(part => 'inlineData' in part);
          for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];
            const part = inlineDataParts[i];
            
            expect(part).toBeDefined();
            if (part && 'inlineData' in part && attachment) {
              expect(part.inlineData.mimeType).toBe(attachment.mimeType);
              expect(part.inlineData.data).toBe(attachment.data);
            }
          }

          // 验证 parts 总数正确（文本 + 附件）
          const expectedPartsCount = (content ? 1 : 0) + attachments.length;
          expect(parts.length).toBe(expectedPartsCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: gemini-chat, Property 14: 消息内容保持原样**
   * *对于任意* 用户输入的文本内容，发送时应该保持原始格式，不进行任何预处理或转换。
   * **验证: 需求 9.4**
   */
  it('Property 14: 消息内容保持原样', () => {
    fc.assert(
      fc.property(
        messageArb,
        (message) => {
          // 转换消息为 Gemini 格式
          const geminiContent = messageToGeminiContent(message);

          // 验证角色正确
          expect(geminiContent.role).toBe(message.role);

          // 验证文本内容保持原样
          if (message.content) {
            const textParts = geminiContent.parts.filter(
              (part): part is { text: string } => 'text' in part
            );
            expect(textParts.length).toBe(1);
            const firstTextPart = textParts[0];
            if (firstTextPart) {
              expect(firstTextPart.text).toBe(message.content);
            }
          }

          // 验证附件数量正确
          const attachmentCount = message.attachments?.length || 0;
          const inlineDataParts = geminiContent.parts.filter(part => 'inlineData' in part);
          expect(inlineDataParts.length).toBe(attachmentCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 补充测试：验证空内容和空附件的边界情况
   */
  it('Property 10 边界情况: 空内容和空附件', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', '\n', '\t'),
        fc.constant([]),
        (content, attachments) => {
          const parts = buildMessageParts(content, attachments);
          
          // 空字符串不应该产生文本 part
          if (content === '') {
            expect(parts.length).toBe(0);
          } else {
            // 非空字符串（包括空白字符）应该保持原样
            expect(parts.length).toBe(1);
            if (parts[0] && 'text' in parts[0]) {
              expect(parts[0].text).toBe(content);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 补充测试：验证多附件消息的顺序保持
   */
  it('Property 10 补充: 多附件顺序保持', () => {
    fc.assert(
      fc.property(
        messageWithAttachmentsArb,
        (message) => {
          const geminiContent = messageToGeminiContent(message);
          const inlineDataParts = geminiContent.parts.filter(
            (part): part is { inlineData: { mimeType: string; data: string } } => 'inlineData' in part
          );

          // 验证附件顺序与原始顺序一致
          const attachments = message.attachments || [];
          for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];
            const part = inlineDataParts[i];
            
            expect(part).toBeDefined();
            if (part && attachment) {
              expect(part.inlineData.mimeType).toBe(attachment.mimeType);
              expect(part.inlineData.data).toBe(attachment.data);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 补充测试：验证特殊字符内容保持原样
   */
  it('Property 14 补充: 特殊字符保持原样', () => {
    const specialCharsArb = fc.constantFrom(
      '# Markdown 标题',
      '**粗体文本**',
      '*斜体文本*',
      '`代码`',
      '```\ncode block\n```',
      '- 列表项',
      '1. 有序列表',
      '[链接](https://example.com)',
      '![图片](image.png)',
      '> 引用',
      '---',
      '| 表格 | 列 |',
      '$E = mc^2$',
      '$$\\int_0^1 x^2 dx$$',
      '<script>alert("xss")</script>',
      '&lt;html&gt;',
      '换行\n测试\n多行',
      '\t制表符\t测试',
      '  前导空格',
      '尾随空格  ',
    );

    fc.assert(
      fc.property(
        specialCharsArb,
        (content) => {
          const message: Message = {
            id: generateId(),
            role: 'user',
            content,
            timestamp: Date.now(),
          };

          const geminiContent = messageToGeminiContent(message);
          const textParts = geminiContent.parts.filter(
            (part): part is { text: string } => 'text' in part
          );

          // 验证特殊字符内容完全保持原样
          expect(textParts.length).toBe(1);
          const firstPart = textParts[0];
          if (firstPart) {
            expect(firstPart.text).toBe(content);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
