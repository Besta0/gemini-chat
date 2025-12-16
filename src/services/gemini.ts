/**
 * Gemini API 服务
 * 需求: 1.2, 1.4, 2.4, 3.2, 5.2, 5.4, 5.6, 8.5, 12.3
 */

import type {
  GeminiContent,
  GeminiRequest,
  GenerationConfig,
  SafetySetting,
  StreamChunk,
  ThinkingConfig,
  ImageConfig,
} from '../types';
import type { ApiConfig, ModelAdvancedConfig, MediaResolution } from '../types/models';
import { getModelCapabilities } from '../types/models';

// ============ URL 验证和构建 ============

/**
 * 验证 API 端点 URL 格式
 * 需求: 1.2
 * 
 * @param url - 要验证的 URL 字符串
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateApiEndpoint(url: string): { valid: boolean; error?: string } {
  // 空字符串检查
  if (!url || url.trim() === '') {
    return { valid: false, error: 'URL 不能为空' };
  }

  const trimmedUrl = url.trim();

  // 检查是否以 http:// 或 https:// 开头
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return { valid: false, error: 'URL 必须以 http:// 或 https:// 开头' };
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    
    // 检查协议是否为 http 或 https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { valid: false, error: 'URL 协议必须是 http 或 https' };
    }

    // 检查是否有有效的主机名
    if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
      return { valid: false, error: 'URL 必须包含有效的主机名' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'URL 格式无效' };
  }
}

/**
 * 构建 Gemini API 请求 URL
 * 需求: 8.5
 * 
 * @param config - API 配置
 * @param stream - 是否使用流式响应
 * @returns 完整的 API 请求 URL
 */
export function buildRequestUrl(config: ApiConfig, stream: boolean = true): string {
  // 移除端点末尾的斜杠
  const endpoint = config.endpoint.replace(/\/+$/, '');
  
  // 构建模型路径
  const modelPath = `models/${config.model}`;
  
  // 选择生成方法
  const method = stream ? 'streamGenerateContent' : 'generateContent';
  
  // 构建完整 URL
  const url = `${endpoint}/${modelPath}:${method}?key=${config.apiKey}`;
  
  // 如果是流式响应，添加 alt=sse 参数
  if (stream) {
    return `${url}&alt=sse`;
  }
  
  return url;
}


// ============ 请求体构建 ============

/**
 * 构建 Gemini API 请求体
 * 需求: 2.4, 3.2, 3.8, 4.2, 5.6, 12.3
 * 
 * @param contents - 消息内容数组
 * @param generationConfig - 生成配置（可选）
 * @param safetySettings - 安全设置（可选）
 * @param systemInstruction - 系统指令（可选）
 * @param advancedConfig - 高级参数配置（可选）
 * @param modelId - 模型 ID（可选，用于确定思考配置类型）
 * @returns 符合 Gemini API 格式的请求体
 */
export function buildRequestBody(
  contents: GeminiContent[],
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[],
  systemInstruction?: string,
  advancedConfig?: ModelAdvancedConfig,
  modelId?: string
): GeminiRequest {
  const request: GeminiRequest = {
    contents: applyMediaResolution(contents, advancedConfig?.mediaResolution),
  };

  // 添加生成配置（如果提供且有有效值）
  if (generationConfig && Object.keys(generationConfig).length > 0) {
    // 过滤掉 undefined 值
    const filteredConfig: GenerationConfig = {};
    if (generationConfig.temperature !== undefined) {
      filteredConfig.temperature = generationConfig.temperature;
    }
    if (generationConfig.topP !== undefined) {
      filteredConfig.topP = generationConfig.topP;
    }
    if (generationConfig.topK !== undefined) {
      filteredConfig.topK = generationConfig.topK;
    }
    if (generationConfig.maxOutputTokens !== undefined) {
      filteredConfig.maxOutputTokens = generationConfig.maxOutputTokens;
    }
    if (generationConfig.stopSequences !== undefined && generationConfig.stopSequences.length > 0) {
      filteredConfig.stopSequences = generationConfig.stopSequences;
    }
    
    if (Object.keys(filteredConfig).length > 0) {
      request.generationConfig = filteredConfig;
    }
  }

  // 添加安全设置（如果提供且非空）
  if (safetySettings && safetySettings.length > 0) {
    request.safetySettings = safetySettings;
  }

  // 添加系统指令（如果提供且非空）
  if (systemInstruction && systemInstruction.trim().length > 0) {
    request.systemInstruction = {
      role: 'user',
      parts: [{ text: systemInstruction }],
    };
  }

  // 添加思考配置
  // 需求: 1.3, 1.4, 3.8, 4.2
  if (modelId) {
    // 使用新的基于模型类型的思考配置构建函数
    const thinkingConfig = buildThinkingConfigForModel(modelId, advancedConfig);
    if (thinkingConfig) {
      request.thinkingConfig = thinkingConfig;
    }
  } else if (advancedConfig?.thinkingLevel) {
    // 向后兼容：如果没有提供 modelId，使用旧的方式
    request.thinkingConfig = buildThinkingConfig(advancedConfig.thinkingLevel);
  }

  // 添加图片生成配置（如果提供）
  // 需求: 2.5
  if (advancedConfig?.imageConfig) {
    request.imageConfig = buildImageConfig(advancedConfig.imageConfig);
  }

  return request;
}

