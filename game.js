// Magic Animals & Friends: the game
// Game designed by Dahlia.
//
// How it works:
//   1. We load the pictures (SVG files).
//   2. Every frame (60 times a second) we UPDATE (move things)
//      and then DRAW (paint everything on the canvas).

// ---------- Screen size ----------
// The game always thinks the screen is 960 x 540 (16:9).
// We stretch the canvas to fit the window, so it works on a laptop and an iPad.
const VIEW_W = 960;
const VIEW_H = 540;
const GROUND_Y = 450; // the top of the path in every scene

const stage = document.getElementById('stage'); // the box that holds the canvas and buttons
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvasToWindow() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  const pixelRatio = window.devicePixelRatio || 1; // sharp on Retina screens

  // How big the game looks on the page
  stage.style.width = Math.floor(VIEW_W * scale) + 'px';
  stage.style.height = Math.floor(VIEW_H * scale) + 'px';
  stage.style.setProperty('--u', scale + 'px'); // lets style.css size things in game pixels

  // How many real pixels it has inside
  canvas.width = Math.floor(VIEW_W * scale * pixelRatio);
  canvas.height = Math.floor(VIEW_H * scale * pixelRatio);

  // After this, we can draw using 960 x 540 numbers and it just fits
  ctx.setTransform(scale * pixelRatio, 0, 0, scale * pixelRatio, 0, 0);
}
window.addEventListener('resize', fitCanvasToWindow);
fitCanvasToWindow();

// ---------- Pictures ----------
// loadImage gives back an <img>. It shows up on screen once it has loaded.
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const images = {
  dahlia: loadImage('assets/dahlia.svg'),
  glitter: loadImage('assets/glitter.svg'),
  puff: loadImage('assets/teleport-puff.svg'),
  soundOn: loadImage('assets/icon-sound-on.svg'),
  soundOff: loadImage('assets/icon-sound-off.svg'),
  cloudStep: loadImage('assets/cloud-step.svg'),
  kite: loadImage('assets/kite.svg'),
  pin: loadImage('assets/bowling-pin.svg'),
  carrot: loadImage('assets/carrot.svg'),
  frog: loadImage('assets/frog.svg'),
  gem: loadImage('assets/gem.svg'),
  arrow: loadImage('assets/icon-arrow.svg'),
};
const sceneImages = SCENES.map(scene => loadImage(scene.background));

// Each animal gets its picture loaded, plus a few things that change while playing
for (const animal of ANIMALS) {
  animal.img = loadImage(animal.image);
  animal.dahliaImg = loadImage(animal.dahliaImage);
  animal.idlePhase = Math.random() * 10; // so the animals don't all bob at the same time
}

// Canvas text needs the font to be loaded before it can use it
document.fonts.load('700 22px Fredoka');

// ---------- Keyboard ----------
// keys.ArrowLeft is true while the left arrow is held down.
// justPressed[' '] is true for just one frame when Space is pressed
// (so holding a key down counts as one press, not sixty).
const keys = {};
const justPressed = {};

// The keyboard and the touch buttons both use these two
function pressKey(key) {
  if (!keys[key]) justPressed[key] = true;
  keys[key] = true;
}
function releaseKey(key) {
  keys[key] = false;
}

// Extra keys that do the same thing: W A S D work like the arrows, Enter works like Space
const KEY_ALIASES = { w: 'ArrowUp', a: 'ArrowLeft', s: 'ArrowDown', d: 'ArrowRight', enter: ' ' };
const gameKey = e => KEY_ALIASES[e.key.toLowerCase()] || e.key;

window.addEventListener('keydown', e => {
  if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); // don't scroll the page
  // On the title screen, Space or Enter is the same as pressing Play
  if (!started) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      startGame();
    }
    return;
  }
  pressKey(gameKey(e));
});
window.addEventListener('keyup', e => releaseKey(gameKey(e)));

// ---------- Title screen ----------
// The game waits on the title screen until Play is pressed.
// Browsers only allow sound after a tap or key press, so the Play button
// is also what turns the sound on.
let started = false;
const titleScreen = document.getElementById('title');
const playButton = document.getElementById('play');

function startGame() {
  if (started) return;
  started = true;
  Sounds.play('click');           // the first sound wakes up the browser's audio
  Music.start();                  // background music (keeps playing from now on)
  titleScreen.hidden = true;
  if (isTouch) touchControls.hidden = false;
  // Show "Sunny Meadow" now (or "Level 2!" when she's carrying on from a saved level)
  sceneTitle = { name: level > 1 ? `Level ${level}!` : SCENES[sceneIndex].name, t: 0 };
}
playButton.addEventListener('click', startGame);
playButton.focus();

// ---------- Touch buttons ----------
// Only on iPads, phones and other touch screens
const isTouch = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
const touchControls = document.getElementById('touch');

// Title screen: a short "how to play" line that matches the device
document.getElementById('howto').textContent = isTouch
  ? 'Tap the arrows to move. Tap the sparkle for magic!'
  : 'Arrow keys (or W A S D) to move. Space for magic!';

// Each button acts like holding down a key: press = key down, let go = key up
for (const button of touchControls.querySelectorAll('button')) {
  const key = button.dataset.key;
  const down = e => {
    e.preventDefault();
    button.classList.add('held');
    pressKey(key);
  };
  const up = () => {
    button.classList.remove('held');
    releaseKey(key);
  };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointercancel', up);
  button.addEventListener('pointerleave', up); // finger slid off the button
  button.addEventListener('contextmenu', e => e.preventDefault()); // no menu on long press
}

// ---------- Mouse and finger taps ----------
// Turns a tap on the page into game numbers (0-960, 0-540)
function tapToGame(e) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - box.left) * (VIEW_W / box.width),
    y: (e.clientY - box.top) * (VIEW_H / box.height),
  };
}

canvas.addEventListener('pointerdown', e => {
  const tap = tapToGame(e);

  // Tapped a button in the talk box or the "All done!" sign? Pick it,
  // and press Space for her (the game does the rest on the next frame).
  const box = talk || finale || puzzle;
  if (box) {
    tapButtons.forEach((b, i) => {
      if (tap.x >= b.x && tap.x <= b.x + b.w && tap.y >= b.y && tap.y <= b.y + b.h) {
        box.choice = i;
        justPressed[' '] = true;
      }
    });
  }
  // Tapped the mute button? (It's hidden while the talk box is open.)
  if (!talk && !puzzle && Math.hypot(tap.x - MUTE_BUTTON.x, tap.y - MUTE_BUTTON.y) <= MUTE_BUTTON.r) {
    muted = Sounds.toggleMute();
    Music.setMuted(muted);       // the mute button turns off the music too
    Sounds.play('click'); // you only hear this when turning sound back on
  }
});

// ---------- Mute ----------
const MUTE_BUTTON = { x: VIEW_W - 42, y: 44, r: 26 }; // round button, top right corner
let muted = false;

// ---------- Friend Book ----------
// A sticker for every animal Dahlia has become, and a gold star on it when she
// finishes that animal's challenge. Saved in the browser (localStorage),
// so they're still there next time she plays.
const STICKERS_KEY = 'magicAnimals.stickers';
const STARS_KEY = 'magicAnimals.stars';
const STICKER_DELAY = 0.5; // the sticker arrives a moment after she changes
const STAR_DELAY = 1.2;    // the star arrives after the confetti starts

let stickers = loadList(STICKERS_KEY); // names of the animals she has become, like ['Cat']
let stars = loadList(STARS_KEY);       // names of the animals whose challenge she finished
let newSticker = null;                 // { name, t } while a new sticker is popping in
let newStar = null;                    // { name, t } while a new star is popping in

// ---------- Gems ----------
// Sparkly gems hidden in every world, different ones in every level ("gems" in levels.js).
// Some are easy to reach, some need a jump, a climb or wings. Saved like the stickers.
const GEMS_KEY = 'magicAnimals.gems';
let gems = loadList(GEMS_KEY);  // the ones she found, like ['2-0-3'] (level 2, scene 0, gem 3)
let gemPop = 0;                 // makes the gem counter bounce when she finds one

function updateGems(dt) {
  gemPop = Math.max(0, gemPop - dt);
  const height = player.move.height;
  (SCENES[sceneIndex].gems || []).forEach((gem, i) => {
    const id = `${level}-${sceneIndex}-${i}`;
    if (gems.includes(id)) return;
    // Is the gem touching Dahlia? (anywhere from her feet to the top of her head)
    const touching = Math.abs(player.x - gem.x) < 40 && gem.y > player.y - height - 15 && gem.y < player.y + 10;
    if (touching) {
      gems.push(id);
      saveList(GEMS_KEY, gems);
      Sounds.play('select');
      makeSparkles(gem.x, gem.y, 8);
      gemPop = POP_TIME;
      if (levelComplete()) finaleWait = FINALE_DELAY; // the very last gem finished the level!
    }
  });
}

function drawGems() {
  (SCENES[sceneIndex].gems || []).forEach((gem, i) => {
    if (gems.includes(`${level}-${sceneIndex}-${i}`)) return;
    const bob = Math.sin(time * 3 + i) * 5;
    const twinkle = 1 + Math.sin(time * 5 + i * 2) * 0.08;
    drawSprite(images.gem, gem.x, gem.y + 16 + bob, 32, 1, twinkle, twinkle);
  });
}

function loadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (err) {
    return []; // some browsers block saving; the game still works
  }
}

function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    // couldn't save; she keeps it until the page is closed
  }
}

function addSticker(animal) {
  if (stickers.includes(animal.name)) return; // already has this one
  stickers.push(animal.name);
  newSticker = { name: animal.name, t: -STICKER_DELAY };
  saveList(STICKERS_KEY, stickers);
}

