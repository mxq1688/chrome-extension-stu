import { defineStore } from 'pinia'

export const useRecorderStore = defineStore('recorder', {
  state: () => ({
    // 录音状态
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    currentRecording: null,
    
    // 录音列表
    recordings: [],
    
    // 播放状态
    currentPlayingId: null,
    isPlaying: false,
    
    // 设置
    settings: {
      audioQuality: 'high', // high, medium, low
      maxRecordingTime: 300, // 5分钟
      autoSave: true,
      showNotifications: true,
      inputSource: 'mix', // mic | tab | mix
      downloadDir: 'recordings',
      // 音频处理
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      gain: 1.0
    },
    
    // 权限状态
    hasPermission: false,
    permissionError: null
  }),
  
  getters: {
    formattedRecordingTime: (state) => {
      const minutes = Math.floor(state.recordingTime / 60)
      const seconds = state.recordingTime % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    
    totalRecordings: (state) => state.recordings.length,
    
    totalRecordingTime: (state) => {
      return state.recordings.reduce((total, recording) => total + recording.duration, 0)
    },
    
    currentRecordingData: (state) => {
      return state.recordings.find(r => r.id === state.currentPlayingId)
    }
  },
  
  actions: {
    // 设置录音状态
    setRecordingState(isRecording, isPaused = false) {
      this.isRecording = isRecording
      this.isPaused = isPaused
    },
    
    // 更新录音时间
    updateRecordingTime(time) {
      this.recordingTime = time
    },
    
    // 添加录音
    addRecording(recording) {
      const newRecording = {
        id: Date.now().toString(),
        name: recording.name || `录音 ${this.recordings.length + 1}`,
        duration: recording.duration || 0,
        size: recording.size || 0,
        createdAt: new Date().toISOString(),
        audioUrl: recording.audioUrl,
        audioBlob: recording.audioBlob
      }
      this.recordings.unshift(newRecording)
      this.saveToStorage()
    },
    
    // 删除录音
    deleteRecording(id) {
      const index = this.recordings.findIndex(r => r.id === id)
      if (index > -1) {
        // 如果正在播放这个录音，停止播放
        if (this.currentPlayingId === id) {
          this.stopPlaying()
        }
        this.recordings.splice(index, 1)
        this.saveToStorage()
      }
    },
    
    // 重命名录音
    renameRecording(id, newName) {
      const recording = this.recordings.find(r => r.id === id)
      if (recording) {
        recording.name = newName
        this.saveToStorage()
      }
    },
    
    // 设置播放状态
    setPlayingState(id, isPlaying) {
      this.currentPlayingId = isPlaying ? id : null
      this.isPlaying = isPlaying
    },
    
    // 停止播放
    stopPlaying() {
      this.currentPlayingId = null
      this.isPlaying = false
    },
    
    // 更新设置
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
      this.saveToStorage()
    },
    
    // 设置权限状态
    setPermission(hasPermission, error = null) {
      this.hasPermission = hasPermission
      this.permissionError = error
    },
    
    // 重置录音时间
    resetRecordingTime() {
      this.recordingTime = 0
    },
    
    // 保存到本地存储
    async saveToStorage() {
      try {
        const data = {
          recordings: this.recordings.map(r => ({
            ...r,
            // 不保存 audioBlob，只保存基本信息
            audioBlob: undefined
          })),
          settings: this.settings
        }
        await chrome.storage.local.set({ voiceRecorderData: data })
      } catch (error) {
        console.error('保存数据失败:', error)
      }
    },
    
    // 从本地存储加载
    async loadFromStorage() {
      try {
        const result = await chrome.storage.local.get(['voiceRecorderData'])
        if (result.voiceRecorderData) {
          const data = result.voiceRecorderData
          if (data.recordings) {
            this.recordings = data.recordings
          }
          if (data.settings) {
            this.settings = { ...this.settings, ...data.settings }
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
      }
    },
    
    // 清空所有录音
    clearAllRecordings() {
      this.recordings = []
      this.stopPlaying()
      this.saveToStorage()
    }
  }
})