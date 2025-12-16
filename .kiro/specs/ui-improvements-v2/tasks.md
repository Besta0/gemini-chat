# 实现计划

- [x] 1. 更新设计系统 - 薄荷绿主题色





  - [x] 1.1 更新 `src/design/tokens.ts` 中的主色定义


    - 将 primaryColors 替换为 mintColors（薄荷绿色系）
    - 更新 brandColors 为薄荷绿
    - 确保色阶完整（50-900）
    - _Requirements: 1.1, 1.2_
  - [ ]* 1.2 编写属性测试：薄荷绿色系完整性
    - **Property 1: 薄荷绿色系完整性**
    - **Validates: Requirements 1.1, 1.2**
  - [x] 1.3 更新 `src/design/variables.css` 中的 CSS 变量


    - 更新主色 CSS 变量为薄荷绿
    - 更新深色主题对应变量
    - _Requirements: 1.3, 1.4, 1.5_
  - [x] 1.4 更新 `tailwind.config.js` 中的主色配置


    - 将 primary 颜色映射到薄荷绿
    - _Requirements: 1.3, 1.4, 1.5_

- [x] 2. 创建毛玻璃设置模态框





  - [x] 2.1 创建 `src/components/Settings/SettingsModal.tsx`


    - 实现毛玻璃效果（backdrop-filter: blur）
    - 实现模态框打开/关闭动画
    - 支持点击外部关闭
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 2.2 更新 `src/components/Layout.tsx` 集成设置模态框


    - 添加设置模态框状态管理
    - 修复设置按钮点击事件
    - 确保点击设置按钮能正确打开模态框
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 2.3 编写属性测试：设置面板切换一致性
    - **Property 2: 设置面板切换一致性**
    - **Validates: Requirements 3.4**

- [x] 3. Checkpoint - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 4. 更新术语和侧边栏





  - [x] 4.1 更新 `src/components/Sidebar/index.tsx` 术语


    - "新建对话" → "新建程序"
    - "搜索对话..." → "搜索程序..."
    - "X 个对话" → "X 个程序"
    - 更新空状态提示文字
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 4.2 创建模型标签组件 `src/components/Sidebar/ModelBadge.tsx`


    - 实现 getShortModelName 函数
    - 实现 ModelBadge 组件
    - 使用不同颜色区分模型系列
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]* 4.3 编写属性测试：模型标签颜色区分
    - **Property 3: 模型标签颜色区分**
    - **Validates: Requirements 5.2**
  - [ ]* 4.4 编写属性测试：模型名称格式化
    - **Property 4: 模型名称格式化**
    - **Validates: Requirements 5.3**
  - [x] 4.5 更新 `src/components/Sidebar/ChatWindowCard.tsx`


    - 集成 ModelBadge 组件
    - 在卡片右侧显示模型标签
    - _Requirements: 5.1, 5.4_

- [x] 5. 简化聊天区域布局





  - [x] 5.1 重构 `src/components/ChatArea/ChatHeader.tsx`


    - 移除模型选择下拉菜单
    - 移除配置状态标签
    - 仅保留标题和设置按钮
    - 设置按钮点击打开毛玻璃配置面板
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.2 创建聊天配置面板 `src/components/ChatArea/ChatConfigPanel.tsx`

    - 毛玻璃效果的配置面板
    - 包含模型选择、参数调整
    - 包含思考程度选择器（条件显示）
    - _Requirements: 6.4, 6.5_
  - [ ]* 5.3 编写属性测试：思考程度选择器条件显示
    - **Property 5: 思考程度选择器条件显示**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
  - [x] 5.4 更新 `src/components/ChatArea/ChatArea.tsx`


    - 移除 ModelParamsBar 组件
    - 集成新的 ChatConfigPanel
    - _Requirements: 7.5_

- [x] 6. 优化输入区域布局






  - [x] 6.1 重构 `src/components/MessageInput.tsx`

    - 将工具栏移到输入框下方
    - 减少底部空白
    - 工具栏与输入框紧密排列
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7. Checkpoint - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 8. 添加 Gemini 图标和流式开关





  - [x] 8.1 创建 Gemini 图标组件


    - 在 `src/components/ChatArea/ChatArea.tsx` 中添加 GeminiIcon
    - 使用 SVG 格式的 Gemini 星形图标
    - 更新空状态区域使用新图标
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 8.2 更新 `src/stores/settings.ts` 添加流式设置


    - 添加 streamingEnabled 状态
    - 添加 setStreamingEnabled 方法
    - 实现持久化存储
    - 默认值为 true
    - _Requirements: 10.5, 10.6_
  - [ ]* 8.3 编写属性测试：流式设置持久化
    - **Property 6: 流式设置持久化**
    - **Validates: Requirements 10.5**

  - [x] 8.4 更新设置面板添加流式开关

    - 在 SettingsModal 或 SidebarSettings 中添加开关
    - 清晰标注流式/非流式的含义
    - _Requirements: 10.1, 10.2_
  - [x] 8.5 更新消息发送逻辑使用流式设置


    - 在 `src/stores/chatWindow.ts` 中读取流式设置
    - 根据设置选择流式或非流式 API 调用
    - _Requirements: 10.3, 10.4_

- [x] 9. Final Checkpoint - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

