// GlobeTimeZone Social Bot — Content Calendar & Auto-Publisher
// Run: node scripts/twitter-bot.js [--publish] [--dry-run] [--platform twitter|linkedin|all] [--json] [--from-calendar] [--list-calendar] [--date YYYY-MM-DD]
//
// Modes:
//   (default)         Generate a daily timezone comparison post
//   --from-calendar   Publish from content-calendar.json based on today's date
//   --list-calendar   List all scheduled posts in the content calendar
//   --date            Override date for --from-calendar (e.g. 2026-06-02)
//
// Options:
//   --publish    Actually publish to configured platforms
//   --dry-run    Simulate publishing without sending
//   --platform   Target platform: twitter, linkedin, or all (default: all)
//   --json       Output post as JSON at the end
//
// Credentials: Set in .env file at project root (see .env.example)

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Load .env ──────────────────────────────────────────────
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.env.local')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

// ── Config ─────────────────────────────────────────────────
const SITE_URL = process.env.SITE_URL || 'https://globetimezone.com';
const OUTPUT_FILE = path.join(__dirname, '..', 'social-posts.json');
const CALENDAR_FILE = path.join(__dirname, '..', 'content-calendar.json');
const DRY_RUN = process.argv.includes('--dry-run');
const DO_PUBLISH = process.argv.includes('--publish');
const FROM_CALENDAR = process.argv.includes('--from-calendar');
const LIST_CALENDAR = process.argv.includes('--list-calendar');

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  return (idx !== -1 && process.argv[idx + 1]) ? process.argv[idx + 1] : null;
}

function getTargetPlatforms() {
  const p = getArgValue('--platform');
  if (p) {
    const pl = p.toLowerCase();
    if (pl === 'twitter' || pl === 'linkedin') return [pl];
    if (pl === 'all') return ['twitter', 'linkedin'];
  }
  return ['twitter', 'linkedin']; // default
}
const TARGET_PLATFORMS = getTargetPlatforms();

function getTodayStr() {
  const d = getArgValue('--date');
  if (d) return d;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ── City configurations for daily cards ────────────────────
const CITY_GROUPS = [
  {
    name: 'global',
    cities: [
      { name: 'San Francisco', tz: 'America/Los_Angeles', emoji: '🌉' },
      { name: 'London', tz: 'Europe/London', emoji: '🇬🇧' },
      { name: 'Tokyo', tz: 'Asia/Tokyo', emoji: '🗼' },
      { name: 'Dubai', tz: 'Asia/Dubai', emoji: '🇦🇪' }
    ]
  },
  {
    name: 'us-eu',
    cities: [
      { name: 'New York', tz: 'America/New_York', emoji: '🗽' },
      { name: 'San Francisco', tz: 'America/Los_Angeles', emoji: '🌉' },
      { name: 'London', tz: 'Europe/London', emoji: '🇬🇧' },
      { name: 'Berlin', tz: 'Europe/Berlin', emoji: '🇩🇪' }
    ]
  },
  {
    name: 'apac',
    cities: [
      { name: 'Beijing', tz: 'Asia/Shanghai', emoji: '🇨🇳' },
      { name: 'Tokyo', tz: 'Asia/Tokyo', emoji: '🗼' },
      { name: 'Singapore', tz: 'Asia/Singapore', emoji: '🇸🇬' },
      { name: 'Sydney', tz: 'Australia/Sydney', emoji: '🇦🇺' }
    ]
  }
];

// ── Time helpers ───────────────────────────────────────────
function getTime(ianaTimezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return formatter.format(new Date());
  } catch {
    return '--:--';
  }
}

// ── Post generation ────────────────────────────────────────
function generatePost(groupIndex) {
  const group = CITY_GROUPS[groupIndex % CITY_GROUPS.length];
  const lines = group.cities.map(c =>
    `${c.emoji} ${c.name} ${getTime(c.tz)}`
  );

  const post = {
    text: `🕐 What time is it for your team right now?\n\n${lines.join(' | ')}\n\nSee all time zones instantly → ${SITE_URL}`,
    timestamp: new Date().toISOString(),
    group: group.name
  };

  return post;
}

// ── Twitter publisher (OAuth 1.0a via twitter-api-v2) ─────
async function publishToTwitter(text) {
  const { TwitterApi } = require('twitter-api-v2');

  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.log('  ⚠️  Twitter: Missing credentials. Set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET in .env');
    return { success: false, reason: 'missing_credentials' };
  }

  if (DRY_RUN) {
    console.log('  🔹 Twitter: [DRY RUN] Would post the following tweet:');
    console.log(`  🔹 "${text.substring(0, 80)}..."`);
    return { success: true, dry_run: true };
  }

  try {
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    const result = await client.v2.tweet(text);
    console.log(`  ✅ Twitter: Published! Tweet ID: ${result.data.id}`);
    return { success: true, tweet_id: result.data.id };
  } catch (err) {
    console.error(`  ❌ Twitter: Publish failed — ${err.message}`);
    if (err.code === 401) console.error('     → Check your API credentials in .env');
    if (err.code === 403) console.error('     → Your app may not have write permissions');
    return { success: false, error: err.message };
  }
}

