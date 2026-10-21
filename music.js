// Magic Animals & Friends: background music
// A soft, happy music-box tune that loops forever. Made with code, like sounds.js,
// so there are no music files.
// Usage: Music.start() (after a tap or key press), Music.setMuted(true / false), Music.chime(72), Music.sparkle()

const Music = (() => {
  let ctx = null;        // the browser's sound maker
  let master = null;     // one volume knob for all the music (used for mute)
  let timer = null;
  let step = 0;          // which note of the song is next
  let nextTime = 0;      // when that note should play
  let muted = false;

  const VOLUME = 0.5;            // the whole song (sound effects stay louder)
  const STEP_TIME = 0.3;         // seconds per note (one "eighth note")

  // The tune. Numbers are notes (60 = middle C, 72 = the C above it), null = rest.
  // 8 bars, 8 notes each. The chords go C, A minor, F, G, twice.
  const MELODY = [
    76, null, 79, null, 84, null, 79, 76,      // C
    76, null, 72, null, 69, null, 72, 76,      // A minor
    77, null, 81, null, 84, null, 81, 77,      // F
    79, null, 74, null, 71, 74, 79, null,      // G
    84, null, 83, 81, 79, null, 76, null,      // C
    81, null, 79, 76, 72, null, 76, null,      // A minor
    77, 79, 81, null, 77, null, 72, null,      // F
    79, null, 77, null, 74, null, 71, null,    // G
  ];
  // A low note at the start and middle of every bar
  const BASS = [48, 45, 41, 43, 48, 45, 41, 43];   // C, A, F, G, C, A, F, G

  // Turns a note number into a frequency (how fast the sound wiggles)
  const frequency = note => 440 * Math.pow(2, (note - 69) / 12);

  // One soft "ding" that fades away, like a music box
  function ding(note, time, { type = 'triangle', vol = 0.06, length = 0.5 } = {}) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency(note), time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(vol, time + 0.02);       // quick start
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);  // slow fade
    osc.connect(gain).connect(master);
    osc.start(time);
    osc.stop(time + length + 0.05);
  }

  function playStep(i, time) {
    const note = MELODY[i];
    if (note !== null) ding(note, time);
    if (i % 4 === 0) ding(BASS[Math.floor(i / 8)], time, { type: 'sine', vol: 0.08, length: 0.9 });
  }

  // Every 50 ms, line up the notes for the next little bit of time
  function schedule() {
    // If the browser fell behind (tab was hidden), skip ahead instead of playing a pile of notes
    if (nextTime < ctx.currentTime - 0.1) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.2) {
      playStep(step, nextTime);
      step = (step + 1) % MELODY.length;
      nextTime += STEP_TIME;
    }
  }

  return {
    // Call this from a tap or key press (browsers only allow sound after one)
    start() {
      if (timer) return; // already playing
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      master.connect(ctx.destination);
      nextTime = ctx.currentTime + 0.1;
      timer = setInterval(schedule, 50);

      // Pause the music when the game is in the background, start again when it's back
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) ctx.suspend();
        else ctx.resume();
      });
    },
    // One clear note right now (used by the memory games). note: 72 = high C
    chime(note) {
      if (ctx) ding(note, ctx.currentTime + 0.01, { vol: 0.16, length: 0.6 });
    },
    // Dahlia's magic twirl: a quick sparkly run of notes going up
    sparkle() {
      if (!ctx) return;
      [79, 84, 88, 91, 96].forEach((note, i) => ding(note, ctx.currentTime + 0.01 + i * 0.06, { vol: 0.12, length: 0.35 }));
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.setTargetAtTime(muted ? 0 : VOLUME, ctx.currentTime, 0.05);
    },
  };
})();
