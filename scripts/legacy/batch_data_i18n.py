#!/usr/bin/env python3
"""
batch_data_i18n.py v2 — 批量给 HTML 页面注入 data-i18n 属性
=============================================================

策略：
  1. 共享元素优先：header nav、footer、skip-link、breadcrumb
  2. 页面级元素：h1、description meta — 按 slug 生成 key
  3. 排除：首页、旧版语言页、语言子目录、验证页等

核心改进（v2）：
  - 用行级处理避免偏移量错位 bug
  - 每行只做一次精确替换
  - 更健壮的正则模式

用法：
  python batch_data_i18n.py --root C:/Users/ASUS/WorkBuddy/Claw/globetimezone
  python batch_data_i18n.py --root ... --dry-run
"""

import os
import re
import json
import argparse

# ============================================================
# 配置
# ============================================================

EXCLUDE_DIRS = {
    'node_modules', '.git', 'dist-firefox', 'dist-gateway',
    'extension-firefox', 'extension-chrome', 'temp',
    'en', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar',
    'email-templates', 'extension', 'globetimezone',
}

EXCLUDE_FILES = {
    'index.html',            # 首页已处理
    '404.html',
    'googleeec30809f9cc16157.html',
    'index-from-deploy.html',
    'lang.html',
}

LANG_INDEX_RE = re.compile(r'^index-(de|es|fr|ja|ko|pt|ar|zh)\.html$')

# 共享导航文案 → key
NAV_MAP = {
    'Converter': 'nav.converter',
    'Time Zones': 'nav.timezones',
    'World Clock': 'nav.worldclock',
    'Meeting Scheduler': 'nav.meeting',
    'Meeting Planner': 'nav.meeting',
    'About': 'nav.about',
    'Contact': 'nav.contact',
    'Cross-Border': 'nav.crossborder',
    'Guides': 'nav.guides',
    'Upgrade PRO': 'nav.upgrade',
    'PRO': 'nav.upgrade',
}

# Footer 链接文案 → key
FOOTER_NAV_MAP = {
    'Time Zone Converter': 'footer.converter',
    'World Clock': 'footer.worldclock',
    'Meeting Scheduler': 'footer.meeting',
    'About': 'footer.about',
    'Contact': 'footer.contact',
    'Privacy': 'footer.privacy',
    'Privacy Policy': 'footer.privacy',
    'Terms': 'footer.terms',
    'Terms of Service': 'footer.terms',
}

# Footer heading → key
FOOTER_HEADING_MAP = {
    'Tools': 'footer.tools',
    'Info': 'footer.info',
}


def should_skip(filepath, root):
    fname = os.path.basename(filepath)
    rel = os.path.relpath(filepath, root).replace('\\', '/')

    if fname in EXCLUDE_FILES:
        return True
    if LANG_INDEX_RE.match(fname):
        return True
    if fname.endswith('-zh.html'):
        return True

    parts = rel.split('/')
    for part in parts[:-1]:
        if part in EXCLUDE_DIRS:
            return True
    return False


def slug_from_rel(rel_path):
    p = rel_path.replace('\\', '/').replace('.html', '')
    p = re.sub(r'/index$', '', p)
    p = p.replace('/', '.').replace('-', '')
    return p if p and p != '.' else 'home'


def inject_attr_in_line(line, tag_match, attr_str):
    """在匹配到的开标签末尾注入属性。返回 (修改后行, 是否修改)"""
    open_tag = tag_match.group(1)
    close = tag_match.group(2)
    # 检查是否已有 data-i18n 类属性
    if 'data-i18n=' in open_tag or 'data-i18n-html=' in open_tag or 'data-i18n-attr=' in open_tag:
        return line, False
    # 在关闭符号前插入
    new_tag = open_tag + ' ' + attr_str + close
    line = line.replace(open_tag + close, new_tag, 1)
    return line, True


