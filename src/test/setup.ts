// 测试环境设置
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { configureLogger } from '../services/logger'

// 在测试环境中禁用日志输出，避免控制台被大量日志淹没
configureLogger({ enabled: false })

// Mock window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
})
