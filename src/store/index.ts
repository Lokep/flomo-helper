import { createPinia, setActivePinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate' // 数据持久化
import storage, { initChromeStorageCache } from '@/lib/storage'

const CrxCacheKey = 'crx-cache'

initChromeStorageCache(CrxCacheKey)

const store = createPinia()

store.use(
  createPersistedState({
    key: () => CrxCacheKey,

    storage: {
      getItem: storage.getItem,
      setItem: storage.setItem,
    },
  }),
)

setActivePinia(store)

export default store

// 模块统一导出

export * from './app'
