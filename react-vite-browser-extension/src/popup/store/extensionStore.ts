import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Message {
  text: string
  type: 'info' | 'success' | 'error' | 'warning'
  title?: string
  visible: boolean
}

interface Settings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  autoStart: boolean
  enableNotifications: boolean
  enableSync: boolean
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'never'
}

interface ExtensionState {
  isActive: boolean
  currentTab: chrome.tabs.Tab | null
  settings: Settings
  message: Message
  loading: boolean
  
  // Actions
  setActive: (active: boolean) => void
  setCurrentTab: (tab: chrome.tabs.Tab | null) => void
  updateSettings: (newSettings: Partial<Settings>) => void
  showMessage: (text: string, type?: Message['type'], title?: string) => void
  hideMessage: () => void
  setLoading: (loading: boolean) => void
  initializeStore: () => Promise<void>
  sendMessageToBackground: (message: any) => Promise<any>
  sendMessageToContentScript: (tabId: number, message: any) => Promise<any>
}

const defaultSettings: Settings = {
  theme: 'light',
  language: 'zh-CN',
  autoStart: false,
  enableNotifications: true,
  enableSync: false,
  updateFrequency: 'weekly'
}

const defaultMessage: Message = {
  text: '',
  type: 'info',
  title: '',
  visible: false
}

export const useExtensionStore = create<ExtensionState>()()
  devtools(
    (set, get) => ({
      isActive: true,
      currentTab: null,
      settings: defaultSettings,
      message: defaultMessage,
      loading: false,

      setActive: async (active: boolean) => {
        set({ isActive: active })
        try {
          await chrome.storage.local.set({ isActive: active })
        } catch (error) {
          console.error('保存状态失败:', error)
        }
      },

      setCurrentTab: (tab: chrome.tabs.Tab | null) => {
        set({ currentTab: tab })
      },

      updateSettings: async (newSettings: Partial<Settings>) => {
        const currentSettings = get().settings
        const updatedSettings = { ...currentSettings, ...newSettings }
        set({ settings: updatedSettings })
        
        try {
          await chrome.storage.sync.set({ settings: updatedSettings })
        } catch (error) {
          console.error('保存设置失败:', error)
          throw error
        }
      },

      showMessage: (text: string, type: Message['type'] = 'info', title?: string) => {
        set({
          message: {
            text,
            type,
            title: title || '',
            visible: true
          }
        })

        // 3秒后自动隐藏
        setTimeout(() => {
          get().hideMessage()
        }, 3000)
      },

      hideMessage: () => {
        set({
          message: { ...get().message, visible: false }
        })
      },

      setLoading: (loading: boolean) => {
        set({ loading })
      },

      initializeStore: async () => {
        try {
          set({ loading: true })
          
          // 加载本地状态
          const localResult = await chrome.storage.local.get(['isActive'])
          if (localResult.isActive !== undefined) {
            set({ isActive: localResult.isActive })
          }

          // 加载同步设置
          const syncResult = await chrome.storage.sync.get(['settings'])
          if (syncResult.settings) {
            set({ 
              settings: { ...defaultSettings, ...syncResult.settings }
            })
          }
        } catch (error) {
          console.error('初始化store失败:', error)
          get().showMessage('初始化失败', 'error')
        } finally {
          set({ loading: false })
        }
      },

      sendMessageToBackground: async (message: any) => {
        try {
          const response = await chrome.runtime.sendMessage(message)
          return response
        } catch (error) {
          console.error('发送消息到background失败:', error)
          throw error
        }
      },

      sendMessageToContentScript: async (tabId: number, message: any) => {
        try {
          const response = await chrome.tabs.sendMessage(tabId, message)
          return response
        } catch (error) {
          console.error('发送消息到content script失败:', error)
          throw error
        }
      }
    }),
    {
      name: 'extension-store'
    }
  ))