#!/usr/bin/env python3
"""GlobeTimeZone 30-day traffic analysis"""

data = [
    {'date': '2026-05-16', 'pv': 407, 'req': 677, 'bytes': 6376388, 'cached': 455193, 'uniques': 161},
    {'date': '2026-05-17', 'pv': 742, 'req': 910, 'bytes': 9895256, 'cached': 134785, 'uniques': 115},
    {'date': '2026-05-18', 'pv': 447, 'req': 627, 'bytes': 8884174, 'cached': 77020, 'uniques': 152},
    {'date': '2026-05-19', 'pv': 913, 'req': 1365, 'bytes': 13342923, 'cached': 256772, 'uniques': 424},
    {'date': '2026-05-20', 'pv': 1110, 'req': 1577, 'bytes': 16074460, 'cached': 847014, 'uniques': 224},
    {'date': '2026-05-21', 'pv': 1471, 'req': 2538, 'bytes': 17948739, 'cached': 324520, 'uniques': 454},
    {'date': '2026-05-22', 'pv': 1744, 'req': 2464, 'bytes': 26305944, 'cached': 1003495, 'uniques': 217},
    {'date': '2026-05-23', 'pv': 374, 'req': 494, 'bytes': 4823447, 'cached': 60281, 'uniques': 122},
    {'date': '2026-05-24', 'pv': 485, 'req': 678, 'bytes': 8196646, 'cached': 1530357, 'uniques': 96},
    {'date': '2026-05-25', 'pv': 351, 'req': 440, 'bytes': 10050429, 'cached': 714833, 'uniques': 106},
    {'date': '2026-05-26', 'pv': 592, 'req': 826, 'bytes': 16179597, 'cached': 763250, 'uniques': 180},
    {'date': '2026-05-27', 'pv': 474, 'req': 737, 'bytes': 8573103, 'cached': 3297885, 'uniques': 181},
    {'date': '2026-05-28', 'pv': 198, 'req': 691, 'bytes': 4594620, 'cached': 588496, 'uniques': 136},
    {'date': '2026-05-29', 'pv': 260, 'req': 1316, 'bytes': 7351412, 'cached': 1152718, 'uniques': 242},
    {'date': '2026-05-30', 'pv': 112, 'req': 579, 'bytes': 2962172, 'cached': 391932, 'uniques': 142},
    {'date': '2026-05-31', 'pv': 156, 'req': 2042, 'bytes': 7206411, 'cached': 700550, 'uniques': 474},
    {'date': '2026-06-01', 'pv': 88, 'req': 1144, 'bytes': 3600293, 'cached': 2886496, 'uniques': 208},
    {'date': '2026-06-02', 'pv': 42, 'req': 691, 'bytes': 2583248, 'cached': 2358791, 'uniques': 159},
    {'date': '2026-06-03', 'pv': 68, 'req': 1378, 'bytes': 4998561, 'cached': 4495061, 'uniques': 116},
    {'date': '2026-06-04', 'pv': 356, 'req': 1941, 'bytes': 9359552, 'cached': 560760, 'uniques': 346},
    {'date': '2026-06-05', 'pv': 299, 'req': 6456, 'bytes': 14446681, 'cached': 325297, 'uniques': 293},
    {'date': '2026-06-06', 'pv': 111, 'req': 881, 'bytes': 4408791, 'cached': 41917, 'uniques': 136},
    {'date': '2026-06-07', 'pv': 58, 'req': 386, 'bytes': 2515988, 'cached': 5517, 'uniques': 149},
    {'date': '2026-06-08', 'pv': 399, 'req': 2166, 'bytes': 7980652, 'cached': 643764, 'uniques': 269},
    {'date': '2026-06-09', 'pv': 503, 'req': 5139, 'bytes': 18886383, 'cached': 1539308, 'uniques': 305},
    {'date': '2026-06-10', 'pv': 214, 'req': 1121, 'bytes': 5349631, 'cached': 428469, 'uniques': 254},
    {'date': '2026-06-11', 'pv': 451, 'req': 3941, 'bytes': 18289306, 'cached': 1141232, 'uniques': 322},
    {'date': '2026-06-12', 'pv': 308, 'req': 2015, 'bytes': 7892298, 'cached': 494590, 'uniques': 259},
    {'date': '2026-06-13', 'pv': 1610, 'req': 3070, 'bytes': 18993996, 'cached': 1413838, 'uniques': 400},
    {'date': '2026-06-14', 'pv': 2666, 'req': 3877, 'bytes': 30274832, 'cached': 660601, 'uniques': 348},
]

