"""
inject_hk_keys.py
Injects hk.* i18n keys (cross-border-hooks.js) into 9 locale JSON files.
"""
import json, os

locales_dir = r'C:/Users/ASUS/WorkBuddy/Claw/globetimezone/locales'

hk_keys = {
  'hk.empty_shipping': {'zh':'暂无查询记录','en':'No query records yet','de':'Noch keine Abfragen','fr':'Aucune recherche pour l\'instant','es':'Sin registros de consulta','ja':'照会履歴なし','ko':'조회 기록 없음','pt':'Sem registros de consulta','ar':'لا توجد سجلات استعلام'},
  'hk.empty_shipping_hint': {'zh':'查询物流后自动保存','en':'Auto-saved after querying','de':'Nach Abfrage automatisch gespeichert','fr':'Sauvegardé après recherche','es':'Guardado automáticamente al consultar','ja':'照会後に自動保存','ko':'조회 후 자동 저장','pt':'Salvo automaticamente após consulta','ar':'يُحفظ تلقائياً بعد الاستعلام'},
  'hk.empty_tracking': {'zh':'暂无追踪记录','en':'No tracking records yet','de':'Noch keine Tracking-Einträge','fr':'Aucun suivi pour l\'instant','es':'Sin registros de rastreo','ja':'追跡履歴なし','ko':'추적 기록 없음','pt':'Sem registros de rastreamento','ar':'لا توجد سجلات تتبع'},
  'hk.empty_tracking_hint': {'zh':'追踪包裹后自动保存','en':'Auto-saved after tracking','de':'Nach Tracking automatisch gespeichert','fr':'Sauvegardé après suivi','es':'Guardado automáticamente al rastrear','ja':'追跡後に自動保存','ko':'추적 후 자동 저장','pt':'Salvo automaticamente após rastreamento','ar':'يُحفظ تلقائياً بعد التتبع'},
  'hk.days': {'zh':'天','en':'d','de':'T','fr':'j','es':'d','ja':'日','ko':'일','pt':'d','ar':'يوم'},
  'hk.requery': {'zh':'再查一次','en':'Search again','de':'Erneut suchen','fr':'Rechercher à nouveau','es':'Buscar de nuevo','ja':'再検索','ko':'다시 조회','pt':'Pesquisar novamente','ar':'البحث مرة أخرى'},
  'hk.confirm_clear': {'zh':'确定要清空所有历史记录吗？','en':'Clear all history?','de':'Alle Verläufe löschen?','fr':'Effacer tout l\'historique ?','es':'¿Borrar todo el historial?','ja':'すべての履歴を消去しますか？','ko':'모든 기록을 지우시겠습니까?','pt':'Apagar todo o histórico?','ar':'هل تريد مسح كل السجلات؟'},
  'hk.value.saved_freight': {'zh':'已为你节省运费','en':'Freight saved for you','de':'Frachtkosten gespart','fr':'Fret économisé pour vous','es':'Flete ahorrado para ti','ja':'節約できた運賃','ko':'절약된 운임','pt':'Frete economizado para você','ar':'تم توفير تكاليف الشحن'},
  'hk.value.fastest_arrive': {'zh':'最快可提前到达','en':'Fastest possible arrival','de':'Frühestmögliche Ankunft','fr':'Arrivée la plus rapide possible','es':'Llegada más rápida posible','ja':'最速での到着','ko':'가장 빠른 도착','pt':'Chegada mais rápida possível','ar':'أسرع وصول ممكن'},
  'hk.value.avoided_loss': {'zh':'避免潜在延误损失','en':'Avoided potential delay loss','de':'Mögliche Verzögerungskosten vermieden','fr':'Perte de délai évitée','es':'Pérdida por retraso evitada','ja':'遅延損失を回避','ko':'지연 손실 방지','pt':'Perda por atraso evitada','ar':'تجنب خسائر التأخير المحتملة'},
  'hk.share_btn': {'zh':'分享给同行','en':'Share with peers','de':'Mit Kollegen teilen','fr':'Partager avec les pairs','es':'Compartir con colegas','ja':'仲間にシェア','ko':'동료에게 공유','pt':'Compartilhar com colegas','ar':'مشاركة مع الزملاء'},
  'hk.status.failed': {'zh':'派送失败','en':'Delivery failed','de':'Zustellung fehlgeschlagen','fr':'Livraison échouée','es':'Entrega fallida','ja':'配達失敗','ko':'배달 실패','pt':'Entrega falhou','ar':'فشل التسليم'},
  'hk.status.stuck': {'zh':'滞留异常','en':'Abnormal detention','de':'Ungewöhnliche Verzögerung','fr':'Rétention anormale','es':'Retención anormal','ja':'異常滞留','ko':'비정상 체류','pt':'Detenção anormal','ar':'احتجاز غير طبيعي'},
  'hk.warn.customs': {'zh':'正在等待清关，建议联系物流商了解进度','en':'Awaiting customs clearance, contact carrier for updates','de':'Wartet auf Zollabfertigung, Spediteur kontaktieren','fr':'En attente de dédouanement, contactez le transporteur','es':'Esperando aduana, contacte al transportista','ja':'通関待ち、物流会社に進捗確認を','ko':'통관 대기 중, 물류사에 진행 상황 문의','pt':'Aguardando desembaraço aduaneiro, contacte o transportador','ar':'في انتظار التخليص الجمركي، تواصل مع شركة النقل'},
  'hk.warn.failed': {'zh':'派送失败，建议确认收件地址是否正确','en':'Delivery failed, please verify the delivery address','de':'Zustellung fehlgeschlagen, bitte Adresse prüfen','fr':'Livraison échouée, vérifiez l\'adresse de livraison','es':'Entrega fallida, verifique la dirección de entrega','ja':'配達失敗、配達先住所を確認してください','ko':'배달 실패, 배달 주소 확인 필요','pt':'Entrega falhou, verifique o endereço de entrega','ar':'فشل التسليم، يرجى التحقق من عنوان التسليم'},
  'hk.warn.stuck': {'zh':'包裹异常滞留，建议立即联系物流商处理','en':'Package abnormally detained, contact carrier immediately','de':'Paket ungewöhnlich verzögert, sofort Spediteur kontaktieren','fr':'Colis anormalement retenu, contactez immédiatement le transporteur','es':'Paquete anormalmente retenido, contacte al transportista de inmediato','ja':'荷物が異常滞留、すぐ物流会社に連絡を','ko':'화물 비정상 체류, 즉시 물류사에 연락','pt':'Pacote anormalmente detido, contate o transportador imediatamente','ar':'الطرد محتجز بشكل غير طبيعي، تواصل فوراً مع شركة النقل'},
  'hk.warn.title': {'zh':'⚠️ 包裹异常提醒','en':'⚠️ Package Alert','de':'⚠️ Paketwarnung','fr':'⚠️ Alerte colis','es':'⚠️ Alerta de paquete','ja':'⚠️ 荷物異常アラート','ko':'⚠️ 패키지 알림','pt':'⚠️ Alerta de pacote','ar':'⚠️ تنبيه الطرد'},
  'hk.warn.waybill': {'zh':'运单','en':'Waybill','de':'Frachtbrief','fr':'Bordereau','es':'Guía','ja':'運送状','ko':'운송장','pt':'Guia','ar':'بوليصة الشحن'},
  'hk.warn.click': {'zh':'点击查看处理建议','en':'Click for resolution tips','de':'Klicken für Lösungshinweise','fr':'Cliquez pour conseils de résolution','es':'Haga clic para sugerencias','ja':'クリックで対処法を確認','ko':'클릭하여 해결 방법 보기','pt':'Clique para dicas de resolução','ar':'انقر للحصول على نصائح الحل'},
  'hk.no_info': {'zh':'暂无信息','en':'No info','de':'Keine Info','fr':'Aucune info','es':'Sin información','ja':'情報なし','ko':'정보 없음','pt':'Sem informação','ar':'لا توجد معلومات'},
  'hk.recommend_title': {'zh':'为你推荐','en':'Recommended for you','de':'Für dich empfohlen','fr':'Recommandé pour vous','es':'Recomendado para ti','ja':'あなたへのおすすめ','ko':'추천 항목','pt':'Recomendado para você','ar':'موصى به لك'},
  'hk.no_notifications': {'zh':'暂无新通知','en':'No new notifications','de':'Keine neuen Benachrichtigungen','fr':'Aucune nouvelle notification','es':'Sin notificaciones nuevas','ja':'新しい通知なし','ko':'새 알림 없음','pt':'Sem novas notificações','ar':'لا توجد إشعارات جديدة'},
  # recommendations
  'hk.rec.calc_profit': {'zh':'计算真实利润','en':'Calculate real profit','de':'Echten Gewinn berechnen','fr':'Calculer le profit réel','es':'Calcular ganancia real','ja':'実際の利益を計算','ko':'실제 이익 계산','pt':'Calcular lucro real','ar':'احسب الربح الحقيقي'},
  'hk.rec.calc_profit_desc': {'zh':'输入售价和成本，一键计算净利润和ROI','en':'Enter price & cost to calculate net profit and ROI','de':'Preis und Kosten eingeben, Nettogewinn und ROI berechnen','fr':'Entrez prix et coût, calculez profit net et ROI','es':'Ingrese precio y costo para calcular ganancia neta y ROI','ja':'価格とコストを入力して純利益とROIを計算','ko':'가격과 비용을 입력해 순이익과 ROI 계산','pt':'Insira preço e custo para calcular lucro líquido e ROI','ar':'أدخل السعر والتكلفة لحساب صافي الربح والعائد'},
  'hk.rec.best_ship_day': {'zh':'最佳发货时间','en':'Best shipping day','de':'Bester Versandtag','fr':'Meilleur jour d\'expédition','es':'Mejor día de envío','ja':'最適な発送日','ko':'최적 발송일','pt':'Melhor dia para envio','ar':'أفضل يوم للشحن'},
  'hk.rec.best_ship_day_desc': {'zh':'查看今天发货的目的地到达时间和派送安排','en':'Check today\'s ETA and delivery schedule for your destination','de':'Heutige Ankunftszeit und Lieferplan für Ziel prüfen','fr':'Vérifier l\'ETA d\'aujourd\'hui et le calendrier de livraison','es':'Verificar ETA de hoy y calendario de entrega para destino','ja':'今日発送した場合の到着時刻と配達スケジュールを確認','ko':'오늘 발송 시 목적지 도착 시간 및 배달 일정 확인','pt':'Verificar ETA de hoje e cronograma de entrega para o destino','ar':'تحقق من وقت الوصول المتوقع وجدول التسليم لوجهتك'},
  'hk.rec.tariff': {'zh':'预估进口关税','en':'Estimate import duty','de':'Importzoll schätzen','fr':'Estimer les droits d\'importation','es':'Estimar aranceles de importación','ja':'輸入関税を見積もる','ko':'수입 관세 추정','pt':'Estimar imposto de importação','ar':'تقدير الرسوم الجمركية للاستيراد'},
  'hk.rec.tariff_desc': {'zh':'提前计算关税和DDP总价，避免意外成本','en':'Pre-calculate duty and DDP total to avoid unexpected costs','de':'Zoll und DDP-Gesamtpreis vorab berechnen','fr':'Précalculer droits et total DDP pour éviter coûts inattendus','es':'Precalcular aranceles y total DDP para evitar costos inesperados','ja':'関税とDDP総額を事前計算して予期しないコストを回避','ko':'관세 및 DDP 총액을 미리 계산해 예상치 못한 비용 방지','pt':'Pré-calcular taxa e total DDP para evitar custos inesperados','ar':'احسب الرسوم الجمركية وإجمالي DDP مسبقاً لتجنب التكاليف غير المتوقعة'},
  'hk.rec.view_logistics': {'zh':'查看物流方案','en':'View logistics options','de':'Logistikoptionen ansehen','fr':'Voir les options logistiques','es':'Ver opciones logísticas','ja':'物流オプションを見る','ko':'물류 옵션 보기','pt':'Ver opções logísticas','ar':'عرض خيارات اللوجستيات'},
  'hk.rec.view_logistics_desc': {'zh':'对比不同物流商的价格和时效','en':'Compare prices and delivery times across carriers','de':'Preise und Lieferzeiten bei verschiedenen Spediteuren vergleichen','fr':'Comparer prix et délais de différents transporteurs','es':'Comparar precios y tiempos de entrega entre transportistas','ja':'複数の物流会社の価格と配達時間を比較','ko':'여러 물류사의 가격과 배송 시간 비교','pt':'Comparar preços e tempos de entrega entre transportadoras','ar':'قارن الأسعار وأوقات التسليم بين شركات الشحن'},
  'hk.rec.customs_delay': {'zh':'清关延误查询','en':'Customs delay lookup','de':'Zollverzögerung nachschlagen','fr':'Recherche de délai douanier','es':'Consulta de retraso aduanero','ja':'通関遅延照会','ko':'통관 지연 조회','pt':'Consulta de atraso aduaneiro','ar':'البحث عن تأخير التخليص الجمركي'},
  'hk.rec.customs_delay_desc': {'zh':'了解各国清关要求，避免扣关','en':'Learn customs requirements by country to avoid detention','de':'Zollanforderungen pro Land kennen, um Beschlagnahmen zu vermeiden','fr':'Comprendre les exigences douanières par pays pour éviter la rétention','es':'Conocer requisitos aduaneros por país para evitar detenciones','ja':'国別の通関要件を把握して差し押さえを回避','ko':'국가별 통관 요건 파악으로 억류 방지','pt':'Conhecer requisitos aduaneiros por país para evitar detenção','ar':'تعرف على متطلبات الجمارك حسب البلد لتجنب الاحتجاز'},
  'hk.rec.order_profit': {'zh':'计算订单利润','en':'Calculate order profit','de':'Auftragsgewinn berechnen','fr':'Calculer le profit de la commande','es':'Calcular ganancia del pedido','ja':'注文利益を計算','ko':'주문 이익 계산','pt':'Calcular lucro do pedido','ar':'احسب ربح الطلب'},
  'hk.rec.order_profit_desc': {'zh':'输入成本，计算这个订单的真实利润','en':'Enter costs to calculate the real profit of this order','de':'Kosten eingeben, um echten Gewinn des Auftrags zu berechnen','fr':'Entrez les coûts pour calculer le profit réel de cette commande','es':'Ingrese costos para calcular la ganancia real de este pedido','ja':'コストを入力してこの注文の実際の利益を計算','ko':'비용을 입력해 이 주문의 실제 이익 계산','pt':'Insira custos para calcular o lucro real deste pedido','ar':'أدخل التكاليف لحساب الربح الحقيقي لهذا الطلب'},
  # share
  'hk.share.prefix': {'zh':'📦 我用 GlobeTimeZone 查了','en':'📦 I checked on GlobeTimeZone: ','de':'📦 Ich habe auf GlobeTimeZone geprüft: ','fr':'📦 J\'ai vérifié sur GlobeTimeZone : ','es':'📦 Consulté en GlobeTimeZone: ','ja':'📦 GlobeTimeZoneで調べました：','ko':'📦 GlobeTimeZone에서 확인했습니다: ','pt':'📦 Verifiquei no GlobeTimeZone: ','ar':'📦 تحققت على GlobeTimeZone: '},
  'hk.share.to': {'zh':'发','en':' → ','de':' → ','fr':' → ','es':' → ','ja':' → ','ko':' → ','pt':' → ','ar':' إلى '},
  'hk.share.freight': {'zh':'的运费\n· ','en':' freight:\n· ','de':' Fracht:\n· ','fr':' fret :\n· ','es':' flete:\n· ','ja':' の送料\n· ','ko':' 운임:\n· ','pt':' frete:\n· ','ar':' تكاليف الشحن:\n· '},
  'hk.share.kg_low': {'zh':'kg货最低只要 ¥','en':'kg goods from ¥','de':'kg Ware ab ¥','fr':'kg marchandises à partir de ¥','es':'kg desde ¥','ja':'kgの荷物が最低¥','ko':'kg 화물 최소 ¥','pt':'kg a partir de ¥','ar':'كغ بدءاً من ¥'},
  'hk.share.yuan': {'zh':'元\n','en':'\n','de':'\n','fr':'\n','es':'\n','ja':'\n','ko':'\n','pt':'\n','ar':'\n'},
  'hk.share.fastest': {'zh':'· 最快 ','en':'· Fastest ','de':'· Schnellste ','fr':'· Plus rapide ','es':'· Más rápido ','ja':'· 最速 ','ko':'· 최단 ','pt':'· Mais rápido ','ar':'· الأسرع '},
  'hk.share.days_arrive': {'zh':' 天到达\n','en':' days delivery\n','de':' Tage Lieferung\n','fr':' jours de livraison\n','es':' días de entrega\n','ja':' 日で到着\n','ko':' 일 배송\n','pt':' dias de entrega\n','ar':' أيام تسليم\n'},
  'hk.share.carriers': {'zh':'· 支持8家物流商实时比价\n','en':'· Real-time comparison of 8 carriers\n','de':'· Echtzeit-Vergleich von 8 Spediteuren\n','fr':'· Comparaison en temps réel de 8 transporteurs\n','es':'· Comparación en tiempo real de 8 transportistas\n','ja':'· 8社のリアルタイム比較\n','ko':'· 8개 물류사 실시간 비교\n','pt':'· Comparação em tempo real de 8 transportadoras\n','ar':'· مقارنة فورية بين 8 شركات شحن\n'},
  'hk.share.link': {'zh':'👉 免费查询：https://globetimezone.com/tools/cross-border/','en':'👉 Free check: https://globetimezone.com/tools/cross-border/','de':'👉 Kostenlos prüfen: https://globetimezone.com/tools/cross-border/','fr':'👉 Vérification gratuite : https://globetimezone.com/tools/cross-border/','es':'👉 Consulta gratuita: https://globetimezone.com/tools/cross-border/','ja':'👉 無料で確認: https://globetimezone.com/tools/cross-border/','ko':'👉 무료 확인: https://globetimezone.com/tools/cross-border/','pt':'👉 Verificação gratuita: https://globetimezone.com/tools/cross-border/','ar':'👉 تحقق مجاناً: https://globetimezone.com/tools/cross-border/'},
  'hk.share.copied': {'zh':'✅ 分享文案已复制，快发给你的同行吧！','en':'✅ Copied! Share it with your peers!','de':'✅ Kopiert! Teile es mit deinen Kollegen!','fr':'✅ Copié ! Partagez avec vos pairs !','es':'✅ ¡Copiado! ¡Compártelo con tus colegas!','ja':'✅ コピー完了！仲間にシェアしましょう！','ko':'✅ 복사 완료! 동료들과 공유하세요!','pt':'✅ Copiado! Compartilhe com seus colegas!','ar':'✅ تم النسخ! شاركه مع زملائك!'},
  'hk.share.prompt': {'zh':'复制以下分享文案：','en':'Copy the following text:','de':'Folgenden Text kopieren:','fr':'Copiez le texte suivant :','es':'Copie el siguiente texto:','ja':'以下のテキストをコピーしてください：','ko':'다음 텍스트를 복사하세요:','pt':'Copie o seguinte texto:','ar':'انسخ النص التالي:'},
}

langs = ['zh', 'en', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar']

for lang in langs:
    path = os.path.join(locales_dir, f'{lang}.json')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    new_added = 0
    for key, translations in hk_keys.items():
        if key not in data:
            data[key] = translations.get(lang, translations.get('zh', key))
            new_added += 1

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    hk_count = sum(1 for k in data if k.startswith('hk.'))
    print(f'{lang}.json: +{new_added} new hk.* keys  (hk.* total: {hk_count})')

print('\nAll done!')
