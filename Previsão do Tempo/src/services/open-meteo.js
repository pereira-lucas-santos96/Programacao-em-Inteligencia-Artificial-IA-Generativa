(() => {
  'use strict';
  const API_TIMEOUT = 15000;
  async function request(url, signal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, API_TIMEOUT);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 429
        ? 'Muitas consultas no momento. Aguarde um pouco e tente novamente.'
        : 'O serviço de previsão está indisponível. Tente novamente em instantes.');
      const data = await response.json();
      if (data.error) throw new Error('Não foi possível consultar essa localidade.');
      return data;
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Consulta cancelada', 'AbortError');
      if (controller.signal.aborted) throw new Error('A consulta demorou demais. Verifique sua conexão e tente novamente.');
      if (error instanceof TypeError) throw new Error('Não foi possível conectar à Open-Meteo. Verifique sua conexão com a internet.');
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
  async function search(query, signal) {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.search = new URLSearchParams({ name: query, count: '8', language: 'pt', format: 'json' });
    const data = await request(url, signal);
    return (data.results || []).map(place => ({ name: place.name, latitude: place.latitude,
      longitude: place.longitude, region: place.admin1 || '', country: place.country || '' }))
      .filter(Brisa.weather.validLocation);
  }
  async function forecast(location, signal) {
    if (!Brisa.weather.validLocation(location)) throw new Error('Escolha uma localidade válida.');
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: String(location.latitude), longitude: String(location.longitude),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max',
      hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
      timezone: 'auto', timeformat: 'unixtime', forecast_days: '7',
      temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm',
    });
    return Brisa.weather.normalize(await request(url, signal));
  }
  Brisa.api = { search, forecast };
})();
