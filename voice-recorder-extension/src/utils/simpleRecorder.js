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

  // 强制请求麦克风权限并开始录音
  async requestPermissionAndStart() {
    if (!this.isSupported()) {
      throw new Error('您的浏览器不支持录音功能')
    }

    try {
      console.log('🚨 强制重新请求麦克风权限...')
      
      // 1. 先检查当前权限状态
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' })
          console.log('📋 当前麦克风权限状态:', permission.state)
          
          if (permission.state === 'denied') {
            console.log('🔴 权限被拒绝，但仍尝试强制请求...')
          }
        } catch (permError) {
          console.log('⚠️ 无法查询权限状态:', permError.message)
        }
      }
      
      // 2. 多次尝试获取权限
      console.log('🎤 开始getUserMedia请求...')
      
      // 第一次尝试 - 完整配置
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        })
      } catch (firstError) {
        console.log('🔄 第一次请求失败，尝试简化配置...')
        
        // 第二次尝试 - 简化配置
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        })
      }

      console.log('✅ 麦克风权限获取成功！')
      console.log('🔊 音频轨道信息:', this.stream.getAudioTracks().map(track => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })))
      
      return true

    } catch (error) {
      console.error('❌ 麦克风权限请求彻底失败:', error)
      console.error('📊 错误详细信息:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint || 'N/A',
        stack: error.stack
      })
      
      let errorMessage = '💥 无法访问麦克风'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = `🚨 麦克风权限被拒绝！

🔧 立即解决方案：
1️⃣ 点击地址栏左侧的 🔒 或 ⚠️ 图标
2️⃣ 找到 "麦克风" 选项
3️⃣ 从 "阻止" 改为 "允许"
4️⃣ 刷新此页面重试

🌐 备用方案：
1️⃣ 打开新标签页输入: chrome://settings/content/microphone
2️⃣ 在 "阻止" 列表中删除此扩展
3️⃣ 重新尝试录音，选择 "允许"

💡 如果仍无效，请重启浏览器后重试！`
      } else if (error.name === 'NotFoundError') {
        errorMessage = `🎤 未检测到麦克风设备！

🔍 请检查：
1️⃣ 麦克风是否已连接
2️⃣ 系统声音设置是否正常
3️⃣ 其他应用能否使用麦克风
4️⃣ Windows声音设置中是否启用了麦克风`
      } else if (error.name === 'NotReadableError') {
        errorMessage = `🔒 麦克风被其他程序占用！

🛑 请关闭：
1️⃣ 其他录音软件
2️⃣ 视频会议应用（腾讯会议、钉钉等）
3️⃣ 语音助手或语音识别软件
4️⃣ 其他浏览器标签页的录音功能`
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = `⚙️ 麦克风不支持所需的音频格式！

🔧 可能的解决方案：
1️⃣ 更新音频驱动程序
2️⃣ 尝试使用其他麦克风设备
3️⃣ 检查系统音频设置`
      }
      
      throw new Error(errorMessage)
    }
  }

  // 开始录音
  async startRecording() {
    console.log('SimpleRecorder: 开始录音流程')
    
    if (this.isRecording) {
      throw new Error('已在录音中')
    }

    if (!this.stream) {
      console.log('SimpleRecorder: 需要请求麦克风权限')
      await this.requestPermissionAndStart()
    } else {
      console.log('SimpleRecorder: 使用现有音频流')
    }

    console.log('SimpleRecorder: 初始化MediaRecorder')
    this.chunks = []
    
    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      console.log('SimpleRecorder: MediaRecorder创建成功')
    } catch (error) {
      console.error('SimpleRecorder: MediaRecorder创建失败:', error)
      throw new Error(`MediaRecorder创建失败: ${error.message}`)
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('SimpleRecorder: 接收到音频数据块:', event.data.size, 'bytes')
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.onstart = () => {
      console.log('SimpleRecorder: MediaRecorder已启动')
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
      console.log('SimpleRecorder: MediaRecorder已停止')
      this.isRecording = false
      this.isPaused = false
    }

    this.mediaRecorder.onerror = (event) => {
      console.error('SimpleRecorder: MediaRecorder错误:', event.error)
    }

    console.log('SimpleRecorder: 准备启动MediaRecorder...')
    try {
      this.mediaRecorder.start(1000) // 每秒收集一次数据
      console.log('SimpleRecorder: MediaRecorder.start()调用成功')
    } catch (error) {
      console.error('SimpleRecorder: MediaRecorder.start()调用失败:', error)
      throw error
    }
    
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