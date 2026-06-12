#!/usr/bin/env python3
"""批量向 9 个语言包追加新的 i18n key"""

import json
import os

BASE = "C:/Users/ASUS/WorkBuddy/Claw/globetimezone/locales"

NEW_KEYS = {
    "meetingscheduler.subtitle": {
        "en": "Find the perfect meeting time across multiple time zones. Add team members and instantly see optimal scheduling windows.",
        "zh": "跨越多个时区找到最佳会议时间。添加团队成员，即刻查看最优会议时间段。",
        "de": "Finden Sie die perfekte Besprechungszeit über mehrere Zeitzonen hinweg. Fügen Sie Teammitglieder hinzu und sehen Sie sofort optimale Planungsfenster.",
        "fr": "Trouvez le moment idéal pour vos réunions sur plusieurs fuseaux horaires. Ajoutez des membres et visualisez instantanément les créneaux optimaux.",
        "es": "Encuentra el momento perfecto para reuniones en múltiples zonas horarias. Agrega miembros del equipo y ve al instante las ventanas de programación óptimas.",
        "ja": "複数のタイムゾーンにまたがる最適な会議時間を見つけましょう。チームメンバーを追加して、最適なスケジュールウィンドウを即座に確認できます。",
        "ko": "여러 시간대에서 완벽한 회의 시간을 찾아보세요. 팀원을 추가하면 최적의 일정 창을 즉시 확인할 수 있습니다.",
        "pt": "Encontre o momento perfeito para reuniões em vários fusos horários. Adicione membros da equipe e veja instantaneamente as janelas de agendamento ideais.",
        "ar": "اعثر على وقت الاجتماع المثالي عبر مناطق زمنية متعددة. أضف أعضاء الفريق وشاهد فوراً نوافذ الجدولة المثلى.",
    },
    "remoteteamtimezoneguide.subtitle": {
        "en": "Everything you need to coordinate global teams, schedule meetings across continents, and build culture in distributed organizations.",
        "zh": "协调全球团队、跨洲安排会议、打造分布式组织文化所需的一切指南。",
        "de": "Alles, was Sie brauchen, um globale Teams zu koordinieren, Meetings über Kontinente hinweg zu planen und Kultur in verteilten Organisationen aufzubauen.",
        "fr": "Tout ce dont vous avez besoin pour coordonner des équipes mondiales, planifier des réunions à travers les continents et construire une culture dans les organisations distribuées.",
        "es": "Todo lo que necesitas para coordinar equipos globales, programar reuniones en distintos continentes y construir cultura en organizaciones distribuidas.",
        "ja": "グローバルチームの調整、大陸をまたいだ会議のスケジューリング、分散型組織の文化構築に必要なすべてのガイド。",
        "ko": "글로벌 팀 조율, 대륙을 넘나드는 회의 일정 계획, 분산 조직의 문화 구축에 필요한 모든 것.",
        "pt": "Tudo que você precisa para coordenar equipes globais, agendar reuniões entre continentes e construir cultura em organizações distribuídas.",
        "ar": "كل ما تحتاجه لتنسيق الفرق العالمية، وجدولة الاجتماعات عبر القارات، وبناء ثقافة في المنظمات الموزعة.",
    },
    "apiguide.intro": {
        "en": "Handling time zones correctly in code is infamously difficult. Between daylight saving transitions, historical offset changes, and half-hour time zones, naive implementations constantly fail. This guide covers everything you need to handle time zones reliably in your applications.",
        "zh": "在代码中正确处理时区是出了名的困难。夏令时切换、历史偏移变化以及半小时时区，都会让简单的实现方式频繁出错。本指南涵盖了在应用中可靠处理时区所需的一切知识。",
        "de": "Mit Zeitzonen im Code korrekt umzugehen ist notorisch schwierig. Zwischen Sommerzeit-Übergängen, historischen Offset-Änderungen und Halbstunden-Zeitzonen scheitern naive Implementierungen ständig. Dieser Leitfaden deckt alles ab, was Sie brauchen, um Zeitzonen in Ihren Anwendungen zuverlässig zu handhaben.",
        "fr": "Gérer correctement les fuseaux horaires dans le code est notoirement difficile. Entre les transitions de l'heure d'été, les changements d'offset historiques et les fuseaux à demi-heure, les implémentations naïves échouent constamment. Ce guide couvre tout ce dont vous avez besoin pour gérer les fuseaux horaires de manière fiable dans vos applications.",
        "es": "Manejar correctamente las zonas horarias en código es notoriamente difícil. Entre las transiciones de horario de verano, los cambios históricos de offset y las zonas de media hora, las implementaciones ingenuas fallan constantemente. Esta guía cubre todo lo que necesitas para manejar zonas horarias de manera confiable en tus aplicaciones.",
        "ja": "コードで時間帯を正しく処理することは、悪名高いほど難しい作業です。夏時間の切り替え、歴史的なオフセット変更、そして30分単位の時間帯など、単純な実装は絶えず失敗します。このガイドでは、アプリケーションで時間帯を確実に処理するために必要なすべてをカバーします。",
        "ko": "코드에서 시간대를 올바르게 처리하는 것은 악명 높을 정도로 어렵습니다. 일광 절약 시간 전환, 역사적 오프셋 변경, 30분 단위 시간대 등으로 인해 단순한 구현은 계속해서 실패합니다. 이 가이드는 애플리케이션에서 시간대를 안정적으로 처리하는 데 필요한 모든 것을 다룹니다.",
        "pt": "Lidar corretamente com fusos horários no código é notoriamente difícil. Entre as transições de horário de verão, mudanças históricas de offset e fusos de meia hora, implementações ingênuas falham constantemente. Este guia cobre tudo o que você precisa para lidar com fusos horários de forma confiável em suas aplicações.",
        "ar": "التعامل مع المناطق الزمنية بشكل صحيح في الكود أمر صعب بشكل مشهور. بين الانتقالات إلى التوقيت الصيفي وتغييرات الإزاحة التاريخية والمناطق الزمنية نصف الساعة، تفشل التطبيقات البسيطة باستمرار. يغطي هذا الدليل كل ما تحتاجه للتعامل مع المناطق الزمنية بشكل موثوق في تطبيقاتك.",
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
    
    print(f"[OK] {lang}.json: added {len(added)} keys: {added}")

print("\n完成！")
