<template>
  <div class="list-view">
    <!-- 头部统计信息 -->
    <div class="list-header">
      <div class="header-content">
        <div class="header-icon">📂</div>
        <div class="header-text">
          <h2 class="header-title">我的录音</h2>
          <p class="header-subtitle">{{ store.totalRecordings }} 个录音文件</p>
        </div>
      </div>
    </div>

    <!-- 录音列表 -->
    <div v-if="store.totalRecordings > 0" class="recordings-container">
      <div v-for="rec in store.recordings" :key="rec.id" class="recording-card">
        <div class="card-header">
          <div class="recording-icon">
            <div class="icon-bg">🎵</div>
          </div>
          <div class="recording-info">
            <h3 class="recording-name" :title="rec.name">{{ rec.name }}</h3>
            <div class="recording-meta">
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span class="meta-text">{{ formatDate(rec.createdAt) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">💾</span>
                <span class="meta-text">{{ formatSize(rec.size) }}</span>
              </div>
              <div v-if="rec.duration" class="meta-item">
                <span class="meta-icon">⏱️</span>
                <span class="meta-text">{{ formatDuration(rec.duration) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card-actions">
          <div class="download-buttons">
            <button 
              class="download-btn webm-btn" 
              title="下载原始WEBM格式" 
              @click="downloadWebm(rec)"
            >
              <span class="btn-icon">🎵</span>
              <span class="btn-text">WEBM</span>
            </button>
            <button 
              class="download-btn wav-btn" 
              title="下载WAV无损格式" 
              @click="downloadWav(rec)"
            >
              <span class="btn-icon">🎼</span>
              <span class="btn-text">WAV</span>
            </button>
            <button 
              class="download-btn mp3-btn" 
              title="下载MP3压缩格式" 
              @click="downloadMp3(rec)"
            >
              <span class="btn-icon">🎧</span>
              <span class="btn-text">MP3</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🎙️</div>
      <h3 class="empty-title">暂无录音</h3>
      <p class="empty-description">开始录制您的第一个音频文件吧！</p>
    </div>
  </div>
</template>

<script setup>
import { useRecorderStore } from '../store'
const store = useRecorderStore()

function formatSize(size) {
  const s = Number(size || 0)
  if (s < 1024) return `${s} B`
  if (s < 1024 * 1024) return `${(s / 1024).toFixed(1)} KB`
  return `${(s / 1024 / 1024).toFixed(2)} MB`
}

function formatDate(iso) { 
  try { 
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch { 
    return '' 
  } 
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function sanitize(name) { return (name || '录音').replace(/[^\w\u4e00-\u9fa5\-_. ]+/g, '_') }
function makePath(filename) { return `recordings/${filename}` }
function downloadByUrl(url, filename) {
  if (typeof chrome !== 'undefined' && chrome?.downloads?.download) {
    chrome.downloads.download({ url, filename: makePath(filename), saveAs: true }, () => {})
  } else {
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => document.body.removeChild(a), 0)
  }
}
function downloadWebm(rec) {
  const url = rec.audioUrl || (rec.audioBlob ? URL.createObjectURL(rec.audioBlob) : '')
  if (!url) return; downloadByUrl(url, `${sanitize(rec.name)}.webm`)
}
async function downloadWav(rec) {
  if (!rec.audioBlob) return downloadWebm(rec)
  const arrayBuffer = await rec.audioBlob.arrayBuffer()
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
  const wavBlob = encodeWav(audioBuffer)
  const url = URL.createObjectURL(wavBlob)
  downloadByUrl(url, `${sanitize(rec.name)}.wav`)
}
async function downloadMp3(rec) {
  if (!rec.audioBlob) return downloadWebm(rec)
  const arrayBuffer = await rec.audioBlob.arrayBuffer()
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
  const mp3Blob = encodeMp3(audioBuffer)
  const url = URL.createObjectURL(mp3Blob)
  downloadByUrl(url, `${sanitize(rec.name)}.mp3`)
}
function interleaveChannels(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const length = audioBuffer.length * numChannels
  const result = new Float32Array(length)
  for (let ch = 0; ch < numChannels; ch++) {
    const data = audioBuffer.getChannelData(ch)
    for (let i = 0; i < audioBuffer.length; i++) { result[i * numChannels + ch] = data[i] }
  }
  return result
}
function encodeWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const samples = interleaveChannels(audioBuffer)
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  const view = new DataView(buffer)
  const writeString = (dv, off, str) => { for (let i=0;i<str.length;i++) dv.setUint8(off+i, str.charCodeAt(i)) }
  writeString(view,0,'RIFF'); view.setUint32(4,36+samples.length*bytesPerSample,true); writeString(view,8,'WAVE'); writeString(view,12,'fmt ')
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,numChannels,true); view.setUint32(24,sampleRate,true)
  view.setUint32(28,sampleRate*blockAlign,true); view.setUint16(32,blockAlign,true); view.setUint16(34,bytesPerSample*8,true)
  writeString(view,36,'data'); view.setUint32(40,samples.length*bytesPerSample,true)
  let offset=44; for (let i=0;i<samples.length;i++,offset+=2){ let s=Math.max(-1,Math.min(1,samples[i])); view.setInt16(offset,s<0?s*0x8000:s*0x7fff,true) }
  return new Blob([view],{type:'audio/wav'})
}
function encodeMp3(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128)
  const left = audioBuffer.getChannelData(0)
  const right = numChannels>1 ? audioBuffer.getChannelData(1) : left
  const block = 1152
  let mp3Data=[]
  for(let i=0;i<left.length;i+=block){
    const l = floatTo16(left.subarray(i,i+block))
    const r = floatTo16(right.subarray(i,i+block))
    const buf = encoder.encodeBuffer(l,r)
    if (buf.length>0) mp3Data.push(new Int8Array(buf))
  }
  const end = encoder.flush(); if (end.length>0) mp3Data.push(new Int8Array(end))
  return new Blob(mp3Data,{type:'audio/mpeg'})
}
function floatTo16(f32){ const out=new Int16Array(f32.length); for(let i=0;i<f32.length;i++){ let s=Math.max(-1,Math.min(1,f32[i])); out[i]=s<0?s*0x8000:s*0x7fff } return out }

import lamejs from 'lamejs'
</script>

<style scoped>
.list-view {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}

/* 头部区域 */
.list-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 4px 0;
}

.header-subtitle {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
  font-weight: 500;
}

/* 录音列表容器 */
.recordings-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 录音卡片 */
.recording-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.recording-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.recording-icon {
  flex-shrink: 0;
}

.icon-bg {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.recording-info {
  flex: 1;
  min-width: 0;
}

.recording-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recording-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #718096;
}

.meta-icon {
  font-size: 0.875rem;
  opacity: 0.7;
}

.meta-text {
  font-weight: 500;
}

/* 卡片操作区域 */
.card-actions {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.download-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #4a5568;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.download-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.webm-btn:hover {
  border-color: #4299e1;
  background: #ebf8ff;
  color: #2b6cb0;
}

.wav-btn:hover {
  border-color: #48bb78;
  background: #f0fff4;
  color: #2f855a;
}

.mp3-btn:hover {
  border-color: #ed8936;
  background: #fffaf0;
  color: #c05621;
}

.btn-icon {
  font-size: 0.875rem;
}

.btn-text {
  font-weight: 600;
}

/* 空状态 */
.empty-state {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 48px 24px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 320px) {
  .list-view {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .recording-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .download-buttons {
    flex-direction: column;
  }
  
  .download-btn {
    justify-content: center;
  }
}

/* 加载动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.recording-card {
  animation: fadeInUp 0.3s ease-out;
}

.recording-card:nth-child(1) { animation-delay: 0.1s; }
.recording-card:nth-child(2) { animation-delay: 0.2s; }
.recording-card:nth-child(3) { animation-delay: 0.3s; }
.recording-card:nth-child(4) { animation-delay: 0.4s; }
.recording-card:nth-child(5) { animation-delay: 0.5s; }
</style>

