#!/usr/bin/env python3
"""
GlobeTimeZone 7-Language Professional Translation Applier
Reads Part1 and Part2 translations, applies to locale JSON files.
"""
import json
import os
import sys

LOCALES_DIR = os.path.join(os.path.dirname(__file__), '..', 'locales')

# ============================================================
# Import translations from Part1 and Part2
# ============================================================

# ----- Part 1 translations -----
PART1 = {
    # timedifference (44 keys)
    "timedifference.meta.title": {"de": "Globale Zeitunterschiede | GlobeTimeZone", "fr": "Différence de fuseau horaire mondial | GlobeTimeZone", "es": "Diferencia horaria global | GlobeTimeZone", "ja": "世界の時差 | GlobeTimeZone", "ko": "글로벌 시차 | GlobeTimeZone", "pt": "Diferença de fuso horário global | GlobeTimeZone", "ar": "فروقالتوقيت العالمية | GlobeTimeZone"},
    "timedifference.meta.desc": {"de": "Vergleichen Sie aktuelle Zeit, Zeitunterschied und Arbeitszeiten zwischen zwei Städten — angetrieben von der IANA-Zeitzonendatenbank, echtzeit und präzise.", "fr": "Comparez l'heure actuelle, le décalage horaire et les heures de travail entre deux villes — alimenté par la base de données IANA des fuseaux horaires, en temps réel et précis.", "es": "Compara la hora actual, la diferencia horaria y el horario laboral entre dos ciudades — con la base de datos IANA de zonas horarias, en tiempo real y preciso.", "ja": "2つの都市間の現在時刻、時差、営業時間を比較 — IANAタイムゾーンデータベース搭載、リアルタイムで正確。", "ko": "두 도시 간 현재 시간, 시차, 근무 시간 비교 — IANA 시간대 데이터베이스 기반, 실시간 정확.", "pt": "Compare a hora atual, diferença de fuso horário e horário de trabalho entre duas cidades — com a base de dados IANA de fusos horários, em tempo real e preciso.", "ar": "قارن الوقت الحالي وفارق التوقيت وساعات العمل بين مدينتين — مدعوم بقاعدة بيانات IANA للمناطق الزمنية، في الوقت الفعلي ودقيق."},
    "timedifference.badge": {"de": "Zeitunterschiede auf einen Blick", "fr": "Différences horaires en un coup d'œil", "es": "Diferencias horarias de un vistazo", "ja": "時差を一目で確認", "ko": "한눈에 보는 시차", "pt": "Diferenças de fuso horário num relance", "ar": "فروقالتوقيت بنظرة سريعة"},
    "timedifference.h1": {"de": "Stadt zu Stadt, <span>Zeit klar gemacht</span>", "fr": "De ville à ville, <span>le temps clarifié</span>", "es": "De ciudad a ciudad, <span>el tiempo aclarado</span>", "ja": "都市間の<span>時差をスッキリ</span>", "ko": "도시 간 <span>시차 한눈에</span>", "pt": "De cidade para cidade, <span>o tempo esclarecido</span>", "ar": "من مدينة إلى مدينة، <span>الوقت واضح</span>"},
    "timedifference.subtitle": {"de": "Angetrieben von der IANA-Zeitzonendatenbank. Vergleichen Sie aktuelle Zeit, Zeitunterschied und beste Anruffenster zwischen zwei Städten. Über 30 große Städte weltweit.", "fr": "Alimenté par la base de données IANA des fuseaux horaires. Comparez l'heure actuelle, le décalage horaire et les meilleures plages d'appel entre deux villes. Plus de 30 grandes villes mondiales.", "es": "Con la base de datos IANA de zonas horarias. Compara la hora actual, la diferencia horaria y las mejores ventanas de llamada entre dos ciudades. Más de 30 ciudades principales.", "ja": "IANAタイムゾーンデータベース搭載。2都市間の現在時刻、時差、最適な電話時間を比較。世界30以上の主要都市に対応。", "ko": "IANA 시간대 데이터베이스 기반. 두 도시 간 현재 시간, 시차, 최적 통화 시간 비교. 전 세계 30개 이상 주요 도시.", "pt": "Com a base de dados IANA de fusos horários. Compare a hora atual, diferença de fuso e melhores janelas de chamada entre duas cidades. Mais de 30 grandes cidades mundiais.", "ar": "مدعوم بقاعدة بيانات IANA للمناطق الزمنية. قارن الوقت الحالي وفارق التوقيت وأفضل أوقات الاتصال بين مدينتين. أكثر من 30 مدينة رئيسية عالمية."},
    "timedifference.city1Label": {"de": "Stadt 1", "fr": "Ville 1", "es": "Ciudad 1", "ja": "都市1", "ko": "도시 1", "pt": "Cidade 1", "ar": "المدينة 1"},
    "timedifference.city2Label": {"de": "Stadt 2", "fr": "Ville 2", "es": "Ciudad 2", "ja": "都市2", "ko": "도시 2", "pt": "Cidade 2", "ar": "المدينة 2"},
    "timedifference.swapTitle": {"de": "Städte tauschen", "fr": "Échanger les villes", "es": "Intercambiar ciudades", "ja": "都市を入れ替え", "ko": "도시 전환", "pt": "Trocar cidades", "ar": "تبديل المدن"},
    "timedifference.swapAria": {"de": "Die beiden Städte tauschen", "fr": "Échanger les deux villes", "es": "Intercambiar las dos ciudades", "ja": "2つの都市を入れ替え", "ko": "두 도시 전환", "pt": "Trocar as duas cidades", "ar": "تبديل المدينتين"},
    "timedifference.status.working": {"de": "Arbeitszeit", "fr": "Heures de travail", "es": "Horario laboral", "ja": "就業時間", "ko": "근무 시간", "pt": "Horário de trabalho", "ar": "ساعات العمل"},
    "timedifference.status.off": {"de": "Feierabend", "fr": "Après le travail", "es": "Fuera de horario", "ja": "退勤後", "ko": "퇴근 후", "pt": "Fora do horário", "ar": "بعد العمل"},
    "timedifference.status.night": {"de": "Spät abends", "fr": "Tard le soir", "es": "Madrugada", "ja": "深夜", "ko": "심야", "pt": "Madrugada", "ar": "وقت متأخر"},
    "timedifference.status.weekend": {"de": "Wochenende · Ruhetag", "fr": "Week-end · Repos", "es": "Fin de semana · Descanso", "ja": "週末・休み", "ko": "주말 · 휴무", "pt": "Fim de semana · Descanso", "ar": "عطلة نهاية الأسبوع · راحة"},
    "timedifference.diff.unit.hour": {"de": "Stunden", "fr": "heures", "es": "horas", "ja": "時間", "ko": "시간", "pt": "horas", "ar": "ساعات"},
    "timedifference.diff.unit.hourmin": {"de": "Std. {min}Min.", "fr": "h {min}min", "es": "h {min}min", "ja": "{min}分", "ko": "시간 {min}분", "pt": "h {min}min", "ar": "س {min}د"},
    "timedifference.diff.ahead": {"de": "{city} ist voraus", "fr": "{city} est en avance", "es": "{city} va adelantado", "ja": "{city}が進んでいます", "ko": "{city}이(가) 빠름", "pt": "{city} está adiantado", "ar": "{city} متقدم"},
    "timedifference.diff.same": {"de": "Gleiche Zeitzone", "fr": "Même fuseau horaire", "es": "Misma zona horaria", "ja": "同じタイムゾーン", "ko": "같은 시간대", "pt": "Mesmo fuso horário", "ar": "نفس المنطقة الزمنية"},
    "timedifference.hours.title": {"de": "⏰ Arbeitszeiten-Überlappungsanalyse", "fr": "⏰ Analyse du chevauchement des heures de travail", "es": "⏰ Análisis de superposición de horarios laborales", "ja": "⏰ 営業時間の重なり分析", "ko": "⏰ 근무 시간 겹침 분석", "pt": "⏰ Análise de sobreposição de horários de trabalho", "ar": "⏰ تحليلتداخل ساعات العمل"},
    "timedifference.hours.subtitle": {"de": "Arbeitszeit definiert als 9:00–18:00 Ortszeit, dargestellt auf einer 24-Stunden-UTC-Zeitleiste", "fr": "Heures de travail définies de 9 h à 18 h heure locale, affichées sur une timeline UTC de 24 h", "es": "Horario laboral definido de 9:00 a 18:00 hora local, mostrado en una línea de 24 horas UTC", "ja": "就業時間は現地時間9:00〜18:00、24時間UTCタイムラインで表示", "ko": "근무 시간은 현지 시간 9:00~18:00, 24시간 UTC 타임라인으로 표시", "pt": "Horário de trabalho definido como 9:00–18:00 hora local, exibido em uma linha do tempo UTC de 24 horas", "ar": "ساعات العمل محددة من 9:00 إلى 18:00 بالتوقيت المحلي، معروضة على خط زمني UTC 24 ساعة"},
    "timedifference.legend.city1": {"de": "Stadt 1 Arbeitszeit", "fr": "Ville 1 heures de travail", "es": "Ciudad 1 horario laboral", "ja": "都市1の就業時間", "ko": "도시 1 근무 시간", "pt": "Cidade 1 horário de trabalho", "ar": "المدينة 1 ساعات العمل"},
    "timedifference.legend.city2": {"de": "Stadt 2 Arbeitszeit", "fr": "Ville 2 heures de travail", "es": "Ciudad 2 horario laboral", "ja": "都市2の就業時間", "ko": "도시 2 근무 시간", "pt": "Cidade 2 horário de trabalho", "ar": "المدينة 2 ساعات العمل"},
    "timedifference.legend.workHours": {"de": "Arbeitszeit", "fr": "heures de travail", "es": "horario laboral", "ja": "就業時間", "ko": "근무 시간", "pt": "horário de trabalho", "ar": "ساعات العمل"},
    "timedifference.legend.overlap": {"de": "Überlappungsfenster", "fr": "Fenêtre de chevauchement", "es": "Ventana de superposición", "ja": "重複時間帯", "ko": "겹침 시간대", "pt": "Janela de sobreposição", "ar": "نافذة التداخل"},
    "timedifference.legend.utcNow": {"de": "Aktuelle UTC-Zeit", "fr": "Heure UTC actuelle", "es": "Hora UTC actual", "ja": "現在のUTC時刻", "ko": "현재 UTC 시간", "pt": "Hora UTC atual", "ar": "التوقيت العالمي الحالي"},
    "timedifference.overlap.label": {"de": "✓ Überlappungszeitraum", "fr": "✓ Période de chevauchement", "es": "✓ Período de superposición", "ja": "✓ 重複時間帯", "ko": "✓ 겹침 시간대", "pt": "✓ Período de sobreposição", "ar": "✓ فترة التداخل"},
    "timedifference.overlap.hasOverlap": {"de": "{hours}h Überlappungsfenster", "fr": "{hours}h de chevauchement", "es": "{hours}h de superposición", "ja": "{hours}時間の重複", "ko": "{hours}시간 겹침", "pt": "{hours}h de sobreposição", "ar": "{hours}س تداخل"},
    "timedifference.overlap.hasOverlapDesc": {"de": "Goldenes Anruffenster, wenn beide arbeiten. Planen Sie zwischen UTC ", "fr": "Fenêtre d'appel idéale quand les deux travaillent. Planifiez entre UTC ", "es": "Ventana de llamada ideal cuando ambos trabajan. Programe entre UTC ", "ja": "双方が就業中の最適な電話時間帯。UTC ", "ko": "양쪽 모두 근무 중인 최적 통화 시간대. UTC ", "pt": "Janela de chamada ideal quando ambos trabalham. Agende entre UTC ", "ar": "نافذة الاتصال المثالية عندما يكون الطرفان في العمل. حدد بين UTC "},
    "timedifference.overlap.noOverlap": {"de": "Keine Arbeitszeiten-Überlappung", "fr": "Aucun chevauchement d'heures de travail", "es": "Sin superposición de horarios laborales", "ja": "就業時間の重複なし", "ko": "근무 시간 겹침 없음", "pt": "Sem sobreposição de horários de trabalho", "ar": "لا تداخل في ساعات العمل"},
    "timedifference.overlap.noOverlapDesc": {"de": "Die Arbeitszeiten der beiden Städte sind komplett verschoben. Eine Seite muss außerhalb der Arbeitszeit flexibel sein. Nutzen Sie den Besprechungsplaner für einen Kompromiss.", "fr": "Les heures de travail des deux villes sont totalement décalées. Un côté doit s'adapter en dehors des heures de travail. Utilisez le planificateur de réunions pour trouver un compromis.", "es": "Los horarios laborales de las dos ciudades están completamente desalineados. Un lado debe adaptarse fuera del horario laboral. Use el planificador de reuniones para un compromiso.", "ja": "2都市の就業時間が全く重なりません。どちらかが就業時間外に対応する必要があります。会議プランナーで妥協点を探してください。", "ko": "두 도시의 근무 시간이 전혀 겹치지 않습니다. 한쪽이 근무 시간 외에 맞춰야 합니다. 회의 플래너로 타협점을 찾으세요.", "pt": "Os horários de trabalho das duas cidades estão completamente desalinhados. Um lado precisa se adaptar fora do horário de trabalho. Use o planejador de reuniões para um compromisso.", "ar": "ساعات العمل في المدينتين غير متطابقة تمامًا. يجب على أحد الطرفين التكيف خارج ساعات العمل. استخدم مخطط الاجتماعات للوصول إلى حل وسط."},
    "timedifference.quickLinks.title": {"de": "🔗 Beliebte Zeitunterschiede", "fr": "🔗 Différences horaires populaires", "es": "🔗 Diferencias horarias populares", "ja": "🔗 人気の時差ルート", "pt": "🔗 Diferenças de fuso populares", "ar": "🔗 فروقالتوقيت الشائعة"},
    "timedifference.bestTime": {"de": "Beste Anrufzeit", "fr": "Meilleur moment pour appeler", "es": "Mejor hora para llamar", "ja": "最適な電話時間", "ko": "최적 통화 시간", "pt": "Melhor hora para ligar", "ar": "أفضل وقت للاتصال"},
    "timedifference.workHours": {"de": "Arbeitszeit", "fr": "Heures de travail", "es": "Horario laboral", "ja": "就業時間", "ko": "근무 시간", "pt": "Horário de trabalho", "ar": "ساعات العمل"},
    "timedifference.recommended": {"de": "Empfohlen", "fr": "Recommandé", "es": "Recomendado", "ja": "おすすめ", "ko": "추천", "pt": "Recomendado", "ar": "موصى به"},
    "timedifference.local": {"de": "Ortszeit", "fr": "local", "es": "local", "ja": "現地時間", "ko": "현지 시간", "pt": "local", "ar": "محلي"},
    "timedifference.localOnly": {"de": "Nur lokal", "fr": "Local uniquement", "es": "Solo local", "ja": "現地のみ", "ko": "현지만", "pt": "Somente local", "ar": "محلي فقط"},
    "timedifference.group.asia": {"de": "Asien", "fr": "Asie", "es": "Asia", "ja": "アジア", "ko": "아시아", "pt": "Ásia", "ar": "آسيا"},
    "timedifference.group.europe": {"de": "Europa", "fr": "Europe", "es": "Europa", "ja": "ヨーロッパ", "ko": "유럽", "pt": "Europa", "ar": "أوروبا"},
    "timedifference.group.northamerica": {"de": "Nordamerika", "fr": "Amérique du Nord", "es": "América del Norte", "ja": "北米", "ko": "북미", "pt": "América do Norte", "ar": "أمريكا الشمالية"},
    "timedifference.group.southamerica": {"de": "Südamerika", "fr": "Amérique du Sud", "es": "América del Sur", "ja": "南米", "ko": "남미", "pt": "América do Sul", "ar": "أمريكا الجنوبية"},
    "timedifference.group.oceania": {"de": "Ozeanien", "fr": "Océanie", "es": "Oceanía", "ja": "オセアニア", "ko": "오세아니아", "pt": "Oceania", "ar": "أوقيانوسيا"},
    "timedifference.group.africa": {"de": "Afrika", "fr": "Afrique", "es": "África", "ja": "アフリカ", "ko": "아프리카", "pt": "África", "ar": "أفريقيا"},
    "timedifference.am": {"de": "AM", "fr": "AM", "es": "AM", "ja": "午前", "ko": "오전", "pt": "AM", "ar": "ص"},
    "timedifference.pm": {"de": "PM", "fr": "PM", "es": "PM", "ja": "午後", "ko": "오후", "pt": "PM", "ar": "م"},
    "timedifference.footer.popular": {"de": "Beliebte Routen", "fr": "Routes populaires", "es": "Rutas populares", "ja": "人気ルート", "ko": "인기 노선", "pt": "Rotas populares", "ar": "الطرق الشائعة"},
    # ========== footer (9 keys) ==========
    "footer.description": {"de": "Globales Zeitentscheidungstool. Angetrieben von der IANA-Zeitzonendatenbank für präzise Zeitunterschiedsberechnung und Besprechungsplanung.", "fr": "Outil de décision temporelle mondiale. Alimenté par la base de données IANA des fuseaux horaires pour le calcul précis des décalages horaires et la planification de réunions.", "es": "Herramienta de decisión horaria global. Con la base de datos IANA de zonas horarias para cálculos precisos de diferencia horaria y planificación de reuniones.", "ja": "グローバル時間意思決定ツール。IANAタイムゾーンデータベース搭載、正確な時差計算と会議計画に。", "ko": "글로벌 시간 의사결정 도구. IANA 시간대 데이터베이스 기반, 정확한 시차 계산 및 회의 계획.", "pt": "Ferramenta de decisão de horário global. Com a base de dados IANA de fusos horários para cálculos precisos de diferença de fuso e planejamento de reuniões.", "ar": "أداة قرار الوقت العالمي. مدعومة بقاعدة بيانات IANA للمناطق الزمنية لحساب فروق التوقيت الدقيقة وتخطيط الاجتماعات."},
    "footer.tools": {"de": "Werkzeuge", "fr": "Outils", "es": "Herramientas", "ja": "ツール", "ko": "도구", "pt": "Ferramentas", "ar": "الأدوات"},
    "footer.timezoneConvert": {"de": "Zeitzonenkonverter", "fr": "Convertisseur de fuseau horaire", "es": "Conversor de zonas horarias", "ja": "タイムゾーン変換", "ko": "시간대 변환기", "pt": "Conversor de fuso horário", "ar": "محول المنطقة الزمنية"},
    "footer.worldClock": {"de": "Weltuhr", "fr": "Horloge mondiale", "es": "Reloj mundial", "ja": "世界時計", "ko": "세계 시계", "pt": "Relógio mundial", "ar": "ساعة عالمية"},
    "footer.aboutUs": {"de": "Über uns", "fr": "À propos", "es": "Sobre nosotros", "ja": "私たちについて", "ko": "회사 소개", "pt": "Sobre nós", "ar": "من نحن"},
    "footer.heading.tools": {"de": "Werkzeuge", "fr": "Outils", "es": "Herramientas", "ja": "ツール", "ko": "도구", "pt": "Ferramentas", "ar": "الأدوات"},
    "footer.heading.about": {"de": "Über", "fr": "À propos", "es": "Acerca de", "ja": "概要", "ko": "소개", "pt": "Sobre", "ar": "حول"},
    "footer.heading.contact": {"de": "Kontakt", "fr": "Contact", "es": "Contacto", "ja": "お問い合わせ", "ko": "연락처", "pt": "Contato", "ar": "اتصل بنا"},
    "footer.desc": {"de": "Globales Zeitentscheidungstool. Basierend auf der IANA-Zeitzonendatenbank für präzise Zeitunterschiedsberechnung und Besprechungsplanung.", "fr": "Outil de décision temporelle mondiale. Basé sur la base de données IANA des fuseaux horaires pour le calcul précis des décalages et la planification de réunions.", "es": "Herramienta de decisión horaria global. Basada en la base de datos IANA de zonas horarias para cálculos precisos y planificación de reuniones.", "ja": "グローバル時間意思決定ツール。IANAタイムゾーンデータベース基盤、正確な時差計算と会議計画に。", "ko": "글로벌 시간 의사결정 도구. IANA 시간대 데이터베이스 기반, 정확한 시차 계산 및 회의 계획.", "pt": "Ferramenta de decisão de horário global. Baseada na base de dados IANA de fusos horários para cálculos precisos e planejamento de reuniões.", "ar": "أداة قرار الوقت العالمي. مبنية على قاعدة بيانات IANA للمناطق الزمنية للحساب الدقيقة وتخطيط الاجتماعات."},
    # ========== meetingplanner (41 keys) ==========
    "meetingplanner.h1": {"de": "Zeitzonenübergreifende Besprechungen · Beste Zeit mit einem Klick finden", "fr": "Réunions inter-fuseaux · Trouvez le meilleur créneau en un clic", "es": "Reuniones entre zonas horarias · Encuentre el mejor horario en un clic", "ja": "時差越しミーティング · ワンクリックで最適時間を発見", "ko": "시간대 간 회의 · 원클릭으로 최적 시간 찾기", "pt": "Reuniões entre fusos · Encontre o melhor horário em um clique", "ar": "اجتماعات عبر المناطق الزمنية · اعثر على أفضل وقت بنقرة واحدة"},
    "meetingplanner.subtitle": {"de": "Team-Städte hinzufügen, 24h-Zeitleiste automatisch berechnen, das beste Besprechungsfenster finden, wenn alle arbeiten", "fr": "Ajoutez les villes de l'équipe, calculez automatiquement la timeline 24h, trouvez le meilleur créneau quand tout le monde travaille", "es": "Agregue ciudades del equipo, calcule automáticamente la línea de 24h, encuentre la mejor ventana de reunión cuando todos trabajan", "ja": "チームメンバーの都市を追加、24時間タイムラインを自動計算、全員の就業時間に合う最適な会議時間を発見", "ko": "팀원 도시를 추가하고 24시간 타임라인을 자동 계산하여 모두가 근무 중인 최적 회의 시간대 찾기", "pt": "Adicione cidades da equipe, calcule automaticamente a linha de 24h, encontre a melhor janela de reunião quando todos trabalham", "ar": "أضف مدن الفريق، واحسب الجدول الزمني 24 ساعة تلقائيًا، واعثر على أفضل نافذة اجتماع عندما يكون الجميع في العمل"},
    "meetingplanner.badge.participants": {"de": "Unbegrenzte Teilnehmer", "fr": "Participants illimités", "es": "Participantes ilimitados", "ja": "参加者無制限", "ko": "참가자 무제한", "pt": "Participantes ilimitados", "ar": "مشاركون بلا حدود"},
    "meetingplanner.badge.timeline": {"de": "Arbeitszeiten-Überlappung", "fr": "Chevauchement des heures de travail", "es": "Superposición de horarios", "ja": "就業時間の重なり", "ko": "근무 시간 겹침", "pt": "Sobreposição de horários", "ar": "تداخل ساعات العمل"},
    "meetingplanner.badge.export": {"de": "Ein-Klick-.ics-Export", "fr": "Export .ics en un clic", "es": "Exportar .ics en un clic", "ja": "ワンクリック.icsエクスポート", "ko": "원클릭 .ics 내보내기", "pt": "Exportar .ics em um clique", "ar": "تصدير .ics بنقرة واحدة"},
    "meetingplanner.badge.pricing": {"de": "Vollständig kostenlos", "fr": "Entièrement gratuit", "es": "Completamente gratis", "ja": "完全無料", "ko": "완전 무료", "pt": "Totalmente gratuito", "ar": "مجاني بالكامل"},
    "meetingplanner.add_title": {"de": "👔 Teilnehmer hinzufügen", "fr": "👔 Ajouter un participant", "es": "👔 Agregar participante", "ja": "👔 参加者を追加", "ko": "👔 참가자 추가", "pt": "👔 Adicionar participante", "ar": "👔 إضافة مشارك"},
    "meetingplanner.to": {"de": "bis", "fr": "à", "es": "a", "ja": "〜", "ko": "〜", "pt": "até", "ar": "إلى"},
    "meetingplanner.add_btn": {"de": "+ Hinzufügen", "fr": "+ Ajouter", "es": "+ Agregar", "ja": "+ 追加", "ko": "+ 추가", "pt": "+ Adicionar", "ar": "+ إضافة"},
    "meetingplanner.quick_label": {"de": "Schnellzugriff:", "fr": "Ajout rapide :", "es": "Agregado rápido:", "ja": "クイック追加:", "ko": "빠른 추가:", "pt": "Adição rápida:", "ar": "إضافة سريعة:"},
    "meetingplanner.duration_title": {"de": "⏱ Besprechungsdauer", "fr": "⏱ Durée de la réunion", "es": "⏱ Duración de la reunión", "ja": "⏱ 会議の所要時間", "ko": "⏱ 회의 소요 시간", "pt": "⏱ Duração da reunião", "ar": "⏱ مدة الاجتماع"},
    "meetingplanner.dur.30": {"de": "30 Min.", "fr": "30 min", "es": "30 min", "ja": "30分", "ko": "30분", "pt": "30 min", "ar": "30 دقيقة"},
    "meetingplanner.dur.60": {"de": "1 Stunde", "fr": "1 heure", "es": "1 hora", "ja": "1時間", "ko": "1시간", "pt": "1 hora", "ar": "ساعة واحدة"},
    "meetingplanner.dur.90": {"de": "1,5 Stunden", "fr": "1,5 heures", "es": "1,5 horas", "ja": "1.5時間", "ko": "1.5시간", "pt": "1,5 horas", "ar": "1.5 ساعة"},
    "meetingplanner.dur.120": {"de": "2 Stunden", "fr": "2 heures", "es": "2 horas", "ja": "2時間", "ko": "2시간", "pt": "2 horas", "ar": "ساعتان"},
    "meetingplanner.participants_title": {"de": "🌍 Teilnehmer-Livestatus", "fr": "🌍 Statut en direct des participants", "es": "🌍 Estado en vivo de participantes", "ja": "🌍 参加者のリアルタイム状況", "ko": "🌍 참가자 실시간 상태", "pt": "🌍 Status ao vivo dos participantes", "ar": "🌍 حالة المشاركين المباشرة"},
    "meetingplanner.timeline_title": {"de": "📅 24-Stunden-Zeitleiste (UTC-Basis)", "fr": "📅 Timeline 24 heures (base UTC)", "es": "📅 Línea de 24 horas (base UTC)", "ja": "📅 24時間タイムライン（UTC基準）", "ko": "📅 24시간 타임라인 (UTC 기준)", "pt": "📅 Linha de 24 horas (base UTC)", "ar": "📅 الجدول الزمني 24 ساعة (أساس UTC)"},
    "meetingplanner.legend.work": {"de": "Arbeitszeit", "fr": "Heures de travail", "es": "Horario laboral", "ja": "就業時間", "ko": "근무 시간", "pt": "Horário de trabalho", "ar": "ساعات العمل"},
    "meetingplanner.legend.off": {"de": "Freizeit", "fr": "Hors travail", "es": "Fuera de horario", "ja": "退勤後", "ko": "퇴근", "pt": "Fora do horário", "ar": "خارج العمل"},
    "meetingplanner.legend.sleep": {"de": "Spät nachts (0–6)", "fr": "Nuit tardive (0–6)", "es": "Madrugada (0–6)", "ja": "深夜（0〜6時）", "ko": "심야 (0~6시)", "pt": "Madrugada (0–6)", "ar": "وقت متأخر (0–6)"},
    "meetingplanner.legend.now": {"de": "Aktueller Moment", "fr": "Moment actuel", "es": "Momento actual", "ja": "現在の時刻", "ko": "현재 시각", "pt": "Momento atual", "ar": "اللحظة الحالية"},
    "meetingplanner.legend.best": {"de": "Empfohlener Slot", "fr": "Créneau recommandé", "es": "Espacio recomendado", "ja": "おすすめの時間帯", "ko": "추천 시간대", "pt": "Espaço recomendado", "ar": "الفترة الموصى بها"},
    "meetingplanner.best_title": {"de": "🏆 Beste Besprechungszeit-Empfehlungen", "fr": "🏆 Recommandations du meilleur créneau", "es": "🏆 Recomendaciones del mejor horario", "ja": "🏆 最適会議時間の提案", "ko": "🏆 최적 회의 시간 추천", "pt": "🏆 Recomendações do melhor horário", "ar": "🏆 توصيات أفضل وقت للاجتماع"},
    "meetingplanner.empty.title": {"de": "Noch keine Teilnehmer", "fr": "Aucun participant pour l'instant", "es": "Aún sin participantes", "ja": "参加者がまだいません", "ko": "아직 참가자가 없습니다", "pt": "Sem participantes ainda", "ar": "لا مشاركين بعد"},
    "meetingplanner.empty.desc": {"de": "Fügen Sie oben die Städte Ihrer Teammitglieder hinzu, und wir finden automatisch die beste Besprechungszeit", "fr": "Ajoutez les villes de vos collègues ci-dessus, et nous trouverons automatiquement le meilleur créneau", "es": "Agregue las ciudades de su equipo arriba, y encontraremos automáticamente el mejor horario", "ja": "上記にチームメンバーの都市を追加すると、最適な会議時間を自動で見つけます", "ko": "위에서 팀원의 도시를 추가하면 최적의 회의 시간을 자동으로 찾습니다", "pt": "Adicione as cidades dos membros da equipe acima, e encontraremos automaticamente o melhor horário", "ar": "أضف مدن أعضاء فريقك أعلاه، وسنجد تلقائيًا أفضل وقت للاجتماع"},
    "meetingplanner.export_title": {"de": "📤 Exportieren & Teilen", "fr": "📤 Exporter et partager", "es": "📤 Exportar y compartir", "ja": "📤 エクスポート・共有", "ko": "📤 내보내기 및 공유", "pt": "📤 Exportar e compartilhar", "ar": "📤 تصدير ومشاركة"},
    "meetingplanner.copy_link": {"de": "📋 Besprechungslink kopieren", "fr": "📋 Copier le lien de réunion", "es": "📋 Copiar enlace de reunión", "ja": "📋 会議リンクをコピー", "ko": "📋 회의 링크 복사", "pt": "📋 Copiar link da reunião", "ar": "📋 نسخ رابط الاجتماع"},
    "meetingplanner.download_ics": {"de": "📥 .ics-Kalenderdatei herunterladen", "fr": "📥 Télécharger le fichier .ics", "es": "📥 Descargar archivo .ics", "ja": "📥 .icsカレンダーファイルをダウンロード", "ko": "📥 .ics 캘린더 파일 다운로드", "pt": "📥 Baixar arquivo .ics", "ar": "📥 تنزيل ملف .ics"},
    "meetingplanner.export_desc": {"de": ".ics-Dateien können in Apple Calendar, Outlook, Google Calendar und alle gängigen Kalender-Apps importiert werden", "fr": "Les fichiers .ics peuvent être importés dans Apple Calendar, Outlook, Google Calendar et toutes les applications de calendrier", "es": "Los archivos .ics se pueden importar a Apple Calendar, Outlook, Google Calendar y todas las apps de calendario", "ja": ".icsファイルはApple Calendar、Outlook、Googleカレンダーなど主要カレンダーアプリにインポートできます", "ko": ".ics 파일은 Apple 캘린더, Outlook, Google 캘린더 및 주요 캘린더 앱으로 가져올 수 있습니다", "pt": "Arquivos .ics podem ser importados no Apple Calendar, Outlook, Google Calendar e todos os apps de calendário", "ar": "يمكن استيراد ملفات .ics إلى Apple Calendar وOutlook وGoogle Calendar وجميع تطبيقات التقويم"},
    "meetingplanner.toast.duplicate": {"de": " bereits hinzugefügt", "fr": " déjà ajouté", "es": " ya agregado", "ja": " 追加済み", "ko": " 이미 추가됨", "pt": " já adicionado", "ar": " مضاف بالفعل"},
    "meetingplanner.toast.added": {"de": "Hinzugefügt ", "fr": "Ajouté ", "es": "Agregado ", "ja": "追加完了 ", "ko": "추가됨 ", "pt": "Adicionado ", "ar": "تمت الإضافة "},
    "meetingplanner.toast.no_participants": {"de": "Bitte zuerst Teilnehmer hinzufügen", "fr": "Veuillez d'abord ajouter des participants", "es": "Primero agregue participantes", "ja": "先に参加者を追加してください", "ko": "먼저 참가자를 추가하세요", "pt": "Primeiro adicione participantes", "ar": "يرجى إضافة مشاركين أولاً"},
    "meetingplanner.toast.link_copied": {"de": "Besprechungslink kopiert", "fr": "Lien de réunion copié", "es": "Enlace de reunión copiado", "ja": "会議リンクをコピーしました", "ko": "회의 링크 복사됨", "pt": "Link da reunião copiado", "ar": "تم نسخ رابط الاجتماع"},
    "meetingplanner.toast.ics_downloaded": {"de": ".ics-Datei heruntergeladen", "fr": "Fichier .ics téléchargé", "es": "Archivo .ics descargado", "ja": ".icsファイルをダウンロードしました", "ko": ".ics 파일 다운로드됨", "pt": "Arquivo .ics baixado", "ar": "تم تنزيل ملف .ics"},
    "meetingplanner.status.work": {"de": "Arbeitet", "fr": "Au travail", "es": "Trabajando", "ja": "勤務中", "ko": "근무 중", "pt": "Trabalhando", "ar": "في العمل"},
    "meetingplanner.status.sleep": {"de": "Spät nachts", "fr": "Nuit tardive", "es": "Madrugada", "ja": "深夜", "ko": "심야", "pt": "Madrugada", "ar": "وقت متأخر"},
    "meetingplanner.status.off": {"de": "Feierabend", "fr": "Hors travail", "es": "Fuera de horario", "ja": "退勤", "ko": "퇴근", "pt": "Fora do horário", "ar": "خارج العمل"},
    "meetingplanner.best_none": {"de": "Keine vollständig überlappenden Arbeitszeiten gefunden", "fr": "Aucun chevauchement complet d'heures de travail trouvé", "es": "No se encontró superposición completa de horarios", "ja": "完全に重なる就業時間が見つかりませんでした", "ko": "완전히 겹치는 근무 시간을 찾지 못했습니다", "pt": "Nenhuma sobreposição completa de horários encontrada", "ar": "لم يتم العثور على تداخل كامل في ساعات العمل"},
    "meetingplanner.best_hint": {"de": "Versuchen Sie, die Besprechungsdauer zu verkürzen oder die Arbeitszeiteinstellungen der Teilnehmer anzupassen", "fr": "Essayez de réduire la durée de la réunion ou d'ajuster les paramètres d'heures de travail des participants", "es": "Intente acortar la duración de la reunión o ajustar la configuración de horarios de los participantes", "ja": "会議時間を短縮するか、参加者の就業時間設定を調整してみてください", "ko": "회의 시간을 단축하거나 참가자의 근무 시간 설정을 조정해 보세요", "pt": "Tente encurtar a duração da reunião ou ajustar as configurações de horário dos participantes", "ar": "حاول تقصير مدة الاجتماع أو تعديل إعدادات ساعات العمل للمشاركين"},
    "meetingplanner.ics_summary": {"de": "Zeitzonenübergreifende Besprechung (", "fr": "Réunion inter-fuseaux (", "es": "Reunión entre zonas (", "ja": "時差越しミーティング（", "ko": "시간대 간 회의 (", "pt": "Reunião entre fusos (", "ar": "اجتماع عبر المناطق الزمنية ("},
    "meetingplanner.ics_desc": {"de": "Geplant via GlobeTimeZone Besprechungsplaner\nTeilnehmer: \n\nhttps://globetimezone.com/meeting-planner/", "fr": "Planifié via GlobeTimeZone Planificateur de réunions\nParticipants : \n\nhttps://globetimezone.com/meeting-planner/", "es": "Planificado via GlobeTimeZone Planificador de reuniones\nParticipantes: \n\nhttps://globetimezone.com/meeting-planner/", "ja": "GlobeTimeZone会議プランナーで作成\n参加者: \n\nhttps://globetimezone.com/meeting-planner/", "ko": "GlobeTimeZone 회의 플래너로 예정\n참가자: \n\nhttps://globetimezone.com/meeting-planner/", "pt": "Planejado via GlobeTimeZone Planejador de reuniões\nParticipantes: \n\nhttps://globetimezone.com/meeting-planner/", "ar": "مجدول عبر مخطط اجتماعات GlobeTimeZone\nالمشاركون: \n\nhttps://globetimezone.com/meeting-planner/"},
    # ========== crossborder (54 keys) ==========
    "crossborder.hero.badge": {"de": "🧰 跨境ツールキット v6.0", "fr": "🧰 Boîte à outils transfrontalière v6.0", "es": "🧰 Kit de herramientas transfronterizas v6.0", "ja": "🧰 越境ツールキット v6.0", "ko": "🧰 크로스보더 툴킷 v6.0", "pt": "🧰 Kit de ferramentas transfronteiriças v6.0", "ar": "🧰 مجموعة أدوات عبر الحدود v6.0"},
    "crossborder.hero.h1": {"de": "跨境ツールキット v6.0", "fr": "Défis transfrontaliers, résolus en un seul endroit", "es": "Desafíos transfronterizos, resueltos en un solo lugar", "ja": "越境の課題、ここで一括解決", "ko": "크로스보더 과제, 한 곳에서 해결", "pt": "Desafios transfronteiriços, resolvidos em um só lugar", "ar": "تحديات عبر الحدود، محلولة في مكان واحد"},
    "crossborder.hero.subtitle": {"de": "Versandvergleich · Zollschtzungen · Währungswechsel · HS-Codes · Verbotssliste — Ihr All-in-One-Toolkit für grenzüberschreitenden Handel", "fr": "Comparaison d'expédition · Estimations douanières · Change · Codes HS · Articles interdits — votre boîte à outils transfrontalière complète", "es": "Comparación de envíos · Estimaciones arancelarias · Cambio de divisa · Códigos HS · Artículos prohibidos — su kit transfronterizo todo en uno", "ja": "配送比較・関税見積もり・為替・HSコード・禁制品 — 越境ECオールインワンツールキット", "ko": "배송 비교 · 관세 견적 · 환율 · HS코드 · 금지품목 — 크로스보더 올인원 툴킷", "pt": "Comparação de envios · Estimativas alfandegárias · Câmbio · Códigos HS · Itens proibidos — seu kit transfronteiriço completo", "ar": "مقارنة الشحن · تقديرات الجمارك · الصرف · رموز HS · الممنوعات — مجموعة أدواتك الشاملة عبر الحدود"},
    "crossborder.hero.track_placeholder": {"de": "Sendungsnummer eingeben zum Nachverfolgen…", "fr": "Entrez le numéro de suivi pour suivre votre colis…", "es": "Ingrese el número de seguimiento para rastrear su paquete…", "ja": "追跡番号を入力して荷物を追跡…", "ko": "추적 번호를 입력하여 패키지를 추적…", "pt": "Digite o número de rastreamento para rastrear seu pacote…", "ar": "أدخل رقم التتبع لتتبع شحنتك…"},
    "crossborder.hero.track_btn": {"de": "Nachverfolgen", "fr": "Suivre", "es": "Rastrear", "ja": "追跡", "ko": "추적", "pt": "Rastrear", "ar": "تتبع"},
    "crossborder.hero.example": {"de": "Beispiel: DHL-12345678 · UPS-87654321 — unterstützt 500+ Spediteur weltweit", "fr": "Exemple : DHL-12345678 · UPS-87654321 — prend en charge plus de 500 transporteurs dans le monde", "es": "Ejemplo: DHL-12345678 · UPS-87654321 — soporta más de 500 transportistas en todo el mundo", "ja": "例：DHL-12345678・UPS-87654321 — 世界500以上の配送業者に対応", "ko": "예시: DHL-12345678 · UPS-87654321 — 전 세계 500개 이상 배송업체 지원", "pt": "Exemplo: DHL-12345678 · UPS-87654321 — suporta mais de 500 transportadoras em todo o mundo", "ar": "مثال: DHL-12345678 · UPS-87654321 — يدعم أكثر من 500 ناقل حول العالم"},
    "crossborder.hero.stat1": {"de": "Spediteurpartner", "fr": "Transporteurs partenaires", "es": "Transportistas asociados", "ja": "配送パートナー", "ko": "배송 파트너", "pt": "Transportadoras parceiras", "ar": "شركاء الشحن"},
    "crossborder.hero.stat2": {"de": "Integrierte Tools", "fr": "Outils intégrés", "es": "Herramientas integradas", "ja": "内蔵ツール", "ko": "내장 도구", "pt": "Ferramentas integradas", "ar": "أدوات مدمجة"},
    "crossborder.hero.stat3": {"de": "Zielländer", "fr": "Pays de destination", "es": "Países de destino", "ja": "宛先国", "ko": "목적지 국가", "pt": "Países de destino", "ar": "بلدان الوجهة"},
    "crossborder.hero.stat4": {"de": "Vollständig kostenlos", "fr": "Entièrement gratuit", "es": "Completamente gratis", "ja": "完全無料", "ko": "완전 무료", "pt": "Totalmente gratuito", "ar": "مجاني بالكامل"},
    "crossborder.dash.routes": {"de": "⭐ Meine häufigen Routen", "fr": "⭐ Mes routes fréquentes", "es": "⭐ Mis rutas frecuentes", "ja": "⭐ よく使うルート", "ko": "⭐ 자주 쓰는 노선", "pt": "⭐ Minhas rotas frequentes", "ar": "⭐ طرقي المتكررة"},
    "crossborder.dash.route_count": {"de": "0 Routen", "fr": "0 routes", "es": "0 rutas", "ja": "0ルート", "ko": "0 노선", "pt": "0 rotas", "ar": "0 طرق"},
    "crossborder.dash.routes_empty": {"de": "Nach der Abfrage auf „Route speichern\" für schnelle Wiederverwendung klicken", "fr": "Après la recherche, cliquez sur « Sauvegarder cette route »", "es": "Después de consultar, haga clic en « Guardar esta ruta »", "ja": "検索後、「このルートを保存」をクリック", "ko": "조회 후 \"이 노선 저장\" 클릭", "pt": "Após a consulta, clique em \"Salvar esta rota\"", "ar": "بعد الاستعلام، انقر على \"حفظ هذا الطريق\""},
    "crossborder.dash.tracking": {"de": "📮 Meine Paketverfolgung", "fr": "📮 Suivi de mes colis", "es": "📮 Mi seguimiento de paquetes", "ja": "📮 荷物追跡リスト", "ko": "📮 내 패키지 추적", "pt": "📮 Meu rastreamento de pacotes", "ar": "📮 تتبع طرودي"},
    "crossborder.dash.track_count": {"de": "0 Pakete", "fr": "0 colis", "es": "0 paquetes", "ja": "0件", "ko": "0 패키지", "pt": "0 pacotes", "ar": "0 طرود"},
    "crossborder.dash.tracking_empty": {"de": "Nach der Verfolgung auf „Zur Beobachtungsliste\" klicken zum Speichern", "fr": "Après le suivi, cliquez sur « Ajouter à la liste d'observation »", "es": "Después de rastrear, haga clic en « Agregar a la lista »", "ja": "追跡後、「ウォッチリストに追加」をクリック", "ko": "추적 후 \"관찰 목록에 추가\" 클릭", "pt": "Após rastrear, clique em \"Adicionar à lista\"", "ar": "بعد التتبع، انقر على \"إضافة لقائمة المراقبة\""},
    "crossborder.tab.logistics": {"de": "📦 Versandrechner", "fr": "📦 Calculateur d'expédition", "es": "📦 Calculadora de envío", "ja": "📦 配送計算ツール", "ko": "📦 배송 계산기", "pt": "📦 Calculadora de envio", "ar": "📦 حاسبة الشحن"},
    "crossborder.tab.tariff": {"de": "💰 Zollschtzung", "fr": "💰 Estimation douanière", "es": "💰 Estimación arancelaria", "ja": "💰 関税見積もり", "ko": "💰 관세 견적", "pt": "💰 Estimativa alfandegária", "ar": "💰 تقدير الجمارك"},
    "crossborder.tab.tracking": {"de": "🚚 Paketverfolgung", "fr": "🚚 Suivi de colis", "es": "🚚 Seguimiento de paquetes", "ja": "🚚 荷物追跡", "ko": "🚚 패키지 추적", "pt": "🚚 Rastreamento de pacotes", "ar": "🚚 تتبع الطرود"},
    "crossborder.tab.prohibited": {"de": "🚫 Verbotssliste", "fr": "🚫 Articles interdits", "es": "🚫 Artículos prohibidos", "ja": "🚫 禁制品", "ko": "🚫 금지 품목", "pt": "🚫 Itens proibidos", "ar": "🚫 الممنوعات"},
    "crossborder.logistics.title": {"de": "📦 Versandlaufzeit- und Kostenrechner", "fr": "📦 Calculateur de délai et coût d'expédition", "es": "📦 Calculadora de tiempo y costo de envío", "ja": "📦 配送日数・料金計算ツール", "ko": "📦 배송 소요시간 및 비용 계산기", "pt": "📦 Calculadora de prazo e custo de envio", "ar": "📦 حاسبة مدة وتكلفة الشحن"},
    "crossborder.logistics.origin": {"de": "Absender", "fr": "Origine", "es": "Origen", "ja": "出発地", "ko": "출발지", "pt": "Origem", "ar": "المنشأ"},
    "crossborder.logistics.destination": {"de": "Ziel", "fr": "Destination", "es": "Destino", "ja": "到着地", "ko": "목적지", "pt": "Destino", "ar": "الوجهة"},
    "crossborder.logistics.weight": {"de": "Paketgewicht (kg)", "fr": "Poids du colis (kg)", "es": "Peso del paquete (kg)", "ja": "荷物重量（kg）", "ko": "패키지 무게 (kg)", "pt": "Peso do pacote (kg)", "ar": "وزن الطرد (كجم)"},
    "crossborder.logistics.length": {"de": "Länge (cm)", "fr": "Longueur (cm)", "es": "Largo (cm)", "ja": "長さ（cm）", "ko": "길이 (cm)", "pt": "Comprimento (cm)", "ar": "الطول (سم)"},
    "crossborder.logistics.width_height": {"de": "Breite × Höhe (cm)", "fr": "Largeur × Hauteur (cm)", "es": "Ancho × Alto (cm)", "ja": "幅×高さ（cm）", "ko": "폭 × 높이 (cm)", "pt": "Largura × Altura (cm)", "ar": "العرض × الارتفاع (سم)"},
    "crossborder.logistics.ship_date": {"de": "Versanddatum", "fr": "Date d'expédition", "es": "Fecha de envío", "ja": "発送日", "ko": "발송일", "pt": "Data de envio", "ar": "تاريخ الشحن"},
    "crossborder.logistics.declared_value": {"de": "Wertdeklaration (USD)", "fr": "Valeur déclarée (USD)", "es": "Valor declarado (USD)", "ja": "申告価値（USD）", "ko": "신고 가치 (USD)", "pt": "Valor declarado (USD)", "ar": "القيمة المعلنة (دولار)"},
    "crossborder.logistics.calc_btn": {"de": "🔍 Alle Versandoptionen suchen", "fr": "🔍 Rechercher toutes les options d'expédition", "es": "🔍 Buscar todas las opciones de envío", "ja": "🔍 全配送オプションを検索", "ko": "🔍 모든 배송 옵션 검색", "pt": "🔍 Pesquisar todas as opções de envio", "ar": "🔍 البحث عن جميع خيارات الشحن"},
    "crossborder.logistics.save_route": {"de": "📌 Diese Route für schnellen Zugriff speichern", "fr": "📌 Sauvegarder cette route pour un accès rapide", "es": "📌 Guardar esta ruta para acceso rápido", "ja": "📌 このルートを保存して素早く再利用", "ko": "📌 이 노선을 저장하여 빠른 재사용", "pt": "📌 Salvar esta rota para acesso rápido", "ar": "📌 حفظ هذا الطريق للوصول السريع"},
    "crossborder.logistics.results_title": {"de": "Verfügbare Versandoptionen", "fr": "Options d'expédition disponibles", "es": "Opciones de envío disponibles", "ja": "利用可能な配送オプション", "ko": "사용 가능한 배송 옵션", "pt": "Opções de envio disponíveis", "ar": "خيارات الشحن المتاحة"},
    "crossborder.filter.all": {"de": "Alle", "fr": "Tous", "es": "Todos", "ja": "すべて", "ko": "전체", "pt": "Todos", "ar": "الكل"},
    "crossborder.filter.express": {"de": "Internationaler Express", "fr": "Express international", "es": "Exprés internacional", "ja": "国際宅急便", "ko": "국제 특송", "pt": "Expresso internacional", "ar": "بريد سريع دولي"},
    "crossborder.filter.air": {"de": "Luftfracht", "fr": "Fret aérien", "es": "Flete aéreo", "ja": "航空便", "ko": "항공 화물", "pt": "Frete aéreo", "ar": "شحن جوي"},
    "crossborder.filter.sea": {"de": "Seefracht", "fr": "Fret maritime", "es": "Flete marítimo", "ja": "船便", "ko": "해운 화물", "pt": "Frete marítimo", "ar": "شحن بحري"},
    "crossborder.tracking.detail_title": {"de": "🚚 Sendungsverfolgungsdetails", "fr": "🚚 Détails du suivi", "es": "🚚 Detalles del seguimiento", "ja": "🚚 追跡詳細", "ko": "🚚 추적 상세", "pt": "🚚 Detalhes do rastreamento", "ar": "🚚 تفاصيل التتبع"},
    "crossborder.tracking.picked_up": {"de": "Abgeholt", "fr": "Retiré", "es": "Recogido", "ja": "集荷済み", "ko": "수거 완료", "pt": "Coletado", "ar": "تم الاستلام"},
    "crossborder.tracking.in_transit": {"de": "Unterwegs", "fr": "En transit", "es": "En tránsito", "ja": "輸送中", "ko": "운송 중", "pt": "Em trânsito", "ar": "في العبور"},
    "crossborder.tracking.customs": {"de": "Im Zoll", "fr": "En douane", "es": "En aduana", "ja": "通関中", "ko": "통관 중", "pt": "Na alfândega", "ar": "في الجمارك"},
    "crossborder.tracking.delivered": {"de": "Zugestellt", "fr": "Livré", "es": "Entregado", "ja": "配達完了", "ko": "배달 완료", "pt": "Entregue", "ar": "تم التسليم"},
    "crossborder.tariff.title": {"de": "💰 Importzoll- und DDP-Gesamtpreisschätzung", "fr": "💰 Estimation des droits d'importation et du prix total DDP", "es": "💰 Estimación de arancel de importación y precio total DDP", "ja": "💰 関税・DDP合計金額見積もり", "ko": "💰 수입 관세 및 DDP 총액 견적", "pt": "💰 Estimativa de tarifa de importação e preço total DDP", "ar": "💰 تقدير رسوم الاستيراد وسعر DDP الإجمالي"},
    "crossborder.tariff.calc_btn": {"de": "🔍 Zoll und DDP-Gesamtpreis berechnen", "fr": "🔍 Calculer les droits et le prix total DDP", "es": "🔍 Calcular arancel y precio total DDP", "ja": "🔍 関税・DDP合計を計算", "ko": "🔍 관세 및 DDP 총액 계산", "pt": "🔍 Calcular tarifa e preço total DDP", "ar": "🔍 حساب الجمارك وسعر DDP الإجمالي"},
    "crossborder.pkg_tracking.title": {"de": "🚚 Weltweite Paketverfolgung", "fr": "🚚 Suivi de colis mondial", "es": "🚚 Seguimiento de paquetes mundial", "ja": "🚚 グローバル荷物追跡", "ko": "🚚 글로벌 패키지 추적", "pt": "🚚 Rastreamento de pacotes global", "ar": "🚚 تتبع الطرود العالمي"},
    "crossborder.pkg_tracking.search_btn": {"de": "Nachverfolgen", "fr": "Suivre", "es": "Rastrear", "ja": "追跡", "ko": "추적", "pt": "Rastrear", "ar": "تتبع"},
    "crossborder.prohibited.title": {"de": "🚫 Verbotene und eingeschränkte Artikel nach Land", "fr": "🚫 Articles interdits et restreints par pays", "es": "🚫 Artículos prohibidos y restringidos por país", "ja": "🚫 国別禁制品・制限品", "ko": "🚫 국가별 금지 및 제한 품목", "pt": "🚫 Itens proibidos e restritos por país", "ar": "🚫 الممنوعات والمقيدات حسب البلد"},
    "crossborder.partners.title": {"de": "🤝 Spediteurpartner", "fr": "🤝 Transporteurs partenaires", "es": "🤝 Transportistas asociados", "ja": "🤝 配送パートナー", "ko": "🤝 배송 파트너", "pt": "🤝 Transportadoras parceiras", "ar": "🤝 شركاء الشحن"},
    "crossborder.faq.title": {"de": "❓ FAQ", "fr": "❓ FAQ", "es": "❓ Preguntas frecuentes", "ja": "❓ よくある質問", "ko": "❓ 자주 묻는 질문", "pt": "❓ Perguntas frequentes", "ar": "❓ الأسئلة الشائعة"},
    "crossborder.sidebar.recent": {"de": "🧠 Meine letzten Suchen", "fr": "🧠 Mes recherches récentes", "es": "🧠 Mis búsquedas recientes", "ja": "🧠 最近の検索履歴", "ko": "🧠 최근 검색", "pt": "🧠 Minhas buscas recentes", "ar": "🧠 بحثي الأخير"},
    "crossborder.sidebar.tracking_list": {"de": "📮 Beobachtungsliste", "fr": "📮 Liste d'observation", "es": "📮 Lista de seguimiento", "ja": "📮 ウォッチリスト", "ko": "📮 관찰 목록", "pt": "📮 Lista de observação", "ar": "📮 قائمة المراقبة"},
    "crossborder.sidebar.time_compare": {"de": "⏰ Live-Zeitvergleich", "fr": "⏰ Comparaison d'heure en direct", "es": "⏰ Comparación de hora en vivo", "ja": "⏰ リアルタイム時刻比較", "ko": "⏰ 실시간 시간 비교", "pt": "⏰ Comparação de horário ao vivo", "ar": "⏰ مقارنة الوقت المباشرة"},
    "crossborder.faq.q1": {"de": "Was ist der Unterschied zwischen DDP und DDU?", "fr": "Quelle est la différence entre DDP et DDU ?", "es": "¿Cuál es la diferencia entre DDP y DDU?", "ja": "DDPとDDUの違いは？", "ko": "DDP와 DDU의 차이는?", "pt": "Qual a diferença entre DDP e DDU?", "ar": "ما الفرق بين DDP وDDU؟"},
    "crossborder.faq.q2": {"de": "Wie wird das Volumengewicht berechnet? Warum wird mein Paket nach Volumengewicht abgerechnet?", "fr": "Comment le poids volumétrique est-il calculé ? Pourquoi mon colis est-il facturé au poids volumétrique ?", "es": "¿Cómo se calcula el peso volumétrico? ¿Por qué se cobra por peso volumétrico?", "ja": "容積重量の計算方法は？容積重量で課金される理由は？", "ko": "용적 중량은 어떻게 계산되나요? 왜 용적 중량으로 과금되나요?", "pt": "Como o peso volumétrico é calculado? Por que meu pacote é cobrado pelo peso volumétrico?", "ar": "كيف يُحسب الوزن الحجمي؟ لماذا يُفوتر شحنتي بناءً على الوزن الحجمي؟"},
    "crossborder.faq.q3": {"de": "Wie viel sollte ich als Wert deklarieren?", "fr": "Combien dois-je déclarer comme valeur ?", "es": "¿Cuánto debo declarar como valor?", "ja": "申告価値はいくらにすべきですか？", "ko": "얼마로 신고 가치를 선언해야 하나요?", "pt": "Quanto devo declarar como valor?", "ar": "كم يجب أن أعلن كقيمة؟"},
    "crossborder.faq.q4": {"de": "Welche Artikel sind absolut vom Versand ausgeschlossen?", "fr": "Quels articles sont absolument interdits d'expédition ?", "es": "¿Qué artículos están absolutamente prohibidos de enviar?", "ja": "絶対に発送できない品物は？", "ko": "어떤 품목이 절대 발송 금지인가요?", "pt": "Quais itens são absolutamente proibidos de enviar?", "ar": "ما هي المواد المحظورة تماماً من الشحن؟"},
    # ========== api & pro (2 keys) ==========
    "api.h1": {"de": "⚡ GlobeTimeZone API", "fr": "⚡ GlobeTimeZone API", "es": "⚡ GlobeTimeZone API", "ja": "⚡ GlobeTimeZone API", "ko": "⚡ GlobeTimeZone API", "pt": "⚡ GlobeTimeZone API", "ar": "⚡ GlobeTimeZone API"},
    "pro.h1": {"de": "🚀 GlobeTimeZone Pro", "fr": "🚀 GlobeTimeZone Pro", "es": "🚀 GlobeTimeZone Pro", "ja": "🚀 GlobeTimeZone Pro", "ko": "🚀 GlobeTimeZone Pro", "pt": "🚀 GlobeTimeZone Pro", "ar": "🚀 GlobeTimeZone Pro"},
}

