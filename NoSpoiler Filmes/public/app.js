const STORAGE_KEYS = {
  favorites: 'nospoiler:favorites',
  history: 'nospoiler:history',
};

const elements = {
  form: document.querySelector('#search-form'),
  input: document.querySelector('#search-input'),
  typeFilter: document.querySelector('#type-filter'),
  yearFilter: document.querySelector('#year-filter'),
  clearFilters: document.querySelector('#clear-filters'),
  grid: document.querySelector('#movie-grid'),
  status: document.querySelector('#status-message'),
  summary: document.querySelector('#results-summary'),
  catalogTitle: document.querySelector('#catalog-title'),
  pagination: document.querySelector('#pagination'),
  previousPage: document.querySelector('#previous-page'),
  nextPage: document.querySelector('#next-page'),
  pageIndicator: document.querySelector('#page-indicator'),
  favoritesToggle: document.querySelector('#favorites-toggle'),
  favoritesCount: document.querySelector('#favorites-count'),
  favoritesNav: document.querySelector('#favorites-nav'),
  favoritesNavCount: document.querySelector('#favorites-nav-count'),
  history: document.querySelector('#search-history'),
  historyList: document.querySelector('#history-list'),
  clearHistory: document.querySelector('#clear-history'),
  dialog: document.querySelector('#movie-dialog'),
  dialogContent: document.querySelector('#dialog-content'),
  dialogClose: document.querySelector('#dialog-close'),
};

const state = {
  search: 'Batman',
  page: 1,
  totalResults: 0,
  requestId: 0,
  view: 'search',
  filters: { type: '', year: '' },
  details: new Map(),
  favorites: loadStoredArray(STORAGE_KEYS.favorites),
  history: loadStoredArray(STORAGE_KEYS.history),
};

function loadStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveStoredArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    elements.status.textContent = 'O navegador não permitiu salvar dados locais nesta sessão.';
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function validPoster(url) {
  return typeof url === 'string' && /^https:\/\/m\.media-amazon\.com\//.test(url) ? url : '';
}

function typeLabel(type) {
  return ({ movie: 'Filme', series: 'Série', episode: 'Episódio' })[type] || 'Título';
}

function isFavorite(imdbId) {
  return state.favorites.some((movie) => movie.imdbID === imdbId);
}

function movieSummary(movie) {
  return {
    imdbID: movie.imdbID,
    Title: movie.Title,
    Year: movie.Year,
    Type: movie.Type,
    Poster: movie.Poster,
  };
}

function renderFavoriteCount() {
  const count = state.favorites.length;
  elements.favoritesCount.textContent = count;
  elements.favoritesNavCount.textContent = count;
  elements.favoritesToggle.classList.toggle('active', state.view === 'favorites');
}

function updateFavoriteButtons(imdbId) {
  const active = isFavorite(imdbId);
  document.querySelectorAll(`[data-favorite-id="${imdbId}"]`).forEach((button) => {
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    button.title = active ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    if (button.classList.contains('dialog-favorite')) {
      button.textContent = `♥ ${active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}`;
    }
  });
}

function toggleFavorite(movie) {
  if (isFavorite(movie.imdbID)) {
    state.favorites = state.favorites.filter((item) => item.imdbID !== movie.imdbID);
  } else {
    state.favorites = [movieSummary(movie), ...state.favorites];
  }

  saveStoredArray(STORAGE_KEYS.favorites, state.favorites);
  renderFavoriteCount();
  updateFavoriteButtons(movie.imdbID);

  if (state.view === 'favorites') renderFavorites();
}

function addToHistory(search) {
  state.history = [search, ...state.history.filter((item) => item.toLowerCase() !== search.toLowerCase())].slice(0, 6);
  saveStoredArray(STORAGE_KEYS.history, state.history);
  renderHistory();
}

function renderHistory() {
  elements.history.hidden = state.history.length === 0;
  elements.historyList.replaceChildren();

  state.history.forEach((search) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = search;
    button.addEventListener('click', () => {
      elements.input.value = search;
      searchMovies(search, 1);
      scrollToCatalog();
    });
    elements.historyList.append(button);
  });
}

function renderSkeletons() {
  elements.grid.innerHTML = Array.from({ length: 10 }, () => `
    <article class="movie-card skeleton" aria-hidden="true">
      <div class="poster-wrap"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </article>
  `).join('');
}

