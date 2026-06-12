#!/usr/bin/env python3
"""
inject_english_only_banner.py
为文章型页面的 <h1 data-i18n> 后注入 English-only 提示 banner
banner 本身用 data-i18n="article.englishOnly" 翻译，
只在非 EN 语言路径下显示（通过 JS 控制）
"""

import re
import os

BANNER_HTML = '''
<!-- English-only article notice — hidden for EN, visible for other locales -->
<div id="english-only-banner" style="display:none;background:#fef3c7;border-left:4px solid #f59e0b;padding:10px 16px;margin:12px 0 0;border-radius:0 8px 8px 0;font-size:0.9rem;color:#92400e;" aria-live="polite">
  📌 <span data-i18n="article.englishOnly">This article is available in English only.</span>
</div>
<script data-cfasync="false">
(function(){
  var p=window.location.pathname;
  if(/^\/(zh|de|fr|es|ja|ko|pt|ar)\//.test(p)||localStorage.getItem('gtz_lang_manual')){
    var b=document.getElementById('english-only-banner');
    if(b)b.style.display='block';
  }
})();
</script>'''

# 文章型页面列表 — 正文英文长文，不做全文 i18n，需要提示 banner
# 工具页（converter/meeting-scheduler/world-clock/holidays 等）不加，因为这些工具 UI 已做 i18n
ARTICLE_PAGES = [
    'api-guide.html',
    'distributed-team-time-culture.html',
    'dst-2025-schedule.html',
    'remote-team-timezone-guide.html',
    'remote-work-timezone.html',
    'timezone-guide.html',
    'timezone-history.html',
    'why-daylight-saving-time.html',
    'remote-team-timezone-tools.html',
    'us-china-time-difference.html',
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 匹配 <h1> 标签（可能有多个属性），在其闭合 </h1> 后插入 banner
H1_PATTERN = re.compile(r'(<h1\b[^>]*data-i18n=[^>]*>.*?</h1>)', re.DOTALL)

total_modified = 0
total_skipped = 0

for filename in ARTICLE_PAGES:
    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        print(f'  ⚠ 文件不存在，跳过: {filename}')
        total_skipped += 1
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 已经注入过了，跳过
    if 'english-only-banner' in content:
        print(f'  ✓ 已有 banner，跳过: {filename}')
        total_skipped += 1
        continue

    # 找 h1 并在其后注入 banner
    match = H1_PATTERN.search(content)
    if not match:
        print(f'  ⚠ 未找到 data-i18n h1，跳过: {filename}')
        total_skipped += 1
        continue

    new_content = H1_PATTERN.sub(match.group(1) + BANNER_HTML, content, count=1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f'  ✅ 已注入 banner: {filename}')
    total_modified += 1

print(f'\n完成：{total_modified} 个文件注入 banner，{total_skipped} 个文件跳过')