// Gives back true if it's a brand new star
function addStar(animalName) {
  if (hasStar(animalName)) return false; // already has this star in this level
  stars.push(level + ':' + animalName);
  newStar = { name: animalName, t: -STAR_DELAY };
  saveList(STARS_KEY, stars);
  return true;
}

// New stickers and stars wait a moment, then pop in with the happy tune
function updateStickers(dt) {
  for (const item of [newSticker, newStar]) {
    if (!item) continue;
    const before = item.t;
    item.t += dt;
    if (before < 0 && item.t >= 0) Sounds.play('sticker');
  }
  if (newSticker && newSticker.t >= POP_TIME * 2) newSticker = null;
  if (newStar && newStar.t >= POP_TIME * 2) newStar = null;
}

// ---------- How each form moves ----------
// 'dahlia' is plain Dahlia. The others match the "movement" in animals.js.
// Speeds are in game pixels per second.
//   speed:   walking (or flying) speed left and right
//   jump:    how hard she jumps up
//   gravity: how fast she falls back down
//   height:  how tall she is drawn
const FORMS = {
  dahlia:     { speed: 260, jump: 720, gravity: 1800, height: 150 },
  bigJump:    { speed: 400, jump: 950, gravity: 1800, height: 105,    // Cat: faster, jumps higher,
                climbSpeed: 220 },                                    //   and climbs trees (Up next to a tree)
  roll:       { speed: 340, jump: 480, gravity: 1800, height: 80,     // Hamster: small, quick, low jump
                rollSpeed: 750, rollTime: 0.45 },                     //   Down = roll fast for a moment
  doubleJump: { speed: 300, jump: 700, gravity: 1800, height: 115 },  // Bunny: Up again in the air = second jump
  fly:        { speed: 280, height: 100,                              // Butterfly: no gravity
                flyUp: 240, floatDown: 140 },                         //   how fast she goes up / floats down
};

const LAND_SQUASH_TIME = 0.2; // Bunny's squish when she lands
const POP_TIME = 0.35;        // the bounce when a new form pops in

// ---------- The player ----------
const player = {
  x: 200,            // middle of her feet, in scene pixels
  y: GROUND_Y,       // bottom of her feet
  vx: 0,             // speed left/right
  vy: 0,             // speed up/down (negative = going up)
  onGround: true,
  facing: 1,         // 1 = right, -1 = left
  walkTime: 0,       // counts up while walking (for the little bounce)
  form: null,        // which animal she is (null = plain Dahlia)
  move: FORMS.dahlia,
  image: images.dahlia,
  jumpsLeft: 0,      // Bunny: extra jumps left while in the air
  rollTimer: 0,      // Hamster: time left in the roll
  flying: false,     // Butterfly: up in the air
  sinking: false,    // Butterfly: floating down to land
  climbing: null,    // Cat: the tree she is climbing (null = not climbing)
  landSquash: 0,     // Bunny: time left in the landing squish
  pop: 0,            // time left in the "pop in" bounce
  stepTimer: 0,      // time until the next footstep sound
  rollJump: false,   // Hamster: in a rolling jump
  inPit: null,       // the hole she's falling into (if she is)
  twirl: 0,          // time left in Dahlia's magic twirl
};

const TWIRL_TIME = 0.6;

// Dahlia's own super magic: when she's herself and nobody is nearby, the magic button
// makes her twirl with sparkles and a magic sound
function startTwirl() {
  player.twirl = TWIRL_TIME;
  Music.sparkle();
  makeSparkles(player.x, player.y - player.move.height / 2, 18);
}

const STEP_TIME = 0.3; // seconds between footstep sounds

// Turns Dahlia into an animal form, or back into Dahlia (animal = null)
function setForm(animal) {
  player.form = animal;
  player.move = FORMS[animal ? animal.movement : 'dahlia'];
  player.image = animal ? animal.dahliaImg : images.dahlia;
  player.vy = 0;
  player.rollTimer = 0;
  player.climbing = null;
  player.sinking = false;
  player.flying = !player.onGround && player.move === FORMS.fly; // a butterfly in the air stays up
  player.pop = POP_TIME;
}

// ---------- Scene and camera ----------
let sceneIndex = 0;   // 0 = Sunny Meadow
const camera = { x: 0 };
let time = 0;         // seconds the world has been running (stops while talking)
let uiTime = 0;       // seconds since the game started (never stops, for button pulses)

// ---------- Talking ----------
// When Dahlia talks to an animal, talk = { animal, choice }.
// choice is which button is picked: 0, 1 or 2. When nobody is talking, talk = null.
let talk = null;

// The three buttons in the talk box
function choiceLabels(animal) {
  return [
    `Become a ${animal.name}`,
    `Teleport, ${animal.name}!`,
    `Bye, ${animal.name}!`,
  ];
}

function openTalk(animal) {
  talk = { animal, choice: 0 };
  tapButtons = [];
  Sounds.play('talkOpen');
}

function closeTalk() {
  talk = null;
}

// What happens when a button is picked
function pickChoice() {
  Sounds.play('click');
  if (talk.choice === 0) {
    // Become the animal!
    const animal = talk.animal;
    closeTalk();
    startMagic(animal);
  } else if (talk.choice === 1) {
    // Teleport the animal away
    const animal = talk.animal;
    closeTalk();
    startTeleport(animal);
  } else {
    // Bye!
    closeTalk();
    Sounds.play('talkClose');
  }
}

// While the talk box is open: Left/Right pick a button, Space presses it
function updateTalk() {
  const before = talk.choice;
  if (justPressed.ArrowLeft)  talk.choice = Math.max(0, talk.choice - 1);
  if (justPressed.ArrowRight) talk.choice = Math.min(2, talk.choice + 1);
  if (talk.choice !== before) Sounds.play('select');
  if (justPressed[' ']) pickChoice();
}

// ---------- Transformation magic ----------
// 1. Dahlia freezes and a glitter ring spins around her (RING_TIME)
// 2. White flash (FLASH_TIME). In the middle of the flash she changes form.
// 3. The new form pops in with a bounce, and sparkles drift up.
const RING_TIME = 0.8;
const FLASH_TIME = 0.15;

// While the magic is happening, magic = { t, to }. t counts up, to = the animal (or null for Dahlia).
let magic = null;
let sparkles = [];   // little stars floating up after the magic

function startMagic(toAnimal) {
  magic = { t: 0, to: toAnimal, changed: false };
  Sounds.play(toAnimal ? 'transform' : 'unTransform');
}

function updateMagic(dt) {
  magic.t += dt;
  // Halfway through the flash: change form
  if (!magic.changed && magic.t >= RING_TIME + FLASH_TIME / 2) {
    setForm(magic.to);
    makeSparkles(player.x, player.y - player.move.height / 2);
    if (magic.to) addSticker(magic.to);
    magic.changed = true;
  }
  if (magic.t >= RING_TIME + FLASH_TIME) magic = null; // all done
}

const SPARKLE_COLORS = ['#FFD166', '#F48FC2', '#9DD3F5', '#C9A7F5'];

// A burst of sparkles around (x, y)
function makeSparkles(x, y, count = 14) {
  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: x + (Math.random() - 0.5) * 120,
      y: y + (Math.random() - 0.5) * 100,
      vy: -50 - Math.random() * 70,           // floats up
      size: 6 + Math.random() * 7,
      color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
      life: 0.8 + Math.random() * 0.6,        // seconds until it fades away
      age: 0,
    });
  }
}

// Sparkles, confetti and the pop-in bounce keep going even while Dahlia moves
function updateEffects(dt) {
  for (const s of sparkles) {
    s.y += s.vy * dt;
    s.age += dt;
  }
  sparkles = sparkles.filter(s => s.age < s.life);

  for (const c of confetti) {
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.spin += c.spinSpeed * dt;
    c.age += dt;
  }
  confetti = confetti.filter(c => c.age < c.life);

  player.pop = Math.max(0, player.pop - dt);
  player.twirl = Math.max(0, player.twirl - dt);
}

// ---------- Confetti ----------
// Little colored papers falling from the top of the screen (screen numbers, not scene numbers)
let confetti = [];
const CONFETTI_COLORS = ['#E6378F', '#F48FC2', '#FFD166', '#9DD3F5', '#C9A7F5'];

function makeConfetti() {
  for (let i = 0; i < 80; i++) {
    confetti.push({
      x: Math.random() * VIEW_W,
      y: -20 - Math.random() * 260,          // start above the screen, at different heights
      vx: (Math.random() - 0.5) * 80,
      vy: 140 + Math.random() * 120,         // falls down
      spin: Math.random() * 6,
      spinSpeed: (Math.random() - 0.5) * 12,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      life: 3.5,
      age: 0,
    });
  }
}

// ---------- Teleport ----------
// When an animal is teleported, animal.away = { t }. t counts up in seconds:
//   1. WOBBLE: it shrinks a little and wobbles
//   2. PUFF:   a lavender puff covers it and it vanishes
//   3. GONE:   10 seconds away, with a countdown bubble where it was
//   4. PUFF:   the puff comes back and the animal pops in with a bounce
const WOBBLE_TIME = 0.3;
const PUFF_TIME = 0.4;
const GONE_TIME = 10;
const VANISH_AT = WOBBLE_TIME + PUFF_TIME / 2;          // hidden behind the puff
const RETURN_AT = WOBBLE_TIME + PUFF_TIME + GONE_TIME;  // starts coming back
const BACK_DONE = RETURN_AT + PUFF_TIME;                // all done

function startTeleport(animal) {
  animal.away = { t: 0 };
  Sounds.play('teleportOut');
}

// Teleport timers keep counting for every animal, even in other scenes
function updateTeleports(dt) {
  for (const animal of ANIMALS) {
    if (!animal.away) continue;
    const before = animal.away.t;
    animal.away.t += dt;
    // Coming back (only make a sound if Dahlia is in the same scene to see it)
    if (before < RETURN_AT && animal.away.t >= RETURN_AT && animal.scene === sceneIndex) {
      Sounds.play('teleportBack');
    }
    if (animal.away.t >= BACK_DONE) animal.away = null; // home again
  }
}

