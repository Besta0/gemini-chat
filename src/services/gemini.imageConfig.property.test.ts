/**
 * 图片参数配置映射正确性属性测试
 * **Feature: gemini3-params-ui, Property 3: 图片参数配置映射正确性**
 * **Validates: Requirements 2.5**
 * 
 * 需求 2.5: WHEN 用户发送图片生成请求 THEN 系统 SHALL 在 API 请求中包含 imageConfig.aspectRatio 和 imageConfig.imageSize 参数
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { buildImageConfig, buildRequestBody } from './gemini';
import type { GeminiContent } from '../types';
import type { ImageAspectRatio, ImageSize, ImageGenerationConfig, ModelAdvancedConfig } from '../types/models';

describe('gemini3-params-ui: 图片参数配置映射正确性', () => {
  // 生成有效的图片宽高比
  const aspectRatioArbitrary: fc.Arbitrary<ImageAspectRatio> = fc.constantFrom(
    '1:1', '16:9', '9:16', '4:3', '3:4'
  );

  // 生成有效的图片分辨率
  const imageSizeArbitrary: fc.Arbitrary<ImageSize> = fc.constantFrom('1K', '2K', '4K');

  // 生成有效的图片生成配置
  const imageConfigArbitrary: fc.Arbitrary<ImageGenerationConfig> = fc.record({
    aspectRatio: aspectRatioArbitrary,
    imageSize: imageSizeArbitrary,
  });

  // 生成有效的 GeminiContent
  const geminiContentArbitrary: fc.Arbitrary<GeminiContent> = fc.record({
    role: fc.constantFrom('user', 'model') as fc.Arbitrary<'user' | 'model'>,
    parts: fc.array(
      fc.record({ text: fc.string({ minLength: 1, maxLength: 100 }) }),
      { minLength: 1, maxLength: 3 }
    ),
  });

  /**
   * **Feature: gemini3-params-ui, Property 3: 图片参数配置映射正确性**
   * *对于任意*图片宽高比和分辨率配置，构建的 API 请求中 imageConfig 应包含正确的 aspectRatio 和 imageSize 值
   * **Validates: Requirements 2.5**
   */
  describe('Property 3: 图片参数配置映射正确性', () => {
    it('buildImageConfig 应该将图片配置直接映射到 imageConfig 字段', () => {
      fc.assert(
        fc.property(imageConfigArbitrary, (config) => {
          const result = buildImageConfig(config);
          
          // 验证: imageConfig.aspectRatio 应与配置的值一致
          // 验证: imageConfig.imageSize 应与配置的值一致
          return result.aspectRatio === config.aspectRatio &&
                 result.imageSize === config.imageSize;
        }),
        { numRuns: 100 }
      );
    });

    it('对于任意图片宽高比，buildImageConfig 应正确映射 aspectRatio', () => {
      fc.assert(
        fc.property(aspectRatioArbitrary, imageSizeArbitrary, (aspectRatio, imageSize) => {
          const config: ImageGenerationConfig = { aspectRatio, imageSize };
          const result = buildImageConfig(config);
          
          // 验证: aspectRatio 正确映射
          return result.aspectRatio === aspectRatio;
        }),
        { numRuns: 100 }
      );
    });

    it('对于任意图片分辨率，buildImageConfig 应正确映射 imageSize', () => {
      fc.assert(
        fc.property(aspectRatioArbitrary, imageSizeArbitrary, (aspectRatio, imageSize) => {
          const config: ImageGenerationConfig = { aspectRatio, imageSize };
          const result = buildImageConfig(config);
          
          // 验证: imageSize 正确映射
          return result.imageSize === imageSize;
        }),
        { numRuns: 100 }
      );
    });

    it('对于任意图片配置，buildRequestBody 应该正确传递到 imageConfig', () => {
      fc.assert(
        fc.property(
          fc.array(geminiContentArbitrary, { minLength: 1, maxLength: 3 }),
          imageConfigArbitrary,
          (contents, imageConfig) => {
            const advancedConfig: ModelAdvancedConfig = { imageConfig };
            const result = buildRequestBody(contents, undefined, undefined, undefined, advancedConfig);
            
            // 需求 2.5: 验证 API 请求中包含正确的 imageConfig.aspectRatio 和 imageConfig.imageSize
            return result.imageConfig !== undefined &&
                   result.imageConfig.aspectRatio === imageConfig.aspectRatio &&
                   result.imageConfig.imageSize === imageConfig.imageSize;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('当未提供 imageConfig 时，请求体不应包含 imageConfig', () => {
      fc.assert(
        fc.property(
          fc.array(geminiContentArbitrary, { minLength: 1, maxLength: 3 }),
          (contents) => {
            // 不提供 imageConfig
            const advancedConfig: ModelAdvancedConfig = {};
            const result = buildRequestBody(contents, undefined, undefined, undefined, advancedConfig);
            
            // 验证: 没有 imageConfig 时不应该有 imageConfig 字段
            return result.imageConfig === undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('imageConfig 配置不应影响其他请求参数', () => {
      fc.assert(
        fc.property(
          fc.array(geminiContentArbitrary, { minLength: 1, maxLength: 3 }),
          imageConfigArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (contents, imageConfig, systemInstruction) => {
            const advancedConfig: ModelAdvancedConfig = { imageConfig };
            const result = buildRequestBody(contents, undefined, undefined, systemInstruction, advancedConfig);
            
            // 验证: contents 保持不变
            const contentsMatch = result.contents.length === contents.length;
            
            // 验证: systemInstruction 正确设置
            const systemInstructionMatch = result.systemInstruction !== undefined &&
                   result.systemInstruction.parts.length > 0;
            
            // 验证: imageConfig 正确设置
            const imageConfigMatch = result.imageConfig !== undefined &&
                   result.imageConfig.aspectRatio === imageConfig.aspectRatio &&
                   result.imageConfig.imageSize === imageConfig.imageSize;
            
            return contentsMatch && systemInstructionMatch && imageConfigMatch;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('imageConfig 和 thinkingLevel 可以同时存在于请求中', () => {
      fc.assert(
        fc.property(
          fc.array(geminiContentArbitrary, { minLength: 1, maxLength: 3 }),
          imageConfigArbitrary,
          fc.constantFrom('low', 'high') as fc.Arbitrary<'low' | 'high'>,
          (contents, imageConfig, thinkingLevel) => {
            const advancedConfig: ModelAdvancedConfig = { imageConfig, thinkingLevel };
            const result = buildRequestBody(contents, undefined, undefined, undefined, advancedConfig);
            
            // 验证: 两个配置都正确设置
            const imageConfigMatch = result.imageConfig !== undefined &&
                   result.imageConfig.aspectRatio === imageConfig.aspectRatio &&
                   result.imageConfig.imageSize === imageConfig.imageSize;
            
            const thinkingConfigMatch = result.thinkingConfig !== undefined &&
                   result.thinkingConfig.thinkingLevel === thinkingLevel;
            
            return imageConfigMatch && thinkingConfigMatch;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
