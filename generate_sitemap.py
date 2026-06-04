#!/usr/bin/env python3
"""GlobeTimeZone Sitemap Generator - Auto-generate complete sitemap.xml with all routes"""
import os
import json
from datetime import datetime

BASE_URL = "https://globetimezone.com"
PAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pages")
TODAY = datetime.now().strftime("%Y-%m-%d")

# All known pages with metadata
STATIC_PAGES = [
    {"loc": "/", "changefreq": "daily", "priority": 1.0},
    {"loc": "/zh/", "changefreq": "daily", "priority": 0.95, "alt_href": "/"},
    {"loc": "/es/", "changefreq": "daily", "priority": 0.95, "alt_href": "/"},
    {"loc": "/fr/", "changefreq": "daily", "priority": 0.9, "alt_href": "/"},
    {"loc": "/de/", "changefreq": "daily", "priority": 0.9, "alt_href": "/"},
    {"loc": "/ja/", "changefreq": "daily", "priority": 0.9, "alt_href": "/"},
    {"loc": "/pt/", "changefreq": "daily", "priority": 0.85, "alt_href": "/"},
    {"loc": "/ko/", "changefreq": "daily", "priority": 0.85, "alt_href": "/"},
    {"loc": "/ar/", "changefreq": "daily", "priority": 0.85, "alt_href": "/"},
]

# Pages under /pages/
PAGES = [
    # Core tools
    {"loc": "/pages/world-clock.html", "changefreq": "hourly", "priority": 0.9},
    {"loc": "/pages/meeting-scheduler.html", "changefreq": "weekly", "priority": 0.85, "alt_pages": ["/pages/meeting-scheduler-zh.html"]},
    {"loc": "/pages/team-overlap.html", "changefreq": "weekly", "priority": 0.85},
    {"loc": "/pages/embed-widget.html", "changefreq": "monthly", "priority": 0.7},
    # Tools
    {"loc": "/pages/world-map.html", "changefreq": "daily", "priority": 0.85, "alt_pages": ["/pages/world-map-zh.html"]},
    {"loc": "/pages/countdown.html", "changefreq": "weekly", "priority": 0.8, "alt_pages": ["/pages/countdown-zh.html"]},
    {"loc": "/pages/holidays.html", "changefreq": "weekly", "priority": 0.75, "alt_pages": ["/pages/holidays-zh.html"]},
    {"loc": "/pages/time-units.html", "changefreq": "monthly", "priority": 0.7, "alt_pages": ["/pages/time-units-zh.html"]},
    # Converters
    {"loc": "/pages/est-to-cst-converter.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/pst-to-est.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/utc-8-to-utc-5.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/cet-to-est.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/ast-to-pst.html", "changefreq": "weekly", "priority": 0.75},
    {"loc": "/pages/hawaii-to-est.html", "changefreq": "weekly", "priority": 0.75},
    {"loc": "/pages/europe-australia-time-difference.html", "changefreq": "weekly", "priority": 0.75},
    {"loc": "/pages/utc-to-cst-converter.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/gmt-to-cst-converter.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/ist-to-est-converter.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/jst-to-cst-converter.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/pst-to-cst-converter.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/est-to-pst-converter.html", "changefreq": "weekly", "priority": 0.8},
    {"loc": "/pages/us-china-time-difference.html", "changefreq": "weekly", "priority": 0.75},
    # Articles / Knowledge Base
    {"loc": "/pages/why-daylight-saving-time.html", "changefreq": "monthly", "priority": 0.75, "alt_pages": ["/pages/why-daylight-saving-time-zh.html"]},
    {"loc": "/pages/timezone-guide.html", "changefreq": "monthly", "priority": 0.75, "alt_pages": ["/pages/timezone-guide-zh.html"]},
    {"loc": "/pages/remote-work-timezone.html", "changefreq": "monthly", "priority": 0.7, "alt_pages": ["/pages/remote-work-timezone-zh.html"]},
    {"loc": "/pages/distributed-team-time-culture.html", "changefreq": "monthly", "priority": 0.75},
    {"loc": "/pages/remote-team-timezone-guide.html", "changefreq": "weekly", "priority": 0.85},
    {"loc": "/pages/articles.html", "changefreq": "weekly", "priority": 0.7, "alt_pages": ["/pages/articles-zh.html"]},
    # Developer & Monetization
    {"loc": "/pages/api.html", "changefreq": "monthly", "priority": 0.8},
    {"loc": "/pages/pro.html", "changefreq": "monthly", "priority": 0.6},
    {"loc": "/pages/subscribe.html", "changefreq": "monthly", "priority": 0.5},
    # Info pages
    {"loc": "/pages/about.html", "changefreq": "monthly", "priority": 0.5, "alt_pages": ["/pages/about-zh.html"]},
    {"loc": "/pages/contact.html", "changefreq": "monthly", "priority": 0.6},
    {"loc": "/pages/privacy.html", "changefreq": "yearly", "priority": 0.3},
    {"loc": "/pages/disclaimer.html", "changefreq": "yearly", "priority": 0.3},
    {"loc": "/pages/terms.html", "changefreq": "yearly", "priority": 0.3},
]

# City time pages
CITY_PAGES = [
    "new-york", "london", "beijing", "tokyo", "paris", "dubai",
    "sydney", "singapore", "los-angeles", "seoul", "chicago", "toronto"
]

LANGUAGES = {
    "en": "/",
    "zh": "/zh/",
    "es": "/es/",
    "fr": "/fr/",
    "de": "/de/",
    "ja": "/ja/",
    "pt": "/pt/",
    "ko": "/ko/",
    "ar": "/ar/"
}

def build_url(loc, changefreq="daily", priority=0.5, hreflangs=None):
    lines = []
    lines.append("  <url>")
    lines.append(f"    <loc>{BASE_URL}{loc}</loc>")
    if hreflangs:
        for lang, href in hreflangs.items():
            lines.append(f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{BASE_URL}{href}" />')
    lines.append(f"    <lastmod>{TODAY}</lastmod>")
    lines.append(f"    <changefreq>{changefreq}</changefreq>")
    lines.append(f"    <priority>{priority}</priority>")
    lines.append("  </url>")
    return "\n".join(lines)

def generate_sitemap():
    urls = []

    # Static root pages with hreflang
    urls.append(build_url("/", "daily", 1.0, LANGUAGES))

    # Other language homepages
    lang_configs = [
        ("/zh/", "daily", 0.95),
        ("/es/", "daily", 0.95),
        ("/fr/", "daily", 0.9),
        ("/de/", "daily", 0.9),
        ("/ja/", "daily", 0.9),
        ("/pt/", "daily", 0.85),
        ("/ko/", "daily", 0.85),
        ("/ar/", "daily", 0.85),
    ]
    for loc, cf, pri in lang_configs:
        urls.append(build_url(loc, cf, pri, LANGUAGES))

    # Pages
    for page in PAGES:
        urls.append(build_url(page["loc"], page["changefreq"], page["priority"]))

    # City pages
    for city in CITY_PAGES:
        urls.append(build_url(f"/pages/time-in/{city}.html", "daily", 0.9))

    # Assemble XML
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n'
    xml += "\n".join(urls)
    xml += "\n</urlset>\n"

    sitemap_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sitemap.xml")
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(xml)

    print(f"✅ Sitemap generated: {sitemap_path}")
    print(f"   Total URLs: {len(urls)}")
    return sitemap_path

if __name__ == "__main__":
    generate_sitemap()
