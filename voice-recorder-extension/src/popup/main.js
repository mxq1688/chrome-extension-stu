import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router, restoreLastRoute, persistRouteOnChange } from './router'
import './style.css'

console.log('Vue应用初始化开始...')

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

try {
  app.mount('#app')
  console.log('Vue应用挂载成功！')

  router.isReady().then(async () => {
    await restoreLastRoute()
  })

  persistRouteOnChange()
} catch (error) {
  console.error('Vue应用挂载失败:', error)
}

// 检查DOM元素
console.log('检查#app元素:', document.getElementById('app'))
console.log('当前页面URL:', window.location.href)