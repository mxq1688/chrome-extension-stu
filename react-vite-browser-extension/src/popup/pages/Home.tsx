import React, { useState, useEffect } from 'react'
import { useExtensionStore } from '../store/extensionStore'
import LoadingSpinner from '@components/LoadingSpinner'

const Home: React.FC = () => {
  const { 
    isActive, 
    setActive, 
    currentTab, 
    setCurrentTab, 
    showMessage,
    sendMessageToBackground
  } = useExtensionStore()
  
  const [tabInfo, setTabInfo] = useState<chrome.tabs.Tab | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCurrentTab()
  }, [])

  const getCurrentTab = async () => {
    try {
      setLoading(true)
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      setTabInfo(tab)
      setCurrentTab(tab)
    } catch (error) {
      console.error('获取当前标签页失败:', error)
      showMessage('获取标签页信息失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const refreshTab = async () => {
    if (!tabInfo?.id) return
    
    try {
      await chrome.tabs.reload(tabInfo.id)
      showMessage('页面已刷新', 'success')
      setTimeout(() => window.close(), 1000)
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
      showMessage('打开开发者工具失败', 'error')
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

  const analyzeTab = async () => {
    if (!tabInfo?.id) return
    
    try {
      setLoading(true)
      const response = await sendMessageToBackground({
        type: 'ANALYZE_PAGE',
        tabId: tabInfo.id
      })
      console.log('页面分析结果:', response)
      showMessage('页面分析完成，请查看控制台', 'success')
    } catch (error) {
      console.error('页面分析失败:', error)
      showMessage('页面分析失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async () => {
    try {
      const newStatus = !isActive
      await setActive(newStatus)
      showMessage(
        newStatus ? '插件已启用' : '插件已禁用', 
        'success'
      )
    } catch (error) {
      console.error('切换状态失败:', error)
      showMessage('操作失败', 'error')
    }
  }

  if (loading && !tabInfo) {
    return (
      <div className="home">
        <LoadingSpinner text="加载中..." />
      </div>
    )
  }

  return (
    <div className="home">
      <div className="card">
        <h3 className="card-title">当前标签页信息</h3>
        <div className="info-item">
          <strong>URL:</strong>
          <span className="info-value" title={tabInfo?.url}>
            {tabInfo?.url || '获取中...'}
          </span>
        </div>
        <div className="info-item">
          <strong>标题:</strong>
          <span className="info-value" title={tabInfo?.title}>
            {tabInfo?.title || '获取中...'}
          </span>
        </div>
        <div className="info-item">
          <strong>状态:</strong>
          <span className="info-value">
            {tabInfo?.status === 'complete' ? '加载完成' : '加载中'}
          </span>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">快捷操作</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-primary" 
            onClick={refreshTab}
            disabled={!tabInfo?.id}
          >
            刷新页面
          </button>
          <button 
            className="btn" 
            onClick={openDevTools}
          >
            开发者工具
          </button>
          <button 
            className="btn" 
            onClick={captureTab}
            disabled={!tabInfo?.id}
          >
            {loading ? <LoadingSpinner size="small" /> : '截图'}
          </button>
          <button 
            className="btn" 
            onClick={analyzeTab}
            disabled={!tabInfo?.id || loading}
          >
            {loading ? <LoadingSpinner size="small" /> : '分析页面'}
          </button>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">插件状态</h3>
        <div className="status-item">
          <span className={`status-dot ${isActive ? 'active' : ''}`}></span>
          <span>{isActive ? '已启用' : '已禁用'}</span>
          <button 
            className="btn btn-sm" 
            onClick={toggleStatus}
          >
            {isActive ? '禁用' : '启用'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home