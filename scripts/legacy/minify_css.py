#!/usr/bin/env python3
"""Minify CSS for PageSpeed optimization"""
import re

import os
base = os.path.dirname(os.path.abspath(__file__))
css_path = os.path.join(base, 'css', 'style.css')
out_path = os.path.join(base, 'css', 'style.min.css')

with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Minify: remove comments, collapse whitespace
css_min = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
css_min = re.sub(r'\s+', ' ', css_min)
css_min = re.sub(r'\s*{\s*', '{', css_min)
css_min = re.sub(r'\s*}\s*', '}', css_min)
css_min = re.sub(r'\s*;\s*', ';', css_min)
css_min = re.sub(r'\s*:\s*', ':', css_min)
css_min = re.sub(r'\s*,\s*', ',', css_min)
css_min = re.sub(r';\}', '}', css_min)
css_min = css_min.strip()

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(css_min)

orig = len(css.encode('utf-8'))
mini = len(css_min.encode('utf-8'))
print(f"Original:  {orig} bytes")
print(f"Minified: {mini} bytes")
print(f"Saved:    {orig - mini} bytes ({(1 - mini/orig)*100:.1f}%)")
