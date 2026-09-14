#!/usr/bin/env python3
"""
GlobeTimeZone - 城市页面批量生成脚本 (v2)
使用模板文件 + str.replace() 方式，避免 f-string 嵌套引号问题

用法:
  python scripts/generate_city_pages.py
  python scripts/generate_city_pages.py --limit 10
  python scripts/generate_city_pages.py --slug beijing
  python scripts/generate_city_pages.py --check-only
"""
import json
import sys
import re
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / 'data' / 'top-200-cities.json'
TEMPLATE_PATH = BASE_DIR / 'templates' / 'city.html'
OUTPUT_DIR = BASE_DIR / 'city'
SITEMAP_PATH = BASE_DIR / 'sitemap.xml'
SITE_URL = 'https://globetimezone.com'

REFERENCE_CITIES = [
    {'name': '北京', 'nameEn': 'Beijing', 'timezone': 'Asia/Shanghai', 'country': '中国', 'utcOffset': 8},
    {'name': '纽约', 'nameEn': 'New York', 'timezone': 'America/New_York', 'country': '美国', 'utcOffset': -5},
    {'name': '伦敦', 'nameEn': 'London', 'timezone': 'Europe/London', 'country': '英国', 'utcOffset': 0},
    {'name': '东京', 'nameEn': 'Tokyo', 'timezone': 'Asia/Tokyo', 'country': '日本', 'utcOffset': 9},
    {'name': '悉尼', 'nameEn': 'Sydney', 'timezone': 'Australia/Sydney', 'country': '澳大利亚', 'utcOffset': 10},
    {'name': '迪拜', 'nameEn': 'Dubai', 'timezone': 'Asia/Dubai', 'country': '阿联酋', 'utcOffset': 4},
    {'name': '莫斯科', 'nameEn': 'Moscow', 'timezone': 'Europe/Moscow', 'country': '俄罗斯', 'utcOffset': 3},
    {'name': '洛杉矶', 'nameEn': 'Los Angeles', 'timezone': 'America/Los_Angeles', 'country': '美国', 'utcOffset': -8},
]


def validate_city_data(city):
    errors = []
    required = ['slug', 'name', 'nameEn', 'country', 'countryCode', 'timezone', 'utcOffset', 'dst']
    for field in required:
        if field not in city or city[field] is None:
            errors.append('缺少必填字段: ' + field)
    if city.get('slug') and not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', city['slug']):
        errors.append('slug格式错误: ' + city['slug'])
    if city.get('timezone') and not re.match(r'^[A-Za-z]+(/[A-Za-z_]+)+$', city['timezone']):
        if not re.match(r'^Etc/GMT[+-]?\d+$', city['timezone']):
            errors.append('时区格式可能错误: ' + city['timezone'])
    if city.get('utcOffset') is not None and (city['utcOffset'] < -12 or city['utcOffset'] > 14):
        errors.append('UTC偏移超出范围: ' + str(city['utcOffset']))
    if city.get('dst') and (not city.get('dstStart') or not city.get('dstEnd')):
        errors.append('夏令时城市必须提供dstStart和dstEnd')
    if not city.get('bestBusinessTime'):
        errors.append('缺少bestBusinessTime')
    if not city.get('bestPersonalTime'):
        errors.append('缺少bestPersonalTime')
    if not city.get('faqs') or len(city['faqs']) < 3:
        errors.append('FAQ至少需要3条，当前' + str(len(city.get('faqs', []))) + '条')
    if not city.get('relatedCities') or len(city['relatedCities']) < 5:
        errors.append('相关城市至少需要5个，当前' + str(len(city.get('relatedCities', []))) + '个')
    return {'valid': len(errors) == 0, 'errors': errors}


def check_seo(html, city):
    issues = []
    title_match = re.search(r'<title>(.*?)</title>', html)
    if title_match:
        title = title_match.group(1)
        if len(title) < 30 or len(title) > 70:
            issues.append('标题长度' + str(len(title)) + '字符（建议30-70）')
    else:
        issues.append('缺少<title>标签')
    desc_match = re.search(r'<meta name="description" content="(.*?)"', html)
    if desc_match:
        desc = desc_match.group(1)
        if len(desc) < 80 or len(desc) > 170:
            issues.append('描述长度' + str(len(desc)) + '字符（建议80-170）')
    else:
        issues.append('缺少meta description')
    if '"@type": "Clock"' not in html and '"@type":"Clock"' not in html:
        issues.append('缺少Clock结构化数据')
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html)
    if not h1_match:
        issues.append('缺少H1标签')
    elif city['name'] not in h1_match.group(1):
        issues.append('H1未包含城市名')
    internal_links = re.findall(r'href="/city/[a-z0-9-]+/?"', html)
    if len(internal_links) < 5:
        issues.append('内链数量不足: ' + str(len(internal_links)) + '个')
    if 'rel="canonical"' not in html:
        issues.append('缺少canonical URL')
    if 'hreflang=' not in html:
        issues.append('缺少hreflang多语言标签')
    return {'valid': len(issues) == 0, 'issues': issues}


