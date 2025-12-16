/**
 * 聊天窗口 Store 属性测试
 * 使用 fast-check 进行属性测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { useChatWindowStore } from './chatWindow';
import type { ChatWindowConfig } from '../types/chatWindow';
import { DEFAULT_CHAT_WINDOW_CONFIG } from '../types/chatWindow';
import type { Message } from '../types/models';
import { 
  getChatWindow, 
  clearAllData
} from '../services/storage';

// ============ 生成器 ============

/**
 * 生成有效的模型 ID
 */
const modelIdArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_.'.split('')),
  { minLength: 1, maxLength: 50 }
);

/**
 * 生成有效的生成配置（部分配置）
 * 使用 requiredKeys: [] 确保不存在的字段不会出现在对象中
 * 这样展开合并时不会用 undefined 覆盖原有值
 */
const generationConfigArb = fc.record(
  {
    temperature: fc.double({ min: 0, max: 2, noNaN: true }),
    topP: fc.double({ min: 0, max: 1, noNaN: true }),
    topK: fc.integer({ min: 1, max: 100 }),
    maxOutputTokens: fc.integer({ min: 1, max: 100000 }),
  },
  { requiredKeys: [] } // 所有字段都是可选的，不存在的字段不会出现在对象中
);

/**
 * 生成有效的聊天窗口配置（部分配置）
 * 注意：使用 fc.record 的 requiredKeys 选项来生成真正的部分配置
 * 而不是生成包含 undefined 值的完整对象
 */
const chatWindowConfigArb: fc.Arbitrary<Partial<ChatWindowConfig>> = fc.record(
  {
    model: modelIdArb,
    generationConfig: generationConfigArb,
    systemInstruction: fc.string({ maxLength: 500 }),
  },
  { requiredKeys: [] } // 所有字段都是可选的，不存在的字段不会出现在对象中
);

/**
 * 生成有效的消息内容
 */
const messageContentArb = fc.string({ minLength: 1, maxLength: 200 });

/**
 * 生成消息列表
 */
const messageListArb = fc.array(
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    role: fc.constantFrom('user', 'model') as fc.Arbitrary<'user' | 'model'>,
    content: messageContentArb,
    timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
  }),
  { minLength: 0, maxLength: 10 }
);

// ============ 测试辅助函数 ============

/**
 * 重置 store 状态
 */
function resetStore() {
  useChatWindowStore.setState({
    windows: [],
    activeWindowId: null,
    isLoading: false,
    isSending: false,
    error: null,
    streamingText: '',
    initialized: false,
  });
}

// ============ 属性测试 ============

describe('聊天窗口 Store 属性测试', () => {
  beforeEach(() => {
    resetStore();
  });

  /**
   * **Feature: ui-redesign, Property 2: 新窗口继承默认配置**
   * 
   * 对于任意全局默认配置，创建新聊天窗口后，新窗口的配置应与全局默认配置一致
   * 
   * **Validates: Requirements 4.4**
   */
  it('Property 2: 新窗口继承默认配置 - 不传入配置时使用默认配置', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        resetStore();
        const store = useChatWindowStore.getState();
        
        // 创建新窗口，不传入任何配置
        const newWindow = store.createWindow();
        
        // 验证：新窗口的配置应与默认配置一致
        expect(newWindow.config.model).toBe(DEFAULT_CHAT_WINDOW_CONFIG.model);
        expect(newWindow.config.generationConfig.temperature).toBe(
          DEFAULT_CHAT_WINDOW_CONFIG.generationConfig.temperature
        );
        expect(newWindow.config.generationConfig.topP).toBe(
          DEFAULT_CHAT_WINDOW_CONFIG.generationConfig.topP
        );
        expect(newWindow.config.generationConfig.topK).toBe(
          DEFAULT_CHAT_WINDOW_CONFIG.generationConfig.topK
        );
        expect(newWindow.config.systemInstruction).toBe(
          DEFAULT_CHAT_WINDOW_CONFIG.systemInstruction
        );
      }),
      { numRuns: 5 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 2: 新窗口继承默认配置**
   * 
   * 对于任意传入的部分配置，创建新窗口后，未指定的字段应使用传入值，其他使用默认值
   * 
   * **Validates: Requirements 4.4**
   */
  it('Property 2: 新窗口继承默认配置 - 部分配置时未指定字段使用默认值', () => {
    fc.assert(
      fc.property(chatWindowConfigArb, (partialConfig) => {
        resetStore();
        const store = useChatWindowStore.getState();
        
        // 创建新窗口，传入部分配置
        const newWindow = store.createWindow(partialConfig);
        
        // 验证：指定的字段使用传入值，未指定的使用默认值
        if (partialConfig.model !== undefined) {
          expect(newWindow.config.model).toBe(partialConfig.model);
        } else {
          expect(newWindow.config.model).toBe(DEFAULT_CHAT_WINDOW_CONFIG.model);
        }
        
        if (partialConfig.systemInstruction !== undefined) {
          expect(newWindow.config.systemInstruction).toBe(partialConfig.systemInstruction);
        } else {
          expect(newWindow.config.systemInstruction).toBe(
            DEFAULT_CHAT_WINDOW_CONFIG.systemInstruction
          );
        }
      }),
      { numRuns: 5 }
    );
  });
});

