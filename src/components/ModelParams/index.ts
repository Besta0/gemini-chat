/**
 * 模型参数组件导出
 * Requirements: 3.1, 3.2, 3.3
 */

import { useMemo } from 'react';
import { MODEL_CAPABILITIES, getModelCapabilities } from '../../types/models';
import type { ModelCapabilities } from '../../types/models';

// 导出组件
export { ThinkingLevelSelector } from './ThinkingLevelSelector';
export type { ThinkingLevelSelectorProps } from './ThinkingLevelSelector';

export { ThinkingBudgetSlider } from './ThinkingBudgetSlider';
export type { ThinkingBudgetSliderProps } from './ThinkingBudgetSlider';

export { ImageConfigPanel } from './ImageConfigPanel';
export type { ImageConfigPanelProps } from './ImageConfigPanel';

/**
 * useModelCapabilities Hook
 * 根据模型 ID 获取模型能力配置
 * 
 * @param modelId 模型 ID
 * @returns 模型能力配置
 * 
 * Requirements: 3.1, 3.2, 3.3
 */
export function useModelCapabilities(modelId: string): ModelCapabilities {
  return useMemo(() => {
    return getModelCapabilities(modelId);
  }, [modelId]);
}

/**
 * 检查模型是否支持思考程度配置
 * @param modelId 模型 ID
 * @returns 是否支持思考程度
 */
export function supportsThinking(modelId: string): boolean {
  const capabilities = MODEL_CAPABILITIES[modelId];
  return capabilities?.supportsThinking === true;
}

/**
 * 检查模型是否支持图片生成
 * @param modelId 模型 ID
 * @returns 是否支持图片生成
 */
export function supportsImageGeneration(modelId: string): boolean {
  const capabilities = MODEL_CAPABILITIES[modelId];
  return capabilities?.supportsImageGeneration === true;
}

/**
 * 获取模型支持的参数类型列表
 * @param modelId 模型 ID
 * @returns 支持的参数类型数组
 */
export function getSupportedParams(modelId: string): string[] {
  const capabilities = MODEL_CAPABILITIES[modelId];
  const params: string[] = [];
  
  if (capabilities?.supportsThinking) {
    params.push('thinkingLevel');
  }
  if (capabilities?.supportsImageGeneration) {
    params.push('imageConfig');
  }
  if (capabilities?.supportsMediaResolution) {
    params.push('mediaResolution');
  }
  
  return params;
}
