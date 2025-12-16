# 需求文档

## 简介

本文档定义了 Gemini 聊天应用的思考配置改进功能。主要包括：移除不必要的 UI 元素（表情和链接按钮）、根据模型类型区分思考等级和思考预算两种配置方式、添加思维链显示开关功能。这些改进将使应用更符合 Gemini API 的最新规范，并提供更好的用户体验。

## 术语表

- **思考等级 (Thinking Level)**: Gemini 3 系列模型使用的思考控制参数，支持 "low" 和 "high" 两个级别
- **思考预算 (Thinking Budget)**: Gemini 2.5 系列模型使用的思考控制参数，以 token 数量为单位
- **思维链 (Thought Summary)**: 模型内部推理过程的合成版本，通过 `includeThoughts` 参数启用
- **消息输入组件**: 页面底部的文本输入区域，包含发送按钮和工具栏
- **内联配置面板**: 聊天窗口内的模型参数配置区域

## 需求

### 需求 1

**用户故事:** 作为用户，我希望消息输入区域更加简洁，移除不常用的表情和链接按钮，以便获得更清爽的界面体验。

#### 验收标准

1. WHEN 用户查看消息输入组件 THEN 系统 SHALL 不显示表情按钮和表情选择器
2. WHEN 用户查看消息输入组件 THEN 系统 SHALL 不显示链接插入按钮
3. WHEN 用户使用消息输入组件 THEN 系统 SHALL 保留图片上传和文件上传功能

### 需求 2

**用户故事:** 作为用户，我希望只有支持思考等级的模型（gemini-3-pro-preview）显示思考等级选择器，其他模型不显示，以避免配置无效参数。

#### 验收标准

1. WHEN 用户选择 gemini-3-pro-preview 模型 THEN 系统 SHALL 显示思考等级选择器（低/高）
2. WHEN 用户选择非 gemini-3-pro-preview 模型 THEN 系统 SHALL 隐藏思考等级选择器
3. WHEN gemini-3-pro-preview 模型的思考等级未设置 THEN 系统 SHALL 使用 "high" 作为默认值
4. WHEN 用户切换思考等级 THEN 系统 SHALL 立即保存配置并在下次请求中生效

### 需求 3

**用户故事:** 作为用户，我希望 Gemini 2.5 系列模型显示思考预算滑块，以便精确控制模型的思考 token 数量。

#### 模型思考预算配置表

| 模型 | 默认设置 | 范围 | 禁用思考 | 动态思考 |
|------|----------|------|----------|----------|
| gemini-2.5-pro | 动态思考（-1） | 128 到 32768 | 不支持禁用 | thinkingBudget = -1 |
| gemini-2.5-flash | 动态思考（-1） | 0 到 24576 | thinkingBudget = 0 | thinkingBudget = -1 |
| gemini-2.5-flash-lite | 不思考（0） | 0 到 24576 | thinkingBudget = 0 | thinkingBudget = -1 |

#### 验收标准

1. WHEN 用户选择 gemini-2.5-pro 模型 THEN 系统 SHALL 显示思考预算滑块，范围为 128 到 32768，默认值为 -1（动态思考）
2. WHEN 用户选择 gemini-2.5-flash 模型 THEN 系统 SHALL 显示思考预算滑块，范围为 0 到 24576，默认值为 -1（动态思考）
3. WHEN 用户选择 gemini-2.5-flash-lite 模型 THEN 系统 SHALL 显示思考预算滑块，范围为 0 到 24576，默认值为 0（不思考）
4. WHEN 用户将思考预算设置为 -1 THEN 系统 SHALL 启用动态思考模式，模型根据请求复杂度自动调整思考量
5. WHEN 用户将思考预算设置为 0（对于 gemini-2.5-flash 和 gemini-2.5-flash-lite）THEN 系统 SHALL 禁用思考功能
6. WHEN 用户尝试将 gemini-2.5-pro 的思考预算设置为 0 THEN 系统 SHALL 阻止此操作，因为该模型不支持禁用思考
7. WHEN 用户调整思考预算滑块 THEN 系统 SHALL 实时显示当前 token 数值，-1 显示为"动态"，0 显示为"关闭"
8. WHEN 发送 API 请求 THEN 系统 SHALL 根据模型类型使用正确的思考配置参数（gemini-3-pro 使用 thinkingLevel，gemini-2.5 系列使用 thinkingBudget）
9. WHEN 思考预算滑块显示时 THEN 系统 SHALL 提供快捷按钮切换"动态"和"关闭"模式（如果模型支持）

### 需求 4

**用户故事:** 作为用户，我希望能够控制是否显示模型的思维链摘要，以便在需要时查看模型的推理过程。

#### 验收标准

1. WHEN 用户在聊天页面查看配置 THEN 系统 SHALL 显示"显示思维链"开关（仅对支持的模型）
2. WHEN 用户启用"显示思维链"开关 THEN 系统 SHALL 在 API 请求中设置 includeThoughts 为 true
3. WHEN API 响应包含思维链内容 THEN 系统 SHALL 在消息中显示思维链摘要区域
4. WHEN 用户禁用"显示思维链"开关 THEN 系统 SHALL 不请求也不显示思维链内容
5. WHEN 显示思维链摘要 THEN 系统 SHALL 使用可折叠的 UI 组件，默认展开显示

### 需求 5

**用户故事:** 作为用户，我希望在模型管理设置中配置每个模型是否支持思维链功能，以便系统正确处理不同模型的能力。

#### 验收标准

1. WHEN 用户查看模型能力配置 THEN 系统 SHALL 显示"支持思维链"选项
2. WHEN 模型配置为支持思维链 THEN 系统 SHALL 在聊天页面显示思维链开关
3. WHEN 模型配置为不支持思维链 THEN 系统 SHALL 隐藏思维链开关
4. THE 系统 SHALL 预设以下模型支持思维链：gemini-2.5-pro、gemini-3-pro-preview、gemini-3-pro-image-preview、gemini-2.5-flash

### 需求 6

**用户故事:** 作为用户，我希望思维链内容以清晰的格式显示，与普通回复内容区分开来。

#### 验收标准

1. WHEN 显示思维链摘要 THEN 系统 SHALL 使用不同的背景色和边框样式与普通内容区分
2. WHEN 显示思维链摘要 THEN 系统 SHALL 在摘要前显示"思考过程"标题
3. WHEN 思维链内容较长 THEN 系统 SHALL 支持折叠/展开功能
4. WHEN 用户点击折叠按钮 THEN 系统 SHALL 平滑动画切换显示状态
