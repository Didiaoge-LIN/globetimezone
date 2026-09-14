#!/usr/bin/env python3
"""
GlobeTimeZone Part4 - Final fallbacks cleanup
Only translate keys that genuinely need it; skip brand/proper nouns.
"""
import json
import os

LOCALES_DIR = os.path.join(os.path.dirname(__file__), '..', 'locales')

PART4 = {
    # ---- Actually needs translation ----
    "timedifference.am": {
        "de": "AM", "fr": "AM", "es": "AM",
        "ja": "午前", "ko": "오전", "pt": "AM", "ar": "ص"
    },
    "timedifference.pm": {
        "de": "PM", "fr": "PM", "es": "PM",
        "ja": "午後", "ko": "오후", "pt": "PM", "ar": "م"
    },
    "crossborder.faq.title": {
        "de": "❓ FAQ", "fr": "❓ FAQ", "es": "❓ Preguntas frecuentes",
        "ja": "❓ よくある質問", "ko": "❓ 자주 묻는 질문", "pt": "❓ FAQ", "ar": "❓ الأسئلة الشائعة"
    },
    "pricing.faq.title": {
        "de": "❓ FAQ", "fr": "❓ FAQ", "es": "❓ Preguntas frecuentes",
        "ja": "❓ よくある質問", "ko": "❓ 자주 묻는 질문", "pt": "❓ FAQ", "ar": "❓ الأسئلة الشائعة"
    },
    "blog.cat.api": {
        "de": "🔴 API", "fr": "🔴 API", "es": "🔴 API",
        "ja": "🔴 API", "ko": "🔴 API", "pt": "🔴 API", "ar": "🔴 واجهة البرمجة"
    },
    "pricing.cmp.10.free": {
        "de": "Community", "fr": "Communauté", "es": "Comunidad",
        "ja": "コミュニティ", "ko": "커뮤니티", "pt": "Comunidade", "ar": "المجتمع"
    },
    "xb.result.transit": {
        "de": "Transit ", "fr": "Transit ", "es": "Tránsito ",
        "ja": "輸送中 ", "ko": "운송 중 ", "pt": "Trânsito ", "ar": "عبور "
    },
    "hk.countdown.in_days": {
        "de": " in ", "fr": " dans ", "es": " en ",
        "ja": "あと", "ko": " ", "pt": " em ", "ar": " في "
    },
    "hk.countdown.days": {
        "de": " Tage", "fr": " jours", "es": " días",
        "ja": "日", "ko": "일", "pt": " dias", "ar": " يوم"
    },
    # ---- Keep as-is (brand/proper nouns) ----
    # api.h1, pro.h1, pricing.hero.badge, pricing.plan.pro, pricing.cmp.col_pro
    # xb.carrier.fedex, xb.carrier.fba.name
    # xb.origin.* (city names), xb.cty.JP
    # xb.hs.phone, xb.type.express
    # hk.share.to, hk.share.yuan (arrow and newline, universal)
}

def apply_part4():
    with open(os.path.join(LOCALES_DIR, 'en.json'), 'r', encoding='utf-8') as f:
        en = json.load(f)

    langs = ['de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar']
    stats = {}

    for lang in langs:
        path = os.path.join(LOCALES_DIR, f'{lang}.json')
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        updated = 0
        skipped = 0

        for key, translations in PART4.items():
            if key not in data:
                skipped += 1
                continue
            if lang not in translations:
                skipped += 1
                continue
            if data[key] == en.get(key, ''):
                data[key] = translations[lang]
                updated += 1
            else:
                skipped += 1

        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')

        stats[lang] = updated
        print(f'✅ {lang}.json: {updated} keys translated, {skipped} skipped')

    print('\n=== Part4 Summary ===')
    for lang, count in stats.items():
        print(f'  {lang}: {count} keys updated')
    print('Done!')

if __name__ == '__main__':
    apply_part4()
