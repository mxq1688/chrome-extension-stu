import React from 'react'

interface TechItem {
  name: string
  version?: string
  description?: string
}

interface BuildInfo {
  time: string
  hash: string
  nodeVersion: string
  viteVersion: string
}

const About: React.FC = () => {
  const techStack: TechItem[] = [
    { name: 'React 18', description: '现代化UI框架' },
    { name: 'Vite', description: '极速构建工具' },
    { name: 'TypeScript', description: '类型安全' },
    { name: 'Zustand', description: '状态管理' },
    { name: 'React Router', description: '路由系统' }
  ]

  const features: string[] = [
    '⚛️ React 18 + TypeScript',
    '⚡ Vite超快构建',
    '📊 Zustand状态管理',
    '🌐 React Router路由',
    '🎨 现代化UI设计',
    '🛠 完整开发工具链',
    '📱 响应式界面',
    '🔧 热重载开发'
  ]

  const buildInfo: BuildInfo = {
    time: new Date().toLocaleString('zh-CN'),
    hash: 'abc123f',
    nodeVersion: '18.17.0',
    viteVersion: '5.0.0'
  }

  const openGithub = () => {
    chrome.tabs.create({ 
      url: 'https://github.com/your-username/react-vite-browser-extension' 
    })
  }

  const openDocs = () => {
    chrome.tabs.create({ 
      url: 'https://vitejs.dev/guide/' 
    })
  }

  const reportIssue = () => {
    chrome.tabs.create({ 
      url: 'https://github.com/your-username/react-vite-browser-extension/issues' 
    })
  }

  const openViteDocs = () => {
    chrome.tabs.create({ 
      url: 'https://vitejs.dev/' 
    })
  }

  return (
    <div className="about">
      <div className="card hero">
        <div className="logo">
          <div className="logo-icon">⚡</div>
        </div>
        <h2>React Vite Extension</h2>
        <p className="version">版本 1.0.0</p>
        <p className="description">
          基于React + Vite构建的高性能现代化浏览器插件开发框架
        </p>
      </div>
      
      <div className="card">
        <h3 className="card-title">功能特性</h3>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              {feature}
            </div>
          ))}
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">技术栈</h3>
        <div className="tech-stack">
          {techStack.map((tech, index) => (
            <div key={index} className="tech-item">
              <span className="tech-name">{tech.name}</span>
              {tech.description && (
                <span className="tech-desc">{tech.description}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">构建信息</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>构建时间:</strong>
            <span>{buildInfo.time}</span>
          </div>
          <div className="info-item">
            <strong>构建版本:</strong>
            <span className="mono">{buildInfo.hash}</span>
          </div>
          <div className="info-item">
            <strong>Node版本:</strong>
            <span className="mono">{buildInfo.nodeVersion}</span>
          </div>
          <div className="info-item">
            <strong>Vite版本:</strong>
            <span className="mono">{buildInfo.viteVersion}</span>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">性能优势</h3>
        <div className="performance-list">
          <div className="perf-item">
            <span className="perf-icon">⚡</span>
            <div className="perf-content">
              <strong>极速构建</strong>
              <p>Vite提供毫秒级热重载，开发体验极佳</p>
            </div>
          </div>
          <div className="perf-item">
            <span className="perf-icon">🔧</span>
            <div className="perf-content">
              <strong>开箱即用</strong>
              <p>零配置TypeScript支持，内置优化</p>
            </div>
          </div>
          <div className="perf-item">
            <span className="perf-icon">📦</span>
            <div className="perf-content">
              <strong>现代打包</strong>
              <p>基于Rollup的生产构建，体积更小</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">相关链接</h3>
        <div className="link-buttons">
          <button className="btn" onClick={openGithub}>
            <span>📚</span> GitHub仓库
          </button>
          <button className="btn" onClick={openViteDocs}>
            <span>⚡</span> Vite文档
          </button>
          <button className="btn" onClick={openDocs}>
            <span>📖</span> 使用指南
          </button>
          <button className="btn" onClick={reportIssue}>
            <span>🐛</span> 问题反馈
          </button>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">开源许可</h3>
        <p className="license">MIT License © 2024</p>
        <p className="copyright">
          感谢使用React + Vite浏览器插件开发框架！<br/>
          让我们一起构建更快、更现代的浏览器插件。
        </p>
      </div>
    </div>
  )
}

export default About