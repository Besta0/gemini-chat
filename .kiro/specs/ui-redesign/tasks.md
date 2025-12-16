# 实现计划

- [x] 1. 建立设计系统基础





  - [x] 1.1 创建设计令牌文件 `src/design/tokens.ts`


    - 定义颜色系统（主色、中性色、语义色）
    - 定义间距系统（4px 基础单位）
    - 定义圆角、阴影、字体系统
    - 定义动画时长和缓动函数
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 更新 Tailwind 配置集成设计令牌

    - 扩展 tailwind.config.js 使用设计令牌
    - 添加自定义颜色、间距、圆角变量
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.3 创建 CSS 变量文件 `src/design/variables.css`


    - 定义浅色主题 CSS 变量
    - 定义深色主题 CSS 变量
    - 添加主题过渡动画
    - _Requirements: 1.6_

- [x] 2. 重构数据模型和类型定义





  - [x] 2.1 创建新的类型定义 `src/types/chatWindow.ts`


    - 定义 ChatWindowConfig 接口
    - 定义 SubTopic 接口
    - 定义 ChatWindow 接口
    - 定义 LegacyConversation 接口
    - _Requirements: 12.1, 12.2, 12.3_
  - [x] 2.2 编写属性测试：聊天窗口配置独立性


    - **Property 1: 聊天窗口配置独立性**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
  - [x] 2.3 创建数据迁移服务 `src/services/migration.ts`


    - 实现 migrateConversationToChatWindow 函数
    - 实现 performMigrationIfNeeded 函数
    - 实现版本检测逻辑
    - _Requirements: 12.4_
  - [x] 2.4 编写属性测试：数据迁移一致性


    - **Property 12: 数据迁移一致性**
    - **Validates: Requirements 12.4**

- [x] 3. 重构存储服务





  - [x] 3.1 更新存储服务 `src/services/storage.ts`


    - 添加 ChatWindow CRUD 操作
    - 添加 SubTopic CRUD 操作
    - 实现数据迁移触发逻辑
    - _Requirements: 12.5_
  - [x] 3.2 编写属性测试：存储 CRUD 操作一致性


    - **Property 13: 存储 CRUD 操作一致性**
    - **Validates: Requirements 12.5**

  - [x] 3.3 更新导入导出功能

    - 支持新数据格式导出
    - 支持新旧格式导入
    - _Requirements: 12.6_

  - [x] 3.4 编写属性测试：导入导出数据一致性

    - **Property 14: 导入导出数据一致性**
    - **Validates: Requirements 12.6**

- [x] 4. Checkpoint - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [-] 5. 创建聊天窗口状态管理





  - [x] 5.1 创建 chatWindowStore `src/stores/chatWindow.ts`


    - 实现窗口 CRUD 操作
    - 实现子话题 CRUD 操作
    - 实现配置更新操作
    - 实现消息发送操作
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3_


  - [x] 5.2 编写属性测试：新窗口继承默认配置





    - **Property 2: 新窗口继承默认配置**
    - **Validates: Requirements 4.4**
  - [x] 5.3 编写属性测试：聊天窗口配置持久化







    - **Property 3: 聊天窗口配置持久化**
    - **Validates: Requirements 4.6**
  - [x] 5.4 编写属性测试：子话题消息独立性










    - **Property 4: 子话题消息独立性**
    - **Validates: Requirements 5.1, 5.3**
  - [x] 5.5 编写属性测试：子话题继承父窗口配置












    - **Property 5: 子话题继承父窗口配置**
    - **Validates: Requirements 5.2**

  - [x] 5.6 编写属性测试：配置修改实时生效












    - **Property 7: 配置修改实时生效**
    - **Validates: Requirements 6.6**

- [x] 6. Checkpoint - 确保所有测试通过










  - 确保所有测试通过，如有问题请询问用户。

- [x] 7. 创建动画组件库





  - [x] 7.1 创建动画工具 `src/components/motion/index.ts`


    - 创建 AnimatedPresence 组件
    - 创建 AnimatedList 组件
    - 创建 useReducedMotion hook
    - _Requirements: 2.1, 2.2, 2.3, 2.6_
  - [x] 7.2 创建 Modal 组件 `src/components/motion/Modal.tsx`


    - 实现缩放+淡入/淡出动画
    - 支持多种尺寸配置
    - 支持 prefers-reduced-motion
    - _Requirements: 2.4, 2.5, 2.6_

- [-] 8. 重构设置面板





  - [x] 8.1 创建新的设置面板组件 `src/components/Settings/SettingsPanel.tsx`


    - 使用固定尺寸容器（800x600px）
    - 实现左侧固定导航栏（200px）
    - 实现右侧可滚动内容区
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 8.2 实现设置分类切换动画

    - 添加内容区域过渡动画
    - 保持面板尺寸不变
    - _Requirements: 3.2, 3.3_


  - [x] 8.3 编写属性测试：设置面板尺寸一致性



    - **Property 6: 设置面板尺寸一致性**
    - **Validates: Requirements 3.2**
  - [x] 8.4 迁移现有设置分类组件







    - 迁移 API 配置组件
    - 迁移模型选择组件
    - 迁移生成参数组件
    - 迁移系统指令组件
    - 迁移安全设置组件
    - 迁移数据管理组件
    - _Requirements: 3.5, 3.6_

