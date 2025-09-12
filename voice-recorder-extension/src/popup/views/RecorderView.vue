<template>
  <div class="recording-container">
    <div class="recording-status">
      <div class="recording-time">{{ store.formattedRecordingTime }}</div>
      <div class="level-bar"><span :style="{ width: Math.round(level * 100) + '%' }"></span></div>
      <canvas ref="vizCanvas" class="level-visualizer" width="260" height="48"></canvas>
    </div>

    <div class="source-toggle">
      <button class="toggle-btn" :class="{ active: store.settings.inputSource==='mic' }" @click="setSource('mic')">仅麦克风</button>
      <button class="toggle-btn" :class="{ active: store.settings.inputSource==='mix' }" @click="setSource('mix')">混音</button>
      <button class="toggle-btn" :class="{ active: store.settings.inputSource==='tab' }" @click="setSource('tab')">仅标签页</button>
    </div>

    <div class="audio-controls">
      <label class="switch"><input type="checkbox" :checked="store.settings.echoCancellation" @change="updateSetting('echoCancellation', $event.target.checked)"><span>回声消除</span></label>
      <label class="switch"><input type="checkbox" :checked="store.settings.noiseSuppression" @change="updateSetting('noiseSuppression', $event.target.checked)"><span>降噪</span></label>
      <label class="switch"><input type="checkbox" :checked="store.settings.autoGainControl" @change="updateSetting('autoGainControl', $event.target.checked)"><span>自动增益</span></label>
    </div>
    <div class="gain-row">
      <span>输入增益</span>
      <input class="gain" type="range" min="0" max="3" step="0.1" :value="store.settings.gain" @input="updateSetting('gain', Number($event.target.value))" />
      <span class="gain-val">{{ store.settings.gain.toFixed(1) }}x</span>
    </div>

    <div class="recording-control">
      <button @click="toggleRecording" :disabled="isProcessing" class="record-btn" :class="{ 'recording': store.isRecording && !store.isPaused, 'paused': store.isPaused }">
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

    <div class="fixed-controls">
      <button @click="pinToPage" class="pin-btn" :class="{ 'pinned': isPinned }">
        <span class="btn-icon">📌</span>
        <span class="btn-text">{{ isPinned ? '已固定' : '固定到页面' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRecorderStore } from '../store'
import SimpleRecorder from '../../utils/simpleRecorder'

const store = useRecorderStore()
const recorder = new SimpleRecorder()

const isProcessing = ref(false)
const recordingTimer = ref(null)
const level = ref(0)
const vizCanvas = ref(null)
let vizRaf = null

function setSource(src) { store.updateSettings({ inputSource: src }) }
function updateSetting(key, val) { store.updateSettings({ [key]: val }) }

onMounted(async () => { await store.loadFromStorage() })
onUnmounted(() => { cleanup() })

async function toggleRecording() {
  if (isProcessing.value) return
  try {
    isProcessing.value = true
    if (!store.isRecording) {
      await recorder.startRecording(store.settings?.inputSource || 'mix')
      store.setRecordingState(true, false)
      startTimer()
      recorder.onLevel(v => level.value = v)
      startVisualizer()
    } else if (store.isPaused) {
      await recorder.resumeRecording()
      store.setRecordingState(true, false)
    } else {
      const audioData = await recorder.stopRecording()
      store.setRecordingState(false, false)
      store.resetRecordingTime()
      // 将数据透传给顶层（使用自定义事件）
      const ev = new CustomEvent('record-stopped', { detail: audioData })
      window.dispatchEvent(ev)
    }
  } finally { isProcessing.value = false }
}

function startTimer() {
  if (recordingTimer.value) clearInterval(recordingTimer.value)
  recordingTimer.value = setInterval(() => {
    if (!store.isPaused) store.updateRecordingTime(store.recordingTime + 1)
  }, 1000)
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
    }
    vizRaf = requestAnimationFrame(draw)
  }
  vizRaf = requestAnimationFrame(draw)
}

function stopVisualizer() { if (vizRaf) { cancelAnimationFrame(vizRaf); vizRaf = null } }
function cleanup() { stopVisualizer(); recorder.cleanup() }
</script>

