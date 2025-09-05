<template>
  <div class="home">
    <!-- 权限提示 -->
    <div v-if="!store.hasPermission && !isCheckingPermission" class="permission-card card">
      <div class="permission-icon">🎤</div>
      <h3>需要麦克风权限</h3>
      <p class="text-muted">请允许访问麦克风以开始录音</p>
      <button @click="requestPermission" :disabled="isRequestingPermission" class="btn btn-primary">
        <span v-if="isRequestingPermission">请求中...</span>
        <span v-else>🔓 授权麦克风</span>
      </button>
      
      <!-- 权限帮助按钮 -->
      <button v-if="store.permissionError" @click="openPermissionHelper" class="btn btn-secondary mt-8">
        🆘 权限帮助
      </button>
      
      <div v-if="store.permissionError" class="error-text mt-16">
        {{ store.permissionError }}
      </div>

    </div>

    <!-- 录音控制区域 -->
    <div v-else class="recording-section">
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

      <!-- 快速操作 -->
      <div class="quick-actions">
        <div class="action-item" @click="$router.push('/recordings')">
          <span class="action-icon">📂</span>
          <span>录音库 ({{ store.totalRecordings }})</span>
        </div>
        
        <div class="action-item" @click="$router.push('/settings')">
          <span class="action-icon">⚙️</span>
          <span>设置</span>
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
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRecorderStore } from '../store'
import SimpleRecorder from '../../utils/simpleRecorder'
import { chromeUtils } from '../../utils'

const store = useRecorderStore()
const recorder = new SimpleRecorder()

// 响应式数据
const isCheckingPermission = ref(true)
const isRequestingPermission = ref(false)
const isProcessing = ref(false)
const recordingTimer = ref(null)
const showSaveDialog = ref(false)
const recordingName = ref('')

const recordingData = ref(null)
const nameInput = ref(null)

// 组件挂载时检查权限
onMounted(async () => {
  await checkInitialPermission()
  await store.loadFromStorage()
})

// 组件卸载时清理资源
onUnmounted(() => {
  cleanup()
})

// 检查初始权限状态
async function checkInitialPermission() {
  try {
    isCheckingPermission.value = true
    
    // 检查麦克风权限状态
    const permissionState = await recorder.checkPermission()
    
    if (permissionState === 'granted') {
      store.setPermission(true, '')
    } else {
      store.setPermission(false, '')
    }
  } catch (error) {
    console.error('权限检查错误:', error)
    store.setPermission(false)
  } finally {
    isCheckingPermission.value = false
  }
}

// 请求麦克风权限
async function requestPermission() {
  if (isRequestingPermission.value) return
  
  try {
    isRequestingPermission.value = true
    store.setPermission(false, '')
    
    console.log('开始请求麦克风权限...')
    
    // 检查浏览器支持
    if (!recorder.isSupported()) {
      throw new Error('您的浏览器不支持录音功能')
    }
    
    // 方法1: 尝试直接在popup中请求权限
    try {
      console.log('尝试直接请求权限...')
      await recorder.requestPermissionAndStart()
      
      // 权限获取成功
      store.setPermission(true)
      console.log('麦克风权限获取成功')
      
      // 显示成功通知
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('录音助手', {
          body: '麦克风权限已授权，可以开始录音了！',
          icon: 'icons/icon48.png'
        })
      }
      return
    } catch (directError) {
      console.log('直接请求失败，尝试通过content script...', directError)
      
      // 方法2: 通过content script请求权限
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab && tab.id) {
          // 注入content script并请求权限
          await chrome.tabs.sendMessage(tab.id, {
            type: 'REQUEST_MICROPHONE_PERMISSION'
          })
          
          // 等待一下让用户看到权限对话框
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // 重新检查权限状态
          const permissionState = await recorder.checkPermission()
          if (permissionState === 'granted') {
            store.setPermission(true)
            console.log('通过content script获取权限成功')
            return
          }
        }
      } catch (contentError) {
        console.log('Content script方式也失败了:', contentError)
      }
      
      // 如果都失败了，抛出原始错误
      throw directError
    }
    
  } catch (error) {
    console.error('权限请求失败:', error)
    store.setPermission(false)
    store.setPermission(false, error.message)
    
    // 显示详细的错误提示
    let userFriendlyMessage = error.message
    if (error.message.includes('NotAllowedError') || error.message.includes('拒绝') || error.message.includes('denied')) {
      userFriendlyMessage = '麦克风权限被拒绝\n\n解决方法：\n1. 点击浏览器地址栏左侧的🔒图标\n2. 将"麦克风"设置为"允许"\n3. 刷新页面后重试'
    } else if (error.message.includes('NotFoundError')) {
      userFriendlyMessage = '未检测到麦克风设备\n请检查您的麦克风是否正确连接'
    } else if (error.message.includes('NotReadableError')) {
      userFriendlyMessage = '麦克风被其他程序占用\n请关闭其他使用麦克风的程序后重试'
    } else if (error.message.includes('popup')) {
      userFriendlyMessage = '在扩展中请求权限受限\n\n请按以下步骤操作：\n1. 打开任意网页\n2. 点击地址栏的🔒图标\n3. 允许麦克风访问\n4. 回到扩展重试'
    }
    
    store.setPermission(false, userFriendlyMessage)
  } finally {
    isRequestingPermission.value = false
  }
}

// 打开权限帮助页面
function openPermissionHelper() {
  // 在新标签页中打开权限帮助页面
  chrome.tabs.create({
    url: chrome.runtime.getURL('permission-helper.html')
  })
}

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

.permission-card {
  text-align: center;
  padding: 40px 20px;
}

.permission-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.permission-card h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 20px;
}

.text-muted {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 24px;
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

.error-text {
  color: #e74c3c;
  font-size: 13px;
  line-height: 1.4;
}

.mt-8 {
  margin-top: 8px;
}

.mt-16 {
  margin-top: 16px;
}

.page-support-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.warning-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-weight: 600;
  color: #856404;
  font-size: 13px;
  margin-bottom: 4px;
}

.warning-message {
  color: #856404;
  font-size: 12px;
  line-height: 1.4;
}

.suggestions {
  margin-top: 8px;
}

.suggestions-title {
  font-weight: 600;
  color: #856404;
  font-size: 12px;
  margin-bottom: 4px;
}

.suggestions-list {
  margin: 0;
  padding-left: 16px;
  color: #856404;
  font-size: 11px;
  line-height: 1.3;
}

.suggestions-list li {
  margin-bottom: 2px;
}

.mt-16 {
  margin-top: 16px;
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

.quick-actions {
  display: flex;
  gap: 12px;
}

.action-item {
  flex: 1;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #34495e;
}

.action-item:hover {
  background: #e9ecef;
}

.action-icon {
  font-size: 20px;
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