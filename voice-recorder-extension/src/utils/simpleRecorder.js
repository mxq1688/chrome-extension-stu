// 简单直接的录音器 - 专为 Chrome 扩展优化
class SimpleRecorder {
  constructor() {
    this.mediaRecorder = null
    this.stream = null
    this.chunks = []
    this.isRecording = false
    this.isPaused = false
  }

  // 检查浏览器支持
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
  }

  // 请求麦克风权限并开始录音
  async requestPermissionAndStart() {
    if (!this.isSupported()) {
      throw new Error('您的浏览器不支持录音功能')
    }

    try {
      // 直接请求麦克风权限
      console.log('正在请求麦克风权限...')
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })

      console.log('麦克风权限获取成功')
      return true

    } catch (error) {
      console.error('麦克风权限请求失败:', error)
      
      let errorMessage = '无法访问麦克风'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '麦克风权限被拒绝\n请点击地址栏的🔒图标允许麦克风访问'
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未检测到麦克风设备\n请检查麦克风是否连接正常'
      } else if (error.name === 'NotReadableError') {
        errorMessage = '麦克风被其他应用占用\n请关闭其他使用麦克风的程序'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = '麦克风不支持所需的音频格式'
      }
      
      throw new Error(errorMessage)
    }
  }

  // 开始录音
  async startRecording() {
    if (this.isRecording) {
      throw new Error('已在录音中')
    }

    if (!this.stream) {
      await this.requestPermissionAndStart()
    }

    this.chunks = []
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus'
    })

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.onstart = () => {
      console.log('录音开始')
      this.isRecording = true
      this.isPaused = false
    }

    this.mediaRecorder.onpause = () => {
      console.log('录音暂停')
      this.isPaused = true
    }

    this.mediaRecorder.onresume = () => {
      console.log('录音恢复')
      this.isPaused = false
    }

    this.mediaRecorder.onstop = () => {
      console.log('录音停止')
      this.isRecording = false
      this.isPaused = false
    }

    this.mediaRecorder.start(1000) // 每秒收集一次数据
    return true
  }

  // 停止录音
  async stopRecording() {
    if (!this.isRecording) {
      throw new Error('当前没有录音')
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(this.chunks, { type: 'audio/webm' })
          const audioUrl = URL.createObjectURL(blob)
          
          const recordingData = {
            blob: blob,
            url: audioUrl,
            duration: this.chunks.length, // 粗略估算
            size: blob.size,
            timestamp: Date.now()
          }

          this.isRecording = false
          this.isPaused = false
          
          resolve(recordingData)
        } catch (error) {
          reject(error)
        }
      }

      this.mediaRecorder.stop()
    })
  }

  // 暂停录音
  pauseRecording() {
    if (!this.isRecording || this.isPaused) {
      throw new Error('无法暂停录音')
    }
    this.mediaRecorder.pause()
  }

  // 恢复录音
  resumeRecording() {
    if (!this.isRecording || !this.isPaused) {
      throw new Error('无法恢复录音')
    }
    this.mediaRecorder.resume()
  }

  // 获取录音状态
  getState() {
    if (!this.mediaRecorder) return 'inactive'
    return this.mediaRecorder.state
  }

  // 检查权限状态
  async checkPermission() {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' })
      return permission.state // 'granted', 'denied', 'prompt'
    } catch (error) {
      console.warn('无法检查麦克风权限:', error)
      return 'unknown'
    }
  }

  // 清理资源
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    
    this.mediaRecorder = null
    this.chunks = []
    this.isRecording = false
    this.isPaused = false
  }
}

export default SimpleRecorder