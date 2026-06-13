#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""无障碍合规校验工具
检查所有页面是否包含跳转导航链接与主容器ID
"""
import re
from pathlib import Path

SKIP_DIRS = {"node_modules", ".git", ".vscode", "dist", "build", "locales_backup"}

def check_page_compliance(filepath: Path) -> bool:
    content = filepath.read_text(encoding="utf-8", errors="ignore")
    has_skip_link = 'class="skip-link"' in content or 'skip-link' in content
    has_main_container = re.search(r'id="main-content"', content) is not None
    return has_skip_link and has_main_container

def main():
    failed_pages = []
    total_pages = 0
    for path in Path(".").rglob("*.html"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        total_pages += 1
        if not check_page_compliance(path):
            failed_pages.append(str(path))

    print(f"共检查 {total_pages} 个页面")
    if failed_pages:
        print(f"❌ 以下页面无障碍不达标：")
        for page in failed_pages:
            print(f"- {page}")
    else:
        print("✅ 所有页面无障碍校验通过")

if __name__ == "__main__":
    main()