# ----- Part 2 translations (pricing 82 + blog 34 + privacy 46 + xb/hk remaining) -----
PART2 = {
    # ======== pricing.hero.badge ========
    "pricing.hero.badge": {"de": "GlobeTimeZone PRO", "fr": "GlobeTimeZone PRO", "es": "GlobeTimeZone PRO", "ja": "GlobeTimeZone PRO", "ko": "GlobeTimeZone PRO", "pt": "GlobeTimeZone PRO", "ar": "GlobeTimeZone PRO"},
    "pricing.hero.h1": {"de": "Der Preis eines Kaffees für ein Jahr Produktivität", "fr": "Le prix d'un café pour une année de productivité", "es": "El precio de un café por un año de productividad", "ja": "コーヒー1杯の値段で1年間の生産性向上", "ko": "커피 한 잔 가격으로 1년의 생산성", "pt": "O preço de um café por um ano de produtividade", "ar": "ثمن كوب قهوة، لسنة من الإنتاجية"},
    "pricing.hero.subtitle": {"de": "Keine Werbung, unbegrenzte Besprechungsplanung, Team-Uhren, intelligente Erinnerungen — Upgrade Ihrer globalen Zeitverwaltung auf Profi-Niveau", "fr": "Sans publicité, planification de réunions illimitée, horloges d'équipe, rappels intelligents — passez votre gestion du temps au niveau professionnel", "es": "Sin anuncios, planificación ilimitada, relojes de equipo, recordatorios inteligentes — actualice su gestión horaria al nivel profesional", "ja": "広告なし、無制限の会議計画、チーム時計、スマートリマインダー — グローバル時間管理をプロレベルへ", "ko": "광고 없음, 무제한 회의 계획, 팀 시계, 스마트 알림 — 글로벌 시간 관리를 프로 수준으로 업그레이드", "pt": "Sem anúncios, planejamento ilimitado, relógios de equipe, lembretes inteligentes — eleve sua gestão de tempo ao nível profissional", "ar": "بدون إعلانات، تخطيط اجتماعات غير محدود، ساعات الفريق، تذكيرات ذكية — ارتقِ بإدارة وقتك العالمية إلى المستوى المهني"},
    "pricing.hero.stat1": {"de": "Werbeunterbrechungen", "fr": "Interruptions publicitaires", "es": "Interrupciones publicitarias", "ja": "広告の中断", "ko": "광고 방해", "pt": "Interrupções de anúncios", "ar": "إعلانات مزعجة"},
    "pricing.hero.stat2": {"de": "Besprechungsteilnehmer", "fr": "Participants aux réunions", "es": "Participantes de reunión", "ja": "会議参加者", "ko": "회의 참가자", "pt": "Participantes de reunião", "ar": "مشاركون الاجتماع"},
    "pricing.hero.stat3": {"de": "Zeitzonen-Erinnerungen", "fr": "Rappels de fuseau horaire", "es": "Recordatorios de zona horaria", "ja": "タイムゾーンリマインダー", "ko": "시간대 알림", "pt": "Lembretes de fuso horário", "ar": "تذكيرات المنطقة الزمنية"},
    "pricing.hero.stat4": {"de": "Prioritäts-Support", "fr": "Support prioritaire", "es": "Soporte prioritario", "ja": "優先サポート", "ko": "우선 지원", "pt": "Suporte prioritário", "ar": "دعم ذو أولوية"},
    "pricing.plan.free": {"de": "Kostenlos", "fr": "Gratuit", "es": "Gratis", "ja": "無料", "ko": "무료", "pt": "Gratuito", "ar": "مجاني"},
    "pricing.plan.free_price": {"de": "Kostenlos<span class=\"pr-price-cycle\">/für immer</span>", "fr": "Gratuit<span class=\"pr-price-cycle\">/pour toujours</span>", "es": "Gratis<span class=\"pr-price-cycle\">/para siempre</span>", "ja": "無料<span class=\"pr-price-cycle\">/ずっと</span>", "ko": "무료<span class=\"pr-price-cycle\">/영구</span>", "pt": "Gratuito<span class=\"pr-price-cycle\">/para sempre</span>", "ar": "مجاني<span class=\"pr-price-cycle\">/للأبد</span>"},
    "pricing.plan.current": {"de": "Aktueller Plan", "fr": "Plan actuel", "es": "Plan actual", "ja": "現在のプラン", "ko": "현재 플랜", "pt": "Plano atual", "ar": "الخطة الحالية"},
    "pricing.plan.pro": {"de": "PRO", "fr": "PRO", "es": "PRO", "ja": "PRO", "ko": "PRO", "pt": "PRO", "ar": "PRO"},
    "pricing.compare.title": {"de": "Funktionsvergleich", "fr": "Comparaison des fonctionnalités", "es": "Comparación de funciones", "ja": "機能比較", "ko": "기능 비교", "pt": "Comparação de recursos", "ar": "مقارنة الميزات"},
    "pricing.specials.title": {"de": "PRO-exklusive Vorteile", "fr": "Avantages exclusifs PRO", "es": "Beneficios exclusivos PRO", "ja": "PRO専用特典", "ko": "PRO 전용 혜택", "pt": "Benefícios exclusivos PRO", "ar": "مزايا PRO الحصرية"},
    "pricing.cta.title": {"de": "3,99 $/Monat — Weniger als ein Kaffee", "fr": "3,99 $/mois — Moins qu'un café", "es": "3,99 $/mes — Menos que un café", "ja": "月額$3.99 — コーヒーより安い", "ko": "월 3.99달러 — 커피 한 잔보다 저렴", "pt": "3,99 $/mês — Menos que um café", "ar": "3.99$/شهر — أرخص من كوب قهوة"},
    "pricing.faq.title": {"de": "FAQ", "fr": "FAQ", "es": "Preguntas frecuentes", "ja": "よくある質問", "ko": "자주 묻는 질문", "pt": "Perguntas frequentes", "ar": "الأسئلة الشائعة"},
    "blog.hero.h1": {"de": "📖 Zeitzonen-Tutorials & Leitfäden", "fr": "📖 Tutoriels et guides sur les fuseaux horaires", "es": "📖 Tutoriales y guías de zonas horarias", "ja": "📖 タイムゾーンチュートリアル＆ガイド", "ko": "📖 시간대 튜토리얼 및 가이드", "pt": "📖 Tutoriais e guias de fuso horário", "ar": "📖 دروس وأدلة المناطق الزمنية"},
    "blog.hero.subtitle": {"de": "Von UTC-Grundlagen bis zur grenzüberschreitenden Besprechungsplanung — ein tiefes Zeitzonen-Wissenszentrum für grenzüberschreitende Arbeiter, Remote-Teams und Globetrotter.", "fr": "Des bases UTC aux planifications de réunions transfrontalières — une profonde base de connaissances sur les fuseaux horaires pour les travailleurs transfrontaliers, les équipes à distance et les voyageurs du monde.", "es": "Desde conceptos básicos de UTC hasta la planificación de reuniones transfronterizas — una base de conocimiento profunda sobre zonas horarias para trabajadores transfronterizos, equipos remotos y viajeros globales.", "ja": "UTC基礎から越境会議のスケジューリングまで — 越境ワーカー、リモートチーム、グローバルトラベラーのための深いタイムゾーン知識ベース。", "ko": "UTC 기초부터 크로스보더 회의 일정까지 — 크로스보더 근로자, 원격 팀, 글로벌 여행자를 위한 심층 시간대 지식 베이스.", "pt": "Do básico de UTC ao agendamento de reuniões transfronteiriças — uma profunda base de conhecimento sobre fusos horários para trabalhadores transfronteiriços, equipes remotas e viajantes globais.", "ar": "من أساسيات UTC إلى تخطيط اجتماعات عبر الحدود — قاعدة معرفية عميقة للمناطق الزمنية للعمالين عبر الحدود والفرق عن بُعد والمسافرين العالميين."},
    "blog.cat.all": {"de": "Alle", "fr": "Tous", "es": "Todos", "ja": "すべて", "ko": "전체", "pt": "Todos", "ar": "الكل"},
    "blog.cat.basics": {"de": "🟢 Grundlagen", "fr": "🟢 Bases", "es": "🟢 Básicos", "ja": "🟢 基礎", "ko": "🟢 기초", "pt": "🟢 Básico", "ar": "🟢 الأساسيات"},
    "blog.cat.guide": {"de": "🟣 Leitfäden", "fr": "🟣 Guides", "es": "🟣 Guías", "ja": "🟣 ガイド", "ko": "🟣 가이드", "pt": "🟣 Guias", "ar": "🟣 الأدلة"},
    "blog.cat.tips": {"de": "🔵 Tipps", "fr": "🔵 Conseils", "es": "🔵 Consejos", "ja": "🔵 ヒント", "ko": "🔵 팁", "pt": "🔵 Dicas", "ar": "🔵 نصائح"},
    "blog.cat.api": {"de": "🔴 API", "fr": "🔴 API", "es": "🔴 API", "ja": "🔴 API", "ko": "🔴 API", "pt": "🔴 API", "ar": "🔴 API"},
    "blog.cta.title": {"de": "📬 Neueste Zeitzonen-Tipps erhalten", "fr": "📬 Recevez les derniers conseils sur les fuseaux horaires", "es": "📬 Reciba los últimos consejos de zonas horarias", "ja": "📬 最新のタイムゾーンのヒントを受け取る", "ko": "📬 최신 시간대 팁 받기", "pt": "📬 Receba as últimas dicas de fuso horário", "ar": "📬 احصل على أحدث نصائح المناطق الزمنية"},
    "blog.cta.subtitle": {"de": "Wöchentlich ein kuratierter Artikel, der grenzüberschreitende Arbeiter dabei hilft, Zeit besser zu managen.", "fr": "Un article sélectionné par semaine pour aider les travailleurs transfrontaliers à mieux gérer leur temps.", "es": "Un artículo curado por semana para ayudar a los trabajadores transfronterizos a gestionar mejor su tiempo.", "ja": "毎週1本の厳選記事で、越境ワーカーの時間管理をお手伝い。", "ko": "매주 엄선된 기사 하나로, 크로스보더 근로자의 시간 관리를 도와드립니다.", "pt": "Um artigo curado por semana para ajudar trabalhadores transfronteiriços a gerenciar melhor seu tempo.", "ar": "مقال واحد منتقى أسبوعيًا، لمساعدة العاملين عبر الحدود على إدارة وقتهم بشكل أفضل."},
    "blog.cta.subscribe": {"de": "Abonnieren", "fr": "S'abonner", "es": "Suscribirse", "ja": "購読する", "ko": "구독", "pt": "Inscrever-se", "ar": "إشترك"},
    "privacy.breadcrumb": {"de": "Datenschutzrichtlinie", "fr": "Politique de confidentialité", "es": "Política de privacidad", "ja": "プライバシーポリシー", "ko": "개인정보 보호정책", "pt": "Política de privacidade", "ar": "سياسة الخصوصية"},
    "pricing.special.0.title": {"de": "Werbefreies Erlebnis", "fr": "Expérience sans publicité", "es": "Experiencia sin anuncios", "ja": "広告なし体験", "ko": "광고 없는 환경", "pt": "Experiência sem anúncios", "ar": "تجربة بدون إعلانات"},
    "pricing.special.1.title": {"de": "Team-Uhren", "fr": "Horloges d'équipe", "es": "Relojes de equipo", "ja": "チーム時計", "ko": "팀 시계", "pt": "Relógios de equipe", "ar": "ساعات الفريق"},
    "pricing.special.2.title": {"de": "Unbegrenzte intelligente Erinnerungen", "fr": "Rappels intelligents illimités", "es": "Recordatorios inteligentes ilimitados", "ja": "無制限スマートリマインダー", "ko": "무제한 스마트 알림", "pt": "Lembretes inteligentes ilimitados", "ar": "تذكيرات ذكية غير محدودة"},
    "pricing.special.3.title": {"de": "Unbegrenzte Besprechungsplanung", "fr": "Planification de réunions illimitée", "es": "Planificación de reuniones ilimitada", "ja": "無制限会議計画", "ko": "무제한 회의 계획", "pt": "Planejamento de reuniões ilimitado", "ar": "تخطيط اجتماعات غير محدود"},
    "pricing.special.4.title": {"de": "Angeheftete Städte anpassen", "fr": "Villes épinglées personnalisées", "es": "Ciudades fijadas personalizadas", "ja": "カスタムピン留め都市", "ko": "커스텀 고정 도시", "pt": "Cidades fixadas personalizadas", "ar": "مدن مثبتة مخصصة"},
    "pricing.special.5.title": {"de": "Datenexport", "fr": "Export de données", "es": "Exportación de datos", "ja": "データエクスポート", "ko": "데이터 내보내기", "pt": "Exportação de dados", "ar": "تصدير البيانات"},
    "pricing.special.6.title": {"de": "Dunkles Design", "fr": "Thème sombre", "es": "Tema oscuro", "ja": "ダークテーマ", "ko": "다크 테마", "pt": "Tema escuro", "ar": "الوضع الداكن"},
    "pricing.special.7.title": {"de": "API-Prioritätszugang", "fr": "Accès prioritaire API", "es": "Acceso prioritario a API", "ja": "API優先アクセス", "ko": "API 우선 액세스", "pt": "Acesso prioritário à API", "ar": "وصول ذو أولوية للواجهة"},
    "pricing.cmp.col_feature": {"de": "Funktion", "fr": "Fonctionnalité", "es": "Función", "ja": "機能", "ko": "기능", "pt": "Recurso", "ar": "الميزة"},
    "pricing.cmp.col_free": {"de": "Kostenlos", "fr": "Gratuit", "es": "Gratis", "ja": "無料", "ko": "무료", "pt": "Gratuito", "ar": "مجاني"},
    "pricing.cmp.col_pro": {"de": "PRO", "fr": "PRO", "es": "PRO", "ja": "PRO", "ko": "PRO", "pt": "PRO", "ar": "PRO"},
    "xb.carrier.dhl": {"de": "DHL Internationaler Express", "fr": "DHL Express International", "es": "DHL Express Internacional", "ja": "DHL国際エクスプレス", "ko": "DHL 국제 특송", "pt": "DHL Expresso Internacional", "ar": "DHL إكسبريس الدولي"},
    "xb.carrier.ups": {"de": "UPS Internationaler Express", "fr": "UPS Express International", "es": "UPS Express Internacional", "ja": "UPS国際エクスプレス", "ko": "UPS 국제 특송", "pt": "UPS Expresso Internacional", "ar": "UPS إكسبريس الدولي"},
    "xb.carrier.fedex": {"de": "FedEx International", "fr": "FedEx International", "es": "FedEx Internacional", "ja": "FedEx国際", "ko": "FedEx 국제", "pt": "FedEx Internacional", "ar": "FedEx الدولي"},
    "xb.carrier.tnt": {"de": "TNT Internationaler Express", "fr": "TNT Express International", "es": "TNT Express Internacional", "ja": "TNT国際エクスプレス", "ko": "TNT 국제 특송", "pt": "TNT Expresso Internacional", "ar": "TNT إكسبريس الدولي"},
    "xb.carrier.ems": {"de": "EMS Internationaler Expressversand", "fr": "EMS Express International", "es": "EMS Express Internacional", "ja": "EMS国際エクスプレス", "ko": "EMS 국제 특송", "pt": "EMS Expresso Internacional", "ar": "EMS إكسبريس الدولي"},
    "xb.carrier.fba.name": {"de": "Amazon FBA", "fr": "Amazon FBA", "es": "Amazon FBA", "ja": "Amazon FBA", "ko": "Amazon FBA", "pt": "Amazon FBA", "ar": "Amazon FBA"},
    "xb.cty.JP": {"de": "Japan", "fr": "Japon", "es": "Japón", "ja": "日本", "ko": "일본", "pt": "Japão", "ar": "اليابان"},
    "xb.hs.phone": {"de": "Smartphone", "fr": "Smartphone", "es": "Teléfono inteligente", "ja": "スマートフォン", "ko": "스마트폰", "pt": "Smartphone", "ar": "هاتف ذكي"},
    "xb.origin.shenzhen": {"de": "Shenzhen", "fr": "Shenzhen", "es": "Shenzhen", "ja": "深セン", "ko": "선전", "pt": "Shenzhen", "ar": "شنتشن"},
    "xb.origin.guangzhou": {"de": "Guangzhou", "fr": "Guangzhou", "es": "Guangzhou", "ja": "広州", "ko": "광저우", "pt": "Guangzhou", "ar": "قوانغتشو"},
    "xb.origin.yiwu": {"de": "Yiwu", "fr": "Yiwu", "es": "Yiwu", "ja": "義烏", "ko": "이우", "pt": "Yiwu", "ar": "ييوو"},
    "xb.origin.shanghai": {"de": "Shanghai", "fr": "Shanghai", "es": "Shanghai", "ja": "上海", "ko": "상하이", "pt": "Xangai", "ar": "شنغهاي"},
    "xb.origin.ningbo": {"de": "Ningbo", "fr": "Ningbo", "es": "Ningbo", "ja": "寧波", "ko": "닝보", "pt": "Ningbo", "ar": "نينغبو"},
    "xb.origin.qingdao": {"de": "Qingdao", "fr": "Qingdao", "es": "Qingdao", "ja": "青島", "ko": "칭다오", "pt": "Qingdao", "ar": "تشينغدو"},
    "xb.result.transit": {"de": "Transit ", "fr": "Transit ", "es": "Tránsito ", "ja": "輸送 ", "ko": "운송 ", "pt": "Trânsito ", "ar": "عبور "},
    "xb.type.express": {"de": "Express", "fr": "Express", "es": "Exprés", "ja": "エクスプレス", "ko": "특송", "pt": "Expresso", "ar": "بريد سريع"},
    "hk.countdown.in_days": {"de": " in ", "fr": " dans ", "es": " en ", "ja": "あと", "ko": " ", "pt": " em ", "ar": " في "},
    "hk.countdown.days": {"de": " Tage", "fr": " jours", "es": " días", "ja": "日", "ko": "일", "pt": " dias", "ar": " يوم"},
    "hk.share.to": {"de": " → ", "fr": " → ", "es": " → ", "ja": " → ", "ko": " → ", "pt": " → ", "ar": " ← "},
    "hk.share.yuan": {"de": "\n", "fr": "\n", "es": "\n", "ja": "\n", "ko": "\n", "pt": "\n", "ar": "\n"},
}

