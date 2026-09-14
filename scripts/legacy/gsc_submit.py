#!/usr/bin/env python3
"""
GSC Sitemap Submitter & Index Coverage Monitor
GlobeTimeZone.com - Google Search Console Automation

Usage:
  1. Place GSC service account JSON at ~/.gsc_credentials.json
  2. Run: python gsc_submit.py submit
  3. Run: python gsc_submit.py monitor
"""

import json
import urllib.request
import urllib.parse
import sys
import os
from datetime import datetime, timedelta

# ====== Configuration ======
SITE_URL = "sc-domain:globetimezone.com"  # Use "sc-domain:" for domain property, or "https://globetimezone.com" for URL property
SITEMAP_URL = "https://globetimezone.com/sitemap.xml"
GSC_API_BASE = "https://www.googleapis.com/webmasters/v3"
CRED_FILE = os.path.expanduser("~/.gsc_credentials.json")

# If using service account, set GOOGLE_APPLICATION_CREDENTIALS env var
# Or set GSC_ACCESS_TOKEN directly (short-lived)
# ====== End Configuration ======


def load_access_token():
    """Load access token from env or service account."""
    # Method 1: Direct token (from GSC dashboard > Settings > Users and permissions > API)
    token = os.environ.get("GSC_ACCESS_TOKEN")
    if token:
        return token

    # Method 2: Service account JSON
    if os.path.exists(CRED_FILE):
        import base64
        import time
        import hmac
        import hashlib
        import struct

        with open(CRED_FILE) as f:
            creds = json.load(f)

        # Use OAuth2 for service account (simplified - in production use google-auth library)
        print(f"[WARN] Service account auth requires 'google-auth' library.")
        print(f"[WARN] Please install: pip install google-auth")
        print(f"[INFO] Or set GSC_ACCESS_TOKEN env var with a long-lived token.")
        return None

    print("[ERROR] No GSC credentials found.")
    print("[INFO] Setup options:")
    print("  1. Set GSC_ACCESS_TOKEN env var")
    print(f"  2. Place service account JSON at {CRED_FILE}")
    print("  3. Run manual submission via GSC Dashboard (see GSC-SETUP.md)")
    return None


def submit_sitemap(token):
    """Submit sitemap to GSC via API."""
    url = f"{GSC_API_BASE}/sites/{urllib.parse.quote(SITE_URL, safe='')}/sitemaps/{urllib.parse.quote(SITEMAP_URL, safe='')}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, method="PUT", headers=headers)

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[OK] Sitemap submitted successfully!")
            print(f"      Response: {resp.read().decode()}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[ERROR] Failed to submit sitemap: {e.code} {e.reason}")
        print(f"        {body}")
        return False


def get_sitemap_status(token):
    """Get sitemap processing status from GSC."""
    url = f"{GSC_API_BASE}/sites/{urllib.parse.quote(SITE_URL, safe='')}/sitemaps"
    headers = {"Authorization": f"Bearer {token}"}
    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            return data
    except urllib.error.HTTPError as e:
        print(f"[ERROR] Failed to get sitemap status: {e.code} {e.reason}")
        return None


def get_index_coverage(token, start_date=None, end_date=None):
    """Get index coverage data from GSC API (Search Analytics API)."""
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    url = f"{GSC_API_BASE}/sites/{urllib.parse.quote(SITE_URL, safe='')}/searchAnalytics/query"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["page"],
        "rowLimit": 1000,
        "startRow": 0,
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers=headers)

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            return result
    except urllib.error.HTTPError as e:
        print(f"[ERROR] Failed to get index coverage: {e.code} {e.reason}")
        return None


def get_sitemap_indexed_count(token):
    """Get indexed page count from sitemap status."""
    data = get_sitemap_status(token)
    if not data:
        return None

    print(f"\n{'='*60}")
    print(f" Sitemap Status - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*60}")

    total_submitted = 0
    total_indexed = 0

    for sitemap in data.get("sitemap", []):
        path = sitemap.get("path", "")
        contents = sitemap.get("contents", [])

        print(f"\n📄 {path}")
        print(f"   Last downloaded: {sitemap.get('lastDownloaded', 'N/A')}")
        print(f"   Last submitted:  {sitemap.get('lastSubmitted', 'N/A')}")
        print(f"   Status:          {sitemap.get('errors', 'N/A')} errors")

        for content in contents:
            submitted = content.get("submitted", 0)
            indexed = content.get("indexed", 0)
            type_name = content.get("type", "unknown")
            total_submitted += submitted
            total_indexed += indexed
            print(f"   └─ {type_name}: {indexed}/{submitted} indexed")

    print(f"\n{'─'*60}")
    print(f"  TOTAL: {total_indexed}/{total_submitted} URLs indexed")
    if total_submitted > 0:
        pct = (total_indexed / total_submitted) * 100
        print(f"  Coverage: {pct:.1f}%")
    print(f"{'='*60}\n")

    return total_indexed, total_submitted


