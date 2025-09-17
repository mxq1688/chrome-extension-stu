<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">🎙️</div>
          <div class="logo-text">
          <h1>录音助手</h1>
            <p>Voice Recorder</p>
          </div>
        </div>
      </div>
    </header>
    
    <main class="app-main">
      <transition name="page-transition" mode="out-in">
        <router-view />
      </transition>

      <!-- 保存录音对话框 -->
      <div v-if="showSaveDialog" class="save-dialog-overlay" @click="closeSaveDialog">
        <div class="save-dialog" @click.stop>
          <div class="dialog-header">
          <h3>保存录音</h3>
            <button @click="closeSaveDialog" class="close-btn">×</button>
          </div>
          <div class="dialog-content">
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
          </div>
          <div class="dialog-actions">
            <button @click="closeSaveDialog" class="btn btn-secondary">取消</button>
            <button @click="saveRecording" :disabled="!recordingName.trim()" class="btn btn-primary">
              保存录音
            </button>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 底部导航 -->
    <nav class="bottom-navigation">
      <button 
        :class="{active: $route.path === '/record'}" 
        @click="$router.push('/record')"
        class="nav-button"
      >
        <div class="nav-icon">🎙️</div>
        <div class="nav-label">录音</div>
      </button>
      <button 
        :class="{active: $route.path === '/list'}" 
        @click="$router.push('/list')"
        class="nav-button"
      >
        <div class="nav-icon">📂</div>
        <div class="nav-label">列表</div>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRecorderStore } from './store'
import SimpleRecorder from '../utils/simpleRecorder'
import lamejs from 'lamejs'

const store = useRecorderStore()
const recorder = new SimpleRecorder()

// 响应式数据
const isProcessing = ref(false)
const recordingTimer = ref(null)
const showSaveDialog = ref(false)
const recordingName = ref('')
const recordingData = ref(null)
const nameInput = ref(null)
const level = ref(0)
const vizCanvas = ref(null)
let vizRaf = null

function setSource(src) {
  store.updateSettings({ inputSource: src })
}

function updateSetting(key, val) {
  store.updateSettings({ [key]: val })
}

// 组件挂载时初始化
onMounted(async () => {
  await store.loadFromStorage()
})


// 组件卸载时清理资源
onUnmounted(() => {
  cleanup()
})



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
      await recorder.startRecording(store.settings?.inputSource || 'mix')
      store.setRecordingState(true, false)
      startTimer()
      console.log('录音开始')
      recorder.onLevel(v => level.value = v)
      startVisualizer()
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
      
      const defaultName = `录音_${new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/[\s/:]/g, '_')}`
      
      // 若开启自动保存，则直接保存；否则弹出命名对话框
      if (store.settings && store.settings.autoSave) {
        await saveRecordingDirect(defaultName)
      } else {
        showSaveDialog.value = true
        recordingName.value = defaultName
      await nextTick()
      if (nameInput.value) {
        nameInput.value.focus()
        nameInput.value.select()
        }
      }
    }
  } catch (error) {
    console.error('录音操作失败:', error)
    // 如果是用户关闭/忽略授权导致的 NotAllowedError: Permission dismissed，则引导到固定页授权
    const isDismissed = (error && error.name === 'NotAllowedError' && (error._dismissed === true || /Permission dismissed/i.test(String(error.message))))
    if (isDismissed && typeof chrome !== 'undefined') {
      try {
        const helperUrl = chrome.runtime?.getURL ? chrome.runtime.getURL('permission-helper.html') : 'permission-helper.html'
        console.log('尝试打开权限助手页:', helperUrl)
        if (chrome?.tabs?.create) {
          chrome.tabs.create({ url: helperUrl, active: true }, (tab) => {
            if (chrome.runtime.lastError) {
              console.warn('tabs.create 失败，尝试 windows.create:', chrome.runtime.lastError)
              if (chrome?.windows?.create) {
                chrome.windows.create({ url: helperUrl, focused: true, type: 'popup' }, () => {
                  window.close()
                })
              }
            } else {
              window.close()
            }
          })
          return
        } else if (chrome?.windows?.create) {
          chrome.windows.create({ url: helperUrl, focused: true, type: 'popup' }, () => {
            window.close()
          })
          return
        }
      } catch (e) {
        console.error('打开权限助手页失败:', e)
      }
    }
  } finally {
    isProcessing.value = false
  }
}

