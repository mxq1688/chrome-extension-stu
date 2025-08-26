import React, { createContext, useContext, useReducer, useEffect } from 'react'

// 初始状态
const initialState = {
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
}

// Action类型
const ActionTypes = {
  SET_ACTIVE: 'SET_ACTIVE',
  SET_CURRENT_TAB: 'SET_CURRENT_TAB',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SHOW_MESSAGE: 'SHOW_MESSAGE',
  HIDE_MESSAGE: 'HIDE_MESSAGE'
}

// Reducer
function extensionReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_ACTIVE:
      return { ...state, isActive: action.payload }
    case ActionTypes.SET_CURRENT_TAB:
      return { ...state, currentTab: action.payload }
    case ActionTypes.UPDATE_SETTINGS:
      return { 
        ...state, 
        settings: { ...state.settings, ...action.payload } 
      }
    case ActionTypes.SHOW_MESSAGE:
      return {
        ...state,
        message: {
          text: action.payload.text,
          type: action.payload.type || 'info',
          visible: true
        }
      }
    case ActionTypes.HIDE_MESSAGE:
      return {
        ...state,
        message: { ...state.message, visible: false }
      }
    default:
      return state
  }
}

// Context
const ExtensionContext = createContext()

// Provider组件
export function ExtensionProvider({ children }) {
  const [state, dispatch] = useReducer(extensionReducer, initialState)

  // 初始化时从chrome.storage加载数据
  useEffect(() => {
    loadStorageData()
  }, [])

  const loadStorageData = async () => {
    try {
      const result = await chrome.storage.local.get(['isActive'])
      if (result.isActive !== undefined) {
        dispatch({ type: ActionTypes.SET_ACTIVE, payload: result.isActive })
      }

      const settingsResult = await chrome.storage.sync.get(['settings'])
      if (settingsResult.settings) {
        dispatch({ 
          type: ActionTypes.UPDATE_SETTINGS, 
          payload: settingsResult.settings 
        })
      }
    } catch (error) {
      console.error('加载存储数据失败:', error)
    }
  }

  const setActive = async (active) => {
    dispatch({ type: ActionTypes.SET_ACTIVE, payload: active })
    try {
      await chrome.storage.local.set({ isActive: active })
    } catch (error) {
      console.error('保存状态失败:', error)
    }
  }

  const setCurrentTab = (tab) => {
    dispatch({ type: ActionTypes.SET_CURRENT_TAB, payload: tab })
  }

  const updateSettings = async (newSettings) => {
    dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: newSettings })
    try {
      const updatedSettings = { ...state.settings, ...newSettings }
      await chrome.storage.sync.set({ settings: updatedSettings })
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  const showMessage = (text, type = 'info') => {
    dispatch({ 
      type: ActionTypes.SHOW_MESSAGE, 
      payload: { text, type } 
    })
    
    setTimeout(() => {
      dispatch({ type: ActionTypes.HIDE_MESSAGE })
    }, 3000)
  }

  const sendMessageToBackground = async (message) => {
    try {
      const response = await chrome.runtime.sendMessage(message)
      return response
    } catch (error) {
      console.error('发送消息到background失败:', error)
      throw error
    }
  }

  const sendMessageToContentScript = async (tabId, message) => {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message)
      return response
    } catch (error) {
      console.error('发送消息到content script失败:', error)
      throw error
    }
  }

  const value = {
    ...state,
    setActive,
    setCurrentTab,
    updateSettings,
    showMessage,
    sendMessageToBackground,
    sendMessageToContentScript
  }

  return (
    <ExtensionContext.Provider value={value}>
      {children}
    </ExtensionContext.Provider>
  )
}

// Hook
export function useExtension() {
  const context = useContext(ExtensionContext)
  if (!context) {
    throw new Error('useExtension must be used within an ExtensionProvider')
  }
  return context
}