// ── LinkedIn publisher (OAuth 2.0, raw HTTPS) ─────────────
function publishToLinkedIn(text) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;

  if (!accessToken) {
    console.log('  ⚠️  LinkedIn: Missing credentials. Set LINKEDIN_ACCESS_TOKEN in .env');
    return Promise.resolve({ success: false, reason: 'missing_credentials' });
  }

  if (DRY_RUN) {
    console.log('  🔹 LinkedIn: [DRY RUN] Would post the following update:');
    console.log(`  🔹 "${text.substring(0, 80)}..."`);
    return Promise.resolve({ success: true, dry_run: true });
  }

  // If personId is not set, try to fetch it first
  const doPost = (pid) => {
    return new Promise((resolve) => {
      const body = JSON.stringify({
        author: `urn:li:person:${pid}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: text },
            shareMediaCategory: 'ARTICLE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      });

      const options = {
        hostname: 'api.linkedin.com',
        path: '/v2/ugcPosts',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 201) {
            console.log('  ✅ LinkedIn: Published!');
            resolve({ success: true });
          } else {
            console.error(`  ❌ LinkedIn: Publish failed — HTTP ${res.statusCode}`);
            console.error(`     ${data.substring(0, 200)}`);
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (err) => {
        console.error(`  ❌ LinkedIn: Network error — ${err.message}`);
        resolve({ success: false, error: err.message });
      });

      req.write(body);
      req.end();
    });
  };

  if (personId) {
    return doPost(personId);
  }

  // Fetch person ID from LinkedIn
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.linkedin.com',
      path: '/v2/userinfo',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const info = JSON.parse(data);
            const pid = info.sub;
            console.log(`  🔹 LinkedIn: Auto-detected person ID: ${pid}`);
            doPost(pid).then(resolve);
          } catch {
            console.error('  ❌ LinkedIn: Could not parse user info. Set LINKEDIN_PERSON_ID in .env');
            resolve({ success: false, error: 'parse_error' });
          }
        } else {
          console.error(`  ❌ LinkedIn: Could not fetch user info — HTTP ${res.statusCode}`);
          console.error('     Set LINKEDIN_PERSON_ID in .env or check your access token');
          resolve({ success: false, error: `HTTP ${res.statusCode}` });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`  ❌ LinkedIn: Network error — ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.end();
  });
}

// ── Calendar helpers ───────────────────────────────────────
function loadCalendar() {
  try {
    return JSON.parse(fs.readFileSync(CALENDAR_FILE, 'utf-8'));
  } catch {
    console.error(`Could not load ${CALENDAR_FILE}`);
    return null;
  }
}

function getTodayPosts(calendar) {
  const today = getTodayStr();
  return calendar.posts.filter(p => p.date === today);
}

function listCalendar(calendar) {
  console.log('=== Content Calendar ===\n');
  console.log(`Total posts: ${calendar.posts.length}`);
  console.log(`Platforms: ${calendar.meta.platforms.join(', ')}`);
  console.log(`Schedule: ${calendar.meta.schedule}`);
  console.log(`Start date: ${calendar.meta.startDate}`);
  console.log(`Publish time: ${calendar.meta.publishTime} (CST)\n`);
  console.log('ID  | Date       | Day       | Category    | Topic');
  console.log('----|------------|-----------|-------------|-------');
  for (const post of calendar.posts) {
    console.log(`${String(post.id).padStart(2)}  | ${post.date} | ${post.dayName.padEnd(9)} | ${(post.category || '').padEnd(11)} | ${post.topic}`);
  }
}

// ── History helpers ────────────────────────────────────────
function loadHistory() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  } catch {}
  return [];
}

function saveHistory(history) {
  if (history.length > 90) history = history.slice(-90);
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(history, null, 2));
    console.log(`\nSaved to ${OUTPUT_FILE} (${history.length} posts in history)`);
  } catch (e) {
    console.error(`Could not save: ${e.message}`);
  }
}

function isAlreadyPublished(history, postId, platform) {
  return history.some(h => h.calendarPostId === postId && h.platform === platform);
}

