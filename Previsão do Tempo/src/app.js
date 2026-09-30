(() => {
  'use strict';
  const { api, preferences, view } = Brisa;
  const { $ } = view;
  const REFRESH_INTERVAL = 5 * 60 * 1000;
  const cities = {
    'sao-paulo': { name: 'São Paulo', region: 'São Paulo', country: 'Brasil', latitude: -23.5505, longitude: -46.6333 },
    rio: { name: 'Rio de Janeiro', region: 'Rio de Janeiro', country: 'Brasil', latitude: -22.9068, longitude: -43.1729 },
    curitiba: { name: 'Curitiba', region: 'Paraná', country: 'Brasil', latitude: -25.4296, longitude: -49.2713 },
    lisboa: { name: 'Lisboa', region: 'Lisboa', country: 'Portugal', latitude: 38.7167, longitude: -9.1333 },
  };
  const state = { location: preferences.location() || cities['sao-paulo'], forecast: null,
    controller: null, searchController: null, searchVersion: 0, geolocationVersion: 0,
    fetchedAt: 0, timer: null, debounce: null, paused: preferences.paused(),
    unit: preferences.unit(), theme: preferences.theme() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'), stale: false, rememberPending: false };

  async function load(location, changing = false, rememberLocation = false) {
    clearTimeout(state.timer);
    state.controller?.abort();
    const controller = new AbortController();
    state.controller = controller;
    state.location = location;
    if (changing) { state.forecast = null; state.rememberPending = rememberLocation; }
    view.notice();
    view.loading(location, changing || !state.forecast);
    document.querySelectorAll('[data-city]').forEach(button => {
      const city = cities[button.dataset.city];
      button.setAttribute('aria-pressed', String(city.latitude === location.latitude && city.longitude === location.longitude));
    });
    try {
      const forecast = await api.forecast(location, controller.signal);
      if (state.controller !== controller) return;
      state.forecast = forecast;
      state.fetchedAt = Date.now();
      state.stale = false;
      preferences.save({ location });
      if (state.rememberPending && location.name !== 'Minha localização') preferences.remember(location);
      state.rememberPending = false;
      view.history(preferences.history(), selectLocation);
      view.render(location, forecast, state.fetchedAt, changing);
    } catch (error) {
      if (error.name === 'AbortError' || state.controller !== controller) return;
      state.stale = true;
      view.notice(error.message + (state.forecast ? ' Exibindo a última consulta; os dados podem estar desatualizados.' : ''), true);
      view.text('data-status', state.forecast ? 'Dados desatualizados' : 'Sem conexão com os dados');
      if (!state.forecast) {
        view.text('current-description', 'Não foi possível obter o clima');
        view.text('location-date', 'Verifique a conexão e tente novamente');
        view.text('updated-at', 'Tentar novamente');
        for (const id of ['daily-forecast', 'hourly-forecast']) view.text(id, 'Previsão indisponível no momento.');
      }
    } finally {
      if (state.controller === controller) {
        view.settled();
        state.controller = null;
        state.timer = setTimeout(() => { if (!document.hidden) load(state.location); }, REFRESH_INTERVAL);
      }
    }
  }
  function closeSearch() {
    clearTimeout(state.debounce);
    state.searchVersion++;
    state.searchController?.abort();
    $('search-panel').hidden = true;
  }
  function selectLocation(location) {
    state.geolocationVersion++;
    $('geolocation-button').disabled = false;
    closeSearch();
    closeHistory();
    view.section('current');
    $('city-search').value = '';
    load(location, true, true);
  }
  async function search() {
    closeHistory();
    clearTimeout(state.debounce);
    state.searchController?.abort();
    const version = ++state.searchVersion;
    const query = $('city-search').value.trim();
    if (query.length < 2) {
      view.searchResults([], 'Digite pelo menos 2 caracteres para buscar uma cidade.', selectLocation);
      return;
    }
    const controller = new AbortController();
    state.searchController = controller;
    view.searchResults([], 'Buscando cidades…', selectLocation);
    try {
      const results = await api.search(query, controller.signal);
      if (state.searchVersion !== version) return;
      view.searchResults(results, results.length ? 'Escolha a cidade e a região desejadas:' : 'Nenhuma cidade encontrada. Tente outro nome ou confira a grafia.', selectLocation);
    } catch (error) {
      if (error.name !== 'AbortError' && state.searchVersion === version) view.searchResults([], error.message, selectLocation);
    }
  }
  function locate() {
    closeSearch();
    closeHistory();
    if (!navigator.geolocation) {
      view.notice('Seu navegador não disponibiliza a localização. Busque pelo nome da cidade.');
      return;
    }
    const version = ++state.geolocationVersion;
    $('geolocation-button').disabled = true;
    view.notice('Aguardando sua localização. Autorize o acesso quando o navegador solicitar.');
    navigator.geolocation.getCurrentPosition(position => {
      if (state.geolocationVersion !== version) return;
      const { latitude, longitude } = position.coords;
      // Open-Meteo does not provide reverse geocoding: identify GPS honestly by coordinates.
      selectLocation({ name: 'Minha localização', region: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`, country: '', latitude, longitude });
    }, error => {
      if (state.geolocationVersion !== version) return;
      $('geolocation-button').disabled = false;
      const messages = { 1: 'O acesso à localização foi negado. Você pode buscar pelo nome da cidade.',
        2: 'Não foi possível determinar sua localização. Busque pelo nome da cidade.',
        3: 'A localização demorou para responder. Tente novamente ou busque uma cidade.' };
      view.notice(messages[error.code] || 'Localização indisponível. Busque pelo nome da cidade.');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  }

  function closeHistory() {
    $('history-panel').hidden = true;
    $('history-button').setAttribute('aria-expanded', 'false');
  }
  view.init();
  view.paused(state.paused);
  view.setUnit(state.unit);
  view.theme(state.theme);
  view.history(preferences.history(), selectLocation);
  document.querySelectorAll('[data-unit]').forEach(button => button.addEventListener('click', () => {
    state.unit = button.dataset.unit;
    preferences.save({ unit: state.unit });
    view.setUnit(state.unit);
    if (state.forecast) {
      view.render(state.location, state.forecast, state.fetchedAt);
      if (state.stale) view.text('data-status', 'Dados desatualizados');
      else if (state.controller) view.text('data-status', 'Atualizando');
    }
  }));
  $('theme-button').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    preferences.save({ theme: state.theme });
    view.theme(state.theme);
  });
  $('history-button').addEventListener('click', () => {
    const open = $('history-panel').hidden;
    closeSearch();
    view.history(preferences.history(), selectLocation);
    $('history-panel').hidden = !open;
    $('history-button').setAttribute('aria-expanded', String(open));
  });
  $('clear-history').addEventListener('click', () => {
    preferences.save({ history: [] });
    view.history([], selectLocation);
    $('history-button').focus();
  });
  document.querySelectorAll('button[data-view]').forEach(button => button.addEventListener('click', () => view.section(button.dataset.view)));
  $('search-form').addEventListener('submit', event => { event.preventDefault(); search(); });
  $('city-search').addEventListener('input', () => {
    closeSearch();
    if ($('city-search').value.trim().length >= 2) state.debounce = setTimeout(search, 350);
  });
  $('city-search').addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      const first = $('search-results').querySelector('button');
      if (!$('search-panel').hidden && first) { event.preventDefault(); first.focus(); }
    }
  });
  $('search-results').addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const buttons = [...$('search-results').querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    event.preventDefault();
    buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('search-panel').hidden) { closeSearch(); $('city-search').focus(); }
    if (event.key === 'Escape' && !$('history-panel').hidden) { closeHistory(); $('history-button').focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.location-section')) { closeSearch(); closeHistory(); } });
  document.querySelectorAll('[data-city]').forEach(button => button.addEventListener('click', () => selectLocation(cities[button.dataset.city])));
  $('geolocation-button').addEventListener('click', locate);
  $('refresh-button').addEventListener('click', () => load(state.location));
  $('retry-button').addEventListener('click', () => load(state.location));
  $('animation-button').addEventListener('click', () => {
    state.paused = !state.paused;
    view.paused(state.paused);
    preferences.save({ paused: state.paused });
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - state.fetchedAt >= REFRESH_INTERVAL && !state.controller) load(state.location);
  });
  window.addEventListener('online', () => { if (!state.controller) load(state.location); });
  window.addEventListener('offline', () => {
    state.stale = true;
    view.notice('Você está sem internet. As consultas serão retomadas quando a conexão voltar.', true);
    view.text('data-status', 'Sem internet');
  });
  load(state.location, true);
})();