function createMovieCard(movie) {
  const article = document.createElement('article');
  const poster = validPoster(movie.Poster);
  const favorite = isFavorite(movie.imdbID);

  article.className = 'movie-card';
  article.tabIndex = 0;
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `Ver detalhes de ${movie.Title}`);
  article.dataset.imdbId = movie.imdbID;
  article.innerHTML = `
    <div class="poster-wrap">
      ${poster
        ? `<img src="${poster}" alt="Poster de ${escapeHtml(movie.Title)}" loading="lazy">`
        : `<div class="poster-fallback">${escapeHtml(movie.Title)}</div>`}
      <button class="favorite-button${favorite ? ' active' : ''}" type="button" data-favorite-id="${movie.imdbID}" aria-label="${favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-pressed="${favorite}" title="${favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">♥</button>
      <div class="rating-overlay" aria-hidden="true">
        <span data-rating>★ --</span>
        <span>Nota IMDb</span>
      </div>
    </div>
    <div class="movie-info">
      <h3 title="${escapeHtml(movie.Title)}">${escapeHtml(movie.Title)}</h3>
      <div class="movie-meta"><span>${escapeHtml(movie.Year)}</span><span>${typeLabel(movie.Type)}</span></div>
    </div>
  `;

  article.querySelector('.favorite-button').addEventListener('click', (event) => {
    event.stopPropagation();
    toggleFavorite(movie);
  });

  const open = () => openMovieDetails(movie.imdbID);
  article.addEventListener('click', open);
  article.addEventListener('keydown', (event) => {
    if (event.target !== article) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  return article;
}

async function getMovieDetails(imdbId) {
  if (state.details.has(imdbId)) return state.details.get(imdbId);

  const request = window.NoSpoilerApi.details(imdbId);
  state.details.set(imdbId, request);

  try {
    const details = await request;
    state.details.set(imdbId, details);
    return details;
  } catch (error) {
    state.details.delete(imdbId);
    throw error;
  }
}

function loadVisibleRatings(cards) {
  const loadRating = (card) => {
    getMovieDetails(card.dataset.imdbId)
      .then((details) => {
        const rating = card.querySelector('[data-rating]');
        if (rating) rating.textContent = details.imdbRating === 'N/A' ? '★ --' : `★ ${details.imdbRating}`;
      })
      .catch(() => {});
  };

  if (!('IntersectionObserver' in window)) {
    cards.forEach(loadRating);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      loadRating(entry.target);
    });
  }, { rootMargin: '180px' });

  cards.forEach((card) => observer.observe(card));
}

function updatePagination() {
  const totalPages = Math.max(1, Math.ceil(state.totalResults / 10));
  elements.pagination.hidden = state.view !== 'search' || state.totalResults <= 10;
  elements.pageIndicator.textContent = `Página ${state.page} de ${totalPages}`;
  elements.previousPage.disabled = state.page <= 1;
  elements.nextPage.disabled = state.page >= totalPages;
}

function renderCards(movies) {
  const fragment = document.createDocumentFragment();
  const cards = movies.map(createMovieCard);
  cards.forEach((card) => fragment.append(card));
  elements.grid.replaceChildren(fragment);
  loadVisibleRatings(cards);
}

function currentFilters() {
  return {
    type: elements.typeFilter.value,
    year: elements.yearFilter.value.trim(),
  };
}

function filterDescription() {
  const parts = [];
  if (state.filters.type) parts.push(typeLabel(state.filters.type).toLowerCase());
  if (state.filters.year) parts.push(`ano ${state.filters.year}`);
  return parts.length ? ` Filtros: ${parts.join(', ')}.` : '';
}

async function searchMovies(search = state.search, page = 1) {
  const requestId = ++state.requestId;
  state.search = search;
  state.page = page;
  state.view = 'search';
  state.filters = currentFilters();
  elements.catalogTitle.textContent = 'Resultados da busca';
  elements.status.className = 'status-message';
  elements.status.textContent = 'Buscando títulos...';
  elements.pagination.hidden = true;
  renderFavoriteCount();
  renderSkeletons();

  try {
    const data = await window.NoSpoilerApi.search(search, page, state.filters);
    if (requestId !== state.requestId) return;

    state.totalResults = Number.parseInt(data.totalResults, 10) || 0;
    renderCards(data.Search);
    elements.status.textContent = '';
    elements.summary.textContent = `${state.totalResults.toLocaleString('pt-BR')} resultado${state.totalResults === 1 ? '' : 's'} para “${search}”.${filterDescription()}`;
    updatePagination();
    if (page === 1) addToHistory(search);
  } catch (error) {
    if (requestId !== state.requestId) return;
    state.totalResults = 0;
    elements.grid.replaceChildren();
    elements.status.className = 'status-message error';
    elements.status.textContent = error.message;
    elements.summary.textContent = 'Tente outro título, remova os filtros ou confira a chave da API.';
  }
}

function renderFavorites() {
  state.requestId += 1;
  state.view = 'favorites';
  state.totalResults = state.favorites.length;
  elements.catalogTitle.textContent = 'Meus favoritos';
  elements.pagination.hidden = true;
  renderFavoriteCount();

  if (!state.favorites.length) {
    elements.grid.replaceChildren();
    elements.status.className = 'status-message empty-state';
    elements.status.innerHTML = '<strong>Sua lista está vazia.</strong><span>Use o coração nos cards para guardar títulos aqui.</span>';
    elements.summary.textContent = 'Seus filmes e séries preferidos ficam salvos neste navegador.';
    return;
  }

  elements.status.className = 'status-message';
  elements.status.textContent = '';
  elements.summary.textContent = `${state.favorites.length} título${state.favorites.length === 1 ? '' : 's'} salvo${state.favorites.length === 1 ? '' : 's'} neste navegador.`;
  renderCards(state.favorites);
}