# Merge all translations
ALL_TRANSLATIONS = {}
ALL_TRANSLATIONS.update(PART1)
ALL_TRANSLATIONS.update(PART2)

# Load PART3 from JSON
PART3_PATH = os.path.join(os.path.dirname(__file__), 'translations_part3.json')
if os.path.exists(PART3_PATH):
    with open(PART3_PATH, 'r', encoding='utf-8') as f:
        PART3 = json.load(f)
    ALL_TRANSLATIONS.update(PART3)
    print(f'Loaded PART3: {len(PART3)} keys')
else:
    print(f'PART3 not found: {PART3_PATH}')

# ============================================================
# Apply translations
# ============================================================

def apply_translations():
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

        for key, translations in ALL_TRANSLATIONS.items():
            if key not in data:
                # Key doesn't exist in this locale, skip
                skipped += 1
                continue
            if lang not in translations:
                skipped += 1
                continue
            # Only update if current value equals English (fallback)
            if data[key] == en.get(key, ''):
                data[key] = translations[lang]
                updated += 1
            else:
                skipped += 1

        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            # Fix trailing newline
            f.write('\n')

        stats[lang] = updated
        print(f'✅ {lang}.json: {updated} keys translated, {skipped} skipped')

    print('\n=== Summary ===')
    for lang, count in stats.items():
        print(f'  {lang}: {count} keys updated')
    print('Done!')

if __name__ == '__main__':
    apply_translations()
