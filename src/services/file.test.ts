/**
 * 文件处理服务属性测试
 * **Feature: gemini-chat, Property 8: 文件类型验证正确性**
 * **Feature: gemini-chat, Property 9: 文件 Base64 转换往返一致性**
 * **验证: 需求 6.1, 6.2, 7.1, 7.3**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateFile,
  getFileExtension,
  getFileCategory,
  isImageFile,
  isDocumentFile,
  fileToBase64,
  base64ToBytes,
} from './file';
import {
  IMAGE_SIZE_LIMIT,
  DOCUMENT_SIZE_LIMIT,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_DOCUMENT_TYPES,
} from '../types/models';

// ============ 辅助函数 ============

/**
 * 创建模拟 File 对象
 */
function createMockFile(
  name: string,
  size: number,
  type: string,
  content?: Uint8Array
): File {
  const actualContent = content || new Uint8Array(size);
  // 创建新的 ArrayBuffer 并复制数据以避免类型问题
  const newBuffer = new ArrayBuffer(actualContent.length);
  const newView = new Uint8Array(newBuffer);
  newView.set(actualContent);
  const blob = new Blob([newBuffer], { type });
  return new File([blob], name, { type });
}

// ============ 生成器定义 ============

/**
 * 生成支持的图片 MIME 类型
 */
const supportedImageTypeArb = fc.constantFrom(...SUPPORTED_IMAGE_TYPES);

/**
 * 生成支持的文档 MIME 类型
 */
const supportedDocumentTypeArb = fc.constantFrom(...SUPPORTED_DOCUMENT_TYPES);

/**
 * 生成不支持的 MIME 类型
 */
const unsupportedMimeTypeArb = fc.constantFrom(
  'video/mp4',
  'audio/mpeg',
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.ms-excel',
  'application/msword'
);

/**
 * 生成有效的图片文件大小（不超过限制）
 */
const validImageSizeArb = fc.integer({ min: 1, max: IMAGE_SIZE_LIMIT });

/**
 * 生成超过限制的图片文件大小
 */
const oversizedImageSizeArb = fc.integer({ 
  min: IMAGE_SIZE_LIMIT + 1, 
  max: IMAGE_SIZE_LIMIT + 1024 * 1024 
});

/**
 * 生成有效的文档文件大小（不超过限制）
 */
const validDocumentSizeArb = fc.integer({ min: 1, max: DOCUMENT_SIZE_LIMIT });

/**
 * 生成超过限制的文档文件大小
 */
const oversizedDocumentSizeArb = fc.integer({ 
  min: DOCUMENT_SIZE_LIMIT + 1, 
  max: DOCUMENT_SIZE_LIMIT + 1024 * 1024 
});

/**
 * 生成有效的文件名
 */
const fileNameArb = fc.string({ minLength: 1, maxLength: 50 }).map(s => 
  s.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') || 'file'
);

// ============ Property 8: 文件类型验证正确性 ============