def process_file(filepath, root, dry_run=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    rel = os.path.relpath(filepath, root).replace('\\', '/')
    slug = slug_from_rel(rel)
    changes = 0
    new_zh = {}
    new_en = {}

    for i, line in enumerate(lines):
        orig_line = line

        # ---- Skip link ----
        if 'skip-link' in line and '<a' in line:
            m = re.search(r'(<a\b[^>]*?class=["\'][^"\']*skip-link[^"\']*["\'][^>]*?)(>)', line)
            if not m:
                m = re.search(r'(<a\b[^>]*?href=["\']#main-content["\'][^>]*?class=["\'][^"\']*skip-link[^"\']*["\'][^>]*?)(>)', line)
            if m:
                line, changed = inject_attr_in_line(line, m, 'data-i18n="nav.skipToContent"')
                if changed:
                    changes += 1

        # ---- Nav aria-label ----
        if 'aria-label="Main navigation"' in line and '<nav' in line:
            m = re.search(r'(<nav\b[^>]*?)(>)', line)
            if m and 'data-i18n-attr=' not in m.group(1):
                old = 'aria-label="Main navigation"'
                new = 'aria-label="Main navigation" data-i18n-attr="aria-label:nav.ariaLabel"'
                line = line.replace(old, new, 1)
                changes += 1

        # ---- Header nav links ----
        if '<nav' in line or '<header' in line or 'header-inner' in line:
            for text, key in NAV_MAP.items():
                # 匹配 <a href="...">text</a> 但不要匹配已有 data-i18n 的
                pattern = rf'(<a\b[^>]*?)(>)\s*{re.escape(text)}\s*</a>'
                m = re.search(pattern, line)
                if m:
                    line, changed = inject_attr_in_line(line, m, f'data-i18n="{key}"')
                    if changed:
                        changes += 1

        # ---- Breadcrumb Home ----
        if 'breadcrumb' in line.lower() and 'Home' in line and '<a' in line:
            m = re.search(r'(<a\b[^>]*?href=["\']\.\./["\'][^>]*?)(>)\s*Home\s*</a>', line)
            if m:
                line, changed = inject_attr_in_line(line, m, 'data-i18n="breadcrumb.home"')
                if changed:
                    changes += 1

        # ---- Footer nav links ----
        if 'footer' in line.lower() and '<a' in line:
            for text, key in FOOTER_NAV_MAP.items():
                pattern = rf'(<a\b[^>]*?)(>)\s*{re.escape(text)}\s*</a>'
                m = re.search(pattern, line)
                if m:
                    line, changed = inject_attr_in_line(line, m, f'data-i18n="{key}"')
                    if changed:
                        changes += 1

        # ---- Footer description ----
        if 'footer-desc' in line and '<p' in line:
            m = re.search(r'(<p\b[^>]*?footer-desc[^>]*?)(>)', line)
            if m:
                line, changed = inject_attr_in_line(line, m, 'data-i18n="footer.desc"')
                if changed:
                    changes += 1

        # ---- Footer headings ----
        if 'footer-heading' in line and '<h' in line:
            for text, key in FOOTER_HEADING_MAP.items():
                m = re.search(rf'(<h[1-6]\b[^>]*?footer-heading[^>]*?)(>)\s*{re.escape(text)}\s*</h', line)
                if m:
                    line, changed = inject_attr_in_line(line, m, f'data-i18n="{key}"')
                    if changed:
                        changes += 1

        # ---- <h1> page-level ----
        if '<h1' in line and '</h1>' in line:
            m = re.search(r'(<h1\b[^>]*?)(>)', line)
            if m:
                h1_open = m.group(1)
                if 'data-i18n' not in h1_open:
                    # 提取 h1 内容
                    h1_content_m = re.search(r'<h1[^>]*>(.*?)</h1>', line, re.DOTALL)
                    if h1_content_m:
                        h1_text = h1_content_m.group(1).strip()
                        h1_clean = re.sub(r'<[^>]+>', '', h1_text).strip()
                        if h1_clean:
                            key = f'{slug}.h1'
                            use_html = '<br' in h1_text or '<span' in h1_text
                            attr = 'data-i18n-html' if use_html else 'data-i18n'
                            line, changed = inject_attr_in_line(line, m, f'{attr}="{key}"')
                            if changed:
                                changes += 1
                                new_en[key] = h1_text
                                new_zh[key] = h1_text

        # ---- Meta description ----
        if 'name="description"' in line or "name='description'" in line:
            m = re.search(r'(<meta\b[^>]*?name=["\']description["\'][^>]*?)(/?>)', line)
            if m:
                open_part = m.group(1)
                if 'data-i18n-attr=' not in open_part:
                    key = f'{slug}.meta.desc'
                    attr_str = f'data-i18n-attr="content:{key}"'
                    old = open_part + m.group(2)
                    new = open_part + ' ' + attr_str + m.group(2)
                    line = line.replace(old, new, 1)
                    changes += 1
                    # 提取 content
                    content_m = re.search(r'content=["\']([^"\']*)["\']', open_part)
                    if content_m:
                        new_en[key] = content_m.group(1)
                        new_zh[key] = content_m.group(1)

        # ---- <title> — 只提取文本，不修改 HTML ----
        if '<title>' in line and '</title>' in line:
            title_m = re.search(r'<title>(.*?)</title>', line)
            if title_m:
                title_text = title_m.group(1).strip()
                key = f'{slug}.meta.title'
                new_en[key] = title_text
                new_zh[key] = title_text

        lines[i] = line

    new_content = '\n'.join(lines)
    if new_content != content and not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

    return changes, new_zh, new_en, rel


def main():
    parser = argparse.ArgumentParser(description='批量给 HTML 页面注入 data-i18n 属性')
    parser.add_argument('--root', required=True, help='项目根目录')
    parser.add_argument('--dry-run', action='store_true', help='只显示不修改')
    args = parser.parse_args()

    root = os.path.abspath(args.root)
    print(f'扫描目录: {root}')
    print(f'   dry_run: {args.dry_run}')
    print()

    # 收集文件
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fname in filenames:
            if fname.endswith('.html'):
                fp = os.path.join(dirpath, fname)
                if not should_skip(fp, root):
                    html_files.append(fp)

    print(f'需处理文件: {len(html_files)} 个')
    print()

    total_changes = 0
    all_zh = {}
    all_en = {}
    no_change = 0

    for fp in sorted(html_files):
        changes, zh_new, en_new, rel = process_file(fp, root, dry_run=args.dry_run)
        if changes > 0:
            total_changes += changes
            all_zh.update(zh_new)
            all_en.update(en_new)
            print(f'  OK {rel} ({changes})')
        else:
            no_change += 1

    print()
    print(f'--- 结果 ---')
    print(f'处理: {len(html_files)} 文件, {total_changes} 处修改, {no_change} 无变化')
    print(f'新增翻译 key: {len(all_zh)} 个')
    print()

    # 合并语言包
    locales_dir = os.path.join(root, 'locales')
    for lang, new_data in [('zh', all_zh), ('en', all_en)]:
        jp = os.path.join(locales_dir, f'{lang}.json')
        existing = {}
        if os.path.exists(jp):
            with open(jp, 'r', encoding='utf-8') as f:
                existing = json.load(f)

        added = 0
        for k, v in new_data.items():
            if k not in existing:
                existing[k] = v
                added += 1

        if added > 0 and not args.dry_run:
            with open(jp, 'w', encoding='utf-8') as f:
                json.dump(existing, f, ensure_ascii=False, indent=2)

        print(f'{lang}.json: +{added} (total {len(existing)})')

    # 报告
    if all_en and not args.dry_run:
        rp = os.path.join(root, 'i18n_keys_report.txt')
        with open(rp, 'w', encoding='utf-8') as f:
            for k in sorted(all_en.keys()):
                f.write(f'{k} = {all_en[k][:80]}\n')
        print(f'报告: {rp}')


if __name__ == '__main__':
    main()
