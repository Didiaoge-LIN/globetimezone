// City page HTML template renderer
// Used by functions/city/[slug].js and functions/[[path]].js
// Supports lang parameter for i18n rendering

const REFERENCE_CITIES = [
  { n: '北京', ne: 'Beijing', tz: 'Asia/Shanghai', o: 8 },
  { n: '纽约', ne: 'New York', tz: 'America/New_York', o: -5 },
  { n: '伦敦', ne: 'London', tz: 'Europe/London', o: 0 },
  { n: '东京', ne: 'Tokyo', tz: 'Asia/Tokyo', o: 9 },
  { n: '悉尼', ne: 'Sydney', tz: 'Australia/Sydney', o: 10 },
  { n: '迪拜', ne: 'Dubai', tz: 'Asia/Dubai', o: 4 },
  { n: '莫斯科', ne: 'Moscow', tz: 'Europe/Moscow', o: 3 },
  { n: '洛杉矶', ne: 'Los Angeles', tz: 'America/Los_Angeles', o: -8 },
];

// ═══════ i18n 翻译映射 ═══════
const I18N = {
  en: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    title: (c) => `${c.ne} Time - Current Time, Time Difference, DST | GlobeTimeZone`,
    desc: (c) => `Check current time in ${c.ne} accurate to the second. Compare time difference with Beijing, New York, London, Tokyo, Sydney. Best business contact hours, DST dates. GlobeTimeZone covers 200+ cities.`,
    keywords: (c) => `${c.ne} time, ${c.ne} time difference, ${c.ne} current time, ${c.ne} DST, ${c.ne} timezone`,
    ogTitle: (c, os) => `${c.ne} Current Time - ${os} Timezone | GlobeTimeZone`,
    ogDesc: (c) => `Live ${c.ne} time, time difference with 8 major cities, best business hours, DST info.`,
    twTitle: (c, os) => `${c.ne} Current Time - ${os}`,
    twDesc: (c) => `Live ${c.ne} time, time difference comparison, best contact hours.`,
    breadcrumb1: 'Home',
    breadcrumb2: 'City Time',
    breadcrumb3: (c) => `${c.ne} Time`,
    heroH1: (c, os) => `${c.ne} Current Time <small style="font-size:0.45em;color:var(--text-secondary);font-weight:400;">${os}</small>`,
    heroBadge: (c) => `${c.ne} \u00b7 ${c.c}`,
    sectionTimeDiff: (c) => `Time Difference: ${c.ne} & Major Cities`,
    thCity: 'City',
    thDiff: 'Time Difference',
    thStatus: 'Current Status',
    diffSame: '0 (Same)',
    diffHours: (d) => `${d > 0 ? '+' : ''}${d} hour${Math.abs(d) !== 1 ? 's' : ''}`,
    sectionContact: (c) => `Best Time to Contact ${c.ne}`,
    cardBiz: '📞 Business Hours',
    cardPersonal: '💬 Personal Time',
    sectionTzInfo: (c) => `${c.ne} Timezone Info`,
    labelTzName: 'Timezone Name:',
    labelIana: 'IANA Identifier:',
    labelUtc: 'UTC Offset:',
    labelDst: 'Daylight Saving:',
    labelDstStart: 'DST Starts:',
    labelDstEnd: 'DST Ends:',
    labelDstClock: 'Clock Adjustment:',
    labelCountry: 'Country:',
    dstYes: 'Yes',
    dstNo: 'No',
    dstClock: 'Clock forward 1 hour',
    sectionFaq: (c) => `FAQ about ${c.ne} Time`,
    sectionRelated: 'Other Popular City Times',
    navTimeDiff: 'Time Difference',
    navMeeting: 'Meeting Planner',
    navCrossBorder: 'Cross-border Tools',
    navBlog: 'Blog',
    navPro: 'Upgrade PRO',
    footerAbout: 'About',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Service',
    footerContact: 'Contact Us',
    footerCopy: '\u00a9 2026 GlobeTimeZone \u00b7 All time data NTP-calibrated \u00b7 Timezone data from IANA',
    statusWorking: '\ud83d\udfe3 Working Hours',
    statusMorning: '\ud83d\udfe1 Morning',
    statusPersonal: '\ud83d\udfe1 Personal Time',
    statusEvening: '\ud83d\udfe1 Evening',
    statusPrepSleep: '\ud83d\udd35 Preparing for Sleep',
    statusDeepSleep: '\ud83d\ude34 Deep Sleep',
    clockLocale: 'en-US',
    dateLocale: 'en-US',
    skipLink: 'Skip to main content',
    mainNav: 'Main navigation',
    breadcrumbAria: 'Breadcrumb',
  },
  zh: {
    htmlLang: 'zh',
    ogLocale: 'zh_CN',
    title: (c) => `${c.n}时间 - 现在几点、时差查询、夏令时 | GlobeTimeZone`,
    desc: (c) => `实时查询${c.n}当前时间，精准到秒。查看${c.n}与北京、纽约、伦敦、东京、悉尼的时差对比，最佳商务联系时间，夏令时切换日期。GlobeTimeZone提供全球200+城市实时时间查询。`,
    keywords: (c) => `${c.n}时间, ${c.n}时差, ${c.n}现在几点, ${c.n}夏令时, ${c.ne} time`,
    ogTitle: (c, os) => `${c.n}现在几点 - ${os}时区实时时间 | GlobeTimeZone`,
    ogDesc: (c) => `实时查看${c.n}当前时间、与全球8大城市时差对比、最佳商务联系时段、夏令时信息。`,
    twTitle: (c, os) => `${c.n}现在几点 - ${os}`,
    twDesc: (c) => `实时查看${c.n}当前时间、时差对比、最佳联系时段。`,
    breadcrumb1: '首页',
    breadcrumb2: '城市时间',
    breadcrumb3: (c) => `${c.n}时间`,
    heroH1: (c, os) => `${c.n}现在时间 <small style="font-size:0.45em;color:var(--text-secondary);font-weight:400;">${os}</small>`,
    heroBadge: (c) => `${c.n} \u00b7 ${c.c}`,
    sectionTimeDiff: (c) => `${c.n}与全球主要城市时差`,
    thCity: '城市',
    thDiff: '时差',
    thStatus: '当前状态',
    diffSame: '0（相同）',
    diffHours: (d) => `${d > 0 ? '+' : ''}${d}小时`,
    sectionContact: (c) => `联系${c.n}的最佳时间`,
    cardBiz: '📞 商务联系',
    cardPersonal: '💬 亲友联系',
    sectionTzInfo: (c) => `${c.n}时区信息`,
    labelTzName: '时区名称：',
    labelIana: 'IANA标识：',
    labelUtc: 'UTC偏移：',
    labelDst: '夏令时：',
    labelDstStart: '夏令时开始：',
    labelDstEnd: '夏令时结束：',
    labelDstClock: '夏令时拨钟：',
    labelCountry: '所属国家：',
    dstYes: '实行',
    dstNo: '不实行',
    dstClock: '拨快1小时',
    sectionFaq: (c) => `关于${c.n}时间的常见问题`,
    sectionRelated: '其他热门城市时间',
    navTimeDiff: '时差查询',
    navMeeting: '会议规划',
    navCrossBorder: '跨境工具',
    navBlog: '教程',
    navPro: '升级 PRO',
    footerAbout: '关于我们',
    footerPrivacy: '隐私政策',
    footerTerms: '服务条款',
    footerContact: '联系我们',
    footerCopy: '\u00a9 2026 GlobeTimeZone \u00b7 所有时间数据基于 NTP 实时校准 \u00b7 时区数据来源 IANA',
    statusWorking: '\ud83d\udfe3 工作时间',
    statusMorning: '\ud83d\udfe1 早间私人时间',
    statusPersonal: '\ud83d\udfe1 亲友联系时段',
    statusEvening: '\ud83d\udfe1 晚间私人时间',
    statusPrepSleep: '\ud83d\udd35 准备休息',
    statusDeepSleep: '\ud83d\ude34 深度睡眠',
    clockLocale: 'zh-CN',
    dateLocale: 'zh-CN',
    skipLink: '跳到主内容',
    mainNav: '主导航',
    breadcrumbAria: '面包屑',
  },
};

