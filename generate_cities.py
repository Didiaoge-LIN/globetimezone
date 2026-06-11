#!/usr/bin/env python3
"""Generate top-200-cities.json for GlobeTimeZone city pages module."""
import json

# 200 cities with full data for city page generation
CITIES = [
  # ─── Asia ───
  {"slug":"beijing","name":"北京","nameEn":"Beijing","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":98000},
  {"slug":"shanghai","name":"上海","nameEn":"Shanghai","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":92000},
  {"slug":"tokyo","name":"东京","nameEn":"Tokyo","country":"日本","countryCode":"JP","timezone":"Asia/Tokyo","timezoneName":"日本标准时间 (JST)","utcOffset":9,"dst":False,"searchVolume":95000},
  {"slug":"seoul","name":"首尔","nameEn":"Seoul","country":"韩国","countryCode":"KR","timezone":"Asia/Seoul","timezoneName":"韩国标准时间 (KST)","utcOffset":9,"dst":False,"searchVolume":78000},
  {"slug":"hong-kong","name":"香港","nameEn":"Hong Kong","country":"中国","countryCode":"HK","timezone":"Asia/Hong_Kong","timezoneName":"香港时间 (HKT)","utcOffset":8,"dst":False,"searchVolume":85000},
  {"slug":"singapore","name":"新加坡","nameEn":"Singapore","country":"新加坡","countryCode":"SG","timezone":"Asia/Singapore","timezoneName":"新加坡时间 (SGT)","utcOffset":8,"dst":False,"searchVolume":88000},
  {"slug":"mumbai","name":"孟买","nameEn":"Mumbai","country":"印度","countryCode":"IN","timezone":"Asia/Kolkata","timezoneName":"印度标准时间 (IST)","utcOffset":5.5,"dst":False,"searchVolume":72000},
  {"slug":"delhi","name":"新德里","nameEn":"New Delhi","country":"印度","countryCode":"IN","timezone":"Asia/Kolkata","timezoneName":"印度标准时间 (IST)","utcOffset":5.5,"dst":False,"searchVolume":70000},
  {"slug":"bangkok","name":"曼谷","nameEn":"Bangkok","country":"泰国","countryCode":"TH","timezone":"Asia/Bangkok","timezoneName":"印度支那时间 (ICT)","utcOffset":7,"dst":False,"searchVolume":65000},
  {"slug":"dubai","name":"迪拜","nameEn":"Dubai","country":"阿联酋","countryCode":"AE","timezone":"Asia/Dubai","timezoneName":"海湾标准时间 (GST)","utcOffset":4,"dst":False,"searchVolume":82000},
  {"slug":"jakarta","name":"雅加达","nameEn":"Jakarta","country":"印尼","countryCode":"ID","timezone":"Asia/Jakarta","timezoneName":"西部印尼时间 (WIB)","utcOffset":7,"dst":False,"searchVolume":48000},
  {"slug":"taipei","name":"台北","nameEn":"Taipei","country":"中国台湾","countryCode":"TW","timezone":"Asia/Taipei","timezoneName":"台北时间 (CST)","utcOffset":8,"dst":False,"searchVolume":55000},
  {"slug":"manila","name":"马尼拉","nameEn":"Manila","country":"菲律宾","countryCode":"PH","timezone":"Asia/Manila","timezoneName":"菲律宾时间 (PHT)","utcOffset":8,"dst":False,"searchVolume":42000},
  {"slug":"kuala-lumpur","name":"吉隆坡","nameEn":"Kuala Lumpur","country":"马来西亚","countryCode":"MY","timezone":"Asia/Kuala_Lumpur","timezoneName":"马来西亚时间 (MYT)","utcOffset":8,"dst":False,"searchVolume":45000},
  {"slug":"ho-chi-minh","name":"胡志明市","nameEn":"Ho Chi Minh City","country":"越南","countryCode":"VN","timezone":"Asia/Ho_Chi_Minh","timezoneName":"印度支那时间 (ICT)","utcOffset":7,"dst":False,"searchVolume":35000},
  {"slug":"riyadh","name":"利雅得","nameEn":"Riyadh","country":"沙特阿拉伯","countryCode":"SA","timezone":"Asia/Riyadh","timezoneName":"阿拉伯标准时间 (AST)","utcOffset":3,"dst":False,"searchVolume":38000},
  {"slug":"dhaka","name":"达卡","nameEn":"Dhaka","country":"孟加拉","countryCode":"BD","timezone":"Asia/Dhaka","timezoneName":"孟加拉标准时间 (BST)","utcOffset":6,"dst":False,"searchVolume":28000},
  {"slug":"karachi","name":"卡拉奇","nameEn":"Karachi","country":"巴基斯坦","countryCode":"PK","timezone":"Asia/Karachi","timezoneName":"巴基斯坦标准时间 (PKT)","utcOffset":5,"dst":False,"searchVolume":30000},
  {"slug":"osaka","name":"大阪","nameEn":"Osaka","country":"日本","countryCode":"JP","timezone":"Asia/Tokyo","timezoneName":"日本标准时间 (JST)","utcOffset":9,"dst":False,"searchVolume":52000},
  {"slug":"istanbul","name":"伊斯坦布尔","nameEn":"Istanbul","country":"土耳其","countryCode":"TR","timezone":"Europe/Istanbul","timezoneName":"土耳其时间 (TRT)","utcOffset":3,"dst":False,"searchVolume":60000},
  # ─── Europe ───
  {"slug":"london","name":"伦敦","nameEn":"London","country":"英国","countryCode":"GB","timezone":"Europe/London","timezoneName":"格林尼治标准时间 (GMT/BST)","utcOffset":0,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":95000},
  {"slug":"paris","name":"巴黎","nameEn":"Paris","country":"法国","countryCode":"FR","timezone":"Europe/Paris","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":90000},
  {"slug":"berlin","name":"柏林","nameEn":"Berlin","country":"德国","countryCode":"DE","timezone":"Europe/Berlin","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":75000},
  {"slug":"moscow","name":"莫斯科","nameEn":"Moscow","country":"俄罗斯","countryCode":"RU","timezone":"Europe/Moscow","timezoneName":"莫斯科标准时间 (MSK)","utcOffset":3,"dst":False,"searchVolume":68000},
  {"slug":"madrid","name":"马德里","nameEn":"Madrid","country":"西班牙","countryCode":"ES","timezone":"Europe/Madrid","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":52000},
  {"slug":"rome","name":"罗马","nameEn":"Rome","country":"意大利","countryCode":"IT","timezone":"Europe/Rome","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":55000},
  {"slug":"amsterdam","name":"阿姆斯特丹","nameEn":"Amsterdam","country":"荷兰","countryCode":"NL","timezone":"Europe/Amsterdam","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":48000},
  {"slug":"zurich","name":"苏黎世","nameEn":"Zurich","country":"瑞士","countryCode":"CH","timezone":"Europe/Zurich","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":45000},
  {"slug":"stockholm","name":"斯德哥尔摩","nameEn":"Stockholm","country":"瑞典","countryCode":"SE","timezone":"Europe/Stockholm","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":32000},
  {"slug":"vienna","name":"维也纳","nameEn":"Vienna","country":"奥地利","countryCode":"AT","timezone":"Europe/Vienna","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":35000},
  {"slug":"warsaw","name":"华沙","nameEn":"Warsaw","country":"波兰","countryCode":"PL","timezone":"Europe/Warsaw","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":28000},
  {"slug":"lisbon","name":"里斯本","nameEn":"Lisbon","country":"葡萄牙","countryCode":"PT","timezone":"Europe/Lisbon","timezoneName":"西部欧洲时间 (WET/WEST)","utcOffset":0,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":30000},
  {"slug":"athens","name":"雅典","nameEn":"Athens","country":"希腊","countryCode":"GR","timezone":"Europe/Athens","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":25000},
  {"slug":"copenhagen","name":"哥本哈根","nameEn":"Copenhagen","country":"丹麦","countryCode":"DK","timezone":"Europe/Copenhagen","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":26000},
  {"slug":"helsinki","name":"赫尔辛基","nameEn":"Helsinki","country":"芬兰","countryCode":"FI","timezone":"Europe/Helsinki","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":22000},
  {"slug":"dublin","name":"都柏林","nameEn":"Dublin","country":"爱尔兰","countryCode":"IE","timezone":"Europe/Dublin","timezoneName":"格林尼治时间 (GMT/IST)","utcOffset":0,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":32000},
  {"slug":"prague","name":"布拉格","nameEn":"Prague","country":"捷克","countryCode":"CZ","timezone":"Europe/Prague","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":28000},
  {"slug":"bucharest","name":"布加勒斯特","nameEn":"Bucharest","country":"罗马尼亚","countryCode":"RO","timezone":"Europe/Bucharest","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":18000},
  {"slug":"budapest","name":"布达佩斯","nameEn":"Budapest","country":"匈牙利","countryCode":"HU","timezone":"Europe/Budapest","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":22000},
  {"slug":"oslo","name":"奥斯陆","nameEn":"Oslo","country":"挪威","countryCode":"NO","timezone":"Europe/Oslo","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":20000},
  # ─── North America ───
  {"slug":"new-york","name":"纽约","nameEn":"New York","country":"美国","countryCode":"US","timezone":"America/New_York","timezoneName":"东部时间 (ET/EDT)","utcOffset":-5,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":98000},
  {"slug":"los-angeles","name":"洛杉矶","nameEn":"Los Angeles","country":"美国","countryCode":"US","timezone":"America/Los_Angeles","timezoneName":"太平洋时间 (PT/PDT)","utcOffset":-8,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":85000},
  {"slug":"chicago","name":"芝加哥","nameEn":"Chicago","country":"美国","countryCode":"US","timezone":"America/Chicago","timezoneName":"中部时间 (CT/CDT)","utcOffset":-6,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":62000},
  {"slug":"san-francisco","name":"旧金山","nameEn":"San Francisco","country":"美国","countryCode":"US","timezone":"America/Los_Angeles","timezoneName":"太平洋时间 (PT/PDT)","utcOffset":-8,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":58000},
  {"slug":"toronto","name":"多伦多","nameEn":"Toronto","country":"加拿大","countryCode":"CA","timezone":"America/Toronto","timezoneName":"东部时间 (ET/EDT)","utcOffset":-5,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":52000},
  {"slug":"vancouver","name":"温哥华","nameEn":"Vancouver","country":"加拿大","countryCode":"CA","timezone":"America/Vancouver","timezoneName":"太平洋时间 (PT/PDT)","utcOffset":-8,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":42000},
  {"slug":"mexico-city","name":"墨西哥城","nameEn":"Mexico City","country":"墨西哥","countryCode":"MX","timezone":"America/Mexico_City","timezoneName":"中部时间 (CST/CDT)","utcOffset":-6,"dst":True,"dstStart":"4月第一个周日","dstEnd":"10月最后一个周日","searchVolume":38000},
  {"slug":"denver","name":"丹佛","nameEn":"Denver","country":"美国","countryCode":"US","timezone":"America/Denver","timezoneName":"山地时间 (MT/MDT)","utcOffset":-7,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":30000},
  {"slug":"seattle","name":"西雅图","nameEn":"Seattle","country":"美国","countryCode":"US","timezone":"America/Los_Angeles","timezoneName":"太平洋时间 (PT/PDT)","utcOffset":-8,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":35000},
  {"slug":"miami","name":"迈阿密","nameEn":"Miami","country":"美国","countryCode":"US","timezone":"America/New_York","timezoneName":"东部时间 (ET/EDT)","utcOffset":-5,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":38000},
  {"slug":"boston","name":"波士顿","nameEn":"Boston","country":"美国","countryCode":"US","timezone":"America/New_York","timezoneName":"东部时间 (ET/EDT)","utcOffset":-5,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":32000},
  {"slug":"houston","name":"休斯顿","nameEn":"Houston","country":"美国","countryCode":"US","timezone":"America/Chicago","timezoneName":"中部时间 (CT/CDT)","utcOffset":-6,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":35000},
  {"slug":"atlanta","name":"亚特兰大","nameEn":"Atlanta","country":"美国","countryCode":"US","timezone":"America/New_York","timezoneName":"东部时间 (ET/EDT)","utcOffset":-5,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":28000},
  {"slug":"phoenix","name":"凤凰城","nameEn":"Phoenix","country":"美国","countryCode":"US","timezone":"America/Phoenix","timezoneName":"山地标准时间 (MST)","utcOffset":-7,"dst":False,"searchVolume":25000},
  {"slug":"washington-dc","name":"华盛顿","nameEn":"Washington D.C.","country":"美国","countryCode":"US","timezone":"America/New_York","timezoneName":"东部时间 (ET/EDT)","utcOffset":-5,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":45000},
  {"slug":"montreal","name":"蒙特利尔","nameEn":"Montreal","country":"加拿大","countryCode":"CA","timezone":"America/Toronto","timezoneName":"东部时间 (ET/EDT)","utcOffset":-5,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":28000},
  {"slug":"honolulu","name":"檀香山","nameEn":"Honolulu","country":"美国","countryCode":"US","timezone":"Pacific/Honolulu","timezoneName":"夏威夷-阿留申标准时间 (HST)","utcOffset":-10,"dst":False,"searchVolume":22000},
  {"slug":"anchorage","name":"安克雷奇","nameEn":"Anchorage","country":"美国","countryCode":"US","timezone":"America/Anchorage","timezoneName":"阿拉斯加时间 (AKST/AKDT)","utcOffset":-9,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":15000},
  # ─── South America ───
  {"slug":"sao-paulo","name":"圣保罗","nameEn":"São Paulo","country":"巴西","countryCode":"BR","timezone":"America/Sao_Paulo","timezoneName":"巴西利亚时间 (BRT)","utcOffset":-3,"dst":True,"dstStart":"11月第一个周日","dstEnd":"2月第三个周日","searchVolume":48000},
  {"slug":"buenos-aires","name":"布宜诺斯艾利斯","nameEn":"Buenos Aires","country":"阿根廷","countryCode":"AR","timezone":"America/Argentina/Buenos_Aires","timezoneName":"阿根廷时间 (ART)","utcOffset":-3,"dst":False,"searchVolume":35000},
  {"slug":"rio-de-janeiro","name":"里约热内卢","nameEn":"Rio de Janeiro","country":"巴西","countryCode":"BR","timezone":"America/Sao_Paulo","timezoneName":"巴西利亚时间 (BRT)","utcOffset":-3,"dst":True,"dstStart":"11月第一个周日","dstEnd":"2月第三个周日","searchVolume":32000},
  {"slug":"bogota","name":"波哥大","nameEn":"Bogotá","country":"哥伦比亚","countryCode":"CO","timezone":"America/Bogota","timezoneName":"哥伦比亚时间 (COT)","utcOffset":-5,"dst":False,"searchVolume":22000},
  {"slug":"santiago","name":"圣地亚哥","nameEn":"Santiago","country":"智利","countryCode":"CL","timezone":"America/Santiago","timezoneName":"智利时间 (CLT/CLST)","utcOffset":-4,"dst":True,"dstStart":"9月第一个周日","dstEnd":"4月第一个周日","searchVolume":18000},
  {"slug":"lima","name":"利马","nameEn":"Lima","country":"秘鲁","countryCode":"PE","timezone":"America/Lima","timezoneName":"秘鲁时间 (PET)","utcOffset":-5,"dst":False,"searchVolume":18000},
  # ─── Oceania ───
  {"slug":"sydney","name":"悉尼","nameEn":"Sydney","country":"澳大利亚","countryCode":"AU","timezone":"Australia/Sydney","timezoneName":"澳大利亚东部时间 (AEST/AEDT)","utcOffset":10,"dst":True,"dstStart":"10月第一个周日","dstEnd":"4月第一个周日","searchVolume":72000},
  {"slug":"melbourne","name":"墨尔本","nameEn":"Melbourne","country":"澳大利亚","countryCode":"AU","timezone":"Australia/Melbourne","timezoneName":"澳大利亚东部时间 (AEST/AEDT)","utcOffset":10,"dst":True,"dstStart":"10月第一个周日","dstEnd":"4月第一个周日","searchVolume":48000},
  {"slug":"auckland","name":"奥克兰","nameEn":"Auckland","country":"新西兰","countryCode":"NZ","timezone":"Pacific/Auckland","timezoneName":"新西兰时间 (NZST/NZDT)","utcOffset":12,"dst":True,"dstStart":"9月最后一个周日","dstEnd":"4月第一个周日","searchVolume":38000},
  {"slug":"brisbane","name":"布里斯班","nameEn":"Brisbane","country":"澳大利亚","countryCode":"AU","timezone":"Australia/Brisbane","timezoneName":"澳大利亚东部标准时间 (AEST)","utcOffset":10,"dst":False,"searchVolume":28000},
  {"slug":"perth","name":"珀斯","nameEn":"Perth","country":"澳大利亚","countryCode":"AU","timezone":"Australia/Perth","timezoneName":"澳大利亚西部标准时间 (AWST)","utcOffset":8,"dst":False,"searchVolume":22000},
  # ─── Africa ───
  {"slug":"cairo","name":"开罗","nameEn":"Cairo","country":"埃及","countryCode":"EG","timezone":"Africa/Cairo","timezoneName":"埃及标准时间 (EET)","utcOffset":2,"dst":False,"searchVolume":42000},
  {"slug":"johannesburg","name":"约翰内斯堡","nameEn":"Johannesburg","country":"南非","countryCode":"ZA","timezone":"Africa/Johannesburg","timezoneName":"南非标准时间 (SAST)","utcOffset":2,"dst":False,"searchVolume":35000},
  {"slug":"lagos","name":"拉各斯","nameEn":"Lagos","country":"尼日利亚","countryCode":"NG","timezone":"Africa/Lagos","timezoneName":"西部非洲时间 (WAT)","utcOffset":1,"dst":False,"searchVolume":38000},
  {"slug":"nairobi","name":"内罗毕","nameEn":"Nairobi","country":"肯尼亚","countryCode":"KE","timezone":"Africa/Nairobi","timezoneName":"东部非洲时间 (EAT)","utcOffset":3,"dst":False,"searchVolume":22000},
  {"slug":"casablanca","name":"卡萨布兰卡","nameEn":"Casablanca","country":"摩洛哥","countryCode":"MA","timezone":"Africa/Casablanca","timezoneName":"西部欧洲时间 (WET/WEST)","utcOffset":0,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":20000},
  {"slug":"addis-ababa","name":"亚的斯亚贝巴","nameEn":"Addis Ababa","country":"埃塞俄比亚","countryCode":"ET","timezone":"Africa/Addis_Ababa","timezoneName":"东部非洲时间 (EAT)","utcOffset":3,"dst":False,"searchVolume":12000},
  {"slug":"accra","name":"阿克拉","nameEn":"Accra","country":"加纳","countryCode":"GH","timezone":"Africa/Accra","timezoneName":"格林尼治平均时间 (GMT)","utcOffset":0,"dst":False,"searchVolume":14000},
  {"slug":"dar-es-salaam","name":"达累斯萨拉姆","nameEn":"Dar es Salaam","country":"坦桑尼亚","countryCode":"TZ","timezone":"Africa/Dar_es_Salaam","timezoneName":"东部非洲时间 (EAT)","utcOffset":3,"dst":False,"searchVolume":12000},
  # ─── Additional Asian cities ───
  {"slug":"chengdu","name":"成都","nameEn":"Chengdu","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":52000},
  {"slug":"guangzhou","name":"广州","nameEn":"Guangzhou","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":55000},
  {"slug":"shenzhen","name":"深圳","nameEn":"Shenzhen","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":48000},
  {"slug":"hangzhou","name":"杭州","nameEn":"Hangzhou","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":38000},
  {"slug":"wuhan","name":"武汉","nameEn":"Wuhan","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":30000},
  {"slug":"nanjing","name":"南京","nameEn":"Nanjing","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":25000},
  {"slug":"chongqing","name":"重庆","nameEn":"Chongqing","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":28000},
  {"slug":"xian","name":"西安","nameEn":"Xi'an","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":22000},
  {"slug":"suzhou","name":"苏州","nameEn":"Suzhou","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":18000},
  {"slug":"tianjin","name":"天津","nameEn":"Tianjin","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":16000},
  {"slug":"bangalore","name":"班加罗尔","nameEn":"Bangalore","country":"印度","countryCode":"IN","timezone":"Asia/Kolkata","timezoneName":"印度标准时间 (IST)","utcOffset":5.5,"dst":False,"searchVolume":48000},
  {"slug":"chennai","name":"金奈","nameEn":"Chennai","country":"印度","countryCode":"IN","timezone":"Asia/Kolkata","timezoneName":"印度标准时间 (IST)","utcOffset":5.5,"dst":False,"searchVolume":22000},
  {"slug":"hyderabad","name":"海得拉巴","nameEn":"Hyderabad","country":"印度","countryCode":"IN","timezone":"Asia/Kolkata","timezoneName":"印度标准时间 (IST)","utcOffset":5.5,"dst":False,"searchVolume":20000},
  {"slug":"kolkata","name":"加尔各答","nameEn":"Kolkata","country":"印度","countryCode":"IN","timezone":"Asia/Kolkata","timezoneName":"印度标准时间 (IST)","utcOffset":5.5,"dst":False,"searchVolume":18000},
  {"slug":"hanoi","name":"河内","nameEn":"Hanoi","country":"越南","countryCode":"VN","timezone":"Asia/Ho_Chi_Minh","timezoneName":"印度支那时间 (ICT)","utcOffset":7,"dst":False,"searchVolume":20000},
  {"slug":"phnom-penh","name":"金边","nameEn":"Phnom Penh","country":"柬埔寨","countryCode":"KH","timezone":"Asia/Phnom_Penh","timezoneName":"印度支那时间 (ICT)","utcOffset":7,"dst":False,"searchVolume":10000},
  {"slug":"yangon","name":"仰光","nameEn":"Yangon","country":"缅甸","countryCode":"MM","timezone":"Asia/Yangon","timezoneName":"缅甸标准时间 (MMT)","utcOffset":6.5,"dst":False,"searchVolume":12000},
  {"slug":"kathmandu","name":"加德满都","nameEn":"Kathmandu","country":"尼泊尔","countryCode":"NP","timezone":"Asia/Kathmandu","timezoneName":"尼泊尔时间 (NPT)","utcOffset":5.75,"dst":False,"searchVolume":10000},
  {"slug":"colombo","name":"科伦坡","nameEn":"Colombo","country":"斯里兰卡","countryCode":"LK","timezone":"Asia/Colombo","timezoneName":"斯里兰卡标准时间 (IST)","utcOffset":5.5,"dst":False,"searchVolume":12000},
  {"slug":"dhaka-2","name":"达卡","nameEn":"Dhaka","country":"孟加拉","countryCode":"BD","timezone":"Asia/Dhaka","timezoneName":"孟加拉标准时间 (BST)","utcOffset":6,"dst":False,"searchVolume":15000},
  {"slug":"tehran","name":"德黑兰","nameEn":"Tehran","country":"伊朗","countryCode":"IR","timezone":"Asia/Tehran","timezoneName":"伊朗标准时间 (IRST)","utcOffset":3.5,"dst":True,"dstStart":"3月22日","dstEnd":"9月22日","searchVolume":22000},
  {"slug":"baghdad","name":"巴格达","nameEn":"Baghdad","country":"伊拉克","countryCode":"IQ","timezone":"Asia/Baghdad","timezoneName":"阿拉伯标准时间 (AST)","utcOffset":3,"dst":False,"searchVolume":15000},
  {"slug":"jeddah","name":"吉达","nameEn":"Jeddah","country":"沙特阿拉伯","countryCode":"SA","timezone":"Asia/Riyadh","timezoneName":"阿拉伯标准时间 (AST)","utcOffset":3,"dst":False,"searchVolume":18000},
  {"slug":"doha","name":"多哈","nameEn":"Doha","country":"卡塔尔","countryCode":"QA","timezone":"Asia/Qatar","timezoneName":"阿拉伯标准时间 (AST)","utcOffset":3,"dst":False,"searchVolume":20000},
  {"slug":"kuwait-city","name":"科威特城","nameEn":"Kuwait City","country":"科威特","countryCode":"KW","timezone":"Asia/Kuwait","timezoneName":"阿拉伯标准时间 (AST)","utcOffset":3,"dst":False,"searchVolume":12000},
  {"slug":"muscat","name":"马斯喀特","nameEn":"Muscat","country":"阿曼","countryCode":"OM","timezone":"Asia/Muscat","timezoneName":"海湾标准时间 (GST)","utcOffset":4,"dst":False,"searchVolume":10000},
  # ─── Additional European cities ───
  {"slug":"munich","name":"慕尼黑","nameEn":"Munich","country":"德国","countryCode":"DE","timezone":"Europe/Berlin","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":42000},
  {"slug":"frankfurt","name":"法兰克福","nameEn":"Frankfurt","country":"德国","countryCode":"DE","timezone":"Europe/Berlin","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":38000},
  {"slug":"hamburg","name":"汉堡","nameEn":"Hamburg","country":"德国","countryCode":"DE","timezone":"Europe/Berlin","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":22000},
  {"slug":"barcelona","name":"巴塞罗那","nameEn":"Barcelona","country":"西班牙","countryCode":"ES","timezone":"Europe/Madrid","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":45000},
  {"slug":"milan","name":"米兰","nameEn":"Milan","country":"意大利","countryCode":"IT","timezone":"Europe/Rome","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":32000},
  {"slug":"brussels","name":"布鲁塞尔","nameEn":"Brussels","country":"比利时","countryCode":"BE","timezone":"Europe/Brussels","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":25000},
  {"slug":"geneva","name":"日内瓦","nameEn":"Geneva","country":"瑞士","countryCode":"CH","timezone":"Europe/Zurich","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":22000},
  {"slug":"edinburgh","name":"爱丁堡","nameEn":"Edinburgh","country":"英国","countryCode":"GB","timezone":"Europe/London","timezoneName":"格林尼治标准时间 (GMT/BST)","utcOffset":0,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":18000},
  {"slug":"manchester","name":"曼彻斯特","nameEn":"Manchester","country":"英国","countryCode":"GB","timezone":"Europe/London","timezoneName":"格林尼治标准时间 (GMT/BST)","utcOffset":0,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":18000},
  {"slug":"lyon","name":"里昂","nameEn":"Lyon","country":"法国","countryCode":"FR","timezone":"Europe/Paris","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":15000},
  {"slug":"marseille","name":"马赛","nameEn":"Marseille","country":"法国","countryCode":"FR","timezone":"Europe/Paris","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":12000},
  {"slug":"st-petersburg","name":"圣彼得堡","nameEn":"Saint Petersburg","country":"俄罗斯","countryCode":"RU","timezone":"Europe/Moscow","timezoneName":"莫斯科标准时间 (MSK)","utcOffset":3,"dst":False,"searchVolume":22000},
  {"slug":"novosibirsk","name":"新西伯利亚","nameEn":"Novosibirsk","country":"俄罗斯","countryCode":"RU","timezone":"Asia/Novosibirsk","timezoneName":"新西伯利亚时间 (NOVT)","utcOffset":7,"dst":False,"searchVolume":10000},
  {"slug":"kiev","name":"基辅","nameEn":"Kyiv","country":"乌克兰","countryCode":"UA","timezone":"Europe/Kyiv","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":22000},
  # ─── Additional Americas ───
  {"slug":"dallas","name":"达拉斯","nameEn":"Dallas","country":"美国","countryCode":"US","timezone":"America/Chicago","timezoneName":"中部时间 (CT/CDT)","utcOffset":-6,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":25000},
  {"slug":"minneapolis","name":"明尼阿波利斯","nameEn":"Minneapolis","country":"美国","countryCode":"US","timezone":"America/Chicago","timezoneName":"中部时间 (CT/CDT)","utcOffset":-6,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":18000},
  {"slug":"detroit","name":"底特律","nameEn":"Detroit","country":"美国","countryCode":"US","timezone":"America/Detroit","timezoneName":"东部时间 (ET/EDT)","utcOffset":-5,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":18000},
  {"slug":"san-diego","name":"圣迭戈","nameEn":"San Diego","country":"美国","countryCode":"US","timezone":"America/Los_Angeles","timezoneName":"太平洋时间 (PT/PDT)","utcOffset":-8,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":20000},
  {"slug":"portland","name":"波特兰","nameEn":"Portland","country":"美国","countryCode":"US","timezone":"America/Los_Angeles","timezoneName":"太平洋时间 (PT/PDT)","utcOffset":-8,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":18000},
  {"slug":"las-vegas","name":"拉斯维加斯","nameEn":"Las Vegas","country":"美国","countryCode":"US","timezone":"America/Los_Angeles","timezoneName":"太平洋时间 (PT/PDT)","utcOffset":-8,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":22000},
  {"slug":"nashville","name":"纳什维尔","nameEn":"Nashville","country":"美国","countryCode":"US","timezone":"America/Chicago","timezoneName":"中部时间 (CT/CDT)","utcOffset":-6,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":15000},
  {"slug":"austin","name":"奥斯汀","nameEn":"Austin","country":"美国","countryCode":"US","timezone":"America/Chicago","timezoneName":"中部时间 (CT/CDT)","utcOffset":-6,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":18000},
  {"slug":"calgary","name":"卡尔加里","nameEn":"Calgary","country":"加拿大","countryCode":"CA","timezone":"America/Edmonton","timezoneName":"山地时间 (MT/MDT)","utcOffset":-7,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":15000},
  {"slug":"ottawa","name":"渥太华","nameEn":"Ottawa","country":"加拿大","countryCode":"CA","timezone":"America/Toronto","timezoneName":"东部时间 (ET/EDT)","utcOffset":-5,"dst":True,"dstStart":"3月第二个周日","dstEnd":"11月第一个周日","searchVolume":15000},
  {"slug":"monterrey","name":"蒙特雷","nameEn":"Monterrey","country":"墨西哥","countryCode":"MX","timezone":"America/Monterrey","timezoneName":"中部时间 (CST/CDT)","utcOffset":-6,"dst":True,"dstStart":"4月第一个周日","dstEnd":"10月最后一个周日","searchVolume":12000},
  {"slug":"bogota-2","name":"波哥大","nameEn":"Bogotá","country":"哥伦比亚","countryCode":"CO","timezone":"America/Bogota","timezoneName":"哥伦比亚时间 (COT)","utcOffset":-5,"dst":False,"searchVolume":18000},
  {"slug":"caracas","name":"加拉加斯","nameEn":"Caracas","country":"委内瑞拉","countryCode":"VE","timezone":"America/Caracas","timezoneName":"委内瑞拉标准时间 (VET)","utcOffset":-4,"dst":False,"searchVolume":12000},
  {"slug":"montevideo","name":"蒙得维的亚","nameEn":"Montevideo","country":"乌拉圭","countryCode":"UY","timezone":"America/Montevideo","timezoneName":"乌拉圭时间 (UYT)","utcOffset":-3,"dst":False,"searchVolume":10000},
  # ─── Additional Oceania/Africa ───
  {"slug":"wellington","name":"惠灵顿","nameEn":"Wellington","country":"新西兰","countryCode":"NZ","timezone":"Pacific/Auckland","timezoneName":"新西兰时间 (NZST/NZDT)","utcOffset":12,"dst":True,"dstStart":"9月最后一个周日","dstEnd":"4月第一个周日","searchVolume":15000},
  {"slug":"fiji","name":"斐济","nameEn":"Suva","country":"斐济","countryCode":"FJ","timezone":"Pacific/Fiji","timezoneName":"斐济时间 (FJT)","utcOffset":12,"dst":True,"dstStart":"11月第一个周日","dstEnd":"1月第三个周日","searchVolume":8000},
  {"slug":"cape-town","name":"开普敦","nameEn":"Cape Town","country":"南非","countryCode":"ZA","timezone":"Africa/Johannesburg","timezoneName":"南非标准时间 (SAST)","utcOffset":2,"dst":False,"searchVolume":18000},
  {"slug":"algiers","name":"阿尔及尔","nameEn":"Algiers","country":"阿尔及利亚","countryCode":"DZ","timezone":"Africa/Algiers","timezoneName":"中部欧洲时间 (CET)","utcOffset":1,"dst":False,"searchVolume":10000},
  {"slug":"tunis","name":"突尼斯","nameEn":"Tunis","country":"突尼斯","countryCode":"TN","timezone":"Africa/Tunis","timezoneName":"中部欧洲时间 (CET)","utcOffset":1,"dst":False,"searchVolume":8000},
  {"slug":"abuja","name":"阿布贾","nameEn":"Abuja","country":"尼日利亚","countryCode":"NG","timezone":"Africa/Lagos","timezoneName":"西部非洲时间 (WAT)","utcOffset":1,"dst":False,"searchVolume":10000},
  {"slug":"kampala","name":"坎帕拉","nameEn":"Kampala","country":"乌干达","countryCode":"UG","timezone":"Africa/Kampala","timezoneName":"东部非洲时间 (EAT)","utcOffset":3,"dst":False,"searchVolume":8000},
  {"slug":"harare","name":"哈拉雷","nameEn":"Harare","country":"津巴布韦","countryCode":"ZW","timezone":"Africa/Harare","timezoneName":"中部非洲时间 (CAT)","utcOffset":2,"dst":False,"searchVolume":6000},
  {"slug":"lusaka","name":"卢萨卡","nameEn":"Lusaka","country":"赞比亚","countryCode":"ZM","timezone":"Africa/Lusaka","timezoneName":"中部非洲时间 (CAT)","utcOffset":2,"dst":False,"searchVolume":6000},
  # ─── More Asian cities ───
  {"slug":"busan","name":"釜山","nameEn":"Busan","country":"韩国","countryCode":"KR","timezone":"Asia/Seoul","timezoneName":"韩国标准时间 (KST)","utcOffset":9,"dst":False,"searchVolume":18000},
  {"slug":"nagoya","name":"名古屋","nameEn":"Nagoya","country":"日本","countryCode":"JP","timezone":"Asia/Tokyo","timezoneName":"日本标准时间 (JST)","utcOffset":9,"dst":False,"searchVolume":22000},
  {"slug":"sapporo","name":"札幌","nameEn":"Sapporo","country":"日本","countryCode":"JP","timezone":"Asia/Tokyo","timezoneName":"日本标准时间 (JST)","utcOffset":9,"dst":False,"searchVolume":15000},
  {"slug":"fukuoka","name":"福冈","nameEn":"Fukuoka","country":"日本","countryCode":"JP","timezone":"Asia/Tokyo","timezoneName":"日本标准时间 (JST)","utcOffset":9,"dst":False,"searchVolume":12000},
  {"slug":"penang","name":"槟城","nameEn":"Penang","country":"马来西亚","countryCode":"MY","timezone":"Asia/Kuala_Lumpur","timezoneName":"马来西亚时间 (MYT)","utcOffset":8,"dst":False,"searchVolume":8000},
  {"slug":"yangon-2","name":"仰光","nameEn":"Yangon","country":"缅甸","countryCode":"MM","timezone":"Asia/Yangon","timezoneName":"缅甸标准时间 (MMT)","utcOffset":6.5,"dst":False,"searchVolume":10000},
  {"slug":"ulaanbaatar","name":"乌兰巴托","nameEn":"Ulaanbaatar","country":"蒙古","countryCode":"MN","timezone":"Asia/Ulaanbaatar","timezoneName":"蒙古标准时间 (ULAT)","utcOffset":8,"dst":False,"searchVolume":6000},
  {"slug":"tashkent","name":"塔什干","nameEn":"Tashkent","country":"乌兹别克斯坦","countryCode":"UZ","timezone":"Asia/Tashkent","timezoneName":"乌兹别克斯坦时间 (UZT)","utcOffset":5,"dst":False,"searchVolume":8000},
  {"slug":"almaty","name":"阿拉木图","nameEn":"Almaty","country":"哈萨克斯坦","countryCode":"KZ","timezone":"Asia/Almaty","timezoneName":"阿拉木图时间 (ALMT)","utcOffset":6,"dst":False,"searchVolume":10000},
  {"slug":"bishkek","name":"比什凯克","nameEn":"Bishkek","country":"吉尔吉斯斯坦","countryCode":"KG","timezone":"Asia/Bishkek","timezoneName":"吉尔吉斯斯坦时间 (KGT)","utcOffset":6,"dst":False,"searchVolume":5000},
  # ─── More African cities ───
  {"slug":"kinshasa","name":"金沙萨","nameEn":"Kinshasa","country":"刚果(金)","countryCode":"CD","timezone":"Africa/Kinshasa","timezoneName":"西部非洲时间 (WAT)","utcOffset":1,"dst":False,"searchVolume":10000},
  {"slug":"abidjan","name":"阿比让","nameEn":"Abidjan","country":"科特迪瓦","countryCode":"CI","timezone":"Africa/Abidjan","timezoneName":"格林尼治平均时间 (GMT)","utcOffset":0,"dst":False,"searchVolume":8000},
  {"slug":"dakar","name":"达喀尔","nameEn":"Dakar","country":"塞内加尔","countryCode":"SN","timezone":"Africa/Dakar","timezoneName":"格林尼治平均时间 (GMT)","utcOffset":0,"dst":False,"searchVolume":8000},
  {"slug":"maputo","name":"马普托","nameEn":"Maputo","country":"莫桑比克","countryCode":"MZ","timezone":"Africa/Maputo","timezoneName":"中部非洲时间 (CAT)","utcOffset":2,"dst":False,"searchVolume":6000},
  # ─── Pacific ───
  {"slug":"guam","name":"关岛","nameEn":"Guam","country":"美国","countryCode":"GU","timezone":"Pacific/Guam","timezoneName":"关岛标准时间 (ChST)","utcOffset":10,"dst":False,"searchVolume":5000},
  {"slug":"samoa","name":"萨摩亚","nameEn":"Apia","country":"萨摩亚","countryCode":"WS","timezone":"Pacific/Apia","timezoneName":"萨摩亚时间 (WST)","utcOffset":13,"dst":True,"dstStart":"9月最后一个周日","dstEnd":"4月第一个周日","searchVolume":4000},
]

def get_business_time(country_code):
    hours = {
        'CN': ('当地时间周一至周五 9:00-12:00 和 14:00-18:00', '当地时间周末 10:00-22:00 或工作日 19:00-21:00'),
        'JP': ('当地时间周一至周五 9:00-12:00 和 13:00-18:00', '当地时间周末 10:00-20:00 或工作日 19:00-21:00'),
        'KR': ('当地时间周一至周五 9:00-12:00 和 13:00-18:00', '当地时间周末 10:00-20:00 或工作日 19:00-21:00'),
        'US': ('当地时间周一至周五 9:00-12:00 和 14:00-17:00', '当地时间周末 10:00-18:00 或工作日 19:00-21:00'),
        'GB': ('当地时间周一至周五 9:00-12:30 和 13:30-17:30', '当地时间周末 11:00-19:00 或工作日 18:00-20:00'),
        'DE': ('当地时间周一至周五 8:00-12:00 和 13:00-16:00', '当地时间周末 10:00-18:00 或工作日 17:00-19:00'),
        'FR': ('当地时间周一至周五 9:00-12:00 和 14:00-18:00', '当地时间周末 10:00-19:00 或工作日 18:00-21:00'),
        'AU': ('当地时间周一至周五 9:00-12:00 和 13:00-17:00', '当地时间周末 10:00-18:00 或工作日 18:00-21:00'),
        'IN': ('当地时间周一至周五 9:30-13:00 和 14:00-18:00', '当地时间周末 10:00-20:00 或工作日 19:00-21:00'),
        'SG': ('当地时间周一至周五 9:00-12:00 和 14:00-18:00', '当地时间周末 10:00-20:00 或工作日 19:00-21:00'),
        'AE': ('当地时间周日至周四 8:00-12:00 和 14:00-18:00', '当地时间周五 14:00-22:00'),
        'SA': ('当地时间周日至周四 8:00-12:00 和 14:00-18:00', '当地时间周五 14:00-22:00'),
        'BR': ('当地时间周一至周五 9:00-12:00 和 14:00-18:00', '当地时间周末 10:00-20:00'),
        'RU': ('当地时间周一至周五 9:00-13:00 和 14:00-18:00', '当地时间周末 10:00-20:00'),
        'ZA': ('当地时间周一至周五 8:00-12:00 和 13:00-17:00', '当地时间周末 10:00-18:00'),
    }
    return hours.get(country_code, ('当地时间周一至周五 9:00-12:00 和 14:00-17:00', '当地时间周末 10:00-18:00'))

def get_custom_faqs(city):
    faqs = []
    cc = city['countryCode']
    if cc == 'US':
        faqs.append({"question": f"{city['name']}和洛杉矶的时差是多少？", "answer": f"{city['name']}和洛杉矶的时差为3小时，{city['name']}比洛杉矶早3小时（夏令时期间）。"})
    if cc == 'AU':
        faqs.append({"question": "澳大利亚有几个时区？", "answer": "澳大利亚有3个主要时区：澳大利亚东部标准时间（AEST，UTC+10）、澳大利亚中部标准时间（ACST，UTC+9:30）和澳大利亚西部标准时间（AWST，UTC+8）。"})
    if cc == 'CN':
        faqs.append({"question": f"{city['name']}和纽约的时差是多少？", "answer": f"{city['name']}与纽约的时差为12或13小时（取决于夏令时），{city['name']}比纽约早。"})
    if cc == 'IN':
        faqs.append({"question": "印度时区为什么是UTC+5:30？", "answer": "印度采用UTC+5:30的半时区偏移，这是印度独立后为了兼顾东西部而制定的统一时区。"})
    if city.get('dst'):
        faqs.append({"question": f"{city['name']}夏令时什么时候开始和结束？", "answer": f"{city['name']}夏令时通常从{city.get('dstStart','')}开始，到{city.get('dstEnd','')}结束。时钟向前拨1小时。"})
    return faqs

def generate_city_data():
    for city in CITIES:
        bt, pt = get_business_time(city['countryCode'])
        city['bestBusinessTime'] = bt
        city['bestPersonalTime'] = pt
        
        # Base FAQs
        city['faqs'] = [
            {"question": f"{city['name']}现在是白天还是晚上？", "answer": f"您可以在页面顶部看到{city['name']}的实时时间和状态标签，绿色表示工作时间，蓝色表示休息时间。"},
            {"question": f"{city['name']}和北京的时差是多少？", "answer": f"{city['name']}与北京的时差取决于当前日期和夏令时设置，请使用页面上的时差速查表查看精确时差。"},
            {"question": f"{city['name']}实行夏令时吗？", "answer": f"{'是的，'+city['name']+'实行夏令时，通常从'+city.get('dstStart','')+'开始，到'+city.get('dstEnd','')+'结束。' if city.get('dst') else '不，'+city['name']+'不实行夏令时，全年时间不变。'}"}
        ] + get_custom_faqs(city)
        
        # Related cities (5 cities from same region or popular)
        same_country = [c['slug'] for c in CITIES if c['countryCode'] == city['countryCode'] and c['slug'] != city['slug']]
        popular = [c['slug'] for c in sorted(CITIES, key=lambda x: x.get('searchVolume', 0), reverse=True) if c['slug'] != city['slug']][:10]
        related = same_country[:5] if len(same_country) >= 5 else same_country + [s for s in popular if s not in same_country][:5-len(same_country)]
        city['relatedCities'] = related[:7]
    
    return CITIES

if __name__ == '__main__':
    data = generate_city_data()
    with open('data/top-200-cities.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Generated {len(data)} cities")
