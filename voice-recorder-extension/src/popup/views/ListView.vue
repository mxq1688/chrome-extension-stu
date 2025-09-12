<template>
  <section class="list-section">
    <h3 class="list-title" v-if="store.totalRecordings > 0">我的录音</h3>
    <div v-if="store.totalRecordings > 0" class="recordings">
      <div v-for="rec in store.recordings" :key="rec.id" class="record-item">
        <div class="rec-left">
          <div class="rec-avatar">🎧</div>
          <div class="rec-info">
            <div class="rec-name" :title="rec.name">{{ rec.name }}</div>
            <div class="rec-meta">
              <span>{{ formatDate(rec.createdAt) }}</span>
              <span class="dot">•</span>
              <span>{{ formatSize(rec.size) }}</span>
              <span class="dot" v-if="rec.duration">•</span>
              <span v-if="rec.duration">{{ rec.duration }}s</span>
            </div>
          </div>
        </div>
        <div class="rec-actions">
          <button class="pill pill-webm" title="下载原始WEBM" @click="downloadWebm(rec)">WEBM</button>
          <button class="pill pill-wav" title="下载WAV无损" @click="downloadWav(rec)">WAV</button>
          <button class="pill pill-mp3" title="下载MP3压缩" @click="downloadMp3(rec)">MP3</button>
        </div>
      </div>
    </div>
  </section>
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
function formatDate(iso) { try { return new Date(iso).toLocaleString('zh-CN') } catch { return '' } }

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

