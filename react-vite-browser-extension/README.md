# React + Vite Browser Extension 框架

基于**React 18 + Vite**构建的现代化浏览器插件开发框架，提供极速开发体验和类型安全保障。

## ✨ 功能特性

- ⚛️ **React 18** - 最新的React技术栈与Hooks
- ⚡ **Vite超快构建** - 毫秒级热重载，极速开发体验
- 🔷 **TypeScript** - 完整类型支持，开发更安全
- 📊 **Zustand状态管理** - 轻量级、类型安全的状态管理
- 🌐 **React Router** - 单页面应用路由系统
- 🎨 **现代化UI** - 精美的响应式界面设计
- 🛠 **完整工具链** - 开发、构建、打包一站式解决方案
- 📱 **Manifest V3** - 支持最新浏览器插件规范
- 🔧 **丰富的API封装** - Chrome Extensions API完整封装

## 🛠 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 18+ | 现代化UI框架 |
| **Vite** | 5+ | 下一代前端构建工具 |
| **TypeScript** | 5+ | 类型安全的JavaScript |
| **Zustand** | 4+ | 轻量级状态管理 |
| **React Router** | 6+ | 声明式路由 |

## 📁 项目结构

```
react-vite-browser-extension/
├── public/
│   ├── manifest.json          # 插件清单文件
│   └── icons/                 # 插件图标
├── src/
│   ├── popup/                 # 弹窗页面
│   │   ├── main.tsx          # 入口文件
│   │   ├── App.tsx           # 主组件
│   │   ├── components/       # 公共组件
│   │   ├── pages/            # 页面组件
│   │   ├── store/            # Zustand状态管理
│   │   └── styles/           # 样式文件
│   ├── background/           # 后台脚本
│   │   └── background.ts
│   ├── content/              # 内容脚本
│   │   └── content.ts
│   ├── utils/                # 工具类
│   │   ├── storage.ts       # 存储封装
│   │   └── messaging.ts     # 消息通信
│   └── types/                # TypeScript类型定义
├── scripts/
│   └── zip.js                # 打包脚本
├── vite.config.ts            # Vite配置
├── tsconfig.json             # TypeScript配置
└── package.json              # 项目依赖
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0 或 **yarn** >= 1.22.0

### 安装依赖

```bash
cd react-vite-browser-extension
npm install
```

### 开发模式

```bash
npm run dev
```

> 💡 Vite将启动开发服务器，支持热重载和即时更新

### 构建生产版本

```bash
npm run build
```

### 监听模式构建

```bash
npm run watch
```

### 打包扩展程序

```bash
npm run zip
```

## 📦 安装到浏览器

### 方法一：加载解压扩展程序

1. 运行 `npm run build` 构建项目
2. 打开Chrome浏览器
3. 进入 `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择项目的 `dist` 文件夹

### 方法二：安装打包文件

1. 运行 `npm run zip` 生成zip包
2. 拖拽生成的 `.zip` 文件到扩展程序页面

## 🎯 核心功能

### 🖼 Popup界面

- **首页** - 显示当前标签页信息和快捷操作
- **设置** - 插件配置和个性化选项
- **关于** - 插件信息和技术栈展示

### 🔧 Background Script

- 插件生命周期管理
- 右键菜单集成
- 消息通信处理
- 标签页事件监听
- 通知系统

### 📄 Content Script

- 页面内容分析
- DOM操作和样式注入
- 键盘快捷键支持
- 页面技术栈检测
- 元素高亮功能

## 🔧 开发指南

### 添加新页面

1. 在 `src/popup/pages/` 创建新的React组件
2. 在 `src/popup/App.tsx` 中添加路由配置
3. 在导航组件中添加链接

```tsx
// src/popup/pages/NewPage.tsx
import React from 'react'

const NewPage: React.FC = () => {
  return (
    <div className="new-page">
      <h2>新页面</h2>
    </div>
  )
}

export default NewPage
```

### 状态管理

使用Zustand进行状态管理：

