// 创建简单的录音图标文件
import fs from 'fs'
import path from 'path'

const iconsDir = 'public/icons'

// 确保图标目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 创建简单的 SVG 图标
const createSvgIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ee5a24;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="url(#grad)" stroke="#fff" stroke-width="2"/>
  <rect x="${size*0.3}" y="${size*0.25}" width="${size*0.4}" height="${size*0.5}" rx="${size*0.1}" fill="#fff"/>
  <circle cx="${size/2}" cy="${size*0.75}" r="${size*0.08}" fill="#fff"/>
</svg>`
}

// 生成不同尺寸的图标
const sizes = [16, 32, 48, 128]

sizes.forEach(size => {
  const svgContent = createSvgIcon(size)
  const svgPath = path.join(iconsDir, `icon${size}.svg`)
  
  fs.writeFileSync(svgPath, svgContent)
  console.log(`✅ 创建图标: icon${size}.svg`)
})

// 创建简单的 PNG 替代说明
const pngNote = `# 图标文件说明

本项目包含以下 SVG 图标文件：
- icon16.svg (16x16)
- icon32.svg (32x32) 
- icon48.svg (48x48)
- icon128.svg (128x128)

如需 PNG 格式，请使用以下方法转换：
1. 在线转换工具（如 convertio.co）
2. 使用 Inkscape: inkscape icon.svg -o icon.png
3. 使用 ImageMagick: convert icon.svg icon.png

或者直接重命名 .svg 为 .png，大多数现代浏览器都支持在 manifest.json 中使用 SVG 图标。
`

fs.writeFileSync(path.join(iconsDir, 'README.md'), pngNote)

console.log('🎉 图标创建完成！')
console.log('💡 提示：Chrome 扩展支持 SVG 图标，如需 PNG 格式请手动转换')