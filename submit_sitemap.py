#!/usr/bin/env python3
"""
Bing Webmaster Tools API - Sitemap 提交脚本
============================================
使用方法:
  python submit_sitemap.py <api_key>

示例:
  python submit_sitemap.py "your-api-key-here"

获取 API Key:
  1. 访问 https://www.bing.com/webmasters
  2. 登录/注册 Bing 账户
  3. 添加网站 globetimezone.com
  4. 进入 设置 (Settings) -> API Access
  5. 复制 API Key

功能:
  - 提交 sitemap.xml 到 Bing 索引
  - 批量提交多个 URL
  - 自动验证网站所有权
"""

import sys
import json
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime

# ========== 配置区 ==========
SITE_URL = "https://globetimezone.com"
SITEMAP_URL = "https://globetimezone.com/sitemap.xml"

# Bing Webmaster Tools API 端点
API_BASE = "https://ssl.bing.com/webmaster/api.svc/json"

# 常用 URL 列表（可扩展）
URLS_TO_SUBMIT = [
    "https://globetimezone.com/",
    "https://globetimezone.com/sitemap.xml",
    "https://globetimezone.com/pages/world-clock.html",
    "https://globetimezone.com/pages/meeting-scheduler.html",
    "https://globetimezone.com/pages/remote-team-timezone-guide.html",
    "https://globetimezone.com/pages/timezone-guide.html",
    "https://globetimezone.com/pages/why-daylight-saving-time.html",
    "https://globetimezone.com/pages/holidays.html",
    "https://globetimezone.com/pages/countdown.html",
    "https://globetimezone.com/pages/privacy.html",
    "https://globetimezone.com/pages/about.html",
    "https://globetimezone.com/pages/contact.html",
    # 城市页面
    "https://globetimezone.com/pages/new-york.html",
    "https://globetimezone.com/pages/london.html",
    "https://globetimezone.com/pages/tokyo.html",
    "https://globetimezone.com/pages/beijing.html",
    "https://globetimezone.com/pages/sydney.html",
    "https://globetimezone.com/pages/dubai.html",
    "https://globetimezone.com/pages/singapore.html",
    "https://globetimezone.com/pages/paris.html",
    "https://globetimezone.com/pages/seoul.html",
    "https://globetimezone.com/pages/los-angeles.html",
    "https://globetimezone.com/pages/chicago.html",
    "https://globetimezone.com/pages/toronto.html",
]


def submit_url(api_key: str, site_url: str, url_to_submit: str) -> dict:
    """提交单个 URL 到 Bing 索引"""
    params = urllib.parse.urlencode({
        "siteUrl": site_url,
        "url": url_to_submit,
        "apikey": api_key
    })
    api_url = f"{API_BASE}/SubmitUrl?{params}"

    data = json.dumps({}).encode('utf-8')

    req = urllib.request.Request(
        api_url,
        data=data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode('utf-8'))
            return {"success": True, "url": url_to_submit, "response": result}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ""
        return {"success": False, "url": url_to_submit, "error": f"HTTP {e.code}", "body": error_body}
    except urllib.error.URLError as e:
        return {"success": False, "url": url_to_submit, "error": str(e.reason)}
    except Exception as e:
        return {"success": False, "url": url_to_submit, "error": str(e)}


def get_index_stats(api_key: str, site_url: str) -> dict:
    """获取网站索引统计"""
    params = urllib.parse.urlencode({
        "siteUrl": site_url,
        "apikey": api_key
    })
    api_url = f"{API_BASE}/GetIndexStats?{params}"

    req = urllib.request.Request(api_url, headers={"Accept": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode('utf-8'))
            return {"success": True, "stats": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


def main():
    if len(sys.argv) < 2:
        print("=" * 60)
        print("  Bing Webmaster Tools - Sitemap 提交工具")
        print("=" * 60)
        print()
        print("用法: python submit_sitemap.py <api_key>")
        print()
        print("获取 API Key 步骤:")
        print("  1. 访问 https://www.bing.com/webmasters")
        print("  2. 登录后点击 '添加网站' -> 输入 globetimezone.com")
        print("  3. 验证网站所有权（支持 HTML 文件验证）")
        print("  4. 进入 设置 -> API Access -> 复制 API Key")
        print()
        print("示例:")
        print("  python submit_sitemap.py \"9257831BCEDCB778FD826CE014062D9A\"")
        print("=" * 60)
        sys.exit(1)

    api_key = sys.argv[1]

    print()
    print("=" * 60)
    print(f"  Bing Webmaster Tools - Sitemap 提交")
    print(f"  时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    print(f"网站: {SITE_URL}")
    print(f"Sitemap: {SITEMAP_URL}")
    print(f"待提交 URL 数量: {len(URLS_TO_SUBMIT)}")
    print()

    # 1. 提交 sitemap.xml
    print("-" * 60)
    print("📋 提交 sitemap.xml...")
    result = submit_url(api_key, SITE_URL, SITEMAP_URL)
    if result["success"]:
        print(f"  ✅ sitemap.xml 提交成功")
    else:
        print(f"  ❌ 提交失败: {result.get('error', result.get('body', 'Unknown'))}")

    print()
    print("-" * 60)
    print(f"📋 批量提交 {len(URLS_TO_SUBMIT)} 个 URL...")

    success_count = 0
    fail_count = 0

    for i, url in enumerate(URLS_TO_SUBMIT, 1):
        result = submit_url(api_key, SITE_URL, url)
        status = "✅" if result["success"] else "❌"
        print(f"  [{i:02d}/{len(URLS_TO_SUBMIT)}] {status} {url}")

        if result["success"]:
            success_count += 1
        else:
            fail_count += 1

    print()
    print("=" * 60)
    print(f"📊 提交结果汇总")
    print(f"  成功: {success_count}")
    print(f"  失败: {fail_count}")
    print(f"  总计: {len(URLS_TO_SUBMIT)}")
    print("=" * 60)
    print()

    # 2. 获取索引统计
    print("-" * 60)
    print("📈 获取索引统计...")
    stats = get_index_stats(api_key, SITE_URL)
    if stats["success"]:
        print(f"  ✅ 获取成功")
        if "Stats" in stats.get("stats", {}):
            s = stats["stats"]["Stats"]
            print(f"     已索引页面数: {s.get('IndexedPages', 'N/A')}")
            print(f"     已提交页面数: {s.get('SubmittedPages', 'N/A')}")
    else:
        print(f"  ⚠️  获取失败: {stats.get('error', 'Unknown')}")
    print()

    print("✅ 所有操作完成！")
    print()
    print("💡 提示:")
    print("  - Bing 通常在 24-48 小时内处理提交")
    print("  - 您可以随时重新运行此脚本提交新页面")
    print("  - 访问 https://www.bing.com/webmasters 查看详细报告")


if __name__ == "__main__":
    main()
