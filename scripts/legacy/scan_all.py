#!/usr/bin/env python3
"""Deep scan for ALL remaining PageSpeed issues across the site"""
import glob, re, os

BASE = os.path.dirname(os.path.abspath(__file__))

print("=" * 60)
print("  🔍 PageSpeed 深度全站扫描")
print("=" * 60)

# ===== CSS Analysis =====
print("\n## 1. CSS 文件分析")
css_path = os.path.join(BASE, 'css', 'style.min.css')
css_size = os.path.getsize(css_path) if os.path.exists(css_path) else 0
print(f"   压缩版大小: {css_size/1024:.1f} KB")

# Check for low-contrast colors in CSS
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Find all color/background combinations that might have low contrast
colors = re.findall(r'color:\s*([^;]+);', css)
bg_colors = re.findall(r'background(?:-color)?:\s*([^;]+);', css)
print(f"   color 声明: {len(colors)}")
print(f"   background-color 声明: {len(bg_colors)}")

# Check for potential contrast issues (light gray text on white bg)
low_contrast = re.findall(r'color:\s*#?[89a-fA-F][0-9a-fA-F]{5}', css)
if low_contrast:
    print(f"   ⚠️  可能的低对比度颜色: {low_contrast[:5]}")

# ===== HTML Files Analysis =====  
print("\n## 2. 全站 HTML 无障碍扫描")

htmls = glob.glob(os.path.join(BASE, '**/*.html'), recursive=True)
a11y_total = {'missing_labels': 0, 'touch_targets': 0, 'outline_none': 0, 'inline_styles_count': 0}

for fpath in sorted(htmls):
    if 'node_modules' in fpath or '.git' in fpath:
        continue
    rel = os.path.relpath(fpath, BASE)
    
    with open(fpath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Check for outline:none (keyboard accessibility)
    if 'outline:none' in html or 'outline: none' in html or 'outline:0' in html:
        a11y_total['outline_none'] += 1
    
    # Count inline styles (performance)
    inline_count = len(re.findall(r'style="[^"]*"', html))
    if inline_count > 10:
        a11y_total['inline_styles_count'] += 1

    # Check for forms without labels
    for inp in re.finditer(r'<(input|select|textarea)\b(?![^>]*\btype=["\']hidden)[^>]*>', html, re.I):
        attrs = inp.group(0)
        has_label = any(x in attrs for x in ['aria-label', 'aria-labelledby', 'title=', 'role='])
        # Also check if there's a <label for="..."> before this element
        el_id = re.search(r'id=["\']([^"\']+)', attrs)
        has_for = False
        if el_id:
            eid = el_id.group(1)
            if f'for="{eid}"' in html or f"for='{eid}'" in html:
                has_for = True
        if not has_label and not has_for:
            a11y_total['missing_labels'] += 1

# Report
print(f"   无 label 输入: {a11y_total['missing_labels']} 个")
print(f"   outline:none 页面: {a11y_total['outline_none']} 个")
print(f"   内联样式过多页面: {a11y_total['inline_styles_count']} 个")

# ===== Performance: Check what's render-blocking =====
print("\n## 3. 渲染阻塞资源检查 (index.html)")

idx_path = os.path.join(BASE, 'index.html')
with open(idx_path, 'r', encoding='utf-8') as f:
    idx = f.read()

# Check for blocking CSS
css_links = re.findall(r'<link[^>]*rel=["\']stylesheet["\'][^>]*>', idx)
print(f"   <link> 样式表: {len(css_links)}")
for link in css_links:
    # Check if it has media query that delays loading
    has_media = re.search(r'media=["\']([^"\']+)', link)
    has_print = bool(has_media and 'print' in has_media.group(1))
    print(f"     {'🟢 print' if has_print else '🔴 阻塞'}: {link[:100]}")

# Check for script loading - should all be defer/async now
scripts = re.findall(r'<script[^>]*>', idx)
blocking = [s for s in scripts if 'defer' not in s and 'async' not in s and 'application/ld+json' not in s]
print(f"   <script> 标签: {len(scripts)} (阻塞: {len(blocking)})")

# Check for font loading
fonts = re.findall(r'url\([^)]*font[^)]*\)', css, re.I)
if fonts:
    print(f"   ⚠️  CSS 中的字体文件: {len(fonts)} 个")

# ===== Check CLS risks =====
print("\n## 4. CLS (布局偏移) 风险检查")
img_no_dim = re.findall(r'<img\b(?![^>]*\bwidth=)(?![^>]*\bheight=)[^>]*src=[^>]*>', idx)
print(f"   无尺寸图片 (CLS风险): {len(img_no_dim)} 个")

# ===== Cache policy =====
print("\n## 5. 缓存策略检查")
print(f"   Cloudflare Pages 默认: Cache-Control: public, max-age=0, must-revalidate")
print(f"   → 建议添加 _headers 文件设置长缓存")

# ===== Summary =====
print(f"\n{'='*60}")
total = sum(a11y_total.values())
print(f"  总计发现 {total} 个待修复项")
print(f"{'='*60}")
