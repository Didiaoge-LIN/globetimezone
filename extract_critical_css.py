#!/usr/bin/env python3
"""Extract only above-the-fold critical CSS rules from style.min.css"""
import re, os

BASE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE, 'css', 'style.min.css'), 'r', encoding='utf-8') as f:
    css = f.read()

# Expand minified CSS to find rule boundaries
def get_rules(css_text):
    """Split CSS into individual rules"""
    rules = []
    depth = 0
    start = 0
    in_string = False
    string_char = None
    
    for i, ch in enumerate(css_text):
        if ch in ('"', "'") and (i == 0 or css_text[i-1] != '\\'):
            if not in_string:
                in_string = True
                string_char = ch
            elif ch == string_char:
                in_string = False
        elif not in_string:
            if ch == '{':
                if depth == 0:
                    selector = css_text[start:i].strip()
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    rules.append(css_text[start:i+1].strip())
                    start = i + 1
            elif ch == '@' and depth == 0 and start < i:
                # @media, @keyframes etc - include the whole block
                pass
    
    # Add remaining (like @keyframes, etc)
    if start < len(css_text) and css_text[start:].strip():
        rules.append(css_text[start:].strip())
    
    return rules

rules = get_rules(css)
print(f"Total CSS rules: {len(rules)}")

# Critical selectors (above-the-fold only)
CRITICAL_PATTERNS = [
    ':root', '*', 'body', 'a', 'header', '.header-inner', '.logo', 'nav',
    '.hero', '.hero::before', '.hero-content', '.hero h1', '.hero p',
    '.hero-subtitle', '.hero-cta', '.hero-badges', '.badge',
    '.breadcrumb', '.breadcrumb-inner', '.breadcrumb-sep', '.breadcrumb-current',
    '.card', '.card-title', '.section-title', '.section-sub',
    '.form-input', '.form-select', '.form-label', '.form-group',
    '.btn', '.btn-primary', '.btn-large', '.btn-outline', '.btn-sm',
    '.base-time-section', '.base-time-grid',
    '.time-slider-container', '.time-slider', '.slider-wrapper', '.slider-labels',
    '.current-slider-time', '#slider-time-display',
    '.multi-tz-section', '.multi-tz-header', '.multi-tz-grid',
    '.clock-controls', '.search-results',
    'h1', 'h2', 'h3', 'h4', 'p', 'main',
    '.lang-switch', '.lang-dropdown', '.lang-btn', '.lang-menu',
    '.share-section',
    # Essential layout
    '.quick-convert-grid', '.quick-convert-item',
    '@keyframes', '.clocks-grid',
    '.tool-card', '.tool-icon', '.tool-content',
    'main', 'section',
    '.notice-box', '.notice', '#converter',
    'strong',
]

critical_rules = []
non_critical_rules = []

for rule in rules:
    is_critical = False
    for pattern in CRITICAL_PATTERNS:
        if rule.strip().startswith(pattern):
            is_critical = True
            break
        # Also match multi-selector rules like "selector1,selector2{...}"
        # Get the selector part
        brace_idx = rule.find('{')
        if brace_idx > 0:
            first_part = rule[:brace_idx].strip()
            for selector in first_part.split(','):
                selector = selector.strip()
                if selector == pattern or selector.startswith(pattern):
                    is_critical = True
                    break
        if is_critical:
            break
    
    if is_critical:
        critical_rules.append(rule)
    else:
        non_critical_rules.append(rule)

critical_css = '\n'.join(critical_rules)
non_critical_css = '\n'.join(non_critical_rules)

# Minify the results
critical_css = re.sub(r'\s+', ' ', critical_css).strip()
non_critical_css = re.sub(r'\s+', ' ', non_critical_css).strip()

print(f"Critical rules: {len(critical_rules)} ({len(critical_css)/1024:.1f} KB)")
print(f"Non-critical rules: {len(non_critical_rules)} ({len(non_critical_css)/1024:.1f} KB)")

# Save critical CSS as separate file
critical_path = os.path.join(BASE, 'css', 'critical.css')
with open(critical_path, 'w', encoding='utf-8') as f:
    f.write(critical_css)
print(f"Saved critical CSS: {critical_path}")

# Create async CSS file (non-critical only)
async_css_path = os.path.join(BASE, 'css', 'async.css')
with open(async_css_path, 'w', encoding='utf-8') as f:
    f.write(non_critical_css)
print(f"Saved async CSS: {async_css_path}")

# Now update index.html to inline critical CSS and load async CSS
idx_path = os.path.join(BASE, 'index.html')
with open(idx_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the blocking CSS link with inlined critical + async load
old = '<link rel="stylesheet" href="/css/style.min.css" />'
new = f'''<style>{critical_css}</style>
<link rel="preload" href="/css/style.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="/css/style.min.css" /></noscript>'''

if old in html:
    html = html.replace(old, new)
    with open(idx_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Updated: {idx_path}")
else:
    print("⚠️  Could not find CSS link in index.html")
