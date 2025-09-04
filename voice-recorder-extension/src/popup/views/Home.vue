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
import AudioRecorder from '../../utils/audioRecorder'
import { chromeUtils } from '../../utils'

const store = useRecorderStore()
const recorder = new AudioRecorder()

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
    const permission = await navigator.permissions.query({ name: 'microphone' })
    if (permission.state === 'granted') {
      store.setPermission(true)
    } else {
      store.setPermission(false)
    }
  } catch (error) {
    store.setPermission(false)
  } finally {
    isCheckingPermission.value = false
  }
}

// 其他方法省略...
function cleanup() {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }
  recorder.cleanup()
}
</script>

<style scoped>
.home { padding: 20px; }
.permission-card { text-align: center; padding: 40px 20px; }
.permission-icon { font-size: 48px; margin-bottom: 16px; }
.recording-section { display: flex; flex-direction: column; gap: 20px; }
.recording-circle { width: 120px; height: 120px; border-radius: 50%; }
</style>