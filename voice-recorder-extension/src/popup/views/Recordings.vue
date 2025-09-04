<template>
  <div class="recordings">
    <div class="recordings-header">
      <div class="header-info">
        <h2>录音库</h2>
        <div class="recordings-stats">
          <span>{{ store.totalRecordings }} 个录音</span>
        </div>
      </div>
    </div>

    <!-- 录音列表 -->
    <div v-if="store.recordings.length === 0" class="empty-state">
      <div class="empty-icon">📂</div>
      <h3>暂无录音</h3>
      <p class="text-muted">开始录音后，您的录音将显示在这里</p>
      <button @click="$router.push('/')" class="btn btn-primary">
        🎤 开始录音
      </button>
    </div>

    <div v-else class="recordings-list">
      <div 
        v-for="recording in store.recordings" 
        :key="recording.id"
        class="recording-item card"
      >
        <div class="recording-info">
          <div class="recording-name">
            <span class="name-text">{{ recording.name }}</span>
          </div>
          
          <div class="recording-meta">
            <span class="duration">{{ formatTime(recording.duration) }}</span>
            <span class="separator">•</span>
            <span class="size">{{ formatFileSize(recording.size) }}</span>
            <span class="separator">•</span>
            <span class="date">{{ formatDate(recording.createdAt) }}</span>
          </div>
        </div>

        <!-- 播放控制 -->
        <div class="recording-controls">
          <button 
            @click="togglePlay(recording)"
            class="btn btn-sm btn-primary"
          >
            ▶️
          </button>
          
          <button 
            @click="deleteRecording(recording)" 
            class="btn btn-sm btn-danger"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRecorderStore } from '../store'
import { formatTime, formatFileSize, formatDate, chromeUtils } from '../../utils'

const store = useRecorderStore()

// 组件挂载
onMounted(async () => {
  await store.loadFromStorage()
})

// 播放录音
async function togglePlay(recording) {
  try {
    const audio = new Audio(recording.audioUrl)
    await audio.play()
  } catch (error) {
    console.error('播放失败:', error)
    await chromeUtils.showNotification('播放失败', error.message)
  }
}

// 删除录音
function deleteRecording(recording) {
  if (confirm(`确定要删除录音 "${recording.name}" 吗？`)) {
    store.deleteRecording(recording.id)
    chromeUtils.showNotification('删除成功', `录音 "${recording.name}" 已删除`)
  }
}
</script>

<style scoped>
.recordings {
  padding: 20px;
}

.recordings-header {
  margin-bottom: 20px;
}

.header-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.recordings-stats {
  color: #6c757d;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.recordings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recording-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.recording-info {
  flex: 1;
  min-width: 0;
}

.recording-name {
  margin-bottom: 4px;
}

.name-text {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.recording-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6c757d;
}

.separator {
  opacity: 0.5;
}

.recording-controls {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}
</style>