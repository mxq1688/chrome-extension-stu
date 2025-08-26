<template>
  <div class="settings">
    <div class="card">
      <h3 class="card-title">基本设置</h3>
      
      <div class="form-group">
        <label class="form-label">主题模式</label>
        <select class="form-control" v-model="settings.theme">
          <option value="light">浅色模式</option>
          <option value="dark">深色模式</option>
          <option value="auto">跟随系统</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">语言设置</label>
        <select class="form-control" v-model="settings.language">
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">
          <input type="checkbox" v-model="settings.autoStart"> 
          开机自启动
        </label>
      </div>
    </div>
    
    <div class="card">
      <h3 class="card-title">功能设置</h3>
      
      <div class="form-group">
        <label class="form-label">
          <input type="checkbox" v-model="settings.enableNotifications"> 
          启用通知
        </label>
      </div>
      
      <div class="form-group">
        <label class="form-label">
          <input type="checkbox" v-model="settings.enableSync"> 
          同步设置到云端
        </label>
      </div>
      
      <div class="form-group">
        <label class="form-label">更新检查频率</label>
        <select class="form-control" v-model="settings.updateFrequency">
          <option value="daily">每日</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
          <option value="never">从不</option>
        </select>
      </div>
    </div>
    
    <div class="card">
      <h3 class="card-title">数据管理</h3>
      <div class="action-buttons">
        <button class="btn" @click="exportSettings">导出设置</button>
        <button class="btn" @click="importSettings">导入设置</button>
        <button class="btn" @click="resetSettings">重置设置</button>
      </div>
    </div>
    
    <div class="save-section">
      <button class="btn btn-primary" @click="saveSettings">保存设置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useExtensionStore } from '../store/extension'

const extensionStore = useExtensionStore()

const settings = ref({
  theme: 'light',
  language: 'zh-CN',
  autoStart: false,
  enableNotifications: true,
  enableSync: false,
  updateFrequency: 'weekly'
})

const loadSettings = async () => {
  try {
    const result = await chrome.storage.sync.get('settings')
    if (result.settings) {
      settings.value = { ...settings.value, ...result.settings }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

const saveSettings = async () => {
  try {
    await chrome.storage.sync.set({ settings: settings.value })
    extensionStore.showMessage('设置已保存', 'success')
  } catch (error) {
    console.error('保存设置失败:', error)
    extensionStore.showMessage('保存失败', 'error')
  }
}

const exportSettings = () => {
  const dataStr = JSON.stringify(settings.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'extension-settings.json'
  link.click()
  URL.revokeObjectURL(url)
}

const importSettings = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result)
          settings.value = { ...settings.value, ...importedSettings }
          extensionStore.showMessage('设置已导入', 'success')
        } catch (error) {
          extensionStore.showMessage('导入失败，文件格式错误', 'error')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const resetSettings = () => {
  if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
    settings.value = {
      theme: 'light',
      language: 'zh-CN',
      autoStart: false,
      enableNotifications: true,
      enableSync: false,
      updateFrequency: 'weekly'
    }
    extensionStore.showMessage('设置已重置', 'success')
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings {
  padding: 16px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group input[type="checkbox"] {
  margin: 0;
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

.save-section {
  margin-top: 20px;
  text-align: center;
}

.save-section .btn {
  width: 100%;
}
</style>