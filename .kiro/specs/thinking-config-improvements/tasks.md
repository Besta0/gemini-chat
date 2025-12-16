# 实现计划

- [x] 1. 更新类型定义





  - [x] 1.1 扩展 ModelCapabilities 接口，添加 thinkingConfigType、thinkingBudgetConfig、supportsThoughtSummary 字段


    - 修改 `src/types/models.ts`
    - 添加 ThinkingConfigType 类型和 ThinkingBudgetConfig 接口
    - _Requirements: 2.1, 3.1, 5.1_
  - [x] 1.2 扩展 ModelAdvancedConfig 接口，添加 thinkingBudget 和 includeThoughts 字段

    - 修改 `src/types/models.ts`
    - _Requirements: 3.4, 4.2_
  - [x] 1.3 更新 MODEL_CAPABILITIES 常量，配置各模型的思考能力

    - 配置 gemini-3-pro-preview: thinkingConfigType='level', supportsThoughtSummary=true
    - 配置 gemini-2.5-pro: thinkingConfigType='budget', min=128, max=32768, default=-1, canDisable=false
    - 配置 gemini-2.5-flash: thinkingConfigType='budget', min=0, max=24576, default=-1, canDisable=true
    - 配置 gemini-2.5-flash-lite: thinkingConfigType='budget', min=0, max=24576, default=0, canDisable=true
    - _Requirements: 3.1, 3.2, 3.3, 5.4_
  - [ ]* 1.4 编写属性测试：思考配置类型正确性
    - **Property 1: 思考配置类型正确性**
    - **Validates: Requirements 2.1, 2.2**
  - [ ]* 1.5 编写属性测试：思考预算配置正确性
    - **Property 2: 思考预算配置正确性**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 2. 更新 Gemini 类型和服务





  - [x] 2.1 扩展 ThinkingConfig 接口，支持 thinkingBudget 和 includeThoughts


    - 修改 `src/types/gemini.ts`
    - 添加 ThoughtPart 接口
    - _Requirements: 3.8, 4.2_
  - [x] 2.2 更新 buildThinkingConfig 函数，根据模型类型构建正确的思考配置


    - 修改 `src/services/gemini.ts`
    - gemini-3-pro-preview 使用 thinkingLevel
    - gemini-2.5 系列使用 thinkingBudget
    - _Requirements: 3.8_
  - [x] 2.3 实现 extractThoughtSummary 函数，解析响应中的思维链内容


    - 修改 `src/services/gemini.ts`
    - 遍历 response.parts，检查 thought 布尔值
    - _Requirements: 4.3_
  - [x] 2.4 更新 buildRequestBody 函数，支持 includeThoughts 参数


    - 修改 `src/services/gemini.ts`
    - _Requirements: 4.2_
  - [ ]* 2.5 编写属性测试：API 请求思考参数正确性
    - **Property 3: API 请求思考参数正确性**
    - **Validates: Requirements 3.8**
  - [ ]* 2.6 编写属性测试：includeThoughts 参数正确性
    - **Property 4: includeThoughts 参数正确性**
    - **Validates: Requirements 4.2, 4.4**
  - [ ]* 2.7 编写属性测试：思维链响应解析正确性
    - **Property 5: 思维链响应解析正确性**
    - **Validates: Requirements 4.3**

- [x] 3. Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 移除消息输入组件中的表情和链接按钮





  - [x] 4.1 移除 MessageInput 组件中的表情按钮和表情选择器


    - 修改 `src/components/MessageInput.tsx`
    - 删除 showEmojiPicker 状态和相关逻辑
    - 删除 EmojiIcon 组件和 commonEmojis 数组
    - _Requirements: 1.1_
  - [x] 4.2 移除 MessageInput 组件中的链接插入按钮

    - 修改 `src/components/MessageInput.tsx`
    - 删除 handleInsertLink 函数和 LinkIcon 组件
    - _Requirements: 1.2_

- [x] 5. 创建思考预算滑块组件






  - [x] 5.1 创建 ThinkingBudgetSlider 组件

    - 创建 `src/components/ModelParams/ThinkingBudgetSlider.tsx`
    - 实现滑块 UI，显示当前值（-1 显示"动态"，0 显示"关闭"）
    - 添加"动态"和"关闭"快捷按钮
    - 根据 canDisable 配置决定是否显示"关闭"按钮
    - _Requirements: 3.7, 3.9_
  - [x] 5.2 导出 ThinkingBudgetSlider 组件


    - 更新 `src/components/ModelParams/index.ts`
    - _Requirements: 3.1_

- [x] 6. 创建思维链卡片组件






  - [x] 6.1 创建 ThoughtSummaryCard 组件

    - 创建 `src/components/ChatArea/ThoughtSummaryCard.tsx`
    - 实现可折叠的 UI，显示"思考过程"标题
    - 使用不同的背景色和边框样式
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.2 导出 ThoughtSummaryCard 组件

    - 更新 `src/components/ChatArea/index.ts`
    - _Requirements: 6.1_

- [x] 7. 更新内联配置面板





  - [x] 7.1 根据模型类型显示思考等级选择器或思考预算滑块


    - 修改 `src/components/ChatArea/InlineConfigPanel.tsx`
    - 获取当前模型的 thinkingConfigType
    - 'level' 类型显示 ThinkingLevelSelector
    - 'budget' 类型显示 ThinkingBudgetSlider
    - 'none' 类型不显示思考配置
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 7.2 添加思维链显示开关

    - 修改 `src/components/ChatArea/InlineConfigPanel.tsx`
    - 根据模型的 supportsThoughtSummary 能力决定是否显示
    - _Requirements: 4.1, 5.2, 5.3_
  - [x] 7.3 设置 gemini-3-pro-preview 的默认思考等级为 "high"


    - 修改相关配置逻辑
    - _Requirements: 2.3_
  - [ ]* 7.4 编写属性测试：思维链能力显示正确性
    - **Property 6: 思维链能力显示正确性**
    - **Validates: Requirements 5.2, 5.3**

- [x] 8. 更新消息列表显示思维链




  - [x] 8.1 扩展 Message 类型，添加 thoughtSummary 字段

    - 修改 `src/types/models.ts`
    - _Requirements: 4.3_
  - [x] 8.2 更新消息发送逻辑，解析并保存思维链内容


    - 修改 `src/stores/chatWindow.ts` 或相关发送逻辑
    - 调用 extractThoughtSummary 解析响应
    - _Requirements: 4.3_


  - [x] 8.3 在 MessageList 中集成 ThoughtSummaryCard 组件

    - 修改 `src/components/MessageList.tsx`
    - 当消息包含 thoughtSummary 时显示思维链卡片
    - _Requirements: 4.3, 6.1_

- [x] 9. Final Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.
