#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SRI完整性哈希批量注入（最终安全版）
- 强制HTTPS远程资源
- 可信域名白名单机制
- 本地路径防遍历校验
- 生成审计清单供人工复核
- 异常自动降级不阻塞
"""
import re
import json
import hashlib
import base64
import urllib.request
import urllib.error
from pathlib import Path

SKIP_DIRS = {"node_modules", ".git", ".vscode", "dist", "build", "locales_backup"}
# 可信远程资源白名单
TRUSTED_DOMAINS = {
    "www.googletagmanager.com",
    "www.google-analytics.com",
    "js.sentry-cdn.com",
}
MANIFEST_FILE = "sri-manifest.json"

def get_sha384_hash(content_bytes: bytes) -> str:
    digest = hashlib.sha384(content_bytes).digest()
    return f"sha384-{base64.b64encode(digest).decode('utf-8')}"

def is_trusted_remote(url: str) -> bool:
    """校验远程资源：HTTPS + 白名单域名"""
    if not url.startswith("https://"):
        return False
    try:
        domain = url.split("/")[2]
        return domain in TRUSTED_DOMAINS
    except IndexError:
        return False

def fetch_remote_script(url: str) -> bytes:
    """安全获取远程脚本，带超时控制"""
    if not is_trusted_remote(url):
        raise ValueError(f"非可信远程资源，跳过: {url}")
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "GlobeTimeZone-SRI-Tool/1.0"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read()

def process_html_file(filepath: Path, manifest: dict) -> int:
    try:
        content = filepath.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return 0

    pattern = re.compile(
        r'<script\s+([^>]*)src="([^"]+)"([^>]*)></script>',
        re.IGNORECASE
    )
    count = 0
    manifest[str(filepath)] = []

    def replace_tag(match):
        nonlocal count
        prefix = match.group(1)
        src = match.group(2)
        suffix = match.group(3)

        # 已有integrity则跳过
        if "integrity=" in prefix + suffix:
            return match.group(0)

        try:
            # 本地脚本
            if src.startswith("/"):
                local_path = Path("." + src)
                # 防路径遍历
                if not local_path.resolve().is_relative_to(Path(".").resolve()):
                    return match.group(0)
                if not local_path.is_file():
                    return match.group(0)
                data = local_path.read_bytes()
                resource_type = "local"
            # 远程脚本
            elif src.startswith("http"):
                data = fetch_remote_script(src)
                resource_type = "remote"
            else:
                return match.group(0)

            sri_hash = get_sha384_hash(data)
            manifest[str(filepath)].append({
                "src": src,
                "type": resource_type,
                "hash": sri_hash
            })
            count += 1
            return f'<script {prefix}src="{src}" integrity="{sri_hash}" crossorigin="anonymous" {suffix}></script>'
        except Exception as e:
            print(f"[警告] {src} 处理失败: {str(e)}")
            return match.group(0)

    new_content = pattern.sub(replace_tag, content)
    if count > 0:
        filepath.write_text(new_content, encoding="utf-8")
    return count

def main():
    root = Path(".")
    total = 0
    manifest = {}
    for path in root.rglob("*.html"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        num = process_html_file(path, manifest)
        if num > 0:
            print(f"[已注入] {path}: {num} 个脚本")
            total += num

    # 输出审计清单
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\n✅ 执行完成：共注入 {total} 个SRI哈希")
    print(f"📋 审计清单已生成: {MANIFEST_FILE}，请人工复核后上线")

if __name__ == "__main__":
    main()
