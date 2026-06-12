#!/usr/bin/env python3
"""批量给时区转换页面的 subtitle <p> 加 data-i18n 属性，并更新语言包"""

import json
import os
import re

BASE = "C:/Users/ASUS/WorkBuddy/Claw/globetimezone"
LOCALES_BASE = os.path.join(BASE, "locales")

# 要处理的页面及其 i18n key 和翻译
PAGES = {
    "ast-to-pst.html": {
        "key": "asttopst.subtitle",
        "old": "Convert Atlantic Standard Time to Pacific Time. The difference is always 4 hours.",
        "translations": {
            "en": "Convert Atlantic Standard Time to Pacific Time. The difference is always 4 hours.",
            "zh": "将大西洋标准时间转换为太平洋时间。时差始终为 4 小时。",
            "de": "Atlantic Standard Time in Pacific Time umrechnen. Der Unterschied beträgt immer 4 Stunden.",
            "fr": "Convertir l'heure standard atlantique en heure du Pacifique. La différence est toujours de 4 heures.",
            "es": "Convertir la Hora Estándar del Atlántico a la Hora del Pacífico. La diferencia es siempre de 4 horas.",
            "ja": "大西洋標準時を太平洋時間に変換します。時差は常に4時間です。",
            "ko": "대서양 표준시를 태평양 표준시로 변환합니다. 시차는 항상 4시간입니다.",
            "pt": "Converter Hora Padrão do Atlântico para Hora do Pacífico. A diferença é sempre de 4 horas.",
            "ar": "تحويل التوقيت القياسي الأطلسي إلى توقيت المحيط الهادئ. الفارق دائماً 4 ساعات.",
        },
    },
    "cet-to-est.html": {
        "key": "cettoest.subtitle",
        "old": "Convert Central European Time to US Eastern Time. The difference is 5-6 hours depending on DST.",
        "translations": {
            "en": "Convert Central European Time to US Eastern Time. The difference is 5-6 hours depending on DST.",
            "zh": "将中欧时间转换为美国东部时间。时差为 5-6 小时，具体取决于夏令时。",
            "de": "Mitteleuropäische Zeit in US-amerikanische Eastern Time umrechnen. Der Unterschied beträgt 5-6 Stunden je nach Sommerzeit.",
            "fr": "Convertir l'heure d'Europe centrale en heure de l'Est américaine. La différence est de 5 à 6 heures selon l'heure d'été.",
            "es": "Convertir la Hora de Europa Central a la Hora del Este de EE. UU. La diferencia es de 5-6 horas según el horario de verano.",
            "ja": "中央ヨーロッパ時間を米国東部時間に変換します。時差はサマータイムによって5〜6時間です。",
            "ko": "중앙 유럽 표준시를 미국 동부 표준시로 변환합니다. 시차는 서머타임에 따라 5-6시간입니다.",
            "pt": "Converter Hora da Europa Central para Hora do Leste dos EUA. A diferença é de 5-6 horas dependendo do horário de verão.",
            "ar": "تحويل توقيت وسط أوروبا إلى توقيت الشرق الأمريكي. الفارق 5-6 ساعات حسب التوقيت الصيفي.",
        },
    },
    "est-to-cst-converter.html": {
        "key": "esttocst.subtitle",
        "old": "Convert Eastern Standard Time to Central Standard Time instantly. The time difference is always 1 hour.",
        "translations": {
            "en": "Convert Eastern Standard Time to Central Standard Time instantly. The time difference is always 1 hour.",
            "zh": "即时将美国东部标准时间转换为中部标准时间。时差始终为 1 小时。",
            "de": "Eastern Standard Time sofort in Central Standard Time umrechnen. Der Zeitunterschied beträgt immer 1 Stunde.",
            "fr": "Convertir instantanément l'heure standard de l'Est en heure standard centrale. La différence de temps est toujours de 1 heure.",
            "es": "Convertir instantáneamente la Hora Estándar del Este a la Hora Estándar Central. La diferencia horaria es siempre de 1 hora.",
            "ja": "東部標準時を中部標準時に即座に変換します。時差は常に1時間です。",
            "ko": "동부 표준시를 중부 표준시로 즉시 변환합니다. 시차는 항상 1시간입니다.",
            "pt": "Converter Hora Padrão do Leste para Hora Padrão Central instantaneamente. A diferença de tempo é sempre de 1 hora.",
            "ar": "تحويل التوقيت القياسي للشرق إلى التوقيت القياسي المركزي فوراً. الفارق الزمني دائماً ساعة واحدة.",
        },
    },
    "est-to-pst-converter.html": {
        "key": "esttopst.subtitle",
        "old": "Convert Eastern Standard Time to Pacific Standard Time instantly. EST is always 3 hours ahead of PST.",
        "translations": {
            "en": "Convert Eastern Standard Time to Pacific Standard Time instantly. EST is always 3 hours ahead of PST.",
            "zh": "即时将美国东部标准时间转换为太平洋标准时间。EST 比 PST 始终早 3 小时。",
            "de": "Eastern Standard Time sofort in Pacific Standard Time umrechnen. EST ist PST immer 3 Stunden voraus.",
            "fr": "Convertir instantanément l'heure standard de l'Est en heure standard du Pacifique. EST est toujours 3 heures en avance sur PST.",
            "es": "Convertir instantáneamente EST a PST. EST siempre va 3 horas por delante de PST.",
            "ja": "東部標準時を太平洋標準時に即座に変換します。ESTは常にPSTより3時間進んでいます。",
            "ko": "동부 표준시를 태평양 표준시로 즉시 변환합니다. EST는 항상 PST보다 3시간 앞서 있습니다.",
            "pt": "Converter EST para PST instantaneamente. EST está sempre 3 horas à frente do PST.",
            "ar": "تحويل EST إلى PST فوراً. EST دائماً متقدم 3 ساعات عن PST.",
        },
    },
    "europe-australia-time-difference.html": {
        "key": "europeaustralia.subtitle",
        "old": "Compare European and Australian time zones. The difference varies from 7-10 hours depending on seasons.",
        "translations": {
            "en": "Compare European and Australian time zones. The difference varies from 7-10 hours depending on seasons.",
            "zh": "对比欧洲与澳大利亚时区。时差因季节不同，在 7-10 小时之间变化。",
            "de": "Europäische und australische Zeitzonen vergleichen. Der Unterschied variiert je nach Jahreszeit von 7 bis 10 Stunden.",
            "fr": "Comparer les fuseaux horaires européens et australiens. La différence varie de 7 à 10 heures selon les saisons.",
            "es": "Comparar zonas horarias europeas y australianas. La diferencia varía de 7 a 10 horas según las estaciones.",
            "ja": "ヨーロッパとオーストラリアのタイムゾーンを比較します。時差は季節によって7〜10時間変わります。",
            "ko": "유럽과 호주 시간대를 비교합니다. 시차는 계절에 따라 7-10시간 사이에서 변합니다.",
            "pt": "Comparar fusos horários europeus e australianos. A diferença varia de 7 a 10 horas dependendo das estações.",
            "ar": "مقارنة المناطق الزمنية الأوروبية والأسترالية. يتفاوت الفارق بين 7-10 ساعات حسب الموسم.",
        },
    },
    "gmt-to-cst-converter.html": {
        "key": "gmttocst.subtitle",
        "old": "Convert Greenwich Mean Time (London) to China Standard Time (Beijing) instantly. China is always 8 hours ahead of GMT.",
        "translations": {
            "en": "Convert Greenwich Mean Time (London) to China Standard Time (Beijing) instantly. China is always 8 hours ahead of GMT.",
            "zh": "即时将格林威治标准时间（伦敦）转换为中国标准时间（北京）。中国始终比 GMT 早 8 小时。",
            "de": "Greenwich Mean Time (London) sofort in China Standard Time (Peking) umrechnen. China ist GMT immer 8 Stunden voraus.",
            "fr": "Convertir instantanément l'heure de Greenwich (Londres) en heure standard de Chine (Pékin). La Chine est toujours 8 heures en avance sur GMT.",
            "es": "Convertir instantáneamente GMT (Londres) a CST (Pekín). China siempre va 8 horas por delante de GMT.",
            "ja": "グリニッジ標準時（ロンドン）を中国標準時（北京）に即座に変換します。中国は常にGMTより8時間進んでいます。",
            "ko": "그리니치 표준시(런던)를 중국 표준시(베이징)로 즉시 변환합니다. 중국은 항상 GMT보다 8시간 앞서 있습니다.",
            "pt": "Converter GMT (Londres) para CST (Pequim) instantaneamente. A China está sempre 8 horas à frente do GMT.",
            "ar": "تحويل توقيت غرينتش (لندن) إلى التوقيت القياسي الصيني (بكين) فوراً. الصين دائماً متقدمة 8 ساعات عن GMT.",
        },
    },
    "hawaii-to-est.html": {
        "key": "hawaiitoest.subtitle",
        "old": "Convert Hawaii-Aleutian Time to Eastern Standard Time. The difference is 5-6 hours depending on DST.",
        "translations": {
            "en": "Convert Hawaii-Aleutian Time to Eastern Standard Time. The difference is 5-6 hours depending on DST.",
            "zh": "将夏威夷-阿留申时间转换为美国东部标准时间。时差为 5-6 小时，具体取决于夏令时。",
            "de": "Hawaii-Aleutische Zeit in Eastern Standard Time umrechnen. Der Unterschied beträgt 5-6 Stunden je nach Sommerzeit.",
            "fr": "Convertir l'heure Hawaii-Aléoutiennes en heure standard de l'Est. La différence est de 5 à 6 heures selon l'heure d'été.",
            "es": "Convertir la Hora de Hawái-Aleutianas a EST. La diferencia es de 5-6 horas según el horario de verano.",
            "ja": "ハワイ・アリューシャン時間を東部標準時に変換します。時差はサマータイムによって5〜6時間です。",
            "ko": "하와이-알류샨 시간을 동부 표준시로 변환합니다. 시차는 서머타임에 따라 5-6시간입니다.",
            "pt": "Converter Hora do Havaí-Aleutas para EST. A diferença é de 5-6 horas dependendo do horário de verão.",
            "ar": "تحويل توقيت هاواي-الجزر الأليوتية إلى التوقيت القياسي للشرق. الفارق 5-6 ساعات حسب التوقيت الصيفي.",
        },
    },
    "ist-to-est-converter.html": {
        "key": "isttoest.subtitle",
        "old": 'Convert between India Standard Time (IST, UTC+5:30) and US Eastern Time (EST/EDT). IST is <strong>10.5 hours ahead</strong> of EST (9.5 hours during EDT).',
        "old_plain": 'Convert between India Standard Time (IST, UTC+5:30) and US Eastern Time (EST/EDT).',
        "translations": {
            "en": "Convert between India Standard Time (IST, UTC+5:30) and US Eastern Time (EST/EDT). IST is 10.5 hours ahead of EST (9.5 hours during EDT).",
            "zh": "印度标准时间（IST，UTC+5:30）与美国东部时间（EST/EDT）相互转换。IST 比 EST 早 10.5 小时（EDT 期间为 9.5 小时）。",
            "de": "Zwischen Indian Standard Time (IST, UTC+5:30) und US Eastern Time (EST/EDT) umrechnen. IST ist EST 10,5 Stunden voraus (9,5 Stunden während EDT).",
            "fr": "Convertir entre l'heure standard indienne (IST, UTC+5:30) et l'heure de l'Est américaine (EST/EDT). IST est 10,5 heures en avance sur EST.",
            "es": "Convertir entre la Hora Estándar de India (IST, UTC+5:30) y la Hora del Este de EE. UU. (EST/EDT). IST está 10,5 horas por delante de EST.",
            "ja": "インド標準時（IST、UTC+5:30）と米国東部時間（EST/EDT）を変換します。ISTはESTより10.5時間進んでいます（EDT期間は9.5時間）。",
            "ko": "인도 표준시(IST, UTC+5:30)와 미국 동부 표준시(EST/EDT) 간 변환. IST는 EST보다 10.5시간 앞서 있습니다(EDT 기간에는 9.5시간).",
            "pt": "Converter entre Hora Padrão da Índia (IST, UTC+5:30) e Hora do Leste dos EUA (EST/EDT). IST está 10,5 horas à frente do EST.",
            "ar": "التحويل بين التوقيت القياسي الهندي (IST، UTC+5:30) والتوقيت الشرقي الأمريكي (EST/EDT). IST متقدم 10.5 ساعة عن EST.",
        },
    },
    "jst-to-cst-converter.html": {
        "key": "jsttocst.subtitle",
        "old": "Convert Japan Standard Time (Tokyo) to China Standard Time (Beijing) instantly. Japan is always 1 hour ahead of China.",
        "translations": {
            "en": "Convert Japan Standard Time (Tokyo) to China Standard Time (Beijing) instantly. Japan is always 1 hour ahead of China.",
            "zh": "即时将日本标准时间（东京）转换为中国标准时间（北京）。日本始终比中国早 1 小时。",
            "de": "Japan Standard Time (Tokio) sofort in China Standard Time (Peking) umrechnen. Japan ist China immer 1 Stunde voraus.",
            "fr": "Convertir instantanément l'heure standard du Japon (Tokyo) en heure standard de Chine (Pékin). Le Japon est toujours 1 heure en avance sur la Chine.",
            "es": "Convertir instantáneamente JST (Tokio) a CST (Pekín). Japón siempre va 1 hora por delante de China.",
            "ja": "日本標準時（東京）を中国標準時（北京）に即座に変換します。日本は常に中国より1時間進んでいます。",
            "ko": "일본 표준시(도쿄)를 중국 표준시(베이징)로 즉시 변환합니다. 일본은 항상 중국보다 1시간 앞서 있습니다.",
            "pt": "Converter JST (Tóquio) para CST (Pequim) instantaneamente. O Japão está sempre 1 hora à frente da China.",
            "ar": "تحويل التوقيت القياسي الياباني (طوكيو) إلى التوقيت القياسي الصيني (بكين) فوراً. اليابان دائماً متقدمة ساعة واحدة عن الصين.",
        },
    },
    "pst-to-est.html": {
        "key": "psttoest.subtitle",
        "old": "Convert Pacific Standard Time to Eastern Standard Time instantly. The time difference is always 3 hours.",
        "translations": {
            "en": "Convert Pacific Standard Time to Eastern Standard Time instantly. The time difference is always 3 hours.",
            "zh": "即时将太平洋标准时间转换为美国东部标准时间。时差始终为 3 小时。",
            "de": "Pacific Standard Time sofort in Eastern Standard Time umrechnen. Der Zeitunterschied beträgt immer 3 Stunden.",
            "fr": "Convertir instantanément l'heure standard du Pacifique en heure standard de l'Est. La différence de temps est toujours de 3 heures.",
            "es": "Convertir PST a EST instantáneamente. La diferencia horaria es siempre de 3 horas.",
            "ja": "太平洋標準時を東部標準時に即座に変換します。時差は常に3時間です。",
            "ko": "태평양 표준시를 동부 표준시로 즉시 변환합니다. 시차는 항상 3시간입니다.",
            "pt": "Converter PST para EST instantaneamente. A diferença de tempo é sempre de 3 horas.",
            "ar": "تحويل PST إلى EST فوراً. الفارق الزمني دائماً 3 ساعات.",
        },
    },
    "utc-8-to-utc-5.html": {
        "key": "utc8toutc5.subtitle",
        "old": "Convert China Standard Time to US Eastern Time instantly. The difference is 12-13 hours depending on DST.",
        "translations": {
            "en": "Convert China Standard Time to US Eastern Time instantly. The difference is 12-13 hours depending on DST.",
            "zh": "即时将中国标准时间转换为美国东部时间。时差为 12-13 小时，具体取决于夏令时。",
            "de": "China Standard Time sofort in US Eastern Time umrechnen. Der Unterschied beträgt je nach Sommerzeit 12-13 Stunden.",
            "fr": "Convertir instantanément l'heure standard de Chine en heure de l'Est américaine. La différence est de 12 à 13 heures selon l'heure d'été.",
            "es": "Convertir instantáneamente CST a Hora del Este de EE. UU. La diferencia es de 12-13 horas según el horario de verano.",
            "ja": "中国標準時を米国東部時間に即座に変換します。時差はサマータイムによって12〜13時間です。",
            "ko": "중국 표준시를 미국 동부 시간으로 즉시 변환합니다. 시차는 서머타임에 따라 12-13시간입니다.",
            "pt": "Converter CST para Hora do Leste dos EUA instantaneamente. A diferença é de 12-13 horas dependendo do horário de verão.",
            "ar": "تحويل التوقيت القياسي الصيني إلى التوقيت الشرقي الأمريكي فوراً. الفارق 12-13 ساعة حسب التوقيت الصيفي.",
        },
    },
    "utc-to-cst-converter.html": {
        "key": "utctocst.subtitle",
        "old": "Convert UTC (Coordinated Universal Time) to China Standard Time (CST). CST is UTC+8, with no Daylight Saving Time.",
        "translations": {
            "en": "Convert UTC (Coordinated Universal Time) to China Standard Time (CST). CST is UTC+8, with no Daylight Saving Time.",
            "zh": "将协调世界时（UTC）转换为中国标准时间（CST）。CST 为 UTC+8，全年无夏令时。",
            "de": "UTC (Koordinierte Weltzeit) in China Standard Time (CST) umrechnen. CST ist UTC+8, ohne Sommerzeit.",
            "fr": "Convertir UTC (Temps Universel Coordonné) en Heure Standard de Chine (CST). CST est UTC+8, sans heure d'été.",
            "es": "Convertir UTC (Tiempo Universal Coordinado) a CST (Hora Estándar de China). CST es UTC+8, sin horario de verano.",
            "ja": "協定世界時（UTC）を中国標準時（CST）に変換します。CSTはUTC+8で、夏時間はありません。",
            "ko": "UTC(협정 세계시)를 중국 표준시(CST)로 변환합니다. CST는 UTC+8이며 서머타임이 없습니다.",
            "pt": "Converter UTC (Tempo Universal Coordenado) para CST (Hora Padrão da China). CST é UTC+8, sem horário de verão.",
            "ar": "تحويل UTC (التوقيت العالمي المنسق) إلى التوقيت القياسي الصيني (CST). CST هو UTC+8، بدون توقيت صيفي.",
        },
    },
    "articles.html": {
        "key": "articles.subtitle",
        "old": "Learn everything about time zones, daylight saving time, UTC, and international scheduling.",
        "translations": {
            "en": "Learn everything about time zones, daylight saving time, UTC, and international scheduling.",
            "zh": "全面了解时区、夏令时、UTC 及国际日程安排的一切知识。",
            "de": "Lernen Sie alles über Zeitzonen, Sommerzeit, UTC und internationale Terminplanung.",
            "fr": "Apprenez tout sur les fuseaux horaires, l'heure d'été, UTC et la planification internationale.",
            "es": "Aprende todo sobre zonas horarias, horario de verano, UTC y programación internacional.",
            "ja": "タイムゾーン、サマータイム、UTC、国際スケジューリングのすべてを学びましょう。",
            "ko": "시간대, 서머타임, UTC 및 국제 일정 관리에 대한 모든 것을 배우세요.",
            "pt": "Aprenda tudo sobre fusos horários, horário de verão, UTC e agendamento internacional.",
            "ar": "تعلم كل شيء عن المناطق الزمنية، والتوقيت الصيفي، وUTC، والجدولة الدولية.",
        },
    },
    "pro.html": {
        "key": "pro.subtitle",
        "old": "Unlock the full power of time zone management",
        "translations": {
            "en": "Unlock the full power of time zone management",
            "zh": "解锁时区管理的全部强大功能",
            "de": "Entfesseln Sie die volle Kraft des Zeitzonenmanagements",
            "fr": "Débloquez toute la puissance de la gestion des fuseaux horaires",
            "es": "Desbloquea todo el poder de la gestión de zonas horarias",
            "ja": "タイムゾーン管理の全機能を解放する",
            "ko": "시간대 관리의 모든 기능을 잠금 해제하세요",
            "pt": "Desbloqueie todo o poder do gerenciamento de fusos horários",
            "ar": "أطلق العنان لكامل قوة إدارة المناطق الزمنية",
        },
    },
    "time-units.html": {
        "key": "timeunits.subtitle",
        "old": "Convert between different time units instantly",
        "translations": {
            "en": "Convert between different time units instantly",
            "zh": "即时在不同时间单位之间转换",
            "de": "Sofort zwischen verschiedenen Zeiteinheiten umrechnen",
            "fr": "Convertir instantanément entre différentes unités de temps",
            "es": "Convertir instantáneamente entre diferentes unidades de tiempo",
            "ja": "異なる時間単位を即座に変換する",
            "ko": "다양한 시간 단위 간 즉시 변환",
            "pt": "Converter instantaneamente entre diferentes unidades de tempo",
            "ar": "التحويل الفوري بين وحدات الوقت المختلفة",
        },
    },
}

