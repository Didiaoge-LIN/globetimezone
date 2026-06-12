#!/usr/bin/env python3
"""批量向 9 个语言包追加工具页 subtitle i18n key"""

import json
import os

BASE = "C:/Users/ASUS/WorkBuddy/Claw/globetimezone/locales"

NEW_KEYS = {
    "worldclock.subtitle": {
        "en": "Live time in major cities worldwide — auto-updates every second",
        "zh": "全球主要城市实时时钟 — 每秒自动更新",
        "de": "Live-Zeit in den wichtigsten Städten weltweit – automatische Aktualisierung jede Sekunde",
        "fr": "Heure en direct dans les principales villes mondiales — mise à jour automatique chaque seconde",
        "es": "Hora en vivo en las principales ciudades del mundo — actualización automática cada segundo",
        "ja": "世界の主要都市のリアルタイム時刻 — 毎秒自動更新",
        "ko": "전 세계 주요 도시의 실시간 시각 — 매초 자동 업데이트",
        "pt": "Hora ao vivo nas principais cidades do mundo — atualização automática a cada segundo",
        "ar": "الوقت الحي في كبرى المدن حول العالم — تحديث تلقائي كل ثانية",
    },
    "holidays.subtitle": {
        "en": "Check public holidays and observances worldwide",
        "zh": "查询全球各地公众假期与纪念日",
        "de": "Öffentliche Feiertage und Gedenktage weltweit nachschlagen",
        "fr": "Consultez les jours fériés et commémorations dans le monde entier",
        "es": "Consulta los días festivos y efemérides en todo el mundo",
        "ja": "世界中の祝日と記念日を確認する",
        "ko": "전 세계 공휴일 및 기념일 확인",
        "pt": "Consulte feriados e datas comemorativas em todo o mundo",
        "ar": "تحقق من العطل الرسمية والمناسبات حول العالم",
    },
    "embedwidget.subtitle": {
        "en": "Add a live world clock to your website for free. Customize cities, theme, and size — then copy and paste one line of HTML.",
        "zh": "免费为你的网站添加实时世界时钟。自定义城市、主题和尺寸，只需复制粘贴一行 HTML。",
        "de": "Fügen Sie Ihrer Website kostenlos eine Live-Weltuhr hinzu. Passen Sie Städte, Thema und Größe an — dann kopieren und einfügen Sie eine Zeile HTML.",
        "fr": "Ajoutez gratuitement une horloge mondiale en direct à votre site. Personnalisez les villes, le thème et la taille — puis copiez-collez une ligne HTML.",
        "es": "Añade un reloj mundial en vivo a tu sitio web gratis. Personaliza ciudades, tema y tamaño — luego copia y pega una línea de HTML.",
        "ja": "ライブ世界時計を無料でウェブサイトに追加できます。都市、テーマ、サイズをカスタマイズして、1行のHTMLをコピー＆ペーストするだけ。",
        "ko": "무료로 라이브 세계 시계를 웹사이트에 추가하세요. 도시, 테마, 크기를 맞춤 설정하고 HTML 한 줄을 복사하여 붙여넣으세요.",
        "pt": "Adicione gratuitamente um relógio mundial ao vivo ao seu site. Personalize cidades, tema e tamanho — depois copie e cole uma linha de HTML.",
        "ar": "أضف ساعة عالمية مباشرة إلى موقعك مجاناً. خصص المدن والمظهر والحجم — ثم انسخ والصق سطراً واحداً من HTML.",
    },
    "worldmap.subtitle": {
        "en": "Click on regions to see real-time clocks and compare times worldwide",
        "zh": "点击各地区查看实时时钟，对比全球时间",
        "de": "Klicken Sie auf Regionen, um Echtzeituhren anzuzeigen und Zeiten weltweit zu vergleichen",
        "fr": "Cliquez sur les régions pour voir les horloges en temps réel et comparer les heures dans le monde",
        "es": "Haz clic en las regiones para ver relojes en tiempo real y comparar horarios en todo el mundo",
        "ja": "地域をクリックしてリアルタイム時計を表示し、世界の時刻を比較できます",
        "ko": "지역을 클릭하여 실시간 시계를 보고 전 세계 시간을 비교하세요",
        "pt": "Clique nas regiões para ver relógios em tempo real e comparar horários em todo o mundo",
        "ar": "انقر على المناطق لرؤية الساعات في الوقت الفعلي ومقارنة الأوقات حول العالم",
    },
    "countdown.subtitle": {
        "en": "Count down to any event and see it in multiple time zones simultaneously",
        "zh": "为任意事件倒计时，同时查看多个时区的剩余时间",
        "de": "Zählen Sie bis zu jedem Ereignis herunter und sehen Sie es gleichzeitig in mehreren Zeitzonen",
        "fr": "Compte à rebours jusqu'à n'importe quel événement et visualisez-le simultanément dans plusieurs fuseaux horaires",
        "es": "Cuenta regresiva para cualquier evento y visualízalo simultáneamente en múltiples zonas horarias",
        "ja": "任意のイベントへのカウントダウンを複数のタイムゾーンで同時に確認できます",
        "ko": "모든 이벤트까지 카운트다운하고 여러 시간대에서 동시에 확인하세요",
        "pt": "Faça contagem regressiva para qualquer evento e veja simultaneamente em vários fusos horários",
        "ar": "احسب العد التنازلي لأي حدث وشاهده في مناطق زمنية متعددة في آن واحد",
    },
}

LANGS = ["en", "zh", "de", "fr", "es", "ja", "ko", "pt", "ar"]

for lang in LANGS:
    path = os.path.join(BASE, f"{lang}.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    
    added = []
    for key, translations in NEW_KEYS.items():
        if key not in data:
            data[key] = translations[lang]
            added.append(key)
        else:
            print(f"[SKIP] {lang}.json already has key: {key}")
    
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] {lang}.json: added {len(added)} keys")

print("\n完成！")
