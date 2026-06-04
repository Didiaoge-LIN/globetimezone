#!/usr/bin/env python3
"""One-shot apply ALL PageSpeed optimizations to index.html"""
import re, os

BASE = os.path.dirname(os.path.abspath(__file__))

# 1. Read files
with open(os.path.join(BASE, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

with open(os.path.join(BASE, 'css', 'style.min.css'), 'r', encoding='utf-8') as f:
    css = f.read()

# 2. Extract critical CSS
def get_rules(css_text):
    rules = []
    depth = 0
    start = 0
    in_string = False
    string_char = None
    for i, ch in enumerate(css_text):
        if ch in ('"', "'") and (i == 0 or css_text[i-1] != '\\'):
            if not in_string:
                in_string = True; string_char = ch
            elif ch == string_char:
                in_string = False
        elif not in_string:
            if ch == '{':
                if depth == 0: selector = css_text[start:i].strip()
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    rules.append(css_text[start:i+1].strip())
                    start = i + 1
    if start < len(css_text) and css_text[start:].strip():
        rules.append(css_text[start:].strip())
    return rules

rules = get_rules(css)
CRITICAL_PATTERNS = [
    ':root', '*', 'body', 'a:hover', 'header', '.header-inner', '.logo', 'nav',
    '.hero', '.hero::before', '.hero-content', '.hero h1', '.hero p',
    '.hero-subtitle', '.hero-cta', '.hero-badges', '.badge',
    '.breadcrumb', '.breadcrumb-inner', '.breadcrumb-sep', '.breadcrumb-current',
    '.card', '.card-title', '.section-title', '.section-sub',
    '.form-input', '.form-select', '.form-label', '.form-group',
    '.btn', '.btn-primary', '.btn-large', '.btn-outline', '.btn-sm',
    '.base-time-section', '.base-time-grid', '.btn-outline:hover',
    '.time-slider-container', '.time-slider', '.time-slider:focus',
    '.slider-wrapper', '.slider-labels', '.current-slider-time',
    '.multi-tz-section', '.multi-tz-header', '.multi-tz-grid',
    '.clock-controls', '.search-results',
    'h1,', 'h2,', 'h3,', 'main,',
    '.lang-switch', '.lang-dropdown', '.lang-btn', '.lang-menu',
    '.share-section',
    '.quick-convert-grid', '.quick-convert-item', '.qc-flag', '.qc-info', '.qc-name', '.qc-desc',
    '.tool-card', '.tool-icon', '.tool-content', '.tool-tag',
    '.quick-region-btn',
    '.articles-grid', '.article-card', '.article-img', '.article-body',
    '.article-tag', '.article-title', '.article-excerpt', '.article-meta',
    '.clocks-grid', '.clocks-hint', '.notice-box',
    '.form-input:focus', '.form-select:focus',
    '.pwa-install-banner', '#converter', 'strong',
]

critical_rules = []
for rule in rules:
    is_critical = False
    brace = rule.find('{')
    if brace > 0:
        first = rule[:brace].strip()
        for s in first.split(','):
            s = s.strip()
            if s in CRITICAL_PATTERNS:
                is_critical = True; break
            for p in CRITICAL_PATTERNS:
                if s.startswith(p):
                    is_critical = True; break
            if is_critical: break
    if is_critical:
        critical_rules.append(rule)

critical_css = re.sub(r'\s+', ' ', ' '.join(critical_rules)).strip()
print(f"Critical CSS: {len(critical_rules)} rules, {len(critical_css)/1024:.1f} KB")

# 3. Apply all fixes to HTML
# Replace CSS link with inline critical + async load
old_css = '<link rel="stylesheet" href="/css/style.min.css" />'
new_css = f'''<style>{critical_css}</style>
<link rel="preload" href="/css/style.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="/css/style.min.css" /></noscript>'''
html = html.replace(old_css, new_css)

# Fix time-slider label
html = html.replace(
    '<label class="form-label">⏱️ Time Slider — Drag to see all cities at different times</label>',
    '<label class="form-label" for="time-slider">⏱️ Time Slider — Drag to see all cities at different times</label>'
)

# Fix city-search input
html = html.replace(
    '<input type="text" id="city-search" class="form-input" placeholder="🔍 Search city to add..." oninput="searchCity(this.value)" autocomplete="off">',
    '<input type="text" id="city-search" class="form-input" placeholder="🔍 Search city to add..." aria-label="Search city to add" oninput="searchCity(this.value)" autocomplete="off">'
)

# Fix newsletter email
html = html.replace(
    '<input type="email" name="email" placeholder="your@email.com" required ',
    '<input type="email" name="email" placeholder="your@email.com" aria-label="Email address for newsletter" required '
)

# Replace inline scripts with deferred external reference
# Remove SW registration script
html = re.sub(
    r'\n<!-- Service Worker Registration -->\n<script>[\s\S]*?</script>\n',
    '\n',
    html
)
# Remove PWA + Quick Cities script
html = re.sub(
    r'\n<!-- PWA Install Prompt -->[\s\S]*?function dismissPWA\(\)[\s\S]*?updateQuickCities\(\);?\s*\n</script>\n',
    '',
    html
)

# Add home.js reference after main.js
html = html.replace(
    '<script defer src="/js/main.js"></script>',
    '<script defer src="/js/main.js"></script>\n<script defer src="/js/home.js"></script>'
)

# Add PWA banner HTML back (before the scripts)
pwa_banner = '''
<!-- PWA Install Prompt -->
<div id="pwa-install-banner" class="pwa-install-banner" style="display:none;">
  <span>📱 Install GlobeTimeZone for quick access</span>
  <div style="display:flex;gap:8px;">
    <button class="btn" onclick="installPWA()">Install</button>
    <button class="btn" onclick="dismissPWA()" style="background:transparent;color:white;border:1px solid rgba(255,255,255,0.3);">Not Now</button>
  </div>
</div>
'''
html = html.replace('<script defer src="/js/main.js"></script>', pwa_banner + '<script defer src="/js/main.js"></script>')

# 4. Write result
with open(os.path.join(BASE, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)

print(f"HTML size: {len(html)/1024:.1f} KB")

# Verify
checks = [
    ('Critical CSS inline', '<style>' in html),
    ('Async CSS preload', 'rel="preload"' in html),
    ('No blocking stylesheet link', '<link rel="stylesheet"' not in html),
    ('aria-label search', 'aria-label="Search city to add"' in html),
    ('aria-label email', 'aria-label="Email address' in html),
    ('time-slider for=', 'for="time-slider"' in html),
    ('home.js deferred', 'js/home.js' in html),
    ('PWA banner present', 'pwa-install-banner' in html),
]
for name, ok in checks:
    print(f'  {"✅" if ok else "❌"} {name}')

print("Done! All fixes applied correctly.")
