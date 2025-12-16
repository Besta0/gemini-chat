# 需求文档

## 简介

Gemini Chat 是一个专门为 Google Gemini AI 打造的聊天客户端应用。与 NextChat 类似，它提供了一个现代化的聊天界面，但专注于 Gemini API 的原生格式和特性。用户可以自定义 API 端点，支持官方 API 和第三方代理服务。应用支持 Gemini 的多模态能力，包括图片识别和文件处理。

## 术语表

- **Gemini_Chat_System**: 本聊天客户端应用系统
- **User**: 使用本应用的终端用户
- **Conversation**: 用户与 AI 之间的一次完整对话会话
- **Message**: 对话中的单条消息，包含角色和内容
- **API_Endpoint**: Gemini API 的访问地址，可以是官方地址或自定义代理地址
- **API_Key**: 用于身份验证的密钥
- **Model**: Gemini 的模型版本（如 gemini-2.0-flash, gemini-1.5-pro 等）
- **Streaming_Response**: 流式响应，AI 回复逐字显示
- **Multimodal_Content**: 多模态内容，包含文本、图片、文件等多种类型
- **Generation_Config**: 生成配置参数，控制 AI 输出行为
- **Safety_Settings**: 安全设置，控制内容过滤级别
- **System_Instruction**: 系统指令，设置 AI 的行为和角色

## 需求

### 需求 1

**用户故事:** 作为用户，我希望能够配置 API 连接设置，以便使用官方或自定义的 Gemini API 服务。

#### 验收标准

1. WHEN User 打开设置页面 THEN Gemini_Chat_System SHALL 显示 API 配置表单，包含 API 端点地址和 API 密钥输入框
2. WHEN User 输入自定义 API 端点地址 THEN Gemini_Chat_System SHALL 验证地址格式并保存配置
3. WHEN User 输入 API 密钥 THEN Gemini_Chat_System SHALL 安全存储密钥到本地存储
4. WHEN User 点击测试连接按钮 THEN Gemini_Chat_System SHALL 发送测试请求并显示连接状态结果
5. IF API 配置无效或缺失 THEN Gemini_Chat_System SHALL 在用户尝试发送消息时显示配置提示

### 需求 2

**用户故事:** 作为用户，我希望能够配置 Gemini API 的生成参数，以便精细控制 AI 的输出行为。

#### 验收标准

1. WHEN User 打开生成参数设置 THEN Gemini_Chat_System SHALL 显示 temperature（0-2）、topP（0-1）、topK、maxOutputTokens 的配置选项
2. WHEN User 调整 temperature 参数 THEN Gemini_Chat_System SHALL 保存该值并在后续请求中使用
3. WHEN User 设置 maxOutputTokens THEN Gemini_Chat_System SHALL 限制 AI 回复的最大长度
4. WHEN User 配置 stopSequences THEN Gemini_Chat_System SHALL 在请求中包含停止序列数组
5. WHEN User 未配置参数 THEN Gemini_Chat_System SHALL 使用合理的默认值（temperature=1, topP=0.95, topK=40）

### 需求 3

**用户故事:** 作为用户，我希望能够设置系统指令，以便定义 AI 的角色和行为方式。

#### 验收标准

1. WHEN User 打开系统指令设置 THEN Gemini_Chat_System SHALL 显示系统指令文本输入区域
2. WHEN User 输入系统指令 THEN Gemini_Chat_System SHALL 在 API 请求的 systemInstruction 字段中包含该内容
3. WHEN User 为对话设置独立系统指令 THEN Gemini_Chat_System SHALL 允许每个对话使用不同的系统指令
4. WHEN User 未设置系统指令 THEN Gemini_Chat_System SHALL 发送不包含 systemInstruction 字段的请求

### 需求 4

**用户故事:** 作为用户，我希望能够创建和管理多个对话，以便组织不同主题的聊天内容。

#### 验收标准

1. WHEN User 点击新建对话按钮 THEN Gemini_Chat_System SHALL 创建一个新的空白对话并切换到该对话
2. WHEN User 查看对话列表 THEN Gemini_Chat_System SHALL 显示所有对话，包含标题和最后更新时间
3. WHEN User 选择一个对话 THEN Gemini_Chat_System SHALL 加载并显示该对话的完整消息历史
4. WHEN User 删除一个对话 THEN Gemini_Chat_System SHALL 移除该对话及其所有消息，并更新对话列表
5. WHEN User 重命名对话 THEN Gemini_Chat_System SHALL 更新对话标题并持久化保存

### 需求 5

**用户故事:** 作为用户，我希望能够发送消息并接收 AI 回复，以便与 Gemini 进行对话。

#### 验收标准

1. WHEN User 在输入框中输入消息并提交 THEN Gemini_Chat_System SHALL 将消息添加到对话历史并发送到 Gemini API
2. WHEN Gemini API 返回响应 THEN Gemini_Chat_System SHALL 以流式方式逐字显示 AI 回复内容
3. WHEN 消息发送过程中 THEN Gemini_Chat_System SHALL 显示加载状态指示器
4. IF API 请求失败 THEN Gemini_Chat_System SHALL 显示错误信息并允许用户重试
5. WHEN 对话内容更新 THEN Gemini_Chat_System SHALL 自动将对话持久化到本地存储
6. WHEN User 发送消息 THEN Gemini_Chat_System SHALL 按照 Gemini API 格式构建请求体，包含 contents 数组和 generationConfig

### 需求 6

**用户故事:** 作为用户，我希望能够上传图片并让 AI 识别和分析图片内容，以便进行多模态对话。

#### 验收标准

