// Vue Browser Extension Background Script
// Manifest V3 Service Worker

console.log('Vue Extension Background Script Loaded')

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details)
  
  // 设置默认配置
  chrome.storage.local.set({
    isActive: true,
    installTime: Date.now()
  })
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'vue-extension-menu',
    title: 'Vue Extension',
    contexts: ['all']
  })
  
  chrome.contextMenus.create({
    id: 'capture-screenshot',
    title: '截取页面',
    contexts: ['page'],
    parentId: 'vue-extension-menu'
  })
  
  chrome.contextMenus.create({
    id: 'analyze-page',
    title: '分析页面',
    contexts: ['page'],
    parentId: 'vue-extension-menu'
  })
})

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'capture-screenshot':
      captureScreenshot(tab.id)
      break
    case 'analyze-page':
      analyzePage(tab.id)
      break
  }
})

// 处理来自popup和content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message)
  
  switch (message.type) {
    case 'GET_EXTENSION_INFO':
      getExtensionInfo().then(sendResponse)
      return true // 保持消息通道开放
      
    case 'TOGGLE_EXTENSION':
      toggleExtension(message.active).then(sendResponse)
      return true
      
    case 'CAPTURE_TAB':
      captureTab(sender.tab.id).then(sendResponse)
      return true
      
    case 'INJECT_SCRIPT':
      injectContentScript(sender.tab.id, message.script).then(sendResponse)
      return true
      
    case 'NOTIFICATION':
      showNotification(message.title, message.message)
      sendResponse({ success: true })
      break
      
    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// 标签页更新监听
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url)
    
    // 可以在这里执行一些页面加载完成后的操作
    checkAndInjectContentScript(tabId, tab.url)
  }
})

// 标签页激活监听
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId)
  // 可以在这里更新插件状态
})

// 工具函数
async function getExtensionInfo() {
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
    return { error: error.message }
  }
}

async function toggleExtension(active) {
  try {
    await chrome.storage.local.set({ isActive: active })
    
    // 通知所有标签页状态变更
    const tabs = await chrome.tabs.query({})
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'EXTENSION_STATUS_CHANGED',
        active: active
      }).catch(() => {
        // 忽略无法发送消息的标签页
      })
    })
    
    return { success: true, active }
  } catch (error) {
    console.error('切换插件状态失败:', error)
    return { error: error.message }
  }
}

async function captureTab(tabId) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab()
    return { success: true, dataUrl }
  } catch (error) {
    console.error('截图失败:', error)
    return { error: error.message }
  }
}

async function captureScreenshot(tabId) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab()
    
    // 创建下载
    chrome.downloads.download({
      url: dataUrl,
      filename: `screenshot-${Date.now()}.png`
    })
    
    showNotification('截图完成', '页面截图已保存到下载文件夹')
  } catch (error) {
    console.error('截图失败:', error)
    showNotification('截图失败', error.message)
  }
}

async function analyzePage(tabId) {
  try {
    // 向content script发送分析请求
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'ANALYZE_PAGE'
    })
    
    console.log('页面分析结果:', response)
    showNotification('页面分析', '分析结果已输出到控制台')
  } catch (error) {
    console.error('页面分析失败:', error)
  }
}

async function injectContentScript(tabId, scriptCode) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: new Function(scriptCode)
    })
    
    return { success: true }
  } catch (error) {
    console.error('注入脚本失败:', error)
    return { error: error.message }
  }
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  })
}

async function checkAndInjectContentScript(tabId, url) {
  // 检查是否需要注入content script
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      // 检查插件是否启用
      const { isActive } = await chrome.storage.local.get(['isActive'])
      
      if (isActive) {
        // 可以在这里执行一些自动化操作
        console.log('插件已启用，页面:', url)
      }
    } catch (error) {
      console.error('检查content script失败:', error)
    }
  }
}

// 定期清理存储
setInterval(async () => {
  try {
    // 清理过期的临时数据
    const result = await chrome.storage.local.get()
    console.log('当前存储使用情况:', Object.keys(result).length, '项')
  } catch (error) {
    console.error('存储清理失败:', error)
  }
}, 60000) // 每分钟检查一次