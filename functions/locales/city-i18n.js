'use strict';

/**
 * 城市页多语言字典
 * 所有文案按语言隔离，支持动态插值
 * 从 city-template.js I18N 对象提取，作为独立模块供路由层使用
 */
const I18N = Object.freeze({
  zh: Object.freeze({
    htmlLang: 'zh',
    ogLocale: 'zh_CN',
    pageTitleSuffix: '时间 - 现在几点、时差查询、夏令时 | GlobeTimeZone',
    pageDescPrefix: '实时查询',
    pageDescSuffix: '当前时间，精准到秒。查看与北京、纽约、伦敦、东京、悉尼的时差对比，最佳商务联系时间，夏令时切换日期。',
    faq: Object.freeze([
      { question: '{city}现在是白天还是晚上？', answer: '您可以在页面顶部看到{city}的实时时间和状态标签，绿色表示工作时间，蓝色表示休息时间。' },
      { question: '{city}实行夏令时吗？', answer: '请查看页面上方的时区信息区域，了解{city}是否实行夏令时以及具体的调整时间。' },
      { question: '什么时候联系{city}最方便？', answer: '商务联系建议在{city}当地工作时间的上午时段进行，个人联系建议在周末或工作日晚间。请参考上方的最佳联系时间推荐。' }
    ]),
    status: Object.freeze({
      working: '🟢 工作时间',
      morning: '🟡 早间私人时间',
      personal: '🟡 亲友联系时段',
      evening: '🟡 晚间私人时间',
      prepSleep: '🔵 准备休息',
      deepSleep: '🟣 深度睡眠'
    }),
    ui: Object.freeze({
      relatedCities: '其他热门城市时间',
      timeDiff: '与全球主要城市时差',
      bestMeeting: '联系最佳时间',
      faq: '常见问题',
      thCity: '城市',
      thDiff: '时差',
      thStatus: '当前状态',
      diffSame: '0（相同）',
      navTimeDiff: '时差查询',
      navMeeting: '会议规划',
      navCrossBorder: '跨境工具',
      navBlog: '教程',
      navPro: '升级 PRO',
      footerAbout: '关于我们',
      footerPrivacy: '隐私政策',
      footerTerms: '服务条款',
      footerContact: '联系我们',
      footerCopy: '© 2026 GlobeTimeZone · 所有时间数据基于 NTP 实时校准 · 时区数据来源 IANA',
      skipLink: '跳到主内容',
      mainNav: '主导航',
      breadcrumbAria: '面包屑',
      breadcrumb1: '首页',
      breadcrumb2: '城市时间'
    }),
    clockLocale: 'zh-CN',
    dateLocale: 'zh-CN'
  }),

  en: Object.freeze({
    htmlLang: 'en',
    ogLocale: 'en_US',
    pageTitleSuffix: ' Time - Current Time, Time Difference, DST | GlobeTimeZone',
    pageDescPrefix: 'Check current time in ',
    pageDescSuffix: ' accurate to the second. Compare time difference with Beijing, New York, London, Tokyo, Sydney. Best business contact hours, DST dates.',
    faq: Object.freeze([
      { question: 'Is it day or night in {city} now?', answer: 'You can see the real-time status label at the top of the page. Green indicates working hours, blue indicates rest time.' },
      { question: 'Does {city} observe daylight saving time?', answer: 'Check the timezone information section above to learn whether {city} observes DST and the specific adjustment dates.' },
      { question: 'When is the best time to contact {city}?', answer: 'For business, contact during {city} working hours in the morning. For personal matters, weekends or weekday evenings are best. See the best contact time recommendations above.' }
    ]),
    status: Object.freeze({
      working: '🟢 Working Hours',
      morning: '🟡 Morning',
      personal: '🟡 Personal Time',
      evening: '🟡 Evening',
      prepSleep: '🔵 Preparing for Sleep',
      deepSleep: '🟣 Deep Sleep'
    }),
    ui: Object.freeze({
      relatedCities: 'Other Popular City Times',
      timeDiff: 'Time Difference with Major Cities',
      bestMeeting: 'Best Time to Contact',
      faq: 'FAQ',
      thCity: 'City',
      thDiff: 'Time Difference',
      thStatus: 'Current Status',
      diffSame: '0 (Same)',
      navTimeDiff: 'Time Difference',
      navMeeting: 'Meeting Planner',
      navCrossBorder: 'Cross-Border Tools',
      navBlog: 'Blog',
      navPro: 'Upgrade PRO',
      footerAbout: 'About',
      footerPrivacy: 'Privacy Policy',
      footerTerms: 'Terms of Service',
      footerContact: 'Contact Us',
      footerCopy: '© 2026 GlobeTimeZone · All time data NTP-synchronized · Time zone data from IANA',
      skipLink: 'Skip to main content',
      mainNav: 'Main navigation',
      breadcrumbAria: 'Breadcrumb',
      breadcrumb1: 'Home',
      breadcrumb2: 'City Time'
    }),
    clockLocale: 'en-US',
    dateLocale: 'en-US'
  }),

  ja: Object.freeze({
    htmlLang: 'ja', ogLocale: 'ja_JP',
    pageTitleSuffix: 'の現在時刻 - 時差・夏時間 | GlobeTimeZone',
    pageDescPrefix: '', pageDescSuffix: 'の現在時刻を秒単位で確認。北京、ニューヨーク、ロンドン、東京、シドニーとの時差比較、最適な連絡時間、夏時間情報。',
    faq: Object.freeze([
      { question: '{city}は昼ですか夜ですか？', answer: 'ページ上部のステータスラベルで確認できます。緑は営業時間、青は休息時間を示します。' },
      { question: '{city}は夏時間を実施していますか？', answer: '上のタイムゾーン情報セクションで、{city}が夏時間を実施しているかどうかをご確認ください。' },
      { question: '{city}に連絡する最適な時間は？', answer: 'ビジネスは{city}の営業時間の午前中がおすすめ。個人的な用事は週末や平日の夜が良いです。' }
    ]),
    status: Object.freeze({ working: '🟢 営業時間', morning: '🟡 朝の時間', personal: '🟡 個人の時間', evening: '🟡 夜の時間', prepSleep: '🔵 就寝準備', deepSleep: '🟣 深夜睡眠' }),
    ui: Object.freeze({ relatedCities: '他の人気都市の時刻', timeDiff: '主要都市との時差', bestMeeting: '最適な連絡時間', faq: 'FAQ', thCity: '都市', thDiff: '時差', thStatus: '現在の状態', diffSame: '0（同じ）', navTimeDiff: '時差検索', navMeeting: '会議プランナー', navCrossBorder: '越境ツール', navBlog: 'ブログ', navPro: 'PROにアップグレード', footerAbout: 'について', footerPrivacy: 'プライバシーポリシー', footerTerms: '利用規約', footerContact: 'お問い合わせ', footerCopy: '© 2026 GlobeTimeZone · すべての時刻データはNTPリアルタイム校正 · タイムゾーンデータはIANA提供', skipLink: 'メインコンテンツへ', mainNav: 'メインナビゲーション', breadcrumbAria: 'パンくずリスト', breadcrumb1: 'ホーム', breadcrumb2: '都市の時刻' }),
    clockLocale: 'ja-JP', dateLocale: 'ja-JP'
  }),

  ko: Object.freeze({
    htmlLang: 'ko', ogLocale: 'ko_KR',
    pageTitleSuffix: ' 시간 - 현재 시각, 시차, 서머타임 | GlobeTimeZone',
    pageDescPrefix: '', pageDescSuffix: '의 현재 시간을 초 단위로 확인. 베이징, 뉴욕, 런던, 도쿄, 시드니와의 시차 비교, 최적 연락 시간, 서머타임 정보.',
    faq: Object.freeze([
      { question: '{city}은(는) 지금 낮인가요 밤인가요?', answer: '페이지 상단의 상태 라벨에서 확인할 수 있습니다. 초록색은 업무 시간, 파란색은 휴식 시간입니다.' },
      { question: '{city}은(는) 서머타임을 실시하나요?', answer: '상단의 시간대 정보 섹션에서 {city}의 서머타임 여부를 확인하세요.' },
      { question: '{city}에 연락하는 최적의 시간은?', answer: '비즈니스는 {city}의 오전 업무 시간이 좋습니다. 개인적인 연락은 주말이나 평일 저녁이 좋습니다.' }
    ]),
    status: Object.freeze({ working: '🟢 업무 시간', morning: '🟡 아침 시간', personal: '🟡 개인 시간', evening: '🟡 저녁 시간', prepSleep: '🔵 취침 준비', deepSleep: '🟣 심야 수면' }),
    ui: Object.freeze({ relatedCities: '다른 인기 도시 시간', timeDiff: '주요 도시 시차', bestMeeting: '최적 연락 시간', faq: 'FAQ', thCity: '도시', thDiff: '시차', thStatus: '현재 상태', diffSame: '0 (동일)', navTimeDiff: '시차 검색', navMeeting: '회의 플래너', navCrossBorder: '크로스보더 도구', navBlog: '블로그', navPro: 'PRO 업그레이드', footerAbout: '소개', footerPrivacy: '개인정보 처리방침', footerTerms: '이용약관', footerContact: '문의', footerCopy: '© 2026 GlobeTimeZone · 모든 시간 데이터는 NTP 실시간 교정 · 시간대 데이터는 IANA 제공', skipLink: '본문으로', mainNav: '주요 내비게이션', breadcrumbAria: '브레드크럼', breadcrumb1: '홈', breadcrumb2: '도시 시간' }),
    clockLocale: 'ko-KR', dateLocale: 'ko-KR'
  }),

  de: Object.freeze({
    htmlLang: 'de', ogLocale: 'de_DE',
    pageTitleSuffix: ' Zeit - Aktuelle Uhrzeit, Zeitverschiebung, Sommerzeit | GlobeTimeZone',
    pageDescPrefix: 'Aktuelle Uhrzeit in ', pageDescSuffix: ' auf die Sekunde genau. Zeitverschiebung zu Peking, New York, London, Tokio, Sydney. Beste Geschäftszeiten, Sommerzeit-Info.',
    faq: Object.freeze([
      { question: 'Ist es in {city} Tag oder Nacht?', answer: 'Sie können das Echtzeit-Statuslabel oben auf der Seite sehen. Grün bedeutet Arbeitszeit, Blau bedeutet Ruhezeit.' },
      { question: 'Gibt es in {city} Sommerzeit?', answer: 'Prüfen Sie den Zeitzonen-Informationsbereich oben, um zu erfahren, ob {city} die Sommerzeit befolgt.' },
      { question: 'Wann ist die beste Zeit, {city} zu kontaktieren?', answer: 'Für Geschäftskontakte empfehlen wir die Vormittagsstunden in {city}. Für persönliche Angelegenheiten sind Wochenenden oder Wochentagabende ideal.' }
    ]),
    status: Object.freeze({ working: '🟢 Arbeitszeit', morning: '🟡 Morgen', personal: '🟡 Privatzeit', evening: '🟡 Abend', prepSleep: '🔵 Schlafvorbereitung', deepSleep: '🟣 Tiefschlaf' }),
    ui: Object.freeze({ relatedCities: 'Weitere beliebte Städte', timeDiff: 'Zeitverschiebung zu Hauptstädten', bestMeeting: 'Beste Kontaktzeit', faq: 'FAQ', thCity: 'Stadt', thDiff: 'Zeitverschiebung', thStatus: 'Aktueller Status', diffSame: '0 (Gleich)', navTimeDiff: 'Zeitverschiebung', navMeeting: 'Meeting-Planer', navCrossBorder: 'Cross-Border-Tools', navBlog: 'Blog', navPro: 'PRO Upgrade', footerAbout: 'Über uns', footerPrivacy: 'Datenschutz', footerTerms: 'AGB', footerContact: 'Kontakt', footerCopy: '© 2026 GlobeTimeZone · Alle Zeitdaten NTP-synchronisiert · Zeitzonendaten von IANA', skipLink: 'Zum Hauptinhalt', mainNav: 'Hauptnavigation', breadcrumbAria: 'Brotkrümelnavigation', breadcrumb1: 'Startseite', breadcrumb2: 'Stadtzeit' }),
    clockLocale: 'de-DE', dateLocale: 'de-DE'
  }),

  fr: Object.freeze({
    htmlLang: 'fr', ogLocale: 'fr_FR',
    pageTitleSuffix: ' - Heure actuelle, décalage horaire, heure d\'été | GlobeTimeZone',
    pageDescPrefix: 'Heure actuelle à ', pageDescSuffix: ' à la seconde près. Décalage horaire avec Pékin, New York, Londres, Tokyo, Sydney. Meilleures heures de contact, infos heure d\'été.',
    faq: Object.freeze([
      { question: 'Fait-il jour ou nuit à {city} ?', answer: 'Consultez le label de statut en temps réel en haut de la page. Vert = heures de travail, bleu = temps de repos.' },
      { question: '{city} observe-t-il l\'heure d\'été ?', answer: 'Vérifiez la section d\'information de fuseau horaire ci-dessus pour savoir si {city} observe l\'heure d\'été.' },
      { question: 'Quand est le meilleur moment pour contacter {city} ?', answer: 'Pour les affaires, contactez pendant les heures de travail du matin à {city}. Pour les questions personnelles, les week-ends ou les soirées en semaine sont idéaux.' }
    ]),
    status: Object.freeze({ working: '🟢 Heures de bureau', morning: '🟡 Matin', personal: '🟡 Temps personnel', evening: '🟡 Soirée', prepSleep: '🔵 Préparation au sommeil', deepSleep: '🟣 Sommeil profond' }),
    ui: Object.freeze({ relatedCities: 'Autres villes populaires', timeDiff: 'Décalage horaire avec les grandes villes', bestMeeting: 'Meilleur moment pour contacter', faq: 'FAQ', thCity: 'Ville', thDiff: 'Décalage', thStatus: 'Statut actuel', diffSame: '0 (Identique)', navTimeDiff: 'Décalage horaire', navMeeting: 'Planificateur', navCrossBorder: 'Outils transfrontaliers', navBlog: 'Blog', navPro: 'Passer PRO', footerAbout: 'À propos', footerPrivacy: 'Confidentialité', footerTerms: 'CGU', footerContact: 'Contact', footerCopy: '© 2026 GlobeTimeZone · Toutes les données temporelles synchronisées NTP · Données de fuseau horaire IANA', skipLink: 'Aller au contenu', mainNav: 'Navigation principale', breadcrumbAria: 'Fil d\'Ariane', breadcrumb1: 'Accueil', breadcrumb2: 'Heure des villes' }),
    clockLocale: 'fr-FR', dateLocale: 'fr-FR'
  }),

  es: Object.freeze({
    htmlLang: 'es', ogLocale: 'es_ES',
    pageTitleSuffix: ' - Hora actual, diferencia horaria, horario de verano | GlobeTimeZone',
    pageDescPrefix: 'Hora actual en ', pageDescSuffix: ' con precisión de segundos. Diferencia horaria con Pekín, Nueva York, Londres, Tokio, Sídney. Mejor hora de contacto, info horario de verano.',
    faq: Object.freeze([
      { question: '¿Es de día o de noche en {city}?', answer: 'Puede ver la etiqueta de estado en tiempo real en la parte superior de la página. Verde = horario laboral, azul = tiempo de descanso.' },
      { question: '¿{city} observa el horario de verano?', answer: 'Verifique la sección de información de zona horaria arriba para saber si {city} observa el horario de verano.' },
      { question: '¿Cuándo es el mejor momento para contactar a {city}?', answer: 'Para negocios, contacte durante las horas de trabajo de la mañana en {city}. Para asuntos personales, los fines de semana o tardes de días laborables son ideales.' }
    ]),
    status: Object.freeze({ working: '🟢 Horario de oficina', morning: '🟡 Mañana', personal: '🟡 Tiempo personal', evening: '🟡 Tarde', prepSleep: '🔵 Preparación para dormir', deepSleep: '🟣 Sueño profundo' }),
    ui: Object.freeze({ relatedCities: 'Otras ciudades populares', timeDiff: 'Diferencia horaria con ciudades principales', bestMeeting: 'Mejor hora para contactar', faq: 'FAQ', thCity: 'Ciudad', thDiff: 'Diferencia', thStatus: 'Estado actual', diffSame: '0 (Igual)', navTimeDiff: 'Diferencia horaria', navMeeting: 'Planificador', navCrossBorder: 'Herramientas transfronterizas', navBlog: 'Blog', navPro: 'Mejora PRO', footerAbout: 'Sobre nosotros', footerPrivacy: 'Privacidad', footerTerms: 'Términos', footerContact: 'Contacto', footerCopy: '© 2026 GlobeTimeZone · Todos los datos de tiempo sincronizados por NTP · Datos de zona horaria de IANA', skipLink: 'Ir al contenido', mainNav: 'Navegación principal', breadcrumbAria: 'Miga de pan', breadcrumb1: 'Inicio', breadcrumb2: 'Hora de ciudades' }),
    clockLocale: 'es-ES', dateLocale: 'es-ES'
  }),

  pt: Object.freeze({
    htmlLang: 'pt', ogLocale: 'pt_BR',
    pageTitleSuffix: ' - Hora atual, diferença horária, horário de verão | GlobeTimeZone',
    pageDescPrefix: 'Hora atual em ', pageDescSuffix: ' com precisão de segundos. Diferença horária com Pequim, Nova York, Londres, Tóquio, Sydney. Melhor hora de contato, info horário de verão.',
    faq: Object.freeze([
      { question: 'É dia ou noite em {city}?', answer: 'Veja o rótulo de status em tempo real no topo da página. Verde = horário comercial, azul = tempo de descanso.' },
      { question: '{city} observa o horário de verão?', answer: 'Verifique a seção de informações de fuso horário acima para saber se {city} observa o horário de verão.' },
      { question: 'Qual é o melhor horário para contatar {city}?', answer: 'Para negócios, contate durante o horário comercial da manhã em {city}. Para assuntos pessoais, finais de semana ou noites de dias úteis são ideais.' }
    ]),
    status: Object.freeze({ working: '🟢 Horário comercial', morning: '🟡 Manhã', personal: '🟡 Tempo pessoal', evening: '🟡 Noite', prepSleep: '🔵 Preparação para dormir', deepSleep: '🟣 Sono profundo' }),
    ui: Object.freeze({ relatedCities: 'Outras cidades populares', timeDiff: 'Diferença horária com grandes cidades', bestMeeting: 'Melhor hora para contactar', faq: 'FAQ', thCity: 'Cidade', thDiff: 'Diferença', thStatus: 'Status atual', diffSame: '0 (Igual)', navTimeDiff: 'Diferença horária', navMeeting: 'Planejador', navCrossBorder: 'Ferramentas transfronteiriças', navBlog: 'Blog', navPro: 'Upgrade PRO', footerAbout: 'Sobre nós', footerPrivacy: 'Privacidade', footerTerms: 'Termos', footerContact: 'Contato', footerCopy: '© 2026 GlobeTimeZone · Todos os dados de tempo sincronizados por NTP · Dados de fuso horário da IANA', skipLink: 'Ir para o conteúdo', mainNav: 'Navegação principal', breadcrumbAria: 'Migalhas de pão', breadcrumb1: 'Início', breadcrumb2: 'Hora das cidades' }),
    clockLocale: 'pt-BR', dateLocale: 'pt-BR'
  }),

  ar: Object.freeze({
    htmlLang: 'ar', ogLocale: 'ar_SA',
    pageTitleSuffix: ' - الوقت الحالي، فرق التوقيت، التوقيت الصيفي | GlobeTimeZone',
    pageDescPrefix: 'الوقت الحالي في ', pageDescSuffix: ' بدقة الثانية. فرق التوقيت مع بكين، نيويورك، لندن، طوكيو، سيدني. أفضل أوقات الاتصال، معلومات التوقيت الصيفي.',
    faq: Object.freeze([
      { question: 'هل الوقت في {city} نهار أم ليل؟', answer: 'يمكنك رؤية ملصق الحالة في الوقت الفعلي في أعلى الصفحة. الأخضر = ساعات العمل، الأزرق = وقت الراحة.' },
      { question: 'هل يطبق {city} التوقيت الصيفي؟', answer: 'تحقق من قسم معلومات المنطقة الزمنية أعلاه لمعرفة ما إذا كان {city} يطبق التوقيت الصيفي.' },
      { question: 'ما هو أفضل وقت للاتصال بـ {city}؟', answer: 'للأعمال، اتصل خلال ساعات العمل الصباحية في {city}. للأمور الشخصية، عطلات نهاية الأسبوع أو مساء أيام العمل هي الأفضل.' }
    ]),
    status: Object.freeze({ working: '🟢 ساعات العمل', morning: '🟡 الصباح', personal: '🟡 الوقت الشخصي', evening: '🟡 المساء', prepSleep: '🔵 الاستعداد للنوم', deepSleep: '🟣 النوم العميق' }),
    ui: Object.freeze({ relatedCities: 'أوقات مدن أخرى شائعة', timeDiff: 'فرق التوقيت مع المدن الرئيسية', bestMeeting: 'أفضل وقت للاتصال', faq: 'الأسئلة الشائعة', thCity: 'المدينة', thDiff: 'فرق الوقت', thStatus: 'الحالة الحالية', diffSame: '0 (متساوٍ)', navTimeDiff: 'فرق التوقيت', navMeeting: 'مخطط الاجتماعات', navCrossBorder: 'أدوات عبر الحدود', navBlog: 'المدونة', navPro: 'ترقية PRO', footerAbout: 'عنا', footerPrivacy: 'الخصوصية', footerTerms: 'الشروط', footerContact: 'اتصل بنا', footerCopy: '© 2026 GlobeTimeZone · جميع بيانات الوقت متزامنة NTP · بيانات المنطقة الزمنية من IANA', skipLink: 'التخطي للمحتوى الرئيسي', mainNav: 'التنقل الرئيسي', breadcrumbAria: 'فتات الخبز', breadcrumb1: 'الرئيسية', breadcrumb2: 'وقت المدن' }),
    clockLocale: 'ar-SA', dateLocale: 'ar-SA'
  })
});

/**
 * 获取指定语言的翻译包（降级到英文再降级到中文）
 * @param {string} lang 语言代码
 * @returns {object} 翻译对象
 */
export const getI18n = (lang) => {
  return I18N[lang] || I18N.en || I18N.zh;
};

/**
 * 模板字符串插值
 * @param {string} template 模板
 * @param {object} vars 变量键值对
 * @returns {string}
 */
export const renderTemplate = (template, vars = {}) => {
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
};
