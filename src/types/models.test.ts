/**
 * 模型配置类型属性测试
 * **Feature: model-management, Property 3: 模型 CRUD 操作正确性**
 * **Validates: Requirements 2.2, 2.3, 2.4**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type {
  ModelConfig,
  ApiProvider,
  ThinkingLevel,
  MediaResolution,
  ModelCapabilities,
  ModelAdvancedConfig,
} from './models';

// ============ 生成器定义 ============

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
 * 生成有效的模型能力配置
 */
const modelCapabilitiesArb: fc.Arbitrary<ModelCapabilities> = fc.record({
  supportsThinking: fc.option(fc.boolean(), { nil: undefined }),
  supportsMediaResolution: fc.option(fc.boolean(), { nil: undefined }),
  supportsImageGeneration: fc.option(fc.boolean(), { nil: undefined }),
  maxInputTokens: fc.option(fc.integer({ min: 1, max: 2000000 }), { nil: undefined }),
  maxOutputTokens: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined }),
});

/**
 * 生成有效的高级参数配置
 */
const modelAdvancedConfigArb: fc.Arbitrary<ModelAdvancedConfig> = fc.record({
  thinkingLevel: fc.option(thinkingLevelArb, { nil: undefined }),
  mediaResolution: fc.option(mediaResolutionArb, { nil: undefined }),
});

/**
 * 生成有效的模型 ID（非空字符串）
 */
const modelIdArb = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,49}$/);

/**
 * 生成有效的模型名称
 */
const modelNameArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * 生成有效的模型描述
 */
const modelDescriptionArb = fc.string({ maxLength: 500 });

/**
 * 生成有效的模型配置
 */
const modelConfigArb: fc.Arbitrary<ModelConfig> = fc.record({
  id: modelIdArb,
  name: modelNameArb,
  description: modelDescriptionArb,
  isCustom: fc.option(fc.boolean(), { nil: undefined }),
  redirectTo: fc.option(modelIdArb, { nil: undefined }),
  capabilities: fc.option(modelCapabilitiesArb, { nil: undefined }),
  advancedConfig: fc.option(modelAdvancedConfigArb, { nil: undefined }),
  provider: fc.option(apiProviderArb, { nil: undefined }),
});

// ============ 辅助函数：模拟 CRUD 操作 ============

/**
 * 添加模型到列表
 */
function addModel(models: ModelConfig[], model: ModelConfig): ModelConfig[] {
  // 检查是否已存在相同 ID 的模型
  const existingIndex = models.findIndex(m => m.id === model.id);
  if (existingIndex >= 0) {
    // 如果存在，替换
    const newModels = [...models];
    newModels[existingIndex] = model;
    return newModels;
  }
  return [...models, model];
}

/**
 * 删除模型
 */
function deleteModel(models: ModelConfig[], modelId: string): ModelConfig[] {
  return models.filter(m => m.id !== modelId);
}

/**
 * 更新模型
 */
function updateModel(
  models: ModelConfig[],
  modelId: string,
  updates: Partial<ModelConfig>
): ModelConfig[] {
  return models.map(m => (m.id === modelId ? { ...m, ...updates } : m));
}

/**
 * 查找模型
 */
function findModel(models: ModelConfig[], modelId: string): ModelConfig | undefined {
  return models.find(m => m.id === modelId);
}

// ============ 测试套件 ============

