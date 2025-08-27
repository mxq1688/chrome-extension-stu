#!/usr/bin/env python3
import os
try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available, creating simple icons...")

def create_vue_icon(size):
    """Create a Vue.js themed icon"""
    if PIL_AVAILABLE:
        # Create image with transparency
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Vue green background circle
        margin = 2
        draw.ellipse([margin, margin, size-margin, size-margin], 
                    fill=(65, 184, 131, 255), outline=(255, 255, 255, 255), width=2)
        
        # White 'V' in the center
        font_size = int(size * 0.6)
        try:
            # Try to use a system font
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
        except:
            try:
                font = ImageFont.truetype('arial.ttf', font_size)
            except:
                font = ImageFont.load_default()
        
        # Draw the 'V'
        text = 'V'
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - 2
        
        draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
        
        return img
    else:
        # Fallback: create a simple colored square
        return create_simple_icon(size)

def create_simple_icon(size):
    """Create a simple colored square as fallback"""
    # Create a simple green square with basic drawing
    import struct
    
    # Simple PNG creation without PIL
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
        f.write(b'\x89PNG\r\n\x1a\n')  # PNG signature
        
        # IHDR chunk
        ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
        write_chunk(f, b'IHDR', ihdr_data)
        
        # IDAT chunk (simple green color)
        import zlib
        raw_data = b''
        for y in range(height):
            raw_data += b'\x00'  # Filter type
            for x in range(width):
                # Vue green color (65, 184, 131)
                raw_data += b'\x41\xb8\x83'
        
        compressed = zlib.compress(raw_data)
        write_chunk(f, b'IDAT', compressed)
        
        # IEND chunk
        write_chunk(f, b'IEND', b'')
        
        return f.getvalue()
    
    # Create RGB data for a green square
    rgb_data = [(65, 184, 131)] * (size * size)
    png_data = create_png_data(size, size, rgb_data)
    
    # Save to temporary file and return as PIL-like object
    temp_file = f'/tmp/temp_icon_{size}.png'
    with open(temp_file, 'wb') as f:
        f.write(png_data)
    
    return temp_file

def main():
    sizes = [16, 32, 48, 128]
    icons_dir = 'public/icons'
    
    # Create icons directory if it doesn't exist
    os.makedirs(icons_dir, exist_ok=True)
    
    for size in sizes:
        print(f'Creating {size}x{size} icon...')
        
        if PIL_AVAILABLE:
            icon = create_vue_icon(size)
            icon.save(f'{icons_dir}/icon{size}.png', 'PNG')
            print(f'Saved icon{size}.png')
        else:
            # Fallback method
            temp_file = create_simple_icon(size)
            import shutil
            shutil.copy(temp_file, f'{icons_dir}/icon{size}.png')
            os.remove(temp_file)
            print(f'Saved simple icon{size}.png')
    
    print('All icons created successfully!')

if __name__ == '__main__':
    main()