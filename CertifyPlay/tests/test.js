/* Execute em um perfil de navegador dedicado à verificação local. */
(async function () {
  const frame = document.getElementById('app'), lines = [], report = document.getElementById('report');
  let count = 0;
  let originalData = null, storageKey = null;
  function assert(condition, name) { if (!condition) throw new Error(name); count++; }
  function group(name) { lines.push('PASS: ' + name); report.textContent = lines.join('\n'); }
  const pause = () => new Promise(resolve => setTimeout(resolve, 30));
  async function ready() { if (!frame.contentWindow.CertifyPlay?.ui) await new Promise(resolve => frame.addEventListener('load', resolve, { once: true })); }
  try {
    await ready();
    let win = frame.contentWindow, cp = win.CertifyPlay, doc = win.document;
    storageKey = cp.storage.key;
    originalData = win.localStorage.getItem(storageKey);
    assert(cp.data.themes.length === 9, '9 temas');
    for (const theme of cp.data.themes) {
      assert(cp.data.pool('forca', theme.id).length === 4, theme.id + ': quatro termos');
      assert(cp.data.pool('termo', theme.id).length === 2, theme.id + ': duas palavras');
      assert(cp.data.pool('quiz', theme.id).length === 3, theme.id + ': três cenários');
    }
    assert(cp.data.termo.every(w => /^[A-Z]{5}$/.test(w.word)), 'Todas as respostas têm 5 letras');
    assert(cp.data.dictionary.every(w => /^[A-Z]{5}$/.test(w)), 'Vocabulário válido');
    assert(cp.data.quiz.every(q => q.options.length === 4 && q.explanations.length === 4 && q.explanations.every(Boolean)), 'Quatro alternativas justificadas');
    group('Banco de dados: cobertura dos nove temas e integridade');
    for (const item of cp.data.forca) {
      const state = { wordId: item.id, guessed: [], status: 'playing' };
      for (const letter of new Set(item.word.replace(/ /g, ''))) cp.forca.action(state, 'letter', letter);
      assert(state.status === 'won' && cp.forca.summary(state).xp === 100, item.id + ': vitória máxima');
      assert(cp.forca.valid(JSON.parse(JSON.stringify(state)), item.theme), item.id + ': restauração');
      assert(!cp.forca.action(state, 'letter', 'Z'), item.id + ': término bloqueia jogada');
    }
    const hang = { wordId: 'forca-licenciamento-0', guessed: [], status: 'playing' };
    for (const letter of 'BDEFGH') cp.forca.action(hang, 'letter', letter);
    assert(hang.status === 'lost' && cp.forca.summary(hang).xp === 0, 'Forca: seis erros encerram');
    group('Forca: todas as respostas, restauração, pontuação e limite de vidas');
    assert(cp.termo.evaluate('SSSSS', 'ASSET').join(',') === 'absent,correct,correct,absent,absent', 'Letras repetidas: limite de ocorrências');
    assert(cp.termo.evaluate('STEEL', 'ASSET').join(',') === 'present,present,absent,correct,absent', 'Verdes têm prioridade sobre amarelos');
    for (const item of cp.data.termo) {
      const state = { wordId: item.id, guesses: [], current: item.word, status: 'playing' };
      cp.termo.action(state, 'submit');
      assert(state.status === 'won' && cp.termo.summary(state).xp === 150, item.id + ': vitória');
      assert(cp.termo.valid(JSON.parse(JSON.stringify(state)), item.theme), item.id + ': restauração');
    }
    const term = { wordId: 'termo-itam-0', guesses: [], current: 'XYZAB', status: 'playing' };
    cp.termo.action(term, 'submit');
    assert(term.guesses.length === 0, 'Palpite inválido não gasta tentativa');
    for (const guess of ['PATCH', 'SCRUM', 'COBIT', 'CLOUD', 'TABLE', 'PLANO']) { term.current = guess; cp.termo.action(term, 'submit'); }
    assert(term.status === 'lost' && cp.termo.summary(term).xp === 0, 'Termo: limite de seis tentativas');
    group('Termo: respostas, letras repetidas, validação e limite de tentativas');
    for (const theme of cp.data.themes) {
      const state = cp.quiz.create(theme.id);
      assert(new Set(state.questions.map(q => q.id)).size === 3, 'Quiz sem repetições');
      for (let i = 0; i < 3; i++) {
        const q = cp.data.quiz.find(q => q.id === state.questions[i].id);
        cp.quiz.action(state, 'answer', String(q.correct));
        assert(!cp.quiz.action(state, 'answer', String(q.correct)), 'Quiz não permite responder duas vezes');
        assert(cp.quiz.valid(state, theme.id), 'Quiz restaura feedback');
        cp.quiz.action(state, 'next');
      }
      assert(state.status === 'done' && cp.quiz.summary(state).xp === 150, 'Quiz perfeito vale 150 XP');
    }
    group('Quiz: sorteio, respostas únicas, retomada e XP em todos os temas');
    win.localStorage.removeItem(cp.storage.key);
    const record = { id: 'dedup-test', mode: 'forca', theme: 'itam', state: { status: 'won' } };
    const summary = { xp: 100, label: 'Teste', themes: ['itam'] };
    cp.storage.finish(record, summary); cp.storage.finish(record, summary);
    assert(cp.storage.read().xp === 100 && cp.storage.read().completed === 1, 'XP creditado uma única vez');
    win.localStorage.setItem(cp.storage.key, '{bad json');
    assert(cp.storage.read().xp === 0, 'Recuperação de JSON inválido');
    win.localStorage.removeItem(cp.storage.key);
    const loaded = new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
    win.location.reload(); await loaded;
    win = frame.contentWindow; cp = win.CertifyPlay; doc = win.document;
    group('Persistência: deduplicação, JSON inválido e limpeza');
    async function home() { win.location.hash = 'dashboard'; await pause(); }
    async function begin(mode) { await home(); doc.querySelector(`[data-start="${mode}"]`).click(); await pause(); }
    await begin('forca');
    let state = cp.storage.read().active.state;
    const answer = cp.data.forca.find(w => w.id === state.wordId).word;
    const firstLetter = answer.replace(/ /g, '')[0];
    doc.querySelector(`[data-value="${firstLetter}"]`).click();
    assert(cp.storage.read().active.state.guessed.includes(firstLetter), 'Clique salva letra');
    const reload = new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
    win.location.reload(); await reload;
    win = frame.contentWindow; cp = win.CertifyPlay; doc = win.document;
    assert(!doc.getElementById('game-screen').hidden, 'Reload restaura tela');
    assert(cp.storage.read().active.state.guessed.includes(firstLetter), 'Reload mantém letra');
    for (const letter of new Set(answer.replace(/ /g, ''))) {
      const button = doc.querySelector(`[data-value="${letter}"]`); if (!button.disabled) button.click();
    }
    assert(doc.querySelector('.result-box') && cp.storage.read().xp === 100, 'Forca completa pela interface');
    await begin('termo');
    state = cp.storage.read().active.state;
    const word = cp.data.termo.find(w => w.id === state.wordId).word;
    const input = doc.getElementById('word-input'); input.value = word; input.dispatchEvent(new win.Event('input', { bubbles: true }));
    doc.getElementById('word-form').dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
    assert(cp.storage.read().xp === 250 && doc.querySelectorAll('.tile.correct').length === 5, 'Termo completa pela interface');
    await begin('quiz');
    for (let i = 0; i < 3; i++) {
      state = cp.storage.read().active.state;
      const q = cp.data.quiz.find(q => q.id === state.questions[i].id);
      doc.querySelector(`[data-action="answer"][data-value="${q.correct}"]`).click();
      assert(doc.querySelector('.quiz-feedback'), 'Feedback visível');
      doc.querySelector('[data-action="next"]').click();
    }
    assert(cp.storage.read().xp === 400 && cp.storage.read().completed === 3, 'Pontuação total dos três jogos');
    assert(cp.storage.read().achievements.includes('trio') && cp.storage.read().achievements.includes('perfect'), 'Conquistas desbloqueadas');
    win.location.hash = 'historico'; await pause();
    assert(doc.querySelectorAll('tbody tr').length === 3, 'Histórico completo');
    await begin('forca'); await home();
    assert(!doc.getElementById('resume-banner').hidden, 'Menu oferece retomar');
    doc.querySelector('[data-start="termo"]').click();
    assert(doc.getElementById('restart-dialog').open, 'Confirmação protege partida em andamento');
    doc.getElementById('cancel-restart').click();
    assert(cp.storage.read().active.mode === 'forca', 'Cancelamento preserva partida');
    group('Interface: três partidas, atualização da página, histórico, conquistas e reinício');
    report.textContent = `ALL PASS — ${count} assertions\n` + lines.join('\n');
    document.title = 'PASS — CertifyPlay';
  } catch (error) { report.textContent = 'FAIL: ' + error.stack + '\n' + lines.join('\n'); document.title = 'FAIL — CertifyPlay'; }
  finally {
    // O teste restaura o documento original, mesmo quando uma asserção falha.
    if (storageKey) {
      if (originalData === null) frame.contentWindow.localStorage.removeItem(storageKey);
      else frame.contentWindow.localStorage.setItem(storageKey, originalData);
    }
    frame.hidden = true;
  }
})();