def get_utc_offset_str(offset):
    if offset == 0:
        return 'UTC+0'
    sign = '+' if offset > 0 else ''
    if offset == int(offset):
        return 'UTC' + sign + str(int(offset))
    else:
        whole = int(offset)
        frac = abs(offset - whole)
        mins = int(frac * 60)
        return 'UTC' + sign + str(whole) + ':' + str(mins).zfill(2)


def build_time_diff_rows(city):
    rows = []
    offset = city['utcOffset']
    for ref in REFERENCE_CITIES:
        diff = ref['utcOffset'] - offset
        if diff == 0:
            diff_display = '0（相同）'
        elif diff > 0:
            diff_display = '+' + str(int(diff)) + '小时' if diff == int(diff) else '+' + str(diff) + '小时'
        else:
            diff_display = str(int(diff)) + '小时' if diff == int(diff) else str(diff) + '小时'
        color_style = ''
        if diff > 0:
            color_style = 'color:#22c55e'
        elif diff < 0:
            color_style = 'color:#ef4444'
        row = '        <tr>\n          <td>' + ref['name'] + '<br><small style="color:var(--text-secondary)">' + ref['nameEn'] + '</small></td>\n          <td style="font-weight:600;' + color_style + '">' + diff_display + '</td>\n          <td><span class="status-dot" data-timezone="' + ref['timezone'] + '"></span></td>\n        </tr>'
        rows.append(row)
    return '\n'.join(rows)


def build_faq_items(city):
    items = []
    for i, faq in enumerate(city.get('faqs', [])):
        open_attr = ' open' if i == 0 else ''
        item = '      <details class="faq-item"' + open_attr + '>\n        <summary class="faq-question">' + faq['question'] + '</summary>\n        <div class="faq-answer"><p>' + faq['answer'] + '</p></div>\n      </details>'
        items.append(item)
    return '\n'.join(items)


def build_faq_schema(city):
    entries = []
    for faq in city.get('faqs', []):
        q = faq['question'].replace('"', '\\"')
        a = faq['answer'].replace('"', '\\"')
        entry = '{\n      "@type": "Question",\n      "name": "' + q + '",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "' + a + '"\n      }\n    }'
        entries.append(entry)
    return ','.join(entries)


def build_related_links(city):
    links = []
    for rc in city.get('relatedCities', []):
        link = '        <a href="/city/' + rc['slug'] + '/" class="city-card-sm">\n          <h3>' + rc['name'] + '</h3>\n          <div class="city-time-sm" data-timezone="' + rc['timezone'] + '"></div>\n        </a>'
        links.append(link)
    return '\n'.join(links)


def build_hreflang_tags(slug):
    langs = [
        ('en', 'en'), ('zh-CN', 'zh'), ('de', 'de'), ('fr', 'fr'),
        ('es', 'es'), ('ja', 'ja'), ('ko', 'ko'), ('pt-BR', 'pt'), ('ar', 'ar')
    ]
    tags = []
    for hreflang, lang_code in langs:
        tag = '  <link rel="alternate" hreflang="' + hreflang + '" href="https://globetimezone.com/' + lang_code + '/city/' + slug + '/" />'
        tags.append(tag)
    tags.append('  <link rel="alternate" hreflang="x-default" href="https://globetimezone.com/city/' + slug + '/" />')
    return '\n'.join(tags)


def render_city_page(city, template):
    name = city['name']
    slug = city['slug']
    tz = city['timezone']
    tz_name = city.get('timezoneName', '') or tz  # 后备用IANA标识
    offset = city['utcOffset']
    offset_str = get_utc_offset_str(offset)
    country = city['country']
    cc = city['countryCode']
    dst = city.get('dst', False)
    name_en = city.get('nameEn', name)

    dst_display = '实行' if dst else '不实行'
    dst_extra = ''
    if dst:
        dst_extra = '        <li><strong>夏令时开始：</strong>' + city.get('dstStart', '') + '</li>\n        <li><strong>夏令时结束：</strong>' + city.get('dstEnd', '') + '</li>\n        <li><strong>夏令时拨钟：</strong>拨快1小时</li>'

    html = template
    html = html.replace('{{name}}', name)
    html = html.replace('{{name_en}}', name_en)
    html = html.replace('{{slug}}', slug)
    html = html.replace('{{timezone}}', tz)
    html = html.replace('{{timezoneName}}', tz_name)
    html = html.replace('{{offset_str}}', offset_str)
    html = html.replace('{{country}}', country)
    html = html.replace('{{countryCode}}', cc)
    html = html.replace('{{dst_display}}', dst_display)
    html = html.replace('{{dst_extra}}', dst_extra)
    html = html.replace('{{bestBusinessTime}}', city.get('bestBusinessTime', ''))
    html = html.replace('{{bestPersonalTime}}', city.get('bestPersonalTime', ''))
    html = html.replace('{{time_diff_rows}}', build_time_diff_rows(city))
    html = html.replace('{{faq_items}}', build_faq_items(city))
    html = html.replace('{{faq_schema}}', build_faq_schema(city))
    html = html.replace('{{related_links}}', build_related_links(city))
    html = html.replace('{{hreflang_tags}}', build_hreflang_tags(slug))

    return html


