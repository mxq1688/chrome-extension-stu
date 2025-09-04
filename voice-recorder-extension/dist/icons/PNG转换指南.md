# PNG 图标转换指南

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
```bash
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
```

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
