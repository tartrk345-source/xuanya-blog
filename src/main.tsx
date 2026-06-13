import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 全局错误捕获 — 显示在页面上方便调试
window.addEventListener('error', (e) => {
  const msg = `JS ERROR: ${e.message}\n  at: ${e.filename}:${e.lineno}:${e.colno}`;
  console.error(msg);
  const el = document.getElementById('global-error');
  if (el) el.textContent += '\n' + msg;
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = `PROMISE REJECT: ${e.reason}`;
  console.error(msg);
  const el = document.getElementById('global-error');
  if (el) el.textContent += '\n' + msg;
});

// 版本水印 — 确认新版本已部署
const verDiv = document.createElement('div');
verDiv.id = 'version-badge';
verDiv.textContent = 'v10';
verDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:#DA583F;color:white;padding:4px 10px;border-radius:999px;font-size:12px;z-index:999999;font-family:system-ui;';
document.body?.appendChild(verDiv);

// 错误显示容器
const errDiv = document.createElement('div');
errDiv.id = 'global-error';
errDiv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:red;color:white;padding:10px;font-size:12px;z-index:999999;max-height:50vh;overflow:auto;white-space:pre-wrap;font-family:monospace;';
document.body?.appendChild(errDiv);

// 暂时禁用 Service Worker 排除干扰
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').catch(() => {});
//   });
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
