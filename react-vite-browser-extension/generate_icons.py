#!/usr/bin/env python3
import os
try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available, creating simple icons...")

def create_vite_icon(size):
    """Create a Vite themed icon with purple/gradient colors"""
    if PIL_AVAILABLE:
        # Create image with transparency
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Vite purple background circle
        margin = 2
        draw.ellipse([margin, margin, size-margin, size-margin], 
                    fill=(100, 108, 255, 255), outline=(255, 255, 255, 255), width=2)
        
        # White 'V' for Vite (similar to Vue but different color)
        font_size = int(size * 0.6)
        try:
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
        except:
            try:
                font = ImageFont.truetype('arial.ttf', font_size)
            except:
                font = ImageFont.load_default()
        
        # Draw the 'V' for Vite
        text = 'V'
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - 2
        
        # Use yellow/orange text for Vite brand colors
        draw.text((x, y), text, fill=(255, 213, 79, 255), font=font)
        
        # Add small React 'R' in corner to show it's React+Vite
        if size >= 48:
            small_font_size = int(size * 0.25)
            try:
                small_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', small_font_size)
            except:
                small_font = font
            
            corner_x = size - int(size * 0.3)
            corner_y = int(size * 0.15)
            draw.text((corner_x, corner_y), 'R', fill=(255, 255, 255, 200), font=small_font)
        
        return img
    else:
        return create_simple_vite_icon(size)

def create_simple_vite_icon(size):
    """Create a simple Vite purple square as fallback"""
    import struct
    
    def create_png_data(width, height, rgb_data):
        def write_chunk(f, chunk_type, data):
            f.write(struct.pack('>I', len(data)))
            f.write(chunk_type)
            f.write(data)
            crc = 0xFFFFFFFF
            for byte in chunk_type + data:
                crc ^= byte
                for _ in range(8):
                    if crc & 1:
                        crc = (crc >> 1) ^ 0xEDB88320
                    else:
                        crc >>= 1
            f.write(struct.pack('>I', crc ^ 0xFFFFFFFF))
        
        import io
        f = io.BytesIO()
        f.write(b'\x89PNG\r\n\x1a\n')
        
        ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
        write_chunk(f, b'IHDR', ihdr_data)
        
        import zlib
        raw_data = b''
        for y in range(height):
            raw_data += b'\x00'
            for x in range(width):
                # Vite purple color (100, 108, 255)
                raw_data += b'\x64\x6c\xff'
        
        compressed = zlib.compress(raw_data)
        write_chunk(f, b'IDAT', compressed)
        write_chunk(f, b'IEND', b'')
        
        return f.getvalue()
    
    rgb_data = [(100, 108, 255)] * (size * size)
    png_data = create_png_data(size, size, rgb_data)
    
    temp_file = f'/tmp/temp_vite_icon_{size}.png'
    with open(temp_file, 'wb') as f:
        f.write(png_data)
    
    return temp_file

def main():
    sizes = [16, 32, 48, 128]
    icons_dir = 'public/icons'
    
    os.makedirs(icons_dir, exist_ok=True)
    
    for size in sizes:
        print(f'Creating Vite {size}x{size} icon...')
        
        if PIL_AVAILABLE:
            icon = create_vite_icon(size)
            icon.save(f'{icons_dir}/icon{size}.png', 'PNG')
            print(f'Saved Vite icon{size}.png')
        else:
            temp_file = create_simple_vite_icon(size)
            import shutil
            shutil.copy(temp_file, f'{icons_dir}/icon{size}.png')
            os.remove(temp_file)
            print(f'Saved simple Vite icon{size}.png')
    
    print('All Vite icons created successfully!')

if __name__ == '__main__':
    main()