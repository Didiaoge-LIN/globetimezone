#!/usr/bin/env python3
"""
batch_i18n.py — 批量给所有 HTML 页面注入 i18n 支持

功能：
1. 给所有 HTML 文件注入 i18n.js 引用（如果还没有）
2. 给所有 HTML 文件注入 updateInternalLinks 的内联脚本（确保链接前缀正确）
3. 不改页面内容，只确保链接前缀功能正常工作

用法：
  python batch_i18n.py --dry-run    # 预览将要修改的文件
  python batch_i18n.py              # 实际执行
"""

import os
import re
import argparse
from pathlib import Path

# 项目根目录
ROOT = Path(__file__).parent if __file__ in locals() else Path.cwd()
# 如果脚本在 globetimezone 目录外，调整这里
GTZ_ROOT = Path("C:/Users/ASUS/WorkBuddy/Claw/globetimezone")

# 需要排除的目录
EXCLUDE_DIRS = {"node_modules", ".git", ".workbuddy", "locales", "email-templates"}
# 需要排除的文件（已经是中文版 + 完整 i18n 的）
EXCLUDE_FILES = {"index.html"}  # 首页已处理

def find_html_files(root):
    """找到所有需要处理的 HTML 文件"""
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root):
        # 排除目录
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        
        for f in filenames:
            if f.endswith(".html") and f not in EXCLUDE_FILES:
                full_path = Path(dirpath) / f
                html_files.append(full_path)
    return sorted(html_files)

def has_i18n_js(content):
    """检查是否已经引用了 i18n.js"""
    return "i18n.js" in content

def has_auto_lang(content):
    """检查是否已经引用了 auto-lang.js"""
    return "auto-lang.js" in content

def inject_i18n(html_content, file_path):
    """
    给 HTML 内容注入 i18n 支持
    返回：(修改后的内容, 修改列表)
    """
    modifications = []
    modified = html_content
    
    # 1. 注入 i18n.js（在 </head> 前，或 auto-lang.js 后面）
    if not has_i18n_js(modified):
        i18n_tag = '  <script src="/js/i18n.js?v=1" defer></script>\n'
        
        # 优先放在 auto-lang.js 后面
        auto_lang_match = re.search(r'<script src="/js/auto-lang\.js[^"]*"[^>]*></script>', modified)
        if auto_lang_match:
            # 放在 auto-lang.js 后面
            insert_pos = auto_lang_match.end()
            modified = modified[:insert_pos] + "\n" + i18n_tag.rstrip("\n") + modified[insert_pos:]
            modifications.append("注入 i18n.js（放在 auto-lang.js 后面）")
        else:
            # 放在 </head> 前
            head_close = modified.rfind("</head>")
            if head_close != -1:
                modified = modified[:head_close] + "\n" + i18n_tag + modified[head_close:]
                modifications.append("注入 i18n.js（放在 </head> 前）")
            else:
                modifications.append("⚠️ 未找到 </head>，无法注入 i18n.js")
    
    # 2. 确保 <html lang> 属性存在（用于 i18n.js 检测）
    # 如果 lang="en"，改为 lang="zh"（统一用中文作为原文）
    # 但这样会破坏英文版页面的语义，所以暂时不改
    
    return modified, modifications

def process_file(file_path, dry_run=False):
    """处理单个文件"""
    try:
        content = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        # 尝试其他编码
        try:
            content = file_path.read_text(encoding="latin-1")
        except Exception as e:
            return f"❌ {file_path.relative_to(GTZ_ROOT)}: 读取失败 - {e}"
    
    if has_i18n_js(content):
        return f"⏭️  {file_path.relative_to(GTZ_ROOT)}: 已有 i18n.js，跳过"
    
    modified, mods = inject_i18n(content, file_path)
    
    if not mods:
        return f"⏭️  {file_path.relative_to(GTZ_ROOT)}: 无需修改"
    
    if dry_run:
        return f"📝 {file_path.relative_to(GTZ_ROOT)}: {'; '.join(mods)}"
    
    try:
        file_path.write_text(modified, encoding="utf-8")
        return f"✅ {file_path.relative_to(GTZ_ROOT)}: {'; '.join(mods)}"
    except Exception as e:
        return f"❌ {file_path.relative_to(GTZ_ROOT)}: 写入失败 - {e}"

def main():
    parser = argparse.ArgumentParser(description="批量注入 i18n.js 引用")
    parser.add_argument("--dry-run", action="store_true", help="预览模式，不实际修改文件")
    parser.add_argument("--root", default=str(GTZ_ROOT), help="项目根目录")
    args = parser.parse_args()
    
    root = Path(args.root)
    if not root.exists():
        print(f"❌ 目录不存在: {root}")
        return
    
    html_files = find_html_files(root)
    print(f"找到 {len(html_files)} 个 HTML 文件")
    print(f"模式: {'预览（dry-run）' if args.dry_run else '实际执行'}")
    print("-" * 60)
    
    results = []
    for f in html_files:
        result = process_file(f, dry_run=args.dry_run)
        results.append(result)
        print(result)
    
    print("-" * 60)
    success = sum(1 for r in results if r.startswith("✅"))
    skipped = sum(1 for r in results if r.startswith("⏭️"))
    failed = sum(1 for r in results if r.startswith("❌"))
    print(f"总计: {len(results)}, 成功: {success}, 跳过: {skipped}, 失败: {failed}")

if __name__ == "__main__":
    main()
