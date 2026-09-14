#!/usr/bin/env python3
"""Batch fix all language index pages with missing form labels"""
import glob, re, os

BASE = os.path.dirname(os.path.abspath(__file__))

# Mapping: language folder → placeholder text pattern → aria-label text
LANG_MAP = {
    'ar/': {'search_pattern': 'ابحث عن مدينة', 'aria_label': 'البحث عن مدينة'},
    'de/': {'search_pattern': 'Stadt suchen', 'aria_label': 'Stadt suchen'},
    'es/': {'search_pattern': 'Buscar ciudad', 'aria_label': 'Buscar ciudad'},
    'fr/': {'search_pattern': 'Rechercher une ville', 'aria_label': 'Rechercher une ville'},
    'ja/': {'search_pattern': '都市を検索', 'aria_label': '都市を検索'},
    'ko/': {'search_pattern': '도시 검색', 'aria_label': '도시 검색'},
    'pt/': {'search_pattern': 'Buscar cidade', 'aria_label': 'Buscar cidade'},
}

INDEX_FILES = sorted(glob.glob(os.path.join(BASE, '**/index.html'), recursive=True))

fixed_count = 0

for fpath in INDEX_FILES:
    rel = os.path.relpath(fpath, BASE).replace('\\', '/')
    if 'node_modules' in fpath:
        continue
    
    with open(fpath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    modified = False
    
    # Fix 1: time-slider label → add for="time-slider"
    # Pattern: <label class="form-label">⏱️ ... </label>
    old_slider_label = re.search(
        r'<label class="form-label">⏱️[^<]*</label>',
        html
    )
    if old_slider_label:
        old = old_slider_label.group(0)
        new = old.replace('<label class="form-label">', '<label class="form-label" for="time-slider">')
        html = html.replace(old, new)
        modified = True
    
    # Fix 2: city-search input → add aria-label
    # Find the placeholder text for this language
    city_input = re.search(
        r'<input type="text" id="city-search" class="form-input" placeholder="([^"]*)"',
        html
    )
    if city_input and 'aria-label=' not in city_input.group(0):
        old = city_input.group(0)
        placeholder = city_input.group(1)
        # Use placeholder text without emoji as aria-label
        aria_text = re.sub(r'[^\w\s\u4e00-\u9fff\u0600-\u06ff\u3040-\u30ff\uac00-\ud7af]', '', placeholder).strip()
        if not aria_text:
            aria_text = 'Search city to add'
        new = old + f' aria-label="{aria_text}"'
        html = html.replace(old, new)
        modified = True
    
    if modified:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(html)
        fixed_count += 1

# Also fix the old index-XX.html redirect files
OLD_INDEX_FILES = sorted(glob.glob(os.path.join(BASE, 'index-*.html')))
for fpath in OLD_INDEX_FILES:
    with open(fpath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    modified = False
    
    # Fix 1: time-slider label for=
    old_slider_label = re.search(
        r'<label class="form-label">⏱️[^<]*</label>',
        html
    )
    if old_slider_label:
        old = old_slider_label.group(0)
        new = old.replace('<label class="form-label">', '<label class="form-label" for="time-slider">')
        html = html.replace(old, new)
        modified = True
    
    # Fix 2: city-search aria-label
    city_input = re.search(
        r'<input type="text" id="city-search"[^>]*>',
        html
    )
    if city_input and 'aria-label=' not in city_input.group(0):
        old = city_input.group(0)
        # Extract placeholder
        ph = re.search(r'placeholder="([^"]*)"', old)
        aria_text = re.sub(r'[^\w\s\u4e00-\u9fff\u0600-\u06ff\u3040-\u30ff\uac00-\ud7af]', '', ph.group(1) if ph else '').strip()
        if not aria_text:
            aria_text = 'Search city'
        new = old.rstrip('>').rstrip() + f' aria-label="{aria_text}">'
        html = html.replace(old, new)
        modified = True
    
    if modified:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(html)
        fixed_count += 1

# Also fix extension/popup.html
ext_path = os.path.join(BASE, 'extension', 'popup.html')
if os.path.exists(ext_path):
    with open(ext_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    modified = False
    
    # Fix select without label
    select_match = re.search(r'<select id="city-select"[^>]*>', html)
    if select_match and 'aria-label=' not in select_match.group(0):
        old = select_match.group(0)
        new = old.rstrip('>') + ' aria-label="Select city">'
        html = html.replace(old, new)
        modified = True
        
    if modified:
        with open(ext_path, 'w', encoding='utf-8') as f:
            f.write(html)
        fixed_count += 1

print(f"Fixed {fixed_count} files")
