<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="mic-icon">🎙️</span>
          <h1>录音助手</h1>
        </div>
        <div class="version">v1.0.0</div>
      </div>
    </header>
    
    <main class="main">
      <div class="home">
        <!-- 录音控制区域 -->
        <div class="recording-section">
          <!-- 录音状态显示 -->
          <div class="recording-status card text-center">
            <div class="recording-visual">
              <div 
                class="recording-circle" 
                :class="{ 
                  'recording': store.isRecording && !store.isPaused, 
                  'paused': store.isPaused 
                }"
              >
                <span class="recording-icon">
                  <span v-if="!store.isRecording">🎤</span>
                  <span v-else-if="store.isPaused">⏸️</span>
                  <span v-else>🔴</span>
                </span>
              </div>
            </div>
            
            <div class="recording-info">
              <div class="recording-time">{{ store.formattedRecordingTime }}</div>
              <div class="recording-state-text">
                <span v-if="!store.isRecording">准备录音</span>
                <span v-else-if="store.isPaused">录音已暂停</span>
                <span v-else class="pulse">正在录音...</span>
              </div>
            </div>
          </div>

          <!-- 录音控制按钮 -->
          <div class="controls">
            <!-- 开始/停止录音 -->
            <div v-if="!store.isRecording" class="control-group">
              <button @click="startRecording" :disabled="isProcessing" class="btn btn-primary btn-large">
                <span class="btn-icon">🎤</span>
                开始录音
              </button>
            </div>
            
            <!-- 录音中的控制 -->
            <div v-else class="control-group recording-controls">
              <button 
                @click="togglePause" 
                :disabled="isProcessing" 
                class="btn btn-secondary"
              >
                <span class="btn-icon">{{ store.isPaused ? '▶️' : '⏸️' }}</span>
                {{ store.isPaused ? '继续' : '暂停' }}
              </button>
              
              <button 
                @click="stopRecording" 
                :disabled="isProcessing" 
                class="btn btn-danger"
              >
                <span class="btn-icon">⏹️</span>
                停止
              </button>
            </div>
          </div>
        </div>

        <!-- 保存录音对话框 -->
        <div v-if="showSaveDialog" class="save-dialog-overlay" @click="closeSaveDialog">
          <div class="save-dialog card" @click.stop>
            <h3>保存录音</h3>
            <div class="form-group">
              <label class="form-label">录音名称</label>
              <input 
                v-model="recordingName" 
                type="text" 
                class="form-input" 
                placeholder="输入录音名称"
                @keyup.enter="saveRecording"
                ref="nameInput"
              >
            </div>
            <div class="dialog-buttons">
              <button @click="closeSaveDialog" class="btn btn-secondary">取消</button>
              <button @click="saveRecording" :disabled="!recordingName.trim()" class="btn btn-primary">
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRecorderStore } from './store'
import SimpleRecorder from '../utils/simpleRecorder'

const store = useRecorderStore()
const recorder = new SimpleRecorder()

// 响应式数据
const isProcessing = ref(false)
const recordingTimer = ref(null)
const showSaveDialog = ref(false)
const recordingName = ref('')
const recordingData = ref(null)
const nameInput = ref(null)

// 组件挂载时初始化
onMounted(async () => {
  await store.loadFromStorage()
})

// 组件卸载时清理资源
onUnmounted(() => {
  cleanup()
})

// 开始录音
async function startRecording() {
  if (isProcessing.value) return
  
  try {
    isProcessing.value = true
    
    // 开始录音
    await recorder.startRecording()
    
    // 更新状态
    store.setRecordingState(true, false)
    
    // 开始计时器
    startTimer()
    
    console.log('录音开始')
    
  } catch (error) {
    console.error('开始录音失败:', error)
    store.setPermission(false, `开始录音失败: ${error.message}`)
  } finally {
    isProcessing.value = false
  }
}

