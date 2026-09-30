/* Pure weather rules: no DOM, storage or network dependencies. */
(() => {
  'use strict';
  const conditions = new Map([
    [0, ['Céu limpo', 'clear']], [1, ['Predominantemente limpo', 'clear']],
    [2, ['Parcialmente nublado', 'partly']], [3, ['Céu encoberto', 'cloudy']],
    [45, ['Nevoeiro', 'fog']], [48, ['Nevoeiro com geada', 'fog']],
    [51, ['Garoa leve', 'rain']], [53, ['Garoa moderada', 'rain']], [55, ['Garoa intensa', 'rain']],
    [56, ['Garoa congelante leve', 'rain']], [57, ['Garoa congelante intensa', 'rain']],
    [61, ['Chuva leve', 'rain']], [63, ['Chuva moderada', 'rain']], [65, ['Chuva forte', 'rain']],
    [66, ['Chuva congelante leve', 'rain']], [67, ['Chuva congelante forte', 'rain']],
    [71, ['Neve leve', 'snow']], [73, ['Neve moderada', 'snow']], [75, ['Neve intensa', 'snow']],
    [77, ['Grãos de neve', 'snow']], [80, ['Pancadas de chuva leves', 'rain']],
    [81, ['Pancadas de chuva moderadas', 'rain']], [82, ['Pancadas de chuva fortes', 'rain']],
    [85, ['Pancadas de neve leves', 'snow']], [86, ['Pancadas de neve fortes', 'snow']],
    [95, ['Trovoadas', 'storm']], [96, ['Trovoadas com granizo leve', 'storm']],
    [99, ['Trovoadas com granizo forte', 'storm']],
  ]);
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const number = value => finite(value) ? value : null;
  const condition = (code, isDay = true) => {
    const [description, theme] = conditions.get(code) || ['Condição não informada', 'unknown'];
    return { description, theme, icon: !isDay && theme === 'clear' ? 'moon' : !isDay && theme === 'partly' ? 'partlyNight' : theme };
  };
  const temperature = (celsius, unit = 'celsius') => finite(celsius)
    ? (unit === 'fahrenheit' ? celsius * 9 / 5 + 32 : celsius) : null;
  const format = (value, digits = 0) => finite(value)
    ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(value) : '—';
  const date = (timestamp, timezone, options) => finite(timestamp)
    ? new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, ...options }).format(new Date(timestamp * 1000)) : '—';
  const time = (timestamp, timezone) => date(timestamp, timezone, { hour: '2-digit', minute: '2-digit' });
  const direction = degrees => finite(degrees)
    ? ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'][Math.round(degrees / 45) % 8] : 'Direção indisponível';
  const validLocation = location => Boolean(location && typeof location.name === 'string' && location.name.trim()
    && finite(location.latitude) && Math.abs(location.latitude) <= 90
    && finite(location.longitude) && Math.abs(location.longitude) <= 180);

  function normalize(data) {
    const current = data?.current;
    if (!current || !finite(current.temperature_2m) || !finite(current.time) || !finite(current.weather_code)) {
      throw new Error('A Open-Meteo retornou dados incompletos. Tente novamente em instantes.');
    }
    let timezone = data.timezone || 'UTC';
    try { new Intl.DateTimeFormat('pt-BR', { timeZone: timezone }); } catch { timezone = 'UTC'; }
    const daily = (data.daily?.time || []).slice(0, 7).map((timestamp, index) => ({
      time: number(timestamp), code: number(data.daily.weather_code?.[index]),
      min: number(data.daily.temperature_2m_min?.[index]), max: number(data.daily.temperature_2m_max?.[index]),
      precipitation: number(data.daily.precipitation_sum?.[index]),
      probability: number(data.daily.precipitation_probability_max?.[index]),
      sunrise: number(data.daily.sunrise?.[index]), sunset: number(data.daily.sunset?.[index]),
    }));
    const hourly = (data.hourly?.time || []).map((timestamp, index) => ({
      time: number(timestamp), temperature: number(data.hourly.temperature_2m?.[index]),
      code: number(data.hourly.weather_code?.[index]), probability: number(data.hourly.precipitation_probability?.[index]),
      isDay: data.hourly.is_day?.[index] !== 0,
    })).filter(hour => hour.time !== null && hour.time >= current.time).slice(0, 6);
    return {
      timezone, daily, hourly,
      current: { time: current.time, temperature: current.temperature_2m, code: current.weather_code,
        isDay: current.is_day !== 0, feelsLike: number(current.apparent_temperature),
        humidity: number(current.relative_humidity_2m), wind: number(current.wind_speed_10m),
        direction: number(current.wind_direction_10m), precipitation: number(current.precipitation) },
    };
  }
  window.Brisa = { weather: { condition, temperature, format, date, time, direction, normalize, validLocation } };
})();
