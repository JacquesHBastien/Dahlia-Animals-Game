// Magic Animals & Friends: the animals
// Each animal is one object. To add an animal, add one object here
// and put its two SVGs (the animal, and Dahlia as that animal) in assets.
//
//   name:        what the animal is called
//   line:        what it says when you talk to it in Level 1 (keep it short!)
//   image:       the animal you meet
//   dahliaImage: Dahlia as this animal
//   movement:    how it moves: 'bigJump' (climbs trees), 'fly', 'roll' or 'doubleJump'
//   height:      how tall it is drawn
//   facesLeft:   true if the pictures look to the left (so we flip them the right way)
//
// Where each animal lives (and what it says in Levels 2 and 3) is in levels.js.
// How fast each form runs and jumps is in FORMS at the top of game.js.

const ANIMALS = [
  {
    name: 'Cat',
    line: 'Naps are just tiny vacations. Take one today!',
    image: 'assets/cat.svg',
    dahliaImage: 'assets/dahlia-cat.svg',
    movement: 'bigJump',
    height: 95,
    facesLeft: true,
  },
  {
    name: 'Hamster',
    line: 'Why did the hamster run on the wheel? To get a little wheel-y fit!',
    image: 'assets/hamster.svg',
    dahliaImage: 'assets/dahlia-hamster.svg',
    movement: 'roll',
    height: 80,
  },
  {
    name: 'Butterfly',
    line: 'Even I started as a caterpillar. Slow is still growing!',
    image: 'assets/butterfly.svg',
    dahliaImage: 'assets/dahlia-butterfly.svg',
    movement: 'fly',
    height: 80,
  },
  {
    name: 'Bunny',
    line: "When you're nervous, take a big bunny breath. Sniff, sniff, ahhh.",
    image: 'assets/bunny.svg',
    dahliaImage: 'assets/dahlia-bunny.svg',
    movement: 'doubleJump',
    height: 110,
  },
];
