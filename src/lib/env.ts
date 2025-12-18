/**
 * 判断当前环境是否为 Content Script
 * @returns boolean
 */
export function isContentScriptEnv() {
  // 特征1：Content Script 有 chrome.runtime，但无 chrome.serviceWorker（Manifest V3）
  // 特征2：Content Script 可访问 window/document（Background 无 DOM 环境）
  // 特征3：Background 中 chrome.extension.getBackgroundPage() 非空（Manifest V2）/ chrome.runtime.id 存在但无 DOM
  // @ts-expect-error
  if (typeof window !== 'undefined' && window.chrome?.runtime && !chrome?.serviceWorker) {
    // 进一步验证：Content Script 能访问 document，且 chrome.tabs 权限受限（仅能调用部分方法）
    return !!document && typeof chrome.tabs?.create !== 'function'
  }

  return false
}

/**
 * 判断当前环境是否为 Background（Service Worker/Manifest V2 页面）
 * @returns boolean
 */
export function isBackgroundEnv() {
  // Manifest V3（Service Worker）：无 window/document，有 chrome.serviceWorker
  // @ts-expect-error
  if (typeof window === 'undefined' && chrome?.serviceWorker) {
    return true
  }

  // Manifest V2（后台页面）：有 window，但 chrome.extension.getBackgroundPage() 指向自身
  if (typeof window !== 'undefined' && chrome?.extension?.getBackgroundPage?.() === window) {
    return true
  }
  return false
}