// Is the animal gone right now? (Then you can't see it or talk to it.)
function isGone(animal) {
  return animal.away && animal.away.t >= VANISH_AT && animal.away.t < RETURN_AT;
}

// The bounce when something pops in: starts big (1.2), wobbles, ends at 1.
// p goes from 0 (just popped) to 1 (done).
function popScale(p) {
  return 1 + 0.2 * Math.cos(p * Math.PI * 1.5) * (1 - p);
}

// ---------- Animals ----------
const TALK_DISTANCE = 110; // how close Dahlia has to be to talk

// The animals that live in the scene Dahlia is in right now
function animalsHere() {
  return ANIMALS.filter(animal => animal.scene === sceneIndex);
}

// The closest animal Dahlia can talk to, or null if nobody is close
function nearbyAnimal() {
  let closest = null;
  for (const animal of animalsHere()) {
    if (animal.away) continue; // teleported animals can't talk
    const distance = Math.abs(animal.x - player.x);
    if (distance < TALK_DISTANCE && (!closest || distance < Math.abs(closest.x - player.x))) {
      closest = animal;
    }
  }
  return closest;
}

// Each kind of animal has its own gentle "waiting around" animation.
// Gives back how to draw it right now: lift it up, squash it, wiggle it.
function idlePose(animal) {
  const t = time + animal.idlePhase;
  const pose = { lift: 0, scaleX: 1, scaleY: 1, shiftX: 0 };

  if (animal.movement === 'bigJump') {
    // Cat: slow, sleepy breathing
    pose.scaleY = 1 + Math.sin(t * 2) * 0.03;
    pose.scaleX = 1 - Math.sin(t * 2) * 0.015;
  } else if (animal.movement === 'doubleJump') {
    // Bunny: a little hop now and then
    pose.lift = Math.max(0, Math.sin(t * 3)) * 10;
  } else if (animal.movement === 'roll') {
    // Hamster: wiggles side to side
    pose.shiftX = Math.sin(t * 5) * 3;
    pose.scaleY = 1 + Math.sin(t * 10) * 0.02;
  } else if (animal.movement === 'fly') {
    // Butterfly: floats in the air, bobs up and down, flaps its wings
    pose.lift = 90 + Math.sin(t * 2) * 10;
    pose.scaleX = 0.75 + Math.abs(Math.cos(t * 6)) * 0.25;
  }
  return pose;
}

// ---------- Changing scenes ----------
// The screen fades out, the new scene is put in place, and the screen fades back in.
const EDGE = 40;          // how close to the edge Dahlia walks before the scene changes
const FADE_TIME = 0.25;   // seconds to fade out (and the same to fade back in)
const NAME_TIME = 2;      // seconds the scene name stays on screen

// While changing, sceneChange = { t, to, done }. to = the new scene number.
let sceneChange = null;
// The scene name on screen: { name, t }. t counts up to NAME_TIME.
let sceneTitle = null;  // (startGame shows the first one)

function startSceneChange(toScene) {
  sceneChange = { t: 0, to: toScene, done: false };
  Sounds.play('sceneChange');
}

function updateSceneChange(dt) {
  sceneChange.t += dt;

  // Going to the next level: load it while the screen is dark
  if (!sceneChange.done && sceneChange.t >= FADE_TIME && sceneChange.nextLevel) {
    loadLevel(level + 1);
    resetPlayer();
    sceneTitle = { name: `Level ${level}!`, t: 0 };
    sceneChange.done = true;
  }

  // When the screen is all faded out: move to the new scene
  if (!sceneChange.done && sceneChange.t >= FADE_TIME) {
    const goingRight = sceneChange.to > sceneIndex;
    sceneIndex = sceneChange.to;
    const scene = SCENES[sceneIndex];
    // Arrive at the side she walked in from (a little away from the edge)
    player.x = goingRight ? EDGE * 2 : scene.width - EDGE * 2;
    player.rollTimer = 0;
    updateCamera();
    sceneTitle = { name: scene.name, t: 0 };
    sceneChange.done = true;
  }

  if (sceneChange.t >= FADE_TIME * 2) sceneChange = null; // faded back in
}

// ---------- Levels ----------
// There are 3 levels (see levels.js). Every level puts the animals in new homes and gives
// every world a new challenge. The challenges themselves are in challenges.js.

const LEVEL_KEY = 'magicAnimals.level';
let level = loadNumber(LEVEL_KEY, 1);

function loadNumber(key, fallback) {
  try {
    return Number(localStorage.getItem(key)) || fallback;
  } catch (err) {
    return fallback;
  }
}

function saveNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (err) {
    // couldn't save; that's ok
  }
}

// Saves from before there were levels counted everything as Level 1
stars = stars.map(id => id.includes(':') ? id : '1:' + id);
gems = gems.map(id => id.split('-').length === 2 ? '1-' + id : id);

// Puts everything for level n into the worlds: animal homes, challenges, gems, clouds
function loadLevel(n) {
  level = n;
  saveNumber(LEVEL_KEY, level);
  const data = LEVELS[level - 1];

  for (const animal of ANIMALS) {
    if (animal.firstLine === undefined) animal.firstLine = animal.line;
    const home = data.homes[animal.name];
    animal.scene = home.scene;
    animal.x = home.x;
    animal.line = (data.lines && data.lines[animal.name]) || animal.firstLine;
    animal.away = null;
  }

  SCENES.forEach((scene, i) => {
    const worldData = data.scenes[i];
    if (scene.baseClouds === undefined) scene.baseClouds = scene.clouds || [];
    scene.clouds = worldData.clouds || scene.baseClouds;
    scene.gems = worldData.gems || [];
    // A fresh copy of the challenge, so playing it doesn't change levels.js
    const c = worldData.challenge ? JSON.parse(JSON.stringify(worldData.challenge)) : null;
    scene.challenge = c;
    if (c) {
      c.done = hasStar(c.animal);
      c.locked = !!data.gate && !c.done; // Levels 2 and 3: hidden in magic fog until the puzzle
      CHALLENGES[c.type].setup(c, scene);
    }
  });
}

// Did she finish this animal's challenge in this level?
function hasStar(animalName) {
  return stars.includes(level + ':' + animalName);
}

// Is every challenge in this level finished?
function allStarsCollected() {
  return SCENES.every(scene => !scene.challenge || hasStar(scene.challenge.animal));
}

// A level is complete when every challenge is done AND every gem is found
function levelComplete() {
  return allStarsCollected() && levelGemsFound() >= levelGemTotal();
}

// Gems: how many in this level, how many she found in this level, and in all levels
const levelGemTotal = () => SCENES.reduce((n, scene) => n + scene.gems.length, 0);
const levelGemsFound = () => new Set(gems.filter(id => id.startsWith(level + '-'))).size;
const ALL_GEMS = LEVELS.reduce((n, l) => n + l.scenes.reduce((m, s) => m + (s.gems || []).length, 0), 0);

// Empties the Friend Book (no stickers, stars or gems), back to Level 1, and saves that
function clearFriendBook() {
  stickers = [];
  stars = [];
  gems = [];
  saveList(STICKERS_KEY, stickers);
  saveList(STARS_KEY, stars);
  saveList(GEMS_KEY, gems);
  newSticker = null;
  newStar = null;
  saveNumber(LEVEL_KEY, 1);
  level = 1;
}

// Get the saved level ready. A finished game (every level done) starts fresh next time.
level = Math.min(Math.max(1, level), LEVELS.length);
loadLevel(level);
if (level === LEVELS.length && levelComplete()) {
  clearFriendBook();
  loadLevel(1);
}
updatePlayButton();

// The Play button says which level she's on
function updatePlayButton() {
  playButton.textContent = level > 1 ? `Play Level ${level}` : 'Play';
}

// Is Dahlia this animal right now?
function isForm(animalName) {
  return player.form !== null && player.form.name === animalName;
}

function updateChallenge(dt) {
  const c = SCENES[sceneIndex].challenge;
  if (c && !c.locked) CHALLENGES[c.type].update(c, dt);
}

function drawChallenge() {
  const c = SCENES[sceneIndex].challenge;
  if (!c) return;
  if (c.locked) drawFog(c);
  else CHALLENGES[c.type].draw(c);
}

// ---------- Star signs ----------
// A gold star on a post marks every challenge. Stand next to it to read a little clue.
// In Levels 2 and 3, the sign has a puzzle: solve it (Space) to clear the magic fog.
const SIGN_DISTANCE = 70;

function signNearby() {
  const c = SCENES[sceneIndex].challenge;
  return c && Math.abs(player.x - c.sign) < SIGN_DISTANCE ? c : null;
}

function drawSign() {
  const c = SCENES[sceneIndex].challenge;
  if (!c) return;
  const x = c.sign;
  // Wooden post
  roundedBox(x - 6, GROUND_Y - 78, 12, 80, 5);
  ctx.fillStyle = '#8B5A3C';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();
  // The star on top, gently turning
  const y = GROUND_Y - 98;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 2) * 0.12);
  drawGoldStar(0, 0, 26);
  ctx.restore();
  // Little badge: a lock while it's foggy, a check mark when it's done
  if (c.locked) drawLockBadge(x + 18, y + 16);
  if (c.done) drawCheckBadge(x + 18, y + 16);
}

