#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSP内联脚本哈希自动生成工具
- 扫描所有HTML文件中的内联<script>代码
- 计算标准SHA256哈希
- 自动更新_headers中的script-src配置
"""
import re
import hashlib
import base64
from pathlib import Path

SKIP_DIRS = {"node_modules", ".git", ".vscode", "dist", "build", "locales_backup"}
HEADERS_FILE = Path("_headers")

def get_sha256_hash(code_text: str) -> str:
    """计算内联代码的SHA256哈希（CSP标准格式）"""
    data = code_text.strip().encode("utf-8")
    digest = hashlib.sha256(data).digest()
    return f"'sha256-{base64.b64encode(digest).decode()}'"

def collect_all_inline_hashes() -> set:
    """收集全站所有内联脚本的哈希"""
    hash_set = set()
    for path in Path(".").rglob("*.html"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except:
            continue
        # 匹配不带src的内联script标签
        pattern = re.compile(r"<script[^>]*>(.*?)</script>", re.DOTALL | re.IGNORECASE)
        for match in pattern.findall(content):
            code = match.strip()
            if not code:
                continue
            # 跳过JSON-LD结构化数据
            if code.startswith('{') or code.startswith('['):
                continue
            hash_set.add(get_sha256_hash(code))
    return hash_set

def update_headers_file(hash_set: set):
    """更新_headers中的script-src配置"""
    if not HEADERS_FILE.exists():
        print("[错误] 未找到_headers文件，请确认路径")
        return

    content = HEADERS_FILE.read_text(encoding="utf-8")
    hash_str = " ".join(sorted(hash_set))

    # 替换script-src整段规则
    new_content = re.sub(
        r"script-src[^;]*;",
        f"script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://js.sentry-cdn.com {hash_str};",
        content,
        count=1
    )

    HEADERS_FILE.write_text(new_content, encoding="utf-8")
    print(f"✅ 已更新_headers文件，共注入 {len(hash_set)} 个内联脚本哈希")

def main():
    hash_set = collect_all_inline_hashes()
    if not hash_set:
        print("[提示] 未检测到内联脚本，无需更新CSP")
        return
    update_headers_file(hash_set)

if __name__ == "__main__":
    main()
