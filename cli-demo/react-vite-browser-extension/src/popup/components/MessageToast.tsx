import React, { useEffect } from 'react'

interface MessageToastProps {
  visible: boolean
  type?: 'info' | 'success' | 'error' | 'warning'
  title?: string
  message: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

const MessageToast: React.FC<MessageToastProps> = ({
  visible,
  type = 'info',
  title,
  message,
  onClose,
  autoClose = true,
  duration = 3000
}) => {
  useEffect(() => {
    if (visible && autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [visible, autoClose, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  if (!visible) return null

  return (
    <div className={`message-toast toast-${type}`}>
      <div className="toast-icon">
        <span>{getIcon()}</span>
      </div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>
      {onClose && (
        <button className="toast-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  )
}

export default MessageToast