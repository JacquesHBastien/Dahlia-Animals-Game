// Magic Animals & Friends: the scenes (the four worlds)
// Each scene is one object. To add a scene, add one object here,
// put its background SVG in the assets folder, and give it a spot in every level in levels.js.
//
//   name:       shown on screen when Dahlia walks in
//   background: the picture behind everything
//   width:      how wide the scene is (the screen is 960 wide)
//
// Extras (a scene only needs the ones it uses):
//   trees:      trees Cat-Dahlia can climb. x = the trunk, top = how high she can climb
//   clouds:     cloud steps anyone can stand on. x = left end, y = the top, w = how wide
//               (a level can swap in different clouds, see levels.js)
//
// What's IN each world (animals, challenges, gems) changes every level: see levels.js.

const SCENES = [
  {
    name: 'Sunny Meadow',
    background: 'assets/scene-1-meadow.svg',
    width: 1920,
    trees: [
      { x: 331, top: 240 },
      { x: 1393, top: 130 },  // the big tall tree
    ],
  },
  {
    name: 'Mushroom Forest',
    background: 'assets/scene-2-forest.svg',
    width: 1920,
    trees: [
      { x: 262, top: 200 },
      { x: 732, top: 200 },
      { x: 1162, top: 200 },
      { x: 1612, top: 200 },
    ],
  },
  {
    name: 'Sparkle Pond',
    background: 'assets/scene-3-pond.svg',
    width: 1920,
  },
  {
    name: 'Cloud Hills',
    background: 'assets/scene-4-clouds.svg',
    width: 1920,
    clouds: [
      { x: 700, y: 360, w: 180 },
      { x: 950, y: 200, w: 200 },
    ],
  },
];
