/* A lógica de domínio é independente da navegação; o app persiste cada ação. */
(function (CP) {
  'use strict';
  const entry = state => CP.data.forca.find(item => item.id === state.wordId);
  const errors = state => state.guessed.filter(letter => !entry(state).word.includes(letter)).length;
  function status(state) {
    const word = entry(state).word;
    if ([...word].every(letter => !/[A-Z]/.test(letter) || state.guessed.includes(letter))) return 'won';
    return errors(state) >= 6 ? 'lost' : 'playing';
  }
  CP.forca = {
    create(theme) { return { wordId: CP.ui.pick(CP.data.pool('forca', theme)).id, guessed: [], status: 'playing' }; },
    valid(state, theme) {
      return !!state && CP.data.pool('forca', theme).some(item => item.id === state.wordId) && Array.isArray(state.guessed) && state.guessed.length <= 26 && new Set(state.guessed).size === state.guessed.length && state.guessed.every(letter => /^[A-Z]$/.test(letter)) && errors(state) <= 6 && state.status === status(state);
    },
    action(state, action, value) {
      if (action !== 'letter' || state.status !== 'playing' || !/^[A-Z]$/.test(value) || state.guessed.includes(value)) return false;
      state.guessed.push(value);
      state.status = status(state);
      return true;
    },
    key(state, key) { return /^[a-zA-Z]$/.test(key) ? { action: 'letter', value: key.toUpperCase() } : null; },
    view(state) {
      const item = entry(state), mistakes = errors(state), ended = state.status !== 'playing';
      const parts = ['<circle cx="94" cy="38" r="13"/>', '<path d="M94 51v43"/>', '<path d="m94 60-23 20"/>', '<path d="m94 60 23 20"/>', '<path d="m94 94-22 32"/>', '<path d="m94 94 22 32"/>'];
      const slots = [...item.word].map(letter => /[A-Z]/.test(letter) ? `<span class="word-slot">${state.guessed.includes(letter) || ended ? letter : '<span class="sr-only">Letra oculta</span>'}</span>` : '<span class="word-slot separator" aria-label="Espaço"> </span>').join('');
      const keyStates = Object.fromEntries(state.guessed.map(letter => [letter, item.word.includes(letter) ? 'correct' : 'used-wrong']));
      return `<div class="game-panel"><p class="game-instructions">Descubra o termo com a dica abaixo. Use o teclado ou toque nas letras. Você tem seis vidas.</p><div class="game-status"><span>${CP.ui.escape(CP.data.themeName(item.theme))}</span><span aria-label="${6 - mistakes} de 6 vidas restantes"><span class="lives" aria-hidden="true">${'♥'.repeat(6 - mistakes)}${'♡'.repeat(mistakes)}</span> ${6 - mistakes}/6</span></div><div class="hangman-layout"><svg class="hangman-drawing" viewBox="0 0 150 155" role="img" aria-label="${mistakes} de 6 erros"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 145h125M35 145V12h59v13"/><g class="body-part">${parts.slice(0, mistakes).join('')}</g></g></svg><div class="word-slots" aria-label="Palavra: ${[...item.word].map(l => !/[A-Z]/.test(l) ? ' espaço ' : state.guessed.includes(l) || ended ? l : '_').join(' ')}">${slots}</div></div><div class="hint"><strong>Dica do conceito</strong><br>${item.hint}</div>${CP.ui.keyboard(keyStates, ended, false)}<div class="game-message" role="status">${state.guessed.length ? `${state.guessed[state.guessed.length - 1]}: ${item.word.includes(state.guessed[state.guessed.length - 1]) ? 'letra correta' : 'letra ausente'}. ${6 - mistakes} vidas restantes.` : 'Escolha sua primeira letra.'}</div>${ended ? CP.ui.result(this.summary(state)) : ''}</div>`;
    },
    summary(state) {
      const item = entry(state), won = state.status === 'won';
      return { xp: won ? 40 + (6 - errors(state)) * 10 : 0, title: won ? 'Conceito desbloqueado!' : 'Mais um conceito para sua coleção.', text: `O termo é ${item.word}. ${item.hint}`, label: won ? 'Termo descoberto' : 'Sem vidas', themes: [item.theme] };
    }
  };
})(window.CertifyPlay);
