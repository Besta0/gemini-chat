# 需求文档

## 简介

本功能为 Gemini Chat 应用提供高级模型管理能力，包括：从 API 端点自动获取可用模型列表（支持 Gemini 和 OpenAI 兼容格式）、自定义模型配置、模型参数重定向（别名共享参数）、以及 Gemini 3 系列特有的高级参数配置（如 thinking_level、media_resolution 等）。

## 术语表

- **ModelManager**: 负责管理模型列表、配置和参数的核心服务
- **ModelConfig**: 单个模型的完整配置，包括 ID、名称、参数设置等
- **ModelAlias**: 模型别名/重定向，允许一个模型 ID 共享另一个模型的参数配置
- **ThinkingLevel**: Gemini 3 的思考深度参数（low/medium/high）
- **MediaResolution**: Gemini 3 的媒体分辨率参数（low/medium/high/ultra_high）
- **ApiProvider**: API 提供商类型（gemini/openai）

## 需求

### 需求 1

**用户故事:** 作为用户，我希望能够通过 API 端点和密钥一键获取可用模型列表，这样我就不需要手动输入模型名称。

#### 验收标准

1. WHEN 用户点击"获取模型"按钮 THEN 系统 SHALL 使用配置的 API 端点和密钥请求模型列表
2. WHEN 系统检测到 Gemini API 端点格式 THEN 系统 SHALL 使用 `/models` 端点获取模型列表
3. WHEN 系统检测到 OpenAI 兼容 API 端点格式 THEN 系统 SHALL 使用 `/v1/models` 端点获取模型列表
4. WHEN 模型列表获取成功 THEN 系统 SHALL 将获取的模型合并到本地模型列表中
5. IF 模型获取失败 THEN 系统 SHALL 显示错误信息并保留现有模型列表

### 需求 2

**用户故事:** 作为用户，我希望能够自定义模型配置，这样我可以添加被重定向的模型或不同厂商的特殊命名模型。

#### 验收标准

1. WHEN 用户点击"添加自定义模型"按钮 THEN 系统 SHALL 显示模型配置表单
2. WHEN 用户填写模型 ID、名称和描述并提交 THEN 系统 SHALL 创建新的自定义模型配置
3. WHEN 用户编辑现有模型配置 THEN 系统 SHALL 允许修改模型的所有可配置属性
4. WHEN 用户删除自定义模型 THEN 系统 SHALL 从模型列表中移除该模型
5. WHEN 自定义模型配置变更 THEN 系统 SHALL 立即持久化到本地存储

### 需求 3

**用户故事:** 作为用户，我希望能够设置模型别名/重定向，这样类似的模型（如 gemini-3-pro-high）可以共享基础模型（如 gemini-3-pro-preview）的参数配置。

#### 验收标准

1. WHEN 用户编辑模型配置 THEN 系统 SHALL 提供"重定向到"选项允许选择目标模型
2. WHEN 模型设置了重定向目标 THEN 系统 SHALL 在发送请求时使用目标模型的参数配置
3. WHEN 重定向目标模型的参数变更 THEN 系统 SHALL 自动应用到所有指向该目标的别名模型
4. WHEN 用户查看已重定向模型的配置 THEN 系统 SHALL 显示当前生效的参数（来自目标模型）
5. WHEN 用户清除重定向设置 THEN 系统 SHALL 恢复使用模型自身的参数配置

### 需求 4

**用户故事:** 作为用户，我希望能够配置 Gemini 3 系列特有的高级参数，这样我可以控制模型的思考深度和媒体处理质量。

#### 验收标准

1. WHEN 用户选择 Gemini 3 系列模型 THEN 系统 SHALL 显示 thinking_level 配置选项（low/high）
2. WHEN 用户选择支持图像/视频输入的模型 THEN 系统 SHALL 显示 media_resolution 配置选项
3. WHEN 用户配置 thinking_level 参数 THEN 系统 SHALL 在 API 请求中包含 thinkingConfig
4. WHEN 用户配置 media_resolution 参数 THEN 系统 SHALL 在媒体内容中包含 mediaResolution 设置
5. WHEN 模型不支持某高级参数 THEN 系统 SHALL 隐藏或禁用该参数的配置选项

### 需求 5

**用户故事:** 作为用户，我希望模型配置能够持久化保存，这样我的自定义设置在重启应用后仍然有效。

#### 验收标准

1. WHEN 用户修改任何模型配置 THEN 系统 SHALL 自动保存到 IndexedDB
2. WHEN 应用启动 THEN 系统 SHALL 从 IndexedDB 加载已保存的模型配置
3. WHEN 加载的配置与预设模型冲突 THEN 系统 SHALL 优先使用用户的自定义配置
4. WHEN 用户重置模型配置 THEN 系统 SHALL 恢复到预设的默认模型列表
