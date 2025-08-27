#!/usr/bin/env python3
import os
try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available, creating simple icons...")

def create_react_icon(size):
    """Create a React.js themed icon with blue colors"""
    if PIL_AVAILABLE:
        # Create image with transparency
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # React blue background circle
        margin = 2
        draw.ellipse([margin, margin, size-margin, size-margin], 
                    fill=(97, 218, 251, 255), outline=(255, 255, 255, 255), width=2)
        
        # White React atom symbol or 'R'
        font_size = int(size * 0.6)
        try:
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
        except:
            try:
                font = ImageFont.truetype('arial.ttf', font_size)
            except:
                font = ImageFont.load_default()
        
        # Draw the 'R' for React
        text = 'R'
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - 2
        
        draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
        
        return img
    else:
        return create_simple_react_icon(size)

def create_simple_react_icon(size):
    """Create a simple React blue square as fallback"""
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
                # React blue color (97, 218, 251)
                raw_data += b'\x61\xda\xfb'
        
        compressed = zlib.compress(raw_data)
        write_chunk(f, b'IDAT', compressed)
        write_chunk(f, b'IEND', b'')
        
        return f.getvalue()
    
    rgb_data = [(97, 218, 251)] * (size * size)
    png_data = create_png_data(size, size, rgb_data)
    
    temp_file = f'/tmp/temp_react_icon_{size}.png'
    with open(temp_file, 'wb') as f:
        f.write(png_data)
    
    return temp_file

def main():
    sizes = [16, 32, 48, 128]
    icons_dir = 'public/icons'
    
    os.makedirs(icons_dir, exist_ok=True)
    
    for size in sizes:
        print(f'Creating React {size}x{size} icon...')
        
        if PIL_AVAILABLE:
            icon = create_react_icon(size)
            icon.save(f'{icons_dir}/icon{size}.png', 'PNG')
            print(f'Saved React icon{size}.png')
        else:
            temp_file = create_simple_react_icon(size)
            import shutil
            shutil.copy(temp_file, f'{icons_dir}/icon{size}.png')
            os.remove(temp_file)
            print(f'Saved simple React icon{size}.png')
    
    print('All React icons created successfully!')

if __name__ == '__main__':
    main()