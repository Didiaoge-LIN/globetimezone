// 种子时区数据 - 填充 TZ_DATA KV
// 生产环境需要 tz-watcher 定期更新
const fs = require('fs');
const path = require('path');

const zones = {
  "America/New_York": [
    { offset: -18000, abbr: "EST", start: "2025-11-02T02:00:00-04:00" },
    { offset: -14400, abbr: "EDT", start: "2026-03-08T02:00:00-05:00" }
  ],
  "America/Chicago": [
    { offset: -21600, abbr: "CST", start: "2025-11-02T02:00:00-05:00" },
    { offset: -18000, abbr: "CDT", start: "2026-03-08T02:00:00-06:00" }
  ],
  "America/Los_Angeles": [
    { offset: -28800, abbr: "PST", start: "2025-11-02T02:00:00-07:00" },
    { offset: -25200, abbr: "PDT", start: "2026-03-08T02:00:00-08:00" }
  ],
  "America/Toronto": [
    { offset: -18000, abbr: "EST", start: "2025-11-02T02:00:00-04:00" },
    { offset: -14400, abbr: "EDT", start: "2026-03-08T02:00:00-05:00" }
  ],
  "Europe/London": [
    { offset: 0, abbr: "GMT", start: "2025-10-26T02:00:00+01:00" },
    { offset: 3600, abbr: "BST", start: "2026-03-29T01:00:00+00:00" }
  ],
  "Europe/Paris": [
    { offset: 3600, abbr: "CET", start: "2025-10-26T03:00:00+02:00" },
    { offset: 7200, abbr: "CEST", start: "2026-03-29T02:00:00+01:00" }
  ],
  "Asia/Shanghai": [
    { offset: 28800, abbr: "CST", start: "1991-09-15T02:00:00+08:00" }
  ],
  "Asia/Tokyo": [
    { offset: 32400, abbr: "JST", start: "1951-01-01T00:00:00+09:00" }
  ],
  "Asia/Seoul": [
    { offset: 32400, abbr: "KST", start: "1988-10-09T00:00:00+09:00" }
  ],
  "Asia/Singapore": [
    { offset: 28800, abbr: "SGT", start: "1982-01-01T00:00:00+08:00" }
  ],
  "Asia/Dubai": [
    { offset: 14400, abbr: "GST", start: "1920-01-01T00:00:00+04:00" }
  ],
  "Australia/Sydney": [
    { offset: 39600, abbr: "AEDT", start: "2025-10-05T02:00:00+10:00" },
    { offset: 36000, abbr: "AEST", start: "2026-04-05T03:00:00+11:00" }
  ],
  "UTC": [
    { offset: 0, abbr: "UTC", start: "1970-01-01T00:00:00Z" }
  ]
};

// 计算当前生效的偏移
function getCurrentOffset(transitions) {
  const now = new Date();
  let current = transitions[0];
  for (const t of transitions) {
    const startDate = new Date(t.start);
    if (startDate <= now) {
      current = t;
    }
  }
  return current;
}

const output = {
  generated_at: new Date().toISOString(),
  source: "tz-watcher-seed",
  updated: new Date().toISOString(),
  zones: {}
};

for (const [zone, transitions] of Object.entries(zones)) {
  output.zones[zone] = transitions;
}

const filePath = path.join(__dirname, '..', 'timezone-offsets.json');
fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
console.log(`Written ${Object.keys(zones).length} timezone entries to ${filePath}`);
console.log('Now run: npx wrangler kv key put --namespace-id=71c0cb3a54094834ab733f4537162fa0 "timezone-offsets.json" --path=timezone-offsets.json');
