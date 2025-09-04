#!/usr/bin/env python3
# 生成简单的 PNG 图标

try:
    from PIL import Image, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

import os

def create_simple_icon(size, filename):
    """创建简单的麦克风图标"""
    if not PIL_AVAILABLE:
        print(f"❌ PIL/Pillow 未安装，无法创建 {filename}")
        return False
    
    # 创建图像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制圆形背景 (红色渐变效果)
    center = size // 2
    radius = size // 2 - 2
    
    # 绘制外圆 (边框)
    draw.ellipse([2, 2, size-2, size-2], fill=(255, 107, 107, 255), outline=(255, 255, 255, 255), width=2)
    
    # 绘制麦克风主体 (白色矩形)
    mic_width = size * 0.4
    mic_height = size * 0.5
    mic_x = center - mic_width // 2
    mic_y = size * 0.25
    
    draw.rounded_rectangle(
        [mic_x, mic_y, mic_x + mic_width, mic_y + mic_height],
        radius=size * 0.1,
        fill=(255, 255, 255, 255)
    )
    
    # 绘制麦克风底座 (白色圆点)
    base_radius = size * 0.08
    base_y = size * 0.75
    draw.ellipse(
        [center - base_radius, base_y - base_radius, center + base_radius, base_y + base_radius],
        fill=(255, 255, 255, 255)
    )
    
    # 保存图像
    try:
        img.save(filename, 'PNG')
        print(f"✅ 创建: {filename} ({size}x{size})")
        return True
    except Exception as e:
        print(f"❌ 保存失败: {filename} - {e}")
        return False

def create_fallback_icon(size, filename):
    """创建降级版本的图标 (不使用 PIL)"""
    print(f"⚠️  创建简化版本: {filename}")
    
    # 创建一个最小的 PNG 文件 (1x1 透明像素)
    # 这是一个有效的 PNG 文件头和最小数据
    png_data = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
        b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13'
        b'\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDAT\x08\x1dc'
        b'\xf8\x00\x00\x00\x01\x00\x01j\x88\x05\x1a\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    
    try:
        with open(filename, 'wb') as f:
            f.write(png_data)
        print(f"✅ 创建简化版本: {filename}")
        return True
    except Exception as e:
        print(f"❌ 创建失败: {filename} - {e}")
        return False

def main():
    icons_dir = 'public/icons'
    
    # 确保目录存在
    os.makedirs(icons_dir, exist_ok=True)
    
    sizes = [16, 32, 48, 128]
    success_count = 0
    
    print("🎨 开始创建 PNG 图标...")
    print(f"📦 PIL/Pillow 可用: {'是' if PIL_AVAILABLE else '否'}")
    
    for size in sizes:
        filename = os.path.join(icons_dir, f'icon{size}.png')
        
        if PIL_AVAILABLE:
            if create_simple_icon(size, filename):
                success_count += 1
        else:
            if create_fallback_icon(size, filename):
                success_count += 1
    
    print(f"\n🎉 完成! 成功创建 {success_count}/{len(sizes)} 个图标")
    
    if not PIL_AVAILABLE:
        print("\n💡 提示: 安装 Pillow 可获得更好的图标质量:")
        print("   pip install Pillow")
    
    print("\n📋 建议: 使用专业工具创建更精美的图标:")
    print("   - Figma: https://figma.com")
    print("   - GIMP: https://gimp.org")
    print("   - 在线转换: https://convertio.co/svg-png/")

if __name__ == '__main__':
    main()
