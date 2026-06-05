#!/usr/bin/env python3
"""
Upload Gateway Worker to Cloudflare using direct API (bypassing wrangler POST bug)
"""
import os, json, time, uuid, urllib.request, urllib.error, sys

ACCOUNT_ID = "b73e041dfa2e834c1cd23d11f1971cd5"
SCRIPT_NAME = "globetimezone-gateway-production"

# Read token from .env file directly
API_TOKEN = ""
try:
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("CLOUDFLARE_API_TOKEN="):
                API_TOKEN = line.strip().split("=", 1)[1]
                break
except:
    pass

if not API_TOKEN:
    # Fallback: try env var
    API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN") or os.environ.get("CLOUDFLARE_TOKEN") or ""

if not API_TOKEN:
    print("ERROR: CLOUDFLARE_API_TOKEN not set")
    sys.exit(1)

# Read bundled script
script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist-gateway", "index.js")
if not os.path.exists(script_path):
    print(f"ERROR: {script_path} not found. Run: npx wrangler deploy --dry-run --outdir=./dist-gateway workers/gateway/index.ts")
    sys.exit(1)

with open(script_path, "r", encoding="utf-8") as f:
    script_content = f.read()
    print("Script loaded: {} chars ({:.1f} KB)".format(len(script_content), len(script_content.encode())/1024))

# Metadata
metadata = {
    "main_module": "index.js",
    "bindings": [
        {"type": "kv_namespace", "name": "API_KEYS", "namespace_id": "d89a7aa6340f4f3790495e119a94acf7"},
        {"type": "kv_namespace", "name": "REMINDERS", "namespace_id": "c29503afef6b4dee987a85ae9cb251d7"},
        {"type": "kv_namespace", "name": "CALIBRATION", "namespace_id": "5a026ac173d84ca5836d47357cd4df65"},
        {"type": "kv_namespace", "name": "PREFERENCES", "namespace_id": "9329056d8ea94e6d9d1f9337fc2bba69"},
        {"type": "kv_namespace", "name": "RATELIMIT", "namespace_id": "47222a040de94105be399a03472bdd43"},
        {"type": "kv_namespace", "name": "SHARE_DATA", "namespace_id": "0ab9fbf6807b45649b8ecd5c3e40c1ed"},
        {"type": "durable_object_namespace", "name": "CIRCUIT_BREAKER", "class_name": "CircuitBreakerDO"},
    ],
    "migrations": [
        {"tag": "v1", "new_classes": ["CircuitBreakerDO"]}
    ],
    "vars": {
        "ENVIRONMENT": "production",
        "TIMEZONE_API_URL": "https://globetimezone-timezone-api.didiaoge-2026.workers.dev",
        "REMINDER_API_URL": "https://globetimezone-reminder-api.didiaoge-2026.workers.dev",
        "NTP_CALIBRATOR_URL": "https://globetimezone-ntp-calibrator.didiaoge-2026.workers.dev",
        "TIME_SIGNER_URL": "https://globetimezone-time-signer.didiaoge-2026.workers.dev",
        "CONFIG_URL": "https://globetimezone-config.didiaoge-2026.workers.dev",
        "REFERRAL_API_URL": "https://globetimezone-referral-api-production.didiaoge-2026.workers.dev",
    }
}

BOUNDARY = f"----CloudflareUpload{int(time.time())}{uuid.uuid4().int & 0xfffff}"
CRLF = b"\r\n"

def build_multipart():
    parts = []
    # metadata part
    parts.append(f"--{BOUNDARY}".encode())
    parts.append(b'Content-Disposition: form-data; name="metadata"')
    parts.append(b"Content-Type: application/json")
    parts.append(b"")
    parts.append(json.dumps(metadata).encode())
    # script part
    parts.append(f"--{BOUNDARY}".encode())
    parts.append(b'Content-Disposition: form-data; name="index.js"; filename="index.js"')
    parts.append(b"Content-Type: application/javascript; charset=utf-8")
    parts.append(b"")
    parts.append(script_content.encode("utf-8"))
    # close
    parts.append(f"--{BOUNDARY}--".encode())
    parts.append(b"")
    return CRLF.join(parts)

body = build_multipart()
print(f"Multipart body size: {len(body)} bytes ({len(body)/1024:.1f} KB)")

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}"
print(f"PUT {url}")

req = urllib.request.Request(
    url,
    data=body,
    method="PUT",
    headers={
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": f"multipart/form-data; boundary={BOUNDARY}",
        "Content-Length": str(len(body)),
    }
)

try:
    with urllib.request.urlopen(req, timeout=180) as resp:
        status = resp.status
        text = resp.read().decode("utf-8")
except urllib.error.HTTPError as e:
    status = e.code
    text = e.read().decode("utf-8")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

print(f"\nHTTP {status}")
try:
    data = json.loads(text)
    print(json.dumps(data, indent=2)[:2000])
    if data.get("success"):
        print("\n✅ Deploy successful!")
        sys.exit(0)
    else:
        print("\n❌ Deploy failed!")
        sys.exit(1)
except Exception:
    print(text[:2000])
    sys.exit(1)
