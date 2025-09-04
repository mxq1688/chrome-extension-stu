# Vue Browser Extension 框架

基于Vue.js 3构建的现代化浏览器插件开发框架，支持Manifest V3规范。

## ✨ 功能特性

- 🚀 **Vue 3 + Composition API** - 使用最新的Vue.js技术栈
- 📦 **Vite构建** - 快速的开发体验和构建速度
- 🎨 **现代化UI** - 精美的插件界面设计
- 🔧 **完整的开发工具链** - 热重载、TypeScript支持
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🛠 **丰富的API集成** - Chrome Extensions API完整支持
- 📊 **状态管理** - 使用Pinia进行状态管理
- 🌐 **路由系统** - Vue Router支持多页面

## 🛠 技术栈

- **Vue.js 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **Pinia** - Vue的直观状态管理库
- **Vue Router** - Vue.js官方路由
- **Chrome Extensions API** - 浏览器插件API

## 📁 项目结构

```
vue-browser-extension/
├── public/
│   ├── manifest.json          # 插件清单文件
│   └── icons/                 # 插件图标
├── src/
│   ├── popup/                 # 弹窗页面
│   │   ├── main.js           # 入口文件
│   │   ├── App.vue           # 主组件
│   │   ├── router.js         # 路由配置
│   │   ├── store/            # 状态管理
│   │   └── views/            # 页面组件
│   ├── background/           # 后台脚本
│   │   └── background.js
│   └── content/              # 内容脚本
│       └── content.js
├── scripts/
│   └── zip.js                # 打包脚本
├── vite.config.js            # Vite配置
└── package.json              # 项目依赖
```

## 🚀 快速开始

### 安装依赖

```bash
cd vue-browser-extension
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 打包扩展程序

```bash
npm run zip
```

## 📦 安装到浏览器

1. 构建项目：`npm run build`
2. 打开Chrome浏览器
3. 进入 `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择项目的`dist`文件夹

## 🎯 核心功能

### Popup界面
- **首页**：显示当前标签页信息和快捷操作
- **设置**：插件配置和偏好设置
- **关于**：插件信息和技术栈展示

### Background Script
- 插件生命周期管理
- 右键菜单集成
- 消息通信处理
- 标签页事件监听

### Content Script
- 页面内容分析
- DOM操作和样式注入
- 键盘快捷键支持
- 页面技术栈检测

## 🔧 开发指南

### 添加新页面

1. 在`src/popup/views/`创建新的Vue组件
2. 在`src/popup/router.js`中添加路由配置
3. 在导航组件中添加链接

### 状态管理

使用Pinia store管理插件状态：

```javascript
import { useExtensionStore } from '@/popup/store/extension'

const store = useExtensionStore()
store.setActive(true)
```

### Chrome API使用

```javascript
// 获取当前标签页
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

// 发送消息到background
const response = await chrome.runtime.sendMessage({ type: 'HELLO' })

// 存储数据
await chrome.storage.local.set({ key: 'value' })
```

## 📝 配置文件说明

### manifest.json
插件的核心配置文件，定义了：
- 插件基本信息
- 权限申请
- 脚本文件路径
- 图标和界面配置

### vite.config.js
Vite构建配置，包含：
- 多入口点配置
- 插件构建优化
- 开发服务器设置

## 🐛 调试技巧

1. **Popup调试**：右键点击插件图标 → 检查弹窗
2. **Background调试**：进入`chrome://extensions/` → 点击背景页面链接
3. **Content Script调试**：在网页中按F12，查看Console

## 🤝 贡献指南

1. Fork本项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交Pull Request

## 📄 许可证

MIT License © 2024

## 🔗 相关链接

- [Chrome Extensions文档](https://developer.chrome.com/docs/extensions/)
- [Vue.js官方文档](https://vuejs.org/)
- [Vite官方文档](https://vitejs.dev/)
- [Pinia状态管理](https://pinia.vuejs.org/)

---

**Happy Coding! 🎉**