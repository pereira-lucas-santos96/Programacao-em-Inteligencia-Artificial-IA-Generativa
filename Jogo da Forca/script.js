const THEMES = {
  historia: {
    label: "História",
    entries: [
      { word: "RENASCIMENTO", hint: "Movimento cultural europeu entre os séculos XIV e XVI.", fact: "Valorizou artes, ciências e o humanismo." },
      { word: "INDEPENDÊNCIA", hint: "Processo de ruptura política com uma metrópole.", fact: "Muitos países americanos viveram isso no século XIX." },
      { word: "REVOLUÇÃO", hint: "Mudança política e social profunda em pouco tempo.", fact: "Pode alterar sistemas econômicos e formas de governo." },
      { word: "IMPÉRIO", hint: "Organização política que controla amplos territórios.", fact: "Roma é um dos exemplos mais estudados." },
      { word: "COLONIZAÇÃO", hint: "Ocupação e exploração de territórios por potências.", fact: "Marcou a formação territorial de vários países." },
      { word: "FEUDALISMO", hint: "Sistema social e econômico da Europa medieval.", fact: "Baseado em relações de vassalagem e servidão." }
    ]
  },
  geografia: {
    label: "Geografia",
    entries: [
      { word: "RELEVO", hint: "Conjunto das formas da superfície terrestre.", fact: "Inclui planaltos, planícies e montanhas." },
      { word: "LATITUDE", hint: "Medida em graus a partir da linha do Equador.", fact: "Influencia diretamente zonas climáticas." },
      { word: "MERIDIANO", hint: "Linha imaginária que liga os polos.", fact: "Serve de base para o cálculo de fusos horários." },
      { word: "BIOMA", hint: "Conjunto de ecossistemas com clima e vegetação semelhantes.", fact: "No Brasil há Amazônia, Cerrado, Caatinga e outros biomas." },
      { word: "TRÓPICO", hint: "Linha imaginária associada à incidência solar.", fact: "Há os trópicos de Câncer e de Capricórnio." },
      { word: "HIDROGRAFIA", hint: "Estudo e distribuição das águas de uma região.", fact: "Inclui rios, lagos, mares e bacias." }
    ]
  },
  sociologia: {
    label: "Sociologia",
    entries: [
      { word: "CULTURA", hint: "Conjunto de valores, práticas e símbolos de um grupo.", fact: "Muda ao longo do tempo e varia entre sociedades." },
      { word: "IDEOLOGIA", hint: "Sistema de ideias que orienta visões de mundo.", fact: "Pode influenciar política e comportamento coletivo." },
      { word: "INSTITUIÇÕES", hint: "Estruturas sociais como família, escola e Estado.", fact: "Organizam normas e papéis sociais." },
      { word: "SOCIALIZAÇÃO", hint: "Processo de aprendizado de normas e valores sociais.", fact: "Acontece da infância até a vida adulta." },
      { word: "ESTRATIFICAÇÃO", hint: "Divisão da sociedade em camadas.", fact: "Pode ocorrer por renda, status ou poder." },
      { word: "DESIGUALDADE", hint: "Diferenças de acesso a renda, direitos e oportunidades.", fact: "Tema central em estudos sociais contemporâneos." }
    ]
  },
  filosofia: {
    label: "Filosofia",
    entries: [
      { word: "ÉTICA", hint: "Campo que reflete sobre o agir humano e o bem.", fact: "Discute valores, deveres e responsabilidades." },
      { word: "METAFÍSICA", hint: "Área que investiga a natureza do ser e da realidade.", fact: "Questiona princípios além da experiência imediata." },
      { word: "EMPIRISMO", hint: "Corrente que valoriza a experiência sensível no conhecimento.", fact: "Foi forte no pensamento moderno inglês." },
      { word: "RACIONALISMO", hint: "Corrente que destaca a razão como fonte de conhecimento.", fact: "Tem Descartes como um dos principais nomes." },
      { word: "EPISTEMOLOGIA", hint: "Estudo filosófico sobre o conhecimento.", fact: "Analisa limites, origem e validade do saber." },
      { word: "EXISTENCIALISMO", hint: "Corrente focada na liberdade e no sentido da existência humana.", fact: "Ganhou destaque no século XX." }
    ]
  }
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_ERRORS = 6;
const RANKING_KEY = "forca_ranking_v2";

const layoutEl = document.querySelector(".layout");
const playerNameEl = document.getElementById("playerName");
const themeSelectEl = document.getElementById("themeSelect");
const startButtonEl = document.getElementById("startButton");
const soundToggleButtonEl = document.getElementById("soundToggleButton");
const hudPlayerEl = document.getElementById("hudPlayer");
const hudThemeEl = document.getElementById("hudTheme");
const hudTimeEl = document.getElementById("hudTime");
const hudErrorsEl = document.getElementById("hudErrors");
const hudComboEl = document.getElementById("hudCombo");
const hudScoreEl = document.getElementById("hudScore");
const sceneEl = document.getElementById("scene");
const sceneErrorTextEl = document.getElementById("sceneErrorText");
const sceneLifeTextEl = document.getElementById("sceneLifeText");
const sceneGuideEl = document.getElementById("sceneGuide");
const dangerFillEl = document.getElementById("dangerFill");
const dangerTrackEl = document.getElementById("dangerTrack");
const wordDisplayEl = document.getElementById("wordDisplay");
const wordProgressEl = document.getElementById("wordProgress");
const hintDisplayEl = document.getElementById("hintDisplay");
const messageEl = document.getElementById("message");
const keyboardEl = document.getElementById("keyboard");
const rankingListEl = document.getElementById("rankingList");
const revealButtonEl = document.getElementById("revealButton");
const cullButtonEl = document.getElementById("cullButton");
const shieldButtonEl = document.getElementById("shieldButton");
const resultModalEl = document.getElementById("resultModal");
const modalTitleEl = document.getElementById("modalTitle");
const modalTextEl = document.getElementById("modalText");
const closeModalButtonEl = document.getElementById("closeModalButton");
const playAgainButtonEl = document.getElementById("playAgainButton");
const bgMusicEl = document.getElementById("bgMusic");
const hangmanParts = Array.from(document.querySelectorAll(".hangman-figure .part"));

let gameActive = false;
let playerName = "";
let selectedThemeKey = "geografia";
let selectedEntry = null;
let guessedLetters = new Set();
let errors = 0;
let combo = 0;
let bestCombo = 0;
let score = 0;
let startTime = 0;
let timerId = null;
let shieldActive = false;
let soundEnabled = false;
let soundRequestId = 0;
let previousFocus = null;
let sessionRanking = [];
const lastEntries = new Map();

const cardsState = {
  revealUsed: false,
  cullUsed: false,
  shieldUsed: false
};

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function pickEntry(themeKey) {
  const entries = THEMES[themeKey].entries;
  const candidates = entries.filter((entry) => entry !== lastEntries.get(themeKey));
  const entry = candidates[Math.floor(Math.random() * candidates.length)];
  lastEntries.set(themeKey, entry);
  return entry;
}

function normalizeLetter(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function wordLetters() {
  return [...normalizeLetter(selectedEntry.word)];
}

function setMessage(text, type = "neutral") {
  messageEl.textContent = text;
  if (type === "ok") {
    messageEl.style.color = "var(--ok)";
  } else if (type === "bad") {
    messageEl.style.color = "var(--bad)";
  } else {
    messageEl.style.color = "var(--ink)";
  }
}

function updateHud() {
  hudPlayerEl.textContent = playerName || "-";
  hudThemeEl.textContent = THEMES[selectedThemeKey].label;
  hudErrorsEl.textContent = String(errors);
  hudComboEl.textContent = String(combo);
  hudScoreEl.textContent = String(score);
}

function updateTimer() {
  if (!gameActive) {
    return;
  }

  const elapsed = Math.floor((performance.now() - startTime) / 1000);
  hudTimeEl.textContent = formatTime(elapsed);
}

function updateSoundButton() {
  soundToggleButtonEl.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) {
    soundToggleButtonEl.textContent = "Som: Ligado";
    soundToggleButtonEl.classList.add("primary");
  } else {
    soundToggleButtonEl.textContent = "Som: Desligado";
    soundToggleButtonEl.classList.remove("primary");
  }
}

function setSound(enabled) {
  soundEnabled = enabled;
  const requestId = ++soundRequestId;

  if (soundEnabled) {
    bgMusicEl.volume = 0.35;
    const playPromise = bgMusicEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        if (requestId !== soundRequestId) return;
        soundEnabled = false;
        updateSoundButton();
        setMessage("Não foi possível iniciar o som. Clique em Som para tentar novamente.");
      });
    }
  } else {
    bgMusicEl.pause();
    bgMusicEl.currentTime = 0;
  }

  updateSoundButton();
}

