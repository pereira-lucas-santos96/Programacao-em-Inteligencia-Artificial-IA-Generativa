/* Run with Node.js 20+: node --test tests/weather.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

function context(fetch = () => {}) {
  const sandbox = { window: {}, fetch, URL, URLSearchParams, AbortController, DOMException, setTimeout, clearTimeout, Intl };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(__dirname, '../src/domain/weather.js'), 'utf8'), sandbox);
  sandbox.Brisa = sandbox.window.Brisa;
  vm.runInContext(readFileSync(join(__dirname, '../src/services/open-meteo.js'), 'utf8'), sandbox);
  return sandbox.Brisa;
}
const { weather } = context();
const location = { name: 'São Paulo', latitude: -23.55, longitude: -46.63 };

test('Every WMO weather code maps to the intended scene', () => {
  const groups = { clear: [0, 1], partly: [2], cloudy: [3], fog: [45, 48], rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], snow: [71, 73, 75, 77, 85, 86], storm: [95, 96, 99] };
  for (const [theme, codes] of Object.entries(groups)) for (const code of codes) assert.equal(weather.condition(code).theme, theme);
});
test('Night uses a moon and unknown weather has a neutral scene', () => {
  assert.equal(weather.condition(0, false).icon, 'moon');
  assert.equal(weather.condition(999).theme, 'unknown');
  assert.equal(weather.condition(null).theme, 'unknown');
  assert.equal(weather.condition(2, false).icon, 'partlyNight');
});
test('Temperature conversion handles freezing, boiling, negatives and missing data', () => {
  assert.equal(weather.temperature(0, 'fahrenheit'), 32);
  assert.equal(weather.temperature(100, 'fahrenheit'), 212);
  assert.equal(weather.temperature(-40, 'fahrenheit'), -40);
  assert.equal(weather.temperature(25, 'celsius'), 25);
  assert.equal(weather.temperature(null, 'fahrenheit'), null);
  assert.equal(weather.temperature(NaN, 'fahrenheit'), null);
});
test('Preferences deduplicate coordinates, limit history and tolerate invalid storage', () => {
  let stored = '{}';
  const sandbox = { Brisa: { weather }, localStorage: { getItem: () => stored, setItem: (_key, value) => { stored = value; } } };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(__dirname, '../src/services/preferences.js'), 'utf8'), sandbox);
  const preferences = sandbox.Brisa.preferences;
  for (let i = 0; i < 7; i++) preferences.remember({ name: `Cidade ${i}`, latitude: i, longitude: i });
  assert.equal(preferences.history().length, 5);
  preferences.remember({ name: 'Cidade 4', latitude: 4, longitude: 4 });
  assert.equal(preferences.history()[0].name, 'Cidade 4');
  assert.equal(preferences.history().filter(place => place.latitude === 4).length, 1);
  preferences.save({ unit: 'fahrenheit', theme: 'dark' });
  assert.equal(preferences.unit(), 'fahrenheit');
  assert.equal(preferences.theme(), 'dark');
  stored = '{broken';
  assert.equal(preferences.history().length, 0);
  stored = '{"history":"invalid", "unit":"kelvin"}';
  assert.equal(preferences.history().length, 0);
  assert.equal(preferences.unit(), 'celsius');
  sandbox.localStorage.getItem = () => { throw new Error('Blocked'); };
  sandbox.localStorage.setItem = () => { throw new Error('Blocked'); };
  assert.doesNotThrow(() => preferences.remember(location));
});
test('Formatting preserves zero and handles missing/invalid measurements', () => {
  assert.equal(weather.format(0), '0');
  assert.equal(weather.format(null), '—');
  assert.equal(weather.format(NaN), '—');
  assert.equal(weather.format(-2.3, 1), '-2,3');
});
test('Times use the requested city timezone, not the computer timezone', () => {
  const timestamp = Date.UTC(2026, 8, 29, 2, 0) / 1000;
  assert.equal(weather.time(timestamp, 'America/Sao_Paulo'), '23:00');
  assert.equal(weather.time(timestamp, 'Asia/Tokyo'), '11:00');
  assert.equal(weather.date(timestamp, 'America/Sao_Paulo', { day: 'numeric' }), '28');
});
test('Saved locations require bounded finite coordinates and a name', () => {
  assert.equal(weather.validLocation(location), true);
  for (const bad of [null, {}, { ...location, latitude: 91 }, { ...location, longitude: Infinity }, { ...location, latitude: '10' }, { ...location, name: '' }]) assert.equal(weather.validLocation(bad), false);
});
test('Normalization rejects incomplete current data without showing invented temperatures', () => {
  assert.throws(() => weather.normalize({}), /incompletos/);
  assert.throws(() => weather.normalize({ current: { temperature_2m: null, time: 1, weather_code: 0 } }), /incompletos/);
});
test('Normalization handles optional data and filters past hours', () => {
  const forecast = weather.normalize({ timezone: 'Invalid/Zone', current: { temperature_2m: 0, time: 200, weather_code: 71, is_day: 0 }, hourly: { time: [100, 200, 300], temperature_2m: [1, 2, null] } });
  assert.equal(forecast.timezone, 'UTC');
  assert.equal(forecast.current.humidity, null);
  assert.equal(forecast.current.isDay, false);
  assert.equal(forecast.hourly.length, 2);
  assert.equal(forecast.hourly[0].time, 200);
  assert.equal(forecast.hourly[1].temperature, null);
});
test('Wind direction wraps through north', () => {
  assert.equal(weather.direction(360), 'Norte');
  assert.equal(weather.direction(90), 'Leste');
  assert.equal(weather.direction(null), 'Direção indisponível');
});
test('Forecast request sends coordinates, explicit units, unix time and automatic timezone', async () => {
  let requested;
  const { api } = context(async url => { requested = url; return { ok: true, json: async () => ({ current: { temperature_2m: 20, time: 200, weather_code: 0 } }) }; });
  await api.forecast(location);
  assert.equal(requested.searchParams.get('latitude'), '-23.55');
  assert.equal(requested.searchParams.get('timezone'), 'auto');
  assert.equal(requested.searchParams.get('timeformat'), 'unixtime');
  assert.equal(requested.searchParams.get('wind_speed_unit'), 'kmh');
});
test('Search encodes accented names and filters invalid results', async () => {
  let requested;
  const { api } = context(async url => { requested = url; return { ok: true, json: async () => ({ results: [location, { name: 'Invalid' }] }) }; });
  const results = await api.search('São Paulo & região');
  assert.equal(requested.searchParams.get('name'), 'São Paulo & região');
  assert.equal(results.length, 1);
});
test('HTTP rate limits produce an actionable error', async () => {
  const { api } = context(async () => ({ ok: false, status: 429 }));
  await assert.rejects(api.forecast(location), /Muitas consultas/);
});
test('Superseded requests retain AbortError semantics', async () => {
  const { api } = context(async (_url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))));
  const controller = new AbortController();
  const request = api.forecast(location, controller.signal);
  controller.abort();
  await assert.rejects(request, error => error.name === 'AbortError');
});
