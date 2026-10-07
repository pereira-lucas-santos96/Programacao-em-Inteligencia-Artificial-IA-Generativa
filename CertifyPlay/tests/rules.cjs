// Verificações de domínio em Node, sem dependências nem acesso ao perfil real.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
let assertions = 0;
const check = (condition, label) => { assert.ok(condition, label); assertions++; };
function environment(blocked = false) {
  const values = new Map();
  const context = vm.createContext({
    console, Event: class Event {},
    dispatchEvent() {},
    localStorage: {
      getItem(key) { if (blocked) throw new Error('Storage blocked'); return values.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('Storage blocked'); values.set(key, value); },
      removeItem(key) { values.delete(key); }
    }
  });
  context.window = context;
  for (const filename of ['data.js', 'storage.js', 'forca.js', 'termo.js', 'quiz.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', filename), 'utf8'), context, { filename });
  }
  context.CertifyPlay.ui = { pick: items => items[0], shuffle: items => [...items].reverse(), message() {} };
  return { cp: context.CertifyPlay, values, context };
}
for (const file of fs.readdirSync(path.join(root, 'js'))) {
  new vm.Script(fs.readFileSync(path.join(root, 'js', file), 'utf8'), { filename: file });
}
console.log('PASS: syntax of all six JavaScript modules');
const { cp, values } = environment();
check(cp.data.themes.length === 9, 'Nine themes');
check(cp.data.forca.length === 36 && cp.data.termo.length === 18 && cp.data.quiz.length === 27, 'Complete content');
check(cp.data.dictionary.every(w => /^[A-Z]{5}$/.test(w)), 'Five-letter dictionary');
for (const theme of cp.data.themes) {
  check(cp.data.pool('forca', theme.id).length === 4, 'Four hangman words per theme');
  check(cp.data.pool('termo', theme.id).length === 2, 'Two wordle answers per theme');
  check(cp.data.pool('quiz', theme.id).length === 3, 'Three questions per theme');
}
for (const q of cp.data.quiz) {
  check(q.options.length === 4 && q.explanations.length === 4 && q.explanations.every(Boolean), 'Four justified answers');
  check(q.correct >= 0 && q.correct < 4, 'Valid correct answer');
}
for (const item of cp.data.forca) {
  const state = { wordId: item.id, guessed: [], status: 'playing' };
  for (const letter of new Set(item.word.replace(/ /g, ''))) cp.forca.action(state, 'letter', letter);
  check(state.status === 'won' && cp.forca.summary(state).xp === 100, item.id + ' win');
  check(cp.forca.valid(JSON.parse(JSON.stringify(state)), item.theme), item.id + ' restore');
  check(!cp.forca.action(state, 'letter', 'Z'), 'Game stops after victory');
}
const hang = { wordId: 'forca-licenciamento-0', guessed: [], status: 'playing' };
cp.forca.action(hang, 'letter', 'B'); cp.forca.action(hang, 'letter', 'B');
check(hang.guessed.length === 1, 'Repeated letter costs no additional life');
for (const letter of 'DEFGH') cp.forca.action(hang, 'letter', letter);
check(hang.status === 'lost' && cp.forca.summary(hang).xp === 0, 'Six mistakes lose');
console.log('PASS: all hangman words, lives, repeated letters, XP, restored states');
check(cp.termo.evaluate('SSSSS', 'ASSET').join() === 'absent,correct,correct,absent,absent', 'Repeated-letter count');
check(cp.termo.evaluate('STEEL', 'ASSET').join() === 'present,present,absent,correct,absent', 'Greens before yellows');
// Property: positive matches cannot exceed the answer count for a letter.
for (const answer of cp.data.termo.map(w => w.word)) {
  for (const guess of cp.data.dictionary) {
    const colors = cp.termo.evaluate(guess, answer);
    for (const letter of new Set(guess)) {
      const marked = [...guess].filter((l, i) => l === letter && colors[i] !== 'absent').length;
      const expected = Math.min([...guess].filter(l => l === letter).length, [...answer].filter(l => l === letter).length);
      check(marked === expected, `${answer}/${guess}: occurrence allocation for ${letter}`);
    }
  }
}
for (const item of cp.data.termo) {
  const state = { wordId: item.id, guesses: [], current: item.word, status: 'playing' };
  cp.termo.action(state, 'submit');
  check(state.status === 'won' && cp.termo.summary(state).xp === 150, item.id + ' win');
  check(cp.termo.valid(JSON.parse(JSON.stringify(state)), item.theme), item.id + ' restore');
}
const term = { wordId: 'termo-itam-0', guesses: [], current: 'XYZAB', status: 'playing' };
cp.termo.action(term, 'submit');
check(term.guesses.length === 0, 'Invalid word consumes no attempt');
for (const guess of ['PATCH', 'SCRUM', 'COBIT', 'CLOUD', 'TABLE', 'PLANO']) { term.current = guess; cp.termo.action(term, 'submit'); }
check(term.status === 'lost' && cp.termo.summary(term).xp === 0, 'Six wrong words lose');
console.log('PASS: all Wordle answers, dictionary, occurrence properties, attempts, XP');
for (const theme of cp.data.themes) {
  for (const perfect of [true, false]) {
    const state = cp.quiz.create(theme.id);
    check(new Set(state.questions.map(q => q.id)).size === 3, 'Unique questions');
    for (let i = 0; i < 3; i++) {
      const q = cp.data.quiz.find(q => q.id === state.questions[i].id);
      cp.quiz.action(state, 'answer', String(perfect ? q.correct : (q.correct + 1) % 4));
      check(!cp.quiz.action(state, 'answer', String(q.correct)), 'Answers cannot change');
      check(cp.quiz.valid(JSON.parse(JSON.stringify(state)), theme.id), 'Restore selected answer');
      cp.quiz.action(state, 'next');
    }
    check(state.status === 'done' && cp.quiz.summary(state).xp === (perfect ? 150 : 0), 'Quiz final score');
  }
}
console.log('PASS: every quiz question, right/wrong paths, progress and scoring');
for (let i = 0; i < 60; i++) {
  const record = { id: `test-${i}`, mode: ['forca', 'termo', 'quiz'][i % 3], theme: cp.data.themes[i % 9].id, state: { status: 'done' } };
  const summary = { xp: 100, correct: 3, label: 'Completed', themes: [record.theme] };
  cp.storage.finish(record, summary); cp.storage.finish(record, summary);
}
check(cp.storage.read().xp === 6000 && cp.storage.read().completed === 60, 'No duplicate XP');
check(cp.storage.read().history.length === 50, 'History bounded at 50');
check(cp.storage.read().achievements.length === 5, 'All achievements earned');
check(cp.storage.read().themes.length === 9 && cp.storage.read().modes.length === 3, 'Lifetime stats retained');
values.set(cp.storage.key, '{broken');
check(cp.storage.read().xp === 0, 'Corrupt JSON recovery');
cp.storage.saveActive({ id: 'saved', state: term });
check(cp.storage.read().active.state.guesses.length === 6, 'Active session persisted');
values.delete(cp.storage.key);
check(cp.storage.read().active === null, 'External storage removal resets state');
const fallback = environment(true).cp;
fallback.storage.finish({ id: 'memory', mode: 'forca', theme: 'itam' }, { xp: 100, label: 'Win', themes: ['itam'] });
check(!fallback.storage.available && fallback.storage.read().xp === 100, 'Blocked storage retains session in memory');
console.log('PASS: persistence, duplicate prevention, history, achievements, corrupt/blocked storage');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  check(fs.existsSync(path.resolve(root, match[1])), 'Local referenced file exists: ' + match[1]);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
check(new Set(ids).size === ids.length, 'Unique HTML IDs');
console.log(`ALL PASS: ${assertions} assertions`);