// The clue bubble over the sign (only while she's standing next to it)
function drawSignClue() {
  const c = signNearby();
  if (!c) return;
  let text = c.clue;
  if (c.locked) text = isTouch ? 'Magic fog! Tap ✨ to solve the puzzle.' : 'Magic fog! Press Space to solve the puzzle.';
  if (c.done) text = 'All done here! ⭐';

  ctx.font = `700 20px ${FONT}`;
  const lines = wrapText(text, 250);
  const w = Math.max(...lines.map(line => ctx.measureText(line).width)) + 32;
  const h = lines.length * 26 + 20;
  const x = Math.max(camera.x + 8, Math.min(camera.x + VIEW_W - w - 8, c.sign - w / 2)); // stay on screen
  const y = GROUND_Y - 140 - h + Math.sin(time * 3) * 3;

  roundedBox(x, y, w, h, 18);
  ctx.fillStyle = '#FFFDF7';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();
  ctx.fillStyle = c.locked ? '#7A4FC0' : '#E6378F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + 23 + i * 26));
}

function drawLockBadge(x, y) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.beginPath();
  ctx.arc(x, y - 6, 6, Math.PI, 0); // the loop on top
  ctx.stroke();
  roundedBox(x - 9, y - 6, 18, 14, 4);
  ctx.fillStyle = '#C9A7F5';
  ctx.fill();
  ctx.stroke();
}

function drawCheckBadge(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#E6378F';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x - 1, y + 4);
  ctx.lineTo(x + 5, y - 4);
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
}

// ---------- Puzzles (clear the magic fog) ----------
// While a puzzle is open, puzzle = { c, q, choice, age, shake, message }. The game pauses.
// The buttons are the 3 answers, then "Not now".
// So nobody can just mash Space to get through:
//   - nothing is picked at first (choice = -1): pick an answer with Left/Right (or tap it)
//   - Space does nothing for the first moment after the puzzle opens
//   - a wrong answer brings a brand new puzzle
let puzzle = null;
const PUZZLE_WAIT = 0.5; // seconds before Space works in a new puzzle

function makePuzzleQuestion() {
  const makers = { pattern: makePatternPuzzle, math: makeMathPuzzle, bigMath: makeBigMathPuzzle, riddle: makeRiddlePuzzle };
  return makers[LEVELS[level - 1].gate]();
}

function openPuzzle(c) {
  puzzle = { c, q: makePuzzleQuestion(), choice: -1, age: 0, shake: 0, message: '' };
  tapButtons = [];
  Sounds.play('talkOpen');
}

function updatePuzzle(dt) {
  puzzle.shake = Math.max(0, puzzle.shake - dt);
  puzzle.age += dt;
  const count = puzzle.q.answers.length + 1; // + "Not now"
  const before = puzzle.choice;
  if (justPressed.ArrowLeft)  puzzle.choice = puzzle.choice < 0 ? 0 : Math.max(0, puzzle.choice - 1);
  if (justPressed.ArrowRight) puzzle.choice = puzzle.choice < 0 ? 0 : Math.min(count - 1, puzzle.choice + 1);
  if (puzzle.choice !== before) Sounds.play('select');
  if (!justPressed[' '] || puzzle.age < PUZZLE_WAIT) return;

  if (puzzle.choice < 0) {
    // Nothing picked yet
    puzzle.message = isTouch ? 'Tap an answer!' : 'Pick an answer with ← →';
    return;
  }
  if (puzzle.choice === count - 1) {
    // Not now
    puzzle = null;
    Sounds.play('talkClose');
    return;
  }
  const answer = puzzle.q.answers[puzzle.choice];
  if (answer === puzzle.q.correct) {
    // Right! The fog puffs away
    const c = puzzle.c;
    c.locked = false;
    puzzle = null;
    Sounds.play('teleportOut');
    Sounds.play('sticker');
    for (const spot of CHALLENGES[c.type].spots(c)) makeSparkles(spot.x, spot.y, 10);
    sceneTitle = { name: 'The fog is gone!', t: 0 };
  } else {
    // Not that one: here's a brand new puzzle to try
    Object.assign(puzzle, { q: makePuzzleQuestion(), choice: -1, age: 0, shake: 0.5, message: 'Not quite! Try this one.' });
    tapButtons = [];
    Sounds.play('land');
  }
}

function drawPuzzle() {
  const q = puzzle.q;
  const w = 720, x = (VIEW_W - w) / 2, y = 30;
  ctx.font = `400 26px ${FONT}`;
  const promptLines = wrapText(q.prompt, w - 72);
  const showH = q.show ? 64 : 0;
  const h = 70 + promptLines.length * 34 + showH + 96;
  const shakeX = puzzle.shake > 0 ? Math.sin(puzzle.shake * 50) * 6 : 0;

  ctx.fillStyle = 'rgba(58, 38, 38, 0.35)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  roundedBox(x + shakeX, y, w, h, 28);
  ctx.fillStyle = '#FFFDF7';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = '#7A4FC0';
  ctx.fillText(q.title, VIEW_W / 2, y + 36);
  ctx.font = `400 26px ${FONT}`;
  ctx.fillStyle = '#3A2626';
  promptLines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, y + 76 + i * 34));
  if (q.show) {
    ctx.font = `700 40px ${FONT}`;
    ctx.fillStyle = '#E6378F';
    ctx.fillText(q.show, VIEW_W / 2, y + 76 + promptLines.length * 34 + 22);
  }

  // Answer buttons, then "Not now"
  const labels = [...q.answers, 'Not now'];
  const buttonH = 56, gap = 16;
  // Word answers (riddles) use a smaller font and wider buttons
  const answerFont = q.answers.some(a => a.length > 3) ? 24 : 30;
  ctx.font = `700 ${answerFont}px ${FONT}`;
  const widths = labels.map((label, i) => i < q.answers.length ? Math.max(110, ctx.measureText(label).width + 40)
                                                                : ctx.measureText(label).width + 30);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
  let bx = (VIEW_W - total) / 2;
  const by = y + h - buttonH - 22;
  tapButtons = [];
  labels.forEach((label, i) => {
    const style = i < q.answers.length ? BUTTON_STYLES[1] : BUTTON_STYLES[2];
    drawPillButton(bx, by, widths[i], buttonH, label, style, puzzle.choice === i, i < q.answers.length ? answerFont : 22);
    tapButtons[i] = { x: bx, y: by, w: widths[i], h: buttonH };
    bx += widths[i] + gap;
  });

  if (puzzle.message) {
    // "Not quite! Try this one." or "Pick an answer"
    ctx.font = `700 24px ${FONT}`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFFDF7';
    ctx.strokeText(puzzle.message, VIEW_W / 2, y + h + 26);
    ctx.fillStyle = '#E6378F';
    ctx.fillText(puzzle.message, VIEW_W / 2, y + h + 26);
  }
}

// ---------- Finishing challenges and levels ----------

// Hooray! Confetti, "You did it!", and a gold star in the Friend Book
function finishChallenge(c) {
  c.done = true;
  Sounds.play('transform');
  makeConfetti();
  sceneTitle = { name: 'You did it!', t: 0 };
  const gotNewStar = addStar(c.animal);
  // Was that the last thing to do in this level? Show the big sign in a moment
  if (gotNewStar && levelComplete()) finaleWait = FINALE_DELAY;
}

// When every challenge AND every gem in a level is done, a big sign says so.
//   Levels 1-4: "Level complete!" with a clue about where the magic door to the next
//   level is hiding (one "OK!" button). Then she has to go and find it!
//   The last level: "You did it!" with Start over or Keep playing.
const FINALE_DELAY = 2.5;   // seconds after the last star, so she sees it pop in first
let finaleWait = 0;         // counting down to show the sign
let finale = null;          // { kind: 'level' or 'game', choice } while the sign is open

const isLastLevel = () => level === LEVELS.length;

function openFinale() {
  const kind = isLastLevel() ? 'game' : 'level';
  finale = { kind, choice: kind === 'level' ? 0 : 1 }; // "OK!", or "Keep playing" is picked first
  tapButtons = [];
  Sounds.play('sticker');
  makeConfetti();
}

// Left/Right pick a button, Space presses it (just like the talk box)
function updateFinale() {
  const before = finale.choice;
  const lastButton = finale.kind === 'level' ? 0 : 1; // the level sign only has "OK!"
  if (justPressed.ArrowLeft)  finale.choice = 0;
  if (justPressed.ArrowRight) finale.choice = lastButton;
  if (finale.choice !== before) Sounds.play('select');
  if (!justPressed[' ']) return;
  Sounds.play('click');
  const kind = finale.kind;
  const choice = finale.choice;
  finale = null;
  if (kind === 'game' && choice === 0) startOver();
}

// The magic door to the next level. It only shows up once the level is complete,
// in the spot the level's door clue talks about (see "door" in levels.js).
const levelDoor = () => LEVELS[level - 1].door;
const doorOpen = () => !isLastLevel() && levelComplete();

function updateDoor() {
  const door = levelDoor();
  if (doorOpen() && sceneIndex === door.scene && Math.abs(player.x - door.x) < 40 && !sceneChange) goToNextLevel();
}

