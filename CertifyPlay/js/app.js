/* SPA sem dependências e sem fetch/import: abre também diretamente por file://.
 * Só este módulo coordena DOM, navegação e persistência. */
(function (CP) {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const content = $('#game-content');
  let active = null, route = 'dashboard', pendingStart = null, toastTimer;
  const escape = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  CP.ui = {
    escape,
    pick(items) { return items[Math.floor(Math.random() * items.length)]; },
    shuffle(items) {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
    keyboard(states, ended, wordle) {
      return `<div class="keyboard" role="group" aria-label="Teclado virtual">${['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, i) => `<div class="keyboard-row">${wordle && i === 2 ? `<button class="key key-wide" data-action="submit" ${ended ? 'disabled' : ''}>ENTER</button>` : ''}${[...row].map(letter => {
        const state = states[letter] || '';
        const label = { correct: wordle ? 'posição correta' : 'correta', present: 'outra posição', absent: 'ausente', 'used-wrong': 'ausente' }[state];
        return `<button class="key ${state}" data-action="letter" data-value="${letter}" aria-label="${letter}${label ? ', ' + label : ''}" ${ended || (!wordle && state) ? 'disabled' : ''}>${letter}</button>`;
      }).join('')}${wordle && i === 2 ? `<button class="key key-wide" data-action="delete" aria-label="Apagar última letra" ${ended ? 'disabled' : ''}>⌫</button>` : ''}</div>`).join('')}</div>`;
    },
    result(summary) {
      return `<div class="result-box" role="status"><h2>${escape(summary.title)}</h2><p>${escape(summary.text)}</p><span class="result-xp">+${summary.xp} XP</span><p>Pontuação registrada. Que tal outro desafio?</p><button class="button primary" data-action="replay">Jogar novamente →</button><a href="#dashboard" class="button secondary">Voltar ao menu</a></div>`;
    },
    message(text) { const element = $('#game-message'); if (element) element.textContent = text; },
    toast(text) {
      clearTimeout(toastTimer);
      $('#toast').textContent = text;
      $('#toast').hidden = false;
      toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
    }
  };
  function validActive(value) {
    try {
      return value && typeof value.id === 'string' && value.id.length < 150 && ['forca', 'termo', 'quiz'].includes(value.mode) && (value.theme === 'all' || CP.data.themes.some(t => t.id === value.theme)) && CP[value.mode].valid(value.state, value.theme);
    } catch (_) { return false; }
  }
  function isPlaying() { return active && active.state.status === 'playing'; }
  function updateStats() {
    const data = CP.storage.read();
    $('#stat-xp').textContent = data.xp.toLocaleString('pt-BR');
    $('#stat-games').textContent = data.completed.toLocaleString('pt-BR');
    $('#stat-achievements').textContent = data.achievements.length;
    $('#sidebar-level').textContent = `Nível ${Math.floor(data.xp / 500) + 1}`;
    $('#storage-warning').hidden = CP.storage.available;
    $('#resume-banner').hidden = !isPlaying();
  }
  function renderGame() {
    if (!active) return;
    // Restaura o foco após recriar os controles, incluindo a entrada mobile.
    const focused = document.activeElement;
    const inputFocused = focused?.id === 'word-input';
    const action = content.contains(focused) ? focused.dataset.action : null;
    const value = focused?.dataset.value;
    const selection = inputFocused ? focused.selectionStart : null;
    $('#game-title').textContent = CP.data.modeNames[active.mode];
    $('#game-theme').textContent = CP.data.themeName(active.theme);
    content.innerHTML = CP[active.mode].view(active.state);
    if (inputFocused && $('#word-input')) {
      $('#word-input').focus({ preventScroll: true });
      $('#word-input').setSelectionRange(selection, selection);
    } else if (action) {
      const matching = [...content.querySelectorAll('[data-action]')].find(el => el.dataset.action === action && el.dataset.value === value && !el.disabled);
      const next = matching || content.querySelector('[data-action="next"], [data-action="replay"], .key:not(:disabled), .quiz-option:not(:disabled)');
      next?.focus({ preventScroll: true });
    }
  }
  function persistAndRender() {
    if (active.state.status === 'playing') CP.storage.saveActive(active);
    else {
      const earned = CP.storage.finish(active, CP[active.mode].summary(active.state));
      if (earned.length) CP.ui.toast(`Conquista desbloqueada: ${earned.map(id => CP.data.achievements.find(a => a.id === id).title).join(' · ')}`);
    }
    renderGame();
    updateStats();
  }
  function start(mode, theme) {
    active = { id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`, mode, theme, state: CP[mode].create(theme) };
    CP.storage.saveActive(active);
    if (location.hash === '#partida') navigate();
    else location.hash = 'partida';
  }
  function requestStart(mode, theme) {
    if (isPlaying()) {
      pendingStart = { mode, theme };
      $('#restart-dialog').showModal();
    } else start(mode, theme);
  }
  function perform(action, value) {
    if (!active || route !== 'partida') return;
    if (action === 'replay') { requestStart(active.mode, active.theme); return; }
    if (CP[active.mode].action(active.state, action, value)) persistAndRender();
  }
  function renderHistory() {
    const rows = CP.storage.read().history;
    $('#history-content').innerHTML = rows.length ? `<div class="history-table-wrap"><table><caption class="sr-only">Últimas partidas concluídas</caption><thead><tr><th scope="col">Data</th><th scope="col">Modalidade</th><th scope="col">Tema</th><th scope="col">Resultado</th><th scope="col">XP</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escape(new Date(row.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }))}</td><td>${escape(CP.data.modeNames[row.mode])}</td><td>${escape(CP.data.themeName(row.theme))}</td><td>${escape(row.label)}</td><td class="xp-cell">+${row.xp}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state"><h2>Sua jornada começa com uma partida.</h2><p>Os desafios concluídos aparecerão aqui.</p><a class="button primary" href="#jogar">Escolher desafio →</a></div>';
  }
  function renderAchievements() {
    const earned = CP.storage.read().achievements;
    $('#achievements-content').innerHTML = CP.data.achievements.map(item => `<article class="achievement ${earned.includes(item.id) ? 'unlocked' : ''}"><div class="stat-icon ${earned.includes(item.id) ? 'green' : 'blue'}" aria-hidden="true">${item.icon}</div><h2>${item.title}</h2><p>${item.description}</p><span class="achievement-status">${earned.includes(item.id) ? '✓ Desbloqueada' : '○ Continue praticando'}</span></article>`).join('');
  }
  function navigate() {
    route = location.hash.slice(1) || 'dashboard';
    if (!['dashboard', 'jogar', 'partida', 'historico', 'conquistas'].includes(route) || (route === 'partida' && !active)) {
      location.hash = 'dashboard';
      return;
    }
    const screens = { dashboard: 'dashboard-screen', jogar: 'dashboard-screen', partida: 'game-screen', historico: 'history-screen', conquistas: 'achievements-screen' };
    document.querySelectorAll('.screen').forEach(screen => { screen.hidden = screen.id !== screens[route]; });
    document.querySelectorAll('[data-nav]').forEach(link => {
      const selected = link.dataset.nav === (route === 'partida' ? 'jogar' : route);
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    const labels = { dashboard: 'Visão geral', jogar: 'Área de jogos', partida: 'Área de jogos', historico: 'Meu histórico', conquistas: 'Conquistas' };
    $('#page-label').textContent = labels[route];
    document.title = `${labels[route]} · CertifyPlay`;
    if (route === 'partida') renderGame();
    if (route === 'historico') renderHistory();
    if (route === 'conquistas') renderAchievements();
    updateStats();
    $('#main').focus({ preventScroll: true });
    if (route === 'jogar') $('#game-picker').scrollIntoView({ behavior: 'auto', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'auto' });
  }
  $('#theme-select').insertAdjacentHTML('beforeend', CP.data.themes.map(theme => `<option value="${theme.id}">${theme.name}</option>`).join(''));
  $('#theme-select').value = CP.storage.read().selectedTheme;
  $('#theme-select').addEventListener('change', event => CP.storage.selectTheme(event.target.value));
  document.querySelectorAll('[data-start]').forEach(button => button.addEventListener('click', () => requestStart(button.dataset.start, $('#theme-select').value)));
  $('#restart-game').addEventListener('click', () => { if (active) requestStart(active.mode, active.theme); });
  $('#resume-game').addEventListener('click', () => { location.hash = 'partida'; });
  $('#cancel-restart').addEventListener('click', () => { pendingStart = null; $('#restart-dialog').close(); });
  $('#restart-dialog').addEventListener('cancel', () => { pendingStart = null; });
  $('#confirm-restart').addEventListener('click', () => {
    const next = pendingStart;
    pendingStart = null;
    $('#restart-dialog').close();
    if (next) start(next.mode, next.theme);
  });
  content.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled) perform(button.dataset.action, button.dataset.value);
  });
  content.addEventListener('input', event => {
    if (event.target.id === 'word-input') perform('input', event.target.value);
  });
  content.addEventListener('submit', event => {
    if (event.target.id === 'word-form') { event.preventDefault(); perform('submit'); }
  });
  document.addEventListener('keydown', event => {
    if (route !== 'partida' || !isPlaying() || $('#restart-dialog').open || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable) return;
    // Enter em botões/links mantém a ativação nativa e evita enviar duas vezes.
    if (event.key === 'Enter' && event.target.closest('button, a')) return;
    const mapped = CP[active.mode].key(active.state, event.key);
    if (mapped) { event.preventDefault(); perform(mapped.action, mapped.value); }
  });
  window.addEventListener('hashchange', navigate);
  window.addEventListener('certifyplay:storage', () => { $('#storage-warning').hidden = CP.storage.available; });
  window.addEventListener('storage', event => {
    if (event.key !== CP.storage.key && event.key !== null) return;
    const saved = CP.storage.read();
    active = validActive(saved.active) ? saved.active : null;
    $('#theme-select').value = saved.selectedTheme;
    navigate();
  });
  const saved = CP.storage.read().active;
  if (validActive(saved)) active = saved;
  else if (saved) { CP.storage.saveActive(null); CP.ui.toast('A partida salva não é compatível. Seu histórico e XP foram preservados.'); }
  navigate();
})(window.CertifyPlay);
