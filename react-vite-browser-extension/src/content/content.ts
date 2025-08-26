// React Vite Browser Extension Content Script
// 运行在网页上下文中

console.log('React Vite Extension Content Script Loaded')

// 类型定义
interface PageAnalysis {
  url: string
  title: string
  description?: string
  keywords?: string
  stats: {
    images: number
    links: number
    scripts: number
    stylesheets: number
    headings: {
      h1: number
      h2: number
      h3: number
    }
    forms: number
  }
  technologies: Technology[]
}

interface Technology {
  name: string
  version?: string
}

interface PageInfo {
  url: string
  title: string
  domain: string
  path: string
  protocol: string
  language?: string
  charset: string
}

// 插件状态
let extensionActive = true
let injectedElements = new Set<HTMLElement>()

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
  console.log('Initializing React Vite Extension on:', window.location.href)
  
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
function handleExtensionStatusChange(active: boolean) {
  if (active) {
    enableExtensionFeatures()
  } else {
    disableExtensionFeatures()
  }
}

// 启用插件功能
function enableExtensionFeatures() {
  console.log('启用React Vite Extension功能')
  
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
  console.log('禁用React Vite Extension功能')
  removeInjectedElements()
  removeHighlights()
}

// 分析当前页面
async function analyzeCurrentPage(): Promise<PageAnalysis> {
  try {
    const pageAnalysis: PageAnalysis = {
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
      
      technologies: detectTechnologies()
    }
    
    return pageAnalysis
  } catch (error) {
    console.error('页面分析失败:', error)
    throw new Error('页面分析失败')
  }
}

// 获取页面基本信息
async function getPageInfo(): Promise<PageInfo> {
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
function detectTechnologies(): Technology[] {
  const technologies: Technology[] = []
  
  // 检测JavaScript框架
  if ((window as any).React) {
    technologies.push({ 
      name: 'React', 
      version: (window as any).React.version || 'unknown' 
    })
  }
  if ((window as any).Vue) {
    technologies.push({ 
      name: 'Vue.js', 
      version: (window as any).Vue.version || 'unknown' 
    })
  }
  if ((window as any).angular) {
    technologies.push({ 
      name: 'Angular', 
      version: (window as any).angular.version?.full || 'unknown' 
    })
  }
  if ((window as any).jQuery || (window as any).$) {
    technologies.push({ 
      name: 'jQuery', 
      version: (window as any).jQuery?.fn?.jquery || 'unknown' 
    })
  }
  
  // 检测UI框架
  if (document.querySelector('[class*="bootstrap"]')) {
    technologies.push({ name: 'Bootstrap' })
  }
  if (document.querySelector('[class*="ant-"]')) {
    technologies.push({ name: 'Ant Design' })
  }
  
  return technologies
}

// 获取meta标签内容
function getMetaContent(name: string): string | undefined {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
  return meta ? (meta as HTMLMetaElement).content : undefined
}

// 注入CSS样式
function injectCSS(css: string) {
  const style = document.createElement('style')
  style.textContent = css
  style.className = 'react-vite-extension-injected'
  document.head.appendChild(style)
  injectedElements.add(style)
}

// 高亮元素
function highlightElements(selector: string) {
  try {
    const elements = document.querySelectorAll(selector)
    elements.forEach(element => {
      const htmlElement = element as HTMLElement
      htmlElement.style.outline = '2px solid #667eea'
      htmlElement.style.outlineOffset = '2px'
      htmlElement.classList.add('react-vite-extension-highlighted')
    })
  } catch (error) {
    console.error('高亮元素失败:', error)
  }
}

// 移除高亮
function removeHighlights() {
  const highlighted = document.querySelectorAll('.react-vite-extension-highlighted')
  highlighted.forEach(element => {
    const htmlElement = element as HTMLElement
    htmlElement.style.outline = ''
    htmlElement.style.outlineOffset = ''
    htmlElement.classList.remove('react-vite-extension-highlighted')
  })
}

// 注入插件样式
function injectExtensionStyles() {
  const css = `
    .react-vite-extension-highlighted {
      outline: 2px solid #667eea !important;
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
function handleKeyboardShortcuts(event: KeyboardEvent) {
  if (!extensionActive) return
  
  // Ctrl+Shift+V: 开关插件
  if (event.ctrlKey && event.shiftKey && event.key === 'V') {
    event.preventDefault()
    chrome.runtime.sendMessage({ type: 'TOGGLE_SHORTCUT' })
  }
  
  // Ctrl+Shift+A: 分析页面
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

console.log('React Vite Extension Content Script Ready')