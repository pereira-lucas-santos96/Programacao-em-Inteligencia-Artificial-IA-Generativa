(() => {
  'use strict';
  const KEY = 'brisa.preferences.v1';
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }
  function save(patch) {
    try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch })); } catch { /* Browsing remains available if storage is blocked. */ }
  }
  function location() {
    const saved = read().location;
    return Brisa.weather.validLocation(saved) ? saved : null;
  }
  function history() {
    const saved = read().history;
    return Array.isArray(saved) ? saved.filter(Brisa.weather.validLocation).slice(0, 5) : [];
  }
  function remember(location) {
    const previous = history().filter(item => item.latitude !== location.latitude || item.longitude !== location.longitude);
    save({ location, history: [location, ...previous].slice(0, 5) });
  }
  Brisa.preferences = { location, history, remember, paused: () => read().paused === true, save,
    unit: () => read().unit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
    theme: () => ['light', 'dark'].includes(read().theme) ? read().theme : null };
})();
