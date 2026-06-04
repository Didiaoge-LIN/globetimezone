#!/usr/bin/env python3
"""全站安装 GA4 追踪代码到所有 HTML 页面"""
import os
import re

BASE = r"C:\Users\ASUS\WorkBuddy\Claw\globetimezone"

GA4_HEAD = '''  <!-- Google Analytics 4 -->
  <meta name="ga4-measurement-id" content="G-XXXXXXXXXX" />
  <script src="/js/ga4-config.js"></script>
  <script src="/js/ga4.js"></script>
'''

def inject_ga4(filepath, is_root_level=True):
    """为 HTML 页面注入 GA4 代码"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'ga4.js' in content or 'googletagmanager.com/gtag' in content:
        return 'already_has'
    
    # Determine correct path prefix for js/
    js_prefix = 'js/' if is_root_level else '../js/'
    # For pages/time-in/ pages, need ../../js/
    if '/pages/time-in/' in filepath.replace('\\', '/'):
        js_prefix = '../../js/'
    elif '/pages/' in filepath.replace('\\', '/'):
        js_prefix = '../js/'
    
    ga4_block = GA4_HEAD.replace('/js/', js_prefix)
    
    # Insert before </head>
    if '</head>' in content:
        content = content.replace('</head>', ga4_block + '</head>')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return 'injected'

def main():
    imported = 0
    skipped = 0
    
    for root, dirs, files in os.walk(BASE):
        # Skip node_modules and .git
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '.workbuddy')]
        
        for f in files:
            if not f.endswith('.html'):
                continue
            
            filepath = os.path.join(root, f)
            rel_path = os.path.relpath(filepath, BASE).replace('\\', '/')
            
            # Determine if root level
            is_root = '/' not in rel_path
            
            result = inject_ga4(filepath, is_root)
            if result == 'injected':
                print(f'✅ {rel_path}')
                imported += 1
            elif result == 'already_has':
                print(f'⏭️  {rel_path} (already has GA4)')
                skipped += 1
    
    print(f'\n📊 Total: {imported} injected, {skipped} skipped, {imported + skipped} checked')

if __name__ == "__main__":
    main()
