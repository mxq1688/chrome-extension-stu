// 简单直接的录音器 - 专为 Chrome 扩展优化
class SimpleRecorder {
  constructor() {
    this.mediaRecorder = null
    this.stream = null
    this.micStream = null
    this.tabStream = null
    this.chunks = []
    this.isRecording = false
    this.isPaused = false
    this.audioContext = null
    this.analyser = null
    this.levelDataArray = null
    this.levelCallback = null
  }

  // 检查浏览器支持
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
  }

  // 获取麦克风输入
  async requestPermissionAndStart(inputSource = 'mix') {
    if (!this.isSupported()) {
      throw new Error('您的浏览器不支持录音功能')
    }

    console.log('🎤 正在获取麦克风输入...')
    
    try {
      // 麦克风（按需）
      if (inputSource === 'mic' || inputSource === 'mix') {
        this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
        })
      }

      // 标签页音频（按需）
      if (inputSource === 'tab' || inputSource === 'mix') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { mandatory: { chromeMediaSource: 'tab' } }
          })
          this.tabStream = stream
        } catch (e) {
          console.warn('获取标签页音频失败:', e)
        }
      }

      // 选择输出
      if (inputSource === 'tab') {
        this.stream = this.tabStream || this.micStream
      } else if (inputSource === 'mic') {
        this.stream = this.micStream || this.tabStream
      } else if (this.tabStream && this.micStream) {
        // 混音（AudioContext 合成）
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const dest = ctx.createMediaStreamDestination()
        const sources = []
        sources.push(ctx.createMediaStreamSource(this.micStream)); sources[sources.length - 1].connect(dest)
        sources.push(ctx.createMediaStreamSource(this.tabStream)); sources[sources.length - 1].connect(dest)
        this.stream = dest.stream
        this.audioContext = ctx
      } else {
        this.stream = this.micStream || this.tabStream
      }

      // 建立电平分析（优先从最终输出流）
      try {
        const ctx = this.audioContext || new (window.AudioContext || window.webkitAudioContext)()
        const source = ctx.createMediaStreamSource(this.stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        source.connect(analyser)
        this.analyser = analyser
        this.levelDataArray = dataArray
        this.audioContext = ctx
      } catch {}

      console.log('✅ 录音输入已就绪')
      console.log('🔊 音频轨道信息:', this.stream.getAudioTracks().map(track => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })))
      
      return true
    } catch (error) {
      console.error('❌ 获取麦克风失败:', error)
      // 直接抛出原始错误，保留 name 与 message，额外标记 dismissed 场景
      if (error && error.name === 'NotAllowedError') {
        error._dismissed = /dismissed/i.test(String(error.message))
      }
      throw error
    }
  }

  // 开始录音
  async startRecording(inputSource = 'mix') {
    console.log('SimpleRecorder: 开始录音流程')
    
    if (this.isRecording) {
      throw new Error('已在录音中')
    }

    if (!this.stream) {
      console.log('SimpleRecorder: 需要请求麦克风权限')
      await this.requestPermissionAndStart(inputSource)
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

  // 订阅电平回调（返回0-1）
  onLevel(callback) {
    this.levelCallback = callback
    if (!this.analyser || !this.levelDataArray) return
    const loop = () => {
      if (!this.levelCallback) return
      this.analyser.getByteTimeDomainData(this.levelDataArray)
      // 计算RMS
      let sum = 0
      for (let i = 0; i < this.levelDataArray.length; i++) {
        const v = (this.levelDataArray[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / this.levelDataArray.length)
      this.levelCallback(Math.min(1, rms * 1.5))
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  offLevel() { this.levelCallback = null }

  

  // 清理资源
  cleanup() {
    const stopAll = (s) => { try { s && s.getTracks().forEach(t => t.stop()) } catch {}
    }
    stopAll(this.stream)
    stopAll(this.micStream)
    stopAll(this.tabStream)
    this.stream = null
    this.micStream = null
    this.tabStream = null
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    
    this.mediaRecorder = null
    this.chunks = []
    this.isRecording = false
    this.isPaused = false
    this.levelCallback = null
  }
}

export default SimpleRecorder