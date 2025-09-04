/**
 * Chrome消息通信API封装
 * 提供简化的消息发送和接收方法
 */

export class ExtensionMessaging {
  /**
   * 发送消息到background script
   * @param {object} message - 消息对象
   * @param {number} timeout - 超时时间（毫秒）
   */
  static async sendToBackground(message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('消息发送超时'))
      }, timeout)

      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timer)
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }

  /**
   * 发送消息到content script
   * @param {number} tabId - 标签页ID
   * @param {object} message - 消息对象
   * @param {number} timeout - 超时时间（毫秒）
   */
  static async sendToContentScript(tabId, message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('消息发送超时'))
      }, timeout)

      chrome.tabs.sendMessage(tabId, message, (response) => {
        clearTimeout(timer)
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }

  /**
   * 发送消息到所有标签页
   * @param {object} message - 消息对象
   * @param {object} queryInfo - 标签页查询条件
   */
  static async sendToAllTabs(message, queryInfo = {}) {
    try {
      const tabs = await chrome.tabs.query(queryInfo)
      const promises = tabs.map(tab => 
        this.sendToContentScript(tab.id, message).catch(error => ({
          tabId: tab.id,
          error: error.message
        }))
      )
      return await Promise.all(promises)
    } catch (error) {
      throw new Error(`发送消息到所有标签页失败: ${error.message}`)
    }
  }

  /**
   * 监听来自background的消息
   * @param {function} callback - 回调函数
   */
  static onMessage(callback) {
    if (typeof callback === 'function') {
      chrome.runtime.onMessage.addListener(callback)
    }
  }

  /**
   * 移除消息监听
   * @param {function} callback - 回调函数
   */
  static removeOnMessage(callback) {
    if (typeof callback === 'function') {
      chrome.runtime.onMessage.removeListener(callback)
    }
  }

  /**
   * 获取当前标签页信息
   */
  static async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      return tab
    } catch (error) {
      throw new Error(`获取当前标签页失败: ${error.message}`)
    }
  }

  /**
   * 获取所有标签页信息
   * @param {object} queryInfo - 查询条件
   */
  static async getAllTabs(queryInfo = {}) {
    try {
      return await chrome.tabs.query(queryInfo)
    } catch (error) {
      throw new Error(`获取标签页失败: ${error.message}`)
    }
  }

  /**
   * 创建新标签页
   * @param {object} createProperties - 创建属性
   */
  static async createTab(createProperties) {
    try {
      return await chrome.tabs.create(createProperties)
    } catch (error) {
      throw new Error(`创建标签页失败: ${error.message}`)
    }
  }

  /**
   * 更新标签页
   * @param {number} tabId - 标签页ID
   * @param {object} updateProperties - 更新属性
   */
  static async updateTab(tabId, updateProperties) {
    try {
      return await chrome.tabs.update(tabId, updateProperties)
    } catch (error) {
      throw new Error(`更新标签页失败: ${error.message}`)
    }
  }

  /**
   * 关闭标签页
   * @param {number|number[]} tabIds - 标签页ID或ID数组
   */
  static async closeTabs(tabIds) {
    try {
      await chrome.tabs.remove(tabIds)
      return true
    } catch (error) {
      throw new Error(`关闭标签页失败: ${error.message}`)
    }
  }

  /**
   * 截取标签页截图
   * @param {object} options - 截图选项
   */
  static async captureVisibleTab(options = {}) {
    try {
      return await chrome.tabs.captureVisibleTab(options)
    } catch (error) {
      throw new Error(`截图失败: ${error.message}`)
    }
  }

  /**
   * 在标签页中执行脚本
   * @param {number} tabId - 标签页ID
   * @param {object} details - 脚本详情
   */
  static async executeScript(tabId, details) {
    try {
      return await chrome.scripting.executeScript({
        target: { tabId },
        ...details
      })
    } catch (error) {
      throw new Error(`执行脚本失败: ${error.message}`)
    }
  }

  /**
   * 注入CSS到标签页
   * @param {number} tabId - 标签页ID
   * @param {object} details - CSS详情
   */
  static async insertCSS(tabId, details) {
    try {
      return await chrome.scripting.insertCSS({
        target: { tabId },
        ...details
      })
    } catch (error) {
      throw new Error(`注入CSS失败: ${error.message}`)
    }
  }
}