def check_indexed_via_search():
    """Fallback: Check indexed pages via Google search operator (no API needed)."""
    import subprocess
    import re

    print(f"\n[INFO] Checking indexed pages via Google search operator...")
    print(f"[INFO] This uses web scraping and may be rate-limited.\n")

    queries = [
        ("All pages", "site:globetimezone.com"),
        ("English pages", "site:globetimezone.com -inurl:/zh/ -inurl:/es/ -inurl:/fr/"),
        ("Chinese pages", "site:globetimezone.com/zh/"),
        ("Spanish pages", "site:globetimezone.com/es/"),
        ("Time converter pages", "site:globetimezone.com/pages/time-in/"),
    ]

    proxy = "http://127.0.0.1:10808"

    for label, query in queries:
        search_url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&num=10"
        try:
            cmd = ["curl", "-x", proxy, "-s", "-A", "Mozilla/5.0", search_url]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)

            # Extract "About X results" or similar
            html = result.stdout
            match = re.search(r'(?:About\s+)?([\d,]+)\s*(?:results|条结果)', html, re.IGNORECASE)
            if match:
                count = match.group(1).replace(",", "")
                print(f"  {label:25s} -> ~{count} pages indexed")
            else:
                # Try alternative pattern
                match2 = re.search(r'>([\d,]+)\s*<', html)
                if match2:
                    print(f"  {label:25s} -> ~{match2.group(1)} pages indexed")
                else:
                    print(f"  {label:25s} -> Unable to parse (may need CAPTCHA)")
        except Exception as e:
            print(f"  {label:25s} -> Error: {e}")

    print(f"\n[INFO] Note: Google may show CAPTCHA or rate-limit automated queries.")
    print(f"[INFO] For accurate data, use GSC API (run: python {sys.argv[0]} monitor)\n")


def print_setup_guide():
    """Print GSC API setup guide."""
    print(f"""
{'='*60}
  Google Search Console API - Setup Guide
{'='*60}

Method 1: GSC Dashboard (Easiest - No Coding Required)
────────────────────────────────────────────────────────
  1. Go to: https://search.google.com/search-console
  2. Select property: globetimezone.com
  3. Navigate: Indexing > Sitemaps
  4. Enter: https://globetimezone.com/sitemap.xml
  5. Click "Submit"

  ✅ This is the recommended method for first-time setup.


Method 2: API Access (For Automation/Monitoring)
────────────────────────────────────────────────────────
  Step 1: Create Google Cloud Project
    1. Go to: https://console.cloud.google.com/
    2. Create a new project (or use existing)
    3. Enable "Google Search Console API"
    4. Go to APIs & Services > Credentials
    5. Create Credentials > OAuth2 Client ID
       - Application type: Desktop App
       - Download JSON file

  Step 2: Get Access Token
    Option A - Using gcloud CLI:
      gcloud auth application-default login \\
        --scopes=https://www.googleapis.com/auth/webmasters.readonly

    Option B - Using Python:
      pip install google-auth-oauthlib
      # See: examples/get_token.py below

  Step 3: Set Environment Variable
    export GSC_ACCESS_TOKEN="your_access_token_here"
    python gsc_submit.py monitor

Method 3: Service Account (For Unattended/Server Use)
────────────────────────────────────────────────────────
  1. In GCP Console > Credentials > Create Credentials > Service Account
  2. Download JSON key
  3. Add service account email to GSC property:
     GSC Dashboard > Settings > Users and Permissions > Add User
  4. Save JSON to ~/.gsc_credentials.json
  5. Install: pip install google-auth google-api-python-client
  6. Run: python gsc_submit.py monitor

{'='*60}
  Quick Start (Manual Submission + Verify)
{'='*60}

  After submitting sitemap manually, verify with:

    # Check if sitemap is processed
    curl -s "https://www.google.com/search?q=site:globetimezone.com" | grep -o "About.*results"

  Or visit:
    https://search.google.com/search-console?resource_id=sc-domain:globetimezone.com

{'='*60}
""")


def main():
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <command>")
        print(f"")
        print(f"Commands:")
        print(f"  submit    Submit sitemap to GSC (requires API token)")
        print(f"  monitor   Show index coverage (requires API token)")
        print(f"  check     Check indexed pages via Google search (no API needed)")
        print(f"  setup     Show GSC API setup guide")
        print(f"")
        print(f"Examples:")
        print(f"  GSC_ACCESS_TOKEN=xxx python {sys.argv[0]} submit")
        print(f"  GSC_ACCESS_TOKEN=xxx python {sys.argv[0]} monitor")
        print(f"  python {sys.argv[0]} check")
        print(f"  python {sys.argv[0]} setup")
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "setup":
        print_setup_guide()
        sys.exit(0)

    if command == "check":
        check_indexed_via_search()
        sys.exit(0)

    # Commands below require API token
    token = load_access_token()
    if not token:
        sys.exit(1)

    if command == "submit":
        print(f"[INFO] Submitting sitemap: {SITEMAP_URL}")
        submit_sitemap(token)
        print(f"[INFO] Checking status...")
        get_sitemap_indexed_count(token)

    elif command == "monitor":
        print(f"[INFO] Fetching index coverage from GSC API...")
        get_sitemap_indexed_count(token)

    else:
        print(f"[ERROR] Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
