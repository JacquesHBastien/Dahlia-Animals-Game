// Magic Animals & Friends: the levels
// The same four worlds, five times. Every level the animals move to new homes,
// and every world gets a new, harder challenge.
// A level is complete when ALL its challenges are done AND all its gems are found.
// Then a magic door to the next level appears somewhere. The level's "door" clue says where.
//
//   gate:   what hides the challenges until you solve a puzzle at the star sign
//           null = nothing, 'pattern' = a picture pattern, 'math' = a math problem,
//           'bigMath' = harder math, 'riddle' = a riddle (grown-ups can help!)
//   door:   where the magic door to the next level appears. scene, x, and
//           clue (said on the "Level complete!" sign) + hint (a short reminder at the top)
//   homes:  where each animal lives this level. scene = which world (0 = Sunny Meadow), x = where
//   lines:  what the animals say this level (if not given, they say their line from animals.js).
//           These are little clues!
//   scenes: one entry per world (same order as scenes.js):
//     challenge: the challenge in that world
//       type:   which kind of challenge (see challenges.js)
//       animal: who you have to become to do it
//       sign:   where its gold star sign stands (x)
//       clue:   what the sign says when you stand next to it (a hint, not the answer!)
//       start:  (holes and water) the start flag. The run starts here, and you go back here if you fall in.
//       windy:  (holes and sky clouds) a strong wind: nobody can fly over this challenge
//       sky:    (sky clouds) the drifting clouds are up in the air; touching the ground = start over
//     gems:   gems to find (x, y = where each one floats)
//     clouds: different cloud steps for this level (optional; [] = none)

