#!/usr/bin/env python3
"""
Generate differentiated content for all 200 cities:
- bestBusinessTime / bestPersonalTime (by countryCode)
- faqs (3+ per city, custom by region)
- relatedCities (5+ per city, prefer same country + high searchVolume)
"""
import json
from datetime import datetime

# Business hours by country code
BUSINESS_HOURS = {
    'CN': '当地时间周一至周五 9:00-12:00 和 14:00-18:00',
    'JP': '当地时间周一至周五 9:00-12:00 和 13:00-18:00',
    'KR': '当地时间周一至周五 9:00-12:00 和 13:00-18:00',
    'US': '当地时间周一至周五 9:00-12:00 和 14:00-17:00',
    'GB': '当地时间周一至周五 9:00-12:30 和 13:30-17:30',
    'DE': '当地时间周一至周五 8:00-12:00 和 13:00-16:00',
    'FR': '当地时间周一至周五 9:00-12:00 和 14:00-18:00',
    'AU': '当地时间周一至周五 9:00-12:00 和 13:00-17:00',
    'IN': '当地时间周一至周五 9:30-13:00 和 14:00-18:00',
    'BR': '当地时间周一至周五 9:00-12:00 和 13:00-18:00',
    'RU': '当地时间周一至周五 9:00-13:00 和 14:00-18:00',
    'CA': '当地时间周一至周五 9:00-12:00 和 13:00-17:00',
    'IT': '当地时间周一至周五 9:00-12:30 和 14:30-18:00',
    'ES': '当地时间周一至周五 9:00-13:00 和 16:00-19:00',
    'MX': '当地时间周一至周五 9:00-14:00 和 16:00-19:00',
    'SG': '当地时间周一至周五 9:00-12:00 和 13:00-18:00',
    'HK': '当地时间周一至周五 9:00-12:30 和 13:30-18:00',
    'TW': '当地时间周一至周五 9:00-12:00 和 13:30-18:00',
    'TH': '当地时间周一至周五 8:30-12:00 和 13:00-17:00',
    'AE': '当地时间周日至周四 8:00-12:30 和 14:00-18:00',
    'SA': '当地时间周日至周四 8:00-12:00 和 13:00-17:00',
    'ZA': '当地时间周一至周五 8:00-12:00 和 13:00-17:00',
    'EG': '当地时间周日至周四 9:00-14:00 和 16:00-19:00',
    'NG': '当地时间周一至周五 8:00-12:00 和 13:00-17:00',
    'ID': '当地时间周一至周五 8:00-12:00 和 13:00-17:00',
    'MY': '当地时间周一至周五 9:00-12:00 和 13:00-17:00',
    'PH': '当地时间周一至周五 8:00-12:00 和 13:00-17:00',
    'VN': '当地时间周一至周五 8:00-12:00 和 13:00-17:30',
    'PK': '当地时间周一至周五 9:00-13:00 和 14:00-18:00',
    'BD': '当地时间周日至周四 9:00-13:00 和 14:00-18:00',
    'TR': '当地时间周一至周五 9:00-12:00 和 13:00-18:00',
    'PL': '当地时间周一至周五 8:00-16:00',
    'NL': '当地时间周一至周五 8:30-12:00 和 13:00-17:00',
    'SE': '当地时间周一至周五 8:00-12:00 和 13:00-17:00',
    'CH': '当地时间周一至周五 8:00-12:00 和 14:00-17:30',
    'AT': '当地时间周一至周五 8:00-12:00 和 13:00-17:00',
    'BE': '当地时间周一至周五 8:30-12:00 和 13:00-17:00',
    'DK': '当地时间周一至周五 8:00-12:00 和 13:00-16:00',
    'NO': '当地时间周一至周五 8:00-15:30',
    'FI': '当地时间周一至周五 8:00-16:00',
    'IE': '当地时间周一至周五 9:00-12:30 和 13:30-17:30',
    'PT': '当地时间周一至周五 9:00-12:30 和 14:00-18:00',
    'GR': '当地时间周一至周五 9:00-14:00 和 17:00-20:00',
    'CZ': '当地时间周一至周五 8:00-12:00 和 13:00-17:00',
    'AR': '当地时间周一至周五 9:00-13:00 和 14:00-19:00',
    'CL': '当地时间周一至周五 9:00-13:00 和 15:00-19:00',
    'CO': '当地时间周一至周五 8:00-12:00 和 14:00-18:00',
    'PE': '当地时间周一至周五 9:00-13:00 和 15:00-18:00',
    'NZ': '当地时间周一至周五 8:30-12:30 和 13:30-17:00',
    'IL': '当地时间周日至周四 8:00-13:00 和 16:00-19:00',
}