function renderWord() {
  if (!selectedEntry) {
    wordDisplayEl.textContent = "_ _ _ _ _";
    return;
  }

  const letters = [...selectedEntry.word];
  const visible = letters.map((char) => guessedLetters.has(normalizeLetter(char)));
  wordDisplayEl.replaceChildren();
  letters.forEach((char, index) => {
    const tile = document.createElement("span");
    tile.className = `letter-tile${visible[index] ? " revealed" : ""}`;
    tile.textContent = visible[index] ? char : "_";
    tile.setAttribute("aria-hidden", "true");
    wordDisplayEl.appendChild(tile);
  });
  wordDisplayEl.setAttribute("aria-label", `Palavra de ${letters.length} letras: ${letters.map((char, index) => visible[index] ? char : "lacuna").join(", ")}`);
  wordProgressEl.textContent = `${visible.filter(Boolean).length} de ${letters.length} letras reveladas`;
}

function updateScene() {
  sceneEl.dataset.errors = String(errors);
  sceneErrorTextEl.textContent = `Erros: ${errors}/${MAX_ERRORS}`;
  sceneLifeTextEl.textContent = `Tentativas restantes: ${MAX_ERRORS - errors}`;
  dangerFillEl.style.width = `${(errors / MAX_ERRORS) * 100}%`;
  dangerTrackEl.setAttribute("aria-valuenow", String(errors));
  dangerTrackEl.setAttribute("aria-valuetext", `${errors} erros de ${MAX_ERRORS}; ${MAX_ERRORS - errors} tentativas restantes`);

  hangmanParts.forEach((part) => {
    const partStep = Number(part.dataset.part);
    part.classList.toggle("visible", partStep <= errors);
  });
}

