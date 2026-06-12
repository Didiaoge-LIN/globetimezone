#!/usr/bin/env python3
"""添加 pst-to-cst 的 subtitle 翻译 key（含 HTML）"""
import json, os

BASE = "C:/Users/ASUS/WorkBuddy/Claw/globetimezone/locales"
LANGS = ["en", "zh", "de", "fr", "es", "ja", "ko", "pt", "ar"]

TRANSLATIONS = {
    "psttocst.subtitle": {
        "en": "Convert between Pacific Standard Time (PST, UTC-8) and China Standard Time (CST, UTC+8). China is <strong>16 hours ahead</strong> of PST (15 hours during PDT).",
        "zh": "太平洋标准时间（PST，UTC-8）与中国标准时间（CST，UTC+8）相互转换。中国比 PST <strong>早 16 小时</strong>（PDT 期间为 15 小时）。",
        "de": "Zwischen Pacific Standard Time (PST, UTC-8) und China Standard Time (CST, UTC+8) umrechnen. China ist PST <strong>16 Stunden voraus</strong> (15 Stunden während PDT).",
        "fr": "Convertir entre l'heure standard du Pacifique (PST, UTC-8) et l'heure standard de Chine (CST, UTC+8). La Chine est <strong>16 heures en avance</strong> sur PST.",
        "es": "Convertir entre PST (UTC-8) y CST de China (UTC+8). China está <strong>16 horas por delante</strong> de PST (15 durante PDT).",
        "ja": "太平洋標準時（PST、UTC-8）と中国標準時（CST、UTC+8）を変換します。中国はPSTより<strong>16時間進んでいます</strong>（PDT期間は15時間）。",
        "ko": "태평양 표준시(PST, UTC-8)와 중국 표준시(CST, UTC+8) 간 변환. 중국은 PST보다 <strong>16시간 앞서 있습니다</strong>(PDT 기간에는 15시간).",
        "pt": "Converter entre PST (UTC-8) e CST da China (UTC+8). A China está <strong>16 horas à frente</strong> do PST (15 horas durante PDT).",
        "ar": "التحويل بين PST (UTC-8) وCST الصيني (UTC+8). الصين متقدمة <strong>16 ساعة</strong> عن PST (15 ساعة خلال PDT).",
    }
}

for lang in LANGS:
    path = os.path.join(BASE, f"{lang}.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for key, vals in TRANSLATIONS.items():
        if key not in data:
            data[key] = vals[lang]
            print(f"[OK] {lang}.json: added {key}")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("完成！")
