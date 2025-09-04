const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

// 创建打包脚本
function createExtensionZip() {
  const outputPath = path.join(__dirname, '..', 'react-vite-extension.zip')
  const distPath = path.join(__dirname, '..', 'dist')
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ 错误: dist目录不存在，请先运行 npm run build')
    process.exit(1)
  }
  
  const output = fs.createWriteStream(outputPath)
  const archive = archiver('zip', { zlib: { level: 9 } })
  
  output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2)
    console.log('\n🎉 打包完成!')
    console.log('📦 文件名: react-vite-extension.zip')
    console.log(`📏 大小: ${sizeInMB} MB (${archive.pointer()} bytes)`)
    console.log(`📂 位置: ${outputPath}`)
    console.log('\n🚀 安装到浏览器:')
    console.log('1. 打开Chrome浏览器')
    console.log('2. 进入 chrome://extensions/')
    console.log('3. 开启"开发者模式"')
    console.log('4. 点击"加载已解压的扩展程序"')
    console.log('5. 选择解压后的dist文件夹')
    console.log('\n或者拖拽 .zip 文件到扩展程序页面进行安装')
  })
  
  output.on('error', (err) => {
    console.error('❌ 打包失败:', err)
    process.exit(1)
  })
  
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('⚠️  警告:', err)
    } else {
      throw err
    }
  })
  
  archive.on('error', (err) => {
    console.error('❌ 归档失败:', err)
    process.exit(1)
  })
  
  console.log('🔨 开始打包React + Vite浏览器扩展程序...')
  
  // 开始打包
  archive.pipe(output)
  
  // 添加dist目录下的所有文件
  archive.directory(distPath, false)
  
  // 完成打包
  archive.finalize()
}

// 检查命令行参数
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log('React + Vite Browser Extension 打包工具\n')
  console.log('使用方法:')
  console.log('  npm run zip     # 打包扩展程序')
  console.log('  npm run build   # 构建项目\n')
  console.log('⚠️  打包前请确保已运行 npm run build 构建项目')
  process.exit(0)
}

createExtensionZip()