PERSONAL_HOURS = {
    'CN': '当地时间周末 10:00-22:00 或工作日 19:00-21:00',
    'JP': '当地时间周末 10:00-20:00 或工作日 19:00-21:00',
    'KR': '当地时间周末 10:00-20:00 或工作日 19:00-21:00',
    'US': '当地时间周末 10:00-18:00 或工作日 19:00-21:00',
    'GB': '当地时间周末 11:00-19:00 或工作日 18:00-20:00',
    'DE': '当地时间周末 10:00-18:00 或工作日 17:00-19:00',
    'FR': '当地时间周末 10:00-19:00 或工作日 19:00-21:00',
    'AU': '当地时间周末 10:00-18:00 或工作日 18:00-21:00',
    'IN': '当地时间周末 10:00-21:00 或工作日 19:00-22:00',
    'BR': '当地时间周末 10:00-22:00 或工作日 19:00-22:00',
    'RU': '当地时间周末 10:00-22:00 或工作日 19:00-22:00',
    'CA': '当地时间周末 10:00-18:00 或工作日 19:00-21:00',
    'IT': '当地时间周末 10:00-20:00 或工作日 18:00-21:00',
    'ES': '当地时间周末 10:00-21:00 或工作日 20:00-22:00',
    'MX': '当地时间周末 10:00-21:00 或工作日 20:00-22:00',
    'SG': '当地时间周末 10:00-22:00 或工作日 19:00-21:00',
    'HK': '当地时间周末 10:00-22:00 或工作日 19:00-21:00',
    'TW': '当地时间周末 10:00-22:00 或工作日 19:00-21:00',
    'TH': '当地时间周末 10:00-22:00 或工作日 19:00-22:00',
    'AE': '当地时间周五 10:00-22:00 或工作日 19:00-22:00',
    'SA': '当地时间周五 10:00-22:00 或工作日 19:00-22:00',
}

DEFAULT_BUSINESS = '当地时间周一至周五 9:00-12:00 和 13:00-18:00'
DEFAULT_PERSONAL = '当地时间周末 10:00-20:00 或工作日 18:00-21:00'

# Timezone offset display mapping for major reference cities
def get_utc_offset_str(offset):
    if offset == 0:
        return 'UTC+0'
    sign = '+' if offset > 0 else ''
    if offset == int(offset):
        return f'UTC{sign}{int(offset)}'
    else:
        whole = int(offset)
        frac = abs(offset - whole)
        mins = int(frac * 60)
        return f'UTC{sign}{whole}:{mins:02d}'

