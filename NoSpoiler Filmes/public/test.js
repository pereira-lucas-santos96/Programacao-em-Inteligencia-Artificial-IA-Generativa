const resultsElement = document.querySelector('#test-results');
const summaryElement = document.querySelector('#test-summary');

async function runTest(name, testFunction) {
  const item = document.createElement('li');
  item.textContent = `${name}: executando...`;
  resultsElement.append(item);

  try {
    await testFunction();
    item.className = 'test-pass';
    item.textContent = `${name}: aprovado`;
    return true;
  } catch (error) {
    item.className = 'test-fail';
    item.textContent = `${name}: falhou — ${error.message}`;
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runTests() {
  const tests = [
    ['Cliente OMDb disponível', async () => {
      assert(window.NoSpoilerApi, 'objeto global não encontrado');
      assert(typeof window.NoSpoilerApi.search === 'function', 'busca não disponível');
      assert(typeof window.NoSpoilerApi.details === 'function', 'detalhes não disponíveis');
    }],
    ['Busca real de filmes', async () => {
      const response = await window.NoSpoilerApi.search('Batman');
      assert(Array.isArray(response.Search), 'lista de filmes ausente');
      assert(response.Search.length > 0, 'nenhum filme retornado');
      window.testMovieId = response.Search[0].imdbID;
    }],
    ['Consulta real de detalhes', async () => {
      const movieId = window.testMovieId || 'tt0372784';
      const response = await window.NoSpoilerApi.details(movieId);
      assert(response.imdbID === movieId, 'filme retornado não corresponde ao solicitado');
      assert(response.Title, 'título não retornado');
      assert(response.Plot, 'sinopse não retornada');
    }],
    ['Filtros de tipo e ano', async () => {
      const response = await window.NoSpoilerApi.search('Batman', 1, { type: 'movie', year: '2008' });
      assert(response.Search.length > 0, 'busca filtrada sem resultados');
      assert(response.Search.every((item) => item.Type === 'movie'), 'tipo incorreto no resultado');
      assert(response.Search.every((item) => item.Year === '2008'), 'ano incorreto no resultado');
    }],
    ['Tratamento de busca inexistente', async () => {
      let receivedError = false;
      try {
        await window.NoSpoilerApi.search('filme-que-nao-existe-987654321');
      } catch (error) {
        receivedError = /Nenhum título/.test(error.message);
      }
      assert(receivedError, 'erro amigável não foi apresentado');
    }],
    ['Persistência local disponível', async () => {
      const testKey = 'nospoiler:test';
      localStorage.setItem(testKey, 'ok');
      assert(localStorage.getItem(testKey) === 'ok', 'localStorage indisponível');
      localStorage.removeItem(testKey);
    }],
    ['Recursos necessários do navegador', async () => {
      assert(typeof fetch === 'function', 'Fetch API indisponível');
      assert(typeof URLSearchParams === 'function', 'URLSearchParams indisponível');
      assert(typeof IntersectionObserver === 'function', 'IntersectionObserver indisponível');
      assert(typeof HTMLDialogElement === 'function', 'elemento dialog indisponível');
    }],
  ];

  let passed = 0;
  for (const [name, testFunction] of tests) {
    if (await runTest(name, testFunction)) passed += 1;
  }

  const allPassed = passed === tests.length;
  summaryElement.className = `test-summary ${allPassed ? 'test-pass' : 'test-fail'}`;
  summaryElement.textContent = `${passed} de ${tests.length} testes aprovados.`;
  document.documentElement.dataset.tests = allPassed ? 'passed' : 'failed';
}

runTests();
