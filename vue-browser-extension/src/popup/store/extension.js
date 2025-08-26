import { defineStore } from 'pinia'

export const useExtensionStore = defineStore('extension', {
  state: () => ({
    isActive: true,
    currentTab: null,
    settings: {
      theme: 'light',
      language: 'zh-CN',
      notifications: true
    },
    message: {
      text: '',
      type: 'info',
      visible: false
    }
  }),

  getters: {
    isExtensionActive: (state) => state.isActive,
    getCurrentTab: (state) => state.currentTab,
    getSettings: (state) => state.settings
  },

  actions: {
    setActive(active) {
      this.isActive = active
      // 保存到chrome.storage
      chrome.storage.local.set({ isActive: active })
    },

    setCurrentTab(tab) {
      this.currentTab = tab
    },

    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
      // 保存到chrome.storage
      chrome.storage.sync.set({ settings: this.settings })
    },

    showMessage(text, type = 'info') {
      this.message = {
        text,
        type,
        visible: true
      }
      
      // 3秒后自动隐藏
      setTimeout(() => {
        this.message.visible = false
      }, 3000)
    },

    hideMessage() {
      this.message.visible = false
    },

    async initializeStore() {
      try {
        // 从chrome.storage加载数据
        const result = await chrome.storage.local.get(['isActive'])
        if (result.isActive !== undefined) {
          this.isActive = result.isActive
        }

        const settingsResult = await chrome.storage.sync.get(['settings'])
        if (settingsResult.settings) {
          this.settings = { ...this.settings, ...settingsResult.settings }
        }
      } catch (error) {
        console.error('初始化store失败:', error)
      }
    },

    async sendMessageToBackground(message) {
      try {
        const response = await chrome.runtime.sendMessage(message)
        return response
      } catch (error) {
        console.error('发送消息到background失败:', error)
        throw error
      }
    },

    async sendMessageToContentScript(tabId, message) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, message)
        return response
      } catch (error) {
        console.error('发送消息到content script失败:', error)
        throw error
      }
    }
  }
})