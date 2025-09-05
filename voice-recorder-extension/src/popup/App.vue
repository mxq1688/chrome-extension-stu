<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="mic-icon">🎙️</span>
          <h1>录音助手</h1>
        </div>
      </div>
    </header>
    
    <main class="main">
      <div class="recording-container">
        <!-- 录音状态显示 -->
        <div class="recording-status">
          <div class="recording-time">{{ store.formattedRecordingTime }}</div>
        </div>

        <!-- 单一录音按钮 -->
        <div class="recording-control">
          <button 
            @click="toggleRecording" 
            :disabled="isProcessing" 
            class="record-btn"
            :class="{
              'recording': store.isRecording && !store.isPaused,
              'paused': store.isPaused
            }"
          >
            <span class="btn-icon">
              <span v-if="!store.isRecording">🎤</span>
              <span v-else-if="store.isPaused">▶️</span>
              <span v-else>⏹️</span>
            </span>
            <span class="btn-text">
              <span v-if="!store.isRecording">开始录音</span>
              <span v-else-if="store.isPaused">继续录音</span>
              <span v-else>停止录音</span>
            </span>
          </button>
        </div>
        
        <!-- 权限重置按钮 -->
        <div class="permission-reset">
          <button @click="resetPermissions" class="reset-btn" title="解决麦克风权限问题">
            🔧 权限问题？点击获取解决方案
          </button>
        </div>
      </div>

      <!-- 保存录音对话框 -->
      <div v-if="showSaveDialog" class="save-dialog-overlay" @click="closeSaveDialog">
        <div class="save-dialog" @click.stop>
          <h3>保存录音</h3>
          <div class="form-group">
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

// 权限重置功能
async function resetPermissions() {
  console.log('🔄 尝试重置麦克风权限...')
  
  try {
    // 显示详细的权限重置指导
    const resetInstructions = `🚨 权限重置指导：

📍 方法1 - 扩展界面：
1️⃣ 看地址栏左侧的 🔒 图标
2️⃣ 点击它，找到 "麦克风"
3️⃣ 改为 "允许"

📍 方法2 - Chrome设置：
1️⃣ 新标签页输入: chrome://settings/content/microphone
2️⃣ 删除 "阻止" 列表中的此扩展
3️⃣ 重新尝试录音

📍 方法3 - 重装扩展：
1️⃣ chrome://extensions/ 删除此扩展
2️⃣ 重新加载扩展文件夹
3️⃣ 首次使用选择 "允许"

🎯 完成后点击录音按钮测试！`
    
    alert(resetInstructions)
    
  } catch (error) {
    console.error('权限重置失败:', error)
  }
}

// 统一的录音控制函数
async function toggleRecording() {
  console.log('🎤 toggleRecording函数被调用！')
  console.log('当前状态 - isProcessing:', isProcessing.value, 'isRecording:', store.isRecording, 'isPaused:', store.isPaused)
  
  if (isProcessing.value) {
    console.log('❌ 正在处理中，忽略点击')
    return
  }
  
  try {
    console.log('✅ 开始处理录音操作...')
    isProcessing.value = true
    
    if (!store.isRecording) {
      // 开始录音
      await recorder.startRecording()
      store.setRecordingState(true, false)
      startTimer()
      console.log('录音开始')
    } else if (store.isPaused) {
      // 继续录音
      await recorder.resumeRecording()
      store.setRecordingState(true, false)
      console.log('录音继续')
    } else {
      // 停止录音
      const audioData = await recorder.stopRecording()
      recordingData.value = audioData
      
      stopTimer()
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
      
      await nextTick()
      if (nameInput.value) {
        nameInput.value.focus()
        nameInput.value.select()
      }
    }
  } catch (error) {
    console.error('录音操作失败:', error)
    store.setPermission(false, `录音操作失败: ${error.message}`)
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
    
    closeSaveDialog()
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('录音助手', {
        body: `录音 "${recording.name}" 已保存`,
        icon: 'icons/icon48.png'
      })
    }
  } catch (error) {
    console.error('保存录音失败:', error)
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
      
      if (store.recordingTime >= store.settings.maxDuration * 60) {
        console.log('达到最大录音时长，自动停止')
        toggleRecording()
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
  padding: 12px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mic-icon {
  font-size: 20px;
}

.header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.recording-container {
  text-align: center;
  max-width: 300px;
  width: 100%;
}

.recording-status {
  margin-bottom: 30px;
}

.recording-time {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
  font-family: 'Monaco', 'Consolas', monospace;
}

.recording-control {
  display: flex;
  justify-content: center;
}

.record-btn {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  background: #3498db;
  color: white;
  box-shadow: 0 4px 20px rgba(52, 152, 219, 0.3);
}

.record-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(52, 152, 219, 0.4);
}

.record-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.record-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.record-btn.recording {
  background: #e74c3c;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.3);
  animation: pulse 2s infinite;
}

.record-btn.paused {
  background: #f39c12;
  box-shadow: 0 4px 20px rgba(243, 156, 18, 0.3);
}

@keyframes pulse {
  0% { 
    transform: scale(1); 
    box-shadow: 0 4px 20px rgba(231, 76, 60, 0.3);
  }
  50% { 
    transform: scale(1.02); 
    box-shadow: 0 6px 25px rgba(231, 76, 60, 0.5);
  }
  100% { 
    transform: scale(1); 
    box-shadow: 0 4px 20px rgba(231, 76, 60, 0.3);
  }
}

.btn-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.btn-text {
  font-size: 12px;
  line-height: 1;
}

/* 保存对话框样式 */
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
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 320px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.save-dialog h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  text-align: center;
  font-size: 18px;
}

.form-group {
  margin-bottom: 20px;
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

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
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

/* 权限重置按钮样式 */
.permission-reset {
  margin-top: 15px;
  text-align: center;
}

.reset-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
  font-weight: 500;
}

.reset-btn:hover {
  background: linear-gradient(135deg, #c0392b, #a93226);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.reset-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);
}
</style>