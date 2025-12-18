const cache = new Map()

export async function initChromeStorageCache(key: string) {
  try {
    const result = await chrome.storage.local.get(key)

    cache.set(key, result[key])
  }
  catch (err) {
    console.error('初始化 chrome.storage 缓存失败：', err)
  }
}

/**
 * 仅用于浏览器，非同步
 */
class ChromeStorage {
  getItem(key: string) {
    if (!key) {
      return null
    }

    //  return chrome.storage.local.get(key)
    return cache.get(key) || null
  }

  setItem<T>(key: string, value: T) {
    if (!key) {
      return false
    }

    // 先更新内存缓存（保证后续读取是最新值）
    cache.set(key, value)

    // 异步写入 chrome.storage（非阻塞）
    chrome.storage.local.set({ [key]: value }).catch((err) => {
      console.error('写入 chrome.storage 失败：', err)
    })
  }

  removeItem(key: string) {
    cache.delete(key)

    chrome.storage.local.remove(key).catch((err) => {
      console.error('移除 chrome.storage 失败：', err)
    })
  }

  clear() {
    cache.clear()
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
