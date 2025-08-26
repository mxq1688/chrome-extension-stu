import React, { useState, useEffect } from 'react'
import { useExtensionStore } from '../store/extensionStore'
import LoadingSpinner from '@components/LoadingSpinner'

const Settings: React.FC = () => {
  const { settings, updateSettings, showMessage, loading } = useExtensionStore()
  const [formData, setFormData] = useState(settings)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateSettings(formData)
      showMessage('设置已保存', 'success')
    } catch (error) {
      console.error('保存设置失败:', error)
      showMessage('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      const defaultSettings = {
        theme: 'light' as const,
        language: 'zh-CN' as const,
        autoStart: false,
        enableNotifications: true,
        enableSync: false,
        updateFrequency: 'weekly' as const
      }
      setFormData(defaultSettings)
      showMessage('设置已重置', 'success')
    }
  }

  const exportSettings = () => {
    try {
      const dataStr = JSON.stringify(formData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `extension-settings-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
      showMessage('设置已导出', 'success')
    } catch (error) {
      console.error('导出设置失败:', error)
      showMessage('导出失败', 'error')
    }
  }

  const importSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importedSettings = JSON.parse(e.target?.result as string)
            setFormData(prev => ({ ...prev, ...importedSettings }))
            showMessage('设置已导入', 'success')
          } catch (error) {
            console.error('导入设置失败:', error)
            showMessage('导入失败，文件格式错误', 'error')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  if (loading) {
    return (
      <div className="settings">
        <LoadingSpinner text="加载设置中..." />
      </div>
    )
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
            value={formData.theme}
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
            value={formData.language}
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
              checked={formData.autoStart}
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
              checked={formData.enableNotifications}
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
              checked={formData.enableSync}
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
            value={formData.updateFrequency}
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
          <button className="btn" onClick={exportSettings}>
            导出设置
          </button>
          <button className="btn" onClick={importSettings}>
            导入设置
          </button>
          <button className="btn" onClick={handleReset}>
            重置设置
          </button>
        </div>
      </div>
      
      <div className="save-section">
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <LoadingSpinner size="small" /> : '保存设置'}
        </button>
      </div>
    </div>
  )
}

export default Settings