#!/usr/bin/env python3
"""Apply Critical CSS inline + async full CSS load to index.html"""
import re, os

BASE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE, 'css', 'style.min.css'), 'r', encoding='utf-8') as f:
    css = f.read()

# Extract critical CSS rules
def get_rules(css_text):
    rules = []
    depth = 0; start = 0; in_str = False; q = None
    for i, ch in enumerate(css_text):
        if ch in ('"', "'") and (i == 0 or css_text[i-1] != '\\'):
            if not in_str: in_str = True; q = ch
            elif ch == q: in_str = False
        elif not in_str:
            if ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    rules.append(css_text[start:i+1].strip())
                    start = i + 1
    if start < len(css_text) and css_text[start:].strip():
        rules.append(css_text[start:].strip())
    return rules

rules = get_rules(css)

CRITICAL = {
    ':root','*','body','a:hover','header','.header-inner','.logo','nav',
    'nav a','nav a:hover,nav a.active','.hero','.hero::before','.hero-content',
    '.hero h1','.hero p','.hero-subtitle','.hero-cta','.hero-badges','.badge',
    '.breadcrumb','.breadcrumb-inner','.breadcrumb-sep','.breadcrumb-current',
    '.card','.card-title','.section-title','.section-sub',
    '.form-input','.form-select','.form-label','.form-group',
    '.form-input:focus','.form-select:focus',
    '.btn','.btn-primary','.btn-large','.btn-outline','.btn-outline:hover','.btn-sm',
    '.base-time-section','.base-time-grid',
    '.time-slider-container','.time-slider','.time-slider:focus',
    '.slider-wrapper','.slider-labels','.current-slider-time',
    '.multi-tz-section','.multi-tz-header',
    '.clock-controls','.search-results',
    '.share-section',
    '.quick-convert-grid','.quick-convert-item','.qc-flag','.qc-info','.qc-name','.qc-desc',
    '.tool-card','.tool-icon','.tool-content','.tool-tag',
    '.quick-region-btn','.articles-grid','.article-card','.article-img','.article-body',
    '.article-tag','.article-title','.article-excerpt','.article-meta',
    '.clocks-grid','.clocks-hint','.notice-box',
    '.lang-switch','.lang-dropdown','.lang-btn','.lang-menu',
    '.lang-option','.lang-flag','.lang-name','.lang-native',
    'h1','h2','h3','a','p','main','section','strong','#converter',
    '.pwa-install-banner',
}

critical_rules = []
for rule in rules:
    brace = rule.find('{')
    if brace > 0:
        selector_part = rule[:brace].strip()
        for sel in selector_part.split(','):
            sel = sel.strip()
            if sel in CRITICAL:
                critical_rules.append(rule)
                break
            else:
                # Check prefix match
                for cp in CRITICAL:
                    if sel.startswith(cp) and (len(sel) == len(cp) or sel[len(cp)] in ' :.#['):
                        critical_rules.append(rule)
                        break
                else:
                    continue
                break

critical_css = ' '.join(critical_rules)
# Compact
critical_css = re.sub(r'\s+', ' ', critical_css).strip()

print(f"Critical rules: {len(critical_rules)} ({len(critical_css)/1024:.1f} KB)")
print(f"Total rules in CSS: {len(rules)} ({len(css)/1024:.1f} KB)")

# Read index.html
with open(os.path.join(BASE, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

# Replace blocking CSS link
old = '<link rel="stylesheet" href="/css/style.min.css" />'
new = f'''<style>{critical_css}</style>
<link rel="preload" href="/css/style.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="/css/style.min.css" /></noscript>'''

if old in html:
    html = html.replace(old, new)
    print("✅ CSS link replaced with inline critical + async load")
else:
    print("❌ Could not find CSS link")
    # Try alternative patterns
    for pattern in ['/css/style.min.css', '/css/style.css']:
        if pattern in html:
            idx = html.find(pattern)
            print(f"  Found '{pattern}' at position {idx}")
            print(f"  Context: ...{html[max(0,idx-50):idx+20]}...")

with open(os.path.join(BASE, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Final size: {len(html)/1024:.1f} KB")
print("Done!")