/**
 * 构建思考配置
 * 需求: 1.3, 1.4, 3.8
 * 
 * 根据模型类型选择正确的思考配置参数：
 * - gemini-3-pro-preview: 使用 thinkingLevel
 * - gemini-2.5 系列: 使用 thinkingBudget
 * 
 * @param modelId - 模型 ID
 * @param advancedConfig - 高级参数配置（可选）
 * @returns 思考配置对象，如果模型不支持思考配置则返回 undefined
 */
export function buildThinkingConfigForModel(
  modelId: string,
  advancedConfig?: ModelAdvancedConfig
): ThinkingConfig | undefined {
  // 获取模型能力配置
  const capabilities = getModelCapabilities(modelId);
  const configType = capabilities.thinkingConfigType;
  
  // 如果模型不支持思考配置，返回 undefined
  if (!configType || configType === 'none') {
    return undefined;
  }
  
  const config: ThinkingConfig = {};
  
  // 根据配置类型设置参数
  if (configType === 'level') {
    // Gemini 3 系列使用 thinkingLevel
    config.thinkingLevel = advancedConfig?.thinkingLevel || 'high';
  } else if (configType === 'budget') {
    // Gemini 2.5 系列使用 thinkingBudget
    const budgetConfig = capabilities.thinkingBudgetConfig;
    if (budgetConfig) {
      // 使用用户设置的值，或使用默认值
      const budget = advancedConfig?.thinkingBudget ?? budgetConfig.defaultValue;
      config.thinkingBudget = budget;
    }
  }
  
  // 添加 includeThoughts 参数（如果模型支持思维链）
  if (capabilities.supportsThoughtSummary && advancedConfig?.includeThoughts) {
    config.includeThoughts = true;
  }
  
  return config;
}

/**
 * 构建思考配置（旧版兼容函数）
 * 需求: 1.3, 1.4
 * 
 * @param thinkingLevel - 思考深度级别
 * @returns 思考配置对象
 * @deprecated 请使用 buildThinkingConfigForModel 函数
 */
export function buildThinkingConfig(thinkingLevel: 'low' | 'high'): ThinkingConfig {
  return {
    thinkingLevel: thinkingLevel,
  };
}

/**
 * 构建图片生成配置
 * 需求: 2.5
 * 
 * @param config - 图片生成配置
 * @returns 图片 API 配置对象
 */
export function buildImageConfig(config: import('../types/models').ImageGenerationConfig): ImageConfig {
  return {
    aspectRatio: config.aspectRatio,
    imageSize: config.imageSize,
  };
}

/**
 * 思维链提取结果
 */
export interface ThoughtExtractionResult {
  /** 普通文本内容 */
  text: string;
  /** 思维链内容 */
  thought: string;
}

