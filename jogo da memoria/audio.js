/* Synthesized locally: no downloads or autoplay required. */
"use strict";
const templeAudio = (() => {
  const profiles = {
    ritual: { notes: [146.83, 174.61, 196, 220, 261.63], wave: "triangle", beat: true },
    misterio: { notes: [98, 146.83, 164.81, 196, 220], wave: "triangle", beat: false },
    sereno: { notes: [196, 220, 246.94, 261.63, 293.66], wave: "sine", beat: false },
  };
  let context, master, interval;
  let enabled = false, active = false, volume = .4, profile = "ritual";
  function tone(frequency, duration, wave = "sine", strength = .15) {
    if (!context || context.state !== "running") return;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(strength, now + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    osc.start();
    osc.stop(now + duration + .02);
  }
  function sync() {
    clearInterval(interval);
    if (!enabled || !active) {
      if (master) master.gain.setTargetAtTime(0, context.currentTime, .1);
      return;
    }
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) return;
    try {
      if (!context) {
        context = new Constructor();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
      }
      context.resume().catch(() => {});
      master.gain.setTargetAtTime(volume * .3, context.currentTime, .1);
      interval = setInterval(() => {
        const config = profiles[profile];
        tone(config.notes[Math.floor(Math.random() * config.notes.length)], 1.5, config.wave);
        if (config.beat) tone(75, .2, "sine", .25);
      }, 1900);
    } catch { /* Sound availability must never prevent a game. */ }
  }
  return {
    start() { active = true; sync(); },
    stop() { active = false; sync(); },
    setEnabled(value) { enabled = value; sync(); },
    setProfile(value) { if (profiles[value]) profile = value; },
    setVolume(value) { volume = Math.max(0, Math.min(1, value)); if (master && enabled && active) master.gain.setTargetAtTime(volume * .3, context.currentTime, .1); },
    play(kind) { if (enabled && active) tone(kind === "match" ? 660 : kind === "miss" ? 180 : 330, kind === "match" ? .35 : .12); },
  };
})();

