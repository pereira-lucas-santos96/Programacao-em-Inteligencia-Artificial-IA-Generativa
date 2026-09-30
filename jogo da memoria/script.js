"use strict";

// DOM references, catalog and audio are kept separate from the game state.
const ui = Object.fromEntries([...document.querySelectorAll("[id]")].map(el => [el.id, el]));
ui.settingsContent.append(document.querySelector(".setup-panel"), document.querySelector(".sound-panel"));
const levels = { 6: "Explorador", 8: "Guardião", 10: "Faraó" };
const names = [ui.player1Name, ui.player2Name, ui.player3Name];
const state = {
  players: [], current: 0, pairs: 10, moves: 0, matches: 0,
  first: null, locked: false, started: false, finished: false,
  hintUsed: false, elapsed: 0, startedAt: 0, timer: null,
};
const pending = new Set();
const failedImages = new Set();
let soundEnabled = false;
let returnFocus = null;

function later(callback, delay) {
  const id = setTimeout(() => { pending.delete(id); callback(); }, delay);
  pending.add(id);
}
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function formatTime(seconds) {
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}
function announce(text) { ui.message.textContent = text; }
function startGame() {
  if (state.started) return;
  state.started = true;
  state.startedAt = performance.now();
  state.timer = setInterval(updateTime, 250);
  if (!document.hidden) templeAudio.start();
}
function updateTime() {
  if (!state.started || state.finished) return;
  state.elapsed = Math.floor((performance.now() - state.startedAt) / 1000);
  ui.timer.textContent = formatTime(state.elapsed);
}
function recordKey() { return "templo-memory-v1-solo-" + state.pairs; }
function readRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(recordKey()));
    return record && Number.isInteger(record.moves) && record.moves >= state.pairs &&
      Number.isInteger(record.seconds) && record.seconds >= 0 ? record : null;
  } catch { return null; }
}
function renderRecord() {
  const record = readRecord();
  ui.recordLabel.textContent = state.players.length !== 1 ? "Recordes disponíveis no modo solo" :
    record ? "Seu recorde: " + record.moves + " movimentos · " + formatTime(record.seconds) :
    "Solo sem dicas: estabeleça seu primeiro recorde";
}
function saveRecord() {
  if (state.players.length !== 1 || state.hintUsed) return "";
  const previous = readRecord();
  if (previous && (previous.moves < state.moves ||
    (previous.moves === state.moves && previous.seconds <= state.elapsed))) return "";
  try {
    localStorage.setItem(recordKey(), JSON.stringify({ moves: state.moves, seconds: state.elapsed }));
    return " Novo recorde pessoal!";
  } catch { return ""; }
}
function renderPlayers() {
  ui.playersBoard.replaceChildren();
  state.players.forEach((player, index) => {
    const chip = document.createElement("div");
    const active = index === state.current && !state.finished;
    chip.className = "player-chip" + (active ? " active" : "");
    const dot = document.createElement("span");
    dot.className = "player-dot dot-" + (index + 1);
    const info = document.createElement("span");
    info.className = "player-info";
    const name = document.createElement("strong");
    name.textContent = player.name; // Names are text, never interpreted as HTML.
    const status = document.createElement("small");
    status.textContent = active ? "Sua vez de explorar" : state.finished ? "Expedição concluída" : "Aguardando a vez";
    info.append(name, status);
    const score = document.createElement("span");
    score.className = "player-score";
    score.textContent = player.score;
    score.setAttribute("aria-label", player.score + " pares");
    chip.append(dot, info, score);
    ui.playersBoard.append(chip);
  });
}
function updateHud() {
  ui.moves.textContent = state.moves;
  ui.matches.textContent = state.matches;
  ui.totalPairs.textContent = state.pairs;
  ui.accuracy.textContent = state.moves ? Math.round(state.matches / state.moves * 100) + "%" : "—";
  ui.currentPlayer.textContent = state.finished ? "Expedição concluída" : state.players[state.current].name;
  ui.gameProgress.max = state.pairs;
  ui.gameProgress.value = state.matches;
  ui.progressValue.textContent = Math.round(state.matches / state.pairs * 100) + "%";
  ui.progressLabel.textContent = state.finished ? "Você revelou todos os mistérios do templo!" :
    state.matches ? state.pairs - state.matches + " pares para completar a expedição" : "Seu caminho está só começando";
  ui.hintBtn.disabled = state.hintUsed || state.locked || Boolean(state.first) || state.finished;
  renderPlayers();
}

