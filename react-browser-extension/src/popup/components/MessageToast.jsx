import React, { useEffect } from 'react'

function MessageToast({ visible, type = 'info', title, message, onClose, autoClose = true, duration = 3000 }) {
  useEffect(() => {
    if (visible && autoClose) {
      const timer = setTimeout(() => {
        onClose && onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [visible, autoClose, duration, onClose])

  if (!visible) return null

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  return (
    <div className={`message-toast toast-${type}`}>
      <div className="toast-icon">
        <span>{getIcon()}</span>
      </div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  )
}

export default MessageToast