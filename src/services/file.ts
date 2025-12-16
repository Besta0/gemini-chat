/**
 * 文件处理服务
 * 需求: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4
 */

import type { GeminiPart } from '../types/gemini';
import {
  IMAGE_SIZE_LIMIT,
  DOCUMENT_SIZE_LIMIT,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_DOCUMENT_TYPES,
  CODE_FILE_EXTENSIONS,
} from '../types/models';

// ============ 类型定义 ============

/**
 * 文件验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息（如果无效） */
  error?: string;
}

/**
 * 文件类型分类
 */
export type FileCategory = 'image' | 'document' | 'unknown';

// ============ 文件验证功能 ============

/**
 * 获取文件的 MIME 类型
 * 如果浏览器无法识别，尝试根据扩展名推断
 */
export function getFileMimeType(file: File): string {
  // 如果浏览器已识别 MIME 类型，直接使用
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }

  // 根据扩展名推断
  const extension = getFileExtension(file.name);
  if (extension && CODE_FILE_EXTENSIONS[extension]) {
    return CODE_FILE_EXTENSIONS[extension];
  }

  // 默认返回原始类型或通用二进制类型
  return file.type || 'application/octet-stream';
}

/**
 * 获取文件扩展名（包含点号）
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDot).toLowerCase();
}

/**
 * 判断文件类型分类
 */
export function getFileCategory(mimeType: string): FileCategory {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    return 'image';
  }
  if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) {
    return 'document';
  }
  return 'unknown';
}

/**
 * 检查是否为支持的图片类型
 */
export function isImageFile(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType);
}

/**
 * 检查是否为支持的文档类型
 */
export function isDocumentFile(mimeType: string): boolean {
  return SUPPORTED_DOCUMENT_TYPES.includes(mimeType);
}

/**
 * 检查是否为文本类文件（可以直接读取内容）
 */
export function isTextFile(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  );
}

/**
 * 验证文件类型和大小
 * 需求: 6.1, 6.4, 7.1, 7.4
 * 
 * @param file 要验证的文件
 * @returns 验证结果
 */
export function validateFile(file: File): ValidationResult {
  const mimeType = getFileMimeType(file);
  const category = getFileCategory(mimeType);

  // 检查文件类型是否支持
  if (category === 'unknown') {
    // 尝试通过扩展名判断
    const extension = getFileExtension(file.name);
    if (!extension || !CODE_FILE_EXTENSIONS[extension]) {
      return {
        valid: false,
        error: `不支持的文件格式: ${mimeType || '未知'}。支持的格式：图片（JPEG、PNG、WebP、GIF）、文档（PDF、TXT、代码文件）`,
      };
    }
  }

  // 根据文件类型检查大小限制
  if (category === 'image') {
    if (file.size > IMAGE_SIZE_LIMIT) {
      return {
        valid: false,
        error: `图片文件大小超过限制。最大允许 20MB，当前文件大小 ${formatFileSize(file.size)}`,
      };
    }
  } else {
    // 文档类型
    if (file.size > DOCUMENT_SIZE_LIMIT) {
      return {
        valid: false,
        error: `文档文件大小超过限制。最大允许 50MB，当前文件大小 ${formatFileSize(file.size)}`,
      };
    }
  }

  return { valid: true };
}

/**
 * 格式化文件大小为可读字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


// ============ 文件转换功能 ============

/**
 * 将文件转换为 Base64 编码
 * 需求: 6.2, 7.3
 * 
 * @param file 要转换的文件
 * @returns Base64 编码的字符串（不包含 data URL 前缀）
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data URL 前缀，只保留 base64 数据
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error(`文件读取失败: ${file.name}`));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 读取文本文件内容
 * 需求: 7.2
 * 
 * @param file 要读取的文本文件
 * @returns 文件文本内容
 */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error(`文件读取失败: ${file.name}`));
    };
    
    reader.readAsText(file);
  });
}

/**
 * 将文件转换为 Gemini API 格式的 Part
 * 需求: 6.2, 6.3, 7.2, 7.3
 * 
 * @param file 要转换的文件
 * @returns Gemini API 格式的 Part 对象
 */
export async function fileToGeminiPart(file: File): Promise<GeminiPart> {
  const mimeType = getFileMimeType(file);
  
  // 文本类文件直接读取内容作为文本
  if (isTextFile(mimeType) && mimeType !== 'application/pdf') {
    const text = await readTextFile(file);
    return { text: `[文件: ${file.name}]\n${text}` };
  }
  
  // 图片和 PDF 等二进制文件转换为 base64
  const base64Data = await fileToBase64(file);
  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}

/**
 * 将 Base64 字符串解码为 Uint8Array
 * 用于测试往返一致性
 * 
 * @param base64 Base64 编码的字符串
 * @returns 解码后的字节数组
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
