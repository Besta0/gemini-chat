/**
 * 模型编辑器组件
 * 需求: 2.2, 2.3, 3.1, 4.1, 4.2
 * 
 * 功能：
 * - 模型基本信息编辑（ID、名称、描述）
 * - 重定向目标选择
 * - 高级参数配置（thinking_level、media_resolution）
 */

import { useState, useEffect } from 'react';
import type { ModelConfig, ThinkingLevel, MediaResolution } from '../types/models';

// ============ 类型定义 ============

interface ModelEditorProps {
  /** 要编辑的模型（新建时为 undefined） */
  model?: ModelConfig;
  /** 所有可用模型（用于重定向选择） */
  allModels: ModelConfig[];
  /** 是否为新建模式 */
  isNew?: boolean;
  /** 保存回调 */
  onSave: (model: ModelConfig) => void;
  /** 取消回调 */
  onCancel: () => void;
}

// ============ 常量定义 ============

const THINKING_LEVELS: { value: ThinkingLevel; label: string; description: string }[] = [
  { value: 'low', label: '低', description: '快速响应，较少思考' },
  { value: 'high', label: '高', description: '深度思考，更准确的回答' },
];

const MEDIA_RESOLUTIONS: { value: MediaResolution; label: string; description: string }[] = [
  { value: 'media_resolution_low', label: '低', description: '快速处理，较低质量' },
  { value: 'media_resolution_medium', label: '中', description: '平衡速度和质量' },
  { value: 'media_resolution_high', label: '高', description: '高质量处理' },
  { value: 'media_resolution_ultra_high', label: '超高', description: '最高质量，处理较慢' },
];

// ============ 主组件 ============

