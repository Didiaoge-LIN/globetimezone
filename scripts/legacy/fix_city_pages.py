#!/usr/bin/env python3
"""批量修复 pages/time-in/ 下12个城市页面：
1. CSS 路径修复 (../css → ../../css)
2. 添加 BreadcrumbList 结构化数据
3. 添加 Related Cities 内链模块
4. 修复导航链接
"""
import os
import re

BASE = r"C:\Users\ASUS\WorkBuddy\Claw\globetimezone\pages\time-in"

# 城市数据
CITIES = {
    "new-york":    {"name": "New York",    "country": "United States", "flag": "🇺🇸", "slug": "new-york"},
    "los-angeles": {"name": "Los Angeles", "country": "United States", "flag": "🇺🇸", "slug": "los-angeles"},
    "chicago":     {"name": "Chicago",     "country": "United States", "flag": "🇺🇸", "slug": "chicago"},
    "toronto":     {"name": "Toronto",     "country": "Canada",        "flag": "🇨🇦", "slug": "toronto"},
    "london":      {"name": "London",      "country": "United Kingdom", "flag": "🇬🇧", "slug": "london"},
    "paris":       {"name": "Paris",       "country": "France",        "flag": "🇫🇷", "slug": "paris"},
    "dubai":       {"name": "Dubai",       "country": "UAE",           "flag": "🇦🇪", "slug": "dubai"},
    "beijing":     {"name": "Beijing",     "country": "China",         "flag": "🇨🇳", "slug": "beijing"},
    "tokyo":       {"name": "Tokyo",       "country": "Japan",         "flag": "🇯🇵", "slug": "tokyo"},
    "seoul":       {"name": "Seoul",       "country": "South Korea",   "flag": "🇰🇷", "slug": "seoul"},
    "singapore":   {"name": "Singapore",   "country": "Singapore",     "flag": "🇸🇬", "slug": "singapore"},
    "sydney":      {"name": "Sydney",      "country": "Australia",     "flag": "🇦🇺", "slug": "sydney"},
}

def generate_breadcrumb_schema(city_slug, city_name):
    """生成 BreadcrumbList JSON-LD"""
    return f'''  <!-- BreadcrumbList Schema -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://globetimezone.com"}},
      {{"@type": "ListItem", "position": 2, "name": "World Clock", "item": "https://globetimezone.com/pages/world-clock.html"}},
      {{"@type": "ListItem", "position": 3, "name": "{city_name}", "item": "https://globetimezone.com/time-in/{city_slug}"}}
    ]
  }}
  </script>
'''

def generate_related_cities(current_slug):
    """生成 Related Cities 内链模块 HTML"""
    related = [(c, CITIES[c]) for c in CITIES if c != current_slug]
    items = []
    for slug, data in related[:11]:  # 显示其他11个城市
        items.append(f'''      <a href="{slug}" class="quick-convert-item">
        <span class="qc-flag">{data['flag']}</span>
        <div class="qc-info">
          <span class="qc-name">{data['name']}</span>
          <span class="qc-desc">{data['country']}</span>
        </div>
      </a>''')
    
    return f'''  <!-- Related Cities -->
  <section style="margin-top:40px;">
    <h2 class="section-title">🌍 Current Time in Other Cities</h2>
    <p style="color:var(--text-muted);margin-bottom:16px;">Explore real-time clocks for major cities worldwide</p>
    <div class="quick-convert-grid" style="margin-top:16px;">
{chr(10).join(items)}
    </div>
  </section>
'''

def fix_city_page(filepath, slug, city_data):
    """修复单个城市页面"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    city_name = city_data['name']
    
    # 1. 修复 CSS 路径: ../css/style.css → ../../css/style.css
    content = content.replace('href="../css/style.css"', 'href="../../css/style.css"')
    
    # 2. 修复导航链接 - header
    # Home link: href="../" → href="../../"
    content = re.sub(
        r'<a href="\.\./" class="logo">',
        '<a href="../../" class="logo">',
        content
    )
    
    # Nav links: world-clock.html → ../world-clock.html
    content = content.replace(
        'href="world-clock.html"',
        'href="../world-clock.html"'
    )
    content = content.replace(
        'href="meeting-scheduler.html"',
        'href="../meeting-scheduler.html"'
    )
    content = content.replace(
        'href="about.html"',
        'href="../about.html"'
    )
    
    # Breadcrumb home link
    content = content.replace(
        '<a href="../" style="color:#2563eb;text-decoration:none;">Home</a>',
        '<a href="../../" style="color:#2563eb;text-decoration:none;">Home</a>'
    )
    
    # Footer links
    content = content.replace(
        '<a href="../">Time Zone Converter</a>',
        '<a href="../../">Time Zone Converter</a>'
    )
    content = content.replace(
        '<a href="world-clock.html">World Clock</a>',
        '<a href="../world-clock.html">World Clock</a>'
    )
    content = content.replace(
        '<a href="meeting-scheduler.html">Meeting Scheduler</a>',
        '<a href="../meeting-scheduler.html">Meeting Scheduler</a>'
    )
    content = content.replace(
        '<a href="about.html">About</a>',
        '<a href="../about.html">About</a>'
    )
    content = content.replace(
        '<a href="contact.html">Contact</a>',
        '<a href="../contact.html">Contact</a>'
    )
    
    # Footer popular cities links (time-in/new-york → new-york)
    # These are already relative within the same directory, so they should be fine
    # But they currently point to "time-in/new-york" which would be wrong from pages/time-in/
    # Let's fix them to be direct: new-york
    for s, d in CITIES.items():
        content = content.replace(f'href="time-in/{s}"', f'href="{s}"')
    
    # Footer logo link
    content = content.replace(
        '<a href="../" class="footer-logo">',
        '<a href="../../" class="footer-logo">'
    )
    
    # 3. 修复 Related Pages 中的链接 (time-in/xxx → xxx)
    for s, d in CITIES.items():
        content = content.replace(f'href="time-in/{s}"', f'href="{s}"')
    
    # 4. 添加 BreadcrumbList Schema（在 WebApplication Schema 之后）
    breadcrumb_schema = generate_breadcrumb_schema(slug, city_name)
    
    # 在 close of WebApplication script 之后插入
    webapp_end = '</script>\n</head>'
    insert_pos = content.find(webapp_end)
    if insert_pos != -1:
        insert_point = insert_pos + len('</script>')
        content = content[:insert_point] + '\n' + breadcrumb_schema + content[insert_point:]
    
    # 5. 添加 Related Cities 模块（在 footer 之前）
    related_html = generate_related_cities(slug)
    footer_marker = '<!-- Footer -->'
    footer_pos = content.find(footer_marker)
    if footer_pos != -1:
        content = content[:footer_pos] + '\n' + related_html + '\n\n' + content[footer_pos:]
    
    # 6. 修复 meta og:url 中的路径（如果有 time-in/new-york-zh 之类）
    content = re.sub(
        r'content="https://globetimezone\.com/time-in/([^"]+)"',
        lambda m: f'content="https://globetimezone.com/time-in/{m.group(1)}"',
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return len(related_html.split('\n'))

def main():
    fixed = 0
    for slug, data in CITIES.items():
        filepath = os.path.join(BASE, f"{slug}.html")
        if os.path.exists(filepath):
            lines = fix_city_page(filepath, slug, data)
            print(f"✅ Fixed: {slug}.html ({data['name']}) - Related links: {lines}")
            fixed += 1
        else:
            print(f"❌ File not found: {filepath}")
    
    print(f"\n🎉 Total fixed: {fixed}/12 city pages")

if __name__ == "__main__":
    main()
