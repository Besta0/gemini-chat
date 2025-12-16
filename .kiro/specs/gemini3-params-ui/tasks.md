# 实现计划

- [x] 1. 扩展类型定义和模型能力





  - [x] 1.1 扩展 src/types/models.ts 添加新类型


    - 添加 ImageAspectRatio 类型 ('1:1' | '16:9' | '9:16' | '4:3' | '3:4')
    - 添加 ImageSize 类型 ('1K' | '2K' | '4K')
    - 添加 ImageGenerationConfig 接口
    - 扩展 ModelAdvancedConfig 添加 imageConfig 字段
    - 添加 MODEL_CAPABILITIES 常量映射
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 1.2 扩展 src/types/chatWindow.ts 支持新配置


    - 确保 ChatWindowConfig.advancedConfig 支持新的图片配置
    - _Requirements: 1.6, 2.6_

  - [ ]* 1.3 编写属性测试：模型参数动态显示
    - **Property 5: 模型参数动态显示**
    - **Validates: Requirements 1.1, 2.1, 2.3, 3.1, 3.2, 3.3**

- [x] 2. 扩展 API 请求构建逻辑





  - [x] 2.1 更新 src/services/gemini.ts



    - 修改 buildThinkingConfig 使用 thinkingLevel 而非 thinkingBudget
    - 添加 buildImageConfig 函数
    - 更新 buildRequestBody 支持图片配置
    - _Requirements: 1.3, 1.4, 2.5_

  - [x] 2.2 编写属性测试：思考程度配置映射正确性






    - **Property 1: 思考程度配置映射正确性**
    - **Validates: Requirements 1.3, 1.4**

  - [x] 2.3 编写属性测试：图片参数配置映射正确性





    - **Property 3: 图片参数配置映射正确性**
    - **Validates: Requirements 2.5**

- [-] 3. 更新存储和状态管理



  - [x] 3.1 更新 src/stores/chatWindow.ts



    - 确保 advancedConfig 正确持久化
    - 添加 updateAdvancedConfig 方法
    - _Requirements: 1.6, 2.6, 4.5_

  - [ ]* 3.2 编写属性测试：思考程度配置持久化
    - **Property 2: 思考程度配置持久化**
    - **Validates: Requirements 1.6**

  - [ ]* 3.3 编写属性测试：图片参数配置持久化
    - **Property 4: 图片参数配置持久化**
    - **Validates: Requirements 2.6**

  - [ ]* 3.4 编写属性测试：配置值保留
    - **Property 6: 配置值保留**
    - **Validates: Requirements 3.5**

- [x] 4. Checkpoint - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 5. 创建模型参数组件





  - [x] 5.1 创建 src/components/ModelParams/ThinkingLevelSelector.tsx


    - 实现思考程度选择器（low/high 两个选项）
    - 支持 full 和 compact 两种显示模式
    - 使用主题色高亮当前选择
    - _Requirements: 1.1, 1.2, 6.4_

  - [x] 5.2 创建 src/components/ModelParams/ImageConfigPanel.tsx


    - 实现图片宽高比选择（1:1, 16:9, 9:16, 4:3, 3:4）
    - 实现图片分辨率选择（1K, 2K, 4K）
    - 支持 full 和 compact 两种显示模式
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.5_

  - [x] 5.3 创建 src/components/ModelParams/index.ts


    - 导出所有模型参数组件
    - 创建 useModelCapabilities hook
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. 重构侧边栏组件





  - [x] 6.1 创建 src/components/Sidebar/SidebarTabs.tsx


    - 实现三个标签页：助手、话题、设置
    - 使用主题色高亮当前标签
    - 添加标签切换动画
    - _Requirements: 4.1, 4.2_


  - [x] 6.2 创建 src/components/Sidebar/SidebarSettings.tsx

    - 实现可折叠的设置分组
    - 包含 API 配置、模型选择、生成参数、系统指令分组
    - 实时保存设置修改
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ]* 6.3 编写属性测试：设置实时保存
    - **Property 7: 设置实时保存**
    - **Validates: Requirements 4.5**

  - [x] 6.4 重构 src/components/Sidebar/index.tsx


    - 集成 SidebarTabs 组件
    - 根据当前标签显示不同内容
    - 优化视觉设计（背景色、阴影、间距）
    - _Requirements: 4.1, 4.2, 4.6, 7.2_

  - [ ]* 6.5 编写属性测试：响应式布局
    - **Property 8: 响应式布局**
    - **Validates: Requirements 4.6, 5.6**

- [x] 7. 优化聊天窗口卡片设计





  - [x] 7.1 更新 src/components/Sidebar/ChatWindowCard.tsx


    - 添加自定义图标/头像显示
    - 使用彩色胶囊样式的模型标签
    - 添加悬停高亮效果
    - 添加选中状态高亮
    - 添加星标/收藏功能
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 8. Checkpoint - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 9. 重构聊天区域布局






  - [x] 9.1 创建 src/components/ChatArea/ChatHeader.tsx

    - 显示当前模型名称和图标
    - 实现模型切换下拉菜单
    - 显示关键配置状态（思考程度/图片参数）
    - 添加快捷配置按钮
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 9.2 编写属性测试：工具栏模型参数显示
    - **Property 10: 工具栏模型参数显示**
    - **Validates: Requirements 6.4, 6.5**


  - [x] 9.3 创建 src/components/ChatArea/ModelParamsBar.tsx

    - 在输入框上方显示模型特定参数
    - 根据模型能力动态显示思考程度或图片参数
    - 使用紧凑模式显示
    - _Requirements: 5.5, 9.3_

  - [ ]* 9.4 编写属性测试：模型参数栏显示
    - **Property 9: 模型参数栏显示**
    - **Validates: Requirements 5.5**

  - [x] 9.5 更新 src/components/ChatArea/ChatArea.tsx


    - 集成 ChatHeader 组件
    - 集成 ModelParamsBar 组件
    - 确保消息输入框固定在底部
    - 优化消息列表滚动区域
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. 优化消息输入组件






  - [x] 10.1 更新 src/components/MessageInput.tsx

    - 添加工具栏（附件、表情、链接等按钮）
    - 使用主题色发送按钮
    - 支持拖拽上传文件
    - 优化视觉设计
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6_

- [x] 11. 优化整体视觉设计





  - [x] 11.1 更新 src/design/tokens.ts


    - 添加品牌主题色（绿色系）
    - 添加模型标签颜色映射
    - 优化色彩层次
    - _Requirements: 7.1, 7.4, 7.6_


  - [x] 11.2 更新 src/design/variables.css

    - 添加新的 CSS 变量
    - 优化深色/浅色主题色彩
    - _Requirements: 7.1, 7.2_


  - [x] 11.3 更新消息气泡样式

    - 用户消息使用主题色背景
    - AI 消息使用柔和中性色背景
    - 添加适当的圆角和阴影
    - _Requirements: 7.7, 8.3_

- [x] 12. 更新 App.tsx 集成新组件






  - [x] 12.1 更新 src/App.tsx

    - 移除旧的设置面板模态窗口
    - 集成新的侧边栏设置
    - 确保布局正确
    - _Requirements: 4.1, 5.1, 6.1_

- [x] 13. Final Checkpoint - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

