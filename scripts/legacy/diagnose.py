#!/usr/bin/env python3
"""PageSpeed Diagnostics: Performance + Accessibility"""
import glob, re, os

TOTAL = {'a11y': [], 'perf': [], 'seo': []}

def scan_html(filepath, html):
    fname = os.path.relpath(filepath, os.path.dirname(__file__))
    
    # === ACCESSIBILITY ===
    # 1. <html> without lang
    m = re.search(r'<html([^>]*)>', html)
    if m and 'lang=' not in m.group(1):
        TOTAL['a11y'].append(f'{fname}: <html> missing lang attribute')
    
    # 2. <img> without alt
    for img in re.finditer(r'<img\b([^>]*)>', html, re.I):
        attrs = img.group(1)
        if 'alt=' not in attrs:
            # Skip og/twitter/schema images
            TOTAL['a11y'].append(f'{fname}: <img> missing alt [{img.group()[:80]}]')
    
    # 3. <select>/<input> without label
    for inp in re.finditer(r'<(select|input)\b(?![^>]*\btype\s*=\s*["\']hidden)[^>]*>', html, re.I):
        attrs = inp.group(0)
        has_label = any(x in attrs for x in ['aria-label', 'aria-labelledby', 'title='])
        if not has_label:
            TOTAL['a11y'].append(f'{fname}: {inp.group(1)} without label [{inp.group()[:80]}]')
    
    # 4. Buttons with only icon (no text/aria-label)
    for btn in re.finditer(r'<button\b([^>]*)>(.*?)</button>', html, re.I | re.S):
        attrs = btn.group(1)
        content = btn.group(2).strip()
        has_aria = 'aria-label' in attrs or 'aria-labelledby' in attrs
        # If button content is just an <i> or <svg> with no text
        text_only = re.sub(r'<[^>]+>', '', content).strip()
        if not text_only and not has_aria:
            TOTAL['a11y'].append(f'{fname}: <button> has no accessible name [{btn.group()[:80]}]')
    
    # 5. Links without discernible text
    for a in re.finditer(r'<a\b([^>]*)>(.*?)</a>', html, re.I | re.S):
        attrs = a.group(1)
        content = a.group(2).strip()
        has_aria = 'aria-label' in attrs or 'aria-labelledby' in attrs or 'title=' in attrs
        text_only = re.sub(r'<[^>]+>', '', content).strip()
        if not text_only and not has_aria and 'href' in attrs:
            TOTAL['a11y'].append(f'{fname}: <a> has no accessible name [{a.group()[:80]}]')
    
    # === PERFORMANCE ===
    # 6. Non-deferred scripts
    for script in re.finditer(r'<script\b([^>]*)>', html, re.I):
        attrs = script.group(1)
        if 'src=' in attrs and not any(x in attrs for x in ['defer', 'async']):
            TOTAL['perf'].append(f'{fname}: blocking <script> [{script.group()[:80]}]')
    
    # 7. Inline CSS/JS blocks
    inline_style_count = len(re.findall(r'<style>', html))
    if inline_style_count > 0:
        TOTAL['perf'].append(f'{fname}: {inline_style_count} inline <style> blocks')
    inline_script = len(re.findall(r'<script>(?!.*src=)', html))
    if inline_script > 0:
        TOTAL['perf'].append(f'{fname}: {inline_script} inline <script> blocks')

    # 8. Large images without width/height (CLS)
    for img in re.finditer(r'<img\b([^>]*)>', html, re.I):
        attrs = img.group(1)
        has_w = 'width=' in attrs
        has_h = 'height=' in attrs
        has_loading_lazy = 'loading=' in attrs
        if not has_w and not has_h:
            TOTAL['perf'].append(f'{fname}: <img> no width/height (CLS risk) [{img.group()[:80]}]')
        if not has_loading_lazy and 'src=' in attrs and 'favicon' not in attrs and 'icon' not in attrs:
            pass  # too noisy


# Scan all HTML files
base = os.path.dirname(os.path.abspath(__file__))
for fpath in glob.glob(os.path.join(base, '**/*.html'), recursive=True):
    if 'node_modules' in fpath or '.git' in fpath:
        continue
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            html = f.read()
        scan_html(fpath, html)
    except Exception as e:
        print(f'ERROR reading {fpath}: {e}')

# Report
print(f"\n{'='*70}")
print(f"  PageSpeed 诊断报告")
print(f"{'='*70}")

for category, items in [('ACCESSIBILITY', TOTAL['a11y']), ('PERFORMANCE', TOTAL['perf']), ('SEO', TOTAL['seo'])]:
    print(f"\n## {category}: {len(items)} 个问题")
    print(f"-" * 50)
    if items:
        for item in items:
            print(f"  ⚠️  {item}")
    else:
        print(f"  ✅ 未发现问题")

print(f"\n{'='*70}")
print(f"  总计: A11y={len(TOTAL['a11y'])} Perf={len(TOTAL['perf'])} SEO={len(TOTAL['seo'])}")
print(f"{'='*70}")