/**
 * 解析响应中的思维链内容
 * 需求: 4.3
 * 
 * 遍历 response.parts，检查 thought 布尔值，
 * 将思维链内容和普通回复内容分离
 * 
 * @param chunk - 流式响应块
 * @returns 包含文本和思维链的对象，如果没有内容则返回 null
 */
export function extractThoughtSummary(chunk: StreamChunk): ThoughtExtractionResult | null {
  if (!chunk.candidates || chunk.candidates.length === 0) {
    return null;
  }
  
  const candidate = chunk.candidates[0];
  if (!candidate || !candidate.content || !candidate.content.parts) {
    return null;
  }
  
  let text = '';
  let thought = '';
  
  for (const part of candidate.content.parts) {
    // 检查是否为思维链部分（包含 thought: true）
    if ('thought' in part && part.thought === true && 'text' in part) {
      thought += part.text;
    } else if ('text' in part) {
      // 普通文本部分
      text += part.text;
    }
  }
  
  // 如果没有任何内容，返回 null
  if (!text && !thought) {
    return null;
  }
  
  return { text, thought };
}

/**
 * 为内容应用媒体分辨率设置
 * 需求: 4.4
 * 
 * @param contents - 消息内容数组
 * @param mediaResolution - 媒体分辨率设置
 * @returns 应用了媒体分辨率的内容数组
 */
export function applyMediaResolution(
  contents: GeminiContent[],
  mediaResolution?: MediaResolution
): GeminiContent[] {
  // 如果没有设置媒体分辨率，直接返回原内容
  if (!mediaResolution) {
    return contents;
  }

  // 遍历所有内容，为包含媒体的部分添加分辨率设置
  return contents.map(content => ({
    ...content,
    parts: content.parts.map(part => {
      // 检查是否为内联数据（图片/视频）
      if ('inlineData' in part) {
        return {
          inlineData: {
            ...part.inlineData,
            mediaResolution,
          },
        };
      }
      return part;
    }),
  }));
}


// ============ 流式响应处理 ============

/**
 * API 错误类型
 */
export class GeminiApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: string
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

/**
 * 解析 SSE 流中的数据
 * @param line - SSE 数据行
 * @returns 解析后的 StreamChunk 或 null
 */
function parseSSELine(line: string): StreamChunk | null {
  if (!line.startsWith('data: ')) {
    return null;
  }
  
  const jsonStr = line.slice(6).trim();
  if (!jsonStr || jsonStr === '[DONE]') {
    return null;
  }
  
  try {
    return JSON.parse(jsonStr) as StreamChunk;
  } catch {
    return null;
  }
}

/**
 * 从 StreamChunk 中提取文本内容
 * @param chunk - 流式响应块
 * @returns 提取的文本内容
 */
function extractTextFromChunk(chunk: StreamChunk): string {
  if (!chunk.candidates || chunk.candidates.length === 0) {
    return '';
  }
  
  const candidate = chunk.candidates[0];
  if (!candidate || !candidate.content || !candidate.content.parts) {
    return '';
  }
  
  return candidate.content.parts
    .filter((part): part is { text: string } => 'text' in part)
    .map(part => part.text)
    .join('');
}

/**
 * 发送消息到 Gemini API 并处理流式响应
 * 需求: 5.2, 5.4, 4.3, 4.4
 * 
 * @param contents - 消息内容数组
 * @param config - API 配置
 * @param generationConfig - 生成配置（可选）
 * @param safetySettings - 安全设置（可选）
 * @param systemInstruction - 系统指令（可选）
 * @param onChunk - 接收文本块的回调函数
 * @param advancedConfig - 高级参数配置（可选）
 */