describe('文件验证属性测试', () => {
  /**
   * **Feature: gemini-chat, Property 8: 文件类型验证正确性**
   * *对于任意* 文件，验证函数应该正确识别支持的图片格式（JPEG、PNG、WebP、GIF）
   * 和文档格式（PDF、TXT、代码文件），拒绝不支持的格式。
   * **验证: 需求 6.1, 7.1**
   */
  describe('Property 8: 文件类型验证正确性', () => {
    it('支持的图片类型应该通过验证（大小在限制内）', () => {
      fc.assert(
        fc.property(
          supportedImageTypeArb,
          validImageSizeArb,
          fileNameArb,
          (mimeType, size, name) => {
            const file = createMockFile(`${name}.img`, size, mimeType);
            const result = validateFile(file);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('支持的文档类型应该通过验证（大小在限制内）', () => {
      fc.assert(
        fc.property(
          supportedDocumentTypeArb,
          validDocumentSizeArb,
          fileNameArb,
          (mimeType, size, name) => {
            const file = createMockFile(`${name}.doc`, size, mimeType);
            const result = validateFile(file);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('不支持的文件类型应该被拒绝', () => {
      fc.assert(
        fc.property(
          unsupportedMimeTypeArb,
          fc.integer({ min: 1, max: 1000000 }),
          fileNameArb,
          (mimeType, size, name) => {
            const file = createMockFile(name, size, mimeType);
            const result = validateFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('不支持的文件格式');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('超过大小限制的图片应该被拒绝', () => {
      fc.assert(
        fc.property(
          supportedImageTypeArb,
          oversizedImageSizeArb,
          fileNameArb,
          (mimeType, size, name) => {
            const file = createMockFile(`${name}.img`, size, mimeType);
            const result = validateFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('图片文件大小超过限制');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('超过大小限制的文档应该被拒绝', () => {
      fc.assert(
        fc.property(
          supportedDocumentTypeArb,
          oversizedDocumentSizeArb,
          fileNameArb,
          (mimeType, size, name) => {
            const file = createMockFile(`${name}.doc`, size, mimeType);
            const result = validateFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('文档文件大小超过限制');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============ Property 9: 文件 Base64 转换往返一致性 ============

describe('文件转换属性测试', () => {
  /**
   * **Feature: gemini-chat, Property 9: 文件 Base64 转换往返一致性**
   * *对于任意* 有效的二进制文件数据，转换为 base64 后再解码应该得到原始数据。
   * **验证: 需求 6.2, 7.3**
   */
  describe('Property 9: 文件 Base64 转换往返一致性', () => {
    it('任意二进制数据转换为 base64 后再解码应该得到原始数据', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机二进制数据（限制大小以保持测试速度）
          fc.uint8Array({ minLength: 1, maxLength: 10000 }),
          async (originalBytes) => {
            // 创建包含原始数据的文件
            const file = createMockFile(
              'test.bin',
              originalBytes.length,
              'application/octet-stream',
              originalBytes
            );

            // 转换为 base64
            const base64 = await fileToBase64(file);

            // 解码回字节数组
            const decodedBytes = base64ToBytes(base64);

            // 验证往返一致性
            expect(decodedBytes.length).toBe(originalBytes.length);
            for (let i = 0; i < originalBytes.length; i++) {
              expect(decodedBytes[i]).toBe(originalBytes[i]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============ 辅助函数单元测试 ============

describe('辅助函数测试', () => {
  describe('getFileExtension', () => {
    it('应该正确提取文件扩展名', () => {
      expect(getFileExtension('test.txt')).toBe('.txt');
      expect(getFileExtension('image.PNG')).toBe('.png');
      expect(getFileExtension('file.test.js')).toBe('.js');
      expect(getFileExtension('noextension')).toBe('');
      expect(getFileExtension('file.')).toBe('');
    });
  });

  describe('getFileCategory', () => {
    it('应该正确识别图片类型', () => {
      expect(getFileCategory('image/jpeg')).toBe('image');
      expect(getFileCategory('image/png')).toBe('image');
      expect(getFileCategory('image/webp')).toBe('image');
      expect(getFileCategory('image/gif')).toBe('image');
    });

    it('应该正确识别文档类型', () => {
      expect(getFileCategory('application/pdf')).toBe('document');
      expect(getFileCategory('text/plain')).toBe('document');
      expect(getFileCategory('text/javascript')).toBe('document');
    });

    it('应该将不支持的类型标记为 unknown', () => {
      expect(getFileCategory('video/mp4')).toBe('unknown');
      expect(getFileCategory('audio/mpeg')).toBe('unknown');
    });
  });

  describe('isImageFile', () => {
    it('应该正确识别图片文件', () => {
      expect(isImageFile('image/jpeg')).toBe(true);
      expect(isImageFile('image/png')).toBe(true);
      expect(isImageFile('application/pdf')).toBe(false);
    });
  });

  describe('isDocumentFile', () => {
    it('应该正确识别文档文件', () => {
      expect(isDocumentFile('application/pdf')).toBe(true);
      expect(isDocumentFile('text/plain')).toBe(true);
      expect(isDocumentFile('image/jpeg')).toBe(false);
    });
  });
});
