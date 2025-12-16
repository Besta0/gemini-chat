# 实现计划

- [x] 1. 项目初始化和基础架构





  - [x] 1.1 使用 Vite 创建 React + TypeScript 项目


    - 初始化项目结构
    - 配置 TypeScript 严格模式
    - 安装核心依赖：zustand, tailwindcss, react-markdown, remark-gfm, rehype-highlight, katex, idb, fast-check, vitest
    - _需求: 11.1_
  - [x] 1.2 配置 Tailwind CSS 和基础样式


    - 设置 Tailwind 配置文件
    - 创建全局样式和主题变量
    - 配置明暗主题支持
    - _需求: 11.2_
  - [x] 1.3 创建项目目录结构


    - 创建 src/components、src/services、src/stores、src/types、src/utils 目录
    - _需求: 11.1_

- [x] 2. 核心类型定义






  - [x] 2.1 定义 Gemini API 相关类型

    - 创建 src/types/gemini.ts
    - 定义 GeminiRequest、GeminiContent、GeminiPart、GenerationConfig、SafetySetting 等接口
    - _需求: 2.1, 5.6, 12.1_
  - [x] 2.2 定义应用数据模型类型


    - 创建 src/types/models.ts
    - 定义 Conversation、Message、Attachment、AppSettings、ApiConfig 等接口
    - _需求: 4.1, 5.1, 6.3_

- [x] 3. 存储服务实现





  - [x] 3.1 实现 IndexedDB 存储服务


    - 创建 src/services/storage.ts
    - 实现 saveConversation、getConversation、getAllConversations、deleteConversation 方法
    - 实现 saveSettings、getSettings 方法
    - _需求: 4.2, 4.3, 4.4, 5.5_
  - [x] 3.2 编写存储服务属性测试


    - **Property 1: 设置存储往返一致性**
    - **验证: 需求 1.3, 2.2, 5.5**
  - [x] 3.3 实现导入导出功能


    - 实现 exportAllData 方法，序列化所有对话和设置为 JSON
    - 实现 importData 方法，解析 JSON 并恢复数据
    - 实现数据验证逻辑
    - _需求: 10.1, 10.2, 10.3, 10.4, 10.6_
  - [x] 3.4 编写导入导出属性测试


    - **Property 11: 导入导出往返一致性**
    - **验证: 需求 10.1, 10.2, 10.4, 10.6**

- [x] 4. 检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 5. 文件处理服务实现






  - [x] 5.1 实现文件验证功能

    - 创建 src/services/file.ts
    - 实现 validateFile 方法，验证文件类型和大小
    - 支持图片格式：JPEG、PNG、WebP、GIF（最大 20MB）
    - 支持文档格式：PDF、TXT、代码文件（最大 50MB）
    - _需求: 6.1, 6.4, 7.1, 7.4_
  - [x] 5.2 编写文件验证属性测试


    - **Property 8: 文件类型验证正确性**
    - **验证: 需求 6.1, 7.1**
  - [x] 5.3 实现文件转换功能

    - 实现 fileToBase64 方法
    - 实现 readTextFile 方法
    - 实现 fileToGeminiPart 方法，将文件转换为 Gemini API 格式
    - _需求: 6.2, 6.3, 7.2, 7.3_
  - [x] 5.4 编写文件转换属性测试


    - **Property 9: 文件 Base64 转换往返一致性**
    - **验证: 需求 6.2, 7.3**

- [x] 6. Gemini API 服务实现





  - [x] 6.1 实现 URL 验证和构建功能


    - 创建 src/services/gemini.ts
    - 实现 validateApiEndpoint 方法，验证 URL 格式
    - 实现 buildRequestUrl 方法，构建完整的 API 请求 URL
    - _需求: 1.2, 8.5_
  - [x] 6.2 编写 URL 相关属性测试


    - **Property 2: API 端点 URL 格式验证**
    - **Property 13: API URL 构建正确性**
    - **验证: 需求 1.2, 8.5**

  - [x] 6.3 实现请求体构建功能

    - 实现 buildRequestBody 方法
    - 支持 contents、generationConfig、safetySettings、systemInstruction 字段
    - _需求: 2.4, 3.2, 5.6, 12.3_

  - [x] 6.4 编写请求体构建属性测试

    - **Property 3: Gemini 请求体构建正确性**
    - **验证: 需求 2.4, 3.2, 5.6, 12.3**
  - [x] 6.5 实现流式响应处理


    - 实现 sendMessage 方法，支持流式响应
    - 实现 testConnection 方法
    - 处理各种 API 错误
    - _需求: 5.2, 5.4, 1.4_