function isSolved() {
  return wordLetters().every((char) => guessedLetters.has(char));
}

function createKeyboard() {
  keyboardEl.innerHTML = "";
  ALPHABET.forEach((letter) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "key";
    btn.dataset.letter = letter;
    btn.textContent = letter;
    btn.setAttribute("aria-label", `Letra ${letter}`);
    btn.disabled = true;
    btn.addEventListener("click", () => guessLetter(letter));
    keyboardEl.appendChild(btn);
  });
}

function keyboardButtons() {
  return Array.from(keyboardEl.querySelectorAll(".key"));
}

function disableKeyboard(disabled) {
  keyboardButtons().forEach((btn) => {
    const letter = btn.dataset.letter;
    btn.disabled = disabled || guessedLetters.has(letter);
  });
}

function resetKeyboard() {
  keyboardButtons().forEach((btn) => {
    btn.classList.remove("correct", "wrong", "eliminated", "protected");
    btn.setAttribute("aria-label", `Letra ${btn.dataset.letter}`);
    btn.disabled = !gameActive;
  });
}

function paintKey(letter, status) {
  const key = keyboardEl.querySelector(`[data-letter="${letter}"]`);
  if (!key) {
    return;
  }

  key.disabled = true;
  key.classList.add(status);
  const labels = { correct: "correta", wrong: "incorreta", eliminated: "eliminada pela carta", protected: "erro bloqueado pelo escudo" };
  key.setAttribute("aria-label", `Letra ${letter}: ${labels[status]}`);
}

function sortRanking(ranking) {
  return ranking.sort((a, b) => a.errors - b.errors || a.time - b.time || b.score - a.score).slice(0, 15);
}

