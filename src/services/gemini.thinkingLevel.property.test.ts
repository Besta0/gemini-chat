/**
 * 思考程度配置映射正确性属性测试
 * **Feature: gemini3-params-ui, Property 1: 思考程度配置映射正确性**
 * **Validates: Requirements 1.3, 1.4**
 * 
 * 需求 1.3: WHEN 用户选择 low 级别 THEN 系统 SHALL 在 API 请求中设置 thinkingConfig.thinkingLevel 为 "low"
 * 需求 1.4: WHEN 用户选择 high 级别 THEN 系统 SHALL 在 API 请求中设置 thinkingConfig.thinkingLevel 为 "high"
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { buildThinkingConfig, buildRequestBody } from './gemini';
import type { GeminiContent } from '../types';
import type { ThinkingLevel, ModelAdvancedConfig } from '../types/models';

describe('gemini3-params-ui: 思考程度配置映射正确性', () => {
  // 生成有效的思考程度级别
  const thinkingLevelArbitrary: fc.Arbitrary<ThinkingLevel> = fc.constantFrom('low', 'high');

  // 生成有效的 GeminiContent
  const geminiContentArbitrary: fc.Arbitrary<GeminiContent> = fc.record({
    role: fc.constantFrom('user', 'model') as fc.Arbitrary<'user' | 'model'>,
    parts: fc.array(
      fc.record({ text: fc.string({ minLength: 1, maxLength: 100 }) }),
      { minLength: 1, maxLength: 3 }
    ),
  });

  /**
   * **Feature: gemini3-params-ui, Property 1: 思考程度配置映射正确性**
   * *对于任意*思考程度选择（low 或 high），构建的 API 请求中 thinkingConfig.thinkingLevel 应与选择的值一致
   * **Validates: Requirements 1.3, 1.4**
   */
  describe('Property 1: 思考程度配置映射正确性', () => {
    it('buildThinkingConfig 应该将思考程度直接映射到 thinkingLevel 字段', () => {
      fc.assert(
        fc.property(thinkingLevelArbitrary, (level) => {
          const config = buildThinkingConfig(level);
          
          // 验证: thinkingConfig.thinkingLevel 应与选择的值一致
          return config.thinkingLevel === level;
        }),
        { numRuns: 100 }
      );
    });

    it('当选择 low 级别时，API 请求中 thinkingConfig.thinkingLevel 应为 "low"', () => {
      fc.assert(
        fc.property(
          fc.array(geminiContentArbitrary, { minLength: 1, maxLength: 3 }),
          (contents) => {
            const advancedConfig: ModelAdvancedConfig = { thinkingLevel: 'low' };
            const result = buildRequestBody(contents, undefined, undefined, undefined, advancedConfig);
            
            // 需求 1.3: 验证 thinkingConfig.thinkingLevel 为 "low"
            return result.thinkingConfig !== undefined &&
                   result.thinkingConfig.thinkingLevel === 'low';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('当选择 high 级别时，API 请求中 thinkingConfig.thinkingLevel 应为 "high"', () => {
      fc.assert(
        fc.property(
          fc.array(geminiContentArbitrary, { minLength: 1, maxLength: 3 }),
          (contents) => {
            const advancedConfig: ModelAdvancedConfig = { thinkingLevel: 'high' };
            const result = buildRequestBody(contents, undefined, undefined, undefined, advancedConfig);
            
            // 需求 1.4: 验证 thinkingConfig.thinkingLevel 为 "high"
            return result.thinkingConfig !== undefined &&
                   result.thinkingConfig.thinkingLevel === 'high';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('对于任意思考程度选择，buildRequestBody 应该正确传递到 thinkingConfig', () => {
      fc.assert(
        fc.property(
          fc.array(geminiContentArbitrary, { minLength: 1, maxLength: 3 }),
          thinkingLevelArbitrary,
          (contents, thinkingLevel) => {
            const advancedConfig: ModelAdvancedConfig = { thinkingLevel };
            const result = buildRequestBody(contents, undefined, undefined, undefined, advancedConfig);
            
            // 验证: 构建的 API 请求中 thinkingConfig.thinkingLevel 应与选择的值一致
            return result.thinkingConfig !== undefined &&
                   result.thinkingConfig.thinkingLevel === thinkingLevel;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('当未提供 thinkingLevel 时，请求体不应包含 thinkingConfig', () => {
      fc.assert(
        fc.property(
          fc.array(geminiContentArbitrary, { minLength: 1, maxLength: 3 }),
          (contents) => {
            // 不提供 thinkingLevel
            const advancedConfig: ModelAdvancedConfig = {};
            const result = buildRequestBody(contents, undefined, undefined, undefined, advancedConfig);
            
            // 验证: 没有 thinkingLevel 时不应该有 thinkingConfig
            return result.thinkingConfig === undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('thinkingLevel 配置不应影响其他请求参数', () => {
      fc.assert(
        fc.property(
          fc.array(geminiContentArbitrary, { minLength: 1, maxLength: 3 }),
          thinkingLevelArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (contents, thinkingLevel, systemInstruction) => {
            const advancedConfig: ModelAdvancedConfig = { thinkingLevel };
            const result = buildRequestBody(contents, undefined, undefined, systemInstruction, advancedConfig);
            
            // 验证: contents 保持不变
            const contentsMatch = result.contents.length === contents.length;
            
            // 验证: systemInstruction 正确设置
            const systemInstructionMatch = result.systemInstruction !== undefined &&
                   result.systemInstruction.parts.length > 0;
            
            // 验证: thinkingConfig 正确设置
            const thinkingConfigMatch = result.thinkingConfig !== undefined &&
                   result.thinkingConfig.thinkingLevel === thinkingLevel;
            
            return contentsMatch && systemInstructionMatch && thinkingConfigMatch;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
