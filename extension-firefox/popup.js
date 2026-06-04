// GlobeTimeZone Firefox Extension - Popup Script
'use strict';

const DEFAULT_CITIES = [
  { name: 'New York', tz: 'America/New_York', flag: '\u{1F1FA}\u{1F1F8}' },
  { name: 'London', tz: 'Europe/London', flag: '\u{1F1EC}\u{1F1E7}' },
  { name: 'Beijing', tz: 'Asia/Shanghai', flag: '\u{1F1E8}\u{1F1F3}' },
  { name: 'Tokyo', tz: 'Asia/Tokyo', flag: '\u{1F1EF}\u{1F1F5}' }
];

const CITY_MAP = {
  'America/New_York':      { name: 'New York',      flag: '\u{1F1FA}\u{1F1F8}' },
  'America/Los_Angeles':   { name: 'Los Angeles',    flag: '\u{1F1FA}\u{1F1F8}' },
  'America/Chicago':       { name: 'Chicago',        flag: '\u{1F1FA}\u{1F1F8}' },
  'America/Toronto':       { name: 'Toronto',        flag: '\u{1F1E8}\u{1F1E6}' },
  'America/Sao_Paulo':     { name: 'Sao Paulo',      flag: '\u{1F1E7}\u{1F1F7}' },
  'Europe/London':         { name: 'London',         flag: '\u{1F1EC}\u{1F1E7}' },
  'Europe/Paris':          { name: 'Paris',          flag: '\u{1F1EB}\u{1F1F7}' },
  'Europe/Berlin':         { name: 'Berlin',         flag: '\u{1F1E9}\u{1F1EA}' },
  'Europe/Moscow':         { name: 'Moscow',         flag: '\u{1F1F7}\u{1F1FA}' },
  'Asia/Shanghai':         { name: 'Beijing',        flag: '\u{1F1E8}\u{1F1F3}' },
  'Asia/Tokyo':            { name: 'Tokyo',          flag: '\u{1F1EF}\u{1F1F5}' },
  'Asia/Seoul':            { name: 'Seoul',          flag: '\u{1F1F0}\u{1F1F7}' },
  'Asia/Singapore':        { name: 'Singapore',      flag: '\u{1F1F8}\u{1F1EC}' },
  'Asia/Dubai':            { name: 'Dubai',          flag: '\u{1F1E6}\u{1F1EA}' },
  'Australia/Sydney':      { name: 'Sydney',         flag: '\u{1F1E6}\u{1F1FA}' },
  'Asia/Kolkata':          { name: 'Mumbai',         flag: '\u{1F1EE}\u{1F1F3}' }
};

let cities = [];
let timer = null;

function getUtcOffset(tz) {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const diff = (tzDate - utcDate) / 3600000;
  const sign = diff >= 0 ? '+' : '-';
  return 'UTC' + sign + Math.abs(diff);
}

function formatTime(tz) {
  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
}

function formatDate(tz) {
  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(now);
}

function formatTzShort(tz) {
  try {
    const now = new Date();
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short'
    }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || tz;
  } catch(e) {
    return tz;
  }
}

function renderClocks() {
  const container = document.getElementById('clocks-container');
  if (!container) return;

  container.innerHTML = cities.map((tz, index) => {
    const info = CITY_MAP[tz] || { name: tz, flag: '\u{1F310}' };
    return `
      <div class="clock-card">
        <div class="clock-flag">${info.flag}</div>
        <div class="clock-info">
          <div class="clock-city">${info.name}</div>
          <div class="clock-tz">${formatTzShort(tz)} (${getUtcOffset(tz)})</div>
        </div>
        <div style="text-align:right;">
          <div class="clock-time">${formatTime(tz)}</div>
          <div class="clock-date">${formatDate(tz)}</div>
        </div>
        <button class="remove-btn" data-index="${index}" title="Remove city">&times;</button>
      </div>
    `;
  }).join('');

  // Add remove handlers
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeCity(index);
    });
  });
}

function removeCity(index) {
  cities.splice(index, 1);
  saveCities();
  renderClocks();
}

function addCity(tz) {
  if (!tz || cities.includes(tz)) return;

  if (cities.length >= 8) {
    // Replace the last city
    cities[cities.length - 1] = tz;
  } else {
    cities.push(tz);
  }
  saveCities();
  renderClocks();
}

async function saveCities() {
  try {
    await browser.storage.local.set({ 'gtz_cities': cities });
  } catch(e) {
    // Fallback: ignore storage errors
  }
}

async function loadCities() {
  try {
    const result = await browser.storage.local.get('gtz_cities');
    if (result.gtz_cities && result.gtz_cities.length > 0) {
      cities = result.gtz_cities;
    } else {
      cities = DEFAULT_CITIES.map(c => c.tz);
    }
  } catch(e) {
    cities = DEFAULT_CITIES.map(c => c.tz);
  }
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await loadCities();
  renderClocks();

  // Start the clock
  timer = setInterval(renderClocks, 1000);

  // Add city button
  document.getElementById('add-btn').addEventListener('click', () => {
    const select = document.getElementById('city-select');
    addCity(select.value);
    select.value = '';
  });
});

// Cleanup
window.addEventListener('unload', () => {
  if (timer) clearInterval(timer);
});
