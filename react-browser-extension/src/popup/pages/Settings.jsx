import React, { useState, useEffect } from 'react'
import { useExtension } from '../context/ExtensionContext'

function Settings() {
  const { settings, updateSettings, showMessage } = useExtension()
  const [formSettings, setFormSettings] = useState({
    theme: 'light',
    language: 'zh-CN',
    autoStart: false,
    enableNotifications: true,
    enableSync: false,
    updateFrequency: 'weekly'
  })

  useEffect(() => {
    setFormSettings(prevSettings => ({ ...prevSettings, ...settings }))
  }, [settings])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const saveSettings = async () => {
    try {
      await updateSettings(formSettings)
      showMessage('设置已保存', 'success')
    } catch (error) {
      console.error('保存设置失败:', error)
      showMessage('保存失败', 'error')
    }
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(formSettings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'extension-settings.json'
    link.click()
    URL.revokeObjectURL(url)
    showMessage('设置已导出', 'success')
  }

  const importSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importedSettings = JSON.parse(e.target.result)
            setFormSettings(prev => ({ ...prev, ...importedSettings }))
            showMessage('设置已导入', 'success')
          } catch (error) {
            showMessage('导入失败，文件格式错误', 'error')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const resetSettings = () => {
    if (window.confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      setFormSettings({
        theme: 'light',
        language: 'zh-CN',
        autoStart: false,
        enableNotifications: true,
        enableSync: false,
        updateFrequency: 'weekly'
      })
      showMessage('设置已重置', 'success')
    }
  }

  return (
    <div className="settings">
      <div className="card">
        <h3 className="card-title">基本设置</h3>
        
        <div className="form-group">
          <label className="form-label">主题模式</label>
          <select 
            className="form-control" 
            name="theme"
            value={formSettings.theme}
            onChange={handleInputChange}
          >
            <option value="light">浅色模式</option>
            <option value="dark">深色模式</option>
            <option value="auto">跟随系统</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">语言设置</label>
          <select 
            className="form-control" 
            name="language"
            value={formSettings.language}
            onChange={handleInputChange}
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label checkbox-label">
            <input 
              type="checkbox" 
              name="autoStart"
              checked={formSettings.autoStart}
              onChange={handleInputChange}
            /> 
            开机自启动
          </label>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">功能设置</h3>
        
        <div className="form-group">
          <label className="form-label checkbox-label">
            <input 
              type="checkbox" 
              name="enableNotifications"
              checked={formSettings.enableNotifications}
              onChange={handleInputChange}
            /> 
            启用通知
          </label>
        </div>
        
        <div className="form-group">
          <label className="form-label checkbox-label">
            <input 
              type="checkbox" 
              name="enableSync"
              checked={formSettings.enableSync}
              onChange={handleInputChange}
            /> 
            同步设置到云端
          </label>
        </div>
        
        <div className="form-group">
          <label className="form-label">更新检查频率</label>
          <select 
            className="form-control" 
            name="updateFrequency"
            value={formSettings.updateFrequency}
            onChange={handleInputChange}
          >
            <option value="daily">每日</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
            <option value="never">从不</option>
          </select>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">数据管理</h3>
        <div className="action-buttons">
          <button className="btn" onClick={exportSettings}>导出设置</button>
          <button className="btn" onClick={importSettings}>导入设置</button>
          <button className="btn" onClick={resetSettings}>重置设置</button>
        </div>
      </div>
      
      <div className="save-section">
        <button className="btn btn-primary" onClick={saveSettings}>
          保存设置
        </button>
      </div>
    </div>
  )
}

export default Settings