LANGS = ["en", "zh", "de", "fr", "es", "ja", "ko", "pt", "ar"]

# 1. 更新 HTML 文件
html_updated = 0
for fname, info in PAGES.items():
    fpath = os.path.join(BASE, fname)
    if not os.path.exists(fpath):
        print(f"[WARN] 文件不存在: {fname}")
        continue
    
    with open(fpath, encoding="utf-8") as f:
        content = f.read()
    
    old_text = info["old"]
    key = info["key"]
    
    # 检查是否已经有 data-i18n
    if f'data-i18n="{key}"' in content:
        print(f"[SKIP] {fname} already has data-i18n={key}")
        continue
    
    # 替换：给包含 old_text 的 <p ...> 加 data-i18n 属性
    # 匹配 <p ...>old_text</p> 或 <p ...>old_text（多行）
    # 简单方式：找到包含 old_text 的行，给那行的 <p 加属性
    if old_text in content:
        # 找到 old_text 所在的行
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if old_text in line and '<p' in line and 'data-i18n' not in line:
                # 在 <p 和下一个属性/> 之间插入 data-i18n
                new_line = line.replace('<p ', f'<p data-i18n="{key}" ', 1)
                lines[i] = new_line
                print(f"[OK] {fname}: patched line {i+1}")
                html_updated += 1
                break
        content = '\n'.join(lines)
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
    else:
        print(f"[WARN] {fname}: old_text not found: {old_text[:50]}")

print(f"\n已更新 {html_updated} 个 HTML 文件\n")

# 2. 更新 locale JSON 文件
for lang in LANGS:
    path = os.path.join(LOCALES_BASE, f"{lang}.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    
    added = []
    for fname, info in PAGES.items():
        key = info["key"]
        if key not in data:
            data[key] = info["translations"][lang]
            added.append(key)
    
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] {lang}.json: added {len(added)} keys")

print("\n全部完成！")
