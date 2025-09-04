# 🎙️ 录音助手 (Voice Recorder Extension)

一个功能强大的录音浏览器扩展，基于 Vue.js 3 开发，支持高质量录音、播放、管理和导出功能。

## ✨ 主要功能

- 🎤 **高质量录音** - 支持多种音质设置（高/中/低质量）
- ⏸️ **录音控制** - 开始、暂停、继续、停止录音
- 📂 **录音管理** - 录音库管理，支持重命名、删除、导出
- 🎵 **音频播放** - 内置播放器，支持进度控制
- 💾 **本地存储** - 录音文件本地保存，隐私安全
- 🔧 **自定义设置** - 录音质量、时长限制、自动保存等
- 🌐 **网页录音** - 支持在任何网页上快速录音（右键菜单）
- 🔔 **智能通知** - 录音状态提醒和操作反馈
- ⌨️ **快捷键** - Ctrl+Shift+R 快速开始/停止录音

## 🛠️ 技术栈

- **前端框架**: Vue.js 3 + Composition API
- **构建工具**: Vite 5.x
- **状态管理**: Pinia 2.x
- **路由**: Vue Router 4.x
- **样式**: 原生 CSS + CSS Variables
- **扩展 API**: Chrome Extension Manifest V3
- **音频 API**: Web Audio API + MediaRecorder API

## 📋 系统要求

- Chrome 88+ 或其他基于 Chromium 的浏览器
- 麦克风设备
- HTTPS 环境（本地开发可使用 localhost）

## 🚀 开发环境搭建

### 前置要求

- Node.js 16.0+
- npm 8.0+ 或 yarn 1.22+

### 安装步骤

1. **克隆或下载项目**
   ```bash
   cd voice-recorder-extension
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

3. **创建图标文件**
   ```bash
   node create-icons.js
   ```

4. **开发模式运行**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

5. **构建生产版本**
   ```bash
   npm run build
   # 或
   yarn build
   ```

6. **打包扩展**
   ```bash
   npm run zip
   # 或
   yarn zip
   ```

## 📦 安装扩展

### 开发版安装

1. 构建项目：`npm run build`
2. 打开 Chrome 浏览器
3. 访问 `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择项目的 `dist` 文件夹

### 生产版安装

1. 运行 `npm run zip` 生成 zip 包
2. 在 Chrome Web Store 开发者控制台上传 zip 文件
3. 或手动加载 zip 文件到浏览器

## 🎯 使用指南

### 基础录音

1. 点击浏览器工具栏的录音助手图标
2. 首次使用时授权麦克风权限
3. 点击"开始录音"按钮
4. 录音过程中可以暂停/继续
5. 点击"停止"结束录音并保存

### 网页快速录音

1. 在任何网页上右键点击
2. 选择"录音助手" -> "开始录音"
3. 页面右上角会显示录音状态
4. 点击停止按钮或使用快捷键 Ctrl+Shift+R

### 录音管理

1. 在扩展popup中点击"录音库"标签
2. 查看所有录音文件和详细信息
3. 点击播放按钮试听录音
4. 使用更多选项进行重命名、下载、分享、删除

### 设置配置

1. 点击"设置"标签
2. 调整录音质量（影响文件大小和音质）
3. 设置最大录音时长
4. 开启/关闭自动保存和通知

## 📁 项目结构

```
voice-recorder-extension/
├── public/
│   ├── icons/           # 扩展图标
│   └── manifest.json    # 扩展清单文件
├── src/
│   ├── background/      # 后台脚本
│   ├── content/         # 内容脚本
│   ├── popup/           # 弹窗页面
│   │   ├── components/  # Vue 组件
│   │   ├── store/       # Pinia 状态管理
│   │   ├── views/       # 页面视图
│   │   ├── App.vue      # 主应用组件
│   │   ├── main.js      # 入口文件
│   │   ├── router.js    # 路由配置
│   │   └── style.css    # 全局样式
│   └── utils/           # 工具函数
├── scripts/             # 构建脚本
├── popup.html          # 弹窗 HTML
├── vite.config.js      # Vite 配置
└── package.json        # 项目配置
```

## 🔧 配置说明

### 录音质量设置

- **高质量** (128 kbps): 最佳音质，文件较大
- **中等质量** (64 kbps): 平衡音质和文件大小
- **低质量** (32 kbps): 最小文件大小，音质一般

### 支持的音频格式

- 主要格式：WebM (Opus 编码)
- 备用格式：OGG, MP4, WAV
- 输出格式：根据浏览器支持自动选择

## 🔒 隐私安全

- ✅ 所有录音文件仅保存在本地浏览器存储
- ✅ 不上传任何音频数据到服务器
- ✅ 麦克风权限仅在录音时使用
- ✅ 符合 Chrome 扩展安全策略
- ✅ 开源代码，透明可审计

## 🐛 故障排除

### 常见问题

**Q: 无法获取麦克风权限？**
A: 确保在 HTTPS 环境下使用，检查浏览器麦克风权限设置

**Q: 录音文件无法播放？**
A: 检查浏览器是否支持 WebM 格式，尝试下载后用其他播放器打开

**Q: 录音质量不佳？**
A: 调整设置中的音频质量，确保麦克风工作正常

**Q: 扩展图标不显示？**
A: 检查 `public/icons/` 目录是否有图标文件，运行 `node create-icons.js` 生成

### 技术支持

如遇到问题，请检查：
1. 浏览器控制台是否有错误信息
2. 扩展是否正确加载
3. 麦克风权限是否已授予
4. 网络环境是否为 HTTPS

## 🚀 开发指南

### 添加新功能

1. 在 `src/popup/views/` 添加新页面
2. 在 `src/popup/store/` 更新状态管理
3. 在 `src/utils/` 添加工具函数
4. 更新路由配置

### 调试技巧

1. **Popup 调试**: 右键扩展图标 -> 检查弹出式窗口
2. **Background 调试**: chrome://extensions -> 背景页面
3. **Content Script 调试**: 在网页上按 F12，查看 Console

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**作者**: AI Assistant  
**版本**: 1.0.0  
**更新时间**: 2024年