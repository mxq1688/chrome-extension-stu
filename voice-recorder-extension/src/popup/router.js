import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'
import Recordings from './views/Recordings.vue'
import Settings from './views/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/recordings',
    name: 'Recordings',
    component: Recordings
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router