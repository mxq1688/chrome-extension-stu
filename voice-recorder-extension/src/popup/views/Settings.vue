<template>
  <div class="settings">
    <div class="settings-header">
      <h2>设置</h2>
    </div>

    <div class="settings-content">
      <!-- 录音质量 -->
      <div class="setting-group card">
        <div class="setting-header">
          <h3>录音质量</h3>
          <p class="setting-desc">选择录音的音频质量</p>
        </div>
        
        <div class="setting-options">
          <label class="radio-option">
            <input 
              type="radio" 
              v-model="settings.audioQuality" 
              value="high"
              @change="saveSettings"
            >
            <span class="radio-label">
              <strong>高质量</strong>
              <span class="quality-desc">128 kbps - 最佳音质</span>
            </span>
          </label>
          
          <label class="radio-option">
            <input 
              type="radio" 
              v-model="settings.audioQuality" 
              value="medium"
              @change="saveSettings"
            >
            <span class="radio-label">
              <strong>中等质量</strong>
              <span class="quality-desc">64 kbps - 平衡音质和文件大小</span>
            </span>
          </label>
          
          <label class="radio-option">
            <input 
              type="radio" 
              v-model="settings.audioQuality" 
              value="low"
              @change="saveSettings"
            >
            <span class="radio-label">
              <strong>低质量</strong>
              <span class="quality-desc">32 kbps - 最小文件大小</span>
            </span>
          </label>
        </div>
      </div>

      <!-- 录音时长限制 -->
      <div class="setting-group card">
        <div class="setting-header">
          <h3>最大录音时长</h3>
          <p class="setting-desc">设置单次录音的最大时长</p>
        </div>
        
        <div class="setting-control">
          <select 
            v-model="settings.maxRecordingTime" 
            @change="saveSettings"
            class="form-select"
          >
            <option :value="60">1 分钟</option>
            <option :value="300">5 分钟</option>
            <option :value="600">10 分钟</option>
            <option :value="1800">30 分钟</option>
            <option :value="3600">1 小时</option>
          </select>
        </div>
      </div>

      <!-- 自动保存 -->
      <div class="setting-group card">
        <div class="setting-header">
          <h3>自动保存</h3>
          <p class="setting-desc">录音结束后自动保存，无需手动命名</p>
        </div>
        
        <div class="setting-control">
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="settings.autoSave"
              @change="saveSettings"
            >
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="setting-group card">
        <div class="setting-header">
          <h3>显示通知</h3>
          <p class="setting-desc">在重要操作时显示系统通知</p>
        </div>
        
        <div class="setting-control">
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="settings.showNotifications"
              @change="saveSettings"
            >
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 关于信息 -->
    <div class="about-section">
      <div class="about-header">
        <h3>关于</h3>
      </div>
      
      <div class="about-content card">
        <div class="app-info">
          <div class="app-icon">🎙️</div>
          <div class="app-details">
            <h4>录音助手</h4>
            <p class="version">版本 1.0.0</p>
            <p class="description">功能强大的录音浏览器扩展</p>
          </div>
        </div>
        
        <div class="app-stats">
          <div class="stat-item">
            <span class="stat-value">{{ store.totalRecordings }}</span>
            <span class="stat-label">个录音</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatTotalSize }}</span>
            <span class="stat-label">总大小</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRecorderStore } from '../store'
import { formatFileSize } from '../../utils'

const store = useRecorderStore()

// 本地设置副本
const settings = ref({
  audioQuality: 'high',
  maxRecordingTime: 300,
  autoSave: true,
  showNotifications: true
})

// 计算总文件大小
const formatTotalSize = computed(() => {
  const totalSize = store.recordings.reduce((total, recording) => total + recording.size, 0)
  return formatFileSize(totalSize)
})

// 组件挂载时加载设置
onMounted(async () => {
  await store.loadFromStorage()
  settings.value = { ...store.settings }
})

// 保存设置
function saveSettings() {
  store.updateSettings(settings.value)
}

// 监听 store 中的设置变化
watch(() => store.settings, (newSettings) => {
  settings.value = { ...newSettings }
}, { deep: true })
</script>

<style scoped>
.settings {
  padding: 20px;
}

.settings-header {
  margin-bottom: 20px;
}

.settings-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.setting-group {
  padding: 20px;
}

.setting-header {
  margin-bottom: 16px;
}

.setting-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.setting-desc {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
}

.setting-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.radio-option:hover {
  background: #f8f9fa;
}

.radio-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quality-desc {
  font-size: 12px;
  color: #6c757d;
}

.setting-control {
  display: flex;
  justify-content: flex-end;
}

.form-select {
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #ff6b6b;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.2s;
  border-radius: 12px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #ff6b6b;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* 关于部分 */
.about-section {
  margin-top: 32px;
}

.about-header h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.about-content {
  padding: 20px;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.app-icon {
  font-size: 36px;
}

.app-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.version {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #6c757d;
}

.description {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
}

.app-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #ff6b6b;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
}
</style>