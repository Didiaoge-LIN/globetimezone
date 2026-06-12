#!/usr/bin/env python3
"""在9种 locale JSON 里添加 timedifference.popular.* 和 timedifference.footer.popular 键"""
import json
import os

LOCALES_DIR = r'C:\Users\ASUS\WorkBuddy\Claw\globetimezone\locales'

# 各语言的翻译值
TRANSLATIONS = {
    'en': {
        'timedifference.footer.popular': 'Popular Time Differences',
        'timedifference.popular.nyLondon': 'New York – London',
        'timedifference.popular.tokyoNy': 'Tokyo – New York',
        'timedifference.popular.laBeijing': 'Los Angeles – Beijing',
    },
    'zh': {
        'timedifference.footer.popular': '热门时差',
        'timedifference.popular.nyLondon': '纽约 – 伦敦',
        'timedifference.popular.tokyoNy': '东京 – 纽约',
        'timedifference.popular.laBeijing': '洛杉矶 – 北京',
    },
    'de': {
        'timedifference.footer.popular': 'Beliebte Zeitunterschiede',
        'timedifference.popular.nyLondon': 'New York – London',
        'timedifference.popular.tokyoNy': 'Tokio – New York',
        'timedifference.popular.laBeijing': 'Los Angeles – Peking',
    },
    'fr': {
        'timedifference.footer.popular': 'Décalages horaires populaires',
        'timedifference.popular.nyLondon': 'New York – Londres',
        'timedifference.popular.tokyoNy': 'Tokyo – New York',
        'timedifference.popular.laBeijing': 'Los Angeles – Pékin',
    },
    'es': {
        'timedifference.footer.popular': 'Diferencias horarias populares',
        'timedifference.popular.nyLondon': 'Nueva York – Londres',
        'timedifference.popular.tokyoNy': 'Tokio – Nueva York',
        'timedifference.popular.laBeijing': 'Los Ángeles – Pekín',
    },
    'ja': {
        'timedifference.footer.popular': '人気の時差',
        'timedifference.popular.nyLondon': 'ニューヨーク – ロンドン',
        'timedifference.popular.tokyoNy': '東京 – ニューヨーク',
        'timedifference.popular.laBeijing': 'ロサンゼルス – 北京',
    },
    'ko': {
        'timedifference.footer.popular': '인기 시차',
        'timedifference.popular.nyLondon': '뉴욕 – 런던',
        'timedifference.popular.tokyoNy': '도쿄 – 뉴욕',
        'timedifference.popular.laBeijing': '로스앤젤레스 – 베이징',
    },
    'pt': {
        'timedifference.footer.popular': 'Diferenças horárias populares',
        'timedifference.popular.nyLondon': 'Nova York – Londres',
        'timedifference.popular.tokyoNy': 'Tóquio – Nova York',
        'timedifference.popular.laBeijing': 'Los Angeles – Pequim',
    },
    'ar': {
        'timedifference.footer.popular': 'فوارق توقيت شائعة',
        'timedifference.popular.nyLondon': 'نيويورك – لندن',
        'timedifference.popular.tokyoNy': 'طوكيو – نيويورك',
        'timedifference.popular.laBeijing': 'لوس أنجلوس – بكين',
    },
}

for lang, new_keys in TRANSLATIONS.items():
    path = os.path.join(LOCALES_DIR, f'{lang}.json')
    if not os.path.exists(path):
        print(f'[SKIP] {path} not found')
        continue
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    added = []
    for k, v in new_keys.items():
        if k not in data:
            data[k] = v
            added.append(k)
        else:
            print(f'[EXISTS] {lang}: {k} = {data[k]}')
    
    if added:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'[OK] {lang}: added {added}')
    else:
        print(f'[NO-CHANGE] {lang}: all keys already exist')

print('Done.')