describe('聊天窗口配置持久化属性测试', () => {
  beforeEach(async () => {
    resetStore();
    await clearAllData();
  });

  afterEach(async () => {
    await clearAllData();
  });

  /**
   * **Feature: ui-redesign, Property 3: 聊天窗口配置持久化**
   * 
   * 对于任意聊天窗口配置修改，保存后重新加载，配置应与修改后的值一致
   * 
   * **Validates: Requirements 4.6**
   */
  it('Property 3: 聊天窗口配置持久化 - 保存后重新加载配置一致', async () => {
    await fc.assert(
      fc.asyncProperty(
        chatWindowConfigArb,
        async (configUpdate) => {
          resetStore();
          await clearAllData();
          
          const store = useChatWindowStore.getState();
          
          // 创建新窗口
          const newWindow = store.createWindow();
          const windowId = newWindow.id;
          
          // 等待异步保存完成
          await new Promise(resolve => setTimeout(resolve, 20));
          
          // 更新窗口配置
          await store.updateWindowConfig(windowId, configUpdate);
          
          // 等待异步保存完成
          await new Promise(resolve => setTimeout(resolve, 20));
          
          // 从存储中重新加载
          const loadedWindow = await getChatWindow(windowId);
          
          // 验证：加载的配置应与更新后的配置一致
          expect(loadedWindow).not.toBeNull();
          
          if (loadedWindow) {
            // 验证 model
            if (configUpdate.model !== undefined) {
              expect(loadedWindow.config.model).toBe(configUpdate.model);
            } else {
              expect(loadedWindow.config.model).toBe(DEFAULT_CHAT_WINDOW_CONFIG.model);
            }
            
            // 验证 systemInstruction
            if (configUpdate.systemInstruction !== undefined) {
              expect(loadedWindow.config.systemInstruction).toBe(configUpdate.systemInstruction);
            } else {
              expect(loadedWindow.config.systemInstruction).toBe(
                DEFAULT_CHAT_WINDOW_CONFIG.systemInstruction
              );
            }
            
            // 验证 generationConfig
            if (configUpdate.generationConfig !== undefined) {
              // 只验证已定义的字段
              if (configUpdate.generationConfig.temperature !== undefined) {
                expect(loadedWindow.config.generationConfig.temperature).toBe(
                  configUpdate.generationConfig.temperature
                );
              }
              if (configUpdate.generationConfig.topP !== undefined) {
                expect(loadedWindow.config.generationConfig.topP).toBe(
                  configUpdate.generationConfig.topP
                );
              }
              if (configUpdate.generationConfig.topK !== undefined) {
                expect(loadedWindow.config.generationConfig.topK).toBe(
                  configUpdate.generationConfig.topK
                );
              }
              if (configUpdate.generationConfig.maxOutputTokens !== undefined) {
                expect(loadedWindow.config.generationConfig.maxOutputTokens).toBe(
                  configUpdate.generationConfig.maxOutputTokens
                );
              }
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);

  /**
   * **Feature: ui-redesign, Property 3: 聊天窗口配置持久化**
   * 
   * 对于任意聊天窗口，直接保存到存储后读取，数据应完全一致（round-trip）
   * 
   * **Validates: Requirements 4.6**
   */
  it('Property 3: 聊天窗口配置持久化 - 存储 round-trip 一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        chatWindowConfigArb,
        async (config) => {
          await clearAllData();
          
          const store = useChatWindowStore.getState();
          
          // 创建带有指定配置的窗口
          const newWindow = store.createWindow(config);
          
          // 等待异步保存完成
          await new Promise(resolve => setTimeout(resolve, 20));
          
          // 从存储中读取
          const loadedWindow = await getChatWindow(newWindow.id);
          
          // 验证：读取的窗口应存在
          expect(loadedWindow).not.toBeNull();
          
          if (loadedWindow) {
            // 验证基本字段
            expect(loadedWindow.id).toBe(newWindow.id);
            expect(loadedWindow.title).toBe(newWindow.title);
            
            // 验证配置字段
            expect(loadedWindow.config.model).toBe(newWindow.config.model);
            expect(loadedWindow.config.systemInstruction).toBe(newWindow.config.systemInstruction);
            expect(loadedWindow.config.generationConfig.temperature).toBe(
              newWindow.config.generationConfig.temperature
            );
            expect(loadedWindow.config.generationConfig.topP).toBe(
              newWindow.config.generationConfig.topP
            );
            expect(loadedWindow.config.generationConfig.topK).toBe(
              newWindow.config.generationConfig.topK
            );
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);
});

describe('子话题继承父窗口配置属性测试', () => {
  beforeEach(() => {
    resetStore();
  });

  /**
   * **Feature: ui-redesign, Property 5: 子话题继承父窗口配置**
   * 
   * 对于任意聊天窗口，创建新子话题后，子话题使用的配置应与父窗口配置一致
   * 
   * **Validates: Requirements 5.2**
   */
  it('Property 5: 子话题继承父窗口配置 - 新子话题使用父窗口配置', () => {
    fc.assert(
      fc.property(
        chatWindowConfigArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (windowConfig, subTopicTitle) => {
          resetStore();
          
          const store = useChatWindowStore.getState();
          
          // 创建带有指定配置的聊天窗口
          const chatWindow = store.createWindow(windowConfig);
          const windowId = chatWindow.id;
          
          // 创建新子话题
          const newSubTopic = store.createSubTopic(windowId, subTopicTitle);
          
          // 验证：子话题创建成功
          expect(newSubTopic).not.toBeNull();
          
          if (newSubTopic) {
            // 获取更新后的窗口状态
            const currentState = useChatWindowStore.getState();
            const currentWindow = currentState.windows.find(w => w.id === windowId);
            
            expect(currentWindow).not.toBeUndefined();
            
            if (currentWindow) {
              // 验证：新子话题存在于窗口的子话题列表中
              const subTopicInWindow = currentWindow.subTopics.find(st => st.id === newSubTopic.id);
              expect(subTopicInWindow).not.toBeUndefined();
              
              // 验证：子话题使用的配置与父窗口配置一致
              // 由于子话题不存储自己的配置，而是共享父窗口配置
              // 我们验证父窗口的配置在创建子话题后保持不变
              
              // 验证 model
              if (windowConfig.model !== undefined) {
                expect(currentWindow.config.model).toBe(windowConfig.model);
              } else {
                expect(currentWindow.config.model).toBe(DEFAULT_CHAT_WINDOW_CONFIG.model);
              }
              
              // 验证 systemInstruction
              if (windowConfig.systemInstruction !== undefined) {
                expect(currentWindow.config.systemInstruction).toBe(windowConfig.systemInstruction);
              } else {
                expect(currentWindow.config.systemInstruction).toBe(
                  DEFAULT_CHAT_WINDOW_CONFIG.systemInstruction
                );
              }
              
              // 验证 generationConfig
              if (windowConfig.generationConfig !== undefined) {
                if (windowConfig.generationConfig.temperature !== undefined) {
                  expect(currentWindow.config.generationConfig.temperature).toBe(
                    windowConfig.generationConfig.temperature
                  );
                }
                if (windowConfig.generationConfig.topP !== undefined) {
                  expect(currentWindow.config.generationConfig.topP).toBe(
                    windowConfig.generationConfig.topP
                  );
                }
                if (windowConfig.generationConfig.topK !== undefined) {
                  expect(currentWindow.config.generationConfig.topK).toBe(
                    windowConfig.generationConfig.topK
                  );
                }
              }
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 5: 子话题继承父窗口配置**
   * 
   * 对于任意聊天窗口，创建多个子话题后，所有子话题都应使用相同的父窗口配置
   * 
   * **Validates: Requirements 5.2**
   */
  it('Property 5: 子话题继承父窗口配置 - 多个子话题共享同一父窗口配置', () => {
    fc.assert(
      fc.property(
        chatWindowConfigArb,
        fc.integer({ min: 1, max: 5 }),
        (windowConfig, numSubTopics) => {
          resetStore();
          
          const store = useChatWindowStore.getState();
          
          // 创建带有指定配置的聊天窗口
          const chatWindow = store.createWindow(windowConfig);
          const windowId = chatWindow.id;
          
          // 创建多个子话题
          const createdSubTopicIds: string[] = [chatWindow.subTopics[0]?.id || ''];
          for (let i = 0; i < numSubTopics; i++) {
            const newSubTopic = store.createSubTopic(windowId, `子话题 ${i + 1}`);
            if (newSubTopic) {
              createdSubTopicIds.push(newSubTopic.id);
            }
          }
          
          // 获取更新后的窗口状态
          const currentState = useChatWindowStore.getState();
          const currentWindow = currentState.windows.find(w => w.id === windowId);
          
          expect(currentWindow).not.toBeUndefined();
          
          if (currentWindow) {
            // 验证：所有子话题都存在
            expect(currentWindow.subTopics.length).toBe(numSubTopics + 1); // +1 是默认子话题
            
            // 验证：父窗口配置保持一致，所有子话题共享此配置
            // 由于子话题不存储自己的配置，我们验证父窗口配置正确
            if (windowConfig.model !== undefined) {
              expect(currentWindow.config.model).toBe(windowConfig.model);
            }
            
            if (windowConfig.systemInstruction !== undefined) {
              expect(currentWindow.config.systemInstruction).toBe(windowConfig.systemInstruction);
            }
            
            // 验证：每个子话题都可以通过父窗口访问到相同的配置
            for (const subTopic of currentWindow.subTopics) {
              // 子话题本身不存储配置，但可以通过父窗口获取
              // 这里验证子话题结构正确，且父窗口配置可访问
              expect(subTopic.id).toBeDefined();
              expect(subTopic.title).toBeDefined();
              expect(subTopic.messages).toBeDefined();
              
              // 父窗口配置对所有子话题都是相同的
              expect(currentWindow.config).toBeDefined();
              expect(currentWindow.config.model).toBeDefined();
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * **Feature: ui-redesign, Property 5: 子话题继承父窗口配置**
   * 
   * 对于任意聊天窗口，修改父窗口配置后，所有子话题使用的配置应同步更新
   * 
   * **Validates: Requirements 5.2**
   */
  it('Property 5: 子话题继承父窗口配置 - 父窗口配置更新后子话题同步', async () => {
    await fc.assert(
      fc.asyncProperty(
        chatWindowConfigArb,
        chatWindowConfigArb,
        async (initialConfig, updatedConfig) => {
          resetStore();
          
          const store = useChatWindowStore.getState();
          
          // 创建带有初始配置的聊天窗口
          const chatWindow = store.createWindow(initialConfig);
          const windowId = chatWindow.id;
          
          // 创建几个子话题
          store.createSubTopic(windowId, '子话题 1');
          store.createSubTopic(windowId, '子话题 2');
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 更新父窗口配置
          await store.updateWindowConfig(windowId, updatedConfig);
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 获取更新后的窗口状态
          const currentState = useChatWindowStore.getState();
          const currentWindow = currentState.windows.find(w => w.id === windowId);
          
          expect(currentWindow).not.toBeUndefined();
          
          if (currentWindow) {
            // 验证：父窗口配置已更新
            if (updatedConfig.model !== undefined) {
              expect(currentWindow.config.model).toBe(updatedConfig.model);
            }
            
            if (updatedConfig.systemInstruction !== undefined) {
              expect(currentWindow.config.systemInstruction).toBe(updatedConfig.systemInstruction);
            }
            
            // 验证：所有子话题都能访问到更新后的父窗口配置
            // 由于子话题共享父窗口配置，配置更新自动对所有子话题生效
            for (const subTopic of currentWindow.subTopics) {
              // 子话题通过父窗口访问配置
              // 这里验证父窗口配置已正确更新
              expect(currentWindow.config).toBeDefined();
              
              // 子话题本身的结构保持不变
              expect(subTopic.id).toBeDefined();
              expect(subTopic.messages).toBeDefined();
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);
});

describe('配置修改实时生效属性测试', () => {
  beforeEach(() => {
    resetStore();
  });

  /**
   * **Feature: ui-redesign, Property 7: 配置修改实时生效**
   * 
   * 对于任意聊天窗口配置修改，修改后发送的消息应使用新配置
   * 
   * **Validates: Requirements 6.6**
   */
  it('Property 7: 配置修改实时生效 - 修改配置后窗口状态立即反映新配置', async () => {
    await fc.assert(
      fc.asyncProperty(
        chatWindowConfigArb,
        chatWindowConfigArb,
        async (initialConfig, updatedConfig) => {
          resetStore();
          
          const store = useChatWindowStore.getState();
          
          // 创建带有初始配置的聊天窗口
          const chatWindow = store.createWindow(initialConfig);
          const windowId = chatWindow.id;
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 验证初始配置已设置
          let currentState = useChatWindowStore.getState();
          let currentWindow = currentState.windows.find(w => w.id === windowId);
          expect(currentWindow).not.toBeUndefined();
          
          if (currentWindow) {
            // 验证初始配置
            if (initialConfig.model !== undefined) {
              expect(currentWindow.config.model).toBe(initialConfig.model);
            }
          }
          
          // 修改窗口配置
          await store.updateWindowConfig(windowId, updatedConfig);
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 验证配置已立即更新
          currentState = useChatWindowStore.getState();
          currentWindow = currentState.windows.find(w => w.id === windowId);
          expect(currentWindow).not.toBeUndefined();
          
          if (currentWindow) {
            // 验证更新后的配置
            if (updatedConfig.model !== undefined) {
              expect(currentWindow.config.model).toBe(updatedConfig.model);
            } else if (initialConfig.model !== undefined) {
              // 如果更新配置中没有 model，应保持初始值
              expect(currentWindow.config.model).toBe(initialConfig.model);
            }
            
            if (updatedConfig.systemInstruction !== undefined) {
              expect(currentWindow.config.systemInstruction).toBe(updatedConfig.systemInstruction);
            } else if (initialConfig.systemInstruction !== undefined) {
              expect(currentWindow.config.systemInstruction).toBe(initialConfig.systemInstruction);
            }
            
            // 验证 generationConfig
            if (updatedConfig.generationConfig !== undefined) {
              if (updatedConfig.generationConfig.temperature !== undefined) {
                expect(currentWindow.config.generationConfig.temperature).toBe(
                  updatedConfig.generationConfig.temperature
                );
              }
              if (updatedConfig.generationConfig.topP !== undefined) {
                expect(currentWindow.config.generationConfig.topP).toBe(
                  updatedConfig.generationConfig.topP
                );
              }
              if (updatedConfig.generationConfig.topK !== undefined) {
                expect(currentWindow.config.generationConfig.topK).toBe(
                  updatedConfig.generationConfig.topK
                );
              }
              if (updatedConfig.generationConfig.maxOutputTokens !== undefined) {
                expect(currentWindow.config.generationConfig.maxOutputTokens).toBe(
                  updatedConfig.generationConfig.maxOutputTokens
                );
              }
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);

  /**
   * **Feature: ui-redesign, Property 7: 配置修改实时生效**
   * 
   * 对于任意聊天窗口，多次连续修改配置后，最终配置应反映最后一次修改
   * 
   * **Validates: Requirements 6.6**
   */
  it('Property 7: 配置修改实时生效 - 多次连续修改配置后反映最终状态', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(chatWindowConfigArb, { minLength: 1, maxLength: 5 }),
        async (configUpdates) => {
          resetStore();
          
          const store = useChatWindowStore.getState();
          
          // 创建聊天窗口
          const chatWindow = store.createWindow();
          const windowId = chatWindow.id;
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 连续应用多次配置更新
          for (const configUpdate of configUpdates) {
            await store.updateWindowConfig(windowId, configUpdate);
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          
          // 等待所有异步操作完成
          await new Promise(resolve => setTimeout(resolve, 20));
          
          // 获取最终状态
          const finalState = useChatWindowStore.getState();
          const finalWindow = finalState.windows.find(w => w.id === windowId);
          expect(finalWindow).not.toBeUndefined();
          
          if (finalWindow) {
            // 计算预期的最终配置（合并所有更新）
            let expectedModel = DEFAULT_CHAT_WINDOW_CONFIG.model;
            let expectedSystemInstruction = DEFAULT_CHAT_WINDOW_CONFIG.systemInstruction;
            let expectedTemperature = DEFAULT_CHAT_WINDOW_CONFIG.generationConfig.temperature;
            let expectedTopP = DEFAULT_CHAT_WINDOW_CONFIG.generationConfig.topP;
            let expectedTopK = DEFAULT_CHAT_WINDOW_CONFIG.generationConfig.topK;
            
            for (const update of configUpdates) {
              if (update.model !== undefined) {
                expectedModel = update.model;
              }
              if (update.systemInstruction !== undefined) {
                expectedSystemInstruction = update.systemInstruction;
              }
              if (update.generationConfig !== undefined) {
                if (update.generationConfig.temperature !== undefined) {
                  expectedTemperature = update.generationConfig.temperature;
                }
                if (update.generationConfig.topP !== undefined) {
                  expectedTopP = update.generationConfig.topP;
                }
                if (update.generationConfig.topK !== undefined) {
                  expectedTopK = update.generationConfig.topK;
                }
              }
            }
            
            // 验证最终配置
            expect(finalWindow.config.model).toBe(expectedModel);
            expect(finalWindow.config.systemInstruction).toBe(expectedSystemInstruction);
            expect(finalWindow.config.generationConfig.temperature).toBe(expectedTemperature);
            expect(finalWindow.config.generationConfig.topP).toBe(expectedTopP);
            expect(finalWindow.config.generationConfig.topK).toBe(expectedTopK);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);

  /**
   * **Feature: ui-redesign, Property 7: 配置修改实时生效**
   * 
   * 对于任意聊天窗口，修改配置后，getActiveWindow 返回的窗口应包含新配置
   * 
   * **Validates: Requirements 6.6**
   */
  it('Property 7: 配置修改实时生效 - getActiveWindow 返回更新后的配置', async () => {
    await fc.assert(
      fc.asyncProperty(
        chatWindowConfigArb,
        async (updatedConfig) => {
          resetStore();
          
          const store = useChatWindowStore.getState();
          
          // 创建并选择聊天窗口
          const chatWindow = store.createWindow();
          const windowId = chatWindow.id;
          store.selectWindow(windowId);
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 修改窗口配置
          await store.updateWindowConfig(windowId, updatedConfig);
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 通过 getActiveWindow 获取窗口
          const activeWindow = useChatWindowStore.getState().getActiveWindow();
          expect(activeWindow).not.toBeNull();
          
          if (activeWindow) {
            // 验证 getActiveWindow 返回的配置是更新后的
            if (updatedConfig.model !== undefined) {
              expect(activeWindow.config.model).toBe(updatedConfig.model);
            }
            
            if (updatedConfig.systemInstruction !== undefined) {
              expect(activeWindow.config.systemInstruction).toBe(updatedConfig.systemInstruction);
            }
            
            if (updatedConfig.generationConfig !== undefined) {
              if (updatedConfig.generationConfig.temperature !== undefined) {
                expect(activeWindow.config.generationConfig.temperature).toBe(
                  updatedConfig.generationConfig.temperature
                );
              }
              if (updatedConfig.generationConfig.topP !== undefined) {
                expect(activeWindow.config.generationConfig.topP).toBe(
                  updatedConfig.generationConfig.topP
                );
              }
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);
});

describe('子话题消息独立性属性测试', () => {
  beforeEach(() => {
    resetStore();
  });

  /**
   * **Feature: ui-redesign, Property 4: 子话题消息独立性**
   * 
   * 对于任意聊天窗口内的两个子话题 A 和 B，向子话题 A 发送消息不应影响子话题 B 的消息历史
   * 
   * **Validates: Requirements 5.1, 5.3**
   */
  it('Property 4: 子话题消息独立性 - 向一个子话题添加消息不影响其他子话题', async () => {
    await fc.assert(
      fc.asyncProperty(
        messageListArb,
        messageListArb,
        messageContentArb,
        async (messagesA, messagesB, newMessageContent) => {
          resetStore();
          
          const store = useChatWindowStore.getState();
          
          // 创建一个聊天窗口
          const chatWindow = store.createWindow();
          const windowId = chatWindow.id;
          
          // 获取默认子话题 A
          const subTopicA = chatWindow.subTopics[0];
          if (!subTopicA) {
            return; // 跳过无效情况
          }
          const subTopicAId = subTopicA.id;
          
          // 创建子话题 B
          const subTopicB = store.createSubTopic(windowId, '子话题 B');
          if (!subTopicB) {
            return; // 跳过无效情况
          }
          const subTopicBId = subTopicB.id;
          
          // 为子话题 A 设置初始消息
          await store.updateSubTopic(windowId, subTopicAId, { 
            messages: messagesA as Message[] 
          });
          
          // 为子话题 B 设置初始消息
          await store.updateSubTopic(windowId, subTopicBId, { 
            messages: messagesB as Message[] 
          });
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 记录子话题 B 的消息快照（深拷贝）
          const currentState = useChatWindowStore.getState();
          const currentWindow = currentState.windows.find(w => w.id === windowId);
          if (!currentWindow) {
            return; // 跳过无效情况
          }
          
          const subTopicBBefore = currentWindow.subTopics.find(st => st.id === subTopicBId);
          if (!subTopicBBefore) {
            return; // 跳过无效情况
          }
          const messagesBBeforeSnapshot = JSON.parse(JSON.stringify(subTopicBBefore.messages));
          
          // 向子话题 A 添加新消息
          const newMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: newMessageContent,
            timestamp: Date.now(),
          };
          
          const subTopicABefore = currentWindow.subTopics.find(st => st.id === subTopicAId);
          if (!subTopicABefore) {
            return; // 跳过无效情况
          }
          
          await store.updateSubTopic(windowId, subTopicAId, {
            messages: [...subTopicABefore.messages, newMessage],
          });
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 验证：子话题 B 的消息应保持不变
          const finalState = useChatWindowStore.getState();
          const finalWindow = finalState.windows.find(w => w.id === windowId);
          expect(finalWindow).not.toBeNull();
          
          if (finalWindow) {
            const subTopicBAfter = finalWindow.subTopics.find(st => st.id === subTopicBId);
            expect(subTopicBAfter).not.toBeUndefined();
            
            if (subTopicBAfter) {
              // 验证消息数量不变
              expect(subTopicBAfter.messages.length).toBe(messagesBBeforeSnapshot.length);
              
              // 验证每条消息内容不变
              for (let i = 0; i < messagesBBeforeSnapshot.length; i++) {
                expect(subTopicBAfter.messages[i]?.id).toBe(messagesBBeforeSnapshot[i]?.id);
                expect(subTopicBAfter.messages[i]?.content).toBe(messagesBBeforeSnapshot[i]?.content);
                expect(subTopicBAfter.messages[i]?.role).toBe(messagesBBeforeSnapshot[i]?.role);
              }
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);

  /**
   * **Feature: ui-redesign, Property 4: 子话题消息独立性**
   * 
   * 对于任意聊天窗口，删除一个子话题的消息不应影响其他子话题的消息
   * 
   * **Validates: Requirements 5.1, 5.3**
   */
  it('Property 4: 子话题消息独立性 - 清空一个子话题的消息不影响其他子话题', async () => {
    await fc.assert(
      fc.asyncProperty(
        messageListArb,
        messageListArb,
        async (messagesA, messagesB) => {
          resetStore();
          
          const store = useChatWindowStore.getState();
          
          // 创建一个聊天窗口
          const chatWindow = store.createWindow();
          const windowId = chatWindow.id;
          
          // 获取默认子话题 A
          const subTopicA = chatWindow.subTopics[0];
          if (!subTopicA) {
            return;
          }
          const subTopicAId = subTopicA.id;
          
          // 创建子话题 B
          const subTopicB = store.createSubTopic(windowId, '子话题 B');
          if (!subTopicB) {
            return;
          }
          const subTopicBId = subTopicB.id;
          
          // 为两个子话题设置初始消息
          await store.updateSubTopic(windowId, subTopicAId, { 
            messages: messagesA as Message[] 
          });
          await store.updateSubTopic(windowId, subTopicBId, { 
            messages: messagesB as Message[] 
          });
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 记录子话题 B 的消息快照
          const currentState = useChatWindowStore.getState();
          const currentWindow = currentState.windows.find(w => w.id === windowId);
          if (!currentWindow) {
            return;
          }
          
          const subTopicBBefore = currentWindow.subTopics.find(st => st.id === subTopicBId);
          if (!subTopicBBefore) {
            return;
          }
          const messagesBBeforeSnapshot = JSON.parse(JSON.stringify(subTopicBBefore.messages));
          
          // 清空子话题 A 的消息
          await store.updateSubTopic(windowId, subTopicAId, { messages: [] });
          
          // 等待异步操作完成
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // 验证：子话题 B 的消息应保持不变
          const finalState = useChatWindowStore.getState();
          const finalWindow = finalState.windows.find(w => w.id === windowId);
          expect(finalWindow).not.toBeNull();
          
          if (finalWindow) {
            const subTopicBAfter = finalWindow.subTopics.find(st => st.id === subTopicBId);
            expect(subTopicBAfter).not.toBeUndefined();
            
            if (subTopicBAfter) {
              // 验证消息数量不变
              expect(subTopicBAfter.messages.length).toBe(messagesBBeforeSnapshot.length);
              
              // 验证每条消息内容不变
              for (let i = 0; i < messagesBBeforeSnapshot.length; i++) {
                expect(subTopicBAfter.messages[i]?.id).toBe(messagesBBeforeSnapshot[i]?.id);
                expect(subTopicBAfter.messages[i]?.content).toBe(messagesBBeforeSnapshot[i]?.content);
              }
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 60000);
});
