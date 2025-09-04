// 录音助手 Content Script
// 在网页中运行的脚本

console.log('录音助手 Content Script 已加载')

// 录音状态管理
let isRecording = false
let mediaRecorder = null
let recordingStartTime = null
let recordingIndicator = null

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script 收到消息:', message)
  
  switch (message.type) {
    case 'START_RECORDING_FROM_CONTEXT':
      handleContextMenuRecording()
      sendResponse({ success: true })
      break
      
    case 'STOP_RECORDING':
      stopRecording()
      sendResponse({ success: true })
      break
      
    case 'GET_PAGE_INFO':
      sendResponse({
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname
      })
      break
      
    case 'EXTENSION_STATUS_CHANGED':
      handleExtensionStatusChange(message.active)
      sendResponse({ success: true })
      break
      
    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// 处理右键菜单录音请求
async function handleContextMenuRecording() {
  if (isRecording) {
    stopRecording()
    return
  }
  
  try {
    await startQuickRecording()
  } catch (error) {
    console.error('快速录音失败:', error)
    showPageNotification('录音失败', error.message, 'error')
  }
}

// 开始快速录音
async function startQuickRecording() {
  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })
    
    // 创建 MediaRecorder
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })
    
    const audioChunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // 发送录音数据到 background script
      chrome.runtime.sendMessage({
        type: 'QUICK_RECORDING_COMPLETED',
        recording: {
          name: `网页录音 - ${document.title}`,
          blob: audioBlob,
          url: audioUrl,
          duration: Math.floor((Date.now() - recordingStartTime) / 1000),
          size: audioBlob.size,
          pageTitle: document.title,
          pageUrl: window.location.href
        }
      })
      
      // 清理资源
      stream.getTracks().forEach(track => track.stop())
      hideRecordingIndicator()
      isRecording = false
      
      showPageNotification('录音完成', '录音已保存到录音助手', 'success')
    }
    
    mediaRecorder.onerror = (event) => {
      console.error('录音错误:', event.error)
      showPageNotification('录音错误', event.error.message, 'error')
    }
    
    // 开始录音
    mediaRecorder.start(1000)
    recordingStartTime = Date.now()
    isRecording = true
    
    showRecordingIndicator()
    showPageNotification('开始录音', '点击停止按钮结束录音', 'info')
    
  } catch (error) {
    throw new Error(`无法开始录音: ${error.message}`)
  }
}

// 停止录音
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop()
  }
}

// 显示录音指示器
function showRecordingIndicator() {
  // 移除已存在的指示器
  hideRecordingIndicator()
  
  recordingIndicator = document.createElement('div')
  recordingIndicator.id = 'voice-recorder-indicator'
  recordingIndicator.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: pulse 1.5s ease-in-out infinite;
    ">
      <span style="font-size: 16px;">🔴</span>
      <span>正在录音...</span>
      <button id="stop-recording-btn" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 8px;
      ">停止</button>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    </style>
  `
  
  document.body.appendChild(recordingIndicator)
  
  // 添加停止按钮事件
  const stopBtn = document.getElementById('stop-recording-btn')
  if (stopBtn) {
    stopBtn.addEventListener('click', stopRecording)
  }
}

// 隐藏录音指示器
function hideRecordingIndicator() {
  if (recordingIndicator) {
    recordingIndicator.remove()
    recordingIndicator = null
  }
}

// 显示页面通知
function showPageNotification(title, message, type = 'info') {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${getNotificationColor(type)};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 400px;
    text-align: center;
    animation: slideInDown 0.3s ease-out;
  `
  
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
    <div style="opacity: 0.9;">${message}</div>
    
    <style>
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    </style>
  `
  
  document.body.appendChild(notification)
  
  // 3秒后自动移除
  setTimeout(() => {
    notification.style.animation = 'slideInDown 0.3s ease-out reverse'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 300)
  }, 3000)
}

// 获取通知颜色
function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#28a745'
    case 'error': return '#dc3545'
    case 'warning': return '#ffc107'
    default: return '#007bff'
  }
}

// 处理扩展状态变化
function handleExtensionStatusChange(isActive) {
  console.log('扩展状态变化:', isActive)
  
  if (!isActive && isRecording) {
    // 如果扩展被禁用且正在录音，停止录音
    stopRecording()
  }
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  if (isRecording) {
    stopRecording()
  }
  hideRecordingIndicator()
})

// 键盘快捷键支持（可选）
document.addEventListener('keydown', (event) => {
  // Ctrl + Shift + R: 开始/停止录音
  if (event.ctrlKey && event.shiftKey && event.key === 'R') {
    event.preventDefault()
    
    if (isRecording) {
      stopRecording()
    } else {
      handleContextMenuRecording()
    }
  }
})

// 错误处理
window.addEventListener('error', (event) => {
  if (event.error && event.error.message.includes('recorder')) {
    console.error('录音相关错误:', event.error)
  }
})

console.log('录音助手 Content Script 初始化完成')