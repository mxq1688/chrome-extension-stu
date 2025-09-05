// 音频录制工具类
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null
    this.audioChunks = []
    this.stream = null
    this.isSupported = this.checkSupport()
  }
  
  // 检查浏览器支持
  checkSupport() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
  }
  
  // 获取麦克风权限
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('您的浏览器不支持录音功能')
    }
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })
      return true
    } catch (error) {
      let errorMessage = '获取麦克风权限失败'
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = '麦克风权限被拒绝\n请点击地址栏的🔒图标允许麦克风访问'
          break
        case 'NotFoundError':
          errorMessage = '未检测到麦克风设备'
          break
        case 'NotReadableError':
          errorMessage = '麦克风被其他应用程序占用'
          break
        case 'OverconstrainedError':
          errorMessage = '麦克风不支持请求的配置'
          break
        case 'SecurityError':
          errorMessage = '安全限制，请确保在HTTPS环境下使用'
          break
      }
      
      throw new Error(errorMessage)
    }
  }
  
  // 开始录音
  async startRecording(options = {}) {
    if (!this.stream) {
      await this.requestPermission()
    }
    
    this.audioChunks = []
    
    // 设置录音参数
    const mimeType = this.getSupportedMimeType(options.quality || 'high')
    
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: mimeType.type,
      audioBitsPerSecond: mimeType.bitrate
    })
    
    // 录音数据事件
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
      }
    }
    
    // 录音停止事件
    this.mediaRecorder.onstop = () => {
      // 这里会在 stopRecording 方法中处理
    }
    
    // 录音错误事件
    this.mediaRecorder.onerror = (event) => {
      console.error('录音错误:', event.error)
      throw new Error(`录音失败: ${event.error.message}`)
    }
    
    this.mediaRecorder.start(1000) // 每秒触发一次 dataavailable 事件
  }
  
  // 暂停录音
  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }
  
  // 恢复录音
  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }
  
  // 停止录音
  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('没有正在进行的录音'))
        return
      }
      
      this.mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder.mimeType 
          })
          
          const audioUrl = URL.createObjectURL(audioBlob)
          
          resolve({
            blob: audioBlob,
            url: audioUrl,
            duration: this.calculateDuration(),
            size: audioBlob.size,
            mimeType: this.mediaRecorder.mimeType
          })
        } catch (error) {
          reject(error)
        }
      }
      
      this.mediaRecorder.stop()
    })
  }
  
  // 获取录音状态
  getRecordingState() {
    return this.mediaRecorder ? this.mediaRecorder.state : 'inactive'
  }
  
  // 释放资源
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    
    if (this.mediaRecorder) {
      this.mediaRecorder = null
    }
    
    this.audioChunks = []
  }
  
  // 获取支持的音频格式
  getSupportedMimeType(quality = 'high') {
    const mimeTypes = {
      high: [
        { type: 'audio/webm;codecs=opus', bitrate: 128000 },
        { type: 'audio/ogg;codecs=opus', bitrate: 128000 },
        { type: 'audio/mp4', bitrate: 128000 },
        { type: 'audio/webm', bitrate: 96000 }
      ],
      medium: [
        { type: 'audio/webm;codecs=opus', bitrate: 64000 },
        { type: 'audio/ogg;codecs=opus', bitrate: 64000 },
        { type: 'audio/mp4', bitrate: 64000 },
        { type: 'audio/webm', bitrate: 48000 }
      ],
      low: [
        { type: 'audio/webm;codecs=opus', bitrate: 32000 },
        { type: 'audio/ogg;codecs=opus', bitrate: 32000 },
        { type: 'audio/mp4', bitrate: 32000 },
        { type: 'audio/webm', bitrate: 24000 }
      ]
    }
    
    const candidates = mimeTypes[quality] || mimeTypes.high
    
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate.type)) {
        return candidate
      }
    }
    
    // 降级到基本格式
    return { type: 'audio/webm', bitrate: 48000 }
  }
  
  // 计算录音时长（粗略估算）
  calculateDuration() {
    // 这是一个简化的估算，实际项目中可能需要更精确的计算
    return this.audioChunks.length
  }
  
  // 获取音频设备列表
  static async getAudioDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'audioinput')
    } catch (error) {
      console.error('获取音频设备失败:', error)
      return []
    }
  }
  
  // 检测音频输入级别
  getAudioLevel() {
    if (!this.stream) return 0
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(this.stream)
    
    source.connect(analyser)
    analyser.fftSize = 256
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    return () => {
      analyser.getByteFrequencyData(dataArray)
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      return sum / bufferLength / 255 * 100 // 返回0-100的音量级别
    }
  }
}

export default AudioRecorder