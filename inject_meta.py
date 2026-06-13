#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全站元标签批量注入（最终安全版）
- 自动从城市数据源提取ID，数据源唯一
- 所有动态内容全量HTML转义，防范XSS/HTML注入
- 正则精确匹配标签，无误替换正文风险
- 自动为城市页注入规范canonical
- 幂等设计：重复运行不重复插入
"""
import re
import html
from pathlib import Path

# ==================== 配置区 ====================
SITE_BASE_URL = "https://globetimezone.com"
DEFAULT_OG_IMAGE = f"{SITE_BASE_URL}/og-default.png"
OG_IMAGE_WIDTH = 1200
OG_IMAGE_HEIGHT = 630
SITE_NAME = "GlobeTimeZone"
CITY_DATA_PATH = Path("functions/city/city-data.js")

# 页面描述映射
DESCRIPTION_MAP = {
    "index.html": "GlobeTimeZone — Check the current time anywhere in the world instantly. Compare 200+ cities, schedule global meetings, see who's working or sleeping at a glance.",
    "disclaimer.html": "GlobeTimeZone disclaimer and terms of use. Time zone data is for reference only.",
    "privacy.html": "GlobeTimeZone privacy policy. We protect your personal data and never sell user information.",
    "about.html": "About GlobeTimeZone — built for global teams and remote workers to manage time zones easily.",
    "pro.html": "Upgrade to GlobeTimeZone PRO. Save custom cities, build dashboards, and unlock advanced meeting scheduler.",
    "timestamp-evidence.html": "Generate verifiable timestamp evidence with GlobeTimeZone. Trusted time proof for global transactions.",
    "api.html": "GlobeTimeZone API documentation. Integrate accurate global time data into your applications.",
}

# 页面canonical映射
CANONICAL_MAP = {
    "index.html": f"{SITE_BASE_URL}/",
    "pro.html": f"{SITE_BASE_URL}/pro.html",
    "timestamp-evidence.html": f"{SITE_BASE_URL}/timestamp-evidence.html",
    "api.html": f"{SITE_BASE_URL}/api.html",
}

# 跳过目录
SKIP_DIRS = {"node_modules", ".git", ".vscode", "dist", "build", "locales_backup"}

# ==================== 工具函数 ====================
def load_city_ids() -> list:
    """从城市数据源自动提取ID，保证全局数据源唯一"""
    if not CITY_DATA_PATH.exists():
        raise FileNotFoundError(f"城市数据源不存在: {CITY_DATA_PATH}")
    content = CITY_DATA_PATH.read_text(encoding="utf-8")
    # 适配现有格式: CITIES = {"beijing":{...}, "shanghai":{...}}
    id_pattern = re.compile(r'"([a-z0-9][a-z0-9-]*)":\s*\{', re.IGNORECASE)
    city_ids = id_pattern.findall(content)
    if not city_ids:
        raise ValueError("未从城市数据源中提取到有效城市ID，请检查文件格式")
    return list(set(city_ids))

CITY_ID_SET = set(load_city_ids())

# 通用头部标签模板（静态内容全转义）
COMMON_HEAD_TAGS = f'''
<meta property="og:type" content="website" />
<meta property="og:site_name" content="{html.escape(SITE_NAME, quote=True)}" />
<meta property="og:title" content="{html.escape(SITE_NAME, quote=True)} | Right Now Worldwide" />
<meta property="og:description" content="Know what time it is, anywhere. Instantly. No math, no conversions." />
<meta property="og:image" content="{html.escape(DEFAULT_OG_IMAGE, quote=True)}" />
<meta property="og:image:width" content="{OG_IMAGE_WIDTH}" />
<meta property="og:image:height" content="{OG_IMAGE_HEIGHT}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{html.escape(SITE_NAME, quote=True)} | Right Now Worldwide" />
<meta name="twitter:description" content="Know what time it is, anywhere. Instantly." />
<meta name="twitter:image" content="{html.escape(DEFAULT_OG_IMAGE, quote=True)}" />
<link rel="preconnect" href="https://www.googletagmanager.com" />
<link rel="preconnect" href="https://www.google-analytics.com" />
<link rel="preconnect" href="https://js.sentry-cdn.com" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
'''

# ==================== 核心逻辑 ====================
def is_html_file(filepath: Path) -> bool:
    return filepath.suffix.lower() == ".html"

def should_skip_dir(dirpath: Path) -> bool:
    return any(part in SKIP_DIRS for part in dirpath.parts)

def inject_tags(filepath: Path) -> bool:
    try:
        content = filepath.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        print(f"[跳过] 编码异常: {filepath}")
        return False

    file_name = filepath.name
    is_modified = False

    # 1. 首次注入通用头部标签
    if 'property="og:image"' not in content:
        page_tags = COMMON_HEAD_TAGS

        # 追加页面专属描述
        if file_name in DESCRIPTION_MAP:
            safe_desc = html.escape(DESCRIPTION_MAP[file_name], quote=True)
            page_tags += f'\n<meta name="description" content="{safe_desc}" />\n'

        # 追加页面专属canonical
        if file_name in CANONICAL_MAP:
            safe_canon = html.escape(CANONICAL_MAP[file_name], quote=True)
            page_tags += f'\n<link rel="canonical" href="{safe_canon}" />\n'

        # 插入到</head>前
        head_pattern = re.compile(r"</head>", re.IGNORECASE)
        if not head_pattern.search(content):
            print(f"[跳过] 无</head>标签: {filepath}")
            return False

        content = head_pattern.sub(page_tags + "</head>", content, count=1)
        is_modified = True

    # 2. 城市页专属处理：精确替换OG图 + 注入canonical
    is_city_page = "city" in str(filepath.parent).lower() or filepath.stem in CITY_ID_SET
    if is_city_page:
        clean_slug = html.escape(filepath.stem.strip().lower(), quote=True)
        city_og_url = html.escape(f"{SITE_BASE_URL}/og/{clean_slug}.png", quote=True)
        city_canonical = html.escape(f"{SITE_BASE_URL}/city/{clean_slug}/", quote=True)

        # 精确替换og:image（仅匹配meta标签，不误改正文）
        og_pattern = re.compile(
            r'(<meta\s+property="og:image"\s+content=")[^"]+("\s*/?>)',
            re.IGNORECASE
        )
        if og_pattern.search(content):
            content = og_pattern.sub(rf"\g<1>{city_og_url}\g<2>", content)
            is_modified = True

        # 精确替换twitter:image
        twitter_pattern = re.compile(
            r'(<meta\s+name="twitter:image"\s+content=")[^"]+("\s*/?>)',
            re.IGNORECASE
        )
        if twitter_pattern.search(content):
            content = twitter_pattern.sub(rf"\g<1>{city_og_url}\g<2>", content)
            is_modified = True

        # 注入城市页canonical（幂等）
        if 'rel="canonical"' not in content:
            canonical_tag = f'\n<link rel="canonical" href="{city_canonical}" />\n'
            head_pattern = re.compile(r"</head>", re.IGNORECASE)
            content = head_pattern.sub(canonical_tag + "</head>", content, count=1)
            is_modified = True

    # 仅修改时回写文件
    if is_modified:
        filepath.write_text(content, encoding="utf-8")
    return is_modified

def main():
    root = Path(".")
    total_files = 0
    modified_files = 0
    print(f"[信息] 已加载城市数据源，共 {len(CITY_ID_SET)} 个城市")
    for path in root.rglob("*.html"):
        if should_skip_dir(path):
            continue
        if not is_html_file(path):
            continue
        total_files += 1
        if inject_tags(path):
            modified_files += 1
            print(f"[已处理] {path}")
    print(f"\n✅ 执行完成：共扫描 {total_files} 个HTML文件，新增处理 {modified_files} 个")

if __name__ == "__main__":
    main()