function loadRanking() {
  try {
    const raw = localStorage.getItem(RANKING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const valid = Array.isArray(parsed) ? parsed.filter((entry) => {
      return entry && typeof entry.name === "string" && entry.name.length <= 18 &&
        typeof entry.theme === "string" &&
        Object.values(THEMES).some((theme) => normalizeLetter(theme.label) === normalizeLetter(entry.theme)) &&
        Number.isInteger(entry.errors) && entry.errors >= 0 && entry.errors < MAX_ERRORS &&
        Number.isInteger(entry.time) && entry.time >= 0 &&
        Number.isInteger(entry.score) && entry.score >= 0;
    }) : [];
    return sortRanking([...valid, ...sessionRanking]);
  } catch (err) {
    return sortRanking([...sessionRanking]);
  }
}

function saveRanking(item) {
  const ranking = loadRanking();
  ranking.push(item);
  try {
    localStorage.setItem(RANKING_KEY, JSON.stringify(sortRanking(ranking)));
    sessionRanking = [];
    return true;
  } catch (err) {
    sessionRanking = sortRanking([...sessionRanking, item]);
    return false;
  }
}

function renderRanking() {
  const ranking = loadRanking();
  rankingListEl.innerHTML = "";

  if (!ranking.length) {
    const li = document.createElement("li");
    li.className = "rank-item";
    li.innerHTML = `
      <span class="rank-pos">-</span>
      <div>
        <div class="rank-main">Sem registros</div>
        <div class="rank-meta">Vença uma partida para entrar no ranking.</div>
      </div>
    `;
    rankingListEl.appendChild(li);
    return;
  }

  ranking.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "rank-item";
    const position = document.createElement("span");
    position.className = "rank-pos";
    position.textContent = String(index + 1);
    const details = document.createElement("div");
    const name = document.createElement("div");
    name.className = "rank-main";
    name.textContent = `${entry.name} — ${entry.theme}`;
    const meta = document.createElement("div");
    meta.className = "rank-meta";
    meta.textContent = `${formatTime(entry.time)} | ${entry.errors} erro(s) | ${entry.score} pts`;
    details.append(name, meta);
    li.append(position, details);
    rankingListEl.appendChild(li);
  });
}

function openModal(title, text) {
  previousFocus = document.activeElement;
  modalTitleEl.textContent = title;
  modalTextEl.textContent = text;
  resultModalEl.classList.remove("hidden");
  layoutEl.inert = true;
  playAgainButtonEl.focus();
}

function closeModal() {
  const wasOpen = !resultModalEl.classList.contains("hidden");
  resultModalEl.classList.add("hidden");
  layoutEl.inert = false;
  if (wasOpen) {
    const target = previousFocus && previousFocus.isConnected && !previousFocus.disabled ? previousFocus : startButtonEl;
    target.focus();
  }
}

function resetCards() {
  cardsState.revealUsed = false;
  cardsState.cullUsed = false;
  cardsState.shieldUsed = false;
  shieldActive = false;
  revealButtonEl.textContent = "Revelar letra";
  cullButtonEl.textContent = "Eliminar 3 letras";
  shieldButtonEl.textContent = "Ativar escudo";
  shieldButtonEl.classList.remove("shield-active");

  revealButtonEl.disabled = !gameActive;
  cullButtonEl.disabled = !gameActive;
  shieldButtonEl.disabled = !gameActive;
}

function updateScoreOnCorrect() {
  combo += 1;
  if (combo > bestCombo) {
    bestCombo = combo;
  }

  score += 40 + combo * 8;
}

function updateScoreOnWrong(consumedByShield) {
  combo = 0;
  if (consumedByShield) {
    score = Math.max(0, score - 10);
    return;
  }

  score = Math.max(0, score - 35);
}

function revealRandomLetter() {
  if (!gameActive || cardsState.revealUsed) {
    return;
  }

  const hidden = [...new Set(wordLetters())].filter((char) => !guessedLetters.has(char));
  if (!hidden.length) {
    return;
  }

  const letter = hidden[Math.floor(Math.random() * hidden.length)];
  cardsState.revealUsed = true;
  revealButtonEl.disabled = true;
  revealButtonEl.textContent = "Revelação usada";
  guessLetter(letter, true);
  if (gameActive) setMessage(`Carta ativada: a letra ${letter} foi revelada, sem bônus de pontos.`, "ok");
}

