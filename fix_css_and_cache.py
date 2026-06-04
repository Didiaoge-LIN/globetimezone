#!/usr/bin/env python3
"""Fix CSS: replace outline:none with accessible focus styles, add _headers for caching"""
import re, os

BASE = os.path.dirname(os.path.abspath(__file__))

# Read CSS
css_path = os.path.join(BASE, 'css', 'style.min.css')
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Fix 1: Replace outline:none in form-input/select rule
# .form-select,.form-input{...outline:none...}
old_outline = 'outline:none'
new_outline = 'outline:2px solid transparent'

css = css.replace(
    '.form-select,.form-input{padding:12px 16px;border:2px solid var(--border);border-radius:10px;font-size:1rem;color:var(--text);background:white;transition:border-color 0.2s;outline:none;width:100%}',
    '.form-select,.form-input{padding:12px 16px;border:2px solid var(--border);border-radius:10px;font-size:1rem;color:var(--text);background:white;transition:border-color 0.2s;outline:2px solid transparent;width:100%}.form-input:focus,.form-select:focus{outline:2px solid var(--primary);outline-offset:-2px}'
)

# Fix 2: Replace outline:none in time-slider rule
css = css.replace(
    '.time-slider{width:100%;height:8px;-webkit-appearance:none;appearance:none;background:linear-gradient(90deg,#64748b 0%,var(--primary) 50%,#64748b 100%);border-radius:4px;outline:none;cursor:pointer}',
    '.time-slider{width:100%;height:8px;-webkit-appearance:none;appearance:none;background:linear-gradient(90deg,#64748b 0%,var(--primary) 50%,#64748b 100%);border-radius:4px;outline:2px solid transparent;cursor:pointer}.time-slider:focus{outline:2px solid var(--primary);outline-offset:2px}'
)

# Save updated CSS
with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print(f"Updated: {css_path}")

# Also create _headers file for cache policy
headers_path = os.path.join(BASE, '_headers')
headers_content = """# Cache policy for static assets
/js/*
  Cache-Control: public, max-age=604800, immutable

/css/*
  Cache-Control: public, max-age=604800, immutable

/icons/*
  Cache-Control: public, max-age=2592000, immutable

/apple-touch-icon.png
  Cache-Control: public, max-age=2592000, immutable

/manifest.json
  Cache-Control: public, max-age=86400

/sw.js
  Cache-Control: public, max-age=86400

# HTML pages - short cache
/*.html
  Cache-Control: public, max-age=3600
"""

with open(headers_path, 'w', encoding='utf-8') as f:
    f.write(headers_content)
print(f"Created: {headers_path}")

print("Done!")
