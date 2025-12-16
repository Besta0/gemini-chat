# 需求文档

## 简介

本文档定义了 Gemini Chat 应用的 Gemini 3 模型特定参数支持和 UI 布局优化需求。核心目标是：
1. 为 Gemini 3 Pro 添加思考程度 (thinking_level) 参数配置
2. 为 Gemini 3 Pro Image 添加图片宽高比和分辨率 (1K/2K/4K) 参数配置
3. 优化整体 UI 布局，将设置面板集成到侧边栏，消息输入框固定在底部

## 术语表

- **思考程度（Thinking Level）**: Gemini 3 Pro 的推理深度参数，支持 low 和 high 两个级别
- **图片宽高比（Aspect Ratio）**: Gemini 3 Pro Image 生成图片的宽高比例，如 1:1、16:9、9:16 等
- **图片分辨率（Image Size）**: Gemini 3 Pro Image 生成图片的分辨率，支持 1K（默认）、2K、4K
- **侧边栏设置（Sidebar Settings）**: 将模型配置和参数设置集成到侧边栏的设计模式
- **模型特定参数（Model-Specific Parameters）**: 仅适用于特定模型的配置参数

## 需求

### 需求 1：Gemini 3 Pro 思考程度参数

**用户故事：** 作为用户，我希望能够配置 Gemini 3 Pro 的思考程度，以便在需要深度推理时获得更好的回答，或在简单任务时获得更快的响应。

#### 验收标准

1. WHEN 用户选择 gemini-3-pro-preview 模型 THEN 系统 SHALL 显示思考程度选项
2. THE 思考程度选项 SHALL 提供 low 和 high 两个级别供用户选择
3. WHEN 用户选择 low 级别 THEN 系统 SHALL 在 API 请求中设置 thinkingConfig.thinkingLevel 为 "low"
4. WHEN 用户选择 high 级别 THEN 系统 SHALL 在 API 请求中设置 thinkingConfig.thinkingLevel 为 "high"
5. WHEN 用户未选择思考程度 THEN 系统 SHALL 使用 high 作为默认值
6. THE 思考程度配置 SHALL 持久化存储到聊天窗口配置中

### 需求 2：Gemini 3 Pro Image 图片参数

**用户故事：** 作为用户，我希望能够配置 Gemini 3 Pro Image 生成图片的宽高比和分辨率，以便获得符合我需求的图片输出。

#### 验收标准

1. WHEN 用户选择 gemini-3-pro-image-preview 模型 THEN 系统 SHALL 显示图片宽高比选项
2. THE 图片宽高比选项 SHALL 提供 1:1、16:9、9:16、4:3、3:4 等选项
3. WHEN 用户选择 gemini-3-pro-image-preview 模型 THEN 系统 SHALL 显示图片分辨率选项
4. THE 图片分辨率选项 SHALL 提供 1K（默认）、2K、4K 三个级别
5. WHEN 用户发送图片生成请求 THEN 系统 SHALL 在 API 请求中包含 imageConfig.aspectRatio 和 imageConfig.imageSize 参数
6. THE 图片参数配置 SHALL 持久化存储到聊天窗口配置中

### 需求 3：模型特定参数动态显示

**用户故事：** 作为用户，我希望设置界面只显示当前选择模型支持的参数，避免看到不相关的配置选项。

#### 验收标准

1. WHEN 用户切换模型 THEN 系统 SHALL 动态更新显示的参数选项
2. WHEN 用户选择不支持思考程度的模型 THEN 系统 SHALL 隐藏思考程度选项
3. WHEN 用户选择不支持图片生成的模型 THEN 系统 SHALL 隐藏图片参数选项
4. THE 参数显示切换 SHALL 使用平滑的过渡动画
5. WHEN 用户切换到不支持某参数的模型 THEN 系统 SHALL 保留该参数的配置值以便切换回来时恢复

### 需求 4：侧边栏集成设置面板

**用户故事：** 作为用户，我希望在侧边栏中直接访问设置，而不需要打开单独的模态窗口，让操作更加便捷。

#### 验收标准

