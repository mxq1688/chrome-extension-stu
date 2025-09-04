// 音频播放工具类
class AudioPlayer {
  constructor() {
    this.audio = null
    this.currentUrl = null
    this.isPlaying = false
    this.onTimeUpdate = null
    this.onEnded = null
    this.onError = null
  }
  
  // 加载音频
  load(audioUrl) {
    if (this.audio) {
      this.stop()
    }
    
    this.audio = new Audio(audioUrl)
    this.currentUrl = audioUrl
    
    // 设置事件监听
    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdate) {
        this.onTimeUpdate({
          currentTime: this.audio.currentTime,
          duration: this.audio.duration || 0,
          progress: (this.audio.currentTime / (this.audio.duration || 1)) * 100
        })
      }
    })
    
    this.audio.addEventListener('ended', () => {
      this.isPlaying = false
      if (this.onEnded) {
        this.onEnded()
      }
    })
    
    this.audio.addEventListener('error', (error) => {
      console.error('音频播放错误:', error)
      this.isPlaying = false
      if (this.onError) {
        this.onError(error)
      }
    })
    
    this.audio.addEventListener('loadedmetadata', () => {
      console.log('音频元数据加载完成:', {
        duration: this.audio.duration,
        url: audioUrl
      })
    })
  }
  
  // 播放
  async play() {
    if (!this.audio) {
      throw new Error('没有加载音频文件')
    }
    
    try {
      await this.audio.play()
      this.isPlaying = true
    } catch (error) {
      console.error('播放失败:', error)
      this.isPlaying = false
      throw new Error(`播放失败: ${error.message}`)
    }
  }
  
  // 暂停
  pause() {
    if (this.audio && this.isPlaying) {
      this.audio.pause()
      this.isPlaying = false
    }
  }
  
  // 停止
  stop() {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.isPlaying = false
    }
  }
  
  // 设置播放位置
  seek(time) {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0))
    }
  }
  
  // 设置音量 (0-1)
  setVolume(volume) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume))
    }
  }
  
  // 获取当前播放时间
  getCurrentTime() {
    return this.audio ? this.audio.currentTime : 0
  }
  
  // 获取总时长
  getDuration() {
    return this.audio ? (this.audio.duration || 0) : 0
  }
  
  // 获取播放进度 (0-100)
  getProgress() {
    if (!this.audio || !this.audio.duration) return 0
    return (this.audio.currentTime / this.audio.duration) * 100
  }
  
  // 格式化时间
  static formatTime(seconds) {
    if (isNaN(seconds)) return '00:00'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  // 销毁播放器
  destroy() {
    if (this.audio) {
      this.stop()
      this.audio.removeEventListener('timeupdate', this.onTimeUpdate)
      this.audio.removeEventListener('ended', this.onEnded)
      this.audio.removeEventListener('error', this.onError)
      this.audio = null
    }
    
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl)
      this.currentUrl = null
    }
    
    this.onTimeUpdate = null
    this.onEnded = null
    this.onError = null
  }
}

export default AudioPlayer