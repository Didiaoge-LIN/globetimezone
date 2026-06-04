// ===== GlobeTimeZone.com - Main JavaScript =====

// Full timezone data
const TIMEZONES = [
  { value: 'Pacific/Midway', label: 'Midway Island (UTC-11)', offset: -11, region: 'Pacific' },
  { value: 'Pacific/Honolulu', label: 'Hawaii - Honolulu (UTC-10)', offset: -10, region: 'Americas' },
  { value: 'America/Anchorage', label: 'Alaska - Anchorage (UTC-9)', offset: -9, region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'US Pacific - Los Angeles (UTC-8)', offset: -8, region: 'Americas' },
  { value: 'America/Denver', label: 'US Mountain - Denver (UTC-7)', offset: -7, region: 'Americas' },
  { value: 'America/Chicago', label: 'US Central - Chicago (UTC-6)', offset: -6, region: 'Americas' },
  { value: 'America/New_York', label: 'US Eastern - New York (UTC-5)', offset: -5, region: 'Americas' },
  { value: 'America/Caracas', label: 'Venezuela - Caracas (UTC-4:30)', offset: -4.5, region: 'Americas' },
  { value: 'America/Halifax', label: 'Canada Atlantic - Halifax (UTC-4)', offset: -4, region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'Brazil - São Paulo (UTC-3)', offset: -3, region: 'Americas' },
  { value: 'Atlantic/South_Georgia', label: 'South Georgia (UTC-2)', offset: -2, region: 'Atlantic' },
  { value: 'Atlantic/Azores', label: 'Azores (UTC-1)', offset: -1, region: 'Atlantic' },
  { value: 'UTC', label: 'UTC / GMT (UTC+0)', offset: 0, region: 'Europe' },
  { value: 'Europe/London', label: 'UK - London (UTC+0/+1)', offset: 0, region: 'Europe' },
  { value: 'Europe/Paris', label: 'France - Paris (UTC+1/+2)', offset: 1, region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Germany - Berlin (UTC+1/+2)', offset: 1, region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Russia - Moscow (UTC+3)', offset: 3, region: 'Europe' },
  { value: 'Asia/Dubai', label: 'UAE - Dubai (UTC+4)', offset: 4, region: 'Asia' },
  { value: 'Asia/Karachi', label: 'Pakistan - Karachi (UTC+5)', offset: 5, region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'India - Mumbai/Delhi (UTC+5:30)', offset: 5.5, region: 'Asia' },
  { value: 'Asia/Dhaka', label: 'Bangladesh - Dhaka (UTC+6)', offset: 6, region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Thailand - Bangkok (UTC+7)', offset: 7, region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'China - Shanghai/Beijing (UTC+8)', offset: 8, region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)', offset: 8, region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)', offset: 8, region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Japan - Tokyo (UTC+9)', offset: 9, region: 'Asia' },
  { value: 'Asia/Seoul', label: 'South Korea - Seoul (UTC+9)', offset: 9, region: 'Asia' },
  { value: 'Australia/Sydney', label: 'Australia - Sydney (UTC+10/+11)', offset: 10, region: 'Pacific' },
  { value: 'Pacific/Auckland', label: 'New Zealand - Auckland (UTC+12/+13)', offset: 12, region: 'Pacific' },
];

