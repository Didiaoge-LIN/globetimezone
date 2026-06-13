#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""城市时区合法性校验工具
构建时批量检测时区字符串是否符合IANA标准
"""
import re
from pathlib import Path
from zoneinfo import available_timezones

CITY_DATA_FILE = Path("functions/city/city-data.js")
VALID_TIMEZONES = available_timezones()

def main():
    content = CITY_DATA_FILE.read_text(encoding="utf-8")
    # 适配现有格式: "tz":"Asia/Shanghai"
    pattern = re.compile(r'"tz":\s*"([^"]+)"')
    timezone_list = pattern.findall(content)
    invalid_list = [tz for tz in timezone_list if tz not in VALID_TIMEZONES]

    if invalid_list:
        print(f"❌ 发现 {len(invalid_list)} 个无效时区:")
        for tz in invalid_list:
            print(f"  - {tz}")
    else:
        print(f"✅ 所有 {len(timezone_list)} 个时区均符合IANA标准")

if __name__ == "__main__":
    main()
