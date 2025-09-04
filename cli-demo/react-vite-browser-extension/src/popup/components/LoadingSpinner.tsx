import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'normal' | 'large'
  text?: string
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'normal', 
  text = '', 
  className = '' 
}) => {
  return (
    <div className={`loading-spinner ${size} ${className}`}>
      <div className="spinner"></div>
      {text && <span className="loading-text">{text}</span>}
    </div>
  )
}

export default LoadingSpinner