describe('模型配置类型属性测试', () => {
  /**
   * **Feature: model-management, Property 3: 模型 CRUD 操作正确性**
   * *For any* 模型配置，添加后列表长度增加 1 且包含该模型
   * **Validates: Requirements 2.2**
   */
  it('Property 3.1: 添加模型后列表包含该模型', () => {
    fc.assert(
      fc.property(
        fc.array(modelConfigArb, { maxLength: 20 }),
        modelConfigArb,
        (initialModels, newModel) => {
          // 确保新模型 ID 不在初始列表中
          const uniqueInitialModels = initialModels.filter(m => m.id !== newModel.id);
          const initialLength = uniqueInitialModels.length;

          // 添加模型
          const result = addModel(uniqueInitialModels, newModel);

          // 验证：列表长度增加 1
          expect(result.length).toBe(initialLength + 1);

          // 验证：列表包含新模型
          const found = findModel(result, newModel.id);
          expect(found).toBeDefined();
          expect(found?.id).toBe(newModel.id);
          expect(found?.name).toBe(newModel.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: model-management, Property 3: 模型 CRUD 操作正确性**
   * *For any* 模型配置，删除后列表长度减少 1 且不包含该模型
   * **Validates: Requirements 2.4**
   */
  it('Property 3.2: 删除模型后列表不包含该模型', () => {
    fc.assert(
      fc.property(
        fc.array(modelConfigArb, { minLength: 1, maxLength: 20 }),
        (models) => {
          // 确保模型 ID 唯一
          const uniqueModels = models.reduce<ModelConfig[]>((acc, m) => {
            if (!acc.find(existing => existing.id === m.id)) {
              acc.push(m);
            }
            return acc;
          }, []);

          if (uniqueModels.length === 0) return; // 跳过空列表

          // 随机选择一个模型删除
          const modelToDelete = uniqueModels[0];
          if (!modelToDelete) return;
          const initialLength = uniqueModels.length;

          // 删除模型
          const result = deleteModel(uniqueModels, modelToDelete.id);

          // 验证：列表长度减少 1
          expect(result.length).toBe(initialLength - 1);

          // 验证：列表不包含已删除的模型
          const found = findModel(result, modelToDelete.id);
          expect(found).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: model-management, Property 3: 模型 CRUD 操作正确性**
   * *For any* 模型配置，编辑后模型属性正确更新
   * **Validates: Requirements 2.3**
   */
  it('Property 3.3: 编辑模型后属性正确更新', () => {
    fc.assert(
      fc.property(
        fc.array(modelConfigArb, { minLength: 1, maxLength: 20 }),
        modelNameArb,
        modelDescriptionArb,
        (models, newName, newDescription) => {
          // 确保模型 ID 唯一
          const uniqueModels = models.reduce<ModelConfig[]>((acc, m) => {
            if (!acc.find(existing => existing.id === m.id)) {
              acc.push(m);
            }
            return acc;
          }, []);

          if (uniqueModels.length === 0) return; // 跳过空列表

          // 选择第一个模型进行编辑
          const modelToEdit = uniqueModels[0];
          if (!modelToEdit) return;

          // 更新模型
          const updates = { name: newName, description: newDescription };
          const result = updateModel(uniqueModels, modelToEdit.id, updates);

          // 验证：列表长度不变
          expect(result.length).toBe(uniqueModels.length);

          // 验证：模型属性正确更新
          const found = findModel(result, modelToEdit.id);
          expect(found).toBeDefined();
          expect(found?.name).toBe(newName);
          expect(found?.description).toBe(newDescription);

          // 验证：其他属性保持不变
          expect(found?.id).toBe(modelToEdit.id);
          expect(found?.isCustom).toBe(modelToEdit.isCustom);
          expect(found?.provider).toBe(modelToEdit.provider);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 验证模型 ID 唯一性约束
   * 添加相同 ID 的模型应该替换而不是重复添加
   */
  it('Property 3.4: 添加相同 ID 的模型应替换现有模型', () => {
    fc.assert(
      fc.property(
        modelConfigArb,
        modelNameArb,
        (originalModel, newName) => {
          // 创建初始列表
          const initialModels = [originalModel];

          // 创建相同 ID 但不同名称的模型
          const updatedModel: ModelConfig = {
            ...originalModel,
            name: newName,
          };

          // 添加模型
          const result = addModel(initialModels, updatedModel);

          // 验证：列表长度保持为 1（替换而非添加）
          expect(result.length).toBe(1);

          // 验证：模型已被替换
          const found = findModel(result, originalModel.id);
          expect(found?.name).toBe(newName);
        }
      ),
      { numRuns: 100 }
    );
  });
});