```tsx
import { useExtensionStore } from '@popup/store/extensionStore'

function MyComponent() {
  const { isActive, setActive, showMessage } = useExtensionStore()
  
  const handleToggle = () => {
    setActive(!isActive)
    showMessage('状态已更新', 'success')
  }
  
  return (
    <button onClick={handleToggle}>
      {isActive ? '禁用' : '启用'}
    </button>
  )
}
```

### Chrome API使用

```typescript
import { ExtensionMessaging, ExtensionStorage } from '@utils'

// 获取当前标签页
const tab = await ExtensionMessaging.getCurrentTab()

// 发送消息到background
const response = await ExtensionMessaging.sendToBackground({
  type: 'GET_DATA'
})

// 存储数据
await ExtensionStorage.setLocal('settings', { theme: 'dark' })
const settings = await ExtensionStorage.getLocal<Settings>('settings')
```

### 添加新的工具函数

```typescript
// src/utils/helpers.ts
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebounceFunction<T> => {
  let timeout: NodeJS.Timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
```

## 🎨 样式定制

项目使用模块化CSS设计：

- `src/popup/styles/index.css` - 全局样式和重置
- `src/popup/styles/App.css` - 应用主题样式
- 组件级样式 - 每个组件可以有独立的样式文件

### 主题定制

```css
/* 修改主色调 */
.btn-primary {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}

.header {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

## 📝 配置文件说明

### manifest.json

插件的核心配置文件：

```json
{
  "manifest_version": 3,
  "name": "React Vite Extension",
  "permissions": ["storage", "activeTab", "scripting"],
  "action": { "default_popup": "popup.html" },
  "background": { "service_worker": "background.js" }
}
```

### vite.config.ts

Vite构建配置：

- 多入口点配置
- TypeScript支持
- 路径别名设置
- 插件优化配置

### tsconfig.json

TypeScript配置：

- 严格类型检查
- 路径映射
- 现代ES特性支持
- Chrome API类型支持

## 🐛 调试技巧

### 开发调试

1. **Popup调试**：右键点击插件图标 → 检查弹窗
2. **Background调试**：进入 `chrome://extensions/` → 点击背景页面链接
3. **Content Script调试**：在网页中按F12，查看Console
4. **TypeScript错误**：运行 `npm run type-check`

### 性能分析

```typescript
// 使用内置的性能分析
import { DebugHelper } from '@utils/debug'

DebugHelper.timeStart('页面分析')
// 执行操作
DebugHelper.timeEnd('页面分析')
```

## 🚀 性能优势

### Vite带来的优势

- **⚡ 极速启动** - 冷启动时间 < 1秒
- **🔥 热重载** - 毫秒级更新响应
- **📦 优化打包** - 基于Rollup的生产构建
- **🔧 零配置** - 开箱即用的TypeScript支持

### 与传统Webpack对比

| 特性 | Vite | Webpack |
|------|------|----------|
| 冷启动 | < 1s | 5-10s |
| 热重载 | < 100ms | 1-3s |
| 构建速度 | 快 | 中等 |
| 配置复杂度 | 低 | 高 |

## 🤝 贡献指南

1. Fork本项目
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -am 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

### 代码规范

- 使用TypeScript编写所有新功能
- 遵循React Hooks最佳实践
- 添加适当的类型注解
- 编写清晰的注释

## 📄 许可证

MIT License © 2024

## 🔗 相关链接

- [Chrome Extensions文档](https://developer.chrome.com/docs/extensions/)
- [React官方文档](https://react.dev/)
- [Vite官方文档](https://vitejs.dev/)
- [TypeScript文档](https://www.typescriptlang.org/)
- [Zustand状态管理](https://zustand-demo.pmnd.rs/)

## 💡 常见问题

### Q: 如何添加新的Chrome权限？
A: 在 `public/manifest.json` 的 `permissions` 数组中添加所需权限。

### Q: 如何处理跨域请求？
A: 在 `host_permissions` 中添加目标域名，或使用代理。

### Q: 如何优化构建体积？
A: Vite会自动进行tree-shaking和代码分割，无需额外配置。

### Q: 如何添加单元测试？
A: 推荐使用Vitest，与Vite完美集成。

---

**🎉 享受使用React + Vite进行浏览器插件开发的乐趣！**

如果这个框架对您有帮助，请给我们一个⭐Star支持！