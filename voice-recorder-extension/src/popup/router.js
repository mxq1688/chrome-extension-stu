import { createRouter, createWebHashHistory } from 'vue-router'
import RecorderView from './views/RecorderView.vue'
import ListView from './views/ListView.vue'

export const routes = [
  { path: '/', redirect: '/record' },
  { path: '/record', component: RecorderView },
  { path: '/list', component: ListView }
]

export const router = createRouter({ history: createWebHashHistory(), routes })

export async function restoreLastRoute() {
  try {
    const current = router.currentRoute.value.path
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      const { lastRoute } = await chrome.storage.local.get(['lastRoute'])
      if ((current === '/' || current === '/record') && lastRoute && lastRoute !== current) {
        await router.replace(lastRoute).catch(() => {})
      }
    } else {
      const lastRoute = localStorage.getItem('lastRoute')
      if ((current === '/' || current === '/record') && lastRoute && lastRoute !== current) {
        await router.replace(lastRoute).catch(() => {})
      }
    }
  } catch (e) {
    console.warn('恢复路由失败:', e)
  }
}

export function persistRouteOnChange() {
  router.afterEach(async (to) => {
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
        await chrome.storage.local.set({ lastRoute: to.path })
      } else {
        localStorage.setItem('lastRoute', to.path)
      }
    } catch (e) { console.warn('保存路由失败:', e) }
  })
}