function startVisualizer() {
  stopVisualizer()
  const canvas = vizCanvas.value
  if (!canvas || !recorder.analyser) return
  const ctx = canvas.getContext('2d')
  const analyser = recorder.analyser
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  const bars = 32
  const gap = 3
  const draw = () => {
    analyser.getByteFrequencyData(dataArray)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const barWidth = (canvas.width - (bars - 1) * gap) / bars
    for (let i = 0; i < bars; i++) {
      const idx = Math.floor(i * (bufferLength / bars))
      const v = dataArray[idx] / 255
      const h = Math.max(2, v * canvas.height)
      const x = i * (barWidth + gap)
      const y = canvas.height - h
      const grd = ctx.createLinearGradient(0, y, 0, canvas.height)
      grd.addColorStop(0, '#55efc4')
      grd.addColorStop(1, '#ff7675')
      ctx.fillStyle = grd
      ctx.fillRect(x, y, barWidth, h)
      ctx.roundRect?.(x, y, barWidth, h, 4)
    }
    vizRaf = requestAnimationFrame(draw)
  }
  vizRaf = requestAnimationFrame(draw)
}

function stopVisualizer() {
  if (vizRaf) { cancelAnimationFrame(vizRaf); vizRaf = null }
  const canvas = vizCanvas.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx && ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

// 保存录音
async function saveRecording() {
  if (!recordingData.value || !recordingName.value.trim()) return
  
  try {
    await saveRecordingDirect(recordingName.value.trim())
  } catch (error) {
    console.error('保存录音失败:', error)
  }
}

// 直接保存（用于自动保存和命名确认后保存）
async function saveRecordingDirect(name) {
  if (!recordingData.value) return
    const recording = {
    name,
      duration: store.recordingTime,
      size: recordingData.value.size,
      audioUrl: recordingData.value.url,
      audioBlob: recordingData.value.blob
    }
    store.addRecording(recording)
    console.log('录音已保存:', recording.name)
  // 触发下载
  try {
    await downloadRecording(recording)
  } catch (e) {
    console.error('下载录音失败:', e)
  }
    closeSaveDialog()
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('录音助手', {
        body: `录音 "${recording.name}" 已保存`,
        icon: 'icons/icon48.png'
      })
    }
}

// 触发下载
async function downloadRecording(recording) {
  const safeName = `${(recording.name || '录音').replace(/[^\w\u4e00-\u9fa5\-_. ]+/g, '_')}.webm`
  const url = recording.audioUrl
  // 优先使用 chrome.downloads.download
  if (typeof chrome !== 'undefined' && chrome?.downloads?.download) {
    try {
      await chrome.downloads.download({
        url,
        filename: `recordings/${safeName}`,
        saveAs: true
      })
      return
    } catch (err) {
      console.warn('chrome.downloads.download 失败，使用 <a> 兜底:', err)
    }
  }
  // 兜底：使用 a[download]
  const a = document.createElement('a')
  a.href = url
  a.download = safeName
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
  }, 0)
}

// 下载为 WEBM（原始）
function downloadWebm(rec) {
  const url = rec.audioUrl || (rec.audioBlob ? URL.createObjectURL(rec.audioBlob) : '')
  if (!url) return
  downloadByUrl(url, `${sanitize(rec.name)}.webm`)
}

// 下载为 WAV
async function downloadWav(rec) {
  if (!rec.audioBlob) return downloadWebm(rec)
  const arrayBuffer = await rec.audioBlob.arrayBuffer()
  const audioBuffer = await decodeAudio(arrayBuffer)
  const wavBlob = encodeWav(audioBuffer)
  const url = URL.createObjectURL(wavBlob)
  downloadByUrl(url, `${sanitize(rec.name)}.wav`)
}

// 下载为 MP3（lamejs）
async function downloadMp3(rec) {
  if (!rec.audioBlob) return downloadWebm(rec)
  const arrayBuffer = await rec.audioBlob.arrayBuffer()
  const audioBuffer = await decodeAudio(arrayBuffer)
  const mp3Blob = encodeMp3(audioBuffer)
  const url = URL.createObjectURL(mp3Blob)
  downloadByUrl(url, `${sanitize(rec.name)}.mp3`)
}

