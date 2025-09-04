// 工具函数集合

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化日期
export function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 生成唯一ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 下载文件
export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 复制到剪贴板
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackError) {
      console.error('降级复制也失败:', fallbackError)
      return false
    }
  }
}

// 节流函数
export function throttle(func, wait) {
  let timeout
  let previous = 0
  
  return function (...args) {
    const now = Date.now()
    const remaining = wait - (now - previous)
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

// 防抖函数
export function debounce(func, wait, immediate = false) {
  let timeout
  
  return function (...args) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(this, args)
  }
}

// 验证音频文件格式
export function isValidAudioFile(file) {
  const validTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/aac'
  ]
  
  return validTypes.includes(file.type)
}

// 获取文件扩展名
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

// 安全的JSON解析
export function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str)
  } catch (error) {
    console.error('JSON解析失败:', error)
    return defaultValue
  }
}

// Chrome扩展相关工具
export const chromeUtils = {
  // 发送消息到后台脚本
  async sendMessage(message) {
    try {
      return await chrome.runtime.sendMessage(message)
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  },
  
  // 显示通知
  async showNotification(title, message, iconUrl = 'icons/icon48.png') {
    try {
      return await this.sendMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        message,
        iconUrl
      })
    } catch (error) {
      console.error('显示通知失败:', error)
    }
  },
  
  // 下载文件
  async downloadBlob(blob, filename) {
    try {
      const url = URL.createObjectURL(blob)
      const downloadId = await chrome.downloads.download({
        url: url,
        filename: filename
      })
      
      // 清理URL
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
      
      return downloadId
    } catch (error) {
      console.error('下载失败:', error)
      // 降级到普通下载
      downloadFile(blob, filename)
    }
  }
}