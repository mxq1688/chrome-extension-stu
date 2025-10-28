let isRequesting = false

async function requestPermission() {
  if (isRequesting) return

  const btn = document.getElementById('requestBtn')
  const status = document.getElementById('status')
  const closeBtn = document.getElementById('closeBtn')

  try {
    isRequesting = true
    btn.disabled = true
    btn.textContent = '正在请求权限...'

    showStatus('正在请求麦克风权限，请在弹出的对话框中选择"允许"...', 'info')

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })

    stream.getTracks().forEach(track => track.stop())

    showStatus('✅ 麦克风权限授权成功！现在您可以返回录音助手扩展开始使用了。', 'success')
    btn.style.display = 'none'
    closeBtn.style.display = 'inline-block'

    setTimeout(() => {
      window.close()
    }, 3000)

  } catch (error) {
    console.error('权限请求失败:', error)

    let errorMessage = '权限请求失败'
    switch (error.name) {
      case 'NotAllowedError':
        errorMessage = '❌ 您拒绝了麦克风权限。请点击地址栏左侧的🔒图标，将麦克风设置为"允许"，然后刷新页面重试。'
        break
      case 'NotFoundError':
        errorMessage = '❌ 未检测到麦克风设备，请检查您的麦克风是否正确连接。'
        break
      case 'NotReadableError':
        errorMessage = '❌ 麦克风被其他程序占用，请关闭其他使用麦克风的程序后重试。'
        break
      default:
        errorMessage = `❌ 发生错误: ${error.message}`
    }

    showStatus(errorMessage, 'error')
    btn.disabled = false
    btn.textContent = '🔓 重新请求权限'

  } finally {
    isRequesting = false
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status')
  status.textContent = message
  status.className = `status ${type}`
  status.style.display = 'block'
}

async function checkInitialPermission() {
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' })
    if (permission.state === 'granted') {
      showStatus('✅ 麦克风权限已经授权！您可以直接使用录音助手了。', 'success')
      document.getElementById('requestBtn').style.display = 'none'
      document.getElementById('closeBtn').style.display = 'inline-block'
    } else if (permission.state === 'denied') {
      showStatus('⚠️ 麦克风权限被拒绝。请点击地址栏的🔒图标手动允许麦克风访问。', 'error')
    }
  } catch (error) {
    console.log('无法检查权限状态:', error)
  }
}

window.addEventListener('load', () => {
  document.getElementById('requestBtn').addEventListener('click', requestPermission)
  document.getElementById('closeBtn').addEventListener('click', () => window.close())
  checkInitialPermission()
})
