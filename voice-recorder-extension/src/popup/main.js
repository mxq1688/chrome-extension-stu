import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import RecorderView from './views/RecorderView.vue'
import ListView from './views/ListView.vue'
import './style.css'

console.log('Vue应用初始化开始...')

const routes = [
  { path: '/', redirect: '/record' },
  { path: '/record', component: RecorderView },
  { path: '/list', component: ListView }
]
const router = createRouter({ history: createWebHashHistory(), routes })

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

try {
  app.mount('#app')
  console.log('Vue应用挂载成功！')
  // 路由持久化：进入时恢复到上次页面
  router.isReady().then(async () => {
    try {
      const current = router.currentRoute.value.path
      if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
        const { lastRoute } = await chrome.storage.local.get(['lastRoute'])
        if ((current === '/' || current === '/record') && lastRoute && lastRoute !== current) {
          router.replace(lastRoute).catch(() => {})
        }
      } else {
        const lastRoute = localStorage.getItem('lastRoute')
        if ((current === '/' || current === '/record') && lastRoute && lastRoute !== current) {
          router.replace(lastRoute).catch(() => {})
        }
      }
    } catch (e) { console.warn('恢复路由失败:', e) }
  })

  // 每次路由变更时保存
  router.afterEach(async (to) => {
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
        await chrome.storage.local.set({ lastRoute: to.path })
      } else {
        localStorage.setItem('lastRoute', to.path)
      }
    } catch (e) { console.warn('保存路由失败:', e) }
  })
} catch (error) {
  console.error('Vue应用挂载失败:', error)
}

// 检查DOM元素
console.log('检查#app元素:', document.getElementById('app'))
console.log('当前页面URL:', window.location.href)