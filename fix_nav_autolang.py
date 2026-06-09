"""
fix_nav_autolang.py - 批量修复两个问题：
1. <nav> aria-label="..." -> <nav aria-label="..."  (59 个文件)
2. lang="en" 且没有 auto-lang.js 的页面，补充 auto-lang.js 引用
"""
import os

LANG_SUBDIRS = {'en', 'zh', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'}

fixed_nav = []
fixed_autolang = []

for root, dirs, fnames in os.walk('.'):
    # 跳过 node_modules 和 .git
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git')]
    for f in fnames:
        if not f.endswith('.html'):
            continue
        fp = os.path.join(root, f)
        try:
            with open(fp, 'r', encoding='utf-8', errors='replace') as fh:
                content = fh.read()
        except Exception:
            continue

        changed = False

        # --- 修复1：nav 语法错误 ---
        if '<nav> aria-label=' in content or '<nav>  aria-label=' in content:
            content = content.replace('<nav> aria-label=', '<nav aria-label=')
            content = content.replace('<nav>  aria-label=', '<nav aria-label=')
            fixed_nav.append(fp)
            changed = True

        # --- 修复2：给英文页补充 auto-lang.js ---
        is_en = ('<html lang="en">' in content or "<html lang='en'>" in content)
        has_autolang = 'auto-lang.js' in content

        # 计算相对路径，判断是否在语言子目录内
        rel = fp.lstrip('./').lstrip('.\\')
        parts = rel.replace('\\', '/').split('/')
        in_lang_subdir = len(parts) >= 2 and parts[0] in LANG_SUBDIRS

        if is_en and not has_autolang and not in_lang_subdir:
            inject = (
                '  <!-- 浏览器语言自动检测（同步加载，渲染前跳转） -->\n'
                '  <script src="/js/auto-lang.js?v=2"></script>\n'
            )
            if '</head>' in content:
                content = content.replace('</head>', inject + '</head>', 1)
                fixed_autolang.append(fp)
                changed = True

        if changed:
            with open(fp, 'w', encoding='utf-8') as fh:
                fh.write(content)

print(f'Fixed nav syntax: {len(fixed_nav)} files')
print(f'Added auto-lang.js: {len(fixed_autolang)} files')
if fixed_autolang:
    for f in fixed_autolang:
        print(f'  + {f}')
