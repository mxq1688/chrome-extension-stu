// Chrome 扩展专用录音器
// 解决 popup 环境无法访问麦克风的问题

class ExtensionRecorder {
  constructor() {
    this.isRecording = false
    this.recordingData = null
    this.recordingTimer = null
    this.startTime = null
  }
  
  // 检查是否在扩展环境中
  isExtensionEnvironment() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
  }
  
  // 请求麦克风权限（通过 content script）
  async requestPermission() {
    if (!this.isExtensionEnvironment()) {
      throw new Error('不在 Chrome 扩展环境中')
    }
    
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab || !tab.id) {
        throw new Error('无法获取当前标签页')
      }
      
      // 检查标签页是否支持录音
      if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
        throw new Error('当前页面不支持录音功能\n请在网页中使用录音助手')
      }
      
      // 通过 content script 请求权限
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'REQUEST_MICROPHONE_PERMISSION'
      })
      
      if (!response || !response.success) {
        throw new Error(response?.error || '权限请求失败')
      }
      
      return true
      
    } catch (error) {
      if (error.message.includes('Could not establish connection')) {
        throw new Error('请刷新当前网页后重试\n或切换到其他网页使用录音功能')
      }
      throw error
    }
  }
  
  // 开始录音
  async startRecording(options = {}) {
    if (this.isRecording) {
      throw new Error('已在录音中')
    }
    
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab || !tab.id) {
        throw new Error('无法获取当前标签页')
      }
      
      // 通过 content script 开始录音
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'START_EXTENSION_RECORDING',
        options: {
          quality: options.quality || 'high',
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      if (!response || !response.success) {
        throw new Error(response?.error || '开始录音失败')
      }
      
      this.isRecording = true
      this.startTime = Date.now()
      
      return true
      
    } catch (error) {
      if (error.message.includes('Could not establish connection')) {
        throw new Error('请刷新当前网页后重试')
      }
      throw error
    }
  }
  
  // 停止录音
  async stopRecording() {
    if (!this.isRecording) {
      throw new Error('当前没有录音')
    }
    
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab || !tab.id) {
        throw new Error('无法获取当前标签页')
      }
      
      // 通过 content script 停止录音
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'STOP_EXTENSION_RECORDING'
      })
      
      if (!response || !response.success) {
        throw new Error(response?.error || '停止录音失败')
      }
      
      this.isRecording = false
      this.recordingData = response.recordingData
      
      return this.recordingData
      
    } catch (error) {
      this.isRecording = false
      if (error.message.includes('Could not establish connection')) {
        throw new Error('录音可能已经停止，请检查录音列表')
      }
      throw error
    }
  }
  
  // 暂停录音
  async pauseRecording() {
    if (!this.isRecording) {
      throw new Error('当前没有录音')
    }
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'PAUSE_EXTENSION_RECORDING'
      })
      
      if (!response || !response.success) {
        throw new Error(response?.error || '暂停录音失败')
      }
      
      return true
      
    } catch (error) {
      if (error.message.includes('Could not establish connection')) {
        throw new Error('请刷新当前网页后重试')
      }
      throw error
    }
  }
  
  // 恢复录音
  async resumeRecording() {
    if (!this.isRecording) {
      throw new Error('当前没有录音')
    }
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'RESUME_EXTENSION_RECORDING'
      })
      
      if (!response || !response.success) {
        throw new Error(response?.error || '恢复录音失败')
      }
      
      return true
      
    } catch (error) {
      if (error.message.includes('Could not establish connection')) {
        throw new Error('请刷新当前网页后重试')
      }
      throw error
    }
  }
  
  // 获取录音状态
  async getRecordingState() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_RECORDING_STATE'
      })
      
      return response?.state || 'inactive'
      
    } catch (error) {
      return 'inactive'
    }
  }
  
  // 检查当前页面是否支持录音
  async checkPageSupport() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab || !tab.url) {
        return { supported: false, reason: '无法获取当前页面信息' }
      }
      
      if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
        return {
          supported: false,
          reason: '当前页面不支持录音\n请在网页中使用录音助手',
          suggestions: [
            '访问任意网站（如 google.com）',
            '刷新当前网页',
            '确保不在系统页面（chrome://, file:// 等）'
          ]
        }
      }
      
      // 检查 content script 是否注入
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'PING' })
        return { supported: true }
      } catch (error) {
        return {
          supported: false,
          reason: 'Content script 未加载\n请刷新页面后重试',
          suggestions: [
            '刷新当前网页 (F5)',
            '等待页面完全加载后重试',
            '检查网络连接'
          ]
        }
      }
      
    } catch (error) {
      return {
        supported: false,
        reason: `检查失败: ${error.message}`
      }
    }
  }
  
  // 清理资源
  cleanup() {
    this.isRecording = false
    this.recordingData = null
    this.startTime = null
    
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer)
      this.recordingTimer = null
    }
  }
}

export default ExtensionRecorder