// 其他语言回退到 en + 本地化覆盖
const FALLBACK_LANGS = ['de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];
FALLBACK_LANGS.forEach(lang => {
  I18N[lang] = { ...I18N.en, htmlLang: lang, ogLocale: `${lang}_${lang.toUpperCase()}` };
});

// 补充日语本地化
I18N.ja = {
  ...I18N.en,
  htmlLang: 'ja',
  ogLocale: 'ja_JP',
  title: (c) => `${c.ne}の現在時刻 - 時差・夏時間 | GlobeTimeZone`,
  desc: (c) => `${c.ne}の現在時刻を秒単位で確認。北京、ニューヨーク、ロンドン、東京、シドニーとの時差比較、最適な連絡時間、夏時間情報。`,
  keywords: (c) => `${c.ne} 現在時刻, ${c.ne} 時差, ${c.ne} 夏時間, ${c.ne} timezone`,
  ogTitle: (c, os) => `${c.ne}の現在時刻 - ${os} | GlobeTimeZone`,
  ogDesc: (c) => `${c.ne}のリアルタイム、8都市との時差比較、最適な連絡時間、夏時間情報。`,
  twTitle: (c, os) => `${c.ne}の現在時刻 - ${os}`,
  twDesc: (c) => `${c.ne}のリアルタイム、時差比較、最適な連絡時間。`,
  breadcrumb1: 'ホーム',
  breadcrumb2: '都市の時刻',
  breadcrumb3: (c) => `${c.ne}の時刻`,
  heroH1: (c, os) => `${c.ne}の現在時刻 <small style="font-size:0.45em;color:var(--text-secondary);font-weight:400;">${os}</small>`,
  heroBadge: (c) => `${c.ne} \u00b7 ${c.c}`,
  sectionTimeDiff: (c) => `${c.ne}と主要都市の時差`,
  thCity: '都市',
  thDiff: '時差',
  thStatus: '現在の状態',
  diffSame: '0（同じ）',
  diffHours: (d) => `${d > 0 ? '+' : ''}${d}時間`,
  sectionContact: (c) => `${c.ne}への最適な連絡時間`,
  cardBiz: '📞 ビジネス連絡',
  cardPersonal: '💬 個人的な連絡',
  sectionTzInfo: (c) => `${c.ne}のタイムゾーン情報`,
  labelTzName: 'タイムゾーン名：',
  labelIana: 'IANA識別子：',
  labelUtc: 'UTCオフセット：',
  labelDst: '夏時間：',
  labelDstStart: '夏時間開始：',
  labelDstEnd: '夏時間終了：',
  labelDstClock: '時計の調整：',
  labelCountry: '国：',
  dstYes: 'あり',
  dstNo: 'なし',
  dstClock: '1時間進める',
  sectionFaq: (c) => `${c.ne}の時刻に関するFAQ`,
  sectionRelated: '他の人気都市の時刻',
  navTimeDiff: '時差検索',
  navMeeting: '会議プランナー',
  navCrossBorder: '越境ツール',
  navBlog: 'ブログ',
  navPro: 'PROにアップグレード',
  footerAbout: 'について',
  footerPrivacy: 'プライバシーポリシー',
  footerTerms: '利用規約',
  footerContact: 'お問い合わせ',
  footerCopy: '\u00a9 2026 GlobeTimeZone \u00b7 すべての時刻データはNTPリアルタイム校正 \u00b7 タイムゾーンデータはIANA提供',
  statusWorking: '\ud83d\udfe3 営業時間',
  statusMorning: '\ud83d\udfe1 朝の時間',
  statusPersonal: '\ud83d\udfe1 個人の時間',
  statusEvening: '\ud83d\udfe1 夜の時間',
  statusPrepSleep: '\ud83d\udd35 就寝準備',
  statusDeepSleep: '\ud83d\ude34 深夜睡眠',
  clockLocale: 'ja-JP',
  dateLocale: 'ja-JP',
  skipLink: 'メインコンテンツへ',
  mainNav: 'メインナビゲーション',
  breadcrumbAria: 'パンくずリスト',
};

// 补充韩语
I18N.ko = {
  ...I18N.en,
  htmlLang: 'ko',
  ogLocale: 'ko_KR',
  title: (c) => `${c.ne} 시간 - 현재 시각, 시차, 서머타임 | GlobeTimeZone`,
  desc: (c) => `${c.ne}의 현재 시간을 초 단위로 확인. 베이징, 뉴욕, 런던, 도쿄, 시드니와의 시차 비교, 최적 연락 시간, 서머타임 정보.`,
  breadcrumb1: '홈',
  breadcrumb2: '도시 시간',
  breadcrumb3: (c) => `${c.ne} 시간`,
  heroH1: (c, os) => `${c.ne} 현재 시간 <small style="font-size:0.45em;color:var(--text-secondary);font-weight:400;">${os}</small>`,
  heroBadge: (c) => `${c.ne} \u00b7 ${c.c}`,
  sectionTimeDiff: (c) => `${c.ne}와 주요 도시 시차`,
  thCity: '도시', thDiff: '시차', thStatus: '현재 상태',
  diffSame: '0 (동일)',
  diffHours: (d) => `${d > 0 ? '+' : ''}${d}시간`,
  sectionContact: (c) => `${c.ne} 연락 최적 시간`,
  cardBiz: '📞 비즈니스 연락',
  cardPersonal: '💬 개인 연락',
  sectionTzInfo: (c) => `${c.ne} 시간대 정보`,
  labelTzName: '시간대 이름:', labelIana: 'IANA 식별자:', labelUtc: 'UTC 오프셋:',
  labelDst: '서머타임:', labelDstStart: '서머타임 시작:', labelDstEnd: '서머타임 종료:',
  labelDstClock: '시계 조정:', labelCountry: '국가:',
  dstYes: '실시', dstNo: '미실시', dstClock: '1시간 빠르게',
  sectionFaq: (c) => `${c.ne} 시간 FAQ`,
  sectionRelated: '다른 인기 도시 시간',
  navTimeDiff: '시차 검색', navMeeting: '회의 플래너', navCrossBorder: '크로스보더 도구',
  navBlog: '블로그', navPro: 'PRO 업그레이드',
  footerAbout: '소개', footerPrivacy: '개인정보 처리방침', footerTerms: '이용약관', footerContact: '문의',
  statusWorking: '\ud83d\udfe3 업무 시간', statusDeepSleep: '\ud83d\ude34 심야 수면',
  clockLocale: 'ko-KR', dateLocale: 'ko-KR',
  skipLink: '본문으로', mainNav: '주요 내비게이션', breadcrumbAria: '브레드크럼',
};

// 补充德语
I18N.de = {
  ...I18N.en,
  htmlLang: 'de',
  ogLocale: 'de_DE',
  title: (c) => `${c.ne} Zeit - Aktuelle Uhrzeit, Zeitverschiebung, Sommerzeit | GlobeTimeZone`,
  desc: (c) => `Aktuelle Uhrzeit in ${c.ne} auf die Sekunde genau. Zeitverschiebung zu Peking, New York, London, Tokio, Sydney. Beste Geschäftszeiten, Sommerzeit-Info.`,
  breadcrumb1: 'Startseite', breadcrumb2: 'Stadtzeit',
  breadcrumb3: (c) => `${c.ne} Zeit`,
  heroH1: (c, os) => `${c.ne} Aktuelle Zeit <small style="font-size:0.45em;color:var(--text-secondary);font-weight:400;">${os}</small>`,
  heroBadge: (c) => `${c.ne} \u00b7 ${c.c}`,
  sectionTimeDiff: (c) => `Zeitverschiebung: ${c.ne} & Major Cities`,
  thCity: 'Stadt', thDiff: 'Zeitverschiebung', thStatus: 'Aktueller Status',
  diffSame: '0 (Gleich)',
  diffHours: (d) => `${d > 0 ? '+' : ''}${d} Std.`,
  sectionContact: (c) => `Beste Kontaktzeit f\u00fcr ${c.ne}`,
  cardBiz: '📞 Gesch\u00e4ftszeit', cardPersonal: '💬 Privatzeit',
  sectionTzInfo: (c) => `${c.ne} Zeitzonen-Info`,
  labelTzName: 'Zeitzone:', labelIana: 'IANA-Kennung:', labelUtc: 'UTC-Versatz:',
  labelDst: 'Sommerzeit:', labelDstStart: 'Sommerzeit Beginn:', labelDstEnd: 'Sommerzeit Ende:',
  labelDstClock: 'Uhrenstellung:', labelCountry: 'Land:',
  dstYes: 'Ja', dstNo: 'Nein', dstClock: '1 Stunde vor',
  sectionFaq: (c) => `FAQ: ${c.ne} Zeit`,
  sectionRelated: 'Weitere beliebte St\u00e4dte',
  navTimeDiff: 'Zeitverschiebung', navMeeting: 'Meeting-Planer', navCrossBorder: 'Cross-Border-Tools',
  navBlog: 'Blog', navPro: 'PRO Upgrade',
  footerAbout: '\u00dcber uns', footerPrivacy: 'Datenschutz', footerTerms: 'AGB', footerContact: 'Kontakt',
  statusWorking: '\ud83d\udfe3 Arbeitszeit', statusDeepSleep: '\ud83d\ude34 Tiefschlaf',
  clockLocale: 'de-DE', dateLocale: 'de-DE',
  skipLink: 'Zum Hauptinhalt', mainNav: 'Hauptnavigation', breadcrumbAria: 'Brotkr\u00fcmelnavigation',
};

// 补充法语
I18N.fr = {
  ...I18N.en,
  htmlLang: 'fr',
  ogLocale: 'fr_FR',
  title: (c) => `Heure ${c.ne} - Heure actuelle, d\u00e9calage horaire, heure d'\u00e9t\u00e9 | GlobeTimeZone`,
  desc: (c) => `Heure actuelle \u00e0 ${c.ne} \u00e0 la seconde pr\u00e8s. D\u00e9calage horaire avec P\u00e9kin, New York, Londres, Tokyo, Sydney. Meilleures heures de contact, infos heure d'\u00e9t\u00e9.`,
  breadcrumb1: 'Accueil', breadcrumb2: 'Heure des villes',
  breadcrumb3: (c) => `Heure ${c.ne}`,
  heroH1: (c, os) => `Heure actuelle ${c.ne} <small style="font-size:0.45em;color:var(--text-secondary);font-weight:400;">${os}</small>`,
  heroBadge: (c) => `${c.ne} \u00b7 ${c.c}`,
  sectionTimeDiff: (c) => `D\u00e9calage horaire : ${c.ne} et grandes villes`,
  thCity: 'Ville', thDiff: 'D\u00e9calage', thStatus: 'Statut actuel',
  diffSame: '0 (Identique)',
  diffHours: (d) => `${d > 0 ? '+' : ''}${d}h`,
  sectionContact: (c) => `Meilleur moment pour contacter ${c.ne}`,
  cardBiz: '📞 Heures de bureau', cardPersonal: '💬 Temps personnel',
  sectionTzInfo: (c) => `Infos fuseau horaire ${c.ne}`,
  labelTzName: 'Fuseau horaire :', labelIana: 'Identifiant IANA :', labelUtc: 'D\u00e9calage UTC :',
  labelDst: "Heure d'\u00e9t\u00e9 :", labelDstStart: "D\u00e9but heure d'\u00e9t\u00e9 :", labelDstEnd: "Fin heure d'\u00e9t\u00e9 :",
  labelDstClock: 'Ajustement :', labelCountry: 'Pays :',
  dstYes: 'Oui', dstNo: 'Non', dstClock: 'Avance de 1h',
  sectionFaq: (c) => `FAQ heure ${c.ne}`,
  sectionRelated: 'Autres villes populaires',
  navTimeDiff: 'D\u00e9calage horaire', navMeeting: 'Planificateur', navCrossBorder: 'Outils transfrontaliers',
  navBlog: 'Blog', navPro: 'Passer PRO',
  footerAbout: '\u00c0 propos', footerPrivacy: 'Confidentialit\u00e9', footerTerms: 'CGU', footerContact: 'Contact',
  statusWorking: '\ud83d\udfe3 Heures de bureau', statusDeepSleep: '\ud83d\ude34 Sommeil profond',
  clockLocale: 'fr-FR', dateLocale: 'fr-FR',
  skipLink: 'Aller au contenu', mainNav: 'Navigation principale', breadcrumbAria: 'Fil d\'Ariane',
};

// 补充西班牙语
I18N.es = {
  ...I18N.en,
  htmlLang: 'es',
  ogLocale: 'es_ES',
  title: (c) => `Hora ${c.ne} - Hora actual, diferencia horaria, horario de verano | GlobeTimeZone`,
  desc: (c) => `Hora actual en ${c.ne} con precisi\u00f3n de segundos. Diferencia horaria con Pek\u00edn, Nueva York, Londres, Tokio, S\u00eddney. Mejor hora de contacto, info horario de verano.`,
  breadcrumb1: 'Inicio', breadcrumb2: 'Hora de ciudades',
  breadcrumb3: (c) => `Hora ${c.ne}`,
  heroH1: (c, os) => `Hora actual ${c.ne} <small style="font-size:0.45em;color:var(--text-secondary);font-weight:400;">${os}</small>`,
  heroBadge: (c) => `${c.ne} \u00b7 ${c.c}`,
  sectionTimeDiff: (c) => `Diferencia horaria: ${c.ne} y ciudades principales`,
  thCity: 'Ciudad', thDiff: 'Diferencia', thStatus: 'Estado actual',
  diffSame: '0 (Igual)',
  diffHours: (d) => `${d > 0 ? '+' : ''}${d}h`,
  sectionContact: (c) => `Mejor hora para contactar ${c.ne}`,
  cardBiz: '📞 Horario de oficina', cardPersonal: '💬 Tiempo personal',
  sectionTzInfo: (c) => `Info zona horaria ${c.ne}`,
  labelTzName: 'Zona horaria:', labelIana: 'Identificador IANA:', labelUtc: 'Desplazamiento UTC:',
  labelDst: 'Horario de verano:', labelDstStart: 'Inicio horario de verano:', labelDstEnd: 'Fin horario de verano:',
  labelDstClock: 'Ajuste reloj:', labelCountry: 'Pa\u00eds:',
  dstYes: 'S\u00ed', dstNo: 'No', dstClock: 'Adelantar 1 hora',
  sectionFaq: (c) => `FAQ hora ${c.ne}`,
  sectionRelated: 'Otras ciudades populares',
  navTimeDiff: 'Diferencia horaria', navMeeting: 'Planificador', navCrossBorder: 'Herramientas transfronterizas',
  navBlog: 'Blog', navPro: 'Mejora PRO',
  footerAbout: 'Sobre nosotros', footerPrivacy: 'Privacidad', footerTerms: 'T\u00e9rminos', footerContact: 'Contacto',
  statusWorking: '\ud83d\udfe3 Horario de oficina', statusDeepSleep: '\ud83d\ude34 Sue\u00f1o profundo',
  clockLocale: 'es-ES', dateLocale: 'es-ES',
  skipLink: 'Ir al contenido', mainNav: 'Navegaci\u00f3n principal', breadcrumbAria: 'Miga de pan',
};

// 补充葡萄牙语
I18N.pt = {
  ...I18N.en,
  htmlLang: 'pt',
  ogLocale: 'pt_BR',
  title: (c) => `Hora ${c.ne} - Hora atual, diferen\u00e7a hor\u00e1ria, hor\u00e1rio de ver\u00e3o | GlobeTimeZone`,
  desc: (c) => `Hora atual em ${c.ne} com precis\u00e3o de segundos. Diferen\u00e7a hor\u00e1ria com Pequim, Nova York, Londres, T\u00f3quio, Sydney. Melhor hora de contato, info hor\u00e1rio de ver\u00e3o.`,
  breadcrumb1: 'In\u00edcio', breadcrumb2: 'Hora das cidades',
  breadcrumb3: (c) => `Hora ${c.ne}`,
  heroH1: (c, os) => `Hora atual ${c.ne} <small style="font-size:0.45em;color:var(--text-secondary);font-weight:400;">${os}</small>`,
  heroBadge: (c) => `${c.ne} \u00b7 ${c.c}`,
  sectionTimeDiff: (c) => `Diferen\u00e7a hor\u00e1ria: ${c.ne} e grandes cidades`,
  thCity: 'Cidade', thDiff: 'Diferen\u00e7a', thStatus: 'Status atual',
  diffSame: '0 (Igual)',
  diffHours: (d) => `${d > 0 ? '+' : ''}${d}h`,
  sectionContact: (c) => `Melhor hora para contactar ${c.ne}`,
  cardBiz: '📞 Hor\u00e1rio comercial', cardPersonal: '💬 Tempo pessoal',
  sectionTzInfo: (c) => `Info fuso hor\u00e1rio ${c.ne}`,
  labelTzName: 'Fuso hor\u00e1rio:', labelIana: 'Identificador IANA:', labelUtc: 'Deslocamento UTC:',
  labelDst: 'Hor\u00e1rio de ver\u00e3o:', labelDstStart: 'In\u00edcio hor\u00e1rio de ver\u00e3o:', labelDstEnd: 'Fim hor\u00e1rio de ver\u00e3o:',
  labelDstClock: 'Ajuste rel\u00f3gio:', labelCountry: 'Pa\u00eds:',
  dstYes: 'Sim', dstNo: 'N\u00e3o', dstClock: 'Adiantar 1 hora',
  sectionFaq: (c) => `FAQ hora ${c.ne}`,
  sectionRelated: 'Outras cidades populares',
  navTimeDiff: 'Diferen\u00e7a hor\u00e1ria', navMeeting: 'Planejador', navCrossBorder: 'Ferramentas transfronteiri\u00e7as',
  navBlog: 'Blog', navPro: 'Upgrade PRO',
  footerAbout: 'Sobre n\u00f3s', footerPrivacy: 'Privacidade', footerTerms: 'Termos', footerContact: 'Contato',
  statusWorking: '\ud83d\udfe3 Hor\u00e1rio comercial', statusDeepSleep: '\ud83d\ude34 Sono profundo',
  clockLocale: 'pt-BR', dateLocale: 'pt-BR',
  skipLink: 'Ir para o conte\u00fado', mainNav: 'Navega\u00e7\u00e3o principal', breadcrumbAria: 'Migalhas de p\u00e3o',
};

// 补充阿拉伯语
I18N.ar = {
  ...I18N.en,
  htmlLang: 'ar',
  ogLocale: 'ar_SA',
  title: (c) => `\u0648\u0642\u062a ${c.ne} - \u0627\u0644\u0648\u0642\u062a \u0627\u0644\u062d\u0627\u0644\u064a\u060c \u0641\u0627\u0631\u0642 \u0627\u0644\u0648\u0642\u062a\u060c \u0627\u0644\u062a\u0648\u0642\u064a\u062a \u0627\u0644\u0635\u064a\u0641\u064a | GlobeTimeZone`,
  desc: (c) => `\u0627\u0644\u0648\u0642\u062a \u0627\u0644\u062d\u0627\u0644\u064a \u0641\u064a ${c.ne} \u0628\u062f\u0642\u0629 \u0627\u0644\u062b\u0627\u0646\u064a\u0629. \u0641\u0627\u0631\u0642 \u0627\u0644\u0648\u0642\u062a \u0645\u0639 \u0628\u0643\u064a\u0646\u060c \u0646\u064a\u0648\u064a\u0648\u0631\u0643\u060c \u0644\u0646\u062f\u0646\u060c \u0637\u0648\u0643\u064a\u0648\u060c \u0633\u064a\u062f\u0646\u064a. \u0623\u0641\u0636\u0644 \u0623\u0648\u0642\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u060c \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u062a\u0648\u0642\u064a\u062a \u0627\u0644\u0635\u064a\u0641\u064a.`,
  breadcrumb1: '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629', breadcrumb2: '\u0648\u0642\u062a \u0627\u0644\u0645\u062f\u0646',
  breadcrumb3: (c) => `\u0648\u0642\u062a ${c.ne}`,
  sectionTimeDiff: (c) => `\u0641\u0627\u0631\u0642 \u0627\u0644\u0648\u0642\u062a: ${c.ne} \u0648\u0627\u0644\u0645\u062f\u0646 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629`,
  thCity: '\u0627\u0644\u0645\u062f\u064a\u0646\u0629', thDiff: '\u0641\u0627\u0631\u0642 \u0627\u0644\u0648\u0642\u062a', thStatus: '\u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629',
  diffSame: '0 (\u0645\u062a\u0633\u0627\u0648\u064d)',
  diffHours: (d) => `${d > 0 ? '+' : ''}${d} \u0633\u0627\u0639\u0629`,
  sectionContact: (c) => `\u0623\u0641\u0636\u0644 \u0648\u0642\u062a \u0644\u0644\u0627\u062a\u0635\u0627\u0644 \u0628${c.ne}`,
  cardBiz: '\ud83d\udcde \u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0639\u0645\u0644', cardPersonal: '\ud83d\udcac \u0627\u0644\u0648\u0642\u062a \u0627\u0644\u0634\u062e\u0635\u064a',
  sectionTzInfo: (c) => `\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u062a\u0648\u0642\u064a\u062a ${c.ne}`,
  labelTzName: '\u0627\u0644\u062a\u0648\u0642\u064a\u062a:', labelIana: '\u0645\u0639\u0631\u0641 IANA:', labelUtc: '\u0625\u0632\u0627\u062d\u0629 UTC:',
  labelDst: '\u0627\u0644\u062a\u0648\u0642\u064a\u062a \u0627\u0644\u0635\u064a\u0641\u064a:', labelDstStart: '\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u062a\u0648\u0642\u064a\u062a \u0627\u0644\u0635\u064a\u0641\u064a:', labelDstEnd: '\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u062a\u0648\u0642\u064a\u062a \u0627\u0644\u0635\u064a\u0641\u064a:',
  labelDstClock: '\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0633\u0627\u0639\u0629:', labelCountry: '\u0627\u0644\u0628\u0644\u062f:',
  dstYes: '\u0646\u0639\u0645', dstNo: '\u0644\u0627', dstClock: '\u062a\u0642\u062f\u064a\u0645 \u0633\u0627\u0639\u0629',
  sectionFaq: (c) => `\u0623\u0633\u0626\u0644\u0629 \u0634\u0627\u0626\u0639\u0629 \u062d\u0648\u0644 \u0648\u0642\u062a ${c.ne}`,
  sectionRelated: '\u0648\u0642\u062a \u0645\u062f\u0646 \u0623\u062e\u0631\u0649 \u0634\u0627\u0626\u0639\u0629',
  navTimeDiff: '\u0641\u0627\u0631\u0642 \u0627\u0644\u0648\u0642\u062a', navMeeting: '\u0645\u062e\u0637\u0637 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a', navCrossBorder: '\u0623\u062f\u0648\u0627\u062a \u0639\u0628\u0631 \u0627\u0644\u062d\u062f\u0648\u062f',
  navBlog: '\u0627\u0644\u0645\u062f\u0648\u0646\u0629', navPro: '\u062a\u0631\u0642\u064a\u0629 PRO',
  footerAbout: '\u0639\u0646\u0627', footerPrivacy: '\u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629', footerTerms: '\u0627\u0644\u0634\u0631\u0648\u0637', footerContact: '\u0627\u062a\u0635\u0644 \u0628\u0646\u0627',
  statusWorking: '\ud83d\udfe3 \u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0639\u0645\u0644', statusDeepSleep: '\ud83d\ude34 \u0646\u0648\u0645 \u0639\u0645\u064a\u0642',
  clockLocale: 'ar-SA', dateLocale: 'ar-SA',
  skipLink: '\u0627\u0644\u062a\u062e\u0637\u064a \u0644\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0631\u0626\u064a\u0633\u064a', mainNav: '\u0627\u0644\u062a\u0646\u0642\u0644 \u0627\u0644\u0631\u0626\u064a\u0633\u064a', breadcrumbAria: '\u0641\u062a\u0627\u062a \u0627\u0644\u062e\u0628\u0632',
};

function getT(lang) {
  return I18N[lang] || I18N.en;
}

function offsetStr(o) {
  if (o === 0) return 'UTC+0';
  const sign = o > 0 ? '+' : '';
  return Number.isInteger(o) ? `UTC${sign}${o}` : `UTC${sign}${Math.floor(o)}:${String(Math.round(Math.abs(o % 1) * 60)).padStart(2, '0')}`;
}

function timeDiffRows(city, t) {
  return REFERENCE_CITIES.map(ref => {
    const diff = ref.o - city.o;
    let diffDisplay;
    if (diff === 0) diffDisplay = t.diffSame;
    else diffDisplay = t.diffHours(diff);
    const colorStyle = diff > 0 ? 'color:#22c55e' : diff < 0 ? 'color:#ef4444' : '';
    return `        <tr>
          <td>${ref.n}<br><small style="color:var(--text-secondary)">${ref.ne}</small></td>
          <td style="font-weight:600;${colorStyle}">${diffDisplay}</td>
          <td><span class="status-dot" data-timezone="${ref.tz}"></span></td>
        </tr>`;
  }).join('\n');
}

function faqItems(faqs) {
  return faqs.map((faq, i) =>
    `      <details class="faq-item"${i === 0 ? ' open' : ''}>
        <summary class="faq-question">${faq.question}</summary>
        <div class="faq-answer"><p>${faq.answer}</p></div>
      </details>`
  ).join('\n');
}

function faqSchema(faqs) {
  return faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer }
  }));
}

