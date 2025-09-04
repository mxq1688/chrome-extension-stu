const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

// 创建打包脚本
function createExtensionZip() {
  const outputPath = path.join(__dirname, '..', 'vue-extension.zip')
  const distPath = path.join(__dirname, '..', 'dist')
  
  if (!fs.existsSync(distPath)) {
    console.error('错误: dist目录不存在，请先运行 npm run build')
    process.exit(1)
  }
  
  const output = fs.createWriteStream(outputPath)
  const archive = archiver('zip', { zlib: { level: 9 } })
  
  output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2)
    console.log('✅ 打包完成!')
    console.log('📦 文件: vue-extension.zip')
    console.log('📏 大小:', sizeInMB, 'MB')
    console.log('📂 位置:', outputPath)
  })
  
  archive.pipe(output)
  archive.directory(distPath, false)
  archive.finalize()
}

console.log('🔨 开始打包Vue浏览器扩展程序...')
createExtensionZip()