// 暂停/恢复录音
async function togglePause() {
  if (isProcessing.value) return
  
  try {
    isProcessing.value = true
    
    if (store.isPaused) {
      await recorder.resumeRecording()
      store.setRecordingState(true, false)
      console.log('录音恢复')
    } else {
      await recorder.pauseRecording()
      store.setRecordingState(true, true)
      console.log('录音暂停')
    }
  } catch (error) {
    console.error('切换暂停状态失败:', error)
  } finally {
    isProcessing.value = false
  }
}

// 停止录音
async function stopRecording() {
  if (isProcessing.value) return
  
  try {
    isProcessing.value = true
    
    const audioData = await recorder.stopRecording()
    recordingData.value = audioData
    
    // 停止计时器
    stopTimer()
    
    // 更新状态
    store.setRecordingState(false, false)
    store.resetRecordingTime()
    
    console.log('录音停止', audioData)
    
    // 显示保存对话框
    showSaveDialog.value = true
    recordingName.value = `录音_${new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/[\s/:]/g, '_')}`
    
    // 聚焦到输入框
    await nextTick()
    if (nameInput.value) {
      nameInput.value.focus()
      nameInput.value.select()
    }
    
  } catch (error) {
    console.error('停止录音失败:', error)
    store.setPermission(false, `停止录音失败: ${error.message}`)
  } finally {
    isProcessing.value = false
  }
}

// 保存录音
async function saveRecording() {
  if (!recordingData.value || !recordingName.value.trim()) return
  
  try {
    const recording = {
      name: recordingName.value.trim(),
      duration: store.recordingTime,
      size: recordingData.value.size,
      audioUrl: recordingData.value.url,
      audioBlob: recordingData.value.blob
    }
    
    store.addRecording(recording)
    
    console.log('录音已保存:', recording.name)
    
    // 关闭对话框
    closeSaveDialog()
    
    // 显示成功消息
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('录音助手', {
        body: `录音 "${recording.name}" 已保存`,
        icon: 'icons/icon48.png'
      })
    }
    
  } catch (error) {
    console.error('保存录音失败:', error)
    store.setPermission(false, `保存录音失败: ${error.message}`)
  }
}

// 关闭保存对话框
function closeSaveDialog() {
  showSaveDialog.value = false
  recordingName.value = ''
  recordingData.value = null
}

// 开始计时器
function startTimer() {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }
  
  recordingTimer.value = setInterval(() => {
    if (!store.isPaused) {
      store.updateRecordingTime(store.recordingTime + 1)
      
      // 检查最大录音时长
      if (store.recordingTime >= store.settings.maxDuration * 60) {
        console.log('达到最大录音时长，自动停止')
        stopRecording()
      }
    }
  }, 1000)
}

// 停止计时器
function stopTimer() {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }
}

// 清理资源
function cleanup() {
  stopTimer()
  recorder.cleanup()
}
</script>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  padding: 16px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mic-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.version {
  font-size: 11px;
  opacity: 0.8;
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 12px;
}

.main {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.home {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn-large {
  padding: 16px 32px;
  font-size: 16px;
}

.recording-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recording-status {
  text-align: center;
}

.recording-visual {
  margin-bottom: 20px;
}

.recording-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecf0f1;
  border: 4px solid #bdc3c7;
  transition: all 0.3s ease;
}

.recording-circle.recording {
  background: #e74c3c;
  border-color: #c0392b;
  animation: pulse 1.5s infinite;
}

.recording-circle.paused {
  background: #f39c12;
  border-color: #e67e22;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.recording-icon {
  font-size: 36px;
  color: white;
}

.recording-circle:not(.recording):not(.paused) .recording-icon {
  color: #34495e;
}

.recording-time {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.recording-state-text {
  color: #7f8c8d;
  font-size: 14px;
}

.pulse {
  animation: textPulse 1s infinite;
}

@keyframes textPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.controls {
  display: flex;
  justify-content: center;
}

.control-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.recording-controls {
  flex-wrap: wrap;
  justify-content: center;
}

.btn-icon {
  font-size: 16px;
}

.save-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.save-dialog {
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.save-dialog h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #34495e;
  font-size: 14px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.dialog-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>