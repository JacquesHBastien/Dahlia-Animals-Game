// Magic Animals & Friends: sound effects
// All sounds are made with code (Web Audio API). No audio files needed.
// Usage: Sounds.play('transform')

const Sounds = (() => {
  let ctx = null;
  let muted = false;
  const getCtx = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());

  // One beep: frequency can slide from `from` to `to`
  function tone({ from, to = from, dur = 0.15, type = 'sine', vol = 0.2, delay = 0 }) {
    const c = getCtx(), t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // A short burst of soft noise (footsteps, whoosh)
  function noise({ dur = 0.06, vol = 0.12, freq = 1200, delay = 0, sweepTo }) {
    const c = getCtx(), t = c.currentTime + delay;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  }

  const library = {
    step:      () => noise({ dur: 0.05, vol: 0.08, freq: 900 + Math.random() * 300 }),
    pawStep:   () => noise({ dur: 0.04, vol: 0.05, freq: 1800 }),
    hop:       () => tone({ from: 300, to: 700, dur: 0.15, type: 'sine', vol: 0.18 }),
    jump:      () => tone({ from: 260, to: 620, dur: 0.18, type: 'triangle', vol: 0.18 }),
    land:      () => tone({ from: 180, to: 90, dur: 0.1, type: 'sine', vol: 0.15 }),
    flutter:   () => { for (let i = 0; i < 3; i++) noise({ dur: 0.04, vol: 0.06, freq: 2500, delay: i * 0.05 }); },
    squeak:    () => tone({ from: 1400, to: 1900, dur: 0.08, type: 'square', vol: 0.06 }),
    click:     () => tone({ from: 660, to: 880, dur: 0.07, type: 'square', vol: 0.08 }),
    select:    () => tone({ from: 520, dur: 0.05, type: 'triangle', vol: 0.12 }),
    talkOpen:  () => { tone({ from: 520, dur: 0.08, vol: 0.15 }); tone({ from: 780, dur: 0.1, vol: 0.15, delay: 0.08 }); },
    talkClose: () => { tone({ from: 780, dur: 0.08, vol: 0.12 }); tone({ from: 520, dur: 0.1, vol: 0.12, delay: 0.08 }); },
    transform: () => {
      // magical rising arpeggio + shimmer
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone({ from: f, dur: 0.25, type: 'triangle', vol: 0.14, delay: i * 0.08 }));
      for (let i = 0; i < 8; i++) tone({ from: 2000 + Math.random() * 1500, dur: 0.12, vol: 0.05, delay: 0.3 + i * 0.06 });
      tone({ from: 1047, to: 2093, dur: 0.4, type: 'sine', vol: 0.1, delay: 0.55 });
    },
    unTransform: () => [1568, 1319, 1047, 784].forEach((f, i) => tone({ from: f, dur: 0.2, type: 'triangle', vol: 0.12, delay: i * 0.07 })),
    teleportOut: () => { noise({ dur: 0.35, vol: 0.15, freq: 600, sweepTo: 4000 }); tone({ from: 300, to: 1600, dur: 0.35, vol: 0.12 }); },
    teleportBack: () => { noise({ dur: 0.25, vol: 0.12, freq: 4000, sweepTo: 600 }); tone({ from: 1200, to: 500, dur: 0.15, vol: 0.12, delay: 0.2 }); tone({ from: 880, dur: 0.12, vol: 0.12, delay: 0.35 }); },
    sticker:   () => [784, 988, 1175].forEach((f, i) => tone({ from: f, dur: 0.15, vol: 0.14, delay: i * 0.1 })),
    sceneChange: () => noise({ dur: 0.6, vol: 0.12, freq: 300, sweepTo: 3000 }),
  };

  return {
    play(name) { if (!muted && library[name]) library[name](); },
    toggleMute() { muted = !muted; return muted; },
    get names() { return Object.keys(library); },
  };
})();
if (typeof module !== 'undefined') module.exports = Sounds;
