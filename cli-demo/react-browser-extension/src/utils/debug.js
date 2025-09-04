/**
 * 调试工具类
 * 提供开发环境下的调试功能
 */

export class DebugHelper {
  static isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * 调试日志
   * @param {string} message - 消息
   * @param {any} data - 数据
   */
  static log(message, data = null) {
    if (this.isDevelopment) {
      console.log(`[React Extension Debug] ${message}`, data || '')
    }
  }

  /**
   * 错误日志
   * @param {string} message - 消息
   * @param {Error} error - 错误对象
   */
  static error(message, error = null) {
    if (this.isDevelopment) {
      console.error(`[React Extension Error] ${message}`, error || '')
    }
  }

  /**
   * 警告日志
   * @param {string} message - 消息
   * @param {any} data - 数据
   */
  static warn(message, data = null) {
    if (this.isDevelopment) {
      console.warn(`[React Extension Warning] ${message}`, data || '')
    }
  }

  /**
   * 性能计时开始
   * @param {string} label - 标签
   */
  static timeStart(label) {
    if (this.isDevelopment) {
      console.time(`[React Extension] ${label}`)
    }
  }

  /**
   * 性能计时结束
   * @param {string} label - 标签
   */
  static timeEnd(label) {
    if (this.isDevelopment) {
      console.timeEnd(`[React Extension] ${label}`)
    }
  }

  /**
   * 分组日志开始
   * @param {string} groupName - 分组名称
   */
  static groupStart(groupName) {
    if (this.isDevelopment) {
      console.group(`[React Extension] ${groupName}`)
    }
  }

  /**
   * 分组日志结束
   */
  static groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd()
    }
  }

  /**
   * 打印对象详细信息
   * @param {any} obj - 对象
   * @param {string} title - 标题
   */
  static inspect(obj, title = 'Object') {
    if (this.isDevelopment) {
      console.group(`[React Extension] ${title}`)
      console.table(obj)
      console.groupEnd()
    }
  }

  /**
   * 断言
   * @param {boolean} condition - 条件
   * @param {string} message - 错误消息
   */
  static assert(condition, message) {
    if (this.isDevelopment) {
      console.assert(condition, `[React Extension Assertion] ${message}`)
    }
  }

  /**
   * 获取调用栈
   */
  static trace() {
    if (this.isDevelopment) {
      console.trace('[React Extension Trace]')
    }
  }

  /**
   * 打印扩展信息
   */
  static printExtensionInfo() {
    if (this.isDevelopment) {
      const manifest = chrome.runtime.getManifest()
      this.groupStart('Extension Info')
      this.log('Name', manifest.name)
      this.log('Version', manifest.version)
      this.log('Manifest Version', manifest.manifest_version)
      this.log('Permissions', manifest.permissions)
      this.groupEnd()
    }
  }

  /**
   * 监控存储变化
   */
  static monitorStorage() {
    if (this.isDevelopment) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        this.groupStart(`Storage Changed (${areaName})`)
        Object.keys(changes).forEach(key => {
          this.log(`${key}:`, {
            oldValue: changes[key].oldValue,
            newValue: changes[key].newValue
          })
        })
        this.groupEnd()
      })
    }
  }

  /**
   * 启用所有监控
   */
  static enableAllMonitoring() {
    if (this.isDevelopment) {
      this.printExtensionInfo()
      this.monitorStorage()
      this.log('所有调试监控已启用')
    }
  }
}