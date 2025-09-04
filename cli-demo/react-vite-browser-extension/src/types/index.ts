// 全局类型定义

export interface ExtensionMessage {
  type: string
  [key: string]: any
}

export interface ExtensionInfo {
  name: string
  version: string
  isActive: boolean
  installTime?: number
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  autoStart: boolean
  enableNotifications: boolean
  enableSync: boolean
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'never'
}

export interface Message {
  text: string
  type: 'info' | 'success' | 'error' | 'warning'
  title?: string
  visible: boolean
}

export interface PageAnalysis {
  url: string
  title: string
  description?: string
  keywords?: string
  stats: {
    images: number
    links: number
    scripts: number
    stylesheets: number
    headings: {
      h1: number
      h2: number
      h3: number
      h4: number
      h5: number
      h6: number
    }
    forms: number
    tables: number
  }
  performance: {
    loadTime: number
    domContentLoaded?: number
    loadComplete?: number
  }
  technologies: Technology[]
}

export interface Technology {
  name: string
  version?: string
  description?: string
}

export interface PageInfo {
  url: string
  title: string
  domain: string
  path: string
  protocol: string
  language?: string
  charset: string
  referrer?: string
  lastModified?: string
}

export interface TabInfo {
  id: number
  url: string
  title: string
  status: string
  favIconUrl?: string
  windowId: number
}

export interface StorageUsage {
  bytes: number
  kb: string
  mb: string
}

export interface MessageResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
}

// Chrome API扩展类型
declare global {
  interface Window {
    React?: any
    Vue?: any
    angular?: any
    jQuery?: any
    $?: any
    gsap?: any
    Swiper?: any
    AOS?: any
  }
}

// Vite环境变量类型
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 组件Props类型
export interface LoadingSpinnerProps {
  size?: 'small' | 'normal' | 'large'
  text?: string
  className?: string
}

export interface MessageToastProps {
  visible: boolean
  type?: 'info' | 'success' | 'error' | 'warning'
  title?: string
  message: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

export interface HeaderProps {
  title?: string
  version?: string
}

export interface NavigationProps {
  items?: NavigationItem[]
}

export interface NavigationItem {
  path: string
  label: string
  icon?: string
}

// Store类型
export interface ExtensionState {
  isActive: boolean
  currentTab: chrome.tabs.Tab | null
  settings: Settings
  message: Message
  loading: boolean
}

export interface ExtensionActions {
  setActive: (active: boolean) => void
  setCurrentTab: (tab: chrome.tabs.Tab | null) => void
  updateSettings: (newSettings: Partial<Settings>) => void
  showMessage: (text: string, type?: Message['type'], title?: string) => void
  hideMessage: () => void
  setLoading: (loading: boolean) => void
  initializeStore: () => Promise<void>
  sendMessageToBackground: (message: any) => Promise<any>
  sendMessageToContentScript: (tabId: number, message: any) => Promise<any>
}

export type ExtensionStore = ExtensionState & ExtensionActions

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 错误类型
export class ExtensionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: any
  ) {
    super(message)
    this.name = 'ExtensionError'
  }
}

// 工具函数类型
export type DebounceFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void

export type ThrottleFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void

// 事件类型
export interface ExtensionEvent<T = any> {
  type: string
  data?: T
  timestamp: number
  source?: 'popup' | 'background' | 'content'
}

// Hook类型
export interface UseExtensionReturn extends ExtensionStore {
  initialized: boolean
  error: string | null
}

export interface UseStorageReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  save: (value: T) => Promise<boolean>
  remove: () => Promise<boolean>
  refresh: () => Promise<void>
}