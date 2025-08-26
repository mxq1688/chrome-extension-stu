<template>
  <div class="home">
    <div class="card">
      <h3 class="card-title">当前标签页信息</h3>
      <div class="info-item">
        <strong>URL:</strong> {{ currentTab.url || '获取中...' }}
      </div>
      <div class="info-item">
        <strong>标题:</strong> {{ currentTab.title || '获取中...' }}
      </div>
    </div>
    
    <div class="card">
      <h3 class="card-title">快捷操作</h3>
      <div class="action-buttons">
        <button class="btn btn-primary" @click="refreshTab">刷新页面</button>
        <button class="btn" @click="openDevTools">开发者工具</button>
        <button class="btn" @click="captureTab">截图</button>
      </div>
    </div>
    
    <div class="card">
      <h3 class="card-title">插件状态</h3>
      <div class="status-item">
        <span class="status-dot" :class="{ active: isActive }"></span>
        <span>{{ isActive ? '已启用' : '已禁用' }}</span>
        <button class="btn btn-sm" @click="toggleStatus">
          {{ isActive ? '禁用' : '启用' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useExtensionStore } from '../store/extension'

const extensionStore = useExtensionStore()

const currentTab = ref({})
const isActive = ref(true)

const getCurrentTab = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentTab.value = tab
  } catch (error) {
    console.error('获取当前标签页失败:', error)
  }
}

const refreshTab = async () => {
  try {
    await chrome.tabs.reload()
    window.close()
  } catch (error) {
    console.error('刷新页面失败:', error)
  }
}

const openDevTools = async () => {
  try {
    await chrome.tabs.create({ url: 'chrome://inspect/#devices' })
  } catch (error) {
    console.error('打开开发者工具失败:', error)
  }
}

const captureTab = async () => {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab()
    const link = document.createElement('a')
    link.download = `screenshot-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('截图失败:', error)
  }
}

const toggleStatus = () => {
  isActive.value = !isActive.value
  extensionStore.setActive(isActive.value)
}

onMounted(() => {
  getCurrentTab()
  isActive.value = extensionStore.isActive
})
</script>

<style scoped>
.home {
  padding: 16px;
}

.info-item, .status-item {
  margin-bottom: 8px;
  font-size: 13px;
}

.info-item strong {
  color: #495057;
  margin-right: 8px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-buttons .btn {
  flex: 1;
  min-width: 80px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
  transition: background-color 0.2s;
}

.status-dot.active {
  background: #28a745;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
  margin-left: auto;
}
</style>