function drawDoor() {
  const door = levelDoor();
  if (!doorOpen() || sceneIndex !== door.scene) return;
  const DOOR_X = door.x;
  const y = GROUND_Y - 80;
  // A swirling ring of glitter with a soft glow inside
  ctx.beginPath();
  ctx.ellipse(DOOR_X, y, 46, 76, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(201, 167, 245, 0.55)';
  ctx.fill();
  ctx.save();
  ctx.translate(DOOR_X, y);
  ctx.scale(0.62, 1);
  ctx.rotate(time * 2);
  ctx.drawImage(images.glitter, -80, -80, 160, 160);
  ctx.restore();
  ctx.font = `700 20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#FFFDF7';
  ctx.strokeText(`Level ${level + 1}`, DOOR_X, y - 96);
  ctx.fillStyle = '#7A4FC0';
  ctx.fillText(`Level ${level + 1}`, DOOR_X, y - 96);
}

// Fade out, load the next level, and start again at the beginning of the Sunny Meadow
function goToNextLevel() {
  sceneChange = { t: 0, to: 0, done: false, nextLevel: true };
  Sounds.play('transform');
}

// Back to the title screen with everything fresh: no stickers, stars or gems,
// Level 1 again, and Dahlia back at the start of the Sunny Meadow
function startOver() {
  clearFriendBook();
  loadLevel(1);
  resetPlayer();
  sparkles = [];
  confetti = [];
  sceneTitle = null;
  finale = null;
  for (const key in keys) keys[key] = false;

  started = false;
  updatePlayButton();
  titleScreen.hidden = false;
  touchControls.hidden = true;
  playButton.focus();
}

// Dahlia back to herself, at the start of the Sunny Meadow
function resetPlayer() {
  setForm(null);
  Object.assign(player, { x: 260, y: GROUND_Y, vx: 0, vy: 0, onGround: true, facing: 1, pop: 0 });
  sceneIndex = 0;
  updateCamera();
}

// ---------- Update: move everything ----------
function update(dt) {
  uiTime += dt;

  // On the title screen, only the animals move (behind the title)
  if (!started) {
    time += dt;
    return;
  }

  updateStickers(dt);
  if (sceneTitle) {
    sceneTitle.t += dt;
    if (sceneTitle.t >= NAME_TIME) sceneTitle = null;
  }

  // The "All done!" sign pauses the game, like the talk box
  if (finale) {
    updateFinale();
    updateEffects(dt);
    return;
  }
  if (finaleWait > 0) {
    finaleWait -= dt;
    if (finaleWait <= 0) {
      if (talk || magic || sceneChange || puzzle) finaleWait = 0.1; // wait until she's free
      else openFinale();
    }
  }

  // Everything waits while the scene changes
  if (sceneChange) {
    updateSceneChange(dt);
    return;
  }

  // The game pauses while the talk box (or a puzzle) is open
  if (talk) {
    updateTalk();
    return;
  }
  if (puzzle) {
    updatePuzzle(dt);
    return;
  }

  // Dahlia freezes while the magic happens
  if (magic) {
    updateMagic(dt);
    updateEffects(dt);
    return;
  }

  if (justPressed[' ']) {
    const friend = nearbyAnimal();
    if (friend) {
      // Space next to an animal = start talking
      openTalk(friend);
      return;
    }
    const sign = signNearby();
    if (sign && sign.locked) {
      // Space at a foggy star sign = open its puzzle
      openPuzzle(sign);
      return;
    }
    if (player.form) {
      // Space with nobody nearby, as an animal = turn back into Dahlia
      startMagic(null);
      return;
    }
    if (player.twirl <= 0) startTwirl(); // just Dahlia: her own magic twirl!
  }

  updateWorld(dt);
  updateEffects(dt);
}

// Moves Dahlia, the camera, the animals' idle animations and teleport timers
function updateWorld(dt) {
  const scene = SCENES[sceneIndex];
  const startX = player.x;
  const startY = player.y;
  time += dt;
  updateTeleports(dt);
  updateChallenge(dt);
  updateGems(dt);
  updateDoor();

  // Left / Right (every form)
  player.vx = 0;
  if (keys.ArrowLeft)  { player.vx = -player.move.speed; player.facing = -1; }
  if (keys.ArrowRight) { player.vx =  player.move.speed; player.facing =  1; }

  if (player.move === FORMS.fly) moveButterfly(dt);
  else if (player.climbing) moveClimbing(dt);
  else moveOnFeet(dt);

  // Walk off the right edge = next scene. Left edge = go back.
  if (player.x > scene.width - EDGE && sceneIndex < SCENES.length - 1) {
    startSceneChange(sceneIndex + 1);
  } else if (player.x < EDGE && sceneIndex > 0) {
    startSceneChange(sceneIndex - 1);
  }

  // Stay inside the scene (the first and last scenes have a wall at the end)
  player.x = Math.max(EDGE, Math.min(scene.width - EDGE, player.x));

  // Little walking bounce
  if (player.vx !== 0 && player.onGround) player.walkTime += dt;
  else player.walkTime = 0;

  // Footsteps (or wing flutters), one every STEP_TIME seconds, not every frame
  const moved = Math.abs(player.x - startX) > 0.01; // not moving when she's pushing on a wall
  player.stepTimer -= dt;
  if (player.stepTimer <= 0) {
    if (player.flying) {
      Sounds.play('flutter');
      player.stepTimer = STEP_TIME;
    } else if (moved && player.onGround && player.rollTimer <= 0) {
      Sounds.play(player.form ? 'pawStep' : 'step'); // animals have lighter paw steps
      player.stepTimer = STEP_TIME;
    } else if (player.climbing && Math.abs(player.y - startY) > 0.01) {
      Sounds.play('pawStep'); // paws on the tree bark
      player.stepTimer = STEP_TIME;
    }
  }

  updateCamera();
}

// Camera keeps Dahlia in the middle, but never shows past the scene edges
function updateCamera() {
  const scene = SCENES[sceneIndex];
  camera.x = player.x - VIEW_W / 2;
  camera.x = Math.max(0, Math.min(scene.width - VIEW_W, camera.x));
}

// The cloud Dahlia would land on if she moved from prevY down to y (or null)
function cloudUnder(prevY, y) {
  for (const cloud of floorsHere()) {
    const over = player.x > cloud.x && player.x < cloud.x + cloud.w;
    if (over && prevY <= cloud.y + 0.5 && y >= cloud.y) return cloud;
  }
  return null;
}

// Everything to stand on in this world: cloud steps, plus a challenge's lily pads or crumbling clouds
function floorsHere() {
  const scene = SCENES[sceneIndex];
  const c = scene.challenge;
  const extra = c && !c.locked && CHALLENGES[c.type].platforms ? CHALLENGES[c.type].platforms(c) : [];
  return (scene.clouds || []).concat(extra);
}

// The hole (or deep water) under Dahlia's feet right now, or null.
// Once she's below the ground she's inside that hole: its walls keep her in.
function pitUnder() {
  if (player.inPit) {
    const pit = player.inPit;
    player.x = Math.max(pit.x + 12, Math.min(pit.x + pit.w - 12, player.x));
    return pit;
  }
  const c = SCENES[sceneIndex].challenge;
  if (!c || c.locked || !CHALLENGES[c.type].pits) return null;
  const pit = CHALLENGES[c.type].pits(c).find(p => player.x > p.x && player.x < p.x + p.w) || null;
  if (pit && player.y > GROUND_Y + 1) player.inPit = pit; // dropped below the ground: in the hole now
  return pit;
}

// A windy challenge (windy: true in levels.js): from just before its flag to just past its prize,
// the wind is too strong to fly. Gives back { x0, x1 }, or null when there's no wind here.
function windZone() {
  const c = SCENES[sceneIndex].challenge;
  if (!c || !c.windy || c.done || c.locked) return null;
  return { x0: c.start - 80, x1: c.goal.x + 120 };
}

// Fell all the way into a hole or the water: back to the start of the challenge
const FALL_DEPTH = 120;
function fellIn(pit) {
  const c = SCENES[sceneIndex].challenge;
  Sounds.play(pit.water ? 'teleportBack' : 'land');
  sceneTitle = { name: pit.water ? 'Splash! Try again!' : 'Oops! Try again!', t: 0 };
  makeSparkles(player.x, GROUND_Y - 10, 10);
  Object.assign(player, {
    x: c.start, y: GROUND_Y, vx: 0, vy: 0, onGround: true, facing: 1,
    rollTimer: 0, rollJump: false, flying: false, sinking: false, climbing: null, inPit: null,
  });
  if (CHALLENGES[c.type].restart) CHALLENGES[c.type].restart(c);
  updateCamera();
}

// A tree close enough for Cat-Dahlia to grab (or null)
function treeNearby() {
  for (const tree of SCENES[sceneIndex].trees || []) {
    if (Math.abs(player.x - tree.x) < 40) return tree;
  }
  return null;
}

// Dahlia, Cat, Hamster and Bunny: walk, jump, gravity
function moveOnFeet(dt) {
  const move = player.move;

  // Cat: Up next to a tree = start climbing it
  if (move === FORMS.bigJump && keys.ArrowUp) {
    const tree = treeNearby();
    if (tree && player.y > tree.top) {
      player.climbing = tree;
      player.x = tree.x;
      player.vy = 0;
      player.onGround = false;
      return;
    }
  }

  // Hamster: Down = roll into a ball and zoom
  if (move === FORMS.roll) {
    if (justPressed.ArrowDown && player.onGround && player.rollTimer <= 0) {
      player.rollTimer = move.rollTime;
      Sounds.play('squeak');
    }
    if (player.rollTimer > 0) {
      player.rollTimer -= dt;
      player.vx = player.facing * move.rollSpeed;
    }
    // Jump while rolling = a long, fast rolling jump (keeps rolling speed in the air)
    if (player.rollJump) player.vx = player.facing * move.rollSpeed;
  }

  // Up = jump from the ground
  const isBunny = move === FORMS.doubleJump;
  if (keys.ArrowUp && player.onGround) {
    player.vy = -move.jump;
    player.onGround = false;
    player.rollJump = player.rollTimer > 0; // Hamster jumped in the middle of a roll
    player.jumpsLeft = isBunny ? 1 : 0; // Bunny gets one more jump in the air
    Sounds.play(isBunny ? 'hop' : 'jump');
  } else if (justPressed.ArrowUp && !player.onGround && player.jumpsLeft > 0) {
    // Bunny: press Up again in the air for a second hop
    player.vy = -move.jump;
    player.jumpsLeft -= 1;
    Sounds.play('hop');
  }

  // Gravity pulls her down
  player.vy += move.gravity * dt;

  // Move
  const prevY = player.y;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Land on a cloud step (only when coming down onto it from above), or on the path.
  // If she isn't standing on anything, she's in the air (like walking off a cloud).
  // Over a hole or deep water, there's no ground to land on.
  const cloud = player.vy >= 0 ? cloudUnder(prevY, player.y) : null;
  const pit = pitUnder();
  if (cloud) landAt(cloud.y);
  else if (player.y >= GROUND_Y && !pit) landAt(GROUND_Y);
  else player.onGround = false;
  if (pit && player.y > GROUND_Y + FALL_DEPTH) fellIn(pit);

  player.landSquash = Math.max(0, player.landSquash - dt);
}

// Feet touch down at height y
function landAt(y) {
  if (!player.onGround) {
    Sounds.play('land');
    if (player.move === FORMS.doubleJump) player.landSquash = LAND_SQUASH_TIME;
  }
  player.y = y;
  player.vy = 0;
  player.onGround = true;
  player.rollJump = false;
}

// Cat on a tree: Up climbs, Down climbs down, Left or Right jumps off
function moveClimbing(dt) {
  const tree = player.climbing;
  const move = player.move;
  player.vx = 0;

  if (keys.ArrowUp)   player.y -= move.climbSpeed * dt;
  if (keys.ArrowDown) player.y += move.climbSpeed * dt;
  if (player.y < tree.top) player.y = tree.top; // as high as she can go

  // Climbed all the way down (or down into a hole!)
  if (player.y >= GROUND_Y) {
    player.climbing = null;
    if (pitUnder()) player.onGround = false;
    else landAt(GROUND_Y);
    return;
  }

  // Left or Right: hop off the tree (she lands safely, always)
  if (justPressed.ArrowLeft || justPressed.ArrowRight) {
    player.climbing = null;
    player.vy = -400;
    player.vx = player.facing * move.speed;
    Sounds.play('jump');
  }
}

// Butterfly: no gravity. Up = fly up, Down = float down and land.
function moveButterfly(dt) {
  const move = player.move;

  // Too windy to fly here! The wind pushes her gently down to the ground.
  const wind = windZone();
  if (wind && player.x > wind.x0 && player.x < wind.x1) {
    if (justPressed.ArrowUp) sceneTitle = { name: 'Too windy to fly!', t: 0 };
    keys.ArrowUp = false;
    if (!player.onGround) player.sinking = true;
  }

  if (keys.ArrowUp) {
    player.flying = true;
    player.sinking = false;
    player.vy = -move.flyUp;
  } else {
    if (justPressed.ArrowDown && !player.onGround) player.sinking = true;
    player.vy = player.sinking ? move.floatDown : 0; // stays where she is unless she's floating down
  }

  const prevY = player.y;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Don't fly off the top of the screen
  const ceiling = move.height + 30;
  if (player.y < ceiling) player.y = ceiling;

  // Standing on a cloud step, or on the path?
  const cloud = player.vy >= 0 ? cloudUnder(prevY, player.y) : null;
  const pit = pitUnder();
  const floor = cloud ? cloud.y : (player.y >= GROUND_Y && !pit ? GROUND_Y : null);
  if (pit && player.y > GROUND_Y + FALL_DEPTH) {
    fellIn(pit);
    return;
  }
  if (floor !== null) {
    if (player.flying || player.sinking) Sounds.play('land');
    player.y = floor;
    player.vy = 0;
    player.flying = false;
    player.sinking = false;
  } else {
    player.flying = true; // in the air (for example, walked off the end of a cloud)
  }
  player.onGround = floor !== null;
}

// ---------- Draw: paint everything ----------

// Draws a picture standing on (x, y), with its feet at y.
// facing = -1 flips it to look the other way.
// scaleX / scaleY squash or stretch it (1 = normal size).
// spin turns it around its middle (in radians: Math.PI * 2 = one full turn).
function drawSprite(img, x, y, height, facing, scaleX = 1, scaleY = 1, spin = 0) {
  if (!img.complete || !img.naturalWidth) return; // not loaded yet
  const width = height * (img.naturalWidth / img.naturalHeight);
  ctx.save();
  ctx.translate(x, y);
  if (spin) {
    ctx.translate(0, -height / 2);
    ctx.rotate(spin);
    ctx.translate(0, height / 2);
  }
  ctx.scale(facing * scaleX, scaleY);
  ctx.drawImage(img, -width / 2, -height, width, height);
  ctx.restore();
}

// Draws Dahlia in whatever form she's in, with all her little wiggles
function drawPlayer() {
  const move = player.move;
  let scaleX = 1, scaleY = 1, spin = 0, lift = 0;

  // Small hop up and down while she walks
  lift += Math.abs(Math.sin(player.walkTime * 14)) * 5;

  // Pop in with a bounce after the magic
  if (player.pop > 0) {
    const s = popScale(1 - player.pop / POP_TIME);
    scaleX *= s;
    scaleY *= s;
  }

  // Bunny: squish down when she lands
  if (player.landSquash > 0) {
    const k = player.landSquash / LAND_SQUASH_TIME;
    scaleY *= 1 - 0.2 * k;
    scaleX *= 1 + 0.15 * k;
  }

  // Hamster: spin around while rolling (two full turns), and keep spinning in a rolling jump
  if (player.rollTimer > 0) {
    spin = player.facing * (1 - player.rollTimer / move.rollTime) * Math.PI * 4;
  } else if (player.rollJump) {
    spin = player.facing * time * 25;
  }

  // Dahlia's own magic twirl: one full spin with a little hop
  if (player.twirl > 0) {
    const p = 1 - player.twirl / TWIRL_TIME;  // 0 to 1
    spin = player.facing * p * Math.PI * 2;
    lift += Math.sin(p * Math.PI) * 24;
  }

  // Cat: turn to face up the tree while climbing
  if (player.climbing) spin = -player.facing * Math.PI / 2;

  // Butterfly: wings flap all the time, and she bobs up and down while flying
  if (move === FORMS.fly) {
    scaleX *= 0.85 + Math.abs(Math.cos(time * 8)) * 0.15;
    if (player.flying) lift += Math.sin(time * 3) * 6;
  }

  // Cat pictures look left, so they flip the other way
  const facing = player.form && player.form.facesLeft ? -player.facing : player.facing;
  drawSprite(player.image, player.x, player.y - lift, move.height, facing, scaleX, scaleY, spin);
}

// A 4-pointed sparkle star, like the ones in glitter.svg
function drawStar(x, y, r) {
  const k = r * 0.15;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + k, y - k, x + r, y);
  ctx.quadraticCurveTo(x + k, y + k, x, y + r);
  ctx.quadraticCurveTo(x - k, y + k, x - r, y);
  ctx.quadraticCurveTo(x - k, y - k, x, y - r);
  ctx.fill();
}

function drawSparkles() {
  for (const s of sparkles) {
    ctx.globalAlpha = 1 - s.age / s.life; // fades out as it gets older
    ctx.fillStyle = s.color;
    drawStar(s.x, s.y, s.size);
  }
  ctx.globalAlpha = 1;
}

// The glitter ring and the white flash
function drawMagic() {
  const centerX = player.x;
  const centerY = player.y - player.move.height / 2;
  const glitter = images.glitter;

  if (magic.t < RING_TIME && glitter.complete && glitter.naturalWidth) {
    const p = magic.t / RING_TIME;         // goes from 0 to 1
    const size = 120 + 110 * p;            // ring grows
    ctx.save();
    ctx.globalAlpha = Math.min(1, p * 2);  // and fades in
    ctx.translate(centerX, centerY);
    ctx.rotate(magic.t * 8);               // and spins
    ctx.drawImage(glitter, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  // White flash: brightest in the middle of FLASH_TIME
  const f = (magic.t - RING_TIME) / FLASH_TIME;
  if (f > 0 && f < 1) {
    const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 180);
    glow.addColorStop(0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.6, 'rgba(255,255,255,0.9)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = Math.sin(f * Math.PI);
    ctx.fillStyle = glow;
    ctx.fillRect(centerX - 180, centerY - 180, 360, 360);
    ctx.globalAlpha = 1;
  }
}

// A rounded box (we draw it ourselves so it works on older iPads too)
function roundedBox(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawAnimal(animal) {
  const pose = idlePose(animal);
  let scale = 1;
  let spin = 0;

  if (animal.away) {
    const t = animal.away.t;
    if (t < WOBBLE_TIME) {
      // Wobble and shrink a little before the puff
      spin = Math.sin(t * 40) * 0.12;
      scale = 1 - 0.15 * (t / WOBBLE_TIME);
    } else if (t < RETURN_AT) {
      scale = 0.85; // still small while the puff covers it
    } else {
      // Back again: pop in with a bounce
      scale = popScale(Math.min(1, (t - RETURN_AT) / POP_TIME));
    }
  }

  if (!isGone(animal)) {
    // Animals that look sideways (like the Cat) turn to look at Dahlia
    const facing = animal.facesLeft && player.x > animal.x ? -1 : 1;
    drawSprite(animal.img, animal.x + pose.shiftX, GROUND_Y - pose.lift, animal.height,
      facing, pose.scaleX * scale, pose.scaleY * scale, spin);
  }
}

// The middle of an animal (where the puff and countdown go)
function animalCenterY(animal) {
  return GROUND_Y - idlePose(animal).lift - animal.height / 2;
}

// The lavender puff, the countdown bubble, and the puff coming back
function drawTeleport(animal) {
  const t = animal.away.t;
  const centerY = animalCenterY(animal);

  // Puff: when it goes away and when it comes back
  let puffT = -1;
  if (t >= WOBBLE_TIME && t < WOBBLE_TIME + PUFF_TIME) puffT = (t - WOBBLE_TIME) / PUFF_TIME;
  if (t >= RETURN_AT) puffT = (t - RETURN_AT) / PUFF_TIME;
  const puff = images.puff;
  if (puffT >= 0 && puffT < 1 && puff.complete && puff.naturalWidth) {
    const size = animal.height * 1.7 * (0.5 + 0.7 * Math.min(1, puffT * 2)); // grows fast
    ctx.globalAlpha = puffT < 0.5 ? 1 : 1 - (puffT - 0.5) * 2;                // then fades
    ctx.drawImage(puff, animal.x - size / 2, centerY - size / 2, size, size);
    ctx.globalAlpha = 1;
  }

  // Countdown bubble: 10, 9, 8 ... 1
  if (isGone(animal)) {
    const secondsLeft = Math.ceil(RETURN_AT - t);
    const y = centerY + Math.sin(time * 2.5) * 6; // floats gently up and down
    ctx.fillStyle = '#FFFDF7';
    ctx.strokeStyle = '#3A2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(animal.x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = `700 28px ${FONT}`;
    ctx.fillStyle = '#E6378F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(secondsLeft, animal.x, y + 2);
  }
}

// The little "Talk (Space)" bubble floating over an animal
function drawTalkBubble(animal) {
  const pose = idlePose(animal);
  const bob = Math.sin(time * 4) * 3;
  const tipY = GROUND_Y - pose.lift - animal.height - 14 + bob; // bottom point of the bubble
  const text = isTouch ? 'Talk' : 'Talk (Space)'; // on iPad you tap the sparkle button

  ctx.font = '700 22px Fredoka, "Baloo 2", sans-serif';
  const w = ctx.measureText(text).width + 32;
  const h = 40;
  const x = animal.x - w / 2;
  const y = tipY - 10 - h;

  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3A2626';
  ctx.fillStyle = '#FFFDF7';

  // Box
  roundedBox(x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();

  // Little tail pointing down at the animal
  ctx.beginPath();
  ctx.moveTo(animal.x - 9, y + h - 1);
  ctx.lineTo(animal.x, tipY);
  ctx.lineTo(animal.x + 9, y + h - 1);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(animal.x - 8, y + h - 4, 16, 4); // hide the box line above the tail

  // Words
  ctx.fillStyle = '#E6378F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, animal.x, y + h / 2 + 1);
}

// Splits a sentence into lines that fit inside maxWidth
function wrapText(text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const tryLine = line ? line + ' ' + word : word;
    if (ctx.measureText(tryLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = tryLine;
    }
  }
  lines.push(line);
  return lines;
}

// Fonts and colors from the style guide
const FONT = 'Fredoka, "Baloo 2", sans-serif';
const BUTTON_STYLES = [
  { fill: '#E6378F', text: '#FFFFFF', outline: false }, // Become (pink)
  { fill: '#C9A7F5', text: '#3A2626', outline: true },  // Teleport (lavender)
  { fill: '#FFFFFF', text: '#3A2626', outline: true },  // Bye (white)
];

// The big talk box at the top of the screen (looks like dialog-box.svg)
function drawTalkBox() {
  const animal = talk.animal;
  const labels = choiceLabels(animal);
  const pad = 36;         // space inside the box edges
  const gap = 16;         // space between buttons
  const buttonH = 46;

  // How wide each button needs to be for its words
  ctx.font = `700 22px ${FONT}`;
  const buttonWidths = labels.map(label => ctx.measureText(label).width + 48);
  const allButtons = buttonWidths.reduce((a, b) => a + b, 0) + gap * 2;

  // Box is 720 wide like the picture, or wider if the buttons need it
  const w = Math.min(VIEW_W - 20, Math.max(720, allButtons + pad * 2));
  const x = (VIEW_W - w) / 2;
  const y = 14;

  // The animal's words, split into short lines
  ctx.font = `400 24px ${FONT}`;
  const lines = wrapText(animal.line, w - pad * 2);
  const buttonsY = y + 90 + (lines.length - 1) * 32 + 26;
  const h = buttonsY + buttonH + 18 - y;

  // Where the tail points: at the animal on screen
  const animalScreenX = animal.x - camera.x;
  const tailX = Math.max(x + 60, Math.min(x + w - 60, animalScreenX));
  const bottom = y + h;

  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3A2626';
  ctx.fillStyle = '#FFFDF7';
  ctx.lineWidth = 5;

  // Box and tail
  roundedBox(x, y, w, h, 28);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tailX - 20, bottom - 2);
  ctx.lineTo(tailX, bottom + 30);
  ctx.lineTo(tailX + 20, bottom - 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(tailX - 18, bottom - 6, 36, 8); // hide the box line above the tail

  // "Cat says:"
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = '#E6378F';
  ctx.fillText(`${animal.name} says:`, x + pad, y + 50);

  // What the animal says
  ctx.font = `400 24px ${FONT}`;
  ctx.fillStyle = '#3A2626';
  lines.forEach((line, i) => ctx.fillText(line, x + pad, y + 90 + i * 32));

  // The three buttons
  let buttonX = x + pad;
  labels.forEach((label, i) => {
    drawPillButton(buttonX, buttonsY, buttonWidths[i], buttonH, label, BUTTON_STYLES[i], talk.choice === i);
    tapButtons[i] = { x: buttonX, y: buttonsY, w: buttonWidths[i], h: buttonH };
    buttonX += buttonWidths[i] + gap;
  });
}

// Where the buttons on screen are right now (so a tap or click can press them)
let tapButtons = [];

// One round-ended button. The picked one (selected) gently pulses and has a thicker outline.
function drawPillButton(x, y, w, h, label, style, selected, fontSize = 22) {
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  ctx.save();
  if (selected) {
    const pulse = 1.06 + Math.sin(uiTime * 6) * 0.04;
    ctx.translate(centerX, centerY);
    ctx.scale(pulse, pulse);
    ctx.translate(-centerX, -centerY);
  }
  roundedBox(x, y, w, h, h / 2);
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.strokeStyle = '#3A2626';
  if (style.outline || selected) {
    ctx.lineWidth = selected ? 5 : 3;
    ctx.stroke();
  }
  ctx.font = `700 ${fontSize}px ${FONT}`;
  ctx.fillStyle = style.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, centerX, centerY + 1);
  ctx.restore();
}

// The big "All done!" sign in the middle of the screen
function drawFinale() {
  const w = 600, h = 340;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;

  // Darken the game a little behind the sign
  ctx.fillStyle = 'rgba(58, 38, 38, 0.35)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  roundedBox(x, y, w, h, 32);
  ctx.fillStyle = '#FFFDF7';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const levelSign = finale.kind === 'level';
  ctx.font = `700 46px ${FONT}`;
  ctx.fillStyle = '#E6378F';
  ctx.fillText(levelSign ? `Level ${level} complete!` : 'You did it!', VIEW_W / 2, y + 56);
  ctx.font = `400 24px ${FONT}`;
  ctx.fillStyle = '#3A2626';
  if (levelSign) {
    // The clue: where is the magic door?
    const lines = wrapText(levelDoor().clue, w - 60);
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, y + 102 + i * 28 - (lines.length - 1) * 6));
  } else {
    ctx.fillText('You finished every level!', VIEW_W / 2, y + 104);
  }

  // One gold star for each challenge, gently bouncing
  const count = SCENES.filter(scene => scene.challenge).length;
  for (let i = 0; i < count; i++) {
    const starX = VIEW_W / 2 + (i - (count - 1) / 2) * 64;
    const bounce = Math.abs(Math.sin(uiTime * 3 + i * 0.6)) * 6;
    drawGoldStar(starX, y + 160 - bounce, 24);
  }

  // How many gems she found
  drawSprite(images.gem, VIEW_W / 2 - 70, y + 228, 30, 1);
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = '#3A2626';
  ctx.textAlign = 'left';
  const gemText = levelSign ? `${levelGemsFound()} / ${levelGemTotal()} gems` : `${gems.length} / ${ALL_GEMS} gems`;
  ctx.fillText(gemText, VIEW_W / 2 - 46, y + 212);
  ctx.textAlign = 'center';

  // Buttons: the level sign has just "OK!". The last sign has "Start over" / "Keep playing".
  const buttonW = 220, buttonH = 52, buttonY = y + h - 80;
  if (levelSign) {
    drawPillButton(VIEW_W / 2 - buttonW / 2, buttonY, buttonW, buttonH, 'OK! Find the door!', BUTTON_STYLES[0], true);
    tapButtons = [{ x: VIEW_W / 2 - buttonW / 2, y: buttonY, w: buttonW, h: buttonH }];
  } else {
    drawPillButton(VIEW_W / 2 - buttonW - 12, buttonY, buttonW, buttonH, 'Start over', BUTTON_STYLES[1], finale.choice === 0);
    drawPillButton(VIEW_W / 2 + 12, buttonY, buttonW, buttonH, 'Keep playing', BUTTON_STYLES[0], finale.choice === 1);
    tapButtons = [
      { x: VIEW_W / 2 - buttonW - 12, y: buttonY, w: buttonW, h: buttonH },
      { x: VIEW_W / 2 + 12, y: buttonY, w: buttonW, h: buttonH },
    ];
  }
}

function draw() {
  const scene = SCENES[sceneIndex];
  const bg = sceneImages[sceneIndex];

  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  // Everything in the world moves with the camera
  ctx.save();
  ctx.translate(-Math.round(camera.x), 0);

  // Background
  if (bg.complete && bg.naturalWidth) ctx.drawImage(bg, 0, 0, scene.width, VIEW_H);

  // Cloud steps, signs to the next world, gems and the challenge's things
  drawClouds();
  if (started) {
    drawEdgeArrows();
    drawDoor();
    drawGems();
    drawChallenge();
    drawSign();
  }

  // Animals (behind Dahlia)
  for (const animal of animalsHere()) drawAnimal(animal);

  // On the title screen, that's all: the title card covers the rest
  if (!started) {
    ctx.restore();
    return;
  }

  // Dahlia (with a soft shadow under her), then the magic around her.
  // Falling into a hole? Only draw the part of her above the ground, so she drops into it.
  drawShadow();
  if (player.y > GROUND_Y + 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(camera.x, 0, VIEW_W, GROUND_Y);
    ctx.clip();
    drawPlayer();
    ctx.restore();
  } else {
    drawPlayer();
  }
  if (magic) drawMagic();
  drawSparkles();

  // Teleport puffs and countdowns (in front of Dahlia so you can always see them)
  for (const animal of animalsHere()) {
    if (animal.away) drawTeleport(animal);
  }

  // "Talk" bubble on top of everything, over the closest animal
  const friend = nearbyAnimal();
  if (friend && !talk && !magic) drawTalkBubble(friend);
  if (!talk && !magic) drawSignClue();

  ctx.restore();

  // These stay in the same place on the screen, so they're drawn after the camera
  const boxOpen = talk || puzzle;
  if (talk) drawTalkBox();
  drawConfetti();
  if (!boxOpen) drawFriendBook();
  if (!boxOpen) drawCounters();
  if (!boxOpen) drawMuteButton();
  if (sceneTitle && !boxOpen) drawSceneTitle();
  if (puzzle) drawPuzzle();
  if (finale) drawFinale();
  if (sceneChange) drawFade();
}

// Round sound button in the top right corner
function drawMuteButton() {
  const b = MUTE_BUTTON;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFDF7';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();
  const icon = muted ? images.soundOff : images.soundOn;
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, b.x - 18, b.y - 18, 36, 36);
}

// The Friend Book, next to the mute button: one sticker spot for every animal
function drawFriendBook() {
  const slotR = 20;   // sticker size (radius)
  const gap = 8;
  const pad = 14;
  const slotsW = ANIMALS.length * slotR * 2 + (ANIMALS.length - 1) * gap;
  const w = slotsW + pad * 2 + 10;   // + 10 for the book spine
  const h = 88;
  const right = MUTE_BUTTON.x - MUTE_BUTTON.r - 12;
  const x = right - w;
  const y = 16;

  // The book: paper page with a pink spine on the left
  roundedBox(x, y, w, h, 14);
  ctx.fillStyle = '#FFFDF7';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#E6378F';
  ctx.fillRect(x, y, 10, h);
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();

  // Title
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = '#E6378F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Friend Book', x + 10 + (w - 10) / 2, y + 20);

  // Sticker spots
  ANIMALS.forEach((animal, i) => {
    const cx = x + 10 + pad + slotR + i * (slotR * 2 + gap);
    const cy = y + 58;
    const has = stickers.includes(animal.name);

    // A brand new sticker waits a moment, then pops in with a bounce
    let scale = 1;
    let showIt = has;
    if (newSticker && newSticker.name === animal.name) {
      if (newSticker.t < 0) showIt = false;
      else scale = popScale(Math.min(1, newSticker.t / POP_TIME)) * 1.1;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, slotR, 0, Math.PI * 2);
    if (showIt) {
      // Sticker: white circle with Dahlia-as-that-animal inside
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3A2626';
      ctx.stroke();
      const img = animal.dahliaImg;
      if (img.complete && img.naturalWidth) {
        const size = slotR * 1.6;
        const ratio = img.naturalWidth / img.naturalHeight;
        const iw = ratio > 1 ? size : size * ratio;
        const ih = ratio > 1 ? size / ratio : size;
        ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
      }
    } else {
      // Empty spot: dashed circle with a question mark
      ctx.fillStyle = '#F4EEE6';
      ctx.fill();
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3A2626';
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `700 20px ${FONT}`;
      ctx.fillStyle = '#B8A8A0';
      ctx.fillText('?', 0, 1);
    }
    ctx.restore();

    // Gold star on the sticker when she finished that animal's challenge
    if (showIt && hasStar(animal.name)) {
      let starScale = 1;
      if (newStar && newStar.name === animal.name) {
        if (newStar.t < 0) return; // not yet
        starScale = popScale(Math.min(1, newStar.t / POP_TIME)) * 1.2;
      }
      drawGoldStar(cx + slotR * 0.75, cy - slotR * 0.75, 10 * starScale);
    }
  });
}

// A 5-pointed gold star with an outline
function drawGoldStar(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45; // points, then the dips between them
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = '#FFD166';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();
}

// A soft shadow on the ground (or cloud) under Dahlia. Smaller when she's higher up.
function drawShadow() {
  let floor = GROUND_Y;
  for (const cloud of SCENES[sceneIndex].clouds || []) {
    const over = player.x > cloud.x && player.x < cloud.x + cloud.w;
    if (over && cloud.y >= player.y - 1 && cloud.y < floor) floor = cloud.y;
  }
  const scale = Math.max(0.35, 1 - (floor - player.y) / 300);
  ctx.beginPath();
  ctx.ellipse(player.x, floor, 34 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(58, 38, 38, 0.18)';
  ctx.fill();
}

// Bobbing arrows at the edges of a world: "there's more this way!"
function drawEdgeArrows() {
  const scene = SCENES[sceneIndex];
  const nudge = Math.sin(time * 4) * 6;
  if (sceneIndex < SCENES.length - 1) {
    drawSprite(images.arrow, scene.width - 70 + nudge, 400, 44, 1, 1, 1, Math.PI / 2);
  }
  if (sceneIndex > 0) {
    drawSprite(images.arrow, 70 - nudge, 400, 44, 1, 1, 1, -Math.PI / 2);
  }
}

// Top left: what's left to do. The level and its stars, the gems in this level,
// how the challenge here is going (like "Hoops 2 / 5"), and the magic door when it's open.
function drawCounters() {
  const challenges = SCENES.filter(scene => scene.challenge);
  const done = challenges.filter(scene => scene.challenge.done).length;
  const pills = [
    { icon: 'star', text: `Level ${level}   ${done} / ${challenges.length}`, pop: 0 },
    { icon: images.gem, text: `${levelGemsFound()} / ${levelGemTotal()}`, pop: gemPop },
  ];

  const c = SCENES[sceneIndex].challenge;
  const info = c && !c.done && !c.locked && CHALLENGES[c.type].progress ? CHALLENGES[c.type].progress(c) : null;
  if (info && info.got > 0) pills.push({ text: `${info.label} ${info.got} / ${info.total}`, pop: 0 });
  if (done === challenges.length && !levelComplete()) pills.push({ text: 'Find all the gems!', pop: 0 });
  if (doorOpen()) pills.push({ text: `Magic door: ${levelDoor().hint}`, pop: 0 });

  let y = 16;
  for (const pill of pills) {
    ctx.font = `700 22px ${FONT}`;
    const iconW = pill.icon ? 34 : 0;
    const w = ctx.measureText(pill.text).width + iconW + 32;
    const h = 44;
    const s = pill.pop > 0 ? popScale(1 - pill.pop / POP_TIME) : 1;

    ctx.save();
    ctx.translate(16 + w / 2, y + h / 2);
    ctx.scale(s, s);
    ctx.translate(-(16 + w / 2), -(y + h / 2));
    roundedBox(16, y, w, h, h / 2);
    ctx.fillStyle = '#FFFDF7';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3A2626';
    ctx.stroke();
    if (pill.icon === 'star') drawGoldStar(16 + 16 + 14, y + h / 2, 14);
    else if (pill.icon) drawSprite(pill.icon, 16 + 16 + 14, y + h - 7, 30, 1);
    ctx.fillStyle = '#E6378F';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(pill.text, 16 + 16 + iconW, y + h / 2 + 1);
    ctx.restore();

    y += h + 8;
  }
}

// Cloud steps (in Cloud Hills): fluffy clouds you can stand on
function drawClouds() {
  const img = images.cloudStep;
  if (!img.complete || !img.naturalWidth) return;
  for (const cloud of SCENES[sceneIndex].clouds || []) {
    const scale = cloud.w / 200;  // the picture is 200 wide
    // The fluffy top of the picture sits a little above where you stand
    ctx.drawImage(img, cloud.x, cloud.y - 14 * scale, cloud.w, 80 * scale);
  }
}

// Falling confetti (drawn in screen numbers, on top of the world)
function drawConfetti() {
  for (const c of confetti) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (c.life - c.age) / 0.5); // fades at the very end
    ctx.translate(c.x, c.y);
    ctx.rotate(c.spin);
    ctx.fillStyle = c.color;
    ctx.fillRect(-5, -7, 10, 14);
    ctx.restore();
  }
}

// The scene's name in a big pill at the top, for 2 seconds
function drawSceneTitle() {
  const t = sceneTitle.t;
  // Fade in for the first 0.3 seconds, fade out in the last 0.4 seconds
  ctx.globalAlpha = Math.min(1, t / 0.3, (NAME_TIME - t) / 0.4);

  ctx.font = `700 40px ${FONT}`;
  const w = ctx.measureText(sceneTitle.name).width + 60;
  const h = 64;
  const x = (VIEW_W - w) / 2;
  const y = 28;

  roundedBox(x, y, w, h, h / 2);
  ctx.fillStyle = '#FFFDF7';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();

  ctx.fillStyle = '#E6378F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sceneTitle.name, VIEW_W / 2, y + h / 2 + 2);
  ctx.globalAlpha = 1;
}

// Darkens the whole screen while changing scenes
function drawFade() {
  const t = sceneChange.t;
  const darkness = t < FADE_TIME ? t / FADE_TIME : 1 - (t - FADE_TIME) / FADE_TIME;
  ctx.globalAlpha = Math.max(0, Math.min(1, darkness));
  ctx.fillStyle = '#3A2626';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.globalAlpha = 1;
}

// ---------- The game loop ----------
// requestAnimationFrame calls us about 60 times a second.
let lastTime = performance.now();
function loop(now) {
  // dt = seconds since the last frame. Capped so a slow frame doesn't make her jump through the floor.
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  update(dt);
  draw();

  // A key press only counts for one frame
  for (const key in justPressed) delete justPressed[key];
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
