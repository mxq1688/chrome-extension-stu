import React from 'react'

function LoadingSpinner({ size = 'normal', text = '' }) {
  return (
    <div className={`loading-spinner ${size === 'small' ? 'small' : ''}`}>
      <div className="spinner"></div>
      {text && <span className="loading-text">{text}</span>}
    </div>
  )
}

export default LoadingSpinner