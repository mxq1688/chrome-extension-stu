// React Vite Browser Extension Background Script
// Manifest V3 Service Worker with TypeScript

console.log('React Vite Extension Background Script Loaded')

// 类型定义
interface ExtensionMessage {
  type: string
  [key: string]: any
}

interface ExtensionInfo {
  name: string
  version: string
  isActive: boolean
  installTime?: number
}

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details)
  
  // 设置默认配置
  chrome.storage.local.set({
    isActive: true,
    installTime: Date.now(),
    version: chrome.runtime.getManifest().version
  })
  
  // 创建右键菜单
  createContextMenus()
})

// 创建右键菜单
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'react-vite-extension-menu',
      title: 'React Vite Extension',
      contexts: ['all']
    })
    
    chrome.contextMenus.create({
      id: 'capture-screenshot',
      title: '截取页面',
      contexts: ['page'],
      parentId: 'react-vite-extension-menu'
    })
    
    chrome.contextMenus.create({
      id: 'analyze-page',
      title: '分析页面',
      contexts: ['page'],
      parentId: 'react-vite-extension-menu'
    })
  })
}

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return
  
  try {
    switch (info.menuItemId) {
      case 'capture-screenshot':
        await captureScreenshot(tab.id)
        break
      case 'analyze-page':
        await analyzePage(tab.id)
        break
    }
  } catch (error) {
    console.error('Context menu action failed:', error)
  }
})

// 处理消息
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('Background received message:', message)
  
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('Message handling failed:', error)
      sendResponse({ error: error.message })
    })
  
  return true
})

// 消息处理函数
async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case 'GET_EXTENSION_INFO':
      return await getExtensionInfo()
      
    case 'TOGGLE_EXTENSION':
      return await toggleExtension(message.active)
      
    case 'CAPTURE_TAB':
      return await captureTab(sender.tab?.id)
      
    case 'ANALYZE_PAGE':
      return await analyzePage(message.tabId || sender.tab?.id)
      
    case 'NOTIFICATION':
      showNotification(message.title, message.message)
      return { success: true }
      
    default:
      throw new Error(`Unknown message type: ${message.type}`)
  }
}

// 工具函数
async function getExtensionInfo(): Promise<ExtensionInfo> {
  try {
    const manifest = chrome.runtime.getManifest()
    const storage = await chrome.storage.local.get(['isActive', 'installTime'])
    
    return {
      name: manifest.name,
      version: manifest.version,
      isActive: storage.isActive ?? true,
      installTime: storage.installTime
    }
  } catch (error) {
    console.error('获取插件信息失败:', error)
    throw new Error('获取插件信息失败')
  }
}

async function toggleExtension(active: boolean) {
  try {
    await chrome.storage.local.set({ isActive: active })
    
    const tabs = await chrome.tabs.query({})
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id!, {
        type: 'EXTENSION_STATUS_CHANGED',
        active: active
      }).catch(() => {})
    })
    
    return { success: true, active }
  } catch (error) {
    console.error('切换插件状态失败:', error)
    throw new Error('切换插件状态失败')
  }
}

async function captureTab(tabId?: number) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab()
    return { success: true, dataUrl }
  } catch (error) {
    console.error('截图失败:', error)
    throw new Error('截图失败')
  }
}

async function captureScreenshot(tabId: number) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab()
    chrome.downloads.download({
      url: dataUrl,
      filename: `screenshot-${Date.now()}.png`
    })
    showNotification('截图完成', '页面截图已保存')
  } catch (error) {
    console.error('截图失败:', error)
  }
}

async function analyzePage(tabId: number) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'ANALYZE_PAGE'
    })
    console.log('页面分析结果:', response)
    showNotification('页面分析', '分析结果已输出到控制台')
  } catch (error) {
    console.error('页面分析失败:', error)
  }
}

function showNotification(title: string, message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  })
}

// 标签页更新监听
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url)
  }
})