// World clocks configuration
const WORLD_CLOCKS = [
  { city: 'New York', tz: 'America/New_York', flag: '🇺🇸', country: 'USA' },
  { city: 'London', tz: 'Europe/London', flag: '🇬🇧', country: 'UK' },
  { city: 'Paris', tz: 'Europe/Paris', flag: '🇫🇷', country: 'France' },
  { city: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪', country: 'UAE' },
  { city: 'Mumbai', tz: 'Asia/Kolkata', flag: '🇮🇳', country: 'India' },
  { city: 'Beijing', tz: 'Asia/Shanghai', flag: '🇨🇳', country: 'China' },
  { city: 'Singapore', tz: 'Asia/Singapore', flag: '🇸🇬', country: 'Singapore' },
  { city: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵', country: 'Japan' },
  { city: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺', country: 'Australia' },
  { city: 'Los Angeles', tz: 'America/Los_Angeles', flag: '🇺🇸', country: 'USA' },
  { city: 'Chicago', tz: 'America/Chicago', flag: '🇺🇸', country: 'USA' },
  { city: 'São Paulo', tz: 'America/Sao_Paulo', flag: '🇧🇷', country: 'Brazil' },
];

// Populate timezone selects
function populateTzSelect(selectId, selectedTz) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  TIMEZONES.forEach(tz => {
    const opt = document.createElement('option');
    opt.value = tz.value;
    opt.textContent = tz.label;
    if (tz.value === selectedTz) opt.selected = true;
    sel.appendChild(opt);
  });
}

// Convert time
function convertTime() {
  const fromTz = document.getElementById('from-tz')?.value;
  const toTz = document.getElementById('to-tz')?.value;
  const timeInput = document.getElementById('time-input')?.value;
  const dateInput = document.getElementById('date-input')?.value;

  if (!fromTz || !toTz || !timeInput || !dateInput) return;

  try {
    const [hours, minutes] = timeInput.split(':').map(Number);
    const [year, month, day] = dateInput.split('-').map(Number);

    // Create date in source timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: fromTz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });

    // Build the date string
    const inputDateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`;

    // Use Intl to get UTC offset for source timezone
    const tzDate = new Date(`${inputDateStr}${getOffset(fromTz)}`);

    // Format in target timezone
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: toTz,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      weekday: 'long'
    });

    const timeOnlyFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: toTz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const resultEl = document.getElementById('result-time');
    const resultDateEl = document.getElementById('result-date');

    if (resultEl) resultEl.textContent = timeOnlyFormatter.format(tzDate);
    if (resultDateEl) resultDateEl.textContent = targetFormatter.format(tzDate);

    document.getElementById('result-box')?.classList.remove('hidden');
  } catch(e) {
    console.error('Conversion error:', e);
  }
}

function getOffset(tz) {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const diff = (utc - local) / 60000; // in minutes
  const absMin = Math.abs(diff);
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  const sign = diff > 0 ? '-' : '+';
  return `${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// Swap timezones
function swapTimezones() {
  const fromSel = document.getElementById('from-tz');
  const toSel = document.getElementById('to-tz');
  if (fromSel && toSel) {
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
    convertTime();
  }
}

// World clocks
function updateWorldClocks() {
  const container = document.getElementById('world-clocks');
  if (!container) return;

  const now = new Date();

  WORLD_CLOCKS.forEach(c => {
    const id = `clock-${c.city.replace(/\s/g,'-').toLowerCase()}`;
    let el = document.getElementById(id);

    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: c.tz,
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).format(now);

    const dateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: c.tz,
      weekday: 'short', month: 'short', day: 'numeric'
    }).format(now);

    // Get UTC offset
    const offset = getUtcOffset(c.tz);

    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'clock-card';
      container.appendChild(el);
    }

    el.innerHTML = `
      <div class="clock-flag">${c.flag}</div>
      <div class="clock-city">${c.city}</div>
      <div class="clock-time">${timeStr}</div>
      <div class="clock-date">${dateStr}</div>
      <div class="clock-offset">${offset}</div>
    `;
  });
}

function getUtcOffset(tz) {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const diff = (tzDate - utcDate) / 3600000;
  const sign = diff >= 0 ? '+' : '-';
  const absDiff = Math.abs(diff);
  const h = Math.floor(absDiff);
  const m = Math.round((absDiff - h) * 60);
  return `UTC${sign}${h}${m ? ':'+String(m).padStart(2,'0') : ''}`;
}

// Set default date/time
function setDefaultDateTime() {
  const now = new Date();
  const dateInput = document.getElementById('date-input');
  const timeInput = document.getElementById('time-input');

  if (dateInput) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    dateInput.value = `${y}-${m}-${d}`;
  }

  if (timeInput) {
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${h}:${min}`;
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  populateTzSelect('from-tz', 'Asia/Shanghai');
  populateTzSelect('to-tz', 'America/New_York');
  setDefaultDateTime();
  updateWorldClocks();
  setInterval(updateWorldClocks, 1000);

  // Auto convert on change
  ['from-tz', 'to-tz', 'time-input', 'date-input'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', convertTime);
    document.getElementById(id)?.addEventListener('input', convertTime);
  });

  convertTime();
});
