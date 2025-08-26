/**
 * Chrome Storage API 封装
 * 提供简化的存储操作方法
 */

export class ExtensionStorage {
  /**
   * 保存数据到本地存储
   * @param {string|object} key - 键名或键值对对象
   * @param {any} value - 值（当key为string时）
   */
  static async setLocal(key, value) {
    try {
      const data = typeof key === 'string' ? { [key]: value } : key
      await chrome.storage.local.set(data)
      return true
    } catch (error) {
      console.error('保存本地数据失败:', error)
      return false
    }
  }

  /**
   * 从本地存储获取数据
   * @param {string|array} keys - 键名或键名数组
   */
  static async getLocal(keys) {
    try {
      const result = await chrome.storage.local.get(keys)
      return typeof keys === 'string' ? result[keys] : result
    } catch (error) {
      console.error('获取本地数据失败:', error)
      return null
    }
  }

  /**
   * 保存数据到同步存储
   * @param {string|object} key - 键名或键值对对象
   * @param {any} value - 值（当key为string时）
   */
  static async setSync(key, value) {
    try {
      const data = typeof key === 'string' ? { [key]: value } : key
      await chrome.storage.sync.set(data)
      return true
    } catch (error) {
      console.error('保存同步数据失败:', error)
      return false
    }
  }

  /**
   * 从同步存储获取数据
   * @param {string|array} keys - 键名或键名数组
   */
  static async getSync(keys) {
    try {
      const result = await chrome.storage.sync.get(keys)
      return typeof keys === 'string' ? result[keys] : result
    } catch (error) {
      console.error('获取同步数据失败:', error)
      return null
    }
  }

  /**
   * 删除本地存储数据
   * @param {string|array} keys - 键名或键名数组
   */
  static async removeLocal(keys) {
    try {
      await chrome.storage.local.remove(keys)
      return true
    } catch (error) {
      console.error('删除本地数据失败:', error)
      return false
    }
  }

  /**
   * 删除同步存储数据
   * @param {string|array} keys - 键名或键名数组
   */
  static async removeSync(keys) {
    try {
      await chrome.storage.sync.remove(keys)
      return true
    } catch (error) {
      console.error('删除同步数据失败:', error)
      return false
    }
  }

  /**
   * 清空本地存储
   */
  static async clearLocal() {
    try {
      await chrome.storage.local.clear()
      return true
    } catch (error) {
      console.error('清空本地存储失败:', error)
      return false
    }
  }

  /**
   * 清空同步存储
   */
  static async clearSync() {
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
   * @param {'local'|'sync'} type - 存储类型
   */
  static async getBytesInUse(type = 'local') {
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
   * @param {function} callback - 回调函数
   */
  static onChanged(callback) {
    if (typeof callback === 'function') {
      chrome.storage.onChanged.addListener(callback)
    }
  }

  /**
   * 移除存储变化监听
   * @param {function} callback - 回调函数
   */
  static removeOnChanged(callback) {
    if (typeof callback === 'function') {
      chrome.storage.onChanged.removeListener(callback)
    }
  }
}