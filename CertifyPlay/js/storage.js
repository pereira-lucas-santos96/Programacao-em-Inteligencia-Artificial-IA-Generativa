/* Um único documento guarda estatísticas, partida, histórico e conquistas.
 * A conclusão usa o ID da partida para não creditar XP duas vezes no reload.
 * Falhas de acesso/quota mantêm um fallback em memória e avisam a interface. */
(function (CP) {
  'use strict';
  const KEY = 'certifyplay.progress.v1';
  const fresh = () => ({ version: 1, xp: 0, completed: 0, history: [], achievements: [], modes: [], themes: [], credited: [], active: null, selectedTheme: 'all' });
  let memory = fresh();
  let available = true;
  const natural = n => Number.isSafeInteger(n) && n >= 0;
  function validate(raw) {
    if (!raw || raw.version !== 1 || !natural(raw.xp) || !natural(raw.completed)) return fresh();
    const safe = fresh();
    safe.xp = raw.xp;
    safe.completed = raw.completed;
    const allowedThemes = CP.data.themes.map(t => t.id);
    safe.modes = [...new Set((Array.isArray(raw.modes) ? raw.modes : []).filter(m => CP.data.modeNames[m]))];
    safe.themes = [...new Set((Array.isArray(raw.themes) ? raw.themes : []).filter(t => allowedThemes.includes(t)))];
    safe.achievements = [...new Set((Array.isArray(raw.achievements) ? raw.achievements : []).filter(id => CP.data.achievements.some(a => a.id === id)))];
    safe.history = (Array.isArray(raw.history) ? raw.history : []).filter(h => h && typeof h.id === 'string' && CP.data.modeNames[h.mode] && natural(h.xp) && h.xp <= 150 && typeof h.label === 'string' && Number.isFinite(Date.parse(h.date)) && (h.theme === 'all' || allowedThemes.includes(h.theme))).slice(0, 50);
    safe.credited = (Array.isArray(raw.credited) ? raw.credited : []).filter(id => typeof id === 'string').slice(-200);
    safe.active = raw.active && typeof raw.active === 'object' ? raw.active : null;
    safe.selectedTheme = allowedThemes.includes(raw.selectedTheme) ? raw.selectedTheme : 'all';
    return safe;
  }
  function read() {
    if (available) {
      try {
        const serialized = localStorage.getItem(KEY);
        memory = serialized ? validate(JSON.parse(serialized)) : fresh();
      } catch (error) {
        // JSON corrompido pode ser substituído; bloqueio de storage exige fallback.
        if (error instanceof SyntaxError) memory = fresh();
        else available = false;
      }
    }
    return memory;
  }
  function write(value) {
    memory = value;
    if (available) {
      try { localStorage.setItem(KEY, JSON.stringify(value)); }
      catch (_) { available = false; }
    }
    window.dispatchEvent(new Event('certifyplay:storage'));
    return value;
  }
  CP.storage = {
    key: KEY,
    read,
    get available() { return available; },
    saveActive(active) { const data = read(); data.active = active; return write(data); },
    selectTheme(theme) { const data = read(); data.selectedTheme = theme; return write(data); },
    finish(active, summary) {
      const data = read();
      if (data.credited.includes(active.id)) { data.active = active; write(data); return []; }
      data.xp += summary.xp;
      data.completed += 1;
      data.modes = [...new Set([...data.modes, active.mode])];
      data.themes = [...new Set([...data.themes, ...summary.themes])];
      data.history.unshift({ id: active.id, mode: active.mode, theme: active.theme, xp: summary.xp, label: summary.label, date: new Date().toISOString() });
      data.history = data.history.slice(0, 50);
      data.credited = [...data.credited, active.id].slice(-200);
      data.active = active;
      const earned = [];
      const conditions = { first: data.completed >= 1, trio: data.modes.length === 3, xp500: data.xp >= 500, perfect: active.mode === 'quiz' && summary.correct === 3, explorer: data.themes.length === 9 };
      Object.entries(conditions).forEach(([id, condition]) => {
        if (condition && !data.achievements.includes(id)) { data.achievements.push(id); earned.push(id); }
      });
      write(data);
      return earned;
    }
  };
  read();
})(window.CertifyPlay);
