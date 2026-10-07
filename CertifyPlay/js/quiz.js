/* Perguntas e alternativas são embaralhadas uma vez e persistidas com a sessão. */
(function (CP) {
  'use strict';
  const question = id => CP.data.quiz.find(q => q.id === id);
  function score(state) { return state.answers.reduce((total, answer, i) => total + Number(answer === question(state.questions[i].id).correct), 0); }
  CP.quiz = {
    create(theme) {
      return { questions: CP.ui.shuffle(CP.data.pool('quiz', theme)).slice(0, 3).map(q => ({ id: q.id, order: CP.ui.shuffle([0, 1, 2, 3]) })), answers: [], index: 0, status: 'playing' };
    },
    valid(state, theme) {
      if (!state || !Array.isArray(state.questions) || state.questions.length !== 3 || new Set(state.questions.map(q => q?.id)).size !== 3) return false;
      if (!state.questions.every(q => q && CP.data.pool('quiz', theme).some(item => item.id === q.id) && Array.isArray(q.order) && q.order.length === 4 && new Set(q.order).size === 4 && q.order.every(n => Number.isInteger(n) && n >= 0 && n <= 3))) return false;
      if (!Array.isArray(state.answers) || state.answers.length > 3 || !state.answers.every(n => Number.isInteger(n) && n >= 0 && n <= 3)) return false;
      return Number.isInteger(state.index) && state.index >= 0 && state.index <= 2 && (state.answers.length === state.index || state.answers.length === state.index + 1) && (state.status === 'playing' || (state.status === 'done' && state.answers.length === 3 && state.index === 2));
    },
    action(state, action, value) {
      if (state.status !== 'playing') return false;
      if (action === 'answer' && state.answers.length === state.index) {
        const answer = Number(value);
        if (!Number.isInteger(answer) || answer < 0 || answer > 3) return false;
        state.answers.push(answer);
        return true;
      }
      if (action === 'next' && state.answers.length > state.index) {
        if (state.index === 2) state.status = 'done';
        else state.index += 1;
        return true;
      }
      return false;
    },
    key() { return null; },
    view(state) {
      const current = state.questions[state.index], q = question(current.id), answered = state.answers.length > state.index, selected = state.answers[state.index], right = selected === q.correct;
      const options = current.order.map((original, visual) => `<button class="quiz-option ${answered && original === q.correct ? 'is-correct' : ''} ${answered && original === selected && !right ? 'is-wrong' : ''}" data-action="answer" data-value="${original}" ${answered ? 'disabled' : ''}><span class="option-letter">${'ABCD'[visual]}</span><span>${q.options[original]}${answered && original === q.correct ? ' ✓ Correta' : answered && original === selected ? ' ✕ Sua resposta' : ''}</span></button>`).join('');
      return `<div class="game-panel"><div class="game-status"><span>CENÁRIO ${state.index + 1} DE 3</span><span>${score(state)} acerto(s) · ${score(state) * 50} XP ${state.status === 'done' ? 'conquistados' : 'nesta partida'}</span></div><div class="quiz-progress" role="progressbar" aria-label="Questões respondidas" aria-valuenow="${state.answers.length}" aria-valuemin="0" aria-valuemax="3"><span style="width:${state.answers.length / 3 * 100}%"></span></div><span class="scenario-tag">${CP.data.themeName(q.theme)}</span><h2 class="scenario">${q.question}</h2><div class="quiz-options" aria-label="Alternativas">${options}</div>${answered ? `<div class="quiz-feedback" role="status"><strong>${right ? '✓ Boa decisão! +50 XP' : '✕ Vamos entender esse cenário.'}</strong><p>${q.explanations[selected]}</p>${!right ? `<p><strong>Melhor caminho:</strong> ${q.options[q.correct]} ${q.explanations[q.correct]}</p>` : ''}</div>${state.status === 'playing' ? `<button class="button primary" data-action="next">${state.index === 2 ? 'Concluir quiz' : 'Próximo cenário'} →</button>` : ''}` : '<p class="game-instructions" style="margin-top:18px">Escolha a melhor ação. Cada resposta vem com uma explicação.</p>'}${state.status === 'done' ? CP.ui.result(this.summary(state)) : ''}</div>`;
    },
    summary(state) {
      const correct = score(state);
      return { xp: correct * 50, correct, title: correct === 3 ? 'Diagnóstico perfeito!' : 'Cada cenário ensina algo novo.', text: `Você acertou ${correct} de 3 cenários. Continue praticando para conectar conceitos às decisões do dia a dia.`, label: `${correct}/3 respostas corretas`, themes: [...new Set(state.questions.map(q => question(q.id).theme))] };
    }
  };
})(window.CertifyPlay);