- [x] 7. 检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 8. 状态管理实现










  - [x] 8.1 实现设置状态管理

    - 创建 src/stores/settings.ts
    - 实现 SettingsStore，管理 API 配置、生成参数、安全设置、系统指令
    - 实现与存储服务的同步
    - _需求: 1.1, 1.3, 2.1, 2.2, 2.5, 3.1, 3.2, 12.1, 12.2, 12.4_
  - [x] 8.2 编写设置状态属性测试





    - **Property 12: 模型选择持久化**
    - **Property 15: 主题切换状态一致性**
    - **验证: 需求 8.2, 8.3, 11.2**
  - [x] 8.3 实现对话状态管理


    - 创建 src/stores/conversation.ts
    - 实现 ConversationStore，管理对话列表、当前对话、消息历史
    - 实现创建、删除、重命名、选择对话功能
    - 实现发送消息和接收响应功能
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.5_
  - [x] 8.4 编写对话状态属性测试


    - **Property 4: 对话创建增加列表长度**
    - **Property 5: 对话删除减少列表长度**
    - **Property 6: 对话重命名持久化**
    - **Property 7: 消息添加增加历史长度**
    - **Property 16: 对话独立系统指令**
    - **验证: 需求 4.1, 4.4, 4.5, 5.1, 3.3**

- [x] 9. 检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 10. UI 组件实现 - 布局和侧边栏





  - [x] 10.1 实现应用主布局


    - 创建 src/components/Layout.tsx
    - 实现响应式布局，包含侧边栏和主内容区
    - 实现侧边栏折叠/展开功能
    - _需求: 11.1, 11.3_

  - [x] 10.2 实现对话列表侧边栏

    - 创建 src/components/Sidebar.tsx
    - 显示对话列表，包含标题和更新时间
    - 实现新建对话按钮
    - 实现对话选择、删除、重命名功能
    - _需求: 4.1, 4.2, 4.4, 4.5_

- [x] 11. UI 组件实现 - 聊天区域






  - [x] 11.1 实现消息列表组件

    - 创建 src/components/MessageList.tsx
    - 渲染消息历史，区分用户和 AI 消息
    - 实现自动滚动到最新消息
    - 显示附件预览（图片、文件）
    - _需求: 4.3, 7.5, 11.4_

  - [x] 11.2 实现 Markdown 渲染组件

    - 创建 src/components/MarkdownRenderer.tsx
    - 集成 react-markdown、remark-gfm、rehype-highlight
    - 实现代码块语法高亮和复制按钮
    - 集成 KaTeX 渲染数学公式
    - _需求: 9.1, 9.2, 9.3_

  - [x] 11.3 实现消息输入组件

    - 创建 src/components/MessageInput.tsx
    - 实现文本输入框，支持多行输入
    - 实现图片和文件上传按钮
    - 实现拖拽上传功能
    - 显示附件预览和删除功能
    - 实现发送按钮和加载状态
    - _需求: 5.1, 5.3, 6.1, 6.2, 6.5, 7.1, 7.5, 9.4_

  - [x] 11.4 编写消息内容属性测试
    - **Property 10: 多模态消息构建正确性**
    - **Property 14: 消息内容保持原样**
    - **验证: 需求 6.3, 6.5, 9.4**


- [x] 12. UI 组件实现 - 设置面板

  - [x] 12.1 实现设置面板主组件
    - 创建 src/components/Settings.tsx
    - 实现设置面板的打开/关闭功能
    - 组织各设置分组
    - _需求: 1.1, 2.1, 3.1, 12.1_

  - [x] 12.2 实现 API 配置设置
    - 实现 API 端点输入框
    - 实现 API 密钥输入框（密码类型）
    - 实现测试连接按钮
    - _需求: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 12.3 实现模型选择设置
    - 实现模型下拉选择器
    - 显示预设模型列表
    - 支持自定义模型输入
    - _需求: 8.1, 8.2, 8.4_

  - [x] 12.4 实现生成参数设置
    - 实现 temperature 滑块（0-2）
    - 实现 topP 滑块（0-1）
    - 实现 topK 输入框
    - 实现 maxOutputTokens 输入框
    - 实现 stopSequences 输入
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 12.5 实现系统指令设置
    - 实现系统指令文本区域
    - 支持全局和对话级别的系统指令
    - _需求: 3.1, 3.2, 3.3, 3.4_

  - [x] 12.6 实现安全设置
    - 实现四种危害类别的过滤级别选择
    - 支持 BLOCK_NONE、BLOCK_LOW_AND_ABOVE、BLOCK_MEDIUM_AND_ABOVE、BLOCK_ONLY_HIGH 四个级别
    - _需求: 12.1, 12.2, 12.3, 12.4_

  - [x] 12.7 实现导入导出功能 UI

    - 实现导出按钮，触发 JSON 文件下载
    - 实现导入按钮，选择 JSON 文件并导入
    - 显示导入结果提示
    - _需求: 10.1, 10.2, 10.3_

- [x] 13. 主题和样式完善






  - [x] 13.1 实现主题切换功能

    - 实现明暗主题切换按钮
    - 支持跟随系统主题
    - 持久化主题设置
    - _需求: 11.2_

  - [x] 13.2 完善响应式布局

    - 优化移动端布局
    - 实现移动端侧边栏抽屉
    - _需求: 11.1_

- [x] 14. 应用集成和入口






  - [x] 14.1 实现应用入口组件

    - 创建 src/App.tsx
    - 集成所有组件和状态管理
    - 实现应用初始化逻辑（加载存储数据）
    - _需求: 11.1_

  - [x] 14.2 配置应用启动

    - 更新 src/main.tsx
    - 配置全局样式
    - _需求: 11.1_

- [x] 15. 最终检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。