export async function sendMessage(
  contents: GeminiContent[],
  config: ApiConfig,
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[],
  systemInstruction?: string,
  onChunk?: (text: string) => void,
  advancedConfig?: ModelAdvancedConfig
): Promise<string> {
  // 验证 API 配置
  const validation = validateApiEndpoint(config.endpoint);
  if (!validation.valid) {
    throw new GeminiApiError(validation.error || 'API 端点无效');
  }
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new GeminiApiError('API 密钥不能为空');
  }

  // 构建请求
  const url = buildRequestUrl(config, true);
  const body = buildRequestBody(contents, generationConfig, safetySettings, systemInstruction, advancedConfig);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 处理 HTTP 错误
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API 请求失败: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // 使用默认错误消息
      }

      switch (response.status) {
        case 401:
          throw new GeminiApiError('API 密钥无效', 401, 'UNAUTHORIZED');
        case 429:
          throw new GeminiApiError('请求过于频繁，请稍后重试', 429, 'RATE_LIMITED');
        case 500:
        case 502:
        case 503:
          throw new GeminiApiError('服务暂时不可用，请稍后重试', response.status, 'SERVER_ERROR');
        default:
          throw new GeminiApiError(errorMessage, response.status);
      }
    }

    // 处理流式响应
    if (!response.body) {
      throw new GeminiApiError('响应体为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // 按行处理 SSE 数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行
      
      for (const line of lines) {
        const chunk = parseSSELine(line);
        if (chunk) {
          const text = extractTextFromChunk(chunk);
          if (text) {
            fullText += text;
            onChunk?.(text);
          }
        }
      }
    }

    // 处理缓冲区中剩余的数据
    if (buffer) {
      const chunk = parseSSELine(buffer);
      if (chunk) {
        const text = extractTextFromChunk(chunk);
        if (text) {
          fullText += text;
          onChunk?.(text);
        }
      }
    }

    return fullText;
  } catch (error) {
    if (error instanceof GeminiApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new GeminiApiError('网络连接失败，请检查网络设置', undefined, 'NETWORK_ERROR');
    }
    
    throw new GeminiApiError(
      error instanceof Error ? error.message : '未知错误',
      undefined,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * 发送消息到 Gemini API 并处理流式响应（支持思维链提取）
 * 需求: 4.3, 5.2, 5.4
 * 
 * @param contents - 消息内容数组
 * @param config - API 配置
 * @param generationConfig - 生成配置（可选）
 * @param safetySettings - 安全设置（可选）
 * @param systemInstruction - 系统指令（可选）
 * @param onChunk - 接收文本块的回调函数
 * @param advancedConfig - 高级参数配置（可选）
 * @returns 包含文本和思维链的结果对象
 */
export async function sendMessageWithThoughts(
  contents: GeminiContent[],
  config: ApiConfig,
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[],
  systemInstruction?: string,
  onChunk?: (text: string) => void,
  advancedConfig?: ModelAdvancedConfig
): Promise<{ text: string; thoughtSummary?: string }> {
  // 验证 API 配置
  const validation = validateApiEndpoint(config.endpoint);
  if (!validation.valid) {
    throw new GeminiApiError(validation.error || 'API 端点无效');
  }
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new GeminiApiError('API 密钥不能为空');
  }

  // 构建请求，传入模型 ID 以正确构建思考配置
  const url = buildRequestUrl(config, true);
  const body = buildRequestBody(contents, generationConfig, safetySettings, systemInstruction, advancedConfig, config.model);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 处理 HTTP 错误
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API 请求失败: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // 使用默认错误消息
      }

      switch (response.status) {
        case 401:
          throw new GeminiApiError('API 密钥无效', 401, 'UNAUTHORIZED');
        case 429:
          throw new GeminiApiError('请求过于频繁，请稍后重试', 429, 'RATE_LIMITED');
        case 500:
        case 502:
        case 503:
          throw new GeminiApiError('服务暂时不可用，请稍后重试', response.status, 'SERVER_ERROR');
        default:
          throw new GeminiApiError(errorMessage, response.status);
      }
    }

    // 处理流式响应
    if (!response.body) {
      throw new GeminiApiError('响应体为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let fullThought = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // 按行处理 SSE 数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行
      
      for (const line of lines) {
        const chunk = parseSSELine(line);
        if (chunk) {
          // 使用 extractThoughtSummary 分离文本和思维链
          const extracted = extractThoughtSummary(chunk);
          if (extracted) {
            if (extracted.text) {
              fullText += extracted.text;
              onChunk?.(extracted.text);
            }
            if (extracted.thought) {
              fullThought += extracted.thought;
            }
          }
        }
      }
    }

    // 处理缓冲区中剩余的数据
    if (buffer) {
      const chunk = parseSSELine(buffer);
      if (chunk) {
        const extracted = extractThoughtSummary(chunk);
        if (extracted) {
          if (extracted.text) {
            fullText += extracted.text;
            onChunk?.(extracted.text);
          }
          if (extracted.thought) {
            fullThought += extracted.thought;
          }
        }
      }
    }

    return {
      text: fullText,
      thoughtSummary: fullThought || undefined,
    };
  } catch (error) {
    if (error instanceof GeminiApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new GeminiApiError('网络连接失败，请检查网络设置', undefined, 'NETWORK_ERROR');
    }
    
    throw new GeminiApiError(
      error instanceof Error ? error.message : '未知错误',
      undefined,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * 发送消息到 Gemini API（非流式响应）
 * 需求: 10.3, 10.4
 * 
 * @param contents - 消息内容数组
 * @param config - API 配置
 * @param generationConfig - 生成配置（可选）
 * @param safetySettings - 安全设置（可选）
 * @param systemInstruction - 系统指令（可选）
 * @param advancedConfig - 高级参数配置（可选）
 * @returns 完整的响应文本
 */
export async function sendMessageNonStreaming(
  contents: GeminiContent[],
  config: ApiConfig,
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[],
  systemInstruction?: string,
  advancedConfig?: ModelAdvancedConfig
): Promise<string> {
  // 验证 API 配置
  const validation = validateApiEndpoint(config.endpoint);
  if (!validation.valid) {
    throw new GeminiApiError(validation.error || 'API 端点无效');
  }
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new GeminiApiError('API 密钥不能为空');
  }

  // 构建请求（非流式）
  const url = buildRequestUrl(config, false);
  const body = buildRequestBody(contents, generationConfig, safetySettings, systemInstruction, advancedConfig);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 处理 HTTP 错误
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API 请求失败: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // 使用默认错误消息
      }

      switch (response.status) {
        case 401:
          throw new GeminiApiError('API 密钥无效', 401, 'UNAUTHORIZED');
        case 429:
          throw new GeminiApiError('请求过于频繁，请稍后重试', 429, 'RATE_LIMITED');
        case 500:
        case 502:
        case 503:
          throw new GeminiApiError('服务暂时不可用，请稍后重试', response.status, 'SERVER_ERROR');
        default:
          throw new GeminiApiError(errorMessage, response.status);
      }
    }

    // 解析非流式响应
    const responseData = await response.json() as StreamChunk;
    
    if (!responseData.candidates || responseData.candidates.length === 0) {
      return '';
    }
    
    const candidate = responseData.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      return '';
    }
    
    return candidate.content.parts
      .filter((part): part is { text: string } => 'text' in part)
      .map(part => part.text)
      .join('');
  } catch (error) {
    if (error instanceof GeminiApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new GeminiApiError('网络连接失败，请检查网络设置', undefined, 'NETWORK_ERROR');
    }
    
    throw new GeminiApiError(
      error instanceof Error ? error.message : '未知错误',
      undefined,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * 测试 API 连接
 * 需求: 1.4
 * 
 * @param config - API 配置
 * @returns 连接是否成功
 */
export async function testConnection(config: ApiConfig): Promise<{ success: boolean; error?: string }> {
  try {
    // 验证配置
    const validation = validateApiEndpoint(config.endpoint);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    if (!config.apiKey || config.apiKey.trim() === '') {
      return { success: false, error: 'API 密钥不能为空' };
    }

    // 发送简单的测试请求
    const testContents: GeminiContent[] = [
      { role: 'user', parts: [{ text: 'Hi' }] }
    ];

    const url = buildRequestUrl(config, false);
    const body = buildRequestBody(testContents, { maxOutputTokens: 10 });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `连接失败: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // 使用默认错误消息
      }

      switch (response.status) {
        case 401:
          return { success: false, error: 'API 密钥无效' };
        case 429:
          return { success: false, error: '请求过于频繁' };
        case 500:
        case 502:
        case 503:
          return { success: false, error: '服务暂时不可用' };
        default:
          return { success: false, error: errorMessage };
      }
    }

    return { success: true };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: '网络连接失败' };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    };
  }
}
