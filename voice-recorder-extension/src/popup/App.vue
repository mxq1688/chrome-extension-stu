<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="mic-icon">🎙️</span>
          <h1>录音助手</h1>
        </div>
        <div class="version">v1.0.0</div>
      </div>
    </header>
    
    <nav class="nav">
      <router-link to="/" class="nav-item" active-class="active">
        <span class="nav-icon">🎵</span>
        录音
      </router-link>
      <router-link to="/recordings" class="nav-item" active-class="active">
        <span class="nav-icon">📂</span>
        录音库
      </router-link>
      <router-link to="/settings" class="nav-item" active-class="active">
        <span class="nav-icon">⚙️</span>
        设置
      </router-link>
    </nav>
    
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// Vue 3 Composition API
</script>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  padding: 16px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mic-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.version {
  font-size: 11px;
  opacity: 0.8;
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 12px;
}

.nav {
  display: flex;
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.nav-item {
  flex: 1;
  padding: 14px 8px;
  text-decoration: none;
  color: #6c757d;
  text-align: center;
  font-size: 12px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.nav-icon {
  font-size: 16px;
}

.nav-item:hover {
  background: #f8f9fa;
  color: #495057;
}

.nav-item.active {
  background: #ff6b6b;
  color: white;
}

.main {
  flex: 1;
  overflow-y: auto;
  background: white;
}
</style>