total_pv = sum(d['pv'] for d in data)
total_req = sum(d['req'] for d in data)
total_bytes = sum(d['bytes'] for d in data)
total_cached = sum(d['cached'] for d in data)
total_uniques = sum(d['uniques'] for d in data)
avg_pv = total_pv / len(data)
avg_uniques = total_uniques / len(data)
cache_ratio = total_cached / total_bytes * 100

# Week-by-week breakdown
weeks = [
    ('5/16-5/22', data[0:7]),
    ('5/23-5/29', data[7:14]),
    ('5/30-6/5', data[14:21]),
    ('6/6-6/12', data[21:28]),
    ('6/13-6/14', data[28:30]),
]

print('=' * 70)
print('GlobeTimeZone 30-day traffic analysis (2026-05-16 ~ 2026-06-14)')
print('=' * 70)
print()
print('Overview')
print(f'  Total PageViews:   {total_pv:,}')
print(f'  Total Requests:    {total_req:,}')
print(f'  Total Uniques:     {total_uniques:,} (cumulative)')
print(f'  Total Bandwidth:   {total_bytes/1024/1024:.1f} MB')
print(f'  Cache Hit Ratio:   {cache_ratio:.1f}%')
print(f'  Daily Avg PV:      {avg_pv:.0f}')
print(f'  Daily Avg Uniques: {avg_uniques:.0f}')
print()
print('Weekly Trend')
print(f'{"Period":<14} {"PV":>8} {"Requests":>10} {"Uniques":>10} {"BW MB":>10} {"Cache%":>8}')
print('-' * 65)
for label, week in weeks:
    wpv = sum(d['pv'] for d in week)
    wreq = sum(d['req'] for d in week)
    wuni = sum(d['uniques'] for d in week)
    wb = sum(d['bytes'] for d in week) / 1024 / 1024
    wb_total = sum(d['bytes'] for d in week)
    wc_total = sum(d['cached'] for d in week)
    wc = wc_total / wb_total * 100 if wb_total > 0 else 0
    print(f'{label:<14} {wpv:>8,} {wreq:>10,} {wuni:>10,} {wb:>10.1f} {wc:>7.1f}%')

print()
print('Daily Detail - Last 14 days')
print(f'{"Date":<12} {"PV":>6} {"Req":>6} {"Uniq":>6} {"PV/Req":>8} {"Cache%":>8}')
print('-' * 55)
for d in data[-14:]:
    pv_req = d['pv'] / d['req'] * 100 if d['req'] > 0 else 0
    cr = d['cached'] / d['bytes'] * 100 if d['bytes'] > 0 else 0
    print(f'{d["date"]:<12} {d["pv"]:>6,} {d["req"]:>6,} {d["uniques"]:>6,} {pv_req:>7.1f}% {cr:>7.1f}%')

print()
print('Key Findings')
peak = max(data, key=lambda x: x['pv'])
valley = min(data, key=lambda x: x['pv'])
print(f'  Peak Day:  {peak["date"]} PV={peak["pv"]:,}')
print(f'  Valley Day: {valley["date"]} PV={valley["pv"]:,}')
print(f'  Peak/Valley Ratio: {peak["pv"]/valley["pv"]:.1f}x')

recent7 = sum(d['pv'] for d in data[-7:])
first7 = sum(d['pv'] for d in data[:7])
trend = (recent7 - first7) / first7 * 100
print(f'  Last 7d PV vs First 7d: {recent7:,} vs {first7:,} ({trend:+.1f}%)')

low_cache = [d for d in data if d['cached']/d['bytes'] < 0.05]
print(f'  Days with cache<5%: {len(low_cache)}/30')
high_cache = [d for d in data if d['cached']/d['bytes'] > 0.3]
print(f'  Days with cache>30%: {len(high_cache)}/30')

high_req_pv = [d for d in data if d['req'] > d['pv'] * 4]
print(f'  Days with Req/PV>4x: {len(high_req_pv)}/30 (likely bots)')
for d in high_req_pv:
    print(f'    {d["date"]}: req={d["req"]:,} pv={d["pv"]:,} ratio={d["req"]/d["pv"]:.1f}x')

# Estimated real human traffic (PV/Req ratio > 40% = mostly human)
human_days = [d for d in data if d['pv'] / d['req'] > 0.35]
bot_heavy_days = [d for d in data if d['pv'] / d['req'] < 0.15]
print(f'  Human-dominated days (PV/Req>35%): {len(human_days)}/30')
print(f'  Bot-heavy days (PV/Req<15%): {len(bot_heavy_days)}/30')
