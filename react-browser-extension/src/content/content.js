// React Browser Extension Content Script
// 运行在网页上下文中

console.log('React Extension Content Script Loaded')

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
      
    case 'INJECT_CSS':
      injectCSS(message.css)
      sendResponse({ success: true })
      break
      
    case 'HIGHLIGHT_ELEMENTS':
      highlightElements(message.selector)
      sendResponse({ success: true })
      break
      
    case 'REMOVE_HIGHLIGHTS':
      removeHighlights()
      sendResponse({ success: true })
      break
      
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
  console.log('Initializing React Extension on:', window.location.href)
  
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
  
  // 添加键盘快捷键监听
  document.addEventListener('keydown', handleKeyboardShortcuts)
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
  console.log('启用React Extension功能')
  
  // 添加插件样式
  injectExtensionStyles()
  
  // 发送页面加载事件到background
  chrome.runtime.sendMessage({
    type: 'PAGE_LOADED',
    url: window.location.href,
    title: document.title
  }).catch(() => {})
}

// 禁用插件功能
function disableExtensionFeatures() {
  console.log('禁用React Extension功能')
  removeInjectedElements()
  removeHighlights()
}

// 分析当前页面
async function analyzeCurrentPage() {
  try {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      description: getMetaContent('description'),
      keywords: getMetaContent('keywords'),
      
      stats: {
        images: document.images.length,
        links: document.links.length,
        scripts: document.scripts.length,
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
        headings: {
          h1: document.querySelectorAll('h1').length,
          h2: document.querySelectorAll('h2').length,
          h3: document.querySelectorAll('h3').length
        },
        forms: document.forms.length
      },
      
      performance: {
        loadTime: performance.now()
      },
      
      technologies: detectTechnologies()
    }
    
    return pageInfo
  } catch (error) {
    console.error('页面分析失败:', error)
    return { error: error.message }
  }
}

// 获取页面基本信息
async function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    path: window.location.pathname,
    protocol: window.location.protocol,
    language: document.documentElement.lang || navigator.language,
    charset: document.characterSet
  }
}

// 检测页面使用的技术
function detectTechnologies() {
  const technologies = []
  
  if (window.React) technologies.push({ name: 'React', version: window.React.version || 'unknown' })
  if (window.Vue) technologies.push({ name: 'Vue.js', version: window.Vue.version || 'unknown' })
  if (window.angular) technologies.push({ name: 'Angular', version: window.angular.version?.full || 'unknown' })
  if (window.jQuery || window.$) technologies.push({ name: 'jQuery', version: window.jQuery?.fn?.jquery || 'unknown' })
  
  if (document.querySelector('[class*="bootstrap"]')) technologies.push({ name: 'Bootstrap' })
  if (document.querySelector('[class*="ant-"]')) technologies.push({ name: 'Ant Design' })
  
  return technologies
}

// 获取meta标签内容
function getMetaContent(name) {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
  return meta ? meta.content : null
}

// 注入CSS样式
function injectCSS(css) {
  const style = document.createElement('style')
  style.textContent = css
  style.className = 'react-extension-injected'
  document.head.appendChild(style)
  injectedElements.add(style)
}

// 高亮元素
function highlightElements(selector) {
  try {
    const elements = document.querySelectorAll(selector)
    elements.forEach(element => {
      element.style.outline = '2px solid #007bff'
      element.style.outlineOffset = '2px'
      element.classList.add('react-extension-highlighted')
    })
  } catch (error) {
    console.error('高亮元素失败:', error)
  }
}

// 移除高亮
function removeHighlights() {
  const highlighted = document.querySelectorAll('.react-extension-highlighted')
  highlighted.forEach(element => {
    element.style.outline = ''
    element.style.outlineOffset = ''
    element.classList.remove('react-extension-highlighted')
  })
}

// 注入插件样式
function injectExtensionStyles() {
  const css = `
    .react-extension-highlighted {
      outline: 2px solid #007bff !important;
      outline-offset: 2px !important;
    }
  `
  injectCSS(css)
}

// 移除注入的元素
function removeInjectedElements() {
  injectedElements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element)
    }
  })
  injectedElements.clear()
}

// 处理键盘快捷键
function handleKeyboardShortcuts(event) {
  if (!extensionActive) return
  
  if (event.ctrlKey && event.shiftKey && event.key === 'R') {
    event.preventDefault()
    chrome.runtime.sendMessage({ type: 'TOGGLE_SHORTCUT' })
  }
  
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault()
    analyzeCurrentPage().then(result => {
      console.log('页面分析结果:', result)
    })
  }
}

// 监听页面变化
let currentUrl = window.location.href
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href
    console.log('页面URL变化:', currentUrl)
    
    chrome.runtime.sendMessage({
      type: 'URL_CHANGED',
      url: currentUrl,
      title: document.title
    }).catch(() => {})
  }
}, 1000)

console.log('React Extension Content Script Ready')