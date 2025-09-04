// 录音助手 Background Script
// Manifest V3 Service Worker

console.log('录音助手 Background Script 已加载')

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('扩展已安装:', details)
  
  // 设置默认配置
  chrome.storage.local.set({
    voiceRecorderData: {
      recordings: [],
      settings: {
        audioQuality: 'high',
        maxRecordingTime: 300,
        autoSave: true,
        showNotifications: true
      }
    },
    installTime: Date.now()
  })
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'voice-recorder-menu',
    title: '录音助手',
    contexts: ['all']
  })
  
  chrome.contextMenus.create({
    id: 'start-recording',
    title: '开始录音',
    contexts: ['page'],
    parentId: 'voice-recorder-menu'
  })
  
  chrome.contextMenus.create({
    id: 'open-recorder',
    title: '打开录音助手',
    contexts: ['page'],
    parentId: 'voice-recorder-menu'
  })
})

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'start-recording':
      // 发送消息到 content script 开始录音
      chrome.tabs.sendMessage(tab.id, {
        type: 'START_RECORDING_FROM_CONTEXT'
      }).catch(() => {
        // 如果发送失败，打开 popup
        chrome.action.openPopup()
      })
      break
    case 'open-recorder':
      chrome.action.openPopup()
      break
  }
})

// 处理来自 popup 和 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background 收到消息:', message)
  
  switch (message.type) {
    case 'SHOW_NOTIFICATION':
      showNotification(message.title, message.message, message.iconUrl)
      sendResponse({ success: true })
      break
      
    case 'GET_EXTENSION_INFO':
      getExtensionInfo().then(sendResponse)
      return true
      
    case 'DOWNLOAD_RECORDING':
      downloadRecording(message.blob, message.filename).then(sendResponse)
      return true
      
    case 'OPEN_OPTIONS':
      chrome.runtime.openOptionsPage()
      sendResponse({ success: true })
      break
      
    case 'GET_ACTIVE_TAB':
      getActiveTab().then(sendResponse)
      return true
      
    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// 标签页更新监听
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('标签页更新:', tab.url)
    
    // 可以在这里执行一些页面加载完成后的操作
    checkAndInjectContentScript(tabId, tab.url)
  }
})

// 标签页激活监听
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('标签页激活:', activeInfo.tabId)
  // 可以在这里更新插件状态
})

// 工具函数
async function getExtensionInfo() {
  try {
    const manifest = chrome.runtime.getManifest()
    const storage = await chrome.storage.local.get(['installTime'])
    
    return {
      name: manifest.name,
      version: manifest.version,
      installTime: storage.installTime
    }
  } catch (error) {
    console.error('获取插件信息失败:', error)
    return { error: error.message }
  }
}

async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return { tab }
  } catch (error) {
    console.error('获取活动标签页失败:', error)
    return { error: error.message }
  }
}

async function downloadRecording(blobData, filename) {
  try {
    // 创建 blob URL
    const blob = new Blob([new Uint8Array(blobData)], { type: 'audio/webm' })
    const url = URL.createObjectURL(blob)
    
    // 使用 Chrome downloads API
    const downloadId = await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    })
    
    // 清理 URL
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
    
    return { success: true, downloadId }
  } catch (error) {
    console.error('下载失败:', error)
    return { error: error.message }
  }
}

function showNotification(title, message, iconUrl = 'icons/icon48.png') {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message
  })
}

async function checkAndInjectContentScript(tabId, url) {
  // 检查是否需要注入 content script
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      // 检查页面是否支持录音功能
      console.log('页面支持录音功能:', url)
    } catch (error) {
      console.error('检查 content script 失败:', error)
    }
  }
}

// 定期清理存储（可选）
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get()
    console.log('当前存储使用情况:', Object.keys(result).length, '项')
  } catch (error) {
    console.error('存储检查失败:', error)
  }
}, 300000) // 每5分钟检查一次

// 处理扩展卸载
chrome.runtime.onSuspend.addListener(() => {
  console.log('录音助手扩展即将暂停')
})

// 错误处理
self.addEventListener('error', (event) => {
  console.error('Background script 错误:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Background script 未处理的 Promise 拒绝:', event.reason)
})