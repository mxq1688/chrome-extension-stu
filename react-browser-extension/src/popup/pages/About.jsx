import React from 'react'

function About() {
  const openGithub = () => {
    chrome.tabs.create({ url: 'https://github.com/your-username/react-browser-extension' })
  }

  const openDocs = () => {
    chrome.tabs.create({ url: 'https://your-docs-site.com' })
  }

  const reportIssue = () => {
    chrome.tabs.create({ url: 'https://github.com/your-username/react-browser-extension/issues' })
  }

  return (
    <div className="about">
      <div className="card hero">
        <div className="logo">
          <div className="logo-icon">⚛️</div>
        </div>
        <h2>React Browser Extension</h2>
        <p className="version">版本 1.0.0</p>
        <p className="description">基于React构建的现代化浏览器插件开发框架</p>
      </div>
      
      <div className="card">
        <h3 className="card-title">功能特性</h3>
        <ul className="feature-list">
          <li>✅ React 18 + Hooks</li>
          <li>✅ Zustand状态管理</li>
          <li>✅ React Router路由系统</li>
          <li>✅ 现代化UI界面</li>
          <li>✅ Manifest V3支持</li>
          <li>✅ 热重载开发环境</li>
        </ul>
      </div>
      
      <div className="card">
        <h3 className="card-title">技术栈</h3>
        <div className="tech-stack">
          <span className="tech-item">React 18</span>
          <span className="tech-item">Webpack</span>
          <span className="tech-item">Zustand</span>
          <span className="tech-item">React Router</span>
          <span className="tech-item">Chrome Extensions API</span>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">开发信息</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>构建时间:</strong>
            <span>{new Date().toLocaleString('zh-CN')}</span>
          </div>
          <div className="info-item">
            <strong>构建版本:</strong>
            <span>abc123f</span>
          </div>
          <div className="info-item">
            <strong>Node版本:</strong>
            <span>18.17.0</span>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">链接</h3>
        <div className="link-buttons">
          <button className="btn" onClick={openGithub}>GitHub仓库</button>
          <button className="btn" onClick={openDocs}>使用文档</button>
          <button className="btn" onClick={reportIssue}>问题反馈</button>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">许可证</h3>
        <p className="license">MIT License © 2024</p>
        <p className="copyright">感谢使用React Browser Extension框架！</p>
      </div>
    </div>
  )
}

export default About