function renderDetails(details) {
  const poster = validPoster(details.Poster);
  const ratings = Array.isArray(details.Ratings) ? details.Ratings : [];
  const favorite = isFavorite(details.imdbID);
  const ratingsMarkup = ratings.length
    ? ratings.map((rating) => `
        <div class="rating-box">
          <strong>${escapeHtml(rating.Value)}</strong>
          <span>${escapeHtml(rating.Source)}</span>
        </div>
      `).join('')
    : '<div class="rating-box"><strong>--</strong><span>Sem avaliações</span></div>';

  return `
    <div class="dialog-layout">
      <div class="dialog-poster">
        ${poster
          ? `<img src="${poster}" alt="Poster de ${escapeHtml(details.Title)}">`
          : `<div class="poster-fallback">${escapeHtml(details.Title)}</div>`}
      </div>
      <div class="dialog-details">
        <span class="eyebrow"><span></span> Ficha completa</span>
        <h2 id="dialog-title">${escapeHtml(details.Title)}</h2>
        <p class="dialog-subtitle">${escapeHtml(details.Year)} · ${escapeHtml(details.Runtime)} · ${escapeHtml(details.Rated)}</p>
        <div class="dialog-ratings">${ratingsMarkup}</div>
        <p class="dialog-plot">${escapeHtml(details.Plot)}</p>
        <dl class="details-list">
          <div><dt>Gênero</dt><dd>${escapeHtml(details.Genre)}</dd></div>
          <div><dt>Direção</dt><dd>${escapeHtml(details.Director)}</dd></div>
          <div><dt>Elenco</dt><dd>${escapeHtml(details.Actors)}</dd></div>
          <div><dt>Roteiro</dt><dd>${escapeHtml(details.Writer)}</dd></div>
          <div><dt>Prêmios</dt><dd>${escapeHtml(details.Awards)}</dd></div>
          <div><dt>País</dt><dd>${escapeHtml(details.Country)}</dd></div>
        </dl>
        <div class="dialog-actions">
          <button class="dialog-favorite${favorite ? ' active' : ''}" type="button" data-favorite-id="${details.imdbID}" aria-pressed="${favorite}">♥ ${favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</button>
          <a class="dialog-action" href="https://www.imdb.com/title/${details.imdbID}/" target="_blank" rel="noopener noreferrer">Ver no IMDb ↗</a>
        </div>
      </div>
    </div>
  `;
}

async function openMovieDetails(imdbId) {
  elements.dialogContent.innerHTML = '<div class="dialog-loading">Carregando detalhes do título...</div>';
  if (!elements.dialog.open) elements.dialog.showModal();

  try {
    const details = await getMovieDetails(imdbId);
    elements.dialogContent.innerHTML = renderDetails(details);
  } catch (error) {
    elements.dialogContent.innerHTML = `<div class="dialog-loading">${escapeHtml(error.message)}</div>`;
  }
}

function scrollToCatalog() {
  document.querySelector('#catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const search = elements.input.value.trim();
  if (search.length < 2) return;
  searchMovies(search, 1);
  scrollToCatalog();
});

document.querySelectorAll('[data-search]').forEach((button) => {
  button.addEventListener('click', () => {
    elements.input.value = button.dataset.search;
    searchMovies(button.dataset.search, 1);
    scrollToCatalog();
  });
});

elements.clearFilters.addEventListener('click', () => {
  elements.typeFilter.value = '';
  elements.yearFilter.value = '';
  if (elements.input.value.trim().length >= 2) searchMovies(elements.input.value.trim(), 1);
});

elements.clearHistory.addEventListener('click', () => {
  state.history = [];
  saveStoredArray(STORAGE_KEYS.history, state.history);
  renderHistory();
});

elements.favoritesToggle.addEventListener('click', renderFavorites);
elements.favoritesNav.addEventListener('click', () => {
  renderFavorites();
  scrollToCatalog();
});

elements.previousPage.addEventListener('click', () => {
  if (state.page > 1) {
    searchMovies(state.search, state.page - 1);
    scrollToCatalog();
  }
});

elements.nextPage.addEventListener('click', () => {
  const totalPages = Math.ceil(state.totalResults / 10);
  if (state.page < totalPages) {
    searchMovies(state.search, state.page + 1);
    scrollToCatalog();
  }
});

elements.dialogClose.addEventListener('click', () => elements.dialog.close());
elements.dialogContent.addEventListener('click', async (event) => {
  const favoriteButton = event.target.closest('.dialog-favorite');
  if (!favoriteButton) return;

  try {
    const details = await getMovieDetails(favoriteButton.dataset.favoriteId);
    toggleFavorite(details);
  } catch (error) {
    elements.status.textContent = error.message;
  }
});
elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});

renderHistory();
renderFavoriteCount();
searchMovies();
