import React, { useState, useEffect } from 'react'
import { useExtension } from '../context/ExtensionContext'

function Home() {
  const { isActive, setActive, currentTab, setCurrentTab, showMessage } = useExtension()
  const [tabInfo, setTabInfo] = useState({})

  useEffect(() => {
    getCurrentTab()
  }, [])

  const getCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      setTabInfo(tab)
      setCurrentTab(tab)
    } catch (error) {
      console.error('获取当前标签页失败:', error)
    }
  }

  const refreshTab = async () => {
    try {
      await chrome.tabs.reload()
      showMessage('页面已刷新', 'success')
      window.close()
    } catch (error) {
      console.error('刷新页面失败:', error)
      showMessage('刷新失败', 'error')
    }
  }

  const openDevTools = async () => {
    try {
      await chrome.tabs.create({ url: 'chrome://inspect/#devices' })
    } catch (error) {
      console.error('打开开发者工具失败:', error)
    }
  }

  const captureTab = async () => {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab()
      const link = document.createElement('a')
      link.download = `screenshot-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      showMessage('截图已保存', 'success')
    } catch (error) {
      console.error('截图失败:', error)
      showMessage('截图失败', 'error')
    }
  }

  const toggleStatus = () => {
    const newStatus = !isActive
    setActive(newStatus)
    showMessage(newStatus ? '插件已启用' : '插件已禁用', 'success')
  }

  return (
    <div className="home">
      <div className="card">
        <h3 className="card-title">当前标签页信息</h3>
        <div className="info-item">
          <strong>URL:</strong> 
          <span className="info-value">{tabInfo.url || '获取中...'}</span>
        </div>
        <div className="info-item">
          <strong>标题:</strong> 
          <span className="info-value">{tabInfo.title || '获取中...'}</span>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">快捷操作</h3>
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={refreshTab}>
            刷新页面
          </button>
          <button className="btn" onClick={openDevTools}>
            开发者工具
          </button>
          <button className="btn" onClick={captureTab}>
            截图
          </button>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">插件状态</h3>
        <div className="status-item">
          <span className={`status-dot ${isActive ? 'active' : ''}`}></span>
          <span>{isActive ? '已启用' : '已禁用'}</span>
          <button className="btn btn-sm" onClick={toggleStatus}>
            {isActive ? '禁用' : '启用'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home