function removeWrongLetters() {
  if (!gameActive || cardsState.cullUsed) {
    return;
  }

  const wrongCandidates = ALPHABET.filter((letter) => {
    return !wordLetters().includes(letter) && !guessedLetters.has(letter);
  });

  if (!wrongCandidates.length) {
    return;
  }

  cardsState.cullUsed = true;
  cullButtonEl.disabled = true;
  cullButtonEl.textContent = "Eliminação usada";

  const removeCount = Math.min(3, wrongCandidates.length);
  for (let i = 0; i < removeCount; i += 1) {
    const index = Math.floor(Math.random() * wrongCandidates.length);
    const letter = wrongCandidates.splice(index, 1)[0];
    guessedLetters.add(letter);
    paintKey(letter, "eliminated");
  }

  disableKeyboard(false);
  setMessage(`Carta ativada: ${removeCount} letra(s) incorreta(s) eliminada(s), sem perder tentativas.`, "ok");
  renderWord();
}

function activateShield() {
  if (!gameActive || cardsState.shieldUsed) {
    return;
  }

  cardsState.shieldUsed = true;
  shieldButtonEl.disabled = true;
  shieldActive = true;
  shieldButtonEl.textContent = "Escudo ativo";
  shieldButtonEl.classList.add("shield-active");
  setMessage("Carta ativada: escudo pronto para bloquear 1 erro.", "ok");
}

function endGame(win) {
  if (!gameActive) return;
  updateTimer();
  gameActive = false;
  clearInterval(timerId);
  timerId = null;
  disableKeyboard(true);
  revealButtonEl.disabled = true;
  cullButtonEl.disabled = true;
  shieldButtonEl.disabled = true;
  shieldActive = false;
  shieldButtonEl.classList.remove("shield-active");
  if (cardsState.shieldUsed) shieldButtonEl.textContent = "Escudo encerrado";
  playerNameEl.disabled = false;
  themeSelectEl.disabled = false;
  startButtonEl.textContent = "Nova rodada";

  const elapsed = Math.floor((performance.now() - startTime) / 1000);
  hudTimeEl.textContent = formatTime(elapsed);
  const themeLabel = THEMES[selectedThemeKey].label;

  if (win) {
    const bonus = Math.max(0, 240 - elapsed * 2) + Math.max(0, (MAX_ERRORS - errors) * 22) + bestCombo * 16;
    score += bonus;
    updateHud();

    const saved = saveRanking({
      name: playerName,
      theme: themeLabel,
      time: elapsed,
      errors,
      score
    });
    renderRanking();

    setMessage("Vitória! Palavra descoberta.", "ok");
    sceneGuideEl.textContent = "Rodada concluída com sucesso.";
    openModal(
      `Parabéns, ${playerName}!`,
      `Você acertou “${selectedEntry.word}” em ${formatTime(elapsed)} com ${errors} erro(s) e ${score} pontos. ${themeLabel}: ${selectedEntry.fact}${saved ? "" : " O navegador não permitiu salvar o ranking; este resultado ficará disponível apenas nesta sessão."}`
    );
    return;
  }

  guessedLetters = new Set([...guessedLetters, ...wordLetters()]);
  renderWord();
  updateHud();
  setMessage(`Fim de jogo. A palavra era ${selectedEntry.word}.`, "bad");
  sceneGuideEl.textContent = "Cada rodada é uma nova chance de aprender.";
  openModal(
    "Fim de jogo",
    `${playerName}, a palavra era “${selectedEntry.word}”. Tempo: ${formatTime(elapsed)}. ${themeLabel}: ${selectedEntry.fact}`
  );
}

