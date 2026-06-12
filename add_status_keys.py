#!/usr/bin/env python3
"""在9种 locale JSON 里添加自定义城市状态标签的翻译键，并添加 mp.city.* country 翻译键"""
import json
import os

LOCALES_DIR = r'C:\Users\ASUS\WorkBuddy\Claw\globetimezone\locales'

# 状态标签翻译（对应 custom-cities.js 里的7段状态）
STATUS_TRANSLATIONS = {
    'en': {
        'custom.status.sleep': 'Deep Sleep',
        'custom.status.morning': 'Do Not Disturb',
        'custom.status.working': 'Prime Hours',
        'custom.status.lunch': 'Lunch Break',
        'custom.status.off': 'End of Day',
        'custom.status.night': 'Personal Time',
        'custom.status.offhours': 'Off Hours',
        # country names for cards
        'custom.country.China': 'China',
        'custom.country.Japan': 'Japan',
        'custom.country.SouthKorea': 'S. Korea',
        'custom.country.Singapore': 'Singapore',
        'custom.country.UK': 'UK',
        'custom.country.France': 'France',
        'custom.country.Germany': 'Germany',
        'custom.country.Russia': 'Russia',
        'custom.country.USA': 'USA',
        'custom.country.Canada': 'Canada',
        'custom.country.Australia': 'Australia',
    },
    'zh': {
        'custom.status.sleep': '深度睡眠',
        'custom.status.morning': '清晨勿扰',
        'custom.status.working': '黄金工作',
        'custom.status.lunch': '午休低响',
        'custom.status.off': '即将下班',
        'custom.status.night': '私人时间',
        'custom.status.offhours': '非工作时段',
        'custom.country.China': '中国',
        'custom.country.Japan': '日本',
        'custom.country.SouthKorea': '韩国',
        'custom.country.Singapore': '新加坡',
        'custom.country.UK': '英国',
        'custom.country.France': '法国',
        'custom.country.Germany': '德国',
        'custom.country.Russia': '俄罗斯',
        'custom.country.USA': '美国',
        'custom.country.Canada': '加拿大',
        'custom.country.Australia': '澳大利亚',
    },
    'de': {
        'custom.status.sleep': 'Tiefschlaf',
        'custom.status.morning': 'Ruhezeit',
        'custom.status.working': 'Hauptarbeitszeit',
        'custom.status.lunch': 'Mittagspause',
        'custom.status.off': 'Feierabend',
        'custom.status.night': 'Privatzeit',
        'custom.status.offhours': 'Außerhalb der Arbeitszeit',
        'custom.country.China': 'China',
        'custom.country.Japan': 'Japan',
        'custom.country.SouthKorea': 'Südkorea',
        'custom.country.Singapore': 'Singapur',
        'custom.country.UK': 'Großbritannien',
        'custom.country.France': 'Frankreich',
        'custom.country.Germany': 'Deutschland',
        'custom.country.Russia': 'Russland',
        'custom.country.USA': 'USA',
        'custom.country.Canada': 'Kanada',
        'custom.country.Australia': 'Australien',
    },
    'fr': {
        'custom.status.sleep': 'Sommeil profond',
        'custom.status.morning': 'Ne pas déranger',
        'custom.status.working': 'Heures dorées',
        'custom.status.lunch': 'Pause déjeuner',
        'custom.status.off': 'Fin de journée',
        'custom.status.night': 'Temps personnel',
        'custom.status.offhours': 'Hors heures',
        'custom.country.China': 'Chine',
        'custom.country.Japan': 'Japon',
        'custom.country.SouthKorea': 'Corée du Sud',
        'custom.country.Singapore': 'Singapour',
        'custom.country.UK': 'Royaume-Uni',
        'custom.country.France': 'France',
        'custom.country.Germany': 'Allemagne',
        'custom.country.Russia': 'Russie',
        'custom.country.USA': 'États-Unis',
        'custom.country.Canada': 'Canada',
        'custom.country.Australia': 'Australie',
    },
    'es': {
        'custom.status.sleep': 'Sueño profundo',
        'custom.status.morning': 'No molestar',
        'custom.status.working': 'Horas de oro',
        'custom.status.lunch': 'Hora del almuerzo',
        'custom.status.off': 'Fin de jornada',
        'custom.status.night': 'Tiempo personal',
        'custom.status.offhours': 'Fuera de horario',
        'custom.country.China': 'China',
        'custom.country.Japan': 'Japón',
        'custom.country.SouthKorea': 'Corea del Sur',
        'custom.country.Singapore': 'Singapur',
        'custom.country.UK': 'Reino Unido',
        'custom.country.France': 'Francia',
        'custom.country.Germany': 'Alemania',
        'custom.country.Russia': 'Rusia',
        'custom.country.USA': 'EE.UU.',
        'custom.country.Canada': 'Canadá',
        'custom.country.Australia': 'Australia',
    },
    'ja': {
        'custom.status.sleep': '深夜就寝',
        'custom.status.morning': '起床準備',
        'custom.status.working': '稼働時間',
        'custom.status.lunch': '昼休み',
        'custom.status.off': '退勤前',
        'custom.status.night': 'プライベート',
        'custom.status.offhours': '時間外',
        'custom.country.China': '中国',
        'custom.country.Japan': '日本',
        'custom.country.SouthKorea': '韓国',
        'custom.country.Singapore': 'シンガポール',
        'custom.country.UK': 'イギリス',
        'custom.country.France': 'フランス',
        'custom.country.Germany': 'ドイツ',
        'custom.country.Russia': 'ロシア',
        'custom.country.USA': 'アメリカ',
        'custom.country.Canada': 'カナダ',
        'custom.country.Australia': 'オーストラリア',
    },
    'ko': {
        'custom.status.sleep': '수면 중',
        'custom.status.morning': '방해 금지',
        'custom.status.working': '업무 시간',
        'custom.status.lunch': '점심시간',
        'custom.status.off': '퇴근 준비',
        'custom.status.night': '개인 시간',
        'custom.status.offhours': '업무 외',
        'custom.country.China': '중국',
        'custom.country.Japan': '일본',
        'custom.country.SouthKorea': '한국',
        'custom.country.Singapore': '싱가포르',
        'custom.country.UK': '영국',
        'custom.country.France': '프랑스',
        'custom.country.Germany': '독일',
        'custom.country.Russia': '러시아',
        'custom.country.USA': '미국',
        'custom.country.Canada': '캐나다',
        'custom.country.Australia': '호주',
    },
    'pt': {
        'custom.status.sleep': 'Sono profundo',
        'custom.status.morning': 'Não perturbar',
        'custom.status.working': 'Horas de pico',
        'custom.status.lunch': 'Almoço',
        'custom.status.off': 'Fim do expediente',
        'custom.status.night': 'Tempo pessoal',
        'custom.status.offhours': 'Fora do horário',
        'custom.country.China': 'China',
        'custom.country.Japan': 'Japão',
        'custom.country.SouthKorea': 'Coreia do Sul',
        'custom.country.Singapore': 'Singapura',
        'custom.country.UK': 'Reino Unido',
        'custom.country.France': 'França',
        'custom.country.Germany': 'Alemanha',
        'custom.country.Russia': 'Rússia',
        'custom.country.USA': 'EUA',
        'custom.country.Canada': 'Canadá',
        'custom.country.Australia': 'Austrália',
    },
    'ar': {
        'custom.status.sleep': 'نوم عميق',
        'custom.status.morning': 'عدم الإزعاج',
        'custom.status.working': 'أوقات الذروة',
        'custom.status.lunch': 'استراحة الغداء',
        'custom.status.off': 'نهاية العمل',
        'custom.status.night': 'وقت شخصي',
        'custom.status.offhours': 'خارج أوقات العمل',
        'custom.country.China': 'الصين',
        'custom.country.Japan': 'اليابان',
        'custom.country.SouthKorea': 'كوريا الجنوبية',
        'custom.country.Singapore': 'سنغافورة',
        'custom.country.UK': 'المملكة المتحدة',
        'custom.country.France': 'فرنسا',
        'custom.country.Germany': 'ألمانيا',
        'custom.country.Russia': 'روسيا',
        'custom.country.USA': 'الولايات المتحدة',
        'custom.country.Canada': 'كندا',
        'custom.country.Australia': 'أستراليا',
    },
}

for lang, new_keys in STATUS_TRANSLATIONS.items():
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
    
    if added:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'[OK] {lang}: added {len(added)} keys')
    else:
        print(f'[NO-CHANGE] {lang}')

print('Done.')
