// ===== GlobeTimeZone Saved Cities & Sync =====
// Save frequently used cities to localStorage with optional cloud sync

const SAVED_CITIES_KEY = 'gtz_saved_cities';

class SavedCitiesManager {
  constructor() {
    this.cities = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(SAVED_CITIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  save() {
    localStorage.setItem(SAVED_CITIES_KEY, JSON.stringify(this.cities));
    this.renderUI();
  }

  addCity(cityData) {
    // cityData: { name, tz, flag, country, offset }
    const existing = this.cities.find(c => c.tz === cityData.tz && c.name === cityData.name);
    if (existing) {
      showToast(cityData.name + ' is already saved!', 'error');
      return false;
    }

    if (this.cities.length >= 30) {
      showToast('Maximum 30 saved cities reached. Remove some first.', 'error');
      return false;
    }

    this.cities.unshift({
      ...cityData,
      savedAt: new Date().toISOString()
    });
    this.save();
    showToast(cityData.name + ' saved!', 'success');
    return true;
  }

  removeCity(tz, name) {
    this.cities = this.cities.filter(c => !(c.tz === tz && c.name === name));
    this.save();
    showToast(name + ' removed', 'default');
  }

  hasCity(tz, name) {
    return this.cities.some(c => c.tz === tz && c.name === name);
  }

  toggleCity(cityData) {
    if (this.hasCity(cityData.tz, cityData.name)) {
      this.removeCity(cityData.tz, cityData.name);
      return false;
    } else {
      this.addCity(cityData);
      return true;
    }
  }

  getCities() {
    return this.cities;
  }

  renderUI() {
    const container = document.getElementById('saved-cities-list');
    if (!container) return;

    if (this.cities.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px;color:var(--text-muted);">
          <div style="font-size:2.5rem;margin-bottom:12px;">🏙️</div>
          <p style="font-weight:500;">No saved cities yet</p>
          <p style="font-size:0.85rem;margin-top:4px;">Click the bookmark icon on any city clock to save it</p>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">
            Logged-in users can sync cities across devices
          </p>
        </div>
      `;
      return;
    }

    const now = new Date();
    container.innerHTML = this.cities.map((city, i) => {
      let timeStr, dateStr, offset;
      try {
        timeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: city.tz,
          hour: '2-digit', minute: '2-digit',
          hour12: false
        }).format(now);

        dateStr = new Intl.DateTimeFormat('en-US', {
          timeZone: city.tz,
          weekday: 'short', month: 'short', day: 'numeric'
        }).format(now);

        offset = getUtcOffsetString(city.tz);
      } catch {
        timeStr = '--:--';
        dateStr = 'Unknown';
        offset = 'UTC';
      }

      const hour = parseInt(timeStr.split(':')[0]);
      const isWorking = window.workSchedule && workSchedule.isWorkingHour(city.tz, hour) || false;

      return `
        <div class="saved-city-item" onclick="addTimezoneCardWithTz('${city.tz}', '${city.name}', '${city.flag}'); updateAllTimezones();">
          <div class="saved-city-main">
            <span class="saved-city-flag">${city.flag}</span>
            <div class="saved-city-info">
              <div class="saved-city-name">${city.name}</div>
              <div class="saved-city-country">${city.country || ''} · ${offset}</div>
            </div>
          </div>
          <div class="saved-city-time">
            <div class="saved-city-clock">${timeStr}</div>
            <div class="saved-city-date">${dateStr}</div>
          </div>
          <button class="saved-city-remove" onclick="event.stopPropagation(); savedCities.removeCity('${city.tz}', '${city.name}')" title="Remove">
            &times;
          </button>
        </div>
      `;
    }).join('');

    // Update count
    const countEl = document.getElementById('saved-cities-count');
    if (countEl) {
      countEl.textContent = this.cities.length;
    }
  }

  // Sync functions (Firebase stubs for future)
  async syncToCloud() {
    if (!window.userAuth || !window.userAuth.isLoggedIn()) {
      showToast('Login first to sync cities', 'error');
      return;
    }
    // Firebase sync placeholder
    showToast('Cloud sync coming soon! (Firebase integration pending)', 'default');
  }

  async loadFromCloud() {
    if (!window.userAuth || !window.userAuth.isLoggedIn()) {
      showToast('Login first to load cities', 'error');
      return;
    }
    showToast('Cloud sync coming soon!', 'default');
  }
}

// Initialize
const savedCities = new SavedCitiesManager();

// Hook into existing addCityToClocks to also save
const originalAddCityToClocks = window.addCityToClocks;
window.addCityToClocks = function(name, tz, flag, country) {
  originalAddCityToClocks(name, tz, flag, country);
  
  // Also save to saved cities
  const cityInfo = ALL_CITIES.find(c => c.tz === tz && c.name === name);
  if (cityInfo) {
    savedCities.addCity({
      name: cityInfo.name,
      tz: cityInfo.tz,
      flag: cityInfo.flag,
      country: cityInfo.country,
      offset: cityInfo.offset
    });
  }
};

// Export
window.savedCities = savedCities;
