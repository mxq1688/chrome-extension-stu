// Vue Browser Extension Content Script
// 运行在网页上下文中

console.log('Vue Extension Content Script Loaded')

// 插件状态
let extensionActive = true
let injectedElements = new Set()

// 消息监听
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message)
  
  switch (message.type) {
    case 'EXTENSION_STATUS_CHANGED':
      extensionActive = message.active
      handleExtensionStatusChange(message.active)
      sendResponse({ success: true })
      break
      
    case 'ANALYZE_PAGE':
      analyzeCurrentPage().then(sendResponse)
      return true
      
    case 'GET_PAGE_INFO':
      getPageInfo().then(sendResponse)
      return true
      
    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript)
} else {
  initContentScript()
}

// 初始化content script
function initContentScript() {
  console.log('Initializing Vue Extension on:', window.location.href)
  
  chrome.runtime.sendMessage({ type: 'GET_EXTENSION_INFO' })
    .then(response => {
      if (response && response.isActive !== undefined) {
        extensionActive = response.isActive
        if (extensionActive) {
          enableExtensionFeatures()
        }
      }
    })
    .catch(error => {
      console.error('获取插件状态失败:', error)
    })
}

// 处理插件状态变化
function handleExtensionStatusChange(active) {
  if (active) {
    enableExtensionFeatures()
  } else {
    disableExtensionFeatures()
  }
}

// 启用插件功能
function enableExtensionFeatures() {
  console.log('启用Vue Extension功能')
  chrome.runtime.sendMessage({
    type: 'PAGE_LOADED',
    url: window.location.href,
    title: document.title
  }).catch(() => {})
}

// 禁用插件功能
function disableExtensionFeatures() {
  console.log('禁用Vue Extension功能')
}

// 分析当前页面
async function analyzeCurrentPage() {
  try {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      stats: {
        images: document.images.length,
        links: document.links.length,
        scripts: document.scripts.length
      }
    }
    return pageInfo
  } catch (error) {
    return { error: error.message }
  }
}

// 获取页面基本信息
async function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname
  }
}

console.log('Vue Extension Content Script Ready')