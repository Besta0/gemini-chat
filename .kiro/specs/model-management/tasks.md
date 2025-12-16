# 实现计划

- [x] 1. 扩展类型定义





  - [x] 1.1 在 src/types/models.ts 中添加新类型定义


    - 添加 ApiProvider、ThinkingLevel、MediaResolution 类型
    - 添加 ModelCapabilities、ModelAdvancedConfig 接口
    - 扩展 ModelConfig 接口（包含 isCustom、redirectTo、capabilities、advancedConfig、provider）
    - 添加 ModelManagerState 接口
    - _Requirements: 2.1, 3.1, 4.1_
  - [x] 1.2 编写属性测试：模型配置类型验证


    - **Property 3: 模型 CRUD 操作正确性**
    - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 2. 实现 Model Service 核心功能





  - [x] 2.1 创建 src/services/model.ts 并实现 API 提供商检测


    - 实现 detectApiProvider 函数，根据 URL 特征识别 Gemini 或 OpenAI
    - _Requirements: 1.2, 1.3_
  - [x] 2.2 编写属性测试：API 提供商检测


    - **Property 1: API 提供商检测一致性**
    - **Validates: Requirements 1.2, 1.3**
  - [x] 2.3 实现模型能力检测函数


    - 实现 detectModelCapabilities 函数
    - 创建 MODEL_CAPABILITIES 映射表
    - 根据模型 ID 前缀识别支持的能力
    - _Requirements: 4.1, 4.2, 4.5_
  - [x] 2.4 编写属性测试：模型能力检测


    - **Property 5: 模型能力检测正确性**
    - **Validates: Requirements 4.1, 4.2, 4.5**
  - [x] 2.5 实现模型列表获取功能


    - 实现 fetchGeminiModels 函数（使用 /models 端点）
    - 实现 fetchOpenAIModels 函数（使用 /v1/models 端点）
    - 实现 fetchModels 统一入口函数
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 2.6 实现模型合并逻辑


    - 实现 mergeModels 函数
    - 确保模型 ID 唯一性
    - 本地配置优先于远程配置
    - _Requirements: 1.4, 5.3_
  - [x] 2.7 编写属性测试：模型合并


    - **Property 2: 模型合并保持唯一性**
    - **Validates: Requirements 1.4, 5.3**

- [x] 3. 实现模型重定向功能





  - [x] 3.1 实现重定向参数解析


    - 实现 getEffectiveConfig 函数
    - 处理重定向链（防止循环）
    - 返回目标模型的参数配置
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 编写属性测试：重定向参数解析

    - **Property 4: 重定向参数解析正确性**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

- [x] 4. 扩展 Gemini Service 支持高级参数





  - [x] 4.1 扩展请求体构建函数


    - 修改 buildRequestBody 支持 thinkingConfig
    - 支持 mediaResolution 参数
    - _Requirements: 4.3, 4.4_
  - [x] 4.2 编写属性测试：高级参数请求构建


    - **Property 6: 高级参数请求构建正确性**
    - **Validates: Requirements 4.3, 4.4**

- [x] 5. Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. 实现持久化存储





  - [x] 6.1 扩展 storage service 支持模型配置存储


    - 添加 saveModelConfigs 函数
    - 添加 loadModelConfigs 函数
    - 添加 resetModelConfigs 函数
    - _Requirements: 2.5, 5.1, 5.2, 5.4_
  - [x] 6.2 编写属性测试：持久化往返一致性


    - **Property 7: 持久化往返一致性**
    - **Validates: Requirements 2.5, 5.1, 5.2**
  - [x] 6.3 编写属性测试：重置恢复默认值


    - **Property 8: 重置恢复默认值**
    - **Validates: Requirements 5.4**

- [x] 7. 创建 Model Store













  - [x] 7.1 创建 src/stores/model.ts


    - 实现模型列表状态管理
    - 实现 fetchModels action
    - 实现 addModel、updateModel、deleteModel actions
    - 实现 setRedirect、clearRedirect actions
    - 集成持久化存储

    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 3.1, 3.5_

  - [x] 7.2 编写 Model Store 单元测试


    - 测试所有 actions
    - 测试状态更新
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 8. 实现 UI 组件





  - [x] 8.1 创建模型列表组件


    - 显示所有可用模型
    - 支持搜索/筛选
    - 显示模型来源（预设/自定义/远程）
    - _Requirements: 1.4, 2.1_
  - [x] 8.2 创建模型编辑器组件


    - 模型基本信息编辑（ID、名称、描述）
    - 重定向目标选择
    - 高级参数配置（thinking_level、media_resolution）
    - _Requirements: 2.2, 2.3, 3.1, 4.1, 4.2_
  - [x] 8.3 集成到 Settings 组件


    - 添加"获取模型"按钮
    - 添加"添加自定义模型"按钮
    - 添加"重置模型"按钮
    - 集成模型列表和编辑器
    - _Requirements: 1.1, 2.1, 5.4_

- [x] 9. 集成和完善






  - [x] 9.1 更新 sendMessage 函数使用高级参数

    - 从 Model Store 获取当前模型的有效配置
    - 应用 thinkingConfig 和 mediaResolution
    - _Requirements: 4.3, 4.4_

  - [x] 9.2 处理模型切换时的参数同步

    - 切换模型时加载对应的高级参数配置
    - _Requirements: 3.2, 3.3_

- [x] 10. Final Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.
