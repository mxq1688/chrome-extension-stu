<template>
  <div class="about">
    <div class="card hero">
      <div class="logo">
        <div class="logo-icon">🚀</div>
      </div>
      <h2>Vue Browser Extension</h2>
      <p class="version">版本 1.0.0</p>
      <p class="description">基于Vue.js构建的现代化浏览器插件开发框架</p>
    </div>
    
    <div class="card">
      <h3 class="card-title">功能特性</h3>
      <ul class="feature-list">
        <li>✅ Vue 3 + Composition API</li>
        <li>✅ Pinia状态管理</li>
        <li>✅ Vue Router路由系统</li>
        <li>✅ 现代化UI界面</li>
        <li>✅ Manifest V3支持</li>
        <li>✅ 热重载开发环境</li>
      </ul>
    </div>
    
    <div class="card">
      <h3 class="card-title">技术栈</h3>
      <div class="tech-stack">
        <span class="tech-item">Vue.js 3</span>
        <span class="tech-item">Vite</span>
        <span class="tech-item">Pinia</span>
        <span class="tech-item">Vue Router</span>
        <span class="tech-item">Chrome Extensions API</span>
      </div>
    </div>
    
    <div class="card">
      <h3 class="card-title">开发信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>构建时间:</strong>
          <span>{{ buildInfo.time }}</span>
        </div>
        <div class="info-item">
          <strong>构建版本:</strong>
          <span>{{ buildInfo.hash }}</span>
        </div>
        <div class="info-item">
          <strong>Node版本:</strong>
          <span>{{ buildInfo.nodeVersion }}</span>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h3 class="card-title">链接</h3>
      <div class="link-buttons">
        <a href="#" class="btn" @click="openGithub">GitHub仓库</a>
        <a href="#" class="btn" @click="openDocs">使用文档</a>
        <a href="#" class="btn" @click="reportIssue">问题反馈</a>
      </div>
    </div>
    
    <div class="card">
      <h3 class="card-title">许可证</h3>
      <p class="license">MIT License © 2024</p>
      <p class="copyright">感谢使用Vue Browser Extension框架！</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const buildInfo = ref({
  time: new Date().toLocaleString('zh-CN'),
  hash: 'abc123f',
  nodeVersion: '18.17.0'
})

const openGithub = () => {
  chrome.tabs.create({ url: 'https://github.com/your-username/vue-browser-extension' })
}

const openDocs = () => {
  chrome.tabs.create({ url: 'https://your-docs-site.com' })
}

const reportIssue = () => {
  chrome.tabs.create({ url: 'https://github.com/your-username/vue-browser-extension/issues' })
}
</script>

<style scoped>
.about {
  padding: 16px;
}

.hero {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.logo {
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 48px;
  line-height: 1;
}

.hero h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.version {
  margin: 0 0 12px 0;
  font-size: 14px;
  opacity: 0.9;
}

.description {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
  line-height: 1.4;
}

.feature-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-list li {
  padding: 4px 0;
  font-size: 13px;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tech-item {
  display: inline-block;
  padding: 4px 8px;
  background: #e9ecef;
  border-radius: 12px;
  font-size: 11px;
  color: #495057;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-item strong {
  color: #495057;
}

.info-item span {
  color: #6c757d;
  font-family: monospace;
}

.link-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-buttons .btn {
  width: 100%;
  text-align: center;
}

.license, .copyright {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
  text-align: center;
}

.copyright {
  margin-top: 8px;
  font-style: italic;
}
</style>