function downloadByUrl(url, filename) {
  if (typeof chrome !== 'undefined' && chrome?.downloads?.download) {
    chrome.downloads.download({ url, filename: makePath(filename), saveAs: true }, () => {})
  } else {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => document.body.removeChild(a), 0)
  }
}

function sanitize(name) {
  return (name || '录音').replace(/[^\w\u4e00-\u9fa5\-_. ]+/g, '_')
}

function makePath(filename) {
  const dir = store?.settings?.downloadDir || 'recordings'
  return `${dir}/${filename}`
}

async function decodeAudio(arrayBuffer) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  return await ctx.decodeAudioData(arrayBuffer)
}

function encodeWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const samples = interleaveChannels(audioBuffer)
  const wavBuffer = encodeWavBuffer(samples, numChannels, sampleRate)
  return new Blob([wavBuffer], { type: 'audio/wav' })
}

function interleaveChannels(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const length = audioBuffer.length * numChannels
  const result = new Float32Array(length)
  for (let ch = 0; ch < numChannels; ch++) {
    const data = audioBuffer.getChannelData(ch)
    for (let i = 0; i < audioBuffer.length; i++) {
      result[i * numChannels + ch] = data[i]
    }
  }
  return result
}

function encodeWavBuffer(samples, numChannels, sampleRate) {
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bytesPerSample * 8, true)
  writeString(view, 36, 'data')
  view.setUint32(40, samples.length * bytesPerSample, true)

  floatTo16BitPCM(view, 44, samples)
  return view
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function floatTo16BitPCM(view, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
}

function encodeMp3(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128)
  const samples = []
  for (let ch = 0; ch < numChannels; ch++) {
    samples.push(audioBuffer.getChannelData(ch))
  }
  const left = samples[0]
  const right = numChannels > 1 ? samples[1] : samples[0]
  const blockSize = 1152
  let mp3Data = []
  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = floatTo16(left.subarray(i, i + blockSize))
    const rightChunk = floatTo16(right.subarray(i, i + blockSize))
    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk)
    if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf))
  }
  const end = mp3encoder.flush()
  if (end.length > 0) mp3Data.push(new Int8Array(end))
  return new Blob(mp3Data, { type: 'audio/mpeg' })
}

function floatTo16(float32Array) {
  const buf = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]))
    buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return buf
}

// 辅助：格式化
function formatSize(size) {
  const s = Number(size || 0)
  if (s < 1024) return `${s} B`
  if (s < 1024 * 1024) return `${(s / 1024).toFixed(1)} KB`
  return `${(s / 1024 / 1024).toFixed(2)} MB`
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleString('zh-CN') } catch { return '' }
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
  stopVisualizer()
}
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f8f9fa;
  color: #333;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 应用容器 */
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

/* 应用头部 */
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  position: relative;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  font-size: 1.25rem;
  background: rgba(255, 255, 255, 0.2);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.logo-text h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.logo-text p {
  font-size: 0.75rem;
  opacity: 0.8;
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* 主内容区域 */
.app-main {
  flex: 1;
  overflow: auto;
  position: relative;
  background: #f8f9fa;
  padding-bottom: 76px; /* 避免被底部导航遮挡 */
}

/* 保存对话框样式 */
.save-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  animation: overlayFadeIn 0.3s ease-out;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.save-dialog {
  background: white;
  border-radius: 20px;
  width: 320px;
  max-width: 90vw;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: dialogSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f7fafc;
  color: #4a5568;
}

.dialog-content {
  padding: 0 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
  background: #f7fafc;
}

.form-input:focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 0 24px 24px 24px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  min-width: 80px;
}

.btn-secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 底部导航 */
.bottom-navigation {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  gap: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 20;
}

.nav-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: #a0aec0;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  min-width: 80px;
  position: relative;
}

.nav-button:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  transform: translateY(-2px);
}

.nav-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.nav-button.active::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: #667eea;
  border-radius: 50%;
}

.nav-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 页面过渡动画 */
.page-transition-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.page-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 响应式设计 */
@media (max-width: 320px) {
  .app {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
  
  .logo {
    gap: 12px;
  }
  
  .logo-icon {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }
  
  .logo-text h1 {
    font-size: 1.25rem;
  }
  
  .bottom-navigation {
    padding: 8px 12px;
    gap: 12px;
  }
  
  .nav-button {
    padding: 8px 16px;
    min-width: 70px;
  }
}
</style>