function guessLetter(letter, fromCard = false) {
  letter = normalizeLetter(letter);
  if (!gameActive || !/^[A-Z]$/.test(letter) || guessedLetters.has(letter)) {
    return;
  }

  guessedLetters.add(letter);

  if (wordLetters().includes(letter)) {
    paintKey(letter, "correct");
    if (!fromCard) updateScoreOnCorrect();

    if (!fromCard) {
      setMessage(`Acerto! A letra ${letter} faz parte da palavra.`, "ok");
    }
  } else {
    let consumedByShield = false;

    if (shieldActive) {
      shieldActive = false;
      consumedByShield = true;
      shieldButtonEl.textContent = "Escudo usado";
      shieldButtonEl.classList.remove("shield-active");
      paintKey(letter, "protected");
      setMessage(`Escudo ativado: o erro da letra ${letter} foi bloqueado.`, "ok");
    } else {
      errors += 1;
      paintKey(letter, "wrong");
      setMessage(`A letra ${letter} não faz parte da palavra. ${MAX_ERRORS - errors} tentativa(s) restante(s).`, "bad");
    }

    updateScoreOnWrong(consumedByShield);
    if (!consumedByShield) {
      updateScene();
    }
  }

  renderWord();
  disableKeyboard(false);
  updateHud();

  if (isSolved()) {
    endGame(true);
    return;
  }

  if (errors >= MAX_ERRORS) {
    endGame(false);
  }
}

function startGame() {
  closeModal();
  selectedThemeKey = themeSelectEl.value;
  layoutEl.dataset.theme = selectedThemeKey;
  document.body.dataset.theme = selectedThemeKey;
  playerName = playerNameEl.value.trim().slice(0, 18) || "Jogador";
  selectedEntry = pickEntry(selectedThemeKey);

  guessedLetters = new Set();
  errors = 0;
  combo = 0;
  bestCombo = 0;
  score = 0;
  gameActive = true;
  startTime = performance.now();
  playerNameEl.disabled = true;
  themeSelectEl.disabled = true;
  startButtonEl.textContent = "Reiniciar rodada";

  clearInterval(timerId);
  timerId = setInterval(updateTimer, 1000);

  if (soundEnabled && bgMusicEl.paused) {
    setSound(true);
  }

  hudTimeEl.textContent = "00:00";
  hintDisplayEl.textContent = `Dica (${THEMES[selectedThemeKey].label}): ${selectedEntry.hint}`;
  sceneGuideEl.textContent = "Cada letra conta. Você tem 6 tentativas!";

  renderWord();
  updateScene();
  updateHud();
  resetKeyboard();
  disableKeyboard(false);
  resetCards();

  setMessage("Partida iniciada. Use o teclado físico ou clique nas letras.");
  keyboardButtons()[0].focus();
}

function previewTheme() {
  if (gameActive) return;
  selectedThemeKey = themeSelectEl.value;
  layoutEl.dataset.theme = selectedThemeKey;
  document.body.dataset.theme = selectedThemeKey;
  hudThemeEl.textContent = THEMES[selectedThemeKey].label;
  hintDisplayEl.textContent = `Dica: tema ${THEMES[selectedThemeKey].label} selecionado. Clique em Iniciar.`;
  if (!gameActive) {
    sceneGuideEl.textContent = "Escolha o tema, informe o nome e clique em Iniciar.";
  }
}

startButtonEl.addEventListener("click", startGame);
soundToggleButtonEl.addEventListener("click", () => {
  setSound(!soundEnabled);
});
themeSelectEl.addEventListener("change", previewTheme);
revealButtonEl.addEventListener("click", revealRandomLetter);
cullButtonEl.addEventListener("click", removeWrongLetters);
shieldButtonEl.addEventListener("click", activateShield);
closeModalButtonEl.addEventListener("click", closeModal);
playAgainButtonEl.addEventListener("click", startGame);
document.addEventListener("keydown", (event) => {
  if (!resultModalEl.classList.contains("hidden")) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    } else if (event.key === "Tab") {
      const first = playAgainButtonEl;
      const last = closeModalButtonEl;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    return;
  }
  const target = event.target;
  if (!gameActive || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey ||
      target.isContentEditable || target.closest("input, textarea, select")) return;
  if (event.key.length === 1 && /^[A-Z]$/.test(normalizeLetter(event.key))) {
    event.preventDefault();
    guessLetter(event.key);
  }
});
resultModalEl.addEventListener("click", (event) => {
  if (event.target === resultModalEl) {
    closeModal();
  }
});

createKeyboard();
renderRanking();
previewTheme();
updateHud();
updateScene();
updateSoundButton();
resetCards();
setMessage("Defina nome e tema. Depois clique em Iniciar para jogar.");
