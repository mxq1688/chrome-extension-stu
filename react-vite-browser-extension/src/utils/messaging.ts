/**
 * Chrome消息通信API封装
 * 提供类型安全的消息发送和接收方法
 */

interface MessageResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
}

export class ExtensionMessaging {
  /**
   * 发送消息到background script
   */
  static async sendToBackground<T = any>(message: any, timeout: number = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('消息发送超时'))
      }, timeout)

      chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
        clearTimeout(timer)
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else if (response?.error) {
          reject(new Error(response.error))
        } else {
          resolve(response?.data || response as T)
        }
      })
    })
  }

  /**
   * 发送消息到content script
   */
  static async sendToContentScript<T = any>(
    tabId: number, 
    message: any, 
    timeout: number = 5000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('消息发送超时'))
      }, timeout)

      chrome.tabs.sendMessage(tabId, message, (response: MessageResponse<T>) => {
        clearTimeout(timer)
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else if (response?.error) {
          reject(new Error(response.error))
        } else {
          resolve(response?.data || response as T)
        }
      })
    })
  }

  /**
   * 发送消息到所有标签页
   */
  static async sendToAllTabs<T = any>(
    message: any, 
    queryInfo: chrome.tabs.QueryInfo = {}
  ): Promise<Array<{ tabId: number; result?: T; error?: string }>> {
    try {
      const tabs = await chrome.tabs.query(queryInfo)
      const promises = tabs.map(tab => 
        this.sendToContentScript<T>(tab.id!, message)
          .then(result => ({ tabId: tab.id!, result }))
          .catch(error => ({ tabId: tab.id!, error: error.message }))
      )
      return await Promise.all(promises)
    } catch (error) {
      throw new Error(`发送消息到所有标签页失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 监听消息
   */
  static onMessage<T = any>(
    callback: (
      message: any, 
      sender: chrome.runtime.MessageSender, 
      sendResponse: (response?: MessageResponse<T>) => void
    ) => void | boolean | Promise<any>
  ) {
    const wrappedCallback = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      try {
        const result = callback(message, sender, sendResponse)
        
        // 如果返回Promise，等待其完成
        if (result instanceof Promise) {
          result
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }))
          return true // 保持消息通道开放
        }
        
        return result
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    chrome.runtime.onMessage.addListener(wrappedCallback)
    return wrappedCallback
  }

  /**
   * 移除消息监听
   */
  static removeOnMessage(callback: any) {
    chrome.runtime.onMessage.removeListener(callback)
  }

  /**
   * 获取当前标签页
   */
  static async getCurrentTab(): Promise<chrome.tabs.Tab> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab) {
        throw new Error('未找到当前标签页')
      }
      return tab
    } catch (error) {
      throw new Error(`获取当前标签页失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取所有标签页
   */
  static async getAllTabs(queryInfo: chrome.tabs.QueryInfo = {}): Promise<chrome.tabs.Tab[]> {
    try {
      return await chrome.tabs.query(queryInfo)
    } catch (error) {
      throw new Error(`获取标签页失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 创建新标签页
   */
  static async createTab(createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
    try {
      return await chrome.tabs.create(createProperties)
    } catch (error) {
      throw new Error(`创建标签页失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 更新标签页
   */
  static async updateTab(tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab> {
    try {
      return await chrome.tabs.update(tabId, updateProperties)
    } catch (error) {
      throw new Error(`更新标签页失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 截取标签页截图
   */
  static async captureVisibleTab(options: chrome.tabs.CaptureVisibleTabOptions = {}): Promise<string> {
    try {
      return await chrome.tabs.captureVisibleTab(options)
    } catch (error) {
      throw new Error(`截图失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 在标签页中执行脚本
   */
  static async executeScript<T = any>(
    tabId: number, 
    details: chrome.scripting.ScriptInjection
  ): Promise<chrome.scripting.InjectionResult<T>[]> {
    try {
      return await chrome.scripting.executeScript({
        target: { tabId },
        ...details
      })
    } catch (error) {
      throw new Error(`执行脚本失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}