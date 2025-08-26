# React Browser Extension 框架

基于React 18构建的现代化浏览器插件开发框架，支持Manifest V3规范。

## ✨ 功能特性

- ⚛️ **React 18 + Hooks** - 使用最新的React技术栈
- 📦 **Webpack构建** - 成熟稳定的构建工具
- 🎨 **现代化UI** - 精美的插件界面设计
- 🔧 **完整的开发工具链** - 热重载、Babel转译
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🛠 **丰富的API集成** - Chrome Extensions API完整支持
- 📊 **状态管理** - 使用Context API和useReducer
- 🌐 **路由系统** - React Router支持多页面

## 🛠 技术栈

- **React 18** - 用于构建用户界面的JavaScript库
- **Webpack** - 模块打包工具
- **Babel** - JavaScript编译器
- **React Router** - React路由库
- **Chrome Extensions API** - 浏览器插件API

## 📁 项目结构

```
react-browser-extension/
├── public/
│   ├── manifest.json          # 插件清单文件
│   ├── popup.html            # 弹窗HTML模板
│   └── icons/                # 插件图标
├── src/
│   ├── popup/                # 弹窗页面
│   │   ├── index.jsx         # 入口文件
│   │   ├── App.jsx           # 主组件
│   │   ├── components/       # 公共组件
│   │   ├── context/          # Context状态管理
│   │   ├── pages/            # 页面组件
│   │   └── styles/           # 样式文件
│   ├── background/           # 后台脚本
│   │   └── background.js
│   └── content/              # 内容脚本
│       └── content.js
├── scripts/
│   └── zip.js                # 打包脚本
├── webpack.config.js         # Webpack配置
├── .babelrc                  # Babel配置
└── package.json              # 项目依赖
```

## 🚀 快速开始

### 安装依赖

```bash
cd react-browser-extension
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

1. 在`src/popup/pages/`创建新的React组件
2. 在`src/popup/App.jsx`中添加路由配置
3. 在导航组件中添加链接

### 状态管理

使用Context API管理插件状态：

```jsx
import { useExtension } from '@/popup/context/ExtensionContext'

function MyComponent() {
  const { isActive, setActive } = useExtension()
  
  return (
    <button onClick={() => setActive(!isActive)}>
      {isActive ? '禁用' : '启用'}
    </button>
  )
}
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

### webpack.config.js
Webpack构建配置，包含：
- 多入口点配置
- Babel转译配置
- 插件和加载器设置
- 开发和生产环境优化

### .babelrc
Babel转译配置：
- ES6+语法转换
- React JSX支持
- 浏览器兼容性设置

## 🐛 调试技巧

1. **Popup调试**：右键点击插件图标 → 检查弹窗
2. **Background调试**：进入`chrome://extensions/` → 点击背景页面链接
3. **Content Script调试**：在网页中按F12，查看Console
4. **React DevTools**：安装React Developer Tools扩展

## 🎨 样式定制

项目使用CSS模块化设计：
- `src/popup/styles/index.css` - 全局样式
- `src/popup/styles/App.css` - 应用样式
- 每个组件可以有独立的CSS文件

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
- [React官方文档](https://react.dev/)
- [Webpack官方文档](https://webpack.js.org/)
- [React Router文档](https://reactrouter.com/)

---

**Happy Coding! 🎉**