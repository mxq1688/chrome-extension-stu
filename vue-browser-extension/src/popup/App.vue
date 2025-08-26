<template>
  <div class="app">
    <header class="header">
      <h1>Vue Extension</h1>
      <div class="version">v1.0.0</div>
    </header>
    
    <nav class="nav">
      <router-link to="/" class="nav-item" active-class="active">首页</router-link>
      <router-link to="/settings" class="nav-item" active-class="active">设置</router-link>
      <router-link to="/about" class="nav-item" active-class="active">关于</router-link>
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
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  text-align: center;
  position: relative;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.version {
  position: absolute;
  top: 5px;
  right: 10px;
  font-size: 10px;
  opacity: 0.8;
}

.nav {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.nav-item {
  flex: 1;
  padding: 12px 8px;
  text-decoration: none;
  color: #6c757d;
  text-align: center;
  font-size: 13px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #e9ecef;
  color: #495057;
}

.nav-item.active {
  background: #007bff;
  color: white;
}

.main {
  flex: 1;
  overflow-y: auto;
}
</style>