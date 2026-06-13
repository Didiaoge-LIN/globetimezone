#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全站Sitemap生成器（含全量城市页+多语言hreflang）
- 自动同步城市数据源，无需手动维护
- 标准XML格式，兼容主流搜索引擎
- 支持多语言版本标注
"""
import re
from datetime import datetime
from pathlib import Path

SITE_BASE = "https://globetimezone.com"
LANGS = ["en", "zh", "de", "fr", "es", "ja", "ko", "pt"]
CITY_DATA_PATH = Path("functions/city/city-data.js")

# 基础页面配置
BASE_PAGES = [
    {"path": "", "priority": "1.0", "changefreq": "daily"},
    {"path": "pro.html", "priority": "0.9", "changefreq": "weekly"},
    {"path": "api.html", "priority": "0.8", "changefreq": "weekly"},
    {"path": "about.html", "priority": "0.6", "changefreq": "monthly"},
    {"path": "privacy.html", "priority": "0.3", "changefreq": "yearly"},
]

def load_city_ids() -> list:
    """从城市数据源提取ID"""
    content = CITY_DATA_PATH.read_text(encoding="utf-8")
    # 适配现有格式: CITIES = {"beijing":{...}, ...}
    return re.findall(r'"([a-z0-9][a-z0-9-]*)":\s*\{', content, re.IGNORECASE)

def build_url_entry(page: dict) -> str:
    """构建单个URL条目"""
    base_path = page["path"]
    default_url = f"{SITE_BASE}/{base_path}" if base_path else SITE_BASE + "/"
    lines = ["  <url>"]
    lines.append(f"    <loc>{default_url}</loc>")
    lines.append(f"    <lastmod>{datetime.now().strftime('%Y-%m-%d')}</lastmod>")
    lines.append(f"    <changefreq>{page['changefreq']}</changefreq>")
    lines.append(f"    <priority>{page['priority']}</priority>")

    for lang in LANGS:
        if lang == "en":
            href = default_url
        else:
            href = f"{SITE_BASE}/{lang}/{base_path}" if base_path else f"{SITE_BASE}/{lang}/"
        lines.append(f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{href}"/>')

    lines.append("  </url>")
    return "\n".join(lines)

def main():
    city_ids = load_city_ids()
    all_pages = BASE_PAGES.copy()

    # 追加所有城市页面
    for city_id in city_ids:
        all_pages.append({
            "path": f"city/{city_id}/",
            "priority": "0.8",
            "changefreq": "daily"
        })

    # XML头部与尾部
    header = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
'''
    footer = "\n</urlset>"

    # 生成完整内容
    entries = [build_url_entry(p) for p in all_pages]
    sitemap_content = header + "\n".join(entries) + footer

    Path("sitemap.xml").write_text(sitemap_content, encoding="utf-8")
    print(f"✅ sitemap.xml 生成完成，共 {len(all_pages)} 个URL（含 {len(city_ids)} 个城市页）")

if __name__ == "__main__":
    main()