const LEVELS = [
  // ---------- Level 1 ----------
  {
    gate: null,
    door: { scene: 2, x: 300,
      clue: 'The magic door is next to the friend who can roll like a ball.',
      hint: 'next to the rolling friend' },
    homes: {
      Cat:       { scene: 1, x: 900 },
      Hamster:   { scene: 2, x: 420 },
      Butterfly: { scene: 3, x: 400 },
      Bunny:     { scene: 0, x: 700 },
    },
    scenes: [
      { // Sunny Meadow
        challenge: { type: 'kite', animal: 'Cat', tree: 1, sign: 1230,
          clue: 'My kite is stuck way up high! Who is good at climbing trees?' },
        gems: [{ x: 500, y: 410 }, { x: 900, y: 250 }, { x: 331, y: 180 }, { x: 1393, y: 60 }, { x: 1750, y: 120 }],
      },
      { // Mushroom Forest
        challenge: { type: 'bowling', animal: 'Hamster', x: 1240, pins: 6, sign: 1110,
          clue: 'Knock down all the pins! Who can roll like a ball?' },
        gems: [{ x: 400, y: 410 }, { x: 700, y: 250 }, { x: 1162, y: 110 }, { x: 1520, y: 120 }, { x: 1850, y: 410 }],
      },
      { // Sparkle Pond
        challenge: { type: 'hoops', animal: 'Butterfly', sign: 545,
          hoops: [{ x: 640, y: 300 }, { x: 790, y: 200 }, { x: 960, y: 150 }, { x: 1140, y: 220 }, { x: 1310, y: 290 }],
          clue: 'Go through every hoop. They are so high... you need wings!' },
        gems: [{ x: 250, y: 410 }, { x: 820, y: 250 }, { x: 1050, y: 90 }, { x: 1500, y: 250 }, { x: 1800, y: 410 }],
      },
      { // Cloud Hills
        challenge: { type: 'carrot', animal: 'Bunny', x: 1090, y: 200, sign: 590,
          clue: 'A yummy carrot is up on the clouds. Hop... and hop again!' },
        gems: [{ x: 250, y: 410 }, { x: 790, y: 260 }, { x: 1050, y: 110 }, { x: 1500, y: 100 }, { x: 1850, y: 410 }],
      },
    ],
  },

  // ---------- Level 2: memory and careful moves. A pattern puzzle clears the fog. ----------
  {
    gate: 'pattern',
    door: { scene: 3, x: 230,
      clue: 'The door is next to the friend who says "Roll, roll... STOP!" Did you talk to everyone?',
      hint: 'next to the "Roll, roll... STOP!" friend' },
    homes: {
      Cat:       { scene: 0, x: 700 },
      Bunny:     { scene: 1, x: 900 },
      Butterfly: { scene: 2, x: 420 },
      Hamster:   { scene: 3, x: 400 },
    },
    lines: {
      Cat:       'Birds love the tall pine trees. I love watching birds!',
      Bunny:     'Up, up, up on the clouds... something golden is shining!',
      Butterfly: 'Flowers floating in the sky? Only wings can visit them!',
      Hamster:   'The sand by the pond is perfect for rolling. Roll, roll... STOP!',
    },
    scenes: [
      { // Sunny Meadow: sky flowers light up in a pattern. Visit them in the same order.
        challenge: { type: 'sequence', art: 'flower', animal: 'Butterfly', length: 3, sign: 470,
          targets: [{ x: 640, y: 230 }, { x: 820, y: 150 }, { x: 1000, y: 240 }, { x: 1180, y: 160 }],
          clue: 'Watch the flowers light up. Visit them in the same order!' },
        gems: [{ x: 180, y: 250 }, { x: 560, y: 330 }, { x: 331, y: 180 }, { x: 1393, y: 60 }, { x: 1800, y: 200 }],
      },
      { // Mushroom Forest: a bird hides her egg in one tree top. Remember which one!
        challenge: { type: 'nest', animal: 'Cat', trees: [0, 1, 2], sign: 560,
          clue: 'A bird hid her egg in a tree top. Watch where she goes!' },
        gems: [{ x: 150, y: 410 }, { x: 262, y: 110 }, { x: 732, y: 110 }, { x: 1300, y: 250 }, { x: 1612, y: 110 }],
      },
      { // Sparkle Pond: roll and stop right on each X
        challenge: { type: 'rollTargets', animal: 'Hamster', targets: [300, 1480, 1700], zone: 50, sign: 150,
          clue: 'Roll and stop right on top of each X!' },
        gems: [{ x: 100, y: 410 }, { x: 700, y: 140 }, { x: 960, y: 100 }, { x: 1300, y: 250 }, { x: 1850, y: 410 }],
      },
      { // Cloud Hills: tricky little clouds up to the golden carrot
        challenge: { type: 'carrot', golden: true, animal: 'Bunny', x: 1300, y: 180, sign: 520,
          clue: 'The golden carrot is way up in the sky. Hop carefully!' },
        clouds: [
          { x: 600, y: 350, w: 130 },
          { x: 800, y: 200, w: 110 },
          { x: 1030, y: 320, w: 100 },
          { x: 1240, y: 180, w: 120 },
        ],
        gems: [{ x: 200, y: 300 }, { x: 860, y: 150 }, { x: 1080, y: 260 }, { x: 1300, y: 120 }, { x: 1600, y: 410 }],
      },
    ],
  },

  // ---------- Level 3: longer memory, smaller spots. A math problem clears the fog. ----------
  {
    gate: 'math',
    door: { scene: 1, x: 1820,
      clue: 'Find the world with the numbered hoops. The door is at the very, very end!',
      hint: 'at the end of the numbered-hoop world' },
    homes: {
      Butterfly: { scene: 0, x: 700 },
      Hamster:   { scene: 1, x: 900 },
      Cat:       { scene: 2, x: 420 },
      Bunny:     { scene: 3, x: 400 },
    },
    lines: {
      Butterfly: 'Count with me: one, two, three... the forest hoops like to go in order!',
      Hamster:   'The meadow has the best spots for rolling. Can you stop on every one?',
      Cat:       'Stars fall over the cloud hills... I could catch them with one BIG jump!',
      Bunny:     'Ding, dong! The pond bells sing a long song. Can you remember it?',
    },
    scenes: [
      { // Sunny Meadow: stop on every X, in order, with small spots
        challenge: { type: 'rollTargets', ordered: true, animal: 'Hamster', targets: [450, 800, 1150, 1600], zone: 30, sign: 280,
          clue: 'Stop on every X: 1, 2, 3, 4. Start from just the right spot!' },
        gems: [{ x: 120, y: 410 }, { x: 331, y: 180 }, { x: 1393, y: 60 }, { x: 1000, y: 90 }, { x: 1850, y: 130 }],
      },
      { // Mushroom Forest: numbered hoops, in order
        challenge: { type: 'hoops', ordered: true, animal: 'Butterfly', sign: 250,
          hoops: [{ x: 400, y: 280 }, { x: 600, y: 190 }, { x: 820, y: 310 }, { x: 1020, y: 180 }, { x: 1260, y: 290 }, { x: 1480, y: 200 }, { x: 1680, y: 300 }],
          clue: 'Fly through the hoops in order: 1, 2, 3, 4, 5, 6, 7!' },
        gems: [{ x: 600, y: 90 }, { x: 1162, y: 110 }, { x: 1612, y: 110 }, { x: 1050, y: 410 }, { x: 1800, y: 250 }],
      },
      { // Sparkle Pond: bells high over the pond play a long song. Ring it back.
        challenge: { type: 'sequence', art: 'bell', animal: 'Bunny', length: 6, sign: 560,
          targets: [{ x: 700, y: 180 }, { x: 880, y: 170 }, { x: 1060, y: 180 }, { x: 1240, y: 170 }],
          clue: 'Listen to the bells. Ring them back in the same order!' },
        gems: [{ x: 300, y: 250 }, { x: 960, y: 80 }, { x: 1150, y: 200 }, { x: 1600, y: 120 }, { x: 1820, y: 410 }],
      },
      { // Cloud Hills: catch falling stars before they fade (more of them, and faster)
        challenge: { type: 'fallingStars', animal: 'Cat', count: 7, fast: true, x0: 500, x1: 1500, fadeY: 270, sign: 560,
          clue: 'Catch 7 falling stars before they fade away!' },
        gems: [{ x: 300, y: 410 }, { x: 790, y: 260 }, { x: 1050, y: 110 }, { x: 1500, y: 100 }, { x: 1800, y: 250 }],
      },
    ],
  },

  // ---------- Level 4: holes, crumbling clouds, rain clouds, and one-roll bowling. ----------
  // Mess up, and you start that challenge over! Harder math clears the fog.
  // The hole run is in Cloud Hills, the last world, so the holes never block the way.
  {
    gate: 'bigMath',
    door: { scene: 0, x: 1500,
      clue: 'The door is waiting under the tallest tree in all the worlds.',
      hint: 'under the tallest tree' },
    homes: {
      Hamster:   { scene: 0, x: 300 },
      Cat:       { scene: 1, x: 900 },
      Bunny:     { scene: 2, x: 420 },
      Butterfly: { scene: 3, x: 250 },
    },
    lines: {
      Hamster:   'Ten pins, ONE roll. A strike needs the perfect start!',
      Cat:       'Some clouds in the meadow are wobbly. Do not stand still on them!',
      Bunny:     'Holes in the cloud hills! A good hopper hops, and hops again.',
      Butterfly: 'Shh! Rain clouds are sleeping by the pond. Do not bump them!',
    },
    scenes: [
      { // Sunny Meadow: clouds that puff away after you stand on them. Touch the ground = start over.
        challenge: { type: 'crumbleClouds', animal: 'Cat', sign: 500,
          platforms: [{ x: 600, y: 340, w: 100 }, { x: 780, y: 240, w: 90 }, { x: 980, y: 170, w: 90 }, { x: 1180, y: 250, w: 90 }, { x: 1370, y: 150, w: 100 }],
          goal: { x: 1420, y: 100 },
          clue: 'These clouds puff away! Jump quickly to the star at the top.' },
        gems: [{ x: 200, y: 410 }, { x: 331, y: 180 }, { x: 830, y: 170 }, { x: 1700, y: 200 }, { x: 1850, y: 410 }],
      },
      { // Mushroom Forest: 10 pins, and ONE roll has to knock them all down
        challenge: { type: 'bowling', strike: true, animal: 'Hamster', x: 1200, pins: 10, spacing: 34, sign: 1080,
          clue: 'Strike! Knock down all 10 pins with just one roll.' },
        gems: [{ x: 200, y: 410 }, { x: 262, y: 110 }, { x: 732, y: 110 }, { x: 1612, y: 110 }, { x: 1000, y: 250 }],
      },
      { // Sparkle Pond: numbered hoops with sleepy rain clouds in between. Bump one = start over.
        challenge: { type: 'hoops', ordered: true, animal: 'Butterfly', sign: 545,
          hoops: [{ x: 640, y: 300 }, { x: 780, y: 180 }, { x: 920, y: 300 }, { x: 1060, y: 180 }, { x: 1200, y: 300 }, { x: 1340, y: 180 }],
          sleepy: [{ x: 710, y: 240 }, { x: 850, y: 240 }, { x: 990, y: 240 }, { x: 1130, y: 240 }, { x: 1270, y: 240 }],
          clue: 'Fly through the hoops in order... and do NOT wake the rain clouds!' },
        gems: [{ x: 100, y: 410 }, { x: 500, y: 140 }, { x: 1500, y: 120 }, { x: 1700, y: 300 }, { x: 1860, y: 410 }],
      },
      { // Cloud Hills: holes in the path. Hop over them all as Bunny to reach the carrot.
        // Too windy to fly here!
        challenge: { type: 'pitRun', windy: true, animal: 'Bunny', sign: 400, start: 480,
          pits: [{ x: 560, w: 110 }, { x: 780, w: 170 }, { x: 1040, w: 250 }, { x: 1370, w: 300 }],
          goal: { x: 1780, art: 'carrot' },
          clue: 'Start at the flag. Hop over every hole to the carrot. Fall in, and back you go!' },
        clouds: [],
        gems: [{ x: 150, y: 410 }, { x: 420, y: 250 }, { x: 865, y: 300 }, { x: 1165, y: 260 }, { x: 1850, y: 410 }],
      },
    ],
  },

  // ---------- Level 5: the hardest! Wide holes, drifting sky clouds, bouncing rain clouds, a long egg hunt. ----------
  // Riddles clear the fog (grown-ups can help).
  {
    gate: 'riddle',
    door: null, // the last level: no door, just a big celebration
    homes: {
      Hamster:   { scene: 0, x: 300 },
      Butterfly: { scene: 1, x: 900 },
      Bunny:     { scene: 2, x: 420 },
      Cat:       { scene: 3, x: 250 },
    },
    lines: {
      Cat:       'The bird in the forest hid FOUR eggs this time. Watch the order carefully!',
      Bunny:     'Frog is waiting way up on a sky cloud in the meadow. The clouds drift around!',
      Butterfly: 'The rain clouds over the pond are awake and bouncing. Wait for a gap!',
      Hamster:   'Some holes are too wide to jump. But if you jump while you ROLL...',
    },
    scenes: [
      { // Sunny Meadow: drifting clouds up to Frog. Touch the ground = start over. Too windy to fly!
        challenge: { type: 'pitRun', sky: true, windy: true, animal: 'Bunny', sign: 380, start: 440,
          pits: [],
          pads: [{ x: 520, y: 330, w: 90, range: 60, speed: 1.4 }, { x: 720, y: 210, w: 80, range: 80, speed: 1.9 },
                 { x: 940, y: 300, w: 75, range: 90, speed: 2.2 }, { x: 1110, y: 190, w: 75, range: 70, speed: 1.7 },
                 { x: 1230, y: 170, w: 130, range: 0, speed: 0 }],
          goal: { x: 1300, y: 170, art: 'frog' },
          clue: 'Frog is up on the top cloud! Hop up the drifting clouds. Touch the ground, and start again!' },
        gems: [{ x: 250, y: 410 }, { x: 331, y: 180 }, { x: 1000, y: 220 }, { x: 1393, y: 60 }, { x: 1850, y: 410 }],
      },
      { // Mushroom Forest: the bird hides 4 eggs. Find them in the same order.
        challenge: { type: 'nest', eggs: 4, animal: 'Cat', trees: [0, 1, 2], sign: 560,
          clue: 'The bird hides 4 eggs, one by one. Find them in the same order!' },
        gems: [{ x: 150, y: 410 }, { x: 262, y: 110 }, { x: 1162, y: 110 }, { x: 1612, y: 110 }, { x: 1850, y: 250 }],
      },
      { // Sparkle Pond: numbered hoops, with rain clouds bouncing up and down in the way
        challenge: { type: 'hoops', ordered: true, animal: 'Butterfly', sign: 280,
          hoops: [{ x: 500, y: 220 }, { x: 700, y: 150 }, { x: 900, y: 250 }, { x: 1100, y: 150 }, { x: 1300, y: 250 }, { x: 1500, y: 170 }],
          sleepy: [{ x: 600, y: 200, move: 110, speed: 1.3 }, { x: 800, y: 200, move: 110, speed: 1.7 },
                   { x: 1000, y: 200, move: 110, speed: 1.5 }, { x: 1200, y: 200, move: 110, speed: 2.0 },
                   { x: 1400, y: 200, move: 110, speed: 1.6 }],
          clue: 'The rain clouds are awake and bouncing! Wait for a gap, then fly.' },
        gems: [{ x: 200, y: 410 }, { x: 900, y: 330 }, { x: 1150, y: 300 }, { x: 1700, y: 200 }, { x: 1860, y: 410 }],
      },
      { // Cloud Hills: wide holes. Only a rolling jump (roll, then jump!) gets across. Too windy to fly!
        challenge: { type: 'pitRun', windy: true, animal: 'Hamster', sign: 400, start: 480,
          pits: [{ x: 600, w: 200 }, { x: 950, w: 260 }, { x: 1350, w: 300 }],
          goal: { x: 1790, art: 'star' },
          clue: 'Start at the flag. These holes are too wide to jump... unless you jump while you roll!' },
        clouds: [],
        gems: [{ x: 150, y: 410 }, { x: 700, y: 330 }, { x: 1080, y: 250 }, { x: 1280, y: 410 }, { x: 1850, y: 410 }],
      },
    ],
  },
];
