#!/usr/bin/env python3
"""Generate PNG icons for Firefox extension"""
from PIL import Image, ImageDraw

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Blue rounded rect background
    margin = size // 10
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 5,
        fill=(37, 99, 235, 255)
    )
    
    center = size // 2
    r = size // 3
    
    # Draw compass/globe circle
    draw.ellipse(
        [center - r, center - r - size//8, center + r, center + r - size//8],
        outline=(255, 255, 255, 230),
        width=max(2, size//40)
    )
    
    # Cross lines
    line_w = max(2, size//40)
    draw.line([center, size//5, center, size//4], fill=(255, 255, 255, 255), width=line_w)
    draw.line([center, center + r - size//8 + line_w, center, center + r - size//8 + size//10], fill=(255, 255, 255, 255), width=line_w)
    draw.line([center - r, center - size//8, center - r + size//10, center - size//8], fill=(255, 255, 255, 255), width=line_w)
    draw.line([center + r - size//10, center - size//8, center + r, center - size//8], fill=(255, 255, 255, 255), width=line_w)
    
    # Clock hands
    draw.line([center, center - size//8, center, center - size//8 - r//2], fill=(255, 255, 255, 255), width=line_w)
    draw.line([center, center - size//8, center + r//3, center - size//8 + r//4], fill=(255, 255, 255, 200), width=max(1, line_w-1))
    
    # Center dot
    dot_r = max(2, size//30)
    draw.ellipse([center - dot_r, center - size//8 - dot_r, center + dot_r, center - size//8 + dot_r], fill=(255, 255, 255, 255))
    
    return img

sizes = [16, 32, 48, 96, 128]
for s in sizes:
    icon = create_icon(s)
    icon.save(f'extension/icons/icon-{s}.png', 'PNG')
    print(f'Generated icon-{s}.png ({s}x{s})')

print('All icons generated!')
