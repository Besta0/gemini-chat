/**
 * 模型状态管理单元测试
 * 需求: 2.2, 2.3, 2.4
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { useModelStore } from './model';
import { deleteDatabase } from '../services/storage';
import type { ModelConfig } from '../types/models';

// ============ 辅助函数 ============

/**
 * 重置 store 状态到默认值
 */
async function resetStore(): Promise<void> {
  const store = useModelStore.getState();
  await store.resetModels();
  store.clearError();
}

/**
 * 创建测试用的模型配置
 */
function createTestModel(id: string, overrides?: Partial<ModelConfig>): ModelConfig {
  return {
    id,
    name: `Test Model ${id}`,
    description: `Description for ${id}`,
    isCustom: true,
    provider: 'gemini',
    ...overrides,
  };
}

// ============ 测试套件 ============

describe('Model Store 单元测试', () => {
  // 每个测试前重置状态
  beforeEach(async () => {
    await resetStore();
  });

  // 测试套件结束后清理数据库
  afterAll(async () => {
    await deleteDatabase();
  });

  describe('addModel action', () => {
    /**
     * 测试添加新模型
     * 需求: 2.2
     */
    it('应该能够添加新的自定义模型', async () => {
      const store = useModelStore.getState();
      const initialCount = store.models.length;
      
      const newModel = createTestModel('test-model-1');
      await store.addModel(newModel);

      const updatedStore = useModelStore.getState();
      expect(updatedStore.models.length).toBe(initialCount + 1);
      expect(updatedStore.models.find(m => m.id === 'test-model-1')).toBeDefined();
    });

    /**
     * 测试添加重复 ID 的模型会更新现有模型
     * 需求: 2.2
     */
    it('添加重复 ID 的模型应该更新现有模型', async () => {
      const store = useModelStore.getState();
      
      const model1 = createTestModel('duplicate-model', { name: 'Original Name' });
      await store.addModel(model1);

      const model2 = createTestModel('duplicate-model', { name: 'Updated Name' });
      await store.addModel(model2);

      const updatedStore = useModelStore.getState();
      const foundModel = updatedStore.models.find(m => m.id === 'duplicate-model');
      expect(foundModel?.name).toBe('Updated Name');
    });

    /**
     * 测试添加的模型应该标记为自定义
     * 需求: 2.2
     */
    it('添加的模型应该标记为自定义模型', async () => {
      const store = useModelStore.getState();
      
      const newModel = createTestModel('custom-model', { isCustom: false });
      await store.addModel(newModel);

      const updatedStore = useModelStore.getState();
      const foundModel = updatedStore.models.find(m => m.id === 'custom-model');
      expect(foundModel?.isCustom).toBe(true);
    });
  });

  describe('updateModel action', () => {
    /**
     * 测试更新模型配置
     * 需求: 2.3
     */
    it('应该能够更新模型的属性', async () => {
      const store = useModelStore.getState();
      
      const newModel = createTestModel('update-test-model');
      await store.addModel(newModel);

      await useModelStore.getState().updateModel('update-test-model', {
        name: 'Updated Model Name',
        description: 'Updated description',
      });

      const updatedStore = useModelStore.getState();
      const foundModel = updatedStore.models.find(m => m.id === 'update-test-model');
      expect(foundModel?.name).toBe('Updated Model Name');
      expect(foundModel?.description).toBe('Updated description');
    });

    /**
     * 测试更新不存在的模型应该设置错误
     * 需求: 2.3
     */
    it('更新不存在的模型应该设置错误', async () => {
      const store = useModelStore.getState();
      
      await store.updateModel('non-existent-model', { name: 'New Name' });

      const updatedStore = useModelStore.getState();
      expect(updatedStore.error).toContain('non-existent-model');
    });

    /**
     * 测试更新模型的高级配置
     * 需求: 2.3
     */
    it('应该能够更新模型的高级配置', async () => {
      const store = useModelStore.getState();
      
      const newModel = createTestModel('advanced-config-model');
      await store.addModel(newModel);

      await useModelStore.getState().updateModel('advanced-config-model', {
        advancedConfig: {
          thinkingLevel: 'high',
          mediaResolution: 'media_resolution_high',
        },
      });

      const updatedStore = useModelStore.getState();
      const foundModel = updatedStore.models.find(m => m.id === 'advanced-config-model');
      expect(foundModel?.advancedConfig?.thinkingLevel).toBe('high');
      expect(foundModel?.advancedConfig?.mediaResolution).toBe('media_resolution_high');
    });
  });

  describe('deleteModel action', () => {
    /**
     * 测试删除模型
     * 需求: 2.4
     */
    it('应该能够删除模型', async () => {
      const store = useModelStore.getState();
      
      const newModel = createTestModel('delete-test-model');
      await store.addModel(newModel);

      const storeAfterAdd = useModelStore.getState();
      expect(storeAfterAdd.models.find(m => m.id === 'delete-test-model')).toBeDefined();

      await useModelStore.getState().deleteModel('delete-test-model');

      const storeAfterDelete = useModelStore.getState();
      expect(storeAfterDelete.models.find(m => m.id === 'delete-test-model')).toBeUndefined();
    });

    /**
     * 测试删除模型时应该清除指向该模型的重定向
     * 需求: 2.4
     */
    it('删除模型时应该清除指向该模型的重定向', async () => {
      const store = useModelStore.getState();
      
      // 添加目标模型
      const targetModel = createTestModel('target-model');
      await store.addModel(targetModel);

      // 添加源模型并设置重定向
      const sourceModel = createTestModel('source-model');
      await useModelStore.getState().addModel(sourceModel);
      await useModelStore.getState().setRedirect('source-model', 'target-model');

      // 验证重定向已设置
      let currentStore = useModelStore.getState();
      expect(currentStore.models.find(m => m.id === 'source-model')?.redirectTo).toBe('target-model');

      // 删除目标模型
      await useModelStore.getState().deleteModel('target-model');

      // 验证重定向已清除
      currentStore = useModelStore.getState();
      expect(currentStore.models.find(m => m.id === 'source-model')?.redirectTo).toBeUndefined();
    });
  });

  describe('setRedirect action', () => {
    /**
     * 测试设置模型重定向
     * 需求: 3.1
     */
    it('应该能够设置模型重定向', async () => {
      const store = useModelStore.getState();
      
      const model1 = createTestModel('redirect-source');
      const model2 = createTestModel('redirect-target');
      await store.addModel(model1);
      await useModelStore.getState().addModel(model2);

      await useModelStore.getState().setRedirect('redirect-source', 'redirect-target');

      const updatedStore = useModelStore.getState();
      const sourceModel = updatedStore.models.find(m => m.id === 'redirect-source');
      expect(sourceModel?.redirectTo).toBe('redirect-target');
    });

    /**
     * 测试设置重定向到不存在的模型应该设置错误
     * 需求: 3.1
     */
    it('设置重定向到不存在的模型应该设置错误', async () => {
      const store = useModelStore.getState();
      
      const model = createTestModel('redirect-source-2');
      await store.addModel(model);

      await useModelStore.getState().setRedirect('redirect-source-2', 'non-existent-target');

      const updatedStore = useModelStore.getState();
      expect(updatedStore.error).toContain('non-existent-target');
    });

    /**
     * 测试检测循环重定向
     * 需求: 3.1
     */
    it('应该检测并阻止循环重定向', async () => {
      const store = useModelStore.getState();
      
      const modelA = createTestModel('model-a');
      const modelB = createTestModel('model-b');
      await store.addModel(modelA);
      await useModelStore.getState().addModel(modelB);

      // A -> B
      await useModelStore.getState().setRedirect('model-a', 'model-b');
      
      // 尝试 B -> A（会造成循环）
      await useModelStore.getState().setRedirect('model-b', 'model-a');

      const updatedStore = useModelStore.getState();
      expect(updatedStore.error).toContain('循环');
    });
  });

  describe('clearRedirect action', () => {
    /**
     * 测试清除模型重定向
     * 需求: 3.5
     */
    it('应该能够清除模型重定向', async () => {
      const store = useModelStore.getState();
      
      const model1 = createTestModel('clear-redirect-source');
      const model2 = createTestModel('clear-redirect-target');
      await store.addModel(model1);
      await useModelStore.getState().addModel(model2);

      // 设置重定向
      await useModelStore.getState().setRedirect('clear-redirect-source', 'clear-redirect-target');
      
      let currentStore = useModelStore.getState();
      expect(currentStore.models.find(m => m.id === 'clear-redirect-source')?.redirectTo).toBe('clear-redirect-target');

      // 清除重定向
      await useModelStore.getState().clearRedirect('clear-redirect-source');

      currentStore = useModelStore.getState();
      expect(currentStore.models.find(m => m.id === 'clear-redirect-source')?.redirectTo).toBeUndefined();
    });
  });

  describe('getEffectiveConfig', () => {
    /**
     * 测试获取有效配置（无重定向）
     * 需求: 3.2, 3.4
     */
    it('无重定向时应该返回模型自身的配置', async () => {
      const store = useModelStore.getState();
      
      const model = createTestModel('effective-config-model', {
        advancedConfig: {
          thinkingLevel: 'high',
        },
      });
      await store.addModel(model);

      const effectiveConfig = useModelStore.getState().getEffectiveConfig('effective-config-model');
      expect(effectiveConfig.thinkingLevel).toBe('high');
    });

    /**
     * 测试获取有效配置（有重定向）
     * 需求: 3.2, 3.3
     */
    it('有重定向时应该返回目标模型的配置', async () => {
      const store = useModelStore.getState();
      
      const sourceModel = createTestModel('config-source', {
        advancedConfig: { thinkingLevel: 'low' },
      });
      const targetModel = createTestModel('config-target', {
        advancedConfig: { thinkingLevel: 'high' },
      });
      
      await store.addModel(sourceModel);
      await useModelStore.getState().addModel(targetModel);
      await useModelStore.getState().setRedirect('config-source', 'config-target');

      const effectiveConfig = useModelStore.getState().getEffectiveConfig('config-source');
      expect(effectiveConfig.thinkingLevel).toBe('high');
    });
  });

  describe('resetModels action', () => {
    /**
     * 测试重置模型列表
     * 需求: 5.4
     */
    it('应该能够重置为默认模型列表', async () => {
      const store = useModelStore.getState();
      
      // 添加自定义模型
      const customModel = createTestModel('custom-to-reset');
      await store.addModel(customModel);

      // 验证自定义模型已添加
      let currentStore = useModelStore.getState();
      expect(currentStore.models.find(m => m.id === 'custom-to-reset')).toBeDefined();

      // 重置
      await useModelStore.getState().resetModels();

      // 验证自定义模型已移除
      currentStore = useModelStore.getState();
      expect(currentStore.models.find(m => m.id === 'custom-to-reset')).toBeUndefined();
      
      // 验证预设模型存在
      expect(currentStore.models.find(m => m.id === 'gemini-2.5-flash')).toBeDefined();
    });
  });

  describe('getModelById', () => {
    /**
     * 测试根据 ID 获取模型
     */
    it('应该能够根据 ID 获取模型', async () => {
      const store = useModelStore.getState();
      
      const model = createTestModel('get-by-id-model');
      await store.addModel(model);

      const foundModel = useModelStore.getState().getModelById('get-by-id-model');
      expect(foundModel).toBeDefined();
      expect(foundModel?.id).toBe('get-by-id-model');
    });

    /**
     * 测试获取不存在的模型返回 undefined
     */
    it('获取不存在的模型应该返回 undefined', () => {
      const store = useModelStore.getState();
      const foundModel = store.getModelById('non-existent-model-id');
      expect(foundModel).toBeUndefined();
    });
  });

  describe('loadModels action', () => {
    /**
     * 测试从存储加载模型配置
     * 需求: 5.2
     */
    it('应该能够从存储加载模型配置', async () => {
      const store = useModelStore.getState();
      
      // 先添加一个自定义模型并保存
      const customModel = createTestModel('load-test-model');
      await store.addModel(customModel);

      // 重置 store 状态（模拟应用重启）
      useModelStore.setState({
        models: [],
        initialized: false,
        isLoading: false,
        error: null,
      });

      // 从存储加载
      await useModelStore.getState().loadModels();

      const loadedStore = useModelStore.getState();
      expect(loadedStore.initialized).toBe(true);
      expect(loadedStore.models.find(m => m.id === 'load-test-model')).toBeDefined();
    });

    /**
     * 测试加载时设置 isLoading 状态
     */
    it('加载时应该设置 isLoading 状态', async () => {
      const store = useModelStore.getState();
      
      // 开始加载前检查状态
      expect(store.isLoading).toBe(false);

      // 加载完成后检查状态
      await store.loadModels();
      const loadedStore = useModelStore.getState();
      expect(loadedStore.isLoading).toBe(false);
      expect(loadedStore.initialized).toBe(true);
    });
  });

  describe('clearError action', () => {
    /**
     * 测试清除错误
     */
    it('应该能够清除错误状态', async () => {
      const store = useModelStore.getState();
      
      // 触发一个错误
      await store.updateModel('non-existent-model', { name: 'New Name' });
      
      let currentStore = useModelStore.getState();
      expect(currentStore.error).not.toBeNull();

      // 清除错误
      currentStore.clearError();

      currentStore = useModelStore.getState();
      expect(currentStore.error).toBeNull();
    });
  });

  describe('状态更新测试', () => {
    /**
     * 测试初始状态
     */
    it('应该有正确的初始状态', async () => {
      await resetStore();
      const store = useModelStore.getState();
      
      expect(store.models.length).toBeGreaterThan(0);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    /**
     * 测试添加模型后状态更新
     * 需求: 2.2
     */
    it('添加模型后应该正确更新状态', async () => {
      const store = useModelStore.getState();
      const initialCount = store.models.length;
      
      const newModel = createTestModel('state-update-model');
      await store.addModel(newModel);

      const updatedStore = useModelStore.getState();
      expect(updatedStore.models.length).toBe(initialCount + 1);
      expect(updatedStore.error).toBeNull();
    });

    /**
     * 测试删除模型后状态更新
     * 需求: 2.4
     */
    it('删除模型后应该正确更新状态', async () => {
      const store = useModelStore.getState();
      
      const newModel = createTestModel('delete-state-model');
      await store.addModel(newModel);

      const storeAfterAdd = useModelStore.getState();
      const countAfterAdd = storeAfterAdd.models.length;

      await useModelStore.getState().deleteModel('delete-state-model');

      const storeAfterDelete = useModelStore.getState();
      expect(storeAfterDelete.models.length).toBe(countAfterAdd - 1);
    });
  });
});