- [x] 9. 重构侧边栏



  - [x] 9.1 创建聊天窗口卡片组件 `src/components/Sidebar/ChatWindowCard.tsx`


    - 显示标题、模型标签、更新时间
    - 实现悬停显示操作按钮
    - 支持子话题展开列表
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 9.2 创建搜索栏组件 `src/components/Sidebar/SearchBar.tsx`

    - 实现搜索输入框
    - 实现过滤逻辑
    - _Requirements: 7.6_

  - [x] 9.3 编写属性测试：侧边栏搜索过滤

    - **Property 8: 侧边栏搜索过滤**
    - **Validates: Requirements 7.6**

  - [x] 9.4 实现拖拽排序功能

    - 添加拖拽排序逻辑
    - 实现排序持久化
    - _Requirements: 7.5_


  - [x] 9.5 编写属性测试：侧边栏拖拽排序
    - **Property 9: 侧边栏拖拽排序**
    - **Validates: Requirements 7.5**

  - [x] 9.6 重构 Sidebar 主组件


    - 集成新的卡片组件
    - 集成搜索功能
    - 集成拖拽排序
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 10. Checkpoint - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 11. 重构聊天区域






  - [x] 11.1 创建子话题标签组件 `src/components/ChatArea/SubTopicTabs.tsx`

    - 显示子话题列表
    - 支持切换、创建、删除
    - 添加切换动画
    - _Requirements: 5.4, 5.5, 5.6_
  - [x] 11.2 创建内联配置面板 `src/components/ChatArea/InlineConfigPanel.tsx`


    - 显示当前模型名称
    - 实现展开/收起动画
    - 包含模型选择、参数调整、系统指令编辑
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 11.3 重构消息列表组件

    - 优化气泡样式（右对齐用户消息、左对齐 AI 消息）
    - 添加圆角和阴影
    - 优化时间戳显示
    - 添加打字指示器动画
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 11.4 重构消息输入组件

    - 优化输入框样式（圆角、阴影）
    - 实现焦点高亮动画
    - 实现自动高度调整
    - 优化发送按钮动画
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 11.5 编写属性测试：输入框高度自适应

    - **Property 10: 输入框高度自适应**
    - **Validates: Requirements 9.3**
  - [x] 11.6 创建 ChatArea 主组件 `src/components/ChatArea/ChatArea.tsx`


    - 集成子话题标签
    - 集成内联配置面板
    - 集成消息列表和输入
    - _Requirements: 4.1, 5.1, 6.1_

- [x] 12. 实现响应式布局






  - [x] 12.1 更新 Layout 组件响应式逻辑

    - 实现移动端侧边栏隐藏/汉堡菜单
    - 实现设置面板全屏模式
    - 优化触摸手势支持
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

  - [x] 12.2 优化移动端触摸目标

    - 确保所有可交互元素最小 44x44px
    - _Requirements: 10.5_

  - [x] 12.3 编写属性测试：触摸目标尺寸

    - **Property 11: 触摸目标尺寸**
    - **Validates: Requirements 10.5**

- [x] 13. 实现加载状态和骨架屏






  - [x] 13.1 创建骨架屏组件 `src/components/Skeleton/index.tsx`

    - 创建通用骨架屏组件
    - 创建对话列表骨架屏
    - 创建消息列表骨架屏
    - 添加闪烁动画
    - _Requirements: 11.2, 11.3, 11.4_

  - [x] 13.2 创建加载动画组件

    - 创建品牌加载动画
    - 实现加载完成淡入效果
    - _Requirements: 11.1, 11.5_

  - [x] 13.3 创建错误提示组件

    - 显示友好错误信息
    - 提供重试按钮
    - _Requirements: 11.6_

- [x] 14. 集成和更新 App 组件
  - [x] 14.1 更新 App.tsx 使用新组件
    - 替换旧的 Conversation store 为 ChatWindow store
    - 集成新的 Layout、Sidebar、ChatArea 组件
    - 集成新的 Settings 组件
    - _Requirements: 4.1, 5.1, 6.1_
  - [x] 14.2 实现应用初始化流程

    - 执行数据迁移检查
    - 加载聊天窗口数据
    - 显示加载动画
    - _Requirements: 11.1, 12.4_

- [x] 15. 清理和优化
  - [x] 15.1 删除旧的 Conversation 相关代码
    - 删除 src/stores/conversation.ts（保留备份）
    - 更新类型导出
    - _Requirements: 12.1_
  - [x] 15.2 优化 CSS 和样式

    - 移除未使用的样式
    - 统一使用设计令牌
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 16. Final Checkpoint - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。
