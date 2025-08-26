/**
 * Chrome Storage API 封装
 * 提供类型安全的存储操作方法
 */

export class ExtensionStorage {
  /**
   * 保存数据到本地存储
   */
  static async setLocal<T>(key: string, value: T): Promise<boolean>
  static async setLocal(data: Record<string, any>): Promise<boolean>
  static async setLocal<T>(keyOrData: string | Record<string, any>, value?: T): Promise<boolean> {
    try {
      const data = typeof keyOrData === 'string' ? { [keyOrData]: value } : keyOrData
      await chrome.storage.local.set(data)
      return true
    } catch (error) {
      console.error('保存本地数据失败:', error)
      return false
    }
  }

  /**
   * 从本地存储获取数据
   */
  static async getLocal<T>(key: string): Promise<T | undefined>
  static async getLocal<T extends Record<string, any>>(keys: (keyof T)[]): Promise<Partial<T>>
  static async getLocal<T>(keyOrKeys: string | string[]): Promise<T | Partial<T> | undefined> {
    try {
      const result = await chrome.storage.local.get(keyOrKeys)
      return typeof keyOrKeys === 'string' ? result[keyOrKeys] : result
    } catch (error) {
      console.error('获取本地数据失败:', error)
      return undefined
    }
  }

  /**
   * 保存数据到同步存储
   */
  static async setSync<T>(key: string, value: T): Promise<boolean>
  static async setSync(data: Record<string, any>): Promise<boolean>
  static async setSync<T>(keyOrData: string | Record<string, any>, value?: T): Promise<boolean> {
    try {
      const data = typeof keyOrData === 'string' ? { [keyOrData]: value } : keyOrData
      await chrome.storage.sync.set(data)
      return true
    } catch (error) {
      console.error('保存同步数据失败:', error)
      return false
    }
  }

  /**
   * 从同步存储获取数据
   */
  static async getSync<T>(key: string): Promise<T | undefined>
  static async getSync<T extends Record<string, any>>(keys: (keyof T)[]): Promise<Partial<T>>
  static async getSync<T>(keyOrKeys: string | string[]): Promise<T | Partial<T> | undefined> {
    try {
      const result = await chrome.storage.sync.get(keyOrKeys)
      return typeof keyOrKeys === 'string' ? result[keyOrKeys] : result
    } catch (error) {
      console.error('获取同步数据失败:', error)
      return undefined
    }
  }

  /**
   * 删除存储数据
   */
  static async removeLocal(keys: string | string[]): Promise<boolean> {
    try {
      await chrome.storage.local.remove(keys)
      return true
    } catch (error) {
      console.error('删除本地数据失败:', error)
      return false
    }
  }

  static async removeSync(keys: string | string[]): Promise<boolean> {
    try {
      await chrome.storage.sync.remove(keys)
      return true
    } catch (error) {
      console.error('删除同步数据失败:', error)
      return false
    }
  }

  /**
   * 清空存储
   */
  static async clearLocal(): Promise<boolean> {
    try {
      await chrome.storage.local.clear()
      return true
    } catch (error) {
      console.error('清空本地存储失败:', error)
      return false
    }
  }

  static async clearSync(): Promise<boolean> {
    try {
      await chrome.storage.sync.clear()
      return true
    } catch (error) {
      console.error('清空同步存储失败:', error)
      return false
    }
  }

  /**
   * 获取存储使用情况
   */
  static async getBytesInUse(type: 'local' | 'sync' = 'local') {
    try {
      const bytesInUse = await chrome.storage[type].getBytesInUse()
      return {
        bytes: bytesInUse,
        kb: (bytesInUse / 1024).toFixed(2),
        mb: (bytesInUse / 1024 / 1024).toFixed(2)
      }
    } catch (error) {
      console.error('获取存储使用情况失败:', error)
      return null
    }
  }

  /**
   * 监听存储变化
   */
  static onChanged(callback: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void) {
    chrome.storage.onChanged.addListener(callback)
  }

  /**
   * 移除存储变化监听
   */
  static removeOnChanged(callback: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void) {
    chrome.storage.onChanged.removeListener(callback)
  }
}