def generate_faqs(city, all_cities):
    """Generate 3-5 FAQs per city, with region-specific customization."""
    name = city['name']
    name_en = city.get('nameEn', name)
    tz = city['timezone']
    offset = city['utcOffset']
    offset_str = get_utc_offset_str(offset)
    country = city['country']
    cc = city['countryCode']
    dst = city.get('dst', False)

    faqs = []

    # FAQ 1: Day or night?
    faqs.append({
        'question': f'{name}现在是白天还是晚上？',
        'answer': f'您可以在页面顶部看到{name}的实时时间和状态标签，绿色表示工作时间，蓝色表示休息时间。{name}位于{offset_str}时区。'
    })

    # FAQ 2: Time difference with Beijing
    beijing_offset = 8
    diff = beijing_offset - offset
    if diff == 0:
        diff_text = '没有时差，时间相同'
    elif diff > 0:
        diff_text = f'北京比{name}快{int(diff)}小时' if diff == int(diff) else f'北京比{name}快{diff}小时'
    else:
        diff_text = f'{name}比北京快{int(-diff)}小时' if -diff == int(-diff) else f'{name}比北京快{-diff}小时'
    faqs.append({
        'question': f'{name}和北京的时差是多少？',
        'answer': f'{name}（{offset_str}）与北京（UTC+8）的时差为{abs(diff)}小时。{diff_text}。'
    })

    # FAQ 3: DST
    if dst:
        faqs.append({
            'question': f'{name}实行夏令时吗？',
            'answer': f'是的，{name}实行夏令时，通常从{city.get("dstStart", "3月")}开始，到{city.get("dstEnd", "10月")}结束。夏令时期间时钟拨快1小时。'
        })
    else:
        faqs.append({
            'question': f'{name}实行夏令时吗？',
            'answer': f'不，{name}不实行夏令时，全年时间不变。{name}全年使用{city.get("timezoneName", offset_str)}。'
        })

    # FAQ 4: Region-specific
    region_faqs = {
        'US': {
            'q': f'美国东部和西部时差是多少？',
            'a': '美国东部时间（ET）比西部时间（PT）快3小时。例如纽约中午12:00时，洛杉矶是上午9:00。'
        },
        'AU': {
            'q': f'澳大利亚有几个时区？',
            'a': '澳大利亚有3个主要时区：东部标准时间（AEST, UTC+10）、中部标准时间（ACST, UTC+9:30）和西部标准时间（AWST, UTC+8）。部分地区还实行夏令时。'
        },
        'RU': {
            'q': f'俄罗斯有几个时区？',
            'a': '俄罗斯横跨11个时区，从加里宁格勒的UTC+2到堪察加的UTC+12。莫斯科使用UTC+3。'
        },
        'CN': {
            'q': f'中国全境使用一个时区吗？',
            'a': '是的，虽然中国地理上跨越5个时区，但全国统一使用北京时间（UTC+8，中国标准时间CST）。'
        },
        'JP': {
            'q': f'日本有夏令时吗？',
            'a': '日本目前不实行夏令时。日本在1948-1951年间曾短暂实行过夏令时，但之后取消了。'
        },
        'KR': {
            'q': f'韩国和日本时间一样吗？',
            'a': '是的，韩国和日本使用相同的时区（UTC+9），两国时间相同。'
        },
        'IN': {
            'q': f'印度时区为什么是UTC+5:30？',
            'a': '印度使用UTC+5:30（印度标准时间IST），这是印度中央经线82.5°E的决定。印度不实行夏令时。'
        },
        'BR': {
            'q': f'巴西有几个时区？',
            'a': '巴西有4个时区：UTC-2（费尔南多·迪诺罗尼亚）、UTC-3（巴西利亚时间，含主要城市）、UTC-4（西部）和UTC-5（阿克里州）。'
        },
        'GB': {
            'q': f'英国夏令时什么时候开始？',
            'a': '英国夏令时（BST）从3月最后一个周日开始，10月最后一个周日结束。夏令时期间时钟拨快1小时，从GMT变为BST（UTC+1）。'
        },
        'DE': {
            'q': f'德国使用什么时间？',
            'a': '德国使用中欧时间（CET, UTC+1），夏令时期间使用中欧夏令时（CEST, UTC+2）。夏令时从3月最后一个周日到10月最后一个周日。'
        },
        'ID': {
            'q': f'印度尼西亚有几个时区？',
            'a': '印度尼西亚有3个时区：西部（WIB, UTC+7，含雅加达）、中部（WITA, UTC+8，含巴厘岛）和东部（WIT, UTC+9，含查亚普拉）。'
        },
        'NZ': {
            'q': f'新西兰夏令时什么时候开始？',
            'a': '新西兰夏令时从9月最后一个周日开始，4月第一个周日结束。夏令时期间从NZST（UTC+12）变为NZDT（UTC+13）。'
        },
        'AE': {
            'q': f'阿联酋的工作日是哪几天？',
            'a': '阿联酋的工作日是周一至周五，部分政府机构周日也上班。周末是周六和周日。阿联酋使用海湾标准时间（GST, UTC+4），不实行夏令时。'
        },
    }

    if cc in region_faqs:
        rfq = region_faqs[cc]
        faqs.append({'question': rfq['q'], 'answer': rfq['a']})

    # FAQ 5: Best time to call (general)
    faqs.append({
        'question': f'什么时候联系{name}最方便？',
        'answer': f'商务联系建议在{name}当地工作时间的上午时段进行，个人联系建议在周末或工作日晚间。请参考上方的最佳联系时间推荐。'
    })

    return faqs

def generate_related_cities(city, all_cities):
    """Generate 5-8 related cities, preferring same country and nearby timezones."""
    cc = city['countryCode']
    offset = city['utcOffset']
    slug = city['slug']

    # Priority 1: same country, different city, sorted by searchVolume
    same_country = [c for c in all_cities if c['countryCode'] == cc and c['slug'] != slug]
    same_country.sort(key=lambda x: x.get('searchVolume', 0), reverse=True)

    # Priority 2: nearby timezone (offset diff <= 2)
    nearby_tz = [c for c in all_cities if c['slug'] != slug and c['countryCode'] != cc and abs(c['utcOffset'] - offset) <= 2]
    nearby_tz.sort(key=lambda x: (abs(x['utcOffset'] - offset), -x.get('searchVolume', 0)))

    # Priority 3: major global cities
    major_refs = ['beijing', 'new-york', 'london', 'tokyo', 'sydney']
    global_cities = [c for c in all_cities if c['slug'] in major_refs and c['slug'] != slug]

    result = []
    seen_slugs = set()

    # Add 3 same-country cities
    for c in same_country[:3]:
        if c['slug'] not in seen_slugs:
            result.append({'slug': c['slug'], 'name': c['name'], 'timezone': c['timezone']})
            seen_slugs.add(c['slug'])

    # Add 2 nearby timezone cities
    for c in nearby_tz[:2]:
        if c['slug'] not in seen_slugs:
            result.append({'slug': c['slug'], 'name': c['name'], 'timezone': c['timezone']})
            seen_slugs.add(c['slug'])

    # Add remaining from same country or nearby
    for c in same_country[3:]:
        if len(result) >= 7:
            break
        if c['slug'] not in seen_slugs:
            result.append({'slug': c['slug'], 'name': c['name'], 'timezone': c['timezone']})
            seen_slugs.add(c['slug'])

    # Fill up to 7 with global cities
    for c in global_cities:
        if len(result) >= 7:
            break
        if c['slug'] not in seen_slugs:
            result.append({'slug': c['slug'], 'name': c['name'], 'timezone': c['timezone']})
            seen_slugs.add(c['slug'])

    # Ensure at least 5
    for c in nearby_tz[2:]:
        if len(result) >= 5:
            break
        if c['slug'] not in seen_slugs:
            result.append({'slug': c['slug'], 'name': c['name'], 'timezone': c['timezone']})
            seen_slugs.add(c['slug'])

    return result[:8]


def main():
    with open('data/top-200-cities.json', 'r', encoding='utf-8') as f:
        cities = json.load(f)

    print(f'Processing {len(cities)} cities...')

    for city in cities:
        # bestBusinessTime
        city['bestBusinessTime'] = BUSINESS_HOURS.get(city['countryCode'], DEFAULT_BUSINESS)
        # bestPersonalTime
        city['bestPersonalTime'] = PERSONAL_HOURS.get(city['countryCode'], DEFAULT_PERSONAL)
        # faqs
        city['faqs'] = generate_faqs(city, cities)
        # relatedCities
        city['relatedCities'] = generate_related_cities(city, cities)

    # Validate
    issues = []
    for i, city in enumerate(cities):
        if not city.get('bestBusinessTime'):
            issues.append(f'{city["slug"]}: missing bestBusinessTime')
        if not city.get('bestPersonalTime'):
            issues.append(f'{city["slug"]}: missing bestPersonalTime')
        if len(city.get('faqs', [])) < 3:
            issues.append(f'{city["slug"]}: only {len(city.get("faqs", []))} faqs')
        if len(city.get('relatedCities', [])) < 5:
            issues.append(f'{city["slug"]}: only {len(city.get("relatedCities", []))} relatedCities')

    if issues:
        print(f'WARNING: {len(issues)} issues found:')
        for issue in issues[:10]:
            print(f'  - {issue}')
    else:
        print('All cities validated OK!')

    with open('data/top-200-cities.json', 'w', encoding='utf-8') as f:
        json.dump(cities, f, ensure_ascii=False, indent=2)

    print(f'Saved {len(cities)} cities with full content!')


if __name__ == '__main__':
    main()