1. WHEN User 点击图片上传按钮或拖拽图片到输入区域 THEN Gemini_Chat_System SHALL 接受 JPEG、PNG、WebP、GIF 格式的图片
2. WHEN User 上传图片 THEN Gemini_Chat_System SHALL 将图片转换为 base64 编码并显示预览
3. WHEN User 发送包含图片的消息 THEN Gemini_Chat_System SHALL 构建包含 inlineData 的 parts 数组，格式为 {inlineData: {mimeType, data}}
4. WHEN 图片文件大小超过 20MB THEN Gemini_Chat_System SHALL 显示错误提示并拒绝上传
5. WHEN User 上传多张图片 THEN Gemini_Chat_System SHALL 支持在单条消息中包含多个图片

### 需求 7

**用户故事:** 作为用户，我希望能够上传文档文件让 AI 分析，以便处理 PDF、代码文件等内容。

#### 验收标准

1. WHEN User 点击文件上传按钮 THEN Gemini_Chat_System SHALL 接受 PDF、TXT、代码文件（js、py、java 等）格式
2. WHEN User 上传文本类文件 THEN Gemini_Chat_System SHALL 读取文件内容并作为文本消息发送
3. WHEN User 上传 PDF 文件 THEN Gemini_Chat_System SHALL 将 PDF 转换为 base64 并使用 application/pdf mimeType 发送
4. WHEN 文件大小超过限制 THEN Gemini_Chat_System SHALL 显示文件大小限制提示
5. WHEN User 上传文件后 THEN Gemini_Chat_System SHALL 在消息中显示文件名和类型标识

### 需求 8

**用户故事:** 作为用户，我希望能够选择不同的 Gemini 模型，以便根据需求使用合适的 AI 能力。

#### 验收标准

1. WHEN User 打开模型选择器 THEN Gemini_Chat_System SHALL 显示预设的 Gemini 模型列表（gemini-2.0-flash、gemini-1.5-pro、gemini-1.5-flash 等）
2. WHEN User 选择一个模型 THEN Gemini_Chat_System SHALL 将该模型设置为当前对话的默认模型
3. WHEN User 创建新对话 THEN Gemini_Chat_System SHALL 使用用户上次选择的模型作为默认值
4. WHEN User 需要使用自定义模型 THEN Gemini_Chat_System SHALL 允许用户手动输入模型名称
5. WHEN 构建 API 请求 THEN Gemini_Chat_System SHALL 在请求 URL 中使用正确的模型名称格式

### 需求 9

**用户故事:** 作为用户，我希望消息能够以 Markdown 格式渲染，以便更好地阅读代码和格式化内容。

#### 验收标准

1. WHEN AI 回复包含 Markdown 语法 THEN Gemini_Chat_System SHALL 正确渲染标题、列表、粗体、斜体等格式
2. WHEN AI 回复包含代码块 THEN Gemini_Chat_System SHALL 以语法高亮方式显示代码，并提供复制按钮
3. WHEN AI 回复包含数学公式 THEN Gemini_Chat_System SHALL 使用 LaTeX 渲染公式
4. WHEN User 输入消息 THEN Gemini_Chat_System SHALL 保持原始文本格式发送，不进行 Markdown 预处理

### 需求 10

**用户故事:** 作为用户，我希望能够导出和导入对话数据，以便备份或迁移我的聊天记录。

#### 验收标准

1. WHEN User 点击导出按钮 THEN Gemini_Chat_System SHALL 将所有对话数据序列化为 JSON 格式并下载
2. WHEN User 导入 JSON 文件 THEN Gemini_Chat_System SHALL 解析文件内容并恢复对话数据
3. IF 导入的 JSON 格式无效 THEN Gemini_Chat_System SHALL 显示错误提示并拒绝导入
4. WHEN 导出数据时 THEN Gemini_Chat_System SHALL 包含对话元数据、消息历史和用户设置
5. WHEN 序列化对话数据 THEN Gemini_Chat_System SHALL 使用 JSON.stringify 进行序列化
6. WHEN 反序列化对话数据 THEN Gemini_Chat_System SHALL 使用 JSON.parse 进行解析并验证数据结构

### 需求 11

**用户故事:** 作为用户，我希望应用有一个现代化的用户界面，以便获得良好的使用体验。

#### 验收标准

1. WHEN User 访问应用 THEN Gemini_Chat_System SHALL 显示响应式布局，适配桌面和移动设备
2. WHEN User 切换主题 THEN Gemini_Chat_System SHALL 在明亮和暗黑主题之间切换
3. WHEN User 调整侧边栏 THEN Gemini_Chat_System SHALL 允许折叠和展开对话列表面板
4. WHEN 消息列表更新 THEN Gemini_Chat_System SHALL 自动滚动到最新消息位置

### 需求 12

**用户故事:** 作为用户，我希望能够配置安全设置，以便控制 AI 内容过滤的级别。

#### 验收标准

1. WHEN User 打开安全设置 THEN Gemini_Chat_System SHALL 显示各类内容的过滤级别选项（HARM_CATEGORY_HARASSMENT、HARM_CATEGORY_HATE_SPEECH、HARM_CATEGORY_SEXUALLY_EXPLICIT、HARM_CATEGORY_DANGEROUS_CONTENT）
2. WHEN User 调整过滤级别 THEN Gemini_Chat_System SHALL 支持 BLOCK_NONE、BLOCK_LOW_AND_ABOVE、BLOCK_MEDIUM_AND_ABOVE、BLOCK_ONLY_HIGH 四个级别
3. WHEN User 保存安全设置 THEN Gemini_Chat_System SHALL 在后续 API 请求的 safetySettings 数组中包含配置
4. WHEN User 未配置安全设置 THEN Gemini_Chat_System SHALL 使用 API 默认的安全设置
