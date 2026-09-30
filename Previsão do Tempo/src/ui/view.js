(() => {
  'use strict';
  const { weather } = Brisa;
  const $ = id => document.getElementById(id);
  let unit = 'celsius';
  const degrees = value => weather.format(weather.temperature(value, unit));
  let transition;
  const paths = {
    clear: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    moon: '<path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/>',
    cloudy: '<path d="M6 18a4 4 0 1 1 1-7.9 6 6 0 0 1 11.5-1A4.5 4.5 0 0 1 18 18Z"/>',
    partly: '<path d="M13 5V3m5 4 1.5-1.5M20 11h2M7 6 5.5 4.5"/><path d="M10 10a4 4 0 1 1 7 3"/><path d="M5 20a4 4 0 1 1 .5-8 5 5 0 0 1 9 1 3.5 3.5 0 1 1 2 7Z"/>',
    partlyNight: '<path d="M19 11A7 7 0 0 1 11 3a7 7 0 0 0-5 9"/><path d="M5 21a4 4 0 1 1 .5-8 5 5 0 0 1 9 1 3.5 3.5 0 1 1 2 7Z"/>',
    rain: '<path d="M5 15a4 4 0 1 1 1-7.8A5.5 5.5 0 0 1 16.5 6a4.5 4.5 0 1 1 2 9M8 18l-1 3m6-3-1 3m6-3-1 3"/>',
    storm: '<path d="M5 15a4 4 0 1 1 1-7.8A5.5 5.5 0 0 1 16.5 6a4.5 4.5 0 1 1 2 9M13 12l-4 6h5l-3 5"/>',
    snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4m10 14-1-4 4-1M4 14l4 1-1 4m10-14-1 4 4 1"/>',
    fog: '<path d="M4 10a4 4 0 0 1 3-6 5 5 0 0 1 9 1 4 4 0 0 1 4 5M3 14h18M5 18h14M8 22h8"/>',
    unknown: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    wind: '<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h6a3 3 0 1 1-3 3"/>',
    drop: '<path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
    sunset: '<path d="M2 17h20M4 21h16M7 17a5 5 0 0 1 10 0M12 3v6m-3-3 3 3 3-3M3 10l2 2m14 0 2-2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="m8 4 12 8-12 8Z"/>',
  };
  const illustrated = {
    clear: '<circle class="icon-sun" cx="12" cy="12" r="4.5"/><path class="icon-rays" d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
    moon: '<path class="icon-moon" d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/><path class="icon-stars" d="M18 3v4m-2-2h4"/>',
    cloudy: '<path class="icon-cloud-back" d="M7 14a4 4 0 1 1 1-7.9A6 6 0 0 1 19 8a3 3 0 0 1 0 6Z"/><path class="icon-cloud" d="M5 20a4 4 0 1 1 1-7.8A5 5 0 0 1 15 13a3.5 3.5 0 1 1 2 7Z"/>',
    partly: '<circle class="icon-sun" cx="15" cy="8" r="4"/><path class="icon-rays" d="M15 1v1m6 2-1 1m1 4h2M9 3l1 1"/><path class="icon-cloud" d="M5 21a4 4 0 1 1 1-7.8A5 5 0 0 1 15 14a3.5 3.5 0 1 1 2 7Z"/>',
    partlyNight: '<path class="icon-moon" d="M20 10A7 7 0 0 1 12 2a7 7 0 0 0-4 12Z"/><path class="icon-cloud" d="M5 21a4 4 0 1 1 1-7.8A5 5 0 0 1 15 14a3.5 3.5 0 1 1 2 7Z"/>',
    rain: '<path class="icon-cloud" d="M5 14a4 4 0 1 1 1-7.8A5.5 5.5 0 0 1 16.5 5a4.5 4.5 0 1 1 2 9Z"/><path class="icon-drops" d="M7 17l-1 3m6-2-1 3m6-4-1 3"/>',
    storm: '<path class="icon-cloud-back" d="M5 14a4 4 0 1 1 1-7.8A5.5 5.5 0 0 1 16.5 5a4.5 4.5 0 1 1 2 9Z"/><path class="icon-bolt" d="m13 10-5 8h4l-1 5 7-9h-5l2-4Z"/><path class="icon-drops" d="m5 17-1 3m16-3-1 3"/>',
  };
  // Only our static SVG definitions enter innerHTML. API text uses textContent.
  function icon(name) {
    const span = document.createElement('span');
    span.innerHTML = `<svg class="${illustrated[name] ? 'illustrated-icon' : ''}" viewBox="0 0 24 24" aria-hidden="true">${illustrated[name] || paths[name] || paths.unknown}</svg>`;
    return span.firstElementChild;
  }
  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function text(id, content) { $(id).textContent = content; }
  function metric(id, value, unit, digits = 0) {
    $(id).replaceChildren(document.createTextNode(`${weather.format(value, digits)} `), element('small', '', unit));
  }
  function symbol(code, isDay = true) {
    const condition = weather.condition(code, isDay);
    const node = element('span', 'weather-symbol');
    node.dataset.theme = condition.theme;
    node.title = condition.description;
    node.setAttribute('aria-label', condition.description);
    node.setAttribute('role', 'img');
    node.append(icon(condition.icon));
    return node;
  }
  function rainChance(value) {
    const node = element('span', 'rain-chance');
    node.append(icon('drop'), document.createTextNode(`${weather.format(value)}%`));
    node.title = `Probabilidade de precipitação: ${weather.format(value)}%`;
    return node;
  }
  function renderDaily(days, timezone) {
    const limits = days.flatMap(day => [day.min, day.max]).filter(Number.isFinite);
    const min = Math.min(...limits), span = Math.max(1, Math.max(...limits) - min);
    const rows = days.map((day, index) => {
      const row = element('div', 'daily-row');
      const label = index === 0 ? 'Hoje' : weather.date(day.time, timezone, { weekday: 'short' }).replace('.', '');
      const dayName = element('span', 'day-name', label.charAt(0).toUpperCase() + label.slice(1));
      const range = element('div', 'temperature-range');
      const track = element('span', 'range-track');
      const fill = element('span', 'range-fill');
      if (day.min !== null && day.max !== null) {
        fill.style.setProperty('--start', `${(day.min - min) / span * 100}%`);
        fill.style.setProperty('--width', `${Math.max(2, (day.max - day.min) / span * 100)}%`);
        track.append(fill);
      }
      track.setAttribute('aria-hidden', 'true');
      range.append(element('span', '', `${degrees(day.min)}°`), track);
      row.title = `${weather.condition(day.code).description}. Precipitação: ${weather.format(day.precipitation, 1)} mm`;
      row.append(dayName, symbol(day.code), rainChance(day.probability), range, element('span', 'daily-high', `${degrees(day.max)}°`), element('span', 'daily-precipitation', `${weather.format(day.precipitation, 1)} mm`));
      return row;
    });
    $('daily-forecast').replaceChildren(...(rows.length ? rows : [element('p', 'placeholder', 'Previsão diária indisponível.')]));
  }
  function renderHourly(hours, timezone) {
    const cards = hours.map(hour => {
      const card = element('div', 'hour-card');
      card.append(element('span', '', weather.time(hour.time, timezone)), symbol(hour.code, hour.isDay),
        element('strong', '', `${degrees(hour.temperature)}°`), rainChance(hour.probability));
      return card;
    });
    $('hourly-forecast').replaceChildren(...(cards.length ? cards : [element('p', 'placeholder', 'Previsão por hora indisponível.')]));
  }
  function render(location, forecast, fetchedAt, animate = false) {
    const { current, daily, hourly, timezone } = forecast;
    const condition = weather.condition(current.code, current.isDay);
    document.body.dataset.weather = condition.theme;
    document.body.dataset.night = String(!current.isDay);
    text('location-name', location.name);
    text('forecast-location', location.name);
    text('location-region', [location.region, location.country].filter(Boolean).join(', ') || 'Sua localização');
    text('location-date', weather.date(current.time, timezone, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + weather.time(current.time, timezone));
    text('current-temperature', degrees(current.temperature));
    $('current-icon').replaceChildren(icon(condition.icon));
    text('current-description', condition.description);
    text('feels-like', `Sensação de ${degrees(current.feelsLike)}°`);
    text('high-low', `↑ ${degrees(daily[0]?.max)}°  ↓ ${degrees(daily[0]?.min)}°`);
    metric('humidity', current.humidity, '%');
    text('humidity-description', current.humidity === null ? 'Dado indisponível' : current.humidity < 30 ? 'Umidade baixa' : current.humidity > 80 ? 'Umidade elevada' : 'Umidade moderada');
    metric('wind', current.wind, 'km/h', 1);
    text('wind-direction', weather.direction(current.direction));
    metric('precipitation', current.precipitation, 'mm', 1);
    text('sunset', weather.time(daily[0]?.sunset, timezone));
    text('sunrise', `Nascer do sol às ${weather.time(daily[0]?.sunrise, timezone)}`);
    text('data-status', 'Condições atuais');
    text('updated-at', `Consultado às ${weather.time(fetchedAt / 1000, timezone)} · Atualizar`);
    $('refresh-button').title = 'Consultar os dados novamente';
    text('scene-caption', `${current.isDay ? 'Dia' : 'Noite'} de ${condition.description.toLocaleLowerCase('pt-BR')} por aí.`);
    renderDaily(daily, timezone);
    renderHourly(hourly, timezone);
    document.title = `${degrees(current.temperature)}${unit === 'celsius' ? '°C' : '°F'} em ${location.name} — Brisa`;
    if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches && !document.body.classList.contains('animations-paused')) {
      transition?.cancel();
      transition = $('weather-panel').animate([{ opacity: .35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' });
    }
  }
  function loading(location, changing) {
    $('weather-panel').setAttribute('aria-busy', 'true');
    $('loading-indicator').hidden = false;
    $('refresh-button').disabled = true;
    text('data-status', 'Atualizando');
    if (!changing) return;
    text('location-name', location.name);
    text('forecast-location', location.name);
    text('location-region', [location.region, location.country].filter(Boolean).join(', ') || 'Sua localização');
    text('location-date', 'Buscando as condições mais recentes');
    text('current-temperature', '—');
    text('current-description', 'Consultando o céu…');
    text('feels-like', 'Sensação de —');
    text('high-low', '↑ —  ↓ —');
    $('current-icon').replaceChildren();
    for (const id of ['humidity', 'wind', 'precipitation', 'sunset']) text(id, '—');
    for (const id of ['humidity-description', 'wind-direction', 'sunrise']) text(id, 'Aguardando dados');
    text('updated-at', 'Atualizando…');
    text('scene-caption', 'O cenário acompanha o clima da cidade.');
    for (const id of ['daily-forecast', 'hourly-forecast']) $(id).replaceChildren(element('p', 'placeholder', 'Buscando a previsão…'));
    document.body.dataset.weather = 'unknown';
    document.body.dataset.night = 'false';
    document.title = `${location.name} — Brisa`;
  }
  function settled() {
    $('weather-panel').setAttribute('aria-busy', 'false');
    $('loading-indicator').hidden = true;
    $('refresh-button').disabled = false;
  }
  function notice(message = '', retry = false) {
    $('notice').hidden = !message;
    text('notice-text', message);
    $('retry-button').hidden = !retry;
  }
  function locationList(locations, listId, paginationId, onSelect, page = 0) {
    const pageSize = 3;
    $(listId).replaceChildren(...locations.slice(page * pageSize, (page + 1) * pageSize).map(location => {
      const item = element('li');
      const button = element('button', 'search-result');
      button.type = 'button';
      const details = element('span');
      details.append(element('strong', '', location.name), element('small', '', [location.region, location.country].filter(Boolean).join(' · ')));
      button.append(icon('pin'), details);
      button.addEventListener('click', () => onSelect(location));
      item.append(button);
      return item;
    }));
    const pages = Math.ceil(locations.length / pageSize);
    const pagination = $(paginationId);
    pagination.hidden = pages <= 1;
    pagination.replaceChildren();
    if (pages > 1) {
      for (const [label, next] of [['← Anterior', page - 1], ['Próxima →', page + 1]]) {
        const button = element('button', '', label);
        button.type = 'button';
        button.disabled = next < 0 || next >= pages;
        button.addEventListener('click', () => {
          locationList(locations, listId, paginationId, onSelect, next);
          $(listId).querySelector('button')?.focus();
        });
        pagination.append(button);
      }
    }
  }
  function searchResults(locations, message, onSelect) {
    $('search-panel').hidden = false;
    text('search-help', message);
    locationList(locations, 'search-results', 'search-pagination', onSelect);
  }
  function history(locations, onSelect) {
    $('history-empty').hidden = locations.length > 0;
    $('clear-history').disabled = locations.length === 0;
    locationList(locations, 'history-results', 'history-pagination', onSelect);
  }
  function setUnit(value) {
    unit = value;
    text('temperature-unit', unit === 'celsius' ? '°C' : '°F');
    document.querySelectorAll('.forecast-unit').forEach(node => { node.textContent = unit === 'celsius' ? '°C' : '°F'; });
    document.querySelectorAll('[data-unit]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.unit === unit)));
  }
  function theme(value) {
    const dark = value === 'dark';
    document.body.dataset.theme = value;
    $('theme-button').setAttribute('aria-pressed', String(dark));
    $('theme-button').setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
    text('theme-label', dark ? 'Modo claro' : 'Modo escuro');
    $('theme-button').querySelector('[data-icon]').replaceChildren(icon(dark ? 'clear' : 'moon'));
    document.querySelector('meta[name="theme-color"]').content = dark ? '#14241f' : '#f4f6f2';
  }
  function section(value) {
    document.body.dataset.view = value;
    document.querySelectorAll('button[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === value)));
  }
  function paused(value) {
    document.body.classList.toggle('animations-paused', value);
    $('animation-button').setAttribute('aria-pressed', String(value));
    text('animation-label', value ? 'Animar cenário' : 'Pausar cenário');
    $('animation-button').querySelector('[data-icon]').replaceChildren(icon(value ? 'play' : 'pause'));
  }
  function init() {
    document.querySelectorAll('[data-icon]').forEach(node => node.replaceChildren(icon(node.dataset.icon)));
    text('today-date', new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()));
    for (let index = 0; index < 56; index++) {
      const particle = element('i', 'particle');
      particle.style.setProperty('--x', `${index * 1.9}%`);
      particle.style.setProperty('--duration', `${.65 + (index % 8) * .11}s`);
      particle.style.setProperty('--delay', `${-(index % 13) * .7}s`);
      $('particles').append(particle);
    }
  }
  Brisa.view = { $, init, render, loading, settled, notice, searchResults, history, setUnit, theme, section, paused, text };
})();
