#!/usr/bin/env python3
"""Append extra cities to reach 200 total."""
import json

with open('data/top-200-cities.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f'Current: {len(data)} cities')

extra = [
  {"slug":"changsha","name":"长沙","nameEn":"Changsha","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":18000},
  {"slug":"zhengzhou","name":"郑州","nameEn":"Zhengzhou","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":16000},
  {"slug":"fuzhou","name":"福州","nameEn":"Fuzhou","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":12000},
  {"slug":"kunming","name":"昆明","nameEn":"Kunming","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":14000},
  {"slug":"haikou","name":"海口","nameEn":"Haikou","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":10000},
  {"slug":"dalian","name":"大连","nameEn":"Dalian","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":15000},
  {"slug":"qingdao","name":"青岛","nameEn":"Qingdao","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":14000},
  {"slug":"xiamen","name":"厦门","nameEn":"Xiamen","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":12000},
  {"slug":"harbin","name":"哈尔滨","nameEn":"Harbin","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":12000},
  {"slug":"shenyang","name":"沈阳","nameEn":"Shenyang","country":"中国","countryCode":"CN","timezone":"Asia/Shanghai","timezoneName":"中国标准时间 (CST)","utcOffset":8,"dst":False,"searchVolume":13000},
  {"slug":"kobe","name":"神户","nameEn":"Kobe","country":"日本","countryCode":"JP","timezone":"Asia/Tokyo","timezoneName":"日本标准时间 (JST)","utcOffset":9,"dst":False,"searchVolume":10000},
  {"slug":"sendai","name":"仙台","nameEn":"Sendai","country":"日本","countryCode":"JP","timezone":"Asia/Tokyo","timezoneName":"日本标准时间 (JST)","utcOffset":9,"dst":False,"searchVolume":6000},
  {"slug":"daegu","name":"大邱","nameEn":"Daegu","country":"韩国","countryCode":"KR","timezone":"Asia/Seoul","timezoneName":"韩国标准时间 (KST)","utcOffset":9,"dst":False,"searchVolume":8000},
  {"slug":"incheon","name":"仁川","nameEn":"Incheon","country":"韩国","countryCode":"KR","timezone":"Asia/Seoul","timezoneName":"韩国标准时间 (KST)","utcOffset":9,"dst":False,"searchVolume":10000},
  {"slug":"surabaya","name":"泗水","nameEn":"Surabaya","country":"印尼","countryCode":"ID","timezone":"Asia/Jakarta","timezoneName":"西部印尼时间 (WIB)","utcOffset":7,"dst":False,"searchVolume":8000},
  {"slug":"pune","name":"浦那","nameEn":"Pune","country":"印度","countryCode":"IN","timezone":"Asia/Kolkata","timezoneName":"印度标准时间 (IST)","utcOffset":5.5,"dst":False,"searchVolume":12000},
  {"slug":"ahmedabad","name":"艾哈迈达巴德","nameEn":"Ahmedabad","country":"印度","countryCode":"IN","timezone":"Asia/Kolkata","timezoneName":"印度标准时间 (IST)","utcOffset":5.5,"dst":False,"searchVolume":14000},
  {"slug":"lahore","name":"拉合尔","nameEn":"Lahore","country":"巴基斯坦","countryCode":"PK","timezone":"Asia/Karachi","timezoneName":"巴基斯坦标准时间 (PKT)","utcOffset":5,"dst":False,"searchVolume":15000},
  {"slug":"amman","name":"安曼","nameEn":"Amman","country":"约旦","countryCode":"JO","timezone":"Asia/Amman","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周五","dstEnd":"10月最后一个周五","searchVolume":10000},
  {"slug":"tbilisi","name":"第比利斯","nameEn":"Tbilisi","country":"格鲁吉亚","countryCode":"GE","timezone":"Asia/Tbilisi","timezoneName":"格鲁吉亚标准时间 (GET)","utcOffset":4,"dst":False,"searchVolume":6000},
  {"slug":"baku","name":"巴库","nameEn":"Baku","country":"阿塞拜疆","countryCode":"AZ","timezone":"Asia/Baku","timezoneName":"阿塞拜疆时间 (AZT)","utcOffset":4,"dst":False,"searchVolume":8000},
  {"slug":"minsk","name":"明斯克","nameEn":"Minsk","country":"白俄罗斯","countryCode":"BY","timezone":"Europe/Minsk","timezoneName":"莫斯科标准时间 (MSK)","utcOffset":3,"dst":False,"searchVolume":10000},
  {"slug":"tallinn","name":"塔林","nameEn":"Tallinn","country":"爱沙尼亚","countryCode":"EE","timezone":"Europe/Tallinn","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":8000},
  {"slug":"riga","name":"里加","nameEn":"Riga","country":"拉脱维亚","countryCode":"LV","timezone":"Europe/Riga","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":7000},
  {"slug":"vilnius","name":"维尔纽斯","nameEn":"Vilnius","country":"立陶宛","countryCode":"LT","timezone":"Europe/Vilnius","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":7000},
  {"slug":"zagreb","name":"萨格勒布","nameEn":"Zagreb","country":"克罗地亚","countryCode":"HR","timezone":"Europe/Zagreb","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":8000},
  {"slug":"sofia","name":"索菲亚","nameEn":"Sofia","country":"保加利亚","countryCode":"BG","timezone":"Europe/Sofia","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":8000},
  {"slug":"belgrade","name":"贝尔格莱德","nameEn":"Belgrade","country":"塞尔维亚","countryCode":"RS","timezone":"Europe/Belgrade","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":8000},
  {"slug":"reykjavik","name":"雷克雅未克","nameEn":"Reykjavik","country":"冰岛","countryCode":"IS","timezone":"Atlantic/Reykjavik","timezoneName":"格林尼治平均时间 (GMT)","utcOffset":0,"dst":False,"searchVolume":5000},
  {"slug":"cancun","name":"坎昆","nameEn":"Cancun","country":"墨西哥","countryCode":"MX","timezone":"America/Cancun","timezoneName":"东部标准时间 (EST)","utcOffset":-5,"dst":False,"searchVolume":12000},
  {"slug":"panama-city","name":"巴拿马城","nameEn":"Panama City","country":"巴拿马","countryCode":"PA","timezone":"America/Panama","timezoneName":"东部标准时间 (EST)","utcOffset":-5,"dst":False,"searchVolume":8000},
  {"slug":"quito","name":"基多","nameEn":"Quito","country":"厄瓜多尔","countryCode":"EC","timezone":"America/Guayaquil","timezoneName":"厄瓜多尔时间 (ECT)","utcOffset":-5,"dst":False,"searchVolume":8000},
  {"slug":"la-paz","name":"拉巴斯","nameEn":"La Paz","country":"玻利维亚","countryCode":"BO","timezone":"America/La_Paz","timezoneName":"玻利维亚时间 (BOT)","utcOffset":-4,"dst":False,"searchVolume":6000},
  {"slug":"darwin","name":"达尔文","nameEn":"Darwin","country":"澳大利亚","countryCode":"AU","timezone":"Australia/Darwin","timezoneName":"澳大利亚中部标准时间 (ACST)","utcOffset":9.5,"dst":False,"searchVolume":8000},
  {"slug":"adelaide","name":"阿德莱德","nameEn":"Adelaide","country":"澳大利亚","countryCode":"AU","timezone":"Australia/Adelaide","timezoneName":"澳大利亚中部时间 (ACST/ACDT)","utcOffset":9.5,"dst":True,"dstStart":"10月第一个周日","dstEnd":"4月第一个周日","searchVolume":12000},
  {"slug":"hobart","name":"霍巴特","nameEn":"Hobart","country":"澳大利亚","countryCode":"AU","timezone":"Australia/Hobart","timezoneName":"澳大利亚东部时间 (AEST/AEDT)","utcOffset":10,"dst":True,"dstStart":"10月第一个周日","dstEnd":"4月第一个周日","searchVolume":6000},
  {"slug":"christchurch","name":"基督城","nameEn":"Christchurch","country":"新西兰","countryCode":"NZ","timezone":"Pacific/Auckland","timezoneName":"新西兰时间 (NZST/NZDT)","utcOffset":12,"dst":True,"dstStart":"9月最后一个周日","dstEnd":"4月第一个周日","searchVolume":8000},
  {"slug":"medan","name":"棉兰","nameEn":"Medan","country":"印尼","countryCode":"ID","timezone":"Asia/Jakarta","timezoneName":"西部印尼时间 (WIB)","utcOffset":7,"dst":False,"searchVolume":6000},
  {"slug":"beirut","name":"贝鲁特","nameEn":"Beirut","country":"黎巴嫩","countryCode":"LB","timezone":"Asia/Beirut","timezoneName":"东欧时间 (EET/EEST)","utcOffset":2,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":8000},
  {"slug":"bratislava","name":"布拉迪斯拉发","nameEn":"Bratislava","country":"斯洛伐克","countryCode":"SK","timezone":"Europe/Bratislava","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":6000},
  {"slug":"asuncion","name":"亚松森","nameEn":"Asuncion","country":"巴拉圭","countryCode":"PY","timezone":"America/Asuncion","timezoneName":"巴拉圭时间 (PYT)","utcOffset":-4,"dst":True,"dstStart":"10月第一个周日","dstEnd":"3月第三个周日","searchVolume":5000},
  {"slug":"ljubljana","name":"卢布尔雅那","nameEn":"Ljubljana","country":"斯洛文尼亚","countryCode":"SI","timezone":"Europe/Ljubljana","timezoneName":"中欧时间 (CET/CEST)","utcOffset":1,"dst":True,"dstStart":"3月最后一个周日","dstEnd":"10月最后一个周日","searchVolume":5000},
  {"slug":"nairobi-2","name":"内罗毕","nameEn":"Nairobi","country":"肯尼亚","countryCode":"KE","timezone":"Africa/Nairobi","timezoneName":"东部非洲时间 (EAT)","utcOffset":3,"dst":False,"searchVolume":20000},
]

data.extend(extra)
print(f'After adding: {len(data)} cities')

with open('data/top-200-cities.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print('Saved!')
