/**
 * 应用启动入口
 * 需求: 11.1
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// 获取根元素
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('找不到根元素 #root');
}

// 创建 React 根节点并渲染应用
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
