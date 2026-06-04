/**
 * preference-service.js — Enhanced user preference service
 *
 * Converted from src/services/preference-service.ts — Reviewed by FE
 * Features: localStorage persistence, usage pattern learning, cloud sync
 */
(function (global) {
  'use strict';

  /**
   * @constructor
   */
  function PreferenceService() {
    this.storageKey = 'gtz_user_prefs';
  }

  /**
   * Get stored preferences
   * @returns {Object|null}
   */
  PreferenceService.prototype.get = function () {
    try {
      var raw = localStorage.getItem(this.storageKey);
      if (!raw) return this._getDefaults();
      var prefs = JSON.parse(raw);
      return this._validate(prefs);
    } catch (e) {
      console.warn('[preference-service] Failed to get preferences:', e);
      return this._getDefaults();
    }
  };

  /**
   * Save preferences to localStorage
   * Also triggers pattern learning and optional cloud sync
   * @param {Object} prefs - UserPreference object
   */
  PreferenceService.prototype.save = function (prefs) {
    try {
      var validated = this._validate(prefs);
      localStorage.setItem(this.storageKey, JSON.stringify(validated));
      this._learnPatterns(validated);
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this._syncToCloud(validated);
      }
    } catch (e) {
      console.warn('[preference-service] Failed to save preferences:', e);
    }
  };

  /**
   * Learn usage patterns from current session
   */
  PreferenceService.prototype._learnPatterns = function (prefs) {
    var now = new Date();
    var hour = now.getHours();
    var day = now.getDay();

    if (!prefs.learnedPatterns) {
      prefs.learnedPatterns = [];
    }

    var existing = null;
    for (var i = 0; i < prefs.learnedPatterns.length; i++) {
      if (prefs.learnedPatterns[i].dayOfWeek === day) {
        existing = prefs.learnedPatterns[i];
        break;
      }
    }

    if (existing) {
      if (existing.activeHours.indexOf(hour) === -1) {
        existing.activeHours.push(hour);
        existing.activeHours.sort(function (a, b) { return a - b; });
      }
    } else {
      prefs.learnedPatterns.push({
        dayOfWeek: day,
        activeHours: [hour]
      });
    }

    // Persist updated patterns
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(prefs));
    } catch (e) { /* silent */ }
  };

  /**
   * Sync preferences to cloud API
   */
  PreferenceService.prototype._syncToCloud = function (prefs) {
    try {
      fetch('/api/v1/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      }).catch(function () {
        // Cloud sync is best-effort, never block local operations
      });
    } catch (e) { /* best-effort */ }
  };

  /**
   * Get best meeting time based on learned patterns
   * @param {string} timezone
   * @returns {number[]} Suggested hours
   */
  PreferenceService.prototype.suggestMeetingTimes = function (timezone) {
    var prefs = this.get();
    if (!prefs || !prefs.learnedPatterns || prefs.learnedPatterns.length === 0) {
      return [9, 10, 14, 15, 16]; // Default: typical business hours
    }

    // Aggregate active hours across all learned patterns
    var hourCounts = {};
    for (var i = 0; i < prefs.learnedPatterns.length; i++) {
      var pattern = prefs.learnedPatterns[i];
      for (var j = 0; j < pattern.activeHours.length; j++) {
        var h = pattern.activeHours[j];
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    }

    // Sort hours by frequency, return top 5
    var sorted = Object.keys(hourCounts).map(Number).sort(function (a, b) {
      return hourCounts[b] - hourCounts[a];
    });

    return sorted.slice(0, 5);
  };

  /**
   * Validate and sanitize preference object
   */
  PreferenceService.prototype._validate = function (prefs) {
    return {
      workStart: typeof prefs.workStart === 'number' ? prefs.workStart : 9,
      workEnd: typeof prefs.workEnd === 'number' ? prefs.workEnd : 17,
      timezone: typeof prefs.timezone === 'string' ? prefs.timezone : 'UTC',
      learnedPatterns: Array.isArray(prefs.learnedPatterns) ? prefs.learnedPatterns : []
    };
  };

  /**
   * Get default preferences
   */
  PreferenceService.prototype._getDefaults = function () {
    return {
      workStart: 9,
      workEnd: 17,
      timezone: 'UTC',
      learnedPatterns: []
    };
  };

  /**
   * Clear all stored preferences
   */
  PreferenceService.prototype.clear = function () {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('[preference-service] Failed to clear preferences:', e);
    }
  };

  // ---- Export singleton ----
  var instance = new PreferenceService();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  global.preferenceService = instance;

})(typeof window !== 'undefined' ? window : globalThis);
