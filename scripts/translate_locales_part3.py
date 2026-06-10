#!/usr/bin/env python3
"""
GlobeTimeZone Part3 Translation - Remaining English fallbacks
Covers: pricing details (60), privacy policy (45), blog cards (25), xb/hk misc (21)
"""
import json
import os

LOCALES_DIR = os.path.join(os.path.dirname(__file__), '..', 'locales')

PART3 = {
    # ===== Brand names / no-need-translate (keep as-is but must differ from en to avoid "still fallback") =====
    # Actually these are identical in en and other locales, so we skip them.
    # api.h1, pro.h1, pricing.hero.badge, pricing.plan.pro, pricing.cmp.col_pro, pricing.faq.title,
    # crossborder.faq.title, blog.cat.api — these are brand/technical terms, OK to keep in English.
    # timedifference.am / .pm — standard abbreviations, some languages localize them.

    # ===== timedifference =====
    "timedifference.am": {
        "de": "AM", "fr": "AM", "es": "AM", "ja": "午前", "ko": "오전", "pt": "AM", "ar": "ص"
    },
    "timedifference.pm": {
        "de": "PM", "fr": "PM", "es": "PM", "ja": "午後", "ko": "오후", "pt": "PM", "ar": "م"
    },

    # ===== pricing specials descriptions (8 keys) =====
    "pricing.special.0.desc": {
        "de": "Keine Banner, keine Pop-ups, keine Werbung auf der gesamten Seite. Reine Werkzeuge, saubere Oberfläche, damit Sie sich auf das Zeitmanagement konzentrieren können.",
        "fr": "Aucune bannière, aucun pop-up, aucune promotion sur tout le site. Des outils purs, une interface épurée, pour vous concentrer sur la gestion du temps.",
        "es": "Sin banners, sin ventanas emergentes, sin promociones en todo el sitio. Herramientas puras, interfaz limpia, para que se concentre en la gestión del tiempo.",
        "ja": "バナーもポップアップもプロモーションも一切なし。純粋なツールとクリーンなインターフェースで、時間管理に集中できます。",
        "ko": "배너도, 팝업도, 프로모션도 전혀 없습니다. 순수한 도구와 깔끔한 인터페이스로 시간 관리에 집중하세요.",
        "pt": "Sem banners, sem pop-ups, sem promoções em todo o site. Ferramentas puras, interface limpa, para você se concentrar no gerenciamento de tempo.",
        "ar": "لا لافتات، لا نوافذ منبثقة، لا ترويج في الموقع بالكامل. أدوات نقية، واجهة نظيفة، لتركز على إدارة الوقت."
    },
    "pricing.special.1.desc": {
        "de": "10 Städte auf einem Bildschirm überwachen — sehen Sie, wer online ist, wer Pause macht, wer mitten in der Nacht arbeitet. Kein einzelnes Prüfen mehr. Produktivität steigt rasant.",
        "fr": "Surveillez 10 villes sur un seul écran — voyez qui est en ligne, qui se repose, qui est au milieu de la nuit. Plus besoin de vérifier un par un. Productivité décuplée.",
        "es": "Monitoree 10 ciudades en una pantalla — vea quién está en línea, quién descansa, quién está en mitad de la noche. Ya no necesita verificar una por una. Productividad en aumento.",
        "ja": "1画面で10都市を監視 — オンライン、休憩中、深夜の誰かを一目で確認。一つ一つチェックする必要なし。生産性が飛躍的向上。",
        "ko": "한 화면에서 10개 도시 모니터링 — 온라인, 휴식, 심야 상태를 한눈에 확인. 하나씩 확인할 필요 없이 생산성 급상승.",
        "pt": "Monitore 10 cidades em uma tela — veja quem está online, quem está descansando, quem está no meio da noite. Sem precisar verificar uma por uma. Produtividade nas alturas.",
        "ar": "راقب 10 مدن على شاشة واحدة — من متصل، من يرتاح، من في منتصف الليل. لا حاجة للتحقق واحدًا تلو الآخر. إنتاجية مرتفعة."
    },
    "pricing.special.2.desc": {
        "de": "Erstellen Sie zeitgesteuerte Erinnerungen für jede Zeitzonenkonvertierung. Automatische Push-Benachrichtigung 15 Minuten vor Besprechungen — vergessen Sie nie wieder ein zeitzonenübergreifendes Zeitfenster.",
        "fr": "Créez des rappels planifiés pour chaque conversion de fuseau horaire. Notification automatique 15 minutes avant les réunions — n'oubliez plus jamais un créneau inter-fuseaux.",
        "es": "Cree recordatorios programados para cada conversión de zona horaria. Notificación automática 15 minutos antes de las reuniones — nunca más olvide una ventana horaria entre zonas.",
        "ja": "あらゆるタイムゾーン変換に時限リマインダーを作成。会議15分前に自動プッシュ通知 — 時差越しのコラボレーション時間を二度と忘れません。",
        "ko": "모든 시간대 변환에 예약 알림을 만드세요. 회의 15분 전 자동 푸시 — 시간대 간 협업 시간을 다시는 잊지 않습니다.",
        "pt": "Crie lembretes programados para cada conversão de fuso horário. Notificação automática 15 minutos antes das reuniões — nunca mais esqueça uma janela de colaboração entre fusos.",
        "ar": "أنشئ تذكيرات مجدولة لكل تحويل منطقة زمنية. إشعار تلقائي قبل 15 دقيقة من الاجتماعات — لن تنسى أبدًا نافذة تع عبر المناطق الزمنية."
    },
    "pricing.special.3.desc": {
        "de": "Beliebig viele Teilnehmerstädte hinzufügen. Automatisch überlappende Arbeitszeitfenster finden und Kalendereinladungen mit einem Klick exportieren. Unverzichtbar für multinationale Teams.",
        "fr": "Ajoutez un nombre illimité de villes de participants. Trouvez automatiquement les fenêtres de travail qui se chevauchent et exportez les invitations calendrier en un clic. Indispensable pour les équipes multinationales.",
        "es": "Agregue cualquier cantidad de ciudades de participantes. Encuentre automáticamente ventanas de trabajo superpuestas y exporte invitaciones de calendario con un clic. Esencial para equipos multinacionales.",
        "ja": "参加者都市を無制限に追加。重複する就業時間帯を自動検出し、カレンダー招待をワンクリックでエクスポート。多国籍チームに不可欠。",
        "ko": "참가자 도시를 무제한 추가. 겹치는 근무 시간대를 자동으로 찾고 캘린더 초대를 원클릭으로 내보내기. 다국적 팀에 필수.",
        "pt": "Adicione qualquer número de cidades de participantes. Encontre automaticamente janelas de trabalho sobrepostas e exporte convites de calendário com um clique. Essencial para equipes multinacionais.",
        "ar": "أضف أي عدد من مدن المشاركين. اعثر تلقائيًا على نوافذ العمل المتداخلة وصدر دعوات التقويم بنقرة واحدة. ضروري للفرق متعددة الجنسيات."
    },
    "pricing.special.4.desc": {
        "de": "Ihre 10+ meistgenutzten Städte auf der Startseite anheften. Sofortiger Zugriff, kein Suchen mehr. Drag-and-Drop-Sortierung und eigene Beschriftungen unterstützt.",
        "fr": "Épinglez vos 10+ villes les plus utilisées sur la page d'accueil. Accès instantané, plus besoin de chercher. Glisser-déposer et étiquettes personnalisées pris en charge.",
        "es": "Fije sus 10+ ciudades más usadas en la página de inicio. Acceso instantáneo, sin necesidad de buscar. Soporta ordenar por arrastrar y soltar y etiquetas personalizadas.",
        "ja": "よく使う10以上の都市をホーム画面にピン留め。即座にアクセス、検索不要。ドラッグ&ドロップの並べ替えとカスタムラベルに対応。",
        "ko": "가장 많이 쓰는 10개 이상 도시를 홈페이지에 고정. 즉시 접근, 검색 불필요. 드래그앤드롭 정렬 및 커스텀 라벨 지원.",
        "pt": "Fixe suas 10+ cidades mais usadas na página inicial. Acesso instantâneo, sem precisar buscar. Suporta ordenação por arrastar e soltar e rótulos personalizados.",
        "ar": "ثبّت أكثر من 10 مدن الأكثر استخدامًا على الصفحة الرئيسية. وصول فوري، لا حاجة للبحث. يدعم الترتيب بالسحب والإفلات والتسميات المخصصة."
    },
    "pricing.special.5.desc": {
        "de": "Exportieren Sie Ihren Zeitzonen-Abfrageverlauf als CSV und Besprechungspläne als .ics-Kalenderdateien. Ihre Daten gehören immer Ihnen.",
        "fr": "Exportez votre historique de requêtes de fuseau horaire en CSV et vos plannings de réunions en fichiers calendrier .ics. Vos données restent toujours entre vos mains.",
        "es": "Exporte su historial de consultas de zona horaria como CSV y los planes de reuniones como archivos de calendario .ics. Sus datos siempre están en sus manos.",
        "ja": "タイムゾーン照会履歴をCSVで、会議予定を.icsカレンダーファイルでエクスポート。データは常にあなたのもの。",
        "ko": "시간대 조회 기록을 CSV로, 회의 일정을 .ics 캘린더 파일로 내보내기. 데이터는 항상 당신의 것입니다.",
        "pt": "Exporte seu histórico de consultas de fuso horário como CSV e agendas de reuniões como arquivos .ics. Seus dados estão sempre em suas mãos.",
        "ar": "صدر سجل استعلامات المنطقة الزمنية كـ CSV وجداول الاجتماعات كملفات تقويم .ics. بياناتك دائمًا بين يديك."
    },
    "pricing.special.6.desc": {
        "de": "Spätabends arbeiten schadet den Augen nicht mehr. Globales Dunkelmodus-Design schützt Ihre Augen und sorgt für ein nahtloses Erlebnis auf der gesamten Seite.",
        "fr": "Travailler tard la nuit ne fatigue plus vos yeux. Le mode sombre global protège vos yeux tout en offrant une expérience fluide sur tout le site.",
        "es": "Trabajar hasta tarde ya no cansa la vista. El modo oscuro global protege sus ojos manteniendo una experiencia fluida en todo el sitio.",
        "ja": "深夜の作業でも目が疲れません。グローバルダークモードが目を保護し、サイト全体でシームレスな体験を提供。",
        "ko": "심야 작업도 이제 눈이 아프지 않습니다. 글로벌 다크 모드가 눈을 보호하면서 사이트 전체에서 매끄러운 경험을 제공합니다.",
        "pt": "Trabalhar até tarde não cansa mais os olhos. O modo escuro global protege seus olhos mantendo uma experiência fluida em todo o site.",
        "ar": "العمل المتأخر لم يعد يؤذي عينيك. الوضع الداكن العالمي يحمي عينيك مع الحفاظ على تجربة سلسة في الموقع بالكامل."
    },
    "pricing.special.7.desc": {
        "de": "10x Ratenlimit (1000 Aufrufe/Min. statt 100). Für Fortgeschrittene, die in eigene Workflows oder Automatisierungsskripte integrieren.",
        "fr": "Limite de requêtes 10x (1000 appels/min au lieu de 100). Pour les utilisateurs avancés qui intègrent dans leurs propres flux de travail ou scripts d'automatisation.",
        "es": "Límite de solicitudes 10x (1000 llamadas/min en vez de 100). Para usuarios avanzados que integran en sus propios flujos de trabajo o scripts de automatización.",
        "ja": "レート制限10倍（100回/分→1000回/分）。独自のワークフローや自動化スクリプトに統合する上級ユーザー向け。",
        "ko": "요청 제한 10배 (분당 100회 → 1000회). 자체 워크플로우나 자동화 스크립트에 통합하는 고급 사용자용.",
        "pt": "Limite de requisições 10x (1000 chamadas/min em vez de 100). Para usuários avançados que integram em seus próprios fluxos de trabalho ou scripts de automação.",
        "ar": "حد الطلبات 10 أضعاف (1000 استدعاء/دقيقة بدلاً من 100). للمستخدمين المتقدمين الذين يدمجون في سير العمل أو نصوص الأتمتة الخاصة بهم."
    },

    # ===== pricing comparison table (22 keys) =====
    "pricing.cmp.0.f": {
        "de": "Surferlebnis", "fr": "Expérience de navigation", "es": "Experiencia de navegación",
        "ja": "ブラウジング体験", "ko": "브라우징 경험", "pt": "Experiência de navegação", "ar": "تجربة التصفح"
    },
    "pricing.cmp.0.free": {
        "de": "Mit Werbung", "fr": "Avec publicité", "es": "Con anuncios",
        "ja": "広告あり", "ko": "광고 포함", "pt": "Com anúncios", "ar": "مع إعلانات"
    },
    "pricing.cmp.0.pro": {
        "de": "Werbefrei", "fr": "Sans publicité", "es": "Sin anuncios",
        "ja": "広告なし", "ko": "광고 없음", "pt": "Sem anúncios", "ar": "بدون إعلانات"
    },
    "pricing.cmp.1.f": {
        "de": "Alle Seitentools", "fr": "Tous les outils du site", "es": "Todas las herramientas",
        "ja": "全サイトツール", "ko": "모든 사이트 도구", "pt": "Todas as ferramentas", "ar": "جميع أدوات الموقع"
    },
    "pricing.cmp.1.free": {
        "de": "Alle verfügbar", "fr": "Tous disponibles", "es": "Todas disponibles",
        "ja": "すべて利用可能", "ko": "모두 사용 가능", "pt": "Todas disponíveis", "ar": "جميعها متاحة"
    },
    "pricing.cmp.1.pro": {
        "de": "Alle + Erweitert", "fr": "Tous + Améliorés", "es": "Todas + Mejoradas",
        "ja": "すべて＋拡張機能", "ko": "모두 + 강화", "pt": "Todas + Aprimoradas", "ar": "جميعها + محسّنة"
    },
    "pricing.cmp.2.f": {
        "de": "Zeitzonen-Erinnerungen", "fr": "Rappels de fuseau horaire", "es": "Recordatorios de zona horaria",
        "ja": "タイムゾーンリマインダー", "ko": "시간대 알림", "pt": "Lembretes de fuso horário", "ar": "تذكيرات المنطقة الزمنية"
    },
    "pricing.cmp.2.free": {"de": "3", "fr": "3", "es": "3", "ja": "3", "ko": "3", "pt": "3", "ar": "3"},
    "pricing.cmp.2.pro": {
        "de": "Unbegrenzt", "fr": "Illimités", "es": "Ilimitados",
        "ja": "無制限", "ko": "무제한", "pt": "Ilimitados", "ar": "غير محدود"
    },
    "pricing.cmp.3.f": {
        "de": "Besprechungsteilnehmer", "fr": "Participants aux réunions", "es": "Participantes de reunión",
        "ja": "会議参加者", "ko": "회의 참가자", "pt": "Participantes de reunião", "ar": "مشاركون الاجتماع"
    },
    "pricing.cmp.3.free": {
        "de": "3 Städte", "fr": "3 villes", "es": "3 ciudades",
        "ja": "3都市", "ko": "3개 도시", "pt": "3 cidades", "ar": "3 مدن"
    },
    "pricing.cmp.3.pro": {
        "de": "Unbegrenzt", "fr": "Illimités", "es": "Ilimitados",
        "ja": "無制限", "ko": "무제한", "pt": "Ilimitados", "ar": "غير محدود"
    },
    "pricing.cmp.4.f": {
        "de": "Team-Uhren (Multi-Stadt)", "fr": "Horloges d'équipe (multi-villes)", "es": "Relojes de equipo (multi-ciudad)",
        "ja": "チーム時計（複数都市）", "ko": "팀 시계 (다중 도시)", "pt": "Relógios de equipe (multi-cidade)", "ar": "ساعات الفريق (متعددة المدن)"
    },
    "pricing.cmp.4.free": {"de": "—", "fr": "—", "es": "—", "ja": "—", "ko": "—", "pt": "—", "ar": "—"},
    "pricing.cmp.4.pro": {"de": "✓", "fr": "✓", "es": "✓", "ja": "✓", "ko": "✓", "pt": "✓", "ar": "✓"},
    "pricing.cmp.5.f": {
        "de": "Angeheftte Städte anpassen", "fr": "Villes épinglées personnalisées", "es": "Ciudades fijadas personalizadas",
        "ja": "カスタムピン留め都市", "ko": "커스텀 고정 도시", "pt": "Cidades fixadas personalizadas", "ar": "مدن مثبتة مخصصة"
    },
    "pricing.cmp.5.free": {"de": "—", "fr": "—", "es": "—", "ja": "—", "ko": "—", "pt": "—", "ar": "—"},
    "pricing.cmp.5.pro": {"de": "✓", "fr": "✓", "es": "✓", "ja": "✓", "ko": "✓", "pt": "✓", "ar": "✓"},
    "pricing.cmp.6.f": {
        "de": ".ics-Kalenderexport", "fr": "Export calendrier .ics", "es": "Exportar calendario .ics",
        "ja": ".icsカレンダーエクスポート", "ko": ".ics 캘린더 내보내기", "pt": "Exportar calendário .ics", "ar": "تصدير تقويم .ics"
    },
    "pricing.cmp.6.free": {"de": "—", "fr": "—", "es": "—", "ja": "—", "ko": "—", "pt": "—", "ar": "—"},
    "pricing.cmp.6.pro": {"de": "✓", "fr": "✓", "es": "✓", "ja": "✓", "ko": "✓", "pt": "✓", "ar": "✓"},
    "pricing.cmp.7.f": {
        "de": "CSV-Datenexport", "fr": "Export de données CSV", "es": "Exportar datos CSV",
        "ja": "CSVデータエクスポート", "ko": "CSV 데이터 내보내기", "pt": "Exportar dados CSV", "ar": "تصدير بيانات CSV"
    },
    "pricing.cmp.7.free": {"de": "—", "fr": "—", "es": "—", "ja": "—", "ko": "—", "pt": "—", "ar": "—"},
    "pricing.cmp.7.pro": {"de": "✓", "fr": "✓", "es": "✓", "ja": "✓", "ko": "✓", "pt": "✓", "ar": "✓"},
    "pricing.cmp.8.f": {
        "de": "Dunkelmodus", "fr": "Mode sombre", "es": "Modo oscuro",
        "ja": "ダークモード", "ko": "다크 모드", "pt": "Modo escuro", "ar": "الوضع الداكن"
    },
    "pricing.cmp.8.free": {"de": "—", "fr": "—", "es": "—", "ja": "—", "ko": "—", "pt": "—", "ar": "—"},
    "pricing.cmp.8.pro": {"de": "✓", "fr": "✓", "es": "✓", "ja": "✓", "ko": "✓", "pt": "✓", "ar": "✓"},
    "pricing.cmp.9.f": {
        "de": "API-Ratenlimit", "fr": "Limite de requêtes API", "es": "Límite de solicitudes API",
        "ja": "APIレート制限", "ko": "API 요청 제한", "pt": "Limite de requisições API", "ar": "حد طلبات API"
    },
    "pricing.cmp.9.free": {"de": "100/Min.", "fr": "100/min", "es": "100/min", "ja": "100回/分", "ko": "100/분", "pt": "100/min", "ar": "100/دقيقة"},
    "pricing.cmp.9.pro": {"de": "1000/Min.", "fr": "1000/min", "es": "1000/min", "ja": "1000回/分", "ko": "1000/분", "pt": "1000/min", "ar": "1000/دقيقة"},
    "pricing.cmp.10.f": {
        "de": "Support", "fr": "Support", "es": "Soporte",
        "ja": "サポート", "ko": "지원", "pt": "Suporte", "ar": "الدعم"
    },
    "pricing.cmp.10.free": {
        "de": "Community", "fr": "Communauté", "es": "Comunidad",
        "ja": "コミュニティ", "ko": "커뮤니티", "pt": "Comunidade", "ar": "المجتمع"
    },
    "pricing.cmp.10.pro": {
        "de": "24h Priorität", "fr": "24h prioritaire", "es": "24h prioritario",
        "ja": "24時間優先", "ko": "24시간 우선", "pt": "24h prioritário", "ar": "أولوية 24 ساعة"
    },

    # ===== pricing CTA + trust (4+1 keys) =====
    "pricing.cta.desc": {
        "de": "Volle Rückerstattung innerhalb von 30 Tagen bei Nichtgefallen. Kein Risiko, jederzeit kündbar.",
        "fr": "Remboursement intégral sous 30 jours si non satisfait. Zéro risque, annulation à tout moment.",
        "es": "Reembolso completo dentro de 30 días si no está satisfecho. Cero riesgo, cancele en cualquier momento.",
        "ja": "30日間全額返金保証。リスクゼロ、いつでもキャンセル可能。",
        "ko": "30일 이내 전액 환불 보장. 제로 리스크, 언제든 취소 가능.",
        "pt": "Reembolso integral em 30 dias se não estiver satisfeito. Risco zero, cancele a qualquer momento.",
        "ar": "استرداد كامل خلال 30 يومًا في حال عدم الرضا. مخاطرة صفر، إلغاء في أي وقت."
    },
    "pricing.trust.0": {
        "de": "🔒 Sichere Zahlung", "fr": "🔒 Paiement sécurisé", "es": "🔒 Pago seguro",
        "ja": "🔒 安全な決済", "ko": "🔒 안전한 결제", "pt": "🔒 Pagamento seguro", "ar": "🔒 دفع آمن"
    },
    "pricing.trust.1": {
        "de": "🔁 30-Tage-Geld-zurück-Garantie", "fr": "🔁 Garantie de remboursement 30 jours", "es": "🔁 Garantía de reembolso 30 días",
        "ja": "🔁 30日間返金保証", "ko": "🔁 30일 환불 보장", "pt": "🔁 Garantia de reembolso 30 dias", "ar": "🔁 ضمان استرداد 30 يومًا"
    },
    "pricing.trust.2": {
        "de": "🔄 Jederzeit kündbar", "fr": "🔄 Annulation à tout moment", "es": "🔄 Cancele en cualquier momento",
        "ja": "🔄 いつでもキャンセル", "ko": "🔄 언제든 취소", "pt": "🔄 Cancele a qualquer momento", "ar": "🔄 إلغاء في أي وقت"
    },
    "pricing.trust.3": {
        "de": "📩 24h-Support", "fr": "📩 Support 24h", "es": "📩 Soporte 24h",
        "ja": "📩 24時間サポート", "ko": "📩 24시간 지원", "pt": "📩 Suporte 24h", "ar": "📩 دعم 24 ساعة"
    },

    # ===== pricing FAQ (10 keys) =====
    "pricing.faq.q1": {
        "de": "Was ist der Unterschied zwischen PRO und Kostenlos?",
        "fr": "Quelle est la différence entre PRO et Gratuit ?",
        "es": "¿Cuál es la diferencia entre PRO y Gratis?",
        "ja": "PROと無料版の違いは？",
        "ko": "PRO와 무료 버전의 차이는?",
        "pt": "Qual a diferença entre PRO e Gratuito?",
        "ar": "ما الفرق بين PRO والمجاني؟"
    },
    "pricing.faq.a1": {
        "de": "PRO entfernt alle Werbung und bietet unbegrenzte Zeitzonen-Erinnerungen, unbegrenzte Besprechungsteilnehmer, Team-Uhren, eigene Stadtlisten, Datenexport, Dunkelmodus und höhere API-Ratenlimits. Die kostenlose Version ist dauerhaft nutzbar mit Grundfunktionen, hat aber Werbung und Mengenbeschränkungen.",
        "fr": "PRO supprime toutes les publicités et offre des rappels de fuseau horaire illimités, des participants de réunion illimités, des horloges d'équipe, des listes de villes personnalisées, l'export de données, le mode sombre et des limites de requêtes API supérieures. La version gratuite est utilisable indéfiniment avec les fonctionnalités de base, mais contient des publicités et des limitations.",
        "es": "PRO elimina todos los anuncios y ofrece recordatorios de zona horaria ilimitados, participantes de reunión ilimitados, relojes de equipo, listas de ciudades personalizadas, exportación de datos, modo oscuro y límites de solicitudes API más altos. La versión gratuita se puede usar para siempre con funciones básicas, pero tiene anuncios y límites de cantidad.",
        "ja": "PROは広告をすべて削除し、無制限のタイムゾーンリマインダー、無制限の会議参加者、チーム時計、カスタム都市リスト、データエクスポート、ダークモード、より高いAPIレート制限を提供します。無料版は基本機能を永続的に利用できますが、広告と数量制限があります。",
        "ko": "PRO는 모든 광고를 제거하고 무제한 시간대 알림, 무제한 회의 참가자, 팀 시계, 커스텀 도시 목록, 데이터 내보내기, 다크 모드, 더 높은 API 요청 제한을 제공합니다. 무료 버전은 기본 기능을 영구적으로 사용할 수 있지만 광고와 수량 제한이 있습니다.",
        "pt": "PRO remove todos os anúncios e oferece lembretes de fuso horário ilimitados, participantes de reunião ilimitados, relógios de equipe, listas de cidades personalizadas, exportação de dados, modo escuro e limites de requisições API mais altos. A versão gratuita pode ser usada para sempre com funcionalidades básicas, mas tem anúncios e limites de quantidade.",
        "ar": "PRO يزيل جميع الإعلانات ويوفر تذكيرات منطقة زمنية غير محدودة، مشاركين اجتماعات غير محدودين، ساعات فريق، قوائم مدن مخصصة، تصدير بيانات، وضع داكن، وحدود طلبات API أعلى. النسخة المجانية قابلة للاستخدام للأبد مع الميزات الأساسية لكن بها إعلانات وقيود كمية."
    },
    "pricing.faq.q2": {
        "de": "Kann ich jederzeit kündigen?",
        "fr": "Puis-je annuler à tout moment ?",
        "es": "¿Puedo cancelar en cualquier momento?",
        "ja": "いつでもキャンセルできますか？",
        "ko": "언제든 취소할 수 있나요?",
        "pt": "Posso cancelar a qualquer momento?",
        "ar": "هل يمكنني الإلغاء في أي وقت؟"
    },
    "pricing.faq.a2": {
        "de": "Absolut. PRO ist ein Monatsabo. Sie können jederzeit kündigen und genießen alle PRO-Vorteile bis zum Ende des aktuellen Abrechnungszeitraums. Keine automatische Abbuchung für den nächsten Zeitraum.",
        "fr": "Absolument. PRO est un abonnement mensuel. Vous pouvez annuler à tout moment et profiter de tous les avantages PRO jusqu'à la fin de la période de facturation en cours. Pas de prélèvement automatique pour la période suivante.",
        "es": "Absolutamente. PRO es una suscripción mensual. Puede cancelar en cualquier momento y seguir disfrutando de todos los beneficios PRO hasta el final del período de facturación actual. Sin cargos automáticos para el siguiente período.",
        "ja": "はい。PROは月額サブスクリプションです。いつでもキャンセルでき、現在の請求期間の終了まですべてのPRO特典を引き続き利用できます。次回の自動課金はありません。",
        "ko": "물론입니다. PRO는 월 구독입니다. 언제든 취소할 수 있으며, 현재 청구 기간이 끝날 때까지 모든 PRO 혜택을 계속 누릴 수 있습니다. 다음 기간 자동 청구는 없습니다.",
        "pt": "Com certeza. PRO é uma assinatura mensal. Você pode cancelar a qualquer momento e continuar aproveitando todos os benefícios PRO até o final do período de cobrança atual. Sem cobranças automáticas para o próximo período.",
        "ar": "بالتأكيد. PRO اشتراك شهري. يمكنك الإلغاء في أي وقت والاستمرار في الاستفادة من جميع مزايا PRO حتى نهاية فترة الفوترة الحالية. لا يتم خصم تلقائي للفترة التالية."
    },
    "pricing.faq.q3": {
        "de": "Gibt es Team- oder Firmenrabatte?",
        "fr": "Y a-t-il des tarifs de groupe pour les équipes/entreprises ?",
        "es": "¿Hay precios de grupo para equipos/empresas?",
        "ja": "チーム/法人割引はありますか？",
        "ko": "팀/기업 단체 할인이 있나요?",
        "pt": "Há preços de grupo para equipes/empresas?",
        "ar": "هل هناك أسعار جماعية للفرق/الشركات؟"
    },
    "pricing.faq.a3": {
        "de": "Ja. Bei einem Team-Abonnement für 5+ Personen kontaktieren Sie uns für einen Team-Rabatt. E-Mail: support@globetimezone.com.",
        "fr": "Oui. Pour un abonnement d'équipe de 5+ personnes, contactez-nous pour une réduction. E-mail : support@globetimezone.com.",
        "es": "Sí. Para una suscripción de equipo de 5+ personas, contáctenos para un descuento. Correo: support@globetimezone.com.",
        "ja": "はい。5名以上のチームサブスクリプションについては、チーム割引をお問い合わせください。メール：support@globetimezone.com。",
        "ko": "네. 5인 이상 팀 구독 시 팀 할인을 문의해 주세요. 이메일: support@globetimezone.com.",
        "pt": "Sim. Para assinaturas de equipe com 5+ pessoas, entre em contato para desconto. E-mail: support@globetimezone.com.",
        "ar": "نعم. لاشتراك فريق من 5+ أشخاص، تواصلوا معنا للحصول على خصم. البريد: support@globetimezone.com."
    },
    "pricing.faq.q4": {
        "de": "Sind meine Daten sicher? Wird mein Abfrageverlauf erfasst?",
        "fr": "Mes données sont-elles en sécurité ? Mon historique de requêtes est-il collecté ?",
        "es": "¿Están seguros mis datos? ¿Se recopila mi historial de consultas?",
        "ja": "データは安全ですか？照会履歴は収集されますか？",
        "ko": "데이터는 안전한가요? 조회 기록이 수집되나요?",
        "pt": "Meus dados estão seguros? Meu histórico de consultas é coletado?",
        "ar": "هل بياناتي آمنة؟ هل يتم جمع سجل استعلاماتي؟"
    },
    "pricing.faq.a4": {
        "de": "GlobeTimeZone erfasst Ihren Zeitzonen-Abfrageverlauf nicht. Wir nutzen Cloudflares globales CDN zur Beschleunigung, Ihre Daten sind vollständig anonym. Die Exportfunktionen der PRO-Nutzer liegen vollständig unter Ihrer Kontrolle.",
        "fr": "GlobeTimeZone ne collecte pas votre historique de requêtes de fuseau horaire. Nous utilisons le CDN mondial de Cloudflare pour l'accélération, vos données sont entièrement anonymes. Les fonctions d'exportation des utilisateurs PRO sont entièrement sous votre contrôle.",
        "es": "GlobeTimeZone no recopila su historial de consultas de zona horaria. Usamos el CDN global de Cloudflare para aceleración, sus datos son completamente anónimos. Las funciones de exportación de usuarios PRO están bajo su control total.",
        "ja": "GlobeTimeZoneはタイムゾーン照会履歴を収集しません。CloudflareのグローバルCDNで高速化し、データは完全に匿名です。PROユーザーのエクスポート機能はすべてお客様の管理下にあります。",
        "ko": "GlobeTimeZone은 시간대 조회 기록을 수집하지 않습니다. Cloudflare 글로벌 CDN으로 가속화하며 데이터는 완전히 익명입니다. PRO 사용자의 내보내기 기능은 전적으로 사용자가 통제합니다.",
        "pt": "GlobeTimeZone não coleta seu histórico de consultas de fuso horário. Usamos o CDN global da Cloudflare para aceleração, seus dados são totalmente anônimos. As funções de exportação de usuários PRO estão inteiramente sob seu controle.",
        "ar": "GlobeTimeZone لا يجمع سجل استعلامات المنطقة الزمنية الخاصة بك. نستخدم CDN العالمي من Cloudflare للتسريع، وبياناتك مجهولة تمامًا. ميزات التصدير للمستخدمين PRO تحت سيطرتك الكاملة."
    },
    "pricing.faq.q5": {
        "de": "Gibt es einen Jahresrabatt?",
        "fr": "Y a-t-il un tarif annuel avec réduction ?",
        "es": "¿Hay descuento anual?",
        "ja": "年間割引はありますか？",
        "ko": "연간 할인이 있나요?",
        "pt": "Há desconto anual?",
        "ar": "هل هناك خصم سنوي؟"
    },
    "pricing.faq.a5": {
        "de": "Ja. Jahresabrechnung beträgt 39,99 $/Jahr, entspricht 3,33 $/Monat — ca. 16% Ersparnis gegenüber monatlich. Sie erhalten sofortigen vollen PRO-Zugang nach Abschluss.",
        "fr": "Oui. La facturation annuelle est de 39,99 $/an, soit 3,33 $/mois — environ 16% d'économies par rapport au mensuel. Vous obtenez un accès PRO complet immédiatement après l'inscription.",
        "es": "Sí. La facturación anual es de $39.99/año, equivalente a $3.33/mes — aproximadamente 16% de ahorro frente al mensual. Obtendrá acceso PRO completo inmediatamente al suscribirse.",
        "ja": "はい。年額プランは$39.99/年で、月額$3.33相当 — 月額比約16%お得です。登録後すぐにPRO全機能をご利用いただけます。",
        "ko": "네. 연간 결제는 $39.99/년으로 월 $3.33에 해당 — 월간 대비 약 16% 절약됩니다. 구독 즉시 PRO 전체 액세스가 제공됩니다.",
        "pt": "Sim. O plano anual é de $39.99/ano, equivalente a $3.33/mês — cerca de 16% de economia em relação ao mensal. Você terá acesso PRO completo imediatamente após a assinatura.",
        "ar": "نعم. الفوترة السنوية 39.99$/سنة، أي 3.33$/شهر — توفير حوالي 16% مقارنة بالشهري. ستحصل على وصول PRO كامل فورًا عند الاشتراك."
    },

    # ===== blog cards (24 keys) =====
    "blog.card.0.tag": {
        "de": "Grundlagen", "fr": "Bases", "es": "Básicos",
        "ja": "基礎", "ko": "기초", "pt": "Básico", "ar": "الأساسيات"
    },
    "blog.card.0.title": {
        "de": "Was ist UTC? Koordinierte Weltzeit erklärt",
        "fr": "Qu'est-ce que l'UTC ? Temps universel coordonné expliqué",
        "es": "¿Qué es UTC? Tiempo Universal Coordinado explicado",
        "ja": "UTCとは？協定世界時の解説",
        "ko": "UTC란? 협정 세계시 설명",
        "pt": "O que é UTC? Tempo Universal Coordenado explicado",
        "ar": "ما هو UTC؟ التوقيت العالمي المنسق مشروح"
    },
    "blog.card.0.excerpt": {
        "de": "UTC (Koordinierte Weltzeit) ist der globale Zeitstandard. Erfahren Sie mehr über seinen Ursprung, die Unterschiede zu GMT und warum alle Zeitzonen darauf basieren.",
        "fr": "UTC (Temps universel coordonné) est le standard horaire mondial. Découvrez ses origines, sa différence avec GMT et pourquoi tous les fuseaux horaires s'y réfèrent.",
        "es": "UTC (Tiempo Universal Coordinado) es el estándar horario global. Conozca sus orígenes, cómo difiere de GMT y por qué todas las zonas horarias se centran en él.",
        "ja": "UTC（協定世界時）はグローバルな時間標準です。その起源、GMTとの違い、すべてのタイムゾーンの基準となる理由を解説。",
        "ko": "UTC(협정 세계시)는 글로벌 시간 표준입니다. 그 기원, GMT와의 차이, 모든 시간대가 이를 중심으로 하는 이유를 알아보세요.",
        "pt": "UTC (Tempo Universal Coordenado) é o padrão de tempo global. Conheça suas origens, como difere do GMT e por que todos os fusos horários se baseiam nele.",
        "ar": "UTC (التوقيت العالمي المنسق) هو المعيار الزمني العالمي. تعرف على أصله وكيف يختلف عن GMT ولماذا جميع المناطق الزمنية تتمحور حوله."
    },
    "blog.card.0.time": {
        "de": "4 Min. Lesezeit", "fr": "4 min de lecture", "es": "4 min de lectura",
        "ja": "4分で読める", "ko": "4분 읽기", "pt": "4 min de leitura", "ar": "4 دقائق قراءة"
    },
    "blog.card.1.tag": {
        "de": "Leitfaden", "fr": "Guide", "es": "Guía",
        "ja": "ガイド", "ko": "가이드", "pt": "Guia", "ar": "دليل"
    },
    "blog.card.1.title": {
        "de": "Sommerzeit: Welche Länder nutzen sie und warum?",
        "fr": "Heure d'été : Quels pays l'utilisent et pourquoi ?",
        "es": "Horario de verano: ¿Qué países lo usan y por qué?",
        "ja": "夏時間：どの国が導入し、なぜ？",
        "ko": "일광절약시간: 어떤 국가가 사용하고 왜?",
        "pt": "Horário de verão: Quais países usam e por quê?",
        "ar": "التوقيت الصيفي: أي الدول تستخدمه ولماذا؟"
    },
    "blog.card.1.excerpt": {
        "de": "Die Sommerzeit betrifft jährlich Milliarden Menschen weltweit. Erfahren Sie, welche Länder sie nutzen, wie Uhren umgestellt werden und die echten Auswirkungen auf den grenzüberschreitenden Handel.",
        "fr": "L'heure d'été affecte des milliards de personnes chaque année. Découvrez quels pays l'utilisent, comment les horloges changent et son impact réel sur le commerce transfrontalier.",
        "es": "El horario de verano afecta a miles de millones de personas cada año. Conozca qué países lo usan, cómo cambian los relojes y su impacto real en los negocios transfronterizos.",
        "ja": "夏時間は毎年世界中の数十億人に影響します。導入国、時計の変更方法、越境ビジネスへの実際の影響を解説。",
        "ko": "일광절약시간은 매년 전 세계 수십억 명에게 영향을 미칩니다. 어떤 국가가 사용하는지, 시계가 어떻게 바뀌는지, 크로스보더 비즈니스에 미치는 실제 영향을 알아보세요.",
        "pt": "O horário de verão afeta bilhões de pessoas todos os anos. Saiba quais países o usam, como os relógios mudam e seu impacto real nos negócios transfronteiriços.",
        "ar": "التوقيت الصيفي يؤثر على مليارات الأشخاص سنويًا. تعرف على الدول التي تستخدمه وكيف تتغير الساعات وتأثيره الحقيقي على الأعمال عبر الحدود."
    },
    "blog.card.1.time": {
        "de": "6 Min. Lesezeit", "fr": "6 min de lecture", "es": "6 min de lectura",
        "ja": "6分で読める", "ko": "6분 읽기", "pt": "6 min de leitura", "ar": "6 دقائق قراءة"
    },
    "blog.card.2.tag": {
        "de": "Tipps", "fr": "Conseils", "es": "Consejos",
        "ja": "ヒント", "ko": "팁", "pt": "Dicas", "ar": "نصائح"
    },
    "blog.card.2.title": {
        "de": "Beste Zeiten für internationale Geschäftstreffen",
        "fr": "Meilleurs moments pour les réunions d'affaires internationales",
        "es": "Mejores horarios para reuniones de negocios internacionales",
        "ja": "国際ビジネスミーティングの最適な時間",
        "ko": "국제 비즈니스 회의 최적 시간",
        "pt": "Melhores horários para reuniões de negócios internacionais",
        "ar": "أفضل أوقات اجتماعات الأعمال الدولية"
    },
    "blog.card.2.excerpt": {
        "de": "Wie plant man Remote-Meetings über mehrere Zeitzonen hinweg? Finden Sie akzeptable Zeitfenster für alle — die optimale Lösung von San Francisco bis Tokio.",
        "fr": "Comment planifier des réunions à distance sur plusieurs fuseaux horaires ? Trouvez des créneaux acceptables pour tous — la solution optimale de San Francisco à Tokyo.",
        "es": "¿Cómo programar reuniones remotas en múltiples zonas horarias? Encuentre ventanas de tiempo aceptables para todos — la solución óptima de San Francisco a Tokio.",
        "ja": "複数のタイムゾーンにまたがるリモート会議のスケジュール方法？全員に適した時間帯を見つける — サンフランシスコから東京までの最適解。",
        "ko": "여러 시간대에 걸친 원격 회의 일정은 어떻게 짜나요? 모두에게 적합한 시간대 찾기 — 샌프란시스코부터 도쿄까지 최적의 솔루션.",
        "pt": "Como agendar reuniões remotas em múltiplos fusos horários? Encontre janelas de tempo aceitáveis para todos — a solução ideal de São Francisco a Tóquio.",
        "ar": "كيف تجدول اجتماعات عن بُعد عبر مناطق زمنية متعددة؟ اعثر على نوافذ زمنية مقبولة للجميع — الحل الأمثل من سان فرانسيسكو إلى طوكيو."
    },
    "blog.card.2.time": {
        "de": "5 Min. Lesezeit", "fr": "5 min de lecture", "es": "5 min de lectura",
        "ja": "5分で読める", "ko": "5분 읽기", "pt": "5 min de leitura", "ar": "5 دقائق قراءة"
    },
    "blog.card.3.tag": {
        "de": "Tipps", "fr": "Conseils", "es": "Consejos",
        "ja": "ヒント", "ko": "팁", "pt": "Dicas", "ar": "نصائح"
    },
    "blog.card.3.title": {
        "de": "Leitfaden für Zeitzonenmanagement in Remote-Teams",
        "fr": "Guide de gestion des fuseaux horaires pour équipes à distance",
        "es": "Guía de gestión de zonas horarias para equipos remotos",
        "ja": "リモートチームのタイムゾーン管理ガイド",
        "ko": "원격 팀 시간대 관리 가이드",
        "pt": "Guia de gestão de fusos horários para equipes remotas",
        "ar": "دليل إدارة المناطق الزمنية للفرق عن بُعد"
    },
    "blog.card.3.excerpt": {
        "de": "Einzigartige Herausforderungen für zeitzonenübergreifende Remote-Teams: asynchrone Kommunikation, Übergabefenster, kulturelle Unterschiede. Systematische Managementstrategien und praktische Ratschläge.",
        "fr": "Défis uniques des équipes à distance inter-fuseaux : communication asynchrone, fenêtres de transmission, différences culturelles. Stratégies de gestion systématiques et conseils pratiques.",
        "es": "Desafíos únicos para equipos remotos entre zonas horarias: comunicación asíncrona, ventanas de entrega, diferencias culturales. Estrategias de gestión y consejos prácticos.",
        "ja": "時差越えリモートチームの特有な課題：非同期コミュニケーション、引き継ぎ時間帯、文化の違い。体系的な管理戦略と実践的アドバイス。",
        "ko": "시간대 간 원격 팀의 고유 과제: 비동기 소통, 인계 시간대, 문화 차이. 체계적인 관리 전략과 실용적인 조언.",
        "pt": "Desafios únicos para equipes remotas entre fusos: comunicação assíncrona, janelas de entrega, diferenças culturais. Estratégias de gestão e conselhos práticos.",
        "ar": "تحديات فريدة للفرق عن بُعد عبر المناطق الزمنية: التواصل غير المتزامن، نوافذ التسليم، الاختلافات الثقافية. استراتيجيات إدارة ونصائح عملية."
    },
    "blog.card.3.time": {
        "de": "6 Min. Lesezeit", "fr": "6 min de lecture", "es": "6 min de lectura",
        "ja": "6分で読める", "ko": "6분 읽기", "pt": "6 min de leitura", "ar": "6 دقائق قراءة"
    },
    "blog.card.4.tag": {
        "de": "API", "fr": "API", "es": "API",
        "ja": "API", "ko": "API", "pt": "API", "ar": "API"
    },
    "blog.card.4.title": {
        "de": "Zeitzonen-API-Entwicklerleitfaden",
        "fr": "Guide développeur de l'API de fuseaux horaires",
        "es": "Guía del desarrollador de API de zonas horarias",
        "ja": "タイムゾーンAPI開発者ガイド",
        "ko": "시간대 API 개발자 가이드",
        "pt": "Guia do desenvolvedor da API de fuso horário",
        "ar": "دليل مطور واجهة المناطق الزمنية"
    },
    "blog.card.4.excerpt": {
        "de": "Programmatische Zeitzonenkonvertierung über API. Umfassender Überblick über das Interface-Design, Parameterbeschreibungen und Verwendungsbeispiele der GlobeTimeZone API.",
        "fr": "Conversion de fuseau horaire par API. Aperçu complet de la conception de l'interface, des descriptions de paramètres et des exemples d'utilisation de l'API GlobeTimeZone.",
        "es": "Conversión de zona horaria programática vía API. Visión completa del diseño de interfaz, descripciones de parámetros y ejemplos de uso de la API GlobeTimeZone.",
        "ja": "APIによるプログラム的タイムゾーン変換。GlobeTimeZone APIのインターフェース設計、パラメータ説明、使用例を包括的に解説。",
        "ko": "API를 통한 프로그래밍 시간대 변환. GlobeTimeZone API의 인터페이스 설계, 매개변수 설명, 사용 예시에 대한 포괄적 개요.",
        "pt": "Conversão de fuso horário programática via API. Visão geral do design de interface, descrições de parâmetros e exemplos de uso da API GlobeTimeZone.",
        "ar": "تحويل المناطق الزمنية برمجيًا عبر API. نظرة شاملة على تصميم واجهة GlobeTimeZone API ووصف المعلمات وأمثلة الاستخدام."
    },
    "blog.card.4.time": {
        "de": "5 Min. Lesezeit", "fr": "5 min de lecture", "es": "5 min de lectura",
        "ja": "5分で読める", "ko": "5분 읽기", "pt": "5 min de leitura", "ar": "5 دقائق قراءة"
    },
    "blog.card.5.tag": {
        "de": "Leitfaden", "fr": "Guide", "es": "Guía",
        "ja": "ガイド", "ko": "가이드", "pt": "Guia", "ar": "دليل"
    },
    "blog.card.5.title": {
        "de": "Sommerzeit: Länderliste",
        "fr": "Heure d'été : Liste des pays",
        "es": "Horario de verano: Lista de países",
        "ja": "夏時間：導入国一覧",
        "ko": "일광절약시간: 국가 목록",
        "pt": "Horário de verão: Lista de países",
        "ar": "التوقيت الصيفي: قائمة الدول"
    },
    "blog.card.5.excerpt": {
        "de": "Eine umfassende, durchsuchbare Liste der Länder mit Sommerzeit, wann Uhren umgestellt werden und wie es die globale Geschäftsplanung beeinflusst.",
        "fr": "Une liste complète et consultable des pays observant l'heure d'été, quand les horloges changent et l'impact sur la planification commerciale mondiale.",
        "es": "Una lista completa y buscable de países que observan el horario de verano, cuándo cambian los relojes y cómo afecta la planificación de negocios global.",
        "ja": "夏時間を採用している国の包括的で検索可能なリスト、時計の変更時期、グローバルビジネススケジュールへの影響を紹介。",
        "ko": "일광절약시간을 실시하는 국가의 포괄적이고 검색 가능한 목록, 시계 변경 시기, 글로벌 비즈니스 일정에 미치는 영향.",
        "pt": "Uma lista completa e pesquisável de países que observam horário de verão, quando os relógios mudam e como isso afeta o planejamento de negócios global.",
        "ar": "قائمة شاملة وقابلة للبحث للدول التي تطبق التوقيت الصيفي، متى تتغير الساعات وكيف يؤثر على جدولة الأعمال العالمية."
    },
    "blog.card.5.time": {
        "de": "6 Min. Lesezeit", "fr": "6 min de lecture", "es": "6 min de lectura",
        "ja": "6分で読める", "ko": "6분 읽기", "pt": "6 min de leitura", "ar": "6 دقائق قراءة"
    },

    # ===== privacy policy (45 keys) =====
    "privacy.s1.title": {
        "de": "1. Welche Daten wir erfassen",
        "fr": "1. Quelles données nous collectons",
        "es": "1. Qué datos recopilamos",
        "ja": "1. 収集するデータ",
        "ko": "1. 수집하는 데이터",
        "pt": "1. Quais dados coletamos",
        "ar": "1. البيانات التي نجمعها"
    },
    "privacy.s2.title": {
        "de": "2. Zweck der Datennutzung",
        "fr": "2. Finalité de l'utilisation des données",
        "es": "2. Finalidad del uso de datos",
        "ja": "2. データ利用の目的",
        "ko": "2. 데이터 사용 목적",
        "pt": "2. Finalidade do uso de dados",
        "ar": "2. غرض استخدام البيانات"
    },
    "privacy.s3.title": {
        "de": "3. Datenspeicherung und Aufbewahrung",
        "fr": "3. Stockage et conservation des données",
        "es": "3. Almacenamiento y retención de datos",
        "ja": "3. データの保管と保持",
        "ko": "3. 데이터 저장 및 보관",
        "pt": "3. Armazenamento e retenção de dados",
        "ar": "3. تخزين البيانات والاحتفاظ بها"
    },
    "privacy.s4.title": {
        "de": "4. Grenzüberschreitende Datenübertragung",
        "fr": "4. Transfert de données transfrontalier",
        "es": "4. Transferencia de datos transfronteriza",
        "ja": "4. 国境を越えるデータ移転",
        "ko": "4. 국경 간 데이터 이전",
        "pt": "4. Transferência internacional de dados",
        "ar": "4. نقل البيانات عبر الحدود"
    },
    "privacy.s5.title": {
        "de": "5. Ihre Rechte",
        "fr": "5. Vos droits",
        "es": "5. Sus derechos",
        "ja": "5. あなたの権利",
        "ko": "5. 귀하의 권리",
        "pt": "5. Seus direitos",
        "ar": "5. حقوقك"
    },
    "privacy.s6.title": {
        "de": "6. Cookies und ähnliche Technologien",
        "fr": "6. Cookies et technologies similaires",
        "es": "6. Cookies y tecnologías similares",
        "ja": "6. Cookieおよび類似技術",
        "ko": "6. 쿠키 및 유사 기술",
        "pt": "6. Cookies e tecnologias similares",
        "ar": "6. ملفات تعريف الارتباط والتقنيات المشابهة"
    },
    "privacy.s7.title": {
        "de": "7. Rechte kalifornischer Nutzer (CCPA)",
        "fr": "7. Droits des utilisateurs californiens (CCPA)",
        "es": "7. Derechos de usuarios de California (CCPA)",
        "ja": "7. カリフォルニアユーザーの権利（CCPA）",
        "ko": "7. 캘리포니아 사용자 권리 (CCPA)",
        "pt": "7. Direitos de usuários da Califórnia (CCPA)",
        "ar": "7. حقوق مستخدمي كاليفورنيا (CCPA)"
    },
    "privacy.s8.title": {
        "de": "8. Kontaktieren Sie uns",
        "fr": "8. Nous contacter",
        "es": "8. Contáctenos",
        "ja": "8. お問い合わせ",
        "ko": "8. 문의하기",
        "pt": "8. Entre em contato",
        "ar": "8. اتصل بنا"
    },
    "privacy.s1.p1": {
        "de": "Wenn Sie unsere Website besuchen, erfassen wir automatisch die folgenden anonymen Nutzungsdaten:",
        "fr": "Lorsque vous visitez notre site, nous collectons automatiquement les données d'utilisation anonymes suivantes :",
        "es": "Al visitar nuestro sitio web, recopilamos automáticamente los siguientes datos de uso anónimos:",
        "ja": "当サイトをご利用いただく際、以下の匿名利用データを自動的に収集します：",
        "ko": "웹사이트를 방문하면 다음 익명 사용 데이터를 자동으로 수집합니다:",
        "pt": "Ao visitar nosso site, coletamos automaticamente os seguintes dados de uso anônimos:",
        "ar": "عند زيارة موقعنا، نجمع تلقائيًا بيانات الاستخدام المجهولة التالية:"
    },
    "privacy.s1.p2": {
        "de": "Diese Daten werden ausschließlich zur Servicequalitätsanalyse und Sicherheitsgewährleistung verwendet und nicht mit persönlichen Identitätsinformationen verknüpft.",
        "fr": "Ces données sont utilisées uniquement pour l'analyse de la qualité du service et la protection de la sécurité, et ne seront pas liées à des informations d'identification personnelle.",
        "es": "Estos datos se utilizan exclusivamente para el análisis de calidad del servicio y la protección de seguridad, y no se vincularán a información de identidad personal.",
        "ja": "これらのデータはサービス品質分析と安全確保のみに使用され、個人情報とは関連付けられません。",
        "ko": "이 데이터는 서비스 품질 분석과 보안 보호 목적으로만 사용되며 개인 신원 정보와 연결되지 않습니다.",
        "pt": "Estes dados são usados exclusivamente para análise de qualidade do serviço e proteção de segurança, e não serão vinculados a informações de identidade pessoal.",
        "ar": "تستخدم هذه البيانات حصريًا لتحليل جودة الخدمة والحماية الأمنية، ولن يتم ربطها بأي معلومات تعريف شخصية."
    },
    "privacy.s1.li1": {
        "de": "IP-Adresse (anonymisiert, nur die ersten zwei Bytes für Geolokalisierung behalten)",
        "fr": "Adresse IP (anonymisée, seuls les deux premiers octets sont conservés pour la géolocalisation)",
        "es": "Dirección IP (anonimizada, solo se retienen los primeros dos bytes para geolocalización)",
        "ja": "IPアドレス（匿名化、ジオロケーション用に最初の2バイトのみ保持）",
        "ko": "IP 주소 (익명화, 지리적 위치 확인을 위해 처음 2바이트만 보존)",
        "pt": "Endereço IP (anonimizado, apenas os dois primeiros bytes são mantidos para geolocalização)",
        "ar": "عنوان IP (مجهول، يُحتفظ فقط بأول بايتين لتحديد الموقع الجغرافي)"
    },
    "privacy.s1.li2": {
        "de": "Browsertyp und Version",
        "fr": "Type et version du navigateur",
        "es": "Tipo y versión del navegador",
        "ja": "ブラウザの種類とバージョン",
        "ko": "브라우저 유형 및 버전",
        "pt": "Tipo e versão do navegador",
        "ar": "نوع المتصفح وإصداره"
    },
    "privacy.s1.li3": {
        "de": "Seitenbesuchsaufzeichnungen (welche Seiten besucht wurden, Verweildauer)",
        "fr": "Enregistrements de visites de pages (quelles pages ont été visitées, durée de visite)",
        "es": "Registros de visitas a páginas (qué páginas se visitaron, duración de la estancia)",
        "ja": "ページ訪問記録（訪問ページ、滞在時間）",
        "ko": "페이지 방문 기록 (방문한 페이지, 체류 시간)",
        "pt": "Registros de visitas a páginas (quais páginas foram visitadas, tempo de permanência)",
        "ar": "سجلات زيارة الصفحات (أي الصفحات تمت زيارتها، مدة البقاء)"
    },
    "privacy.s1.li4": {
        "de": "Essenzielle Cookies: Zur Gewährleistung der grundlegenden Website-Funktionalität (z.B. Aufrechterhaltung des Sitzungsstatus)",
        "fr": "Cookies essentiels : Utilisés pour assurer les fonctionnalités de base du site (comme le maintien de l'état de session)",
        "es": "Cookies esenciales: Usadas para garantizar la funcionalidad básica del sitio (como mantener el estado de sesión)",
        "ja": "必須Cookie：基本ウェブサイト機能の確保のため（セッション状態の維持など）",
        "ko": "필수 쿠키: 기본 웹사이트 기능 보장용 (세션 상태 유지 등)",
        "pt": "Cookies essenciais: Usados para garantir a funcionalidade básica do site (como manter o estado da sessão)",
        "ar": "ملفات تعريف الارتباط الأساسية: تُستخدم لضمان وظائف الموقع الأساسية (مثل الحفاظ على حالة الجلسة)"
    },
    "privacy.s1.p3": {
        "de": "Wenn Sie sich als PRO-Mitglied registrieren, erfassen wir zusätzlich die folgenden Daten zur Bereitstellung von Mehrwertdiensten:",
        "fr": "Lorsque vous vous inscrivez en tant que membre PRO, nous collectons en outre les données suivantes pour fournir des services à valeur ajoutée :",
        "es": "Al registrarse como miembro PRO, recopilamos adicionalmente los siguientes datos para proporcionar servicios de valor añadido:",
        "ja": "PRO会員として登録される場合、付加価値サービスの提供のため以下のデータを追加で収集します：",
        "ko": "PRO 회원으로 등록하면 부가가치 서비스 제공을 위해 다음 데이터를 추가로 수집합니다:",
        "pt": "Ao se registrar como membro PRO, coletamos adicionalmente os seguintes dados para fornecer serviços de valor agregado:",
        "ar": "عند التسجيل كعضو PRO، نجمع إضافيًا البيانات التالية لتقديم خدمات ذات قيمة مضافة:"
    },
    "privacy.s1.li5": {
        "de": "E-Mail-Adresse: Zur Identitätsverifizierung, Garantieabwicklung und Servicebenachrichtigungen",
        "fr": "Adresse e-mail : Pour la vérification d'identité, le traitement des garanties et les notifications de service",
        "es": "Dirección de correo electrónico: Para verificación de identidad, procesamiento de garantías y notificaciones de servicio",
        "ja": "メールアドレス：本人確認、保証申請処理、サービス通知のため",
        "ko": "이메일 주소: 신원 확인, 보증 처리, 서비스 알림용",
        "pt": "Endereço de e-mail: Para verificação de identidade, processamento de garantias e notificações de serviço",
        "ar": "عنوان البريد الإلكتروني: للتحقق من الهوية ومعالجة الضمان وإشعارات الخدمة"
    },
    "privacy.s1.li6": {
        "de": "API-Aufruf-Zeitstempel: Zur Kontingentverwaltung und Serviceoptimierung",
        "fr": "Horodatages des appels API : Pour la gestion des quotas et l'optimisation du service",
        "es": "Marcas de tiempo de llamadas API: Para gestión de cuotas y optimización del servicio",
        "ja": "API呼び出しタイムスタンプ：クォータ管理とサービス最適化のため",
        "ko": "API 호출 타임스탬프: 할당량 관리 및 서비스 최적화용",
        "pt": "Carimbos de data/hora de chamadas API: Para gestão de cotas e otimização do serviço",
        "ar": "طوابع زمنية لاستدعاءات API: لإدارة الحصص وتحسين الخدمة"
    },
    "privacy.s1.li7": {
        "de": "Zeitzoneneinstellungen: Zur personalisierten Zeitanzeige",
        "fr": "Préférences de fuseau horaire : Pour l'affichage personnalisé de l'heure",
        "es": "Preferencias de zona horaria: Para visualización personalizada de la hora",
        "ja": "タイムゾーン設定：カスタマイズされた時間表示のため",
        "ko": "시간대 기본 설정: 맞춤 시간 표시용",
        "pt": "Preferências de fuso horário: Para exibição personalizada da hora",
        "ar": "تفضيلات المنطقة الزمنية: لعرض الوقت المخصص"
    },
    "privacy.s1.li8": {
        "de": "NTP-Kalibrierungsstatus-Abfragedatensätze: Zur Glaubwürdigkeitsbewertung und Verbesserung",
        "fr": "Enregistrements de requêtes d'état de calibration NTP : Pour l'évaluation et l'amélioration de la crédibilité",
        "es": "Registros de consultas de estado de calibración NTP: Para evaluación y mejora de credibilidad",
        "ja": "NTPキャリブレーションステータス照会記録：信頼性評価と改善のため",
        "ko": "NTP 교정 상태 조회 기록: 신뢰도 평가 및 개선용",
        "pt": "Registros de consultas de status de calibração NTP: Para avaliação e melhoria da credibilidade",
        "ar": "سجلات استعلامات حالة معايرة NTP: لتقييم وتحسين المصداقية"
    },
    "privacy.s1.li9": {
        "de": "Persönliche Identitätsinformationen (Name, Adresse, Telefonnummer)",
        "fr": "Informations d'identification personnelle (nom, adresse, numéro de téléphone)",
        "es": "Información de identidad personal (nombre, dirección, número de teléfono)",
        "ja": "個人情報（氏名、住所、電話番号）",
        "ko": "개인 신원 정보 (이름, 주소, 전화번호)",
        "pt": "Informações de identidade pessoal (nome, endereço, número de telefone)",
        "ar": "معلومات الهوية الشخصية (الاسم، العنوان، رقم الهاتف)"
    },
    "privacy.s1.li10": {
        "de": "Zahlungsinformationen (alle Zahlungen werden unabhängig von Stripe verarbeitet; wir können nicht auf Ihre Kreditkartennummer oder Ihr Bankkonto zugreifen)",
        "fr": "Informations de paiement (tous les paiements sont traités indépendamment par Stripe ; nous ne pouvons pas accéder à votre numéro de carte de crédit ou compte bancaire)",
        "es": "Información de pago (todos los pagos son procesados independientemente por Stripe; no podemos acceder a su número de tarjeta de crédito o cuenta bancaria)",
        "ja": "支払い情報（すべての決済はStripeが独立して処理。クレジットカード番号や銀行口座にはアクセスできません）",
        "ko": "결제 정보 (모든 결제는 Stripe가 독립적으로 처리하며, 신용카드 번호나 은행 계좌에 접근할 수 없습니다)",
        "pt": "Informações de pagamento (todos os pagamentos são processados independentemente pela Stripe; não podemos acessar seu número de cartão de crédito ou conta bancária)",
        "ar": "معلومات الدفع (جميع المدفوعات تتم معالجتها بشكل مستقل بواسطة Stripe؛ لا يمكننا الوصول إلى رقم بطاقتك الائتمانية أو حسابك البنكي)"
    },
    "privacy.s1.li11": {
        "de": "Browser-Fingerabdruck oder eindeutige Gerätekennungen",
        "fr": "Empreinte numérique du navigateur ou identifiants uniques d'appareil",
        "es": "Huella digital del navegador o identificadores únicos de dispositivo",
        "ja": "ブラウザフィンガープリントまたはデバイス固有ID",
        "ko": "브라우저 핑거프린트 또는 기기 고유 식별자",
        "pt": "Impressão digital do navegador ou identificadores exclusivos de dispositivo",
        "ar": "بصمة المتصفح أو معرفات الجهاز الفريدة"
    },
    "privacy.s1.li12": {
        "de": "Präzise geografische Standortinformationen",
        "fr": "Informations de localisation géographique précise",
        "es": "Información de ubicación geográfica precisa",
        "ja": "正確な地理的位置情報",
        "ko": "정확한 지리적 위치 정보",
        "pt": "Informações precisas de localização geográfica",
        "ar": "معلومات الموقع الجغرافي الدقيق"
    },
    "privacy.s2.li1": {
        "de": "Bereitstellung, Wartung und Verbesserung unseres NTP-kalibrierten Zeitdienstes",
        "fr": "Fournir, maintenir et améliorer notre service de temps calibré NTP",
        "es": "Proporcionar, mantener y mejorar nuestro servicio de tiempo calibrado por NTP",
        "ja": "NTP較正時刻サービスの提供、保守、改善",
        "ko": "NTP 교정 시간 서비스 제공, 유지 및 개선",
        "pt": "Fornecer, manter e melhorar nosso serviço de tempo calibrado por NTP",
        "ar": "تقديم وصيانة وتحسين خدمة الوقت المعايرة بـ NTP"
    },
    "privacy.s2.li2": {
        "de": "Senden notwendiger servicebezogener Benachrichtigungen an PRO-Nutzer (wie Kontingentnutzungserinnerungen, Garantieantragsergebnisse)",
        "fr": "Envoyer les notifications nécessaires liées au service aux utilisateurs PRO (comme les rappels d'utilisation de quota, les résultats de demande de garantie)",
        "es": "Enviar notificaciones necesarias relacionadas con el servicio a usuarios PRO (como recordatorios de uso de cuota, resultados de solicitudes de garantía)",
        "ja": "PROユーザーへのサービス関連必要通知（クォータ使用リマインダー、保証申請結果など）",
        "ko": "PRO 사용자에게 서비스 관련 필수 알림 전송 (할당량 사용 알림, 보증 신청 결과 등)",
        "pt": "Enviar notificações necessárias relacionadas ao serviço para usuários PRO (como lembretes de uso de cota, resultados de solicitação de garantia)",
        "ar": "إرسال الإشعارات الضرورية المتعلقة بالخدمة لمستخدمي PRO (مثل تذكيرات استخدام الحصة، نتائج طلبات الضمان)"
    },
    "privacy.s2.li3": {
        "de": "Analysieren und Überwachen der Serviceleistung, Betrugs- und Missbrauchsverhinderung",
        "fr": "Analyser et surveiller les performances du service, prévenir la fraude et les abus",
        "es": "Analizar y supervisar el rendimiento del servicio, prevenir el fraude y el abuso",
        "ja": "サービスパフォーマンスの分析・監視、不正行為と乱用の防止",
        "ko": "서비스 성능 분석 및 모니터링, 사기 및 남용 방지",
        "pt": "Analisar e monitorar o desempenho do serviço, prevenir fraude e abuso",
        "ar": "تحليل ومراقبة أداء الخدمة ومنع الاحتيال وإساءة الاستخدام"
    },
    "privacy.s2.li4": {
        "de": "Einhaltung geltender Gesetze und Vorschriften",
        "fr": "Se conformer aux lois et réglementations applicables",
        "es": "Cumplir con las leyes y regulaciones aplicables",
        "ja": "適用法令の遵守",
        "ko": "관련 법률 및 규정 준수",
        "pt": "Cumprir as leis e regulamentos aplicáveis",
        "ar": "الامتثال للقوانين واللوائح المعمول بها"
    },
    "privacy.s2.p1": {
        "de": "Wir werden Ihre Daten nicht verwenden für: gezielte Werbung, Nutzerprofilierung oder Verkauf an Dritte.",
        "fr": "Nous n'utiliserons pas vos données pour : la publicité ciblée, le profilage des utilisateurs ou la vente à des tiers.",
        "es": "No usaremos sus datos para: publicidad dirigida, perfilamiento de usuarios o venta a terceros.",
        "ja": "データを次の目的には使用しません：ターゲット広告、ユーザープロファイリング、第三者への販売。",
        "ko": "귀하의 데이터를 다음 목적으로 사용하지 않습니다: 타겟 광고, 사용자 프로파일링, 제3자 판매.",
        "pt": "Não usaremos seus dados para: publicidade direcionada, criação de perfil de usuários ou venda a terceiros.",
        "ar": "لن نستخدم بياناتك من أجل: الإعلانات المستهدفة، أو إنشاء ملفات تعريف المستخدمين، أو البيع لأطراف ثالثة."
    },
    "privacy.s3.p1": {
        "de": "Alle Daten werden im globalen Cloudflare-Edge-Netzwerk gespeichert und nutzen dessen integrierte Verschlüsselungsmechanismen. Daten werden während der aktiven Kontoperiode aufbewahrt. Bei Kontolöschung werden alle zugehörigen Daten innerhalb von 30 Tagen automatisch aus dem System entfernt.",
        "fr": "Toutes les données sont stockées dans le réseau de périphérie mondial de Cloudflare, utilisant ses mécanismes de stockage chiffré intégrés. Les données sont conservées pendant la période active du compte. En cas de suppression du compte, toutes les données associées seront automatiquement supprimées du système dans les 30 jours.",
        "es": "Todos los datos se almacenan en la red perimetral global de Cloudflare, utilizando sus mecanismos de almacenamiento cifrado integrados. Los datos se retienen durante el período activo de la cuenta. Al eliminar la cuenta, todos los datos asociados se eliminarán automáticamente del sistema en 30 días.",
        "ja": "すべてのデータはCloudflareのグローバルエッジネットワークに保存され、内蔵の暗号化ストレージメカニズムを利用しています。データはアカウントの有効期間中保持されます。アカウント削除後、関連データは30日以内にシステムから自動的に削除されます。",
        "ko": "모든 데이터는 Cloudflare 글로벌 엣지 네트워크에 저장되며 내장된 암호화 스토리지 메커니즘을 사용합니다. 데이터는 계정 활성 기간 동안 보관됩니다. 계정 삭제 시 모든 관련 데이터는 30일 이내에 시스템에서 자동으로 제거됩니다.",
        "pt": "Todos os dados são armazenados na rede de borda global da Cloudflare, utilizando seus mecanismos de armazenamento criptografado integrados. Os dados são retidos durante o período ativo da conta. Ao excluir a conta, todos os dados associados serão removidos automaticamente do sistema em 30 dias.",
        "ar": "يتم تخزين جميع البيانات في شبكة حافة Cloudflare العالمية، باستخدام آليات التخزين المشفر المدمجة. يتم الاحتفاظ بالبيانات خلال فترة الحساب النشط. عند حذف الحساب، ستتم إزالة جميع البيانات المرتبطة تلقائيًا من النظام خلال 30 يومًا."
    },
    "privacy.s4.p1": {
        "de": "Unser Dienst wird über das globale Cloudflare-Netzwerk bereitgestellt, was bedeutet, dass Ihre Daten zwischen Servern in verschiedenen Ländern oder Regionen übertragen werden können. Wir haben angemessene Sicherheitsmaßnahmen (einschließlich Ende-zu-Ende-Verschlüsselung) implementiert, um Ihre Daten zu schützen. Durch die Nutzung dieses Dienstes verstehen und stimmen Sie dieser grenzüberschreitenden Datenübertragungsregelung zu.",
        "fr": "Notre service est fourni via le réseau mondial Cloudflare, ce qui signifie que vos données peuvent être transmises entre des serveurs situés dans différents pays ou régions. Nous avons mis en place des mesures de sécurité appropriées (y compris le chiffrement de bout en bout) pour protéger vos données. En utilisant ce service, vous comprenez et acceptez cet arrangement de transfert de données transfrontalier.",
        "es": "Nuestro servicio se proporciona a través de la red global de Cloudflare, lo que significa que sus datos pueden transmitirse entre servidores ubicados en diferentes países o regiones. Hemos implementado medidas de seguridad apropiadas (incluyendo cifrado de extremo a extremo) para proteger sus datos. Al usar este servicio, usted comprende y acepta este acuerdo de transferencia de datos transfronteriza.",
        "ja": "当サービスはCloudflareのグローバルネットワークを通じて提供されるため、データが異なる国や地域のサーバー間で転送される場合があります。適切なセキュリティ対策（エンドツーエンド暗号化を含む）を実装してデータを保護しています。本サービスの利用により、この国境を越えるデータ移転の取り決めに理解し同意したものとみなします。",
        "ko": "본 서비스는 Cloudflare 글로벌 네트워크를 통해 제공되므로, 데이터가 다른 국가나 지역의 서버 간에 전송될 수 있습니다. 적절한 보안 조치(종단간 암호화 포함)를 구현하여 데이터를 보호합니다. 본 서비스를 사용함으로써 이 국경 간 데이터 이전 약정에 동의하는 것으로 간주됩니다.",
        "pt": "Nosso serviço é fornecido pela rede global da Cloudflare, o que significa que seus dados podem ser transmitidos entre servidores localizados em diferentes países ou regiões. Implementamos medidas de segurança apropriadas (incluindo criptografia ponta a ponta) para proteger seus dados. Ao usar este serviço, você entende e concorda com este acordo de transferência internacional de dados.",
        "ar": "يتم تقديم خدمتنا عبر شبكة Cloudflare العالمية، مما يعني أنه قد يتم نقل بياناتك بين خوادم في دول أو مناطق مختلفة. لقد نفذنا تدابير أمنية مناسبة (بما في ذلك التشفير من طرف إلى طرف) لحماية بياناتك. باستخدام هذه الخدمة، فإنك تفهم وتوافق على ترتيب نقل البيانات عبر الحدود هذا."
    },
    "privacy.s5.p1": {
        "de": "Unabhängig von Ihrem Land oder Ihrer Region haben Sie folgende Rechte:",
        "fr": "Quel que soit votre pays ou région, vous disposez des droits suivants :",
        "es": "Independientemente de su país o región, usted tiene los siguientes derechos:",
        "ja": "国や地域を問わず、以下の権利があります：",
        "ko": "국가나 지역에 관계없이 다음 권리가 있습니다:",
        "pt": "Independentemente do seu país ou região, você tem os seguintes direitos:",
        "ar": "بغض النظر عن بلدك أو منطقتك، لديك الحقوق التالية:"
    },
    "privacy.s5.li1": {
        "de": "Auskunftsrecht: Anforderung zur Einsicht der über Sie gespeicherten personenbezogenen Daten",
        "fr": "Droit d'accès : Demander la consultation des données personnelles que nous détenons sur vous",
        "es": "Derecho de acceso: Solicitar revisión de los datos personales que tenemos sobre usted",
        "ja": "アクセス権：当社が保持する個人データの閲覧請求",
        "ko": "접근 권리: 당사가 보유한 귀하의 개인 데이터 검토 요청",
        "pt": "Direito de acesso: Solicitar a revisão dos dados pessoais que mantemos sobre você",
        "ar": "حق الوصول: طلب مراجعة البيانات الشخصية التي نحتفظ بها عنك"
    },
    "privacy.s5.li2": {
        "de": "Berichtigungsrecht: Anforderung zur Korrektur ungenauer oder unvollständiger Daten",
        "fr": "Droit de rectification : Demander la correction de données inexactes ou incomplètes",
        "es": "Derecho de rectificación: Solicitar corrección de datos inexactos o incompletos",
        "ja": "訂正権：不正確または不完全なデータの修正請求",
        "ko": "정정 권리: 부정확하거나 불완전한 데이터 수정 요청",
        "pt": "Direito de retificação: Solicitar correção de dados imprecisos ou incompletos",
        "ar": "حق التصحيح: طلب تصحيح البيانات غير الدقيقة أو غير المكتملة"
    },
    "privacy.s5.li3": {
        "de": "Recht auf Datenübertragbarkeit: Anforderung zum Export Ihrer Daten in einem strukturierten, gängigen Format",
        "fr": "Droit à la portabilité des données : Demander l'exportation de vos données dans un format structuré et couramment utilisé",
        "es": "Derecho a la portabilidad de datos: Solicitar exportación de sus datos en un formato estructurado y de uso común",
        "ja": "データポータビリティ権：構造化され一般的に使用される形式でのデータエクスポート請求",
        "ko": "데이터 이동권: 구조화되고 일반적으로 사용되는 형식으로 데이터 내보내기 요청",
        "pt": "Direito à portabilidade de dados: Solicitar exportação de seus dados em formato estruturado e comumente usado",
        "ar": "حق نقل البيانات: طلب تصدير بياناتك بتنسيق منظم وشائع الاستخدام"
    },
    "privacy.s5.li4": {
        "de": "Recht auf Löschung: Anforderung zur Löschung Ihrer bei uns gespeicherten personenbezogenen Daten",
        "fr": "Droit à l'effacement : Demander la suppression des données personnelles que nous détenons sur vous",
        "es": "Derecho de supresión: Solicitar la eliminación de sus datos personales que mantenemos",
        "ja": "削除権：当社が保持する個人データの削除請求",
        "ko": "삭제 권리: 당사가 보유한 귀하의 개인 데이터 삭제 요청",
        "pt": "Direito de eliminação: Solicitar a exclusão dos dados pessoais que mantemos sobre você",
        "ar": "حق المحو: طلب حذف بياناتك الشخصية التي نحتفظ بها"
    },
    "privacy.s5.p2": {
        "de": "Um eines der oben genannten Rechte auszuüben, senden Sie bitte eine E-Mail an privacy@globetimezone.com. Wir werden auf Ihre Anfrage innerhalb von 30 Tagen antworten.",
        "fr": "Pour exercer l'un des droits ci-dessus, veuillez envoyer un e-mail à privacy@globetimezone.com. Nous répondrons à votre demande dans les 30 jours.",
        "es": "Para ejercer cualquiera de los derechos anteriores, envíe un correo a privacy@globetimezone.com. Responderemos a su solicitud dentro de 30 días.",
        "ja": "上記のいずれかの権利を行使するには、privacy@globetimezone.com にメールしてください。30日以内に対応いたします。",
        "ko": "위 권리를 행사하려면 privacy@globetimezone.com으로 이메일을 보내주세요. 30일 이내에 요청에 응답합니다.",
        "pt": "Para exercer qualquer um dos direitos acima, envie um e-mail para privacy@globetimezone.com. Responderemos à sua solicitação em 30 dias.",
        "ar": "لممارسة أي من الحقوق المذكورة أعلاه، يرجى إرسال بريد إلكتروني إلى privacy@globetimezone.com. سنرد على طلبك خلال 30 يومًا."
    },
    "privacy.s6.p1": {
        "de": "Wir verwenden nur essenzielle Cookies, um die grundlegende Website-Funktionalität zu gewährleisten (wie das Speichern Ihrer Spracheinstellung). Wir verwenden keine Tracking-Cookies, Werbe-Cookies von Dritten oder Analyse-Cookies. Sie können Cookies über Ihre Browsereinstellungen ablehnen oder löschen.",
        "fr": "Nous utilisons uniquement des cookies essentiels pour assurer les fonctionnalités de base du site (comme mémoriser votre préférence de langue). Nous n'utilisons aucun cookie de suivi, cookie publicitaire tiers ou cookie d'analyse. Vous pouvez refuser ou supprimer les cookies via les paramètres de votre navigateur.",
        "es": "Solo usamos cookies esenciales para garantizar la funcionalidad básica del sitio (como recordar su preferencia de idioma). No usamos cookies de rastreo, cookies publicitarias de terceros ni cookies de análisis. Puede rechazar o eliminar cookies desde la configuración de su navegador.",
        "ja": "基本ウェブサイト機能の確保のため（言語設定の記憶など）必須Cookieのみ使用します。トラッキングCookie、サードパーティ広告Cookie、分析Cookieは一切使用しません。ブラウザ設定でCookieを拒否・削除できます。",
        "ko": "기본 웹사이트 기능 보장을 위한(언어 기본 설정 기억 등) 필수 쿠키만 사용합니다. 추적 쿠키, 제3자 광고 쿠키, 분석 쿠키는 사용하지 않습니다. 브라우저 설정에서 쿠키를 거부하거나 삭제할 수 있습니다.",
        "pt": "Usamos apenas cookies essenciais para garantir a funcionalidade básica do site (como lembrar sua preferência de idioma). Não usamos cookies de rastreamento, cookies de publicidade de terceiros ou cookies de análise. Você pode rejeitar ou excluir cookies nas configurações do navegador.",
        "ar": "نستخدم فقط ملفات تعريف الارتباط الأساسية لضمان وظائف الموقع الأساسية (مثل تذكر تفضيل لغتك). لا نستخدم ملفات تعريف ارتباط تتبع أو إعلانات طرف ثالث أو تحليلات. يمكنك رفض أو حذف ملفات تعريف الارتباط من إعدادات المتصفح."
    },
    "privacy.s7.p1": {
        "de": "Gemäß dem California Consumer Privacy Act (CCPA) haben kalifornische Einwohner folgende zusätzliche Rechte:",
        "fr": "En vertu du California Consumer Privacy Act (CCPA), les résidents de Californie disposent des droits supplémentaires suivants :",
        "es": "Bajo la Ley de Privacidad del Consumidor de California (CCPA), los residentes de California tienen los siguientes derechos adicionales:",
        "ja": "カリフォルニア消費者プライバシー法（CCPA）に基づき、カリフォルニア在住者には以下の追加権利があります：",
        "ko": "캘리포니아 소비자 개인정보 보호법(CCPA)에 따라 캘리포니아 거주자에게는 다음 추가 권리가 있습니다:",
        "pt": "Sob a Lei de Privacidade do Consumidor da Califórnia (CCPA), os residentes da Califórnia têm os seguintes direitos adicionais:",
        "ar": "بموجب قانون خصوصية المستهلك في كاليفورنيا (CCPA)، يتمتع سكان كاليفورنيا بالحقوق الإضافية التالية:"
    },
    "privacy.s7.li1": {
        "de": "Anforderung zur Offenlegung der Kategorien und des konkreten Inhalts der in den letzten 12 Monaten gesammelten personenbezogenen Informationen",
        "fr": "Demander la divulgation des catégories et du contenu spécifique des informations personnelles collectées au cours des 12 derniers mois",
        "es": "Solicitar la divulgación de las categorías y contenido específico de la información personal recopilada en los últimos 12 meses",
        "ja": "過去12ヶ月間に収集された個人情報のカテゴリと具体的内容の開示請求",
        "ko": "지난 12개월간 수집된 개인정보의 범주와 구체적 내용 공개 요청",
        "pt": "Solicitar a divulgação das categorias e conteúdo específico das informações pessoais coletadas nos últimos 12 meses",
        "ar": "طلب الإفصاح عن فئات ومحتوى المعلومات الشخصية التي تم جمعها في آخر 12 شهرًا"
    },
    "privacy.s7.li2": {
        "de": "Anforderung zur Löschung der gesammelten personenbezogenen Informationen (sofern gesetzlich nicht anderweitig erforderlich)",
        "fr": "Demander la suppression des informations personnelles collectées (sauf obligation légale contraire)",
        "es": "Solicitar la eliminación de la información personal recopilada (salvo requerimiento legal)",
        "ja": "収集された個人情報の削除請求（法律で別途定めがある場合を除く）",
        "ko": "수집된 개인정보 삭제 요청 (법률에서 별도로 요구하는 경우 제외)",
        "pt": "Solicitar a exclusão das informações pessoais coletadas (exceto quando exigido por lei)",
        "ar": "طلب حذف المعلومات الشخصية التي تم جمعها (إلا إذا تطلب القانون خلاف ذلك)"
    },
    "privacy.s7.li3": {
        "de": "Widerspruch gegen den Verkauf Ihrer personenbezogenen Informationen (Wir bestätigen: wir verkaufen keine personenbezogenen Informationen)",
        "fr": "S'opposer à la vente de vos informations personnelles (Nous confirmons : nous ne vendons aucune information personnelle)",
        "es": "Oponerse a la venta de su información personal (Confirmamos: no vendemos ninguna información personal)",
        "ja": "個人情報の販売の拒否（当社は個人情報を一切販売しません）",
        "ko": "개인정보 판매 거부 (당사는 개인정보를 판매하지 않음을 확인합니다)",
        "pt": "Optar por não participar da venda de suas informações pessoais (Confirmamos: não vendemos nenhuma informação pessoal)",
        "ar": "رفض بيع معلوماتك الشخصية (نؤكد: لا نبيع أي معلومات شخصية)"
    },
    "privacy.s7.li4": {
        "de": "Keine diskriminierende Behandlung bei der Ausübung von CCPA-Rechten",
        "fr": "Ne pas subir de traitement discriminatoire lors de l'exercice des droits CCPA",
        "es": "No ser objeto de trato discriminatorio al ejercer los derechos CCPA",
        "ja": "CCPA権利の行使による差別的扱いの禁止",
        "ko": "CCPA 권리 행사 시 차별 대우 금지",
        "pt": "Não ser submetido a tratamento discriminatório ao exercer direitos CCPA",
        "ar": "عدم التعرض لمعاملة تمييزية عند ممارسة حقوق CCPA"
    },
    "privacy.s8.p1": {
        "de": "Wenn Sie Fragen, Kommentare oder Beschwerden zu dieser Datenschutzrichtlinie haben, kontaktieren Sie uns bitte über folgende Methoden:",
        "fr": "Si vous avez des questions, commentaires ou plaintes concernant cette politique de confidentialité, veuillez nous contacter par les moyens suivants :",
        "es": "Si tiene preguntas, comentarios o quejas sobre esta política de privacidad, contáctenos a través de los siguientes métodos:",
        "ja": "本プライバシーポリシーに関するご質問、コメント、苦情は以下の方法でお問い合わせください：",
        "ko": "본 개인정보 보호정책에 대한 질문, 의견, 불만사항이 있으시면 다음 방법으로 문의해 주세요:",
        "pt": "Se você tiver dúvidas, comentários ou reclamações sobre esta política de privacidade, entre em contato pelos seguintes meios:",
        "ar": "إذا كانت لديك أسئلة أو تعليقات أو شكاوى حول سياسة الخصوصية هذه، تواصل معنا بالطرق التالية:"
    },
    "privacy.s8.li1": {
        "de": "E-Mail: privacy@globetimezone.com",
        "fr": "E-mail : privacy@globetimezone.com",
        "es": "Correo: privacy@globetimezone.com",
        "ja": "メール：privacy@globetimezone.com",
        "ko": "이메일: privacy@globetimezone.com",
        "pt": "E-mail: privacy@globetimezone.com",
        "ar": "البريد الإلكتروني: privacy@globetimezone.com"
    },
    "privacy.s8.p2": {
        "de": "Wir werden Ihre E-Mail so schnell wie möglich beantworten, in der Regel innerhalb von 5 Werktagen.",
        "fr": "Nous répondrons à votre e-mail dans les plus brefs délais, généralement dans les 5 jours ouvrables.",
        "es": "Responderemos su correo lo antes posible, generalmente dentro de 5 días hábiles.",
        "ja": "できるだけ早くメールに返信いたします。通常5営業日以内です。",
        "ko": "최대한 빨리 이메일에 답변드리며, 일반적으로 5영업일 이내입니다.",
        "pt": "Responderemos seu e-mail o mais rápido possível, geralmente em até 5 dias úteis.",
        "ar": "سنرد على بريدك الإلكتروني في أقرب وقت ممكن، عادةً خلال 5 أيام عمل."
    },

    # ===== xb/crossborder misc (14 keys - proper nouns + short words) =====
    "xb.carrier.fedex": {
        "de": "FedEx International", "fr": "FedEx International", "es": "FedEx Internacional",
        "ja": "FedEx国際", "ko": "FedEx 국제", "pt": "FedEx Internacional", "ar": "FedEx الدولي"
    },
    "xb.carrier.fba.name": {
        "de": "Amazon FBA", "fr": "Amazon FBA", "es": "Amazon FBA",
        "ja": "Amazon FBA", "ko": "Amazon FBA", "pt": "Amazon FBA", "ar": "Amazon FBA"
    },
    "xb.origin.shenzhen": {
        "de": "Shenzhen", "fr": "Shenzhen", "es": "Shenzhen",
        "ja": "深セン", "ko": "선전", "pt": "Shenzhen", "ar": "شنتشن"
    },
    "xb.origin.guangzhou": {
        "de": "Guangzhou", "fr": "Guangzhou", "es": "Guangzhou",
        "ja": "広州", "ko": "광저우", "pt": "Guangzhou", "ar": "قوانغتشو"
    },
    "xb.origin.yiwu": {
        "de": "Yiwu", "fr": "Yiwu", "es": "Yiwu",
        "ja": "義烏", "ko": "이우", "pt": "Yiwu", "ar": "ييوو"
    },
    "xb.origin.shanghai": {
        "de": "Shanghai", "fr": "Shanghai", "es": "Shanghai",
        "ja": "上海", "ko": "상하이", "pt": "Xangai", "ar": "شنغهاي"
    },
    "xb.origin.ningbo": {
        "de": "Ningbo", "fr": "Ningbo", "es": "Ningbo",
        "ja": "寧波", "ko": "닝보", "pt": "Ningbo", "ar": "نينغبو"
    },
    "xb.origin.qingdao": {
        "de": "Qingdao", "fr": "Qingdao", "es": "Qingdao",
        "ja": "青島", "ko": "칭다오", "pt": "Qingdao", "ar": "تشينغداو"
    },
    "xb.hs.phone": {
        "de": "Smartphone", "fr": "Smartphone", "es": "Teléfono inteligente",
        "ja": "スマートフォン", "ko": "스마트폰", "pt": "Smartphone", "ar": "هاتف ذكي"
    },
    "xb.type.express": {
        "de": "Express", "fr": "Express", "es": "Exprés",
        "ja": "エクスプレス", "ko": "특송", "pt": "Expresso", "ar": "بريد سريع"
    },
    "xb.result.transit": {
        "de": "Transit ", "fr": "Transit ", "es": "Tránsito ",
        "ja": "輸送 ", "ko": "운송 ", "pt": "Trânsito ", "ar": "عبور "
    },
    "xb.cty.JP": {
        "de": "Japan", "fr": "Japon", "es": "Japón",
        "ja": "日本", "ko": "일본", "pt": "Japão", "ar": "اليابان"
    },
    "xb.loc.shenzhen": {
        "de": "Shenzhen", "fr": "Shenzhen", "es": "Shenzhen",
        "ja": "深セン", "ko": "선전", "pt": "Shenzhen", "ar": "شنتشن"
    },

    # ===== hk misc (3 keys - separators/connectors) =====
    "hk.share.to": {
        "de": " → ", "fr": " → ", "es": " → ",
        "ja": " → ", "ko": " → ", "pt": " → ", "ar": " ← "
    },
    "hk.share.yuan": {
        "de": "\n", "fr": "\n", "es": "\n",
        "ja": "\n", "ko": "\n", "pt": "\n", "ar": "\n"
    },
    "hk.countdown.in_days": {
        "de": " in ", "fr": " dans ", "es": " en ",
        "ja": "あと", "ko": " ", "pt": " em ", "ar": " في "
    },
}

def apply_part3():
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

        for key, translations in PART3.items():
            if key not in data:
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
            f.write('\n')

        stats[lang] = updated
        print(f'✅ {lang}.json: {updated} keys translated, {skipped} skipped')

    print('\n=== Part3 Summary ===')
    for lang, count in stats.items():
        print(f'  {lang}: {count} keys updated')
    print('Done!')

if __name__ == '__main__':
    apply_part3()
