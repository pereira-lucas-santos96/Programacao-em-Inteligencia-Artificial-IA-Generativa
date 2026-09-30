/* Dependency-free browser integration tests. Requires Node 22+ and Chrome. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(__dirname, 'artifacts');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function fixture() {
  window.brisaOriginalFetch = window.fetch.bind(window);
  window.testWeather = { code: 2, isDay: 1, fail: false };
  window.forecastCallCount = 0;
  window.fetch = async function (input) {
    const url = new URL(input);
    if (url.hostname === 'geocoding-api.open-meteo.com') {
      const name = url.searchParams.get('name');
      return { ok: true, json: async () => ({ results: name === 'zzzz' ? [] : [
        { name: 'Cubatão', admin1: 'São Paulo', country: 'Brasil', latitude: -23.89, longitude: -46.42 },
        { name: '<img src=x onerror=alert(1)>', country: 'Teste', latitude: 10, longitude: 20 },
      ] }) };
    }
    if (url.hostname !== 'api.open-meteo.com') throw new Error('Unexpected URL');
    window.forecastCallCount++;
    const lat = Number(url.searchParams.get('latitude'));
    const options = { ...window.testWeather };
    // Intentionally ignore abort to also exercise controller identity protection.
    await new Promise(resolve => setTimeout(resolve, lat === -22.9068 ? 220 : 15));
    if (options.fail) return { ok: false, status: 503 };
    const time = Math.floor(Date.now() / 900000) * 900;
    const today = Math.floor(time / 86400) * 86400 + 10800;
    const days = Array.from({ length: 7 }, (_, i) => today + i * 86400);
    const hours = Array.from({ length: 168 }, (_, i) => today + i * 3600);
    return { ok: true, json: async () => ({ timezone: 'America/Sao_Paulo',
      current: { time, temperature_2m: lat === -25.4296 ? 17 : 25, weather_code: options.code,
        is_day: options.isDay, apparent_temperature: 26, relative_humidity_2m: 65,
        wind_speed_10m: 12.4, wind_direction_10m: 135, precipitation: 0 },
      daily: { time: days, weather_code: [2, 0, 3, 61, 95, 71, 0],
        temperature_2m_min: [17, 18, 16, 15, 17, 14, 18], temperature_2m_max: [26, 28, 24, 22, 25, 23, 28],
        sunrise: days.map(d => d + 21600), sunset: days.map(d => d + 64800),
        precipitation_sum: [0, 0, 0, 3, 5, 2, 0], precipitation_probability_max: [10, 0, 20, 80, 90, 65, 0] },
      hourly: { time: hours, temperature_2m: hours.map((_, i) => 22 + i % 5), weather_code: hours.map(() => options.code),
        precipitation_probability: hours.map(() => 10), is_day: hours.map((_, i) => i % 24 >= 6 && i % 24 < 18 ? 1 : 0) },
    }) };
  };
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
    getCurrentPosition(success, failure) {
      if (window.testGeoDenied) failure({ code: 1 });
      else success({ coords: { latitude: -23.89, longitude: -46.42 } });
    },
  } });
}

async function main() {
  const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) throw new Error('Chrome não encontrado. Defina CHROME_PATH.');
  fs.mkdirSync(artifacts, { recursive: true });
  const server = http.createServer((request, response) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, content) => {
      if (error) { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
      response.end(content);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'brisa-browser-test-'));
  const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1440,1100', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let id = 0;
    const pending = new Map();
    const errors = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
      if (message.id && pending.has(message.id)) {
        const task = pending.get(message.id);
        pending.delete(message.id);
        clearTimeout(task.timeout);
        message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const key = ++id;
      const timeout = setTimeout(() => { pending.delete(key); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      pending.set(key, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id: key, method, params }));
    });
    const evaluate = async expression => {
      const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
      return response.result.value;
    };
    const waitFor = async (expression, label) => {
      for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(50); }
      throw new Error(`Timed out: ${label}`);
    };
    const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const text = elementId => evaluate(`document.getElementById(${JSON.stringify(elementId)}).textContent`);
    const ready = () => waitFor(`document.getElementById('weather-panel')?.getAttribute('aria-busy') === 'false'`, 'weather ready');
    const screenshot = async name => {
      const data = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      fs.writeFileSync(path.join(artifacts, name), Buffer.from(data.data, 'base64'));
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `(${fixture.toString()})()` });
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/index.html` });
    await ready();
    assert.equal(await text('location-name'), 'São Paulo');
    assert.equal(await text('current-temperature'), '25');
    assert.equal(await evaluate(`document.querySelectorAll('.daily-row').length`), 7);
    assert.equal(await evaluate(`document.querySelectorAll('.hour-card').length`), 6);
    await screenshot('desktop.png');
    console.log('PASS initial load, 7 days, 6 hours');

    const calls = await evaluate('forecastCallCount');
    await click('[data-unit="fahrenheit"]');
    assert.equal(await text('current-temperature'), '77');
    assert.equal(await text('temperature-unit'), '°F');
    assert.match(await text('feels-like'), /79°/);
    assert.match(await text('high-low'), /79°.*63°/);
    assert.equal(await evaluate(`document.querySelector('.daily-high').textContent`), '79°');
    assert.equal(await evaluate('forecastCallCount'), calls);
    await click('[data-unit="celsius"]');
    assert.equal(await text('current-temperature'), '25');
    await click('#theme-button');
    assert.equal(await evaluate('document.body.dataset.theme'), 'dark');
    await screenshot('desktop-dark.png');
    await click('#theme-button');
    console.log('PASS Celsius/Fahrenheit across readings without refetch; dark/light mode');

    await click('[data-city="rio"]');
    assert.equal(await evaluate(`document.getElementById('loading-indicator').hidden`), false);
    await click('[data-city="curitiba"]');
    await ready();
    await sleep(300);
    assert.equal(await text('location-name'), 'Curitiba');
    assert.equal(await text('current-temperature'), '17');
    assert.equal(await evaluate(`document.getElementById('loading-indicator').hidden`), true);
    console.log('PASS rapid city changes ignore late responses');

    for (const [code, theme] of [[0, 'clear'], [3, 'cloudy'], [61, 'rain'], [71, 'snow'], [45, 'fog'], [95, 'storm']]) {
      await evaluate(`testWeather.code = ${code}`);
      await click('#refresh-button');
      await ready();
      assert.equal(await evaluate('document.body.dataset.weather'), theme);
      if (theme === 'rain') { assert.equal(await evaluate(`getComputedStyle(document.getElementById('particles')).display`), 'block'); await screenshot('rain.png'); }
    }
    await evaluate('testWeather.code = 0; testWeather.isDay = 0');
    await click('#refresh-button'); await ready();
    assert.equal(await evaluate('document.body.dataset.night'), 'true');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.scene-moon')).display`), 'block');
    await click('#animation-button');
    assert.equal(await evaluate(`document.body.classList.contains('animations-paused')`), true);
    console.log('PASS weather scenes, night and pause');

    await evaluate('testWeather.fail = true');
    await click('#refresh-button'); await ready();
    assert.match(await text('notice-text'), /desatualizados/);
    assert.equal(await text('current-temperature'), '17');
    await click('[data-city="rio"]'); await ready();
    assert.equal(await text('current-temperature'), '—');
    await evaluate('testWeather.fail = false');
    await click('#retry-button'); await ready();
    assert.equal(await text('location-name'), 'Rio de Janeiro');
    assert.equal(await evaluate(`document.getElementById('notice').hidden`), true);
    console.log('PASS stale warning, no old-city data, retry recovery');

    await evaluate(`document.getElementById('city-search').value = 'zzzz'; document.getElementById('search-form').requestSubmit()`);
    await waitFor(`document.getElementById('search-help').textContent.includes('Nenhuma')`, 'empty search');
    await evaluate(`document.getElementById('city-search').value = 'Cubatão'; document.getElementById('search-form').requestSubmit()`);
    await waitFor(`document.querySelectorAll('.search-result').length === 2`, 'search results');
    assert.equal(await evaluate(`document.querySelectorAll('#search-results img').length`), 0);
    await evaluate(`document.getElementById('city-search').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))`);
    assert.equal(await evaluate(`document.activeElement.classList.contains('search-result')`), true);
    await click('.search-result'); await ready();
    assert.equal(await text('location-name'), 'Cubatão');
    console.log('PASS search, empty state, keyboard and safe external text');

    await click('#history-button');
    assert.equal(await evaluate(`document.getElementById('history-panel').hidden`), false);
    assert.match(await text('history-results'), /Cubatão/);
    await click('#history-results .search-result'); await ready();
    assert.equal(await text('location-name'), 'Cubatão');
    assert.equal(await evaluate(`Brisa.preferences.history().filter(place => place.name === 'Cubatão').length`), 1);
    console.log('PASS recent cities and repeated city deduplication');

    await evaluate('window.testGeoDenied = true');
    await click('#geolocation-button');
    assert.match(await text('notice-text'), /negado/);
    await evaluate('window.testGeoDenied = false');
    await click('#geolocation-button'); await ready();
    assert.equal(await text('location-name'), 'Minha localização');
    await click('[data-unit="fahrenheit"]');
    await click('#theme-button');
    await send('Page.reload'); await ready();
    assert.equal(await text('location-name'), 'Minha localização');
    assert.equal(await evaluate(`document.body.classList.contains('animations-paused')`), true);
    assert.equal(await evaluate('document.body.dataset.theme'), 'dark');
    assert.equal(await text('temperature-unit'), '°F');
    assert.ok(await evaluate('Brisa.preferences.history().length > 0'));
    await click('#history-button');
    await click('#clear-history');
    assert.equal(await evaluate('Brisa.preferences.history().length'), 0);
    await click('#history-button');
    await click('[data-unit="celsius"]');
    console.log('PASS geolocation denial/success and persisted preferences');

    for (const [width, height] of [[1440, 900], [1366, 768], [1024, 768], [768, 1024], [390, 844], [360, 640], [320, 568], [844, 390], [667, 375]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
      for (const section of ['current', 'daily', 'hourly']) {
        await click(`button[data-view="${section}"]`);
        await sleep(60);
        assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= window.innerHeight'), true, `No page overflow: ${width}x${height}, ${section}`);
        const clipped = await evaluate(`['.current-content', '.metrics', '.daily-forecast', '.hourly-forecast', '.forecast-panel'].filter(selector => { const node = document.querySelector(selector); return node.checkVisibility() && node.scrollHeight > node.clientHeight + 2; })`);
        assert.deepEqual(clipped, [], `No clipped content: ${width}x${height}, ${section}`);
        if (width === 390) await screenshot(`mobile-${section}.png`);
        if (width === 1366) await screenshot(`desktop-${section}.png`);
      }
    }
    await click('button[data-view="current"]');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.cloud')).animationName`), 'none');
    assert.deepEqual(errors, []);
    console.log('PASS mobile layouts, reduced motion, no uncaught browser errors');
    if (process.env.BRISA_LIVE_TEST === '1') {
      await evaluate('window.fetch = window.brisaOriginalFetch');
      await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
      await click('#refresh-button');
      for (let i = 0; i < 360; i++) {
        if (await evaluate(`document.getElementById('weather-panel').getAttribute('aria-busy') === 'false'`)) break;
        await sleep(50);
      }
      assert.equal(await text('data-status'), 'Condições atuais', await text('notice-text'));
      assert.notEqual(await text('current-temperature'), '—');
      const places = await evaluate(`Brisa.api.search('Cubatão').then(results => results.map(place => place.name))`);
      assert.ok(places.includes('Cubatão'));
      await screenshot('live-open-meteo.png');
      console.log('PASS live Open-Meteo forecast and geocoding through browser CORS');
    }
    console.log(`Screenshots: ${artifacts}`);
    await send('Browser.close').catch(() => {});
  } finally {
    socket?.close();
    chrome.kill();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
