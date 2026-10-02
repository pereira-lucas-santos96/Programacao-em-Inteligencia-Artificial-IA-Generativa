(function initializeNoSpoilerApi(global) {
  const apiKey = '36adb0c6';
  const baseUrl = 'https://www.omdbapi.com/';

  async function request(parameters) {
    const query = new URLSearchParams({ ...parameters, apikey: apiKey });
    const response = await fetch(`${baseUrl}?${query}`, {
      headers: { Accept: 'application/json' },
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error('A OMDb respondeu com uma falha temporária.');
    if (body.Response === 'False') {
      const message = body.Error || '';
      if (/not found/i.test(message)) throw new Error('Nenhum título foi encontrado. Tente uma busca diferente.');
      if (/api key/i.test(message)) throw new Error('A chave da OMDb é inválida, expirou ou ainda não foi ativada.');
      if (/limit/i.test(message)) throw new Error('O limite diário da OMDb foi atingido. Tente novamente amanhã.');
      throw new Error(message || 'Não foi possível consultar a OMDb.');
    }

    return body;
  }

  global.NoSpoilerApi = Object.freeze({
    search(title, page = 1, filters = {}) {
      const parameters = { s: title, page: String(page) };
      if (filters.type) parameters.type = filters.type;
      if (filters.year) parameters.y = String(filters.year);
      return request(parameters);
    },
    details(imdbId) {
      return request({ i: imdbId, plot: 'full' });
    },
  });
}(window));