// ── Calendar mode ──────────────────────────────────────────
async function runCalendarMode() {
  const calendar = loadCalendar();
  if (!calendar) return;

  const todayPosts = getTodayPosts(calendar);

  if (todayPosts.length === 0) {
    console.log(`No posts scheduled for ${getTodayStr()}.`);
    console.log(`Use --list-calendar to see all scheduled posts.`);
    return;
  }

  const history = loadHistory();
  const results = [];

  for (const post of todayPosts) {
    console.log(`\n=== Post #${post.id} | ${post.topic} (${post.dayName} W${post.week}) ===`);

    for (const platform of TARGET_PLATFORMS) {
      if (isAlreadyPublished(history, post.id, platform)) {
        console.log(`  ${platform === 'twitter' ? 'Twitter' : 'LinkedIn'}: Already published, skipping.`);
        continue;
      }

      const content = post[platform];
      if (!content) {
        console.log(`  ${platform}: No content for this platform, skipping.`);
        continue;
      }

      let text = content.text;
      // Append hashtags for Twitter
      if (platform === 'twitter' && content.hashtags && content.hashtags.length) {
        text += '\n\n' + content.hashtags.map(t => `#${t}`).join(' ');
      }

      console.log(`\n  [${platform.toUpperCase()}]`);
      console.log(`  ${text.split('\n').join('\n  ')}`);
      console.log(`  Characters: ${text.length}`);

      if (DO_PUBLISH) {
        if (DRY_RUN) console.log('  [DRY RUN] Would publish above content.\n');

        let result;
        if (platform === 'twitter') {
          result = await publishToTwitter(text);
        } else {
          result = await publishToLinkedIn(text);
        }

        results.push({ postId: post.id, platform, result });

        if (result.success && !result.dry_run) {
          history.push({
            calendarPostId: post.id,
            platform,
            text: text.substring(0, 200),
            timestamp: new Date().toISOString(),
            topic: post.topic,
            category: post.category
          });
          saveHistory(history);
        }
      } else {
        console.log(`  (not published — use --publish to send)`);
      }
    }
  }

  // Summary
  if (DO_PUBLISH) {
    console.log('\n=== Publish Summary ===');
    for (const r of results) {
      const icon = r.result.success ? 'OK' : 'FAIL';
      console.log(`  [${icon}] Post #${r.postId} → ${r.platform}: ${r.result.error || r.result.reason || 'success'}`);
    }
    if (DRY_RUN) console.log('\n  (dry run — no actual posts sent)');
  }
}

// ── Daily timezone mode ────────────────────────────────────
async function runDailyMode() {
  // Pick a city group that rotates by day
  const groupIndex = Math.floor(Date.now() / 86400000) % CITY_GROUPS.length;
  const todayPost = generatePost(groupIndex);

  console.log('=== Today\'s Post ===');
  console.log(`Group: ${todayPost.group}`);
  console.log(`Timestamp: ${todayPost.timestamp}`);
  console.log(`\n${todayPost.text}`);
  console.log(`\nCharacters: ${todayPost.text.length}`);

  // Save to file for history
  const history = loadHistory();
  history.push(todayPost);
  saveHistory(history);

  // Publish
  if (DO_PUBLISH) {
    console.log('\n=== Publishing ===');
    if (DRY_RUN) console.log('DRY RUN MODE — no actual posts will be sent\n');

    const results = {};

    if (TARGET_PLATFORMS.includes('twitter')) {
      console.log('Twitter:');
      results.twitter = await publishToTwitter(todayPost.text);
    }

    if (TARGET_PLATFORMS.includes('linkedin')) {
      console.log('LinkedIn:');
      results.linkedin = await publishToLinkedIn(todayPost.text);
    }

    // Summary
    const published = Object.entries(results).filter(([, r]) => r.success).map(([k]) => k);
    const failed = Object.entries(results).filter(([, r]) => !r.success).map(([k]) => k);
    console.log('\n=== Publish Summary ===');
    if (published.length) console.log(`Published to: ${published.join(', ')}`);
    if (failed.length) console.log(`Failed: ${failed.join(', ')}`);
    if (DRY_RUN && published.length) console.log('   (dry run — no actual posts sent)');
  } else {
    console.log('\nTip: Use --publish to actually send to social platforms.');
    console.log('   Use --dry-run --publish to test without sending.');
  }

  // Output for automation integration
  if (process.argv.includes('--json')) {
    console.log('\n---JSON_OUTPUT---');
    console.log(JSON.stringify(todayPost));
  }
}

// ── Entry point ────────────────────────────────────────────
async function main() {
  if (LIST_CALENDAR) {
    const calendar = loadCalendar();
    if (calendar) listCalendar(calendar);
    return;
  }

  if (FROM_CALENDAR) {
    await runCalendarMode();
    return;
  }

  await runDailyMode();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
