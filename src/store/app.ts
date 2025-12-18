import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const me = ref<Record<string, any>>({})

  const currentTab = ref<chrome.tabs.Tab | null>(null)
  const setCurrentTab = (tab: chrome.tabs.Tab) => {
    currentTab.value = tab
  } 

  return {
    currentTab,
    setCurrentTab,
    
    me,
  }
}, {
  persist: true,
})