def generate_all(cities, limit=None, slug_filter=None, check_only=False):
    cities_sorted = sorted(cities, key=lambda x: x.get('searchVolume', 0), reverse=True)
    if slug_filter:
        cities_sorted = [c for c in cities_sorted if c['slug'] == slug_filter]
        if not cities_sorted:
            print('未找到slug为"' + slug_filter + '"的城市')
            return 0, 1
    if limit:
        cities_sorted = cities_sorted[:limit]

    success = 0
    fail = 0
    seo_issues = 0
    validation_fails = []

    for city in cities_sorted:
        slug = city['slug']
        validation = validate_city_data(city)
        if not validation['valid']:
            print('数据校验失败 [' + slug + ']: ' + str(validation['errors']))
            validation_fails.append(slug)
            fail += 1
            continue

        if check_only:
            print('数据校验通过 [' + slug + ']')
            success += 1
            continue

        try:
            with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
                template = f.read()
            html = render_city_page(city, template)
        except Exception as e:
            print('渲染失败 [' + slug + ']: ' + str(e))
            fail += 1
            continue

        seo_result = check_seo(html, city)
        if not seo_result['valid']:
            seo_issues += 1
            for issue in seo_result['issues']:
                print('  SEO [' + slug + ']: ' + issue)

        output_path = OUTPUT_DIR / (slug + '.html')
        try:
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html)
            print('生成成功: /city/' + slug + '.html')
            success += 1
        except Exception as e:
            print('写入失败 [' + slug + ']: ' + str(e))
            fail += 1

    print('\n' + '=' * 50)
    print('生成完成: ' + str(success) + '个成功, ' + str(fail) + '个失败')
    if seo_issues > 0:
        print('SEO问题: ' + str(seo_issues) + '个城市有SEO建议')
    if validation_fails:
        print('数据校验失败: ' + str(validation_fails))
    return success, fail


def update_sitemap(cities):
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S+00:00')
    city_entries = []
    cities_sorted = sorted(cities, key=lambda x: x.get('searchVolume', 0), reverse=True)
    for city in cities_sorted:
        slug = city['slug']
        url = SITE_URL + '/city/' + slug + '/'
        sv = city.get('searchVolume', 0)
        priority = '0.8' if sv > 20000 else '0.7' if sv > 10000 else '0.6'
        entry = '  <url>\n    <loc>' + url + '</loc>\n    <lastmod>' + now + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>' + priority + '</priority>\n  </url>'
        city_entries.append(entry)

    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    core_pages = [
        ('/', '1.0', 'daily'),
        ('/time-difference/', '0.9', 'weekly'),
        ('/meeting-planner/', '0.8', 'weekly'),
        ('/tools/cross-border/', '0.8', 'weekly'),
        ('/pricing/', '0.7', 'monthly'),
        ('/blog/', '0.7', 'weekly'),
        ('/privacy/', '0.3', 'monthly'),
        ('/about/', '0.5', 'monthly'),
    ]
    for path, priority, freq in core_pages:
        sitemap += '  <url>\n    <loc>' + SITE_URL + path + '</loc>\n    <lastmod>' + now + '</lastmod>\n    <changefreq>' + freq + '</changefreq>\n    <priority>' + priority + '</priority>\n  </url>\n'

    for entry in city_entries:
        sitemap += entry + '\n'

    sitemap += '</urlset>'

    with open(SITEMAP_PATH, 'w', encoding='utf-8') as f:
        f.write(sitemap)
    print('sitemap.xml 已更新，包含 ' + str(len(core_pages) + len(city_entries)) + ' 个URL')


def main():
    limit = None
    slug_filter = None
    check_only = False
    skip_sitemap = False

    for arg in sys.argv[1:]:
        if arg.startswith('--limit='):
            limit = int(arg.split('=')[1])
        elif arg.startswith('--slug='):
            slug_filter = arg.split('=')[1]
        elif arg == '--check-only':
            check_only = True
        elif arg == '--skip-sitemap':
            skip_sitemap = True

    if not DATA_PATH.exists():
        print('城市数据文件不存在: ' + str(DATA_PATH))
        sys.exit(1)
    if not TEMPLATE_PATH.exists():
        print('模板文件不存在: ' + str(TEMPLATE_PATH))
        sys.exit(1)

    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        cities = json.load(f)

    print('加载了 ' + str(len(cities)) + ' 个城市数据')

    success, fail = generate_all(cities, limit=limit, slug_filter=slug_filter, check_only=check_only)

    if not check_only and not skip_sitemap and fail == 0:
        update_sitemap(cities)

    if fail > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
