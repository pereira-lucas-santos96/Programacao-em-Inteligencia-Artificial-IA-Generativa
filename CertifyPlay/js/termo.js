/* Avaliação em duas passagens: verdes consomem ocorrências antes dos amarelos.
 * Isso evita pistas incorretas quando uma letra aparece mais de uma vez. */
(function (CP) {
  'use strict';
  const entry = state => CP.data.termo.find(item => item.id === state.wordId);
  function evaluate(guess, answer) {
    const result = Array(5).fill('absent'), remaining = {};
    [...answer].forEach((letter, i) => {
      if (guess[i] === letter) result[i] = 'correct';
      else remaining[letter] = (remaining[letter] || 0) + 1;
    });
    [...guess].forEach((letter, i) => {
      if (result[i] !== 'correct' && remaining[letter] > 0) { result[i] = 'present'; remaining[letter] -= 1; }
    });
    return result;
  }
  function status(state) {
    if (state.guesses.includes(entry(state).word)) return 'won';
    return state.guesses.length >= 6 ? 'lost' : 'playing';
  }
  CP.termo = {
    evaluate,
    create(theme) { return { wordId: CP.ui.pick(CP.data.pool('termo', theme)).id, guesses: [], current: '', status: 'playing' }; },
    valid(state, theme) {
      return !!state && CP.data.pool('termo', theme).some(item => item.id === state.wordId) && Array.isArray(state.guesses) && state.guesses.length <= 6 && state.guesses.every(g => /^[A-Z]{5}$/.test(g) && CP.data.dictionary.includes(g)) && typeof state.current === 'string' && /^[A-Z]{0,5}$/.test(state.current) && state.status === status(state) && !state.guesses.slice(0, -1).includes(entry(state).word);
    },
    action(state, action, value) {
      if (state.status !== 'playing') return false;
      if (action === 'input') { state.current = CP.data.normalize(value).replace(/[^A-Z]/g, '').slice(0, 5); return true; }
      if (action === 'letter' && /^[A-Z]$/.test(value) && state.current.length < 5) { state.current += value; return true; }
      if (action === 'delete') { state.current = state.current.slice(0, -1); return true; }
      if (action === 'submit') {
        if (state.current.length !== 5) { CP.ui.message('Digite exatamente cinco letras.'); return false; }
        if (!CP.data.dictionary.includes(state.current)) { CP.ui.message('Palavra fora do vocabulário deste jogo. Tente outro termo de TI em português ou inglês.'); return false; }
        if (state.guesses.includes(state.current)) { CP.ui.message('Você já tentou essa palavra. Experimente outra.'); return false; }
        state.guesses.push(state.current);
        state.current = '';
        state.status = status(state);
        return true;
      }
      return false;
    },
    key(state, key) {
      if (key === 'Enter') return { action: 'submit' };
      if (key === 'Backspace' || key === 'Delete') return { action: 'delete' };
      return /^[a-zA-Z]$/.test(key) ? { action: 'letter', value: key.toUpperCase() } : null;
    },
    view(state) {
      const item = entry(state), ended = state.status !== 'playing', keyStates = {}, rank = { absent: 1, present: 2, correct: 3 };
      const names = { correct: 'posição correta', present: 'outra posição', absent: 'ausente' };
      const rows = Array.from({ length: 6 }, (_, row) => {
        const guess = state.guesses[row], letters = guess || (row === state.guesses.length ? state.current : ''), colors = guess ? evaluate(guess, item.word) : [];
        return Array.from({ length: 5 }, (_, col) => {
          const letter = letters[col] || '', color = colors[col];
          if (guess && (!keyStates[letter] || rank[color] > rank[keyStates[letter]])) keyStates[letter] = color;
          return `<span class="tile ${color || (letter ? 'filled' : '')} ${!ended && row === state.guesses.length && col === state.current.length ? 'current' : ''}" aria-label="Tentativa ${row + 1}, posição ${col + 1}: ${letter || 'vazia'}${color ? ', ' + names[color] : ''}">${letter}</span>`;
        }).join('');
      }).join('');
      const last = state.guesses[state.guesses.length - 1];
      const feedback = last ? [...last].map((letter, i) => `${letter}: ${names[evaluate(last, item.word)[i]]}`).join('; ') : 'Digite uma palavra técnica para começar.';
      return `<div class="game-panel"><p class="game-instructions">Encontre a palavra de <strong>5 letras</strong> em até 6 tentativas. Aceita termos técnicos em português e inglês do vocabulário local. Palavras inválidas não gastam tentativas.</p><div class="game-status"><span>${CP.data.themeName(item.theme)}</span><span>Tentativas: ${state.guesses.length}/6</span></div><div class="hint"><strong>Dica</strong> · ${item.hint}</div><div class="termo-grid" role="group" aria-label="Grade de seis tentativas com cinco letras">${rows}</div><div class="color-legend"><span><i class="legend-dot correct"></i>Posição correta</span><span><i class="legend-dot present"></i>Outra posição</span><span><i class="legend-dot absent"></i>Ausente</span></div>${!ended ? `<form class="mobile-input" id="word-form"><label class="sr-only" for="word-input">Digite sua tentativa de cinco letras</label><input id="word-input" name="guess" type="text" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" value="${state.current}" placeholder="5 letras"><button class="button secondary" type="submit">Enviar</button></form>` : ''}${CP.ui.keyboard(keyStates, ended, true)}<p class="game-message" id="game-message" role="status">${feedback}</p>${ended ? CP.ui.result(this.summary(state)) : ''}</div>`;
    },
    summary(state) {
      const item = entry(state), won = state.status === 'won';
      return { xp: won ? 150 - (state.guesses.length - 1) * 20 : 0, title: won ? 'Você encontrou a palavra!' : 'As tentativas acabaram.', text: `A palavra é ${item.word}. ${item.hint}`, label: won ? `Acertou em ${state.guesses.length}/6` : '6 tentativas usadas', themes: [item.theme] };
    }
  };
})(window.CertifyPlay);
