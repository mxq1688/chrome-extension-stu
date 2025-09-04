// 创建 PNG 图标的脚本
import fs from 'fs'
import path from 'path'

const iconsDir = 'public/icons'

// 确保图标目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 简单的 PNG 图标数据 (base64 编码的红色麦克风图标)
const createPngIcon = (size) => {
  // 这是一个简化的 PNG 数据，实际项目中建议使用专业工具生成
  const canvas = `
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ee5a24;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="url(#grad)" stroke="#fff" stroke-width="2"/>
    <rect x="${size*0.3}" y="${size*0.25}" width="${size*0.4}" height="${size*0.5}" rx="${size*0.1}" fill="#fff"/>
    <circle cx="${size/2}" cy="${size*0.75}" r="${size*0.08}" fill="#fff"/>
  </svg>
  `
  return canvas
}

// 生成 PNG 图标的说明文档
const createPngGuide = () => {
  return `# PNG 图标转换指南

由于系统限制，这里提供几种创建 PNG 图标的方法：

## 方法1: 在线转换工具
1. 访问 https://convertio.co/svg-png/
2. 上传 SVG 文件
3. 下载对应的 PNG 文件

## 方法2: 使用 Figma/Sketch
1. 导入 SVG 文件
2. 导出为 PNG 格式
3. 设置对应尺寸 (16x16, 32x32, 48x48, 128x128)

## 方法3: 使用命令行工具
\`\`\`bash
# 使用 ImageMagick
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 32x32 icon32.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png

# 使用 Inkscape
inkscape icon.svg -o icon16.png -w 16 -h 16
inkscape icon.svg -o icon32.png -w 32 -h 32
inkscape icon.svg -o icon48.png -w 48 -h 48
inkscape icon.svg -o icon128.png -w 128 -h 128
\`\`\`

## 方法4: 使用在线 SVG 转 PNG
- https://svgpng.com/
- https://cloudconvert.com/svg-to-png
- https://onlineconvertfree.com/convert-format/svg-to-png/

## 临时方案
您也可以使用任何 16x16、32x32、48x48、128x128 的 PNG 图标文件，
只需重命名为 icon16.png、icon32.png、icon48.png、icon128.png 即可。

推荐的图标特征：
- 红色/橙色渐变背景
- 白色麦克风图标
- 圆形或圆角方形设计
- 简洁清晰的设计
`
}

// 删除 SVG 文件
const sizes = [16, 32, 48, 128]
sizes.forEach(size => {
  const svgPath = path.join(iconsDir, `icon${size}.svg`)
  if (fs.existsSync(svgPath)) {
    fs.unlinkSync(svgPath)
    console.log(`✅ 删除: icon${size}.svg`)
  }
})

// 创建指南文档
fs.writeFileSync(path.join(iconsDir, 'PNG转换指南.md'), createPngGuide())

console.log('\n📝 PNG 转换指南已创建！')
console.log('📁 请手动创建以下 PNG 文件：')
sizes.forEach(size => {
  console.log(`   - icon${size}.png (${size}x${size})`)
})
console.log('\n💡 或使用在线工具转换现有的 SVG 文件')