// A distinct illustrated seal keeps each pair recognizable if a remote image fails.
function fallbackImage(item) {
  const symbols = ["☥", "♛", "☀", "☽", "✦", "◉", "❖", "✺", "✧", "♜"];
  const hue = 28 + item.id * 19;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">' +
    '<defs><radialGradient id="g"><stop stop-color="hsl(' + hue + ',30%,28%)"/><stop offset="1" stop-color="#111710"/></radialGradient></defs>' +
    '<rect width="300" height="400" fill="url(#g)"/><path d="M150 25 275 200 150 375 25 200Z" fill="none" stroke="#d6b776" opacity=".5"/>' +
    '<circle cx="150" cy="185" r="83" fill="none" stroke="#d6b776" opacity=".6"/>' +
    '<text x="150" y="212" text-anchor="middle" font-size="88" fill="#e4cd96">' + symbols[item.id - 1] + '</text>' +
    '<text x="150" y="315" text-anchor="middle" font-family="serif" font-size="22" fill="#e4cd96">SELO ' + String(item.id).padStart(2, "0") + '</text></svg>';
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
function setCardVisibility(card, visible, matched = false) {
  card.classList.toggle("flipped", visible);
  const item = cardsCatalog.find(entry => String(entry.id) === card.dataset.cardId);
  const position = card.dataset.position;
  card.setAttribute("aria-label", matched ? item.name + ", par encontrado" :
    visible ? "Carta " + position + ": " + item.name : "Carta " + position + ", virada para baixo");
  card.setAttribute("aria-pressed", String(visible));
  card.querySelector(".front").setAttribute("aria-hidden", String(!visible));
  if (matched) { card.classList.add("matched"); card.setAttribute("aria-disabled", "true"); }
}
function createCard(item, index) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";
  card.dataset.cardId = item.id;
  card.dataset.position = index + 1;
  const inner = document.createElement("span");
  inner.className = "card-inner";
  const front = document.createElement("span");
  front.className = "face front";
  const img = document.createElement("img");
  img.alt = "";
  img.width = 300;
  img.height = 400;
  img.draggable = false;
  img.decoding = "async";
  img.addEventListener("error", () => {
    failedImages.add(item.id);
    const fallback = fallbackImage(item);
    img.src = fallback;
    // Both copies must always have the same artwork, even after a network failure.
    ui.gameBoard.querySelectorAll('.card[data-card-id="' + item.id + '"] img')
      .forEach(pairImage => { pairImage.src = fallback; });
  }, { once: true });
  img.src = failedImages.has(item.id) ? fallbackImage(item) : item.imageUrl;
  const caption = document.createElement("span");
  caption.className = "card-caption";
  caption.textContent = item.name;
  front.append(img, caption);
  const back = document.createElement("span");
  back.className = "face back";
  back.setAttribute("aria-hidden", "true");
  const symbol = document.createElement("span");
  symbol.className = "back-symbol";
  symbol.textContent = "☥";
  const label = document.createElement("span");
  label.className = "back-label";
  label.textContent = "TEMPLO DA MEMÓRIA";
  back.append(symbol, label);
  inner.append(front, back);
  card.append(inner);
  setCardVisibility(card, false);
  return card;
}
function finishGame() {
  updateTime();
  state.finished = true;
  clearInterval(state.timer);
  templeAudio.stop();
  const topScore = Math.max(...state.players.map(player => player.score));
  const winners = state.players.filter(player => player.score === topScore);
  const result = state.players.length === 1 ? state.players[0].name + ", você desvendou o templo!" :
    winners.length > 1 ? "Empate entre " + winners.map(player => player.name).join(" e ") + "!" :
    winners[0].name + " venceu com " + topScore + " pares!";
  const recordMessage = saveRecord();
  announce(result + recordMessage);
  ui.message.classList.add("win");
  ui.finishText.textContent = result + recordMessage + (state.hintUsed ? " Partida com ajuda da dica." : "");
  ui.finishStats.textContent = state.moves + " movimentos · " + formatTime(state.elapsed) + " · " +
    Math.round(state.matches / state.moves * 100) + "% de precisão";
  updateHud();
  renderRecord();
  returnFocus = document.activeElement;
  ui.finishModal.showModal();
  ui.playAgainBtn.focus();
}
function chooseCard(card) {
  if (state.locked || state.finished || card === state.first || card.classList.contains("matched")) return;
  startGame();
  setCardVisibility(card, true);
  templeAudio.play("flip");
  if (!state.first) {
    state.first = card;
    announce("Agora encontre o par desta carta.");
    updateHud();
    return;
  }
  const first = state.first;
  state.moves++;
  state.locked = true;
  if (first.dataset.cardId === card.dataset.cardId) {
    state.matches++;
    state.players[state.current].score++;
    setCardVisibility(first, true, true);
    setCardVisibility(card, true, true);
    templeAudio.play("match");
    state.first = null;
    state.locked = false;
    announce("Par encontrado! " + state.players[state.current].name + " continua jogando.");
    updateHud();
    if (state.matches === state.pairs) finishGame();
    return;
  }
  announce("Observe as cartas antes de tentar novamente.");
  updateHud();
  later(() => {
    setCardVisibility(first, false);
    setCardVisibility(card, false);
    state.first = null;
    state.locked = false;
    state.current = (state.current + 1) % state.players.length;
    templeAudio.play("miss");
    updateHud();
    announce("Vez de " + state.players[state.current].name + ". Escolha duas cartas.");
  }, 1100);
}
function revealHint() {
  if (state.hintUsed || state.locked || state.first || state.finished) return;
  startGame();
  state.hintUsed = true;
  state.locked = true;
  const cards = [...ui.gameBoard.querySelectorAll(".card:not(.matched)")];
  cards.forEach(card => setCardVisibility(card, true));
  ui.hintBtn.textContent = "Dica utilizada";
  announce("Observe as cartas por 2 segundos. A dica não conta como movimento.");
  updateHud();
  later(() => {
    cards.forEach(card => setCardVisibility(card, false));
    state.locked = false;
    updateHud();
    announce("Continue a expedição! Partidas com dica não entram nos recordes.");
  }, 2000);
}
function initGame() {
  pending.forEach(clearTimeout);
  pending.clear();
  clearInterval(state.timer);
  templeAudio.stop();
  ui.finishModal.close();
  ui.settingsModal.close();
  Object.assign(state, {
    current: 0, pairs: Number(ui.difficulty.value), moves: 0, matches: 0,
    first: null, locked: false, started: false, finished: false,
    hintUsed: false, elapsed: 0, startedAt: 0, timer: null,
    players: names.slice(0, Number(ui.playerCount.value)).map((input, index) => ({
      name: input.value.trim().slice(0, 14) || "Jogador " + (index + 1), score: 0,
    })),
  });
  const selected = shuffle(cardsCatalog).slice(0, state.pairs);
  const deck = shuffle(selected.flatMap(item => [item, item]));
  ui.gameBoard.dataset.pairs = state.pairs;
  ui.gameBoard.replaceChildren(...deck.map(createCard));
  ui.levelLabel.textContent = "NÍVEL " + levels[state.pairs].toLocaleUpperCase("pt-BR");
  ui.boardCount.textContent = state.pairs * 2 + " cartas · " + state.pairs + " pares";
  ui.timer.textContent = "00:00";
  ui.hintBtn.textContent = "✧ Revelar · 1 dica";
  ui.message.classList.remove("win");
  announce("Escolha uma carta para começar sua expedição.");
  updateHud();
  renderRecord();
  fitBoard();
}
// Fit portrait cards to the available space instead of cropping the page.
function fitBoard() {
  const width = ui.gameBoard.clientWidth;
  const height = ui.gameBoard.clientHeight;
  const gap = parseFloat(getComputedStyle(ui.gameBoard).gap) || 8;
  const count = ui.gameBoard.children.length;
  if (!width || !height || !count) return;
  let best = { width: 0, columns: 4, rows: 5 };
  for (let columns = 3; columns <= Math.min(10, count); columns++) {
    const rows = Math.ceil(count / columns);
    const cardWidth = Math.min((width - gap * (columns - 1)) / columns,
      (height - gap * (rows - 1)) / rows * .75, 180);
    if (cardWidth > best.width) best = { width: cardWidth, columns, rows };
  }
  ui.gameBoard.style.gridTemplateColumns = `repeat(${best.columns}, ${best.width}px)`;
  ui.gameBoard.style.gridTemplateRows = `repeat(${best.rows}, ${best.width / .75}px)`;
}
new ResizeObserver(fitBoard).observe(ui.gameBoard);
ui.settingsBtn.addEventListener("click", () => ui.settingsModal.showModal());
ui.closeSettingsBtn.addEventListener("click", () => ui.settingsModal.close());
ui.setupForm.addEventListener("submit", event => { event.preventDefault(); initGame(); });
ui.playerCount.addEventListener("change", () => {
  names.forEach((input, index) => { input.closest("label").hidden = index >= Number(ui.playerCount.value); });
});
ui.gameBoard.addEventListener("click", event => {
  const card = event.target.closest(".card");
  if (card) chooseCard(card);
});
ui.gameBoard.addEventListener("keydown", event => {
  const card = event.target.closest(".card");
  if (!card || !["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const cards = [...ui.gameBoard.children];
  const index = cards.indexOf(card);
  const columns = getComputedStyle(ui.gameBoard).gridTemplateColumns.split(" ").length;
  const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
  const target = event.key === "Home" ? 0 : event.key === "End" ? cards.length - 1 : index + delta[event.key];
  cards[Math.max(0, Math.min(cards.length - 1, target))].focus();
});
ui.hintBtn.addEventListener("click", revealHint);
ui.playAgainBtn.addEventListener("click", () => { initGame(); ui.gameBoard.querySelector(".card").focus(); });
ui.closeModalBtn.addEventListener("click", () => ui.finishModal.close());
ui.finishModal.addEventListener("close", () => { if (state.finished && returnFocus?.isConnected) returnFocus.focus(); });
ui.soundToggleBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  ui.soundToggleBtn.textContent = soundEnabled ? "Som ligado" : "Som desligado";
  ui.soundToggleBtn.setAttribute("aria-pressed", String(soundEnabled));
  templeAudio.setEnabled(soundEnabled);
});
ui.soundProfile.addEventListener("change", () => templeAudio.setProfile(ui.soundProfile.value));
ui.volumeSlider.addEventListener("input", () => {
  ui.volumeValue.value = ui.volumeSlider.value + "%";
  templeAudio.setVolume(Number(ui.volumeSlider.value) / 100);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) templeAudio.stop();
  else if (state.started && !state.finished) templeAudio.start();
});
window.addEventListener("pagehide", () => templeAudio.stop());
initGame();