1. THE 侧边栏 SHALL 包含三个主要标签页：助手（聊天窗口列表）、话题（子话题列表）、设置
2. WHEN 用户点击设置标签 THEN 系统 SHALL 在侧边栏内显示设置内容
3. THE 侧边栏设置 SHALL 包含 API 配置、模型选择、生成参数、系统指令等分类
4. THE 侧边栏设置 SHALL 使用可折叠的分组展示各类设置
5. WHEN 用户在侧边栏修改设置 THEN 系统 SHALL 实时保存并应用
6. THE 侧边栏 SHALL 支持响应式布局，在移动端可收起

### 需求 5：消息输入框布局优化

**用户故事：** 作为用户，我希望消息输入框始终固定在聊天区域底部，方便我随时输入消息。

#### 验收标准

1. THE 消息输入框 SHALL 固定在聊天区域底部，不随消息列表滚动
2. THE 消息列表 SHALL 占据输入框上方的所有可用空间
3. WHEN 消息列表内容超出可视区域 THEN 系统 SHALL 显示滚动条
4. THE 输入框 SHALL 包含附件按钮、发送按钮等操作按钮
5. WHEN 用户选择图片生成模型 THEN 输入框区域 SHALL 显示图片参数快捷设置
6. THE 布局 SHALL 在不同屏幕尺寸下保持一致的用户体验

### 需求 6：聊天窗口顶部工具栏优化

**用户故事：** 作为用户，我希望在聊天窗口顶部看到当前使用的模型信息，并能快速切换模型和配置。

#### 验收标准

1. THE 聊天窗口顶部 SHALL 显示当前模型名称和图标
2. WHEN 用户点击模型名称 THEN 系统 SHALL 显示模型切换下拉菜单
3. THE 顶部工具栏 SHALL 显示当前聊天窗口的关键配置状态
4. WHEN 用户使用 Gemini 3 Pro THEN 工具栏 SHALL 显示当前思考程度
5. WHEN 用户使用 Gemini 3 Pro Image THEN 工具栏 SHALL 显示当前图片参数
6. THE 工具栏 SHALL 提供快捷配置按钮，点击可展开详细配置面板

### 需求 7：现代化视觉设计优化

**用户故事：** 作为用户，我希望应用具有现代化、有设计感的视觉风格，色调丰富但和谐，让使用体验更加愉悦。

#### 验收标准

1. THE 设计系统 SHALL 使用主题色（如绿色）作为品牌色，贯穿整个应用
2. THE 侧边栏 SHALL 使用与主内容区不同的背景色，形成视觉层次
3. THE 聊天窗口卡片 SHALL 使用带有微妙渐变或阴影的设计，增加立体感
4. THE 按钮和交互元素 SHALL 使用主题色高亮，提供清晰的视觉反馈
5. THE 新建对话按钮 SHALL 使用醒目的主题色背景，易于识别
6. THE 模型标签 SHALL 使用彩色标签设计，不同模型使用不同颜色区分
7. THE 消息气泡 SHALL 使用柔和的背景色，用户消息和 AI 消息使用不同色调
8. THE 图标 SHALL 使用统一的图标风格，带有适当的颜色

### 需求 8：聊天窗口卡片设计优化

**用户故事：** 作为用户，我希望聊天窗口列表中的卡片设计更加美观，能够清晰展示关键信息。

#### 验收标准

1. THE 聊天窗口卡片 SHALL 显示自定义图标或头像
2. THE 聊天窗口卡片 SHALL 显示标题、模型标签、消息数量
3. THE 模型标签 SHALL 使用彩色胶囊样式，不同模型系列使用不同颜色
4. WHEN 用户悬停在卡片上 THEN 系统 SHALL 显示微妙的高亮效果
5. THE 当前选中的卡片 SHALL 使用明显的高亮背景色
6. THE 卡片 SHALL 支持显示星标/收藏状态

### 需求 9：输入框工具栏设计

**用户故事：** 作为用户，我希望输入框下方有丰富的工具按钮，方便我进行各种操作。

#### 验收标准

1. THE 输入框工具栏 SHALL 包含附件上传、表情、链接等常用功能按钮
2. THE 工具按钮 SHALL 使用图标设计，悬停时显示提示文字
3. WHEN 用户使用图片生成模型 THEN 工具栏 SHALL 显示图片相关的快捷设置
4. THE 发送按钮 SHALL 使用主题色，位于输入框右侧
5. THE 工具栏 SHALL 支持自定义显示/隐藏某些按钮
6. THE 输入框 SHALL 支持拖拽上传文件

