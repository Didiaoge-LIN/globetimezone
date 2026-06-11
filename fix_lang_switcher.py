import os
import re

# 6个子页面需要修复
files = [
    'blog/index.html',
    'meeting-planner/index.html',
    'pricing/index.html',
    'privacy/index.html',
    'time-difference/index.html',
    'tools/cross-border/index.html',
]

base_dir = r'C:\Users\ASUS\WorkBuddy\Claw\globetimezone'

# 要插入的CSS（在 </style> 之前）
css_to_add = '\n    .lang-picker #lang-drop.show { display: block !important; }\n'

# 要插入的JS（在最后一个 </script> 之前，但要在内联script块中）
js_to_add = '''
    // 语言切换器：点击外部关闭下拉
    document.addEventListener('click', function(e) {
      var drop = document.getElementById('lang-drop');
      var btn = document.getElementById('lang-btn');
      if (drop && btn && !btn.contains(e.target) && !drop.contains(e.target)) {
        drop.classList.remove('show');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
'''

for rel_path in files:
    path = os.path.join(base_dir, rel_path)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. 添加CSS（在第一个 </style> 之前）
    if '.lang-picker #lang-drop.show' not in content:
        # 在第一个 </style> 之前插入
        content = content.replace('  </style>', css_to_add + '  </style>', 1)
        print(f"[CSS] 已添加 .show 到 {rel_path}")
    else:
        print(f"[CSS] 已存在，跳过 {rel_path}")
    
    # 2. 添加JS"点击外部关闭下拉"
    if '点击外部关闭下拉' not in content and 'lang-drop.*contains' not in content:
        # 策略：在最后一个内联 <script> ... </script> 块中的 </script> 之前插入
        # 先找最后一个内联 script 块（不含 src 属性的 <script>）
        # 简化：在最后一个 </script> 之前插入（但需要确保在内联script中）
        
        # 更安全的策略：在文档末尾 </body> 之前添加一个新的 script 块
        if '</body>' in content:
            content = content.replace('</body>', f'<script>\n{js_to_add}</script>\n</body>')
            print(f"[JS] 已添加关闭逻辑到 {rel_path}")
        else:
            print(f"[WARN] 找不到 </body> 在 {rel_path}")
    else:
        print(f"[JS] 已存在，跳过 {rel_path}")
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

print("\n全部处理完成！")
