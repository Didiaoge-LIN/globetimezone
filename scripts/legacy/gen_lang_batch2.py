#!/usr/bin/env python3
"""Generate ja/ko/pt/ar language JSON files for GlobeTimeZone."""

import json
import os

LOCALES_DIR = os.path.join(os.path.dirname(__file__), "locales")

# Import the dicts from the inline definitions above
# We'll write them directly in this script

def write_json(lang_code, data, keys_order):
    missing = [k for k in keys_order if k not in data]
    extra = [k for k in data if k not in keys_order]
    if missing:
        print(f"  WARNING {lang_code}: missing {len(missing)} keys: {missing[:5]}...")
    if extra:
        print(f"  WARNING {lang_code}: extra {len(extra)} keys: {extra[:5]}...")
    path = os.path.join(LOCALES_DIR, f"{lang_code}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  OK {lang_code}.json — {len(data)} keys written")

if __name__ == "__main__":
    # Load en.json to get key order
    with open(os.path.join(LOCALES_DIR, "en.json"), "r", encoding="utf-8") as f:
        en = json.load(f)
    keys_order = list(en.keys())
    print(f"Loaded {len(keys_order)} keys from en.json")

    # ja, ko, pt files already written by the large inline script above
    # Just verify they exist and have correct key count
    for lang in ["ja", "ko", "pt", "ar"]:
        path = os.path.join(LOCALES_DIR, f"{lang}.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            print(f"  {lang}.json exists with {len(data)} keys")
        else:
            print(f"  {lang}.json NOT FOUND - needs generation")