export function ModelEditor({
  model,
  allModels,
  isNew = false,
  onSave,
  onCancel,
}: ModelEditorProps) {
  // 表单状态
  const [formData, setFormData] = useState<ModelConfig>({
    id: '',
    name: '',
    description: '',
    isCustom: true,
    provider: 'gemini',
    capabilities: {},
    advancedConfig: {},
  });

  // 验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化表单数据
  useEffect(() => {
    if (model) {
      setFormData({
        ...model,
        advancedConfig: model.advancedConfig || {},
      });
    }
  }, [model]);

  // 更新表单字段
  const updateField = <K extends keyof ModelConfig>(
    field: K,
    value: ModelConfig[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 更新高级配置
  const updateAdvancedConfig = <K extends keyof NonNullable<ModelConfig['advancedConfig']>>(
    field: K,
    value: NonNullable<ModelConfig['advancedConfig']>[K] | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      advancedConfig: {
        ...prev.advancedConfig,
        [field]: value,
      },
    }));
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = '模型 ID 不能为空';
    } else if (isNew && allModels.some(m => m.id === formData.id.trim())) {
      newErrors.id = '模型 ID 已存在';
    }

    if (!formData.name.trim()) {
      newErrors.name = '模型名称不能为空';
    }

    // 检查重定向循环
    if (formData.redirectTo) {
      if (formData.redirectTo === formData.id) {
        newErrors.redirectTo = '不能重定向到自身';
      } else {
        // 检查是否会造成循环
        const visited = new Set<string>();
        let currentId: string | undefined = formData.redirectTo;
        while (currentId) {
          if (currentId === formData.id) {
            newErrors.redirectTo = '检测到循环重定向';
            break;
          }
          if (visited.has(currentId)) {
            break;
          }
          visited.add(currentId);
          const current = allModels.find(m => m.id === currentId);
          currentId = current?.redirectTo;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // 清理空值
      const cleanedData: ModelConfig = {
        ...formData,
        id: formData.id.trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        isCustom: isNew ? true : formData.isCustom,
      };

      // 如果没有设置重定向，移除该字段
      if (!cleanedData.redirectTo) {
        delete cleanedData.redirectTo;
      }

      // 清理空的高级配置
      if (cleanedData.advancedConfig) {
        if (!cleanedData.advancedConfig.thinkingLevel) {
          delete cleanedData.advancedConfig.thinkingLevel;
        }
        if (!cleanedData.advancedConfig.mediaResolution) {
          delete cleanedData.advancedConfig.mediaResolution;
        }
        if (Object.keys(cleanedData.advancedConfig).length === 0) {
          delete cleanedData.advancedConfig;
        }
      }

      onSave(cleanedData);
    }
  };

  // 可用于重定向的模型（排除自身）
  const redirectTargets = allModels.filter(m => m.id !== formData.id);

  // 检查模型是否支持高级参数
  const supportsThinking = formData.capabilities?.supportsThinking ?? false;
  const supportsMediaResolution = formData.capabilities?.supportsMediaResolution ?? false;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900 dark:text-slate-100">基本信息</h4>
        
        {/* 模型 ID */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            模型 ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => updateField('id', e.target.value)}
            disabled={!isNew}
            placeholder="例如: gemini-custom-model"
            className={`w-full px-3 py-2 rounded-lg border 
              ${errors.id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}
              bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
              text-sm`}
          />
          {errors.id && (
            <p className="mt-1 text-xs text-red-500">{errors.id}</p>
          )}
        </div>

        {/* 模型名称 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            显示名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="例如: 自定义 Gemini 模型"
            className={`w-full px-3 py-2 rounded-lg border 
              ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}
              bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              text-sm`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* 模型描述 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="模型的简要描述..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
              bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              text-sm resize-none"
          />
        </div>
      </div>

      {/* 重定向设置 */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900 dark:text-slate-100">重定向设置</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          设置重定向后，此模型将使用目标模型的参数配置
        </p>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            重定向到
          </label>
          <select
            value={formData.redirectTo || ''}
            onChange={(e) => updateField('redirectTo', e.target.value || undefined)}
            className={`w-full px-3 py-2 rounded-lg border 
              ${errors.redirectTo ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}
              bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              text-sm`}
          >
            <option value="">不重定向（使用自身配置）</option>
            {redirectTargets.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </select>
          {errors.redirectTo && (
            <p className="mt-1 text-xs text-red-500">{errors.redirectTo}</p>
          )}
        </div>
      </div>

      {/* 高级参数配置 - 仅在未设置重定向时显示 */}
      {!formData.redirectTo && (supportsThinking || supportsMediaResolution) && (
        <div className="space-y-4">
          <h4 className="font-medium text-slate-900 dark:text-slate-100">高级参数</h4>
          
          {/* Thinking Level */}
          {supportsThinking && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                思考深度 (Thinking Level)
              </label>
              <div className="space-y-2">
                {THINKING_LEVELS.map(level => (
                  <label
                    key={level.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${formData.advancedConfig?.thinkingLevel === level.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="thinkingLevel"
                      value={level.value}
                      checked={formData.advancedConfig?.thinkingLevel === level.value}
                      onChange={() => updateAdvancedConfig('thinkingLevel', level.value)}
                      className="h-4 w-4 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        {level.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {level.description}
                      </div>
                    </div>
                  </label>
                ))}
                {/* 清除选择 */}
                {formData.advancedConfig?.thinkingLevel && (
                  <button
                    type="button"
                    onClick={() => updateAdvancedConfig('thinkingLevel', undefined)}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    清除选择
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Media Resolution */}
          {supportsMediaResolution && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                媒体分辨率 (Media Resolution)
              </label>
              <select
                value={formData.advancedConfig?.mediaResolution || ''}
                onChange={(e) => updateAdvancedConfig(
                  'mediaResolution',
                  e.target.value as MediaResolution || undefined
                )}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  text-sm"
              >
                <option value="">默认</option>
                {MEDIA_RESOLUTIONS.map(res => (
                  <option key={res.value} value={res.value}>
                    {res.label} - {res.description}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* 重定向提示 */}
      {formData.redirectTo && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            已设置重定向，高级参数将使用目标模型 "{formData.redirectTo}" 的配置
          </p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 
            hover:bg-blue-600 rounded-lg transition-colors"
        >
          {isNew ? '添加模型' : '保存更改'}
        </button>
      </div>
    </form>
  );
}

export default ModelEditor;
