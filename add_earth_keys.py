#!/usr/bin/env python3
"""添加 earth-visual 相关的翻译键"""
import json
import os

LOCALES_DIR = r'C:\Users\ASUS\WorkBuddy\Claw\globetimezone\locales'

EARTH_TRANSLATIONS = {
    'en': {
        'earth.terminator': 'Live Day/Night',
    },
    'zh': {
        'earth.terminator': '实时昼夜分界',
    },
    'de': {
        'earth.terminator': 'Tag/Nacht live',
    },
    'fr': {
        'earth.terminator': 'Jour/Nuit en direct',
    },
    'es': {
        'earth.terminator': 'Día/Noche en vivo',
    },
    'ja': {
        'earth.terminator': 'リアルタイム昼夜',
    },
    'ko': {
        'earth.terminator': '실시간 낮/밤',
    },
    'pt': {
        'earth.terminator': 'Dia/Noite ao vivo',
    },
    'ar': {
        'earth.terminator': 'ليل/نهار مباشر',
    },
}

for lang, new_keys in EARTH_TRANSLATIONS.items():
    path = os.path.join(LOCALES_DIR, f'{lang}.json')
    if not os.path.exists(path):
        print(f'[SKIP] {path}')
        continue
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    added = []
    for k, v in new_keys.items():
        if k not in data:
            data[k] = v
            added.append(k)
    if added:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'[OK] {lang}: {added}')
    else:
        print(f'[NO-CHANGE] {lang}')
print('Done.')