function relatedLinks(related, allCities, lang) {
  const prefix = lang === 'zh' ? '' : `/${lang}`;
  return related.map(rc => {
    const city = allCities[rc.s];
    const tz = city ? city.tz : rc.tz;
    return `        <a href="${prefix}/city/${rc.s}/" class="city-card-sm">
          <h3>${rc.n}</h3>
          <div class="city-time-sm" data-timezone="${tz}"></div>
        </a>`;
  }).join('\n');
}

function hreflangTags(slug) {
  const langs = [
    ['en', 'en'], ['zh-CN', 'zh'], ['de', 'de'], ['fr', 'fr'],
    ['es', 'es'], ['ja', 'ja'], ['ko', 'ko'], ['pt-BR', 'pt'], ['ar', 'ar']
  ];
  const tags = langs.map(([hreflang, code]) =>
    `  <link rel="alternate" hreflang="${hreflang}" href="https://globetimezone.com/${code}/city/${slug}/" />`
  );
  tags.push(`  <link rel="alternate" hreflang="x-default" href="https://globetimezone.com/city/${slug}/" />`);
  return tags.join('\n');
}

export function renderCityPage(slug, city, allCities, lang = 'zh') {
  const t = getT(lang);
  const os = offsetStr(city.o);
  const prefix = lang === 'zh' ? '' : `/${lang}`;
  const dstDisplay = city.d ? t.dstYes : t.dstNo;
  const dstExtra = city.d
    ? `        <li><strong>${t.labelDstStart}</strong>${city.ds}</li>\n        <li><strong>${t.labelDstEnd}</strong>${city.de}</li>\n        <li><strong>${t.labelDstClock}</strong>${t.dstClock}</li>`
    : '';

  const schemaFaq = faqSchema(city.f);
  const faqSchemaStr = schemaFaq.map(q => JSON.stringify(q)).join(',');

  // 时钟脚本中的状态文本
  const statusMap = {
    working: t.statusWorking,
    morning: t.statusMorning || t.statusPersonal,
    personal: t.statusPersonal,
    evening: t.statusEvening || t.statusPersonal,
    prepSleep: t.statusPrepSleep || t.statusDeepSleep,
    deepSleep: t.statusDeepSleep,
  };

  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title(city)}</title>
  <meta name="description" content="${t.desc(city)}">
  <meta name="keywords" content="${t.keywords(city)}">
  <link rel="canonical" href="https://globetimezone.com${prefix}/city/${slug}/">
  ${hreflangTags(slug)}
  <meta name="baidu-tongji-id" content="cb6f0f9eec485c2521ce68dab67f5515" />
  <meta property="og:type" content="website">
  <meta property="og:title" content="${t.ogTitle(city, os)}">
  <meta property="og:description" content="${t.ogDesc(city)}">
  <meta property="og:url" content="https://globetimezone.com${prefix}/city/${slug}/">
  <meta property="og:site_name" content="GlobeTimeZone">
  <meta property="og:locale" content="${t.ogLocale}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${t.twTitle(city, os)}">
  <meta name="twitter:description" content="${t.twDesc(city)}">
  <link rel="icon" href="/favicon.ico">
  <link rel="preconnect" href="https://www.googletagmanager.com">
  <link rel="preconnect" href="https://pagead2.googlesyndication.com">
  <link rel="manifest" href="/manifest.json">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "${t.breadcrumb1}", "item": "https://globetimezone.com${prefix}/"},
      {"@type": "ListItem", "position": 2, "name": "${t.breadcrumb2}", "item": "https://globetimezone.com${prefix}/cities/"},
      {"@type": "ListItem", "position": 3, "name": "${t.breadcrumb3(city)}", "item": "https://globetimezone.com${prefix}/city/${slug}/"}
    ]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Clock",
    "name": "${t.breadcrumb3(city)}",
    "description": "${t.desc(city).substring(0, 100)}",
    "timezone": "${city.tz}",
    "url": "https://globetimezone.com${prefix}/city/${slug}/"
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [${faqSchemaStr}]
  }
  </script>
  <link rel="stylesheet" href="/styles/premium.css?v=2">
  <style>
    .city-hero{text-align:center;padding:3rem 1rem 2rem;max-width:800px;margin:0 auto;background:linear-gradient(135deg,var(--bg,#fff) 0%,var(--bg-secondary,#f0f4f8) 100%);border-radius:0 0 2rem 2rem}
    .city-clock{font-size:3.5rem;font-weight:800;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;color:var(--text)}
    .city-date{font-size:1.1rem;color:var(--text-secondary);margin-top:0.3rem}
    .city-status{display:inline-block;padding:0.3rem 1rem;border-radius:9999px;font-size:0.85rem;font-weight:600;margin-top:0.8rem}
    .status-working{background:#dcfce7;color:#166534}
    .status-sleeping{background:#dbeafe;color:#1e40af}
    .status-personal{background:#fef3c7;color:#92400e}
    .status-deep-sleep{background:#ede9fe;color:#5b21b6}
    .breadcrumb{max-width:800px;margin:0 auto;padding:0.75rem 1rem;font-size:0.85rem;color:var(--text-secondary)}
    .breadcrumb a{color:var(--text-secondary);text-decoration:none}
    .breadcrumb a:hover{color:var(--text);text-decoration:underline}
    .breadcrumb span{margin:0 0.4rem}
    .time-diff-section{max-width:800px;margin:2rem auto;padding:0 1rem}
    .time-diff-table{width:100%;border-collapse:collapse}
    .time-diff-table th{text-align:left;padding:0.75rem 1rem;border-bottom:2px solid var(--border);font-size:0.85rem;color:var(--text-secondary)}
    .time-diff-table td{padding:0.75rem 1rem;border-bottom:1px solid var(--border-subtle,#e5e7eb)}
    .time-diff-table tr:hover{background:var(--bg-secondary)}
    .contact-section{max-width:800px;margin:2rem auto;padding:0 1rem}
    .contact-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-top:1rem}
    .contact-card{padding:1.2rem 1.5rem;border-radius:12px;border:1px solid var(--border);background:var(--bg);transition:transform 0.2s,box-shadow 0.2s}
    .contact-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.08)}
    .contact-card h3{font-size:1rem;margin:0 0 0.5rem}
    .contact-card p{font-size:0.9rem;color:var(--text-secondary);margin:0;line-height:1.6}
    .tz-info-section{max-width:800px;margin:2rem auto;padding:0 1rem}
    .tz-info-list{list-style:none;padding:0}
    .tz-info-list li{padding:0.5rem 0;border-bottom:1px solid var(--border-subtle,#e5e7eb);display:flex;gap:0.5rem}
    .tz-info-list li strong{min-width:100px;flex-shrink:0;color:var(--text-secondary);font-size:0.9rem}
    .faq-section{max-width:800px;margin:2rem auto;padding:0 1rem}
    .faq-item{border:1px solid var(--border);border-radius:10px;margin-bottom:0.75rem;overflow:hidden}
    .faq-question{padding:1rem 1.2rem;font-weight:600;cursor:pointer;user-select:none;display:flex;justify-content:space-between;align-items:center}
    .faq-question::after{content:'+';font-size:1.2rem;color:var(--text-secondary)}
    details[open] .faq-question::after{content:'\\2212'}
    .faq-answer{padding:0 1.2rem 1rem;color:var(--text-secondary);line-height:1.7}
    .related-section{max-width:800px;margin:2rem auto 0;padding:0 1rem 2rem}
    .city-grid-sm{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.75rem;margin-top:1rem}
    .city-card-sm{display:block;padding:0.8rem;border-radius:10px;border:1px solid var(--border);text-decoration:none;color:var(--text);transition:transform 0.15s,box-shadow 0.15s}
    .city-card-sm:hover{transform:translateY(-2px);box-shadow:0 3px 10px rgba(0,0,0,0.06)}
    .city-card-sm h3{font-size:0.9rem;margin:0}
    .city-time-sm{font-size:0.8rem;color:var(--text-secondary);margin-top:0.2rem}
    @media(max-width:640px){.city-clock{font-size:2.5rem}.contact-cards{grid-template-columns:1fr}.city-grid-sm{grid-template-columns:repeat(2,1fr)}}
    @media(prefers-color-scheme:dark){:root{--bg:#0f172a;--bg-secondary:#1e293b;--text:#f1f5f9;--text-secondary:#94a3b8;--border:#334155;--border-subtle:#1e293b}.status-working{background:#064e3b;color:#6ee7b7}.status-sleeping{background:#1e3a5f;color:#93c5fd}.status-personal{background:#422006;color:#fcd34d}.status-deep-sleep{background:#2e1065;color:#c4b5fd}}
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">${t.skipLink}</a>
  <header id="site-header">
    <nav aria-label="${t.mainNav}" style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;max-width:1200px;margin:0 auto;padding:0.75rem 1.5rem;">
      <a href="${prefix}/" style="font-weight:800;font-size:1.05rem;text-decoration:none;color:var(--text);display:flex;align-items:center;gap:0.4rem;">
        <span style="font-size:1.3rem;">🌍</span>GlobeTimeZone
      </a>
      <a href="${prefix}/time-difference/" style="text-decoration:none;color:var(--text);">${t.navTimeDiff}</a>
      <a href="${prefix}/meeting-planner/" style="text-decoration:none;color:var(--text);">${t.navMeeting}</a>
      <a href="${prefix}/tools/cross-border/" style="text-decoration:none;color:var(--text);">${t.navCrossBorder}</a>
      <a href="${prefix}/blog/" style="text-decoration:none;color:var(--text);">${t.navBlog}</a>
      <a href="${prefix}/pricing/" class="pro-link">${t.navPro}</a>
    </nav>
  </header>
  <main id="main-content">
    <nav class="breadcrumb" aria-label="${t.breadcrumbAria}">
      <a href="${prefix}/">${t.breadcrumb1}</a><span>›</span>
      <a href="${prefix}/cities/">${t.breadcrumb2}</a><span>›</span>
      <strong>${t.breadcrumb3(city)}</strong>
    </nav>
    <section class="city-hero">
      <h1>${t.heroH1(city, os)}</h1>
      <div class="city-clock" id="city-clock" data-timezone="${city.tz}">--:--:--</div>
      <div class="city-date" id="city-date"></div>
      <div class="city-status status-working" id="city-status">${t.heroBadge(city)}</div>
    </section>
    <section class="time-diff-section">
      <h2>${t.sectionTimeDiff(city)}</h2>
      <table class="time-diff-table">
        <thead><tr><th>${t.thCity}</th><th>${t.thDiff}</th><th>${t.thStatus}</th></tr></thead>
        <tbody>
${timeDiffRows({ o: city.o }, t)}
        </tbody>
      </table>
    </section>
    <section class="contact-section">
      <h2>${t.sectionContact(city)}</h2>
      <div class="contact-cards">
        <div class="contact-card"><h3>${t.cardBiz}</h3><p>${city.bb}</p></div>
        <div class="contact-card"><h3>${t.cardPersonal}</h3><p>${city.bp}</p></div>
      </div>
    </section>
    <section class="tz-info-section">
      <h2>${t.sectionTzInfo(city)}</h2>
      <ul class="tz-info-list">
        <li><strong>${t.labelTzName}</strong>${city.tn}</li>
        <li><strong>${t.labelIana}</strong>${city.tz}</li>
        <li><strong>${t.labelUtc}</strong>${os}</li>
        <li><strong>${t.labelDst}</strong>${dstDisplay}</li>
${dstExtra}
        <li><strong>${t.labelCountry}</strong>${city.c}（${city.cc}）</li>
      </ul>
    </section>
    <section class="faq-section">
      <h2>${t.sectionFaq(city)}</h2>
${faqItems(city.f)}
    </section>
    <section class="related-section">
      <h2>${t.sectionRelated}</h2>
      <div class="city-grid-sm">
${relatedLinks(city.r, allCities, lang)}
      </div>
    </section>
  </main>
  <footer style="text-align:center;padding:2rem 1rem;color:var(--text-secondary);font-size:0.85rem;border-top:1px solid var(--border-subtle);">
    <p style="display:flex;justify-content:center;gap:1.2rem;flex-wrap:wrap;">
      <a href="${prefix}/about/" style="color:var(--text-secondary);text-decoration:none;">${t.footerAbout}</a>
      <a href="${prefix}/privacy/" style="color:var(--text-secondary);text-decoration:none;">${t.footerPrivacy}</a>
      <a href="${prefix}/terms/" style="color:var(--text-secondary);text-decoration:none;">${t.footerTerms}</a>
      <a href="mailto:support@globetimezone.com" style="color:var(--text-secondary);text-decoration:none;">${t.footerContact}</a>
    </p>
    <p style="margin-top:0.5rem;">${t.footerCopy}</p>
  </footer>
  <script data-cfasync="false">
  (function(){
    var tz='${city.tz}';
    var clockEl=document.getElementById('city-clock');
    var dateEl=document.getElementById('city-date');
    var statusEl=document.getElementById('city-status');
    var cityLocale='${t.clockLocale}';
    var dateLocale='${t.dateLocale}';
    var statusMap={
      working:'${statusMap.working}',
      morning:'${statusMap.morning}',
      personal:'${statusMap.personal}',
      evening:'${statusMap.evening}',
      prepSleep:'${statusMap.prepSleep}',
      deepSleep:'${statusMap.deepSleep}'
    };
    function updateClock(){
      try{
        var now=new Date();
        var timeStr=now.toLocaleTimeString(cityLocale,{timeZone:tz,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
        var dateStr=now.toLocaleDateString(dateLocale,{timeZone:tz,year:'numeric',month:'long',day:'numeric',weekday:'long'});
        if(clockEl)clockEl.textContent=timeStr;
        if(dateEl)dateEl.textContent=dateStr;
        if(statusEl){
          var hour=parseInt(now.toLocaleString('en-US',{timeZone:tz,hour:'numeric',hour12:false}),10);
          var sc,st;
          if(hour>=9&&hour<18){sc='status-working';st=statusMap.working;}
          else if(hour>=7&&hour<9){sc='status-personal';st=statusMap.morning;}
          else if(hour>=18&&hour<22){sc='status-personal';st=statusMap.evening;}
          else if(hour>=22||hour<1){sc='status-sleeping';st=statusMap.prepSleep;}
          else{sc='status-deep-sleep';st=statusMap.deepSleep;}
          statusEl.className='city-status '+sc;
          statusEl.textContent=st+' \u00b7 ${city.ne}';
        }
      }catch(e){}
    }
    updateClock();
    setInterval(updateClock,1000);
  })();
  </script>
  <script src="/js/gtz-utils.js" defer data-cfasync="false"></script>
  <script src="/cookie-consent.js" defer data-cfasync="false"></script>
  <script src="/ads-loader.js" defer data-cfasync="false"></script>
  <script data-cfasync="false">
    if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js?v=6').catch(function(){});});}
  </script>
  <script src="/baidu-analytics.js" defer data-cfasync="false"></script>
</body>
</html>`;
}
