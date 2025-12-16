/**
 * 消息处理工具函数
 * 需求: 5.6, 6.3, 9.4
 */

import type { Message, Attachment } from '../types/models';
import type { GeminiContent, GeminiPart } from '../types/gemini';

/**
 * 将消息转换为 Gemini API 格式
 * 需求: 5.6, 6.3
 * 
 * @param message 消息对象
 * @returns Gemini API 格式的内容对象
 */
export function messageToGeminiContent(message: Message): GeminiContent {
  const parts: GeminiPart[] = [];

  // 添加文本内容（保持原样，不进行预处理）
  // 需求: 9.4
  if (message.content) {
    parts.push({ text: message.content });
  }

  // 添加附件
  if (message.attachments && message.attachments.length > 0) {
    for (const attachment of message.attachments) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data,
        },
      });
    }
  }

  return {
    role: message.role,
    parts,
  };
}

/**
 * 将对话历史转换为 Gemini API 格式
 * 
 * @param messages 消息数组
 * @returns Gemini API 格式的内容数组
 */
export function conversationToGeminiContents(messages: Message[]): GeminiContent[] {
  return messages.map(messageToGeminiContent);
}

/**
 * 构建多模态消息的 parts 数组
 * 需求: 6.3, 6.5
 * 
 * @param content 文本内容
 * @param attachments 附件列表
 * @returns Gemini API 格式的 parts 数组
 */
export function buildMessageParts(content: string, attachments?: Attachment[]): GeminiPart[] {
  const parts: GeminiPart[] = [];

  // 添加文本内容（保持原样，不进行预处理）
  // 需求: 9.4
  if (content) {
    parts.push({ text: content });
  }

  // 添加附件
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data,
        },
      });
    }
  }

  return parts;
}

/**
 * 从 Gemini parts 中提取文本内容
 * 
 * @param parts Gemini API 格式的 parts 数组
 * @returns 提取的文本内容
 */
export function extractTextFromParts(parts: GeminiPart[]): string {
  return parts
    .filter((part): part is { text: string } => 'text' in part)
    .map(part => part.text)
    .join('');
}

/**
 * 从 Gemini parts 中提取附件数量
 * 
 * @param parts Gemini API 格式的 parts 数组
 * @returns 附件数量
 */
export function countInlineDataParts(parts: GeminiPart[]): number {
  return parts.filter(part => 'inlineData' in part).length;
}
