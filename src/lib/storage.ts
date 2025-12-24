

/**
 * 仅用于浏览器，非同步
 */
class ChromeStorage {
  async getItem(key: string) {
    if (!key) {
      return null
    }

     const cache = await chrome.storage.local.get(key)

     return cache[key]
  }

  setItem<T>(key: string, value: T) {
    if (!key) {
      return false
    }

    // 异步写入 chrome.storage（非阻塞）
    chrome.storage.local.set({ [key]: value }).catch((err) => {
      console.error('写入 chrome.storage 失败：', err)
    })
  }

  removeItem(key: string) {
    chrome.storage.local.remove(key).catch((err) => {
      console.error('移除 chrome.storage 失败：', err)
    })
  }

  clear() {
    chrome.storage.local.clear()
  }

  onChange(callback: <T>(k: string, n: T, o: T) => void) {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'local') {
        return
      }

      Object.entries(changes).forEach(([key, { newValue, oldValue }]) => {
        callback(key, newValue, oldValue)
      })
    }

    chrome.storage.onChanged.addListener(listener)

    // 返回取消监听的函数（避免内存泄漏）
    return () => chrome.storage.onChanged.removeListener(listener)
  }
}

export default new ChromeStorage()
