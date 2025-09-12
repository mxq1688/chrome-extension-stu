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
      <transition name="slide-fade" mode="out-in">
        <router-view />
      </transition>

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
    
    <!-- 底部切换导航 -->
    <nav class="bottom-nav">
      <button :class="{active: $route.path === '/record'}" @click="$router.push('/record')"><span class="nav-ico">🎙️</span><span>录音</span></button>
      <button :class="{active: $route.path === '/list'}" @click="$router.push('/list')"><span class="nav-ico">📂</span><span>列表</span></button>
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

.source-toggle { display: flex; gap: 8px; justify-content: center; margin: 6px 0 18px; }
.toggle-btn {
  padding: 6px 10px; border-radius: 999px; border: 1px solid #dfe6e9; background: #fff; color: #2d3436; font-size: 12px; cursor: pointer; transition: all .2s ease;
}
.toggle-btn:hover { box-shadow: 0 4px 10px rgba(0,0,0,.06); }
.toggle-btn.active { background: #3498db; color: #fff; border-color: #3498db; }

.audio-controls { display:flex; gap:12px; justify-content:center; margin: 6px 0; flex-wrap: wrap; }
.audio-controls .switch { font-size: 12px; color: #2d3436; display:flex; align-items:center; gap:6px; }
.gain-row { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom: 12px; }
.gain { width: 160px; }
.gain-val { font-size: 12px; color:#636e72; }

.recording-time {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
  font-family: 'Monaco', 'Consolas', monospace;
}

.level-bar { height: 8px; background: #ecf0f1; border-radius: 999px; overflow: hidden; width: 220px; margin: 0 auto 8px; }
.level-bar span { display: block; height: 100%; background: linear-gradient(90deg, #55efc4, #ff7675); width: 0%; transition: width .08s ease; }
.level-visualizer { display: block; margin: 4px auto 0; width: 260px; height: 48px; }

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

 
/* 列表样式 */
.list-section {
  padding: 0 20px 24px;
}

.list-title {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 700;
}

.recordings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.rec-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.rec-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #74b9ff, #a29bfe);
  color: #fff;
  box-shadow: 0 2px 8px rgba(116,185,255,.35);
}

.rec-info { min-width: 0; }
.rec-name {
  font-weight: 600;
  color: #2d3436;
  font-size: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 160px;
}
.rec-meta {
  margin-top: 2px;
  color: #7f8c8d;
  font-size: 12px;
}
.rec-meta .dot { margin: 0 6px; }

.rec-actions { display: flex; gap: 8px; }
.pill {
  border: none;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .2s ease;
}
.pill:hover { transform: translateY(-1px); }
.pill-webm { background: #dfe6e9; color: #2d3436; }
.pill-wav { background: #ffeaa7; color: #6d4c41; }
.pill-mp3 { background: #55efc4; color: #00695c; }
.pill-webm:hover { box-shadow: 0 4px 12px rgba(99,110,114,0.25); }
.pill-wav:hover { box-shadow: 0 4px 12px rgba(255,234,167,0.45); }
.pill-mp3:hover { box-shadow: 0 4px 12px rgba(85,239,196,0.45); }

.bottom-nav { position: fixed; left: 0; right: 0; bottom: 0; padding: 10px 12px; background: #fff; box-shadow: 0 -4px 14px rgba(0,0,0,.06); display:flex; justify-content:center; gap:12px; }
.bottom-nav button { border: none; padding: 8px 16px; border-radius: 999px; background: #ecf0f1; color: #2d3436; font-weight:600; cursor:pointer; min-width: 96px; }
.bottom-nav button.active { background: #3498db; color: #fff; }
.bottom-nav .nav-ico { margin-right: 6px; }

/* 过渡动画 */
.slide-fade-enter-active { transition: all .25s ease; }
.slide-fade-leave-active { transition: all .2s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateY(8px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>