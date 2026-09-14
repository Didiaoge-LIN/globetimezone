#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""前端XSS风险扫描工具
检测未受控的innerHTML/document.write等危险写法
"""
import re
from pathlib import Path

SKIP_DIRS = {"node_modules", ".git", ".vscode", "dist", "build", "locales_backup"}
DANGEROUS_RULES = [
    (r"\.innerHTML\s*=", "直接赋值innerHTML，存在XSS注入风险"),
    (r"document\.write\(", "document.write动态注入风险"),
]

def scan_single_file(filepath: Path) -> list:
    issues = []
    try:
        lines = filepath.read_text(encoding="utf-8", errors="ignore").splitlines()
    except:
        return issues
    for line_num, line in enumerate(lines, 1):
        for pattern, desc in DANGEROUS_RULES:
            if re.search(pattern, line) and "sanitize" not in line.lower():
                issues.append(f"  行{line_num}: {desc} → {line.strip()[:80]}")
    return issues

def main():
    total_issues = 0
    for suffix in ["*.js", "*.html"]:
        for path in Path(".").rglob(suffix):
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            issues = scan_single_file(path)
            if issues:
                total_issues += len(issues)
                print(f"\n[风险文件] {path}")
                for issue in issues:
                    print(issue)
    print(f"\n扫描完成，共发现 {total_issues} 处潜在XSS风险点")
    if total_issues == 0:
        print("✅ 未检测到高危XSS写法")

if __name__ == "__main__":
    main()
