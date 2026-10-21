// Magic Animals & Friends: the challenges and puzzles
//
// Every challenge type has these parts:
//   setup(c, scene): makes its things (pins, hoops...) when a level starts
//   update(c, dt):   every frame, checks what Dahlia is doing
//   draw(c):         paints its things
//   spots(c):        where the magic fog sits while the challenge is hidden (Levels 2 and 3)
//   progress(c):     (optional) how far along she is, like "Hoops 2 / 5"
//   pits(c):         (optional) holes or deep water in the ground. Fall in = start over
//   platforms(c):    (optional) extra things to stand on (lily pads, crumbling clouds)
//   restart(c):      (optional) puts the challenge back to the start after a fall
//
// Only the right animal can finish each one. No timers. In Levels 1-3 a mistake
// just shows you again. In Levels 4 and 5, a mistake means starting that challenge over.
//
// This file uses things from game.js (player, drawSprite, Sounds...), so it only
// runs its code once the game is going.

// The four kinds of notes for memory games (one for each flower or bell): C, E, G, high C
const CHIME_NOTES = [72, 76, 79, 84];
const TARGET_COLORS = ['#E6378F', '#3B8FE0', '#FFD166', '#C9A7F5']; // pink, blue, yellow, lavender

// Is any part of Dahlia (feet to head) touching the point (x, y)?
function touchingPlayer(x, y, reach = 40) {
  return Math.abs(player.x - x) < reach && y > player.y - player.move.height - 15 && y < player.y + 10;
}

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const shuffle = list => list.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);

const CHALLENGES = {
  // ---------- Level 1 ----------

  // A kite stuck at the top of a tree. Climb up as Cat to set it free.
  kite: {
    setup(c, scene) {
      c.treeInfo = scene.trees[c.tree];
      c.x = c.treeInfo.x - 46;      // in the leaves, a little to the left
      c.y = c.treeInfo.top + 10;
      c.freeTime = c.done ? 2 : 0;  // counts up after it's free
    },
    update(c, dt) {
      if (c.done) {
        c.freeTime += dt;
        return;
      }
      const atTop = player.climbing === c.treeInfo && player.y <= c.treeInfo.top + 1;
      if (atTop && isForm(c.animal)) finishChallenge(c);
    },
    spots(c) { return [{ x: c.x, y: c.y }]; },
    draw(c) {
      let x = c.x, y = c.y, tilt = 0.6 + Math.sin(time * 3) * 0.05; // stuck: tilted and wiggling
      if (c.done) {
        // Free! It floats into the sky and dances there
        const up = Math.min(1, c.freeTime / 2);
        x += up * 140;
        y -= up * 20;
        tilt = Math.sin(time * 2) * 0.25;
      }
      drawSprite(images.kite, x, y + 45, 90, 1, 1, 1, tilt);
    },
  },

  // Bowling pins. Roll into them as Hamster (press Down).
  // With strike: true, ONE roll has to knock them all down, or they all stand back up.
  bowling: {
    setup(c) {
      c.rollHit = false;     // did this roll knock any pins?
      c.wasRolling = false;
      c.resetTimer = 0;
      c.pinList = [];
      for (let i = 0; i < c.pins; i++) {
        const pin = { x: c.x + i * (c.spacing || 28), y: GROUND_Y, state: 'up', vx: 0, vy: 0, spin: 0, spinSpeed: 1, wobble: 0 };
        if (c.done) Object.assign(pin, { state: 'down', spin: Math.PI / 2 }); // already knocked over
        c.pinList.push(pin);
      }
    },
    update(c, dt) {
      const rolling = isForm(c.animal) && player.rollTimer > 0 && player.y > GROUND_Y - 30;
      // Strike mode: after a roll that hit pins, if any are still standing, they all pop back up
      if (c.strike && !c.done) {
        if (c.resetTimer > 0) {
          c.resetTimer -= dt;
          if (c.resetTimer <= 0) {
            CHALLENGES.bowling.setup(c);
            Sounds.play('teleportBack');
            sceneTitle = { name: 'Not a strike! Try again!', t: 0 };
          }
          return;
        }
        if (c.wasRolling && !rolling && c.rollHit) {
          c.rollHit = false;
          if (c.pinList.some(pin => pin.state === 'up')) c.resetTimer = 1.2; // wait for the pins to land
        }
        c.wasRolling = rolling;
      }
      for (const pin of c.pinList) {
        if (pin.state === 'up') {
          if (Math.abs(player.x - pin.x) < 26 && player.y > GROUND_Y - 60) {
            if (rolling) {
              knockPin(pin, player.facing, 1);
              c.rollHit = true;
            }
            else if (pin.wobble <= 0) pin.wobble = 0.5; // just bumped: it wobbles
          }
          pin.wobble = Math.max(0, pin.wobble - dt);
        } else if (pin.state === 'flying') {
          pin.vy += 1800 * dt;
          pin.x += pin.vx * dt;
          pin.y += pin.vy * dt;
          pin.spin += pin.spinSpeed * dt;
          // A flying pin can knock over the pins next to it (not in strike mode: every pin needs the roll!)
          if (!c.strike) for (const other of c.pinList) {
            if (other.state === 'up' && Math.abs(other.x - pin.x) < 20) knockPin(other, Math.sign(pin.vx) || 1, 0.7);
          }
          if (pin.y >= GROUND_Y && pin.vy > 0) {
            pin.y = GROUND_Y;
            pin.state = 'down';
            pin.spin = Math.sign(pin.spinSpeed) * Math.PI / 2; // lying on its side
          }
        }
      }
      if (!c.done && c.pinList.every(pin => pin.state === 'down')) finishChallenge(c);
    },
    spots(c) { return [{ x: c.x + c.pins * (c.spacing || 28) / 2, y: GROUND_Y - 40 }]; },
    progress(c) {
      return { label: 'Pins', got: c.pinList.filter(pin => pin.state !== 'up').length, total: c.pinList.length };
    },
    draw(c) {
      const h = 56;
      for (const pin of c.pinList) {
        if (pin.state === 'up') {
          const wobble = Math.sin(pin.wobble * 30) * 0.2 * pin.wobble;
          drawSprite(images.pin, pin.x, pin.y, h, 1, 1, 1, wobble);
        } else if (pin.state === 'flying') {
          drawSprite(images.pin, pin.x, pin.y, h, 1, 1, 1, pin.spin);
        } else {
          drawSprite(images.pin, pin.x, pin.y + h / 2 - 11, h, 1, 1, 1, pin.spin); // lying down
        }
      }
    },
  },

  // Hoops in the air. Fly through all of them as Butterfly.
  // With ordered: true they have numbers, and only the next number counts.
  // With sleepy: rain clouds sleep between the hoops (some bounce up and down).
  // Bump one and it rains, and all the hoops start over.
  hoops: {
    setup(c) {
      for (const hoop of c.hoops) {
        hoop.got = !!c.done;
        hoop.flash = 0;
      }
      c.clouds = (c.sleepy || []).map(cloud => ({ ...cloud, baseY: cloud.y, awake: 0 }));
      c.bumpWait = 0;
    },
    update(c, dt) {
      for (const hoop of c.hoops) hoop.flash = Math.max(0, hoop.flash - dt);
      c.bumpWait = Math.max(0, c.bumpWait - dt);
      for (const cloud of c.clouds) {
        cloud.awake = Math.max(0, cloud.awake - dt);
        if (cloud.move) cloud.y = cloud.baseY + Math.sin(time * cloud.speed + cloud.x) * cloud.move;
      }
      if (c.done) return;
      // Bumped a rain cloud? It rains on her, and the hoops start over
      const middleY = player.y - player.move.height / 2;
      const bumped = c.clouds.find(cloud => Math.hypot(player.x - cloud.x, middleY - cloud.y) < 52);
      if (bumped && c.bumpWait <= 0) {
        bumped.awake = 1.2;
        c.bumpWait = 1.2;
        Sounds.play('land');
        makeSparkles(bumped.x, bumped.y + 30, 10);
        if (c.hoops.some(hoop => hoop.got)) {
          for (const hoop of c.hoops) hoop.got = false;
          sceneTitle = { name: 'Oops! The rain cloud woke up!', t: 0 };
        }
        player.x += player.x < bumped.x ? -50 : 50; // a little push away
      }
      if (!isForm(c.animal)) return;
      const nextIndex = c.hoops.findIndex(hoop => !hoop.got);
      c.hoops.forEach((hoop, i) => {
        const inside = !hoop.got && Math.abs(player.x - hoop.x) < 24 && Math.abs(middleY - hoop.y) < 42;
        if (!inside) return;
        if (c.ordered && i !== nextIndex) {
          // Not this one yet! It blinks to say "find the right number first"
          if (hoop.flash <= 0) Sounds.play('land');
          hoop.flash = 0.6;
          return;
        }
        hoop.got = true;
        Sounds.play('hop');
        makeSparkles(hoop.x, hoop.y, 8);
      });
      if (c.hoops.every(hoop => hoop.got)) finishChallenge(c);
    },
    spots(c) { return c.hoops; },
    progress(c) {
      return { label: 'Hoops', got: c.hoops.filter(hoop => hoop.got).length, total: c.hoops.length };
    },
    draw(c) {
      for (const cloud of c.clouds) drawSleepyCloud(cloud.x, cloud.y, cloud.awake > 0);
      c.hoops.forEach((hoop, i) => {
        const bob = hoop.got ? 0 : Math.sin(time * 2 + hoop.x) * 4;
        const blink = hoop.flash > 0 && Math.sin(hoop.flash * 30) > 0;
        ctx.beginPath();
        ctx.ellipse(hoop.x, hoop.y + bob, 16, 48, 0, 0, Math.PI * 2);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#3A2626';
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.strokeStyle = hoop.got ? '#F48FC2' : blink ? '#FFFFFF' : '#FFD166'; // gold, then pink when done
        ctx.stroke();
        if (c.ordered) {
          // The hoop's number, above it
          ctx.font = `700 24px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#FFFDF7';
          ctx.strokeText(i + 1, hoop.x, hoop.y + bob - 64);
          ctx.fillStyle = hoop.got ? '#F48FC2' : '#3A2626';
          ctx.fillText(i + 1, hoop.x, hoop.y + bob - 64);
        }
      });
    },
  },

  // A carrot up on the clouds. Too high for one jump: double-jump as Bunny.
  carrot: {
    setup(c) {
      c.wiggle = 0;
    },
    update(c, dt) {
      c.wiggle = Math.max(0, c.wiggle - dt);
      if (c.done) return;
      const touching = player.onGround && Math.abs(player.x - c.x) < 40 && Math.abs(player.y - c.y) < 5;
      if (!touching) return;
      if (isForm(c.animal)) {
        makeSparkles(c.x, c.y - 30, 10);
        finishChallenge(c); // munch!
      } else if (c.wiggle <= 0) {
        c.wiggle = 0.5;    // the carrot wiggles: it's waiting for a bunny
      }
    },
    spots(c) { return [{ x: c.x, y: c.y - 30 }]; },
    draw(c) {
      if (c.done) return; // eaten!
      const y = c.y + Math.sin(time * 3) * 2;
      if (c.golden) {
        // A golden glow around the golden carrot
        ctx.beginPath();
        ctx.arc(c.x, y - 25, 34 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 209, 102, 0.45)';
        ctx.fill();
      }
      const wiggle = Math.sin(c.wiggle * 30) * 0.25 * c.wiggle;
      drawSprite(images.carrot, c.x, y, 50, 1, 1, 1, wiggle);
    },
  },

  // ---------- Level 2 and 3 ----------

  // Memory game: flowers (or bells) light up one at a time, with a note each.
  // Then touch them in the same order. A mistake? They show the song again.
  sequence: {
    setup(c) {
      c.order = [];
      while (c.order.length < c.length) {
        const pick = randomInt(0, c.targets.length - 1);
        if (pick !== c.order[c.order.length - 1]) c.order.push(pick); // never the same one twice in a row
      }
      c.phase = 'wait';   // wait (until she's close), show (lighting up), turn (her turn)
      c.timer = 0;
      c.showIndex = 0;
      c.step = 0;         // how many she got right so far
      c.lit = -1;         // which one is glowing right now
      c.litTime = 0;
      c.shake = 0;
      c.touching = -1;
    },
    update(c, dt) {
      c.litTime = Math.max(0, c.litTime - dt);
      if (c.litTime <= 0) c.lit = -1;
      c.shake = Math.max(0, c.shake - dt);
      if (c.done) return;
      const distance = Math.abs(player.x - sequenceMiddle(c));

      if (c.phase === 'wait') {
        if (distance < 450) startShow(c, 0.8);
        return;
      }
      if (c.phase === 'show') {
        c.timer += dt;
        if (c.timer >= 0.8) {
          c.timer = 0;
          if (c.showIndex < c.order.length) lightTarget(c, c.order[c.showIndex++]);
          else c.phase = 'turn';
        }
        return;
      }
      // Her turn
      if (distance > 700) {
        c.phase = 'wait'; // walked away: it shows the song again when she comes back
        return;
      }
      if (!isForm(c.animal)) return;
      const hit = c.targets.findIndex(t => touchingPlayer(t.x, t.y));
      if (hit === -1 || hit === c.touching) {
        c.touching = hit;
        return;
      }
      c.touching = hit;
      if (hit === c.order[c.step]) {
        lightTarget(c, hit);
        c.step++;
        if (c.step === c.order.length) finishChallenge(c);
      } else {
        // Oops! Everything shakes, then the song plays again
        c.shake = 0.6;
        Sounds.play('land');
        startShow(c, 1.4);
      }
    },
    spots(c) { return c.targets; },
    progress(c) {
      return c.phase === 'turn' || c.done ? { label: 'Song', got: c.step, total: c.order.length } : null;
    },
    draw(c) {
      c.targets.forEach((t, i) => {
        const shakeX = c.shake > 0 ? Math.sin(c.shake * 40) * 5 : 0;
        const glow = c.lit === i;
        const bob = Math.sin(time * 2 + i) * 4;
        const x = t.x + shakeX, y = t.y + bob;
        if (glow) {
          ctx.beginPath();
          ctx.arc(x, y, 44, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.fill();
        }
        if (c.art === 'bell') drawBell(x, y, TARGET_COLORS[i], glow);
        else drawFlower(x, y, TARGET_COLORS[i], glow);
      });
    },
  },

  // A bird flies to a tree top and hides her egg. Climb the right tree as Cat.
  // With eggs: 4, she hides 4 eggs one after another: find them in the same order.
  // The wrong tree? You start over, and the bird shows you again.
  nest: {
    setup(c, scene) {
      c.treeList = c.trees.map(i => scene.trees[i]);
      c.answers = [];  // which tree each egg is in, in order
      while (c.answers.length < (c.eggs || 1)) {
        const pick = randomInt(0, c.treeList.length - 1);
        if (pick !== c.answers[c.answers.length - 1]) c.answers.push(pick);
      }
      c.step = 0;      // how many eggs she found so far
      c.phase = c.done ? 'found' : 'wait'; // wait, show (bird flying), turn (her turn), found
      c.birdTime = 0;
      c.checked = null;
      c.rustle = 0;
      c.rustleTree = -1;
    },
    update(c, dt) {
      c.rustle = Math.max(0, c.rustle - dt);
      if (c.done) return;
      const middle = c.treeList.reduce((sum, t) => sum + t.x, 0) / c.treeList.length;
      const distance = Math.abs(player.x - middle);

      if (c.phase === 'wait') {
        if (distance < 500) {
          c.phase = 'show';
          c.birdTime = 0;
        }
        return;
      }
      if (c.phase === 'show') {
        c.birdTime += dt;
        if (c.birdTime >= BIRD_TRIP * c.answers.length) c.phase = 'turn';
        return;
      }
      if (distance > 800) c.phase = 'wait';

      // Reached the top of a tree?
      const tree = player.climbing;
      const atTop = tree && player.y <= tree.top + 1;
      if (!atTop) {
        c.checked = null;
        return;
      }
      if (tree === c.checked || !isForm(c.animal)) return;
      c.checked = tree;
      const which = c.treeList.indexOf(tree);
      if (which === -1) return;
      if (which === c.answers[c.step]) {
        c.step++;
        makeSparkles(tree.x + 22, tree.top - 6, 10);
        Sounds.play('hop');
        if (c.step === c.answers.length) {
          c.phase = 'found';
          finishChallenge(c);
        }
      } else {
        // Empty nest: the leaves rustle, and the bird shows you again from the start
        c.rustle = 0.6;
        c.rustleTree = which;
        Sounds.play('land');
        if (c.step > 0) sceneTitle = { name: 'Oops! Start again!', t: 0 };
        c.step = 0;
        c.phase = 'show';
        c.birdTime = 0;
      }
    },
    spots(c) { return c.treeList.map(t => ({ x: t.x, y: t.top - 10 })); },
    progress(c) {
      return c.answers.length > 1 ? { label: 'Eggs', got: c.step, total: c.answers.length } : null;
    },
    draw(c) {
      // Which nest the bird is sitting on right now (while she shows you)
      const trip = Math.floor(c.birdTime / BIRD_TRIP);
      const tripTime = c.birdTime - trip * BIRD_TRIP;
      const sittingOn = c.phase === 'show' && tripTime > BIRD_FLY && tripTime < BIRD_FLY + BIRD_SIT ? c.answers[trip] : -1;
      const foundTrees = c.phase === 'found' ? c.answers : c.answers.slice(0, c.step);
      c.treeList.forEach((tree, i) => {
        const shake = c.rustle > 0 && c.rustleTree === i ? Math.sin(c.rustle * 40) * 4 : 0;
        const egg = foundTrees.includes(i) || sittingOn === i;
        drawNest(tree.x + 22 + shake, tree.top - 6, egg);
      });
      if (c.phase === 'show') drawBirdTrip(c, trip, tripTime);
    },
  },

  // Roll as Hamster and STOP right on each X. Needs the right starting spot!
  // With ordered: true, the X's have numbers and must be done in order.
  rollTargets: {
    setup(c) {
      c.marks = c.targets.map(x => ({ x, got: !!c.done }));
      c.wasRolling = false;
      c.soClose = 0;
    },
    update(c, dt) {
      c.soClose = Math.max(0, c.soClose - dt);
      if (c.done) return;
      const rolling = isForm(c.animal) && player.rollTimer > 0;
      if (c.wasRolling && !rolling && isForm(c.animal)) {
        // A roll just ended. Did she stop on an X?
        const choices = c.ordered ? [c.marks.find(m => !m.got)] : c.marks.filter(m => !m.got);
        const best = choices.reduce((a, b) => Math.abs(player.x - a.x) < Math.abs(player.x - b.x) ? a : b);
        const off = Math.abs(player.x - best.x);
        if (off <= c.zone / 2) {
          best.got = true;
          Sounds.play('hop');
          makeSparkles(best.x, GROUND_Y - 20, 10);
          if (c.marks.every(m => m.got)) finishChallenge(c);
        } else if (off <= c.zone * 1.6) {
          c.soClose = 1.2; // almost!
          Sounds.play('select');
        }
      }
      c.wasRolling = rolling;
    },
    spots(c) { return c.marks.map(m => ({ x: m.x, y: GROUND_Y - 20 })); },
    progress(c) {
      return { label: 'Spots', got: c.marks.filter(m => m.got).length, total: c.marks.length };
    },
    draw(c) {
      const next = c.marks.find(m => !m.got);
      c.marks.forEach((mark, i) => {
        const y = GROUND_Y + 22;
        if (mark.got) {
          drawGoldStar(mark.x, y, 16);
        } else {
          const pulse = mark === next ? 1 + Math.sin(time * 6) * 0.12 : 1;
          // The landing zone, then a big X in the middle
          ctx.beginPath();
          ctx.ellipse(mark.x, y, c.zone / 2 + 6, 10, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(230, 55, 143, 0.18)';
          ctx.fill();
          drawX(mark.x, y, 13 * pulse);
        }
        if (c.ordered) {
          ctx.font = `700 22px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = mark.got ? '#F48FC2' : '#3A2626';
          ctx.fillText(i + 1, mark.x, y + 30);
        }
      });
      // "So close!" over Hamster-Dahlia
      if (c.soClose > 0) {
        ctx.globalAlpha = Math.min(1, c.soClose * 2);
        ctx.font = `700 24px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#FFFDF7';
        ctx.strokeText('So close!', player.x, player.y - player.move.height - 24);
        ctx.fillStyle = '#E6378F';
        ctx.fillText('So close!', player.x, player.y - player.move.height - 24);
        ctx.globalAlpha = 1;
      }
    },
  },

  // Stars fall from the sky and fade before they reach the ground.
  // Jump up and catch them as Cat! A missed star just comes back.
  fallingStars: {
    setup(c) {
      c.caught = c.done ? c.count : 0;
      c.falling = [];
      c.spawnTimer = 0;
    },
    update(c, dt) {
      if (c.done) return;
      const middle = (c.x0 + c.x1) / 2;
      if (Math.abs(player.x - middle) > 800) return; // only while she's nearby

      // Up to 2 stars at a time, starting near Dahlia so she can see them
      c.spawnTimer -= dt;
      if (c.falling.length < 2 && c.spawnTimer <= 0) {
        const x = Math.max(c.x0, Math.min(c.x1, player.x + randomInt(-320, 320)));
        const speed = c.fast ? randomInt(100, 170) : randomInt(70, 130);
        c.falling.push({ x, y: -20, speed, sway: Math.random() * 6 });
        c.spawnTimer = c.fast ? 1.0 : 1.3;
      }
      for (const star of c.falling) {
        star.y += star.speed * dt;
        star.drawX = star.x + Math.sin(time * 2 + star.sway) * 14;
        if (isForm(c.animal) && touchingPlayer(star.drawX, star.y, 45)) {
          star.caught = true;
          c.caught++;
          Sounds.play('hop');
          makeSparkles(star.drawX, star.y, 8);
        } else if (star.y >= c.fadeY) {
          star.gone = true; // faded away (another one will come)
        }
      }
      c.falling = c.falling.filter(s => !s.caught && !s.gone);
      if (c.caught >= c.count) finishChallenge(c);
    },
    spots(c) { return [{ x: (c.x0 + c.x1) / 2, y: 200 }]; },
    progress(c) { return { label: 'Stars', got: c.caught, total: c.count }; },
    draw(c) {
      for (const star of c.falling) {
        // Fades out over the last 60 pixels
        ctx.globalAlpha = Math.max(0, Math.min(1, (c.fadeY - star.y) / 60));
        ctx.beginPath();
        ctx.arc(star.drawX, star.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
        ctx.fill();
        drawGoldStar(star.drawX, star.y, 15);
        ctx.globalAlpha = 1;
      }
    },
  },
  // ---------- Level 4 and 5 ----------

  // A run over holes (or deep water) to a prize at the end.
  // The run starts at the flag: fall in a hole and you go back to the flag.
  // With pads: lily pads (or, with sky: true, clouds up in the air) drift back and forth.
  //   Ride them! In the sky, touching the ground means starting over.
  // With windy: true, a strong wind blows, so nobody can fly over it.
  pitRun: {
    setup(c) {
      c.padList = (c.pads || []).map(pad => ({ ...pad, baseX: pad.x, y: pad.y || GROUND_Y - 8, dx: 0 }));
      c.goalY = c.goal.y || GROUND_Y;
      c.onPad = false;     // (sky) has she been up on the clouds?
      c.cheer = 0;
      c.started = false;   // has she been to the start flag as the right animal?
      c.needStart = 0;     // shows "Start at the flag!" for a moment
    },
    update(c, dt) {
      c.cheer = Math.max(0, c.cheer - dt);
      // Move the lily pads, and carry Dahlia along if she's standing on one
      c.padList.forEach((pad, i) => {
        const oldX = pad.x;
        pad.x = pad.baseX + Math.sin(time * pad.speed + i * 1.7) * pad.range;
        pad.dx = pad.x - oldX;
        const standingOn = player.onGround && Math.abs(player.y - pad.y) < 1 &&
                           player.x > oldX && player.x < oldX + pad.w;
        if (standingOn) {
          player.x += pad.dx;
          c.onPad = true;
        }
      });
      c.needStart = Math.max(0, c.needStart - dt);
      if (c.done) return;
      // The run only starts at the flag (so she can't sneak in from the other side)
      if (!isForm(c.animal)) c.started = false;
      else if (player.onGround && player.y >= GROUND_Y - 1 && player.x <= c.start + 30) c.started = true;

      // Sky clouds: back on the ground after being up on the clouds = start over
      if (c.sky && c.onPad && player.onGround && player.y >= GROUND_Y - 1) {
        c.onPad = false;
        Sounds.play('land');
        sceneTitle = { name: 'Oops! Try again!', t: 0 };
      }

      const atGoal = isForm(c.animal) && player.onGround && Math.abs(player.x - c.goal.x) < 45 && Math.abs(player.y - c.goalY) < 2;
      if (atGoal && c.started) {
        c.cheer = 2;
        makeSparkles(c.goal.x, GROUND_Y - 40, 14);
        finishChallenge(c);
      } else if (atGoal) {
        c.needStart = 1.5;
      }
    },
    pits(c) { return c.done ? [] : c.pits; },
    platforms(c) { return c.padList; },
    spots(c) {
      return [...c.pits.map(pit => ({ x: pit.x + pit.w / 2, y: GROUND_Y - 30 })),
              ...c.padList.map(pad => ({ x: pad.baseX + pad.w / 2, y: pad.y })),
              { x: c.goal.x, y: c.goalY - 40 }];
    },
    draw(c) {
      if (c.windy && !c.done) drawWind(windZone());
      if (!c.done) for (const pit of c.pits) drawPit(pit);
      for (const pad of c.padList) {
        if (c.sky) {
          const scale = pad.w / 200;
          ctx.drawImage(images.cloudStep, pad.x, pad.y - 14 * scale, pad.w, 80 * scale);
        } else {
          drawLilyPad(pad.x, pad.y, pad.w);
        }
      }
      drawFlag(c.start - 40);
      const g = c.goal;
      const gy = c.goalY;
      if (c.needStart > 0) drawSpeech(g.x, gy - 130, 'Start at the flag!');
      const hop = c.cheer > 0 ? Math.abs(Math.sin(c.cheer * 10)) * 20 : 0;
      if (g.art === 'carrot' && !c.done) drawSprite(images.carrot, g.x, GROUND_Y + Math.sin(time * 3) * 2, 50, 1);
      if (g.art === 'star' && !c.done) {
        ctx.beginPath();
        ctx.arc(g.x, GROUND_Y - 40, 30 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 209, 102, 0.45)';
        ctx.fill();
        drawGoldStar(g.x, GROUND_Y - 40, 22);
      }
      if (g.art === 'frog') {
        // Frog waits at the end (way up on a cloud), and hops for joy when Bunny gets there
        const bob = Math.abs(Math.sin(time * 2)) * 4;
        drawSprite(images.frog, g.x, gy - bob - hop, 70, -1);
        if (Math.abs(player.x - g.x) < 300 && !c.done) drawSpeech(g.x, gy - 80, 'Hop up to me!');
        if (c.cheer > 0) drawSpeech(g.x, gy - 100, 'Ribbit! Hooray!');
      }
    },
  },

  // Clouds that puff away a moment after you stand on them. Jump quickly up to the star!
  // Touch the ground and all the clouds come back: start over.
  crumbleClouds: {
    setup(c) {
      c.plats = c.platforms.map(p => ({ ...p, stood: 0, gone: false }));
    },
    update(c, dt) {
      if (c.done) return;
      let anyGone = false;
      for (const p of c.plats) {
        if (p.gone) {
          anyGone = true;
          continue;
        }
        const standingOn = player.onGround && Math.abs(player.y - p.y) < 1 && player.x > p.x && player.x < p.x + p.w;
        if (standingOn) p.stood += dt;
        if (p.stood > CRUMBLE_TIME) {
          p.gone = true;
          Sounds.play('click');
          makeSparkles(p.x + p.w / 2, p.y + 10, 6);
        }
      }
      // Back on the ground after a cloud puffed away? Everything comes back
      if (anyGone && player.onGround && player.y >= GROUND_Y - 1) {
        CHALLENGES.crumbleClouds.setup(c);
        Sounds.play('teleportBack');
        sceneTitle = { name: 'Oops! Try again!', t: 0 };
      }
      if (isForm(c.animal) && touchingPlayer(c.goal.x, c.goal.y, 45)) {
        makeSparkles(c.goal.x, c.goal.y, 14);
        finishChallenge(c);
        for (const p of c.plats) Object.assign(p, { gone: false, stood: 0 }); // solid forever now
      }
    },
    platforms(c) { return c.plats.filter(p => !p.gone); },
    spots(c) { return c.plats.map(p => ({ x: p.x + p.w / 2, y: p.y })); },
    draw(c) {
      for (const p of c.plats) {
        if (p.gone) continue;
        const shaky = p.stood > 0 && !c.done;
        const shakeX = shaky ? Math.sin(time * 60) * 3 : 0;
        const scale = p.w / 200;
        ctx.globalAlpha = shaky ? Math.max(0.35, 1 - p.stood / CRUMBLE_TIME) : 1;
        ctx.drawImage(images.cloudStep, p.x + shakeX, p.y - 14 * scale, p.w, 80 * scale);
        ctx.globalAlpha = 1;
      }
      if (!c.done) {
        ctx.beginPath();
        ctx.arc(c.goal.x, c.goal.y, 30 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 209, 102, 0.45)';
        ctx.fill();
        drawGoldStar(c.goal.x, c.goal.y, 22);
      }
    },
  },

};

// ---------- Helpers for the challenges ----------

// How long you can stand on a crumbling cloud before it puffs away (seconds)
const CRUMBLE_TIME = 0.45;

// A hole in the path (dark), or deep water (blue)
function drawPit(pit) {
  const top = GROUND_Y - 2;
  roundedBox(pit.x, top, pit.w, VIEW_H - top + 20, 10);
  ctx.fillStyle = pit.water ? '#4FA9CC' : '#4A3430';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();
  if (pit.water) {
    // Little waves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let wx = pit.x + 30; wx < pit.x + pit.w - 30; wx += 90) {
      const wy = top + 20 + Math.sin(time * 2 + wx) * 3;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 12, wy - 6, wx + 24, wy);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  } else {
    // A darker inside, so it looks deep
    ctx.fillStyle = '#2A1A1A';
    ctx.fillRect(pit.x + 10, top + 16, pit.w - 20, VIEW_H - top);
  }
}

// Wind blowing across a challenge: white streaks swooshing along, so it's clear nobody can fly here
function drawWind(zone) {
  ctx.strokeStyle = 'rgba(59, 143, 224, 0.55)'; // soft blue, so it shows on the pale sky
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const width = zone.x1 - zone.x0;
    const x = zone.x0 + ((time * 260 + i * 197) % width);
    const y = 80 + i * 32 + Math.sin(time * 3 + i) * 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 30, y - 8, x + 60, y);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

// A floating lily pad with a pink flower
function drawLilyPad(x, y, w) {
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 4, w / 2, 10, 0, 0.15, Math.PI * 2 - 0.15); // a little notch
  ctx.lineTo(x + w / 2, y + 4);
  ctx.closePath();
  ctx.fillStyle = '#5FA46A';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w * 0.3, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#F48FC2';
  ctx.fill();
}

// The start flag (where you go back to after a fall)
function drawFlag(x) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.beginPath();
  ctx.moveTo(x, GROUND_Y);
  ctx.lineTo(x, GROUND_Y - 70);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, GROUND_Y - 70);
  ctx.lineTo(x + 34, GROUND_Y - 60 + Math.sin(time * 4) * 3);
  ctx.lineTo(x, GROUND_Y - 48);
  ctx.closePath();
  ctx.fillStyle = '#E6378F';
  ctx.fill();
  ctx.stroke();
}

// A sleepy rain cloud. Wakes up (and rains) when bumped. Not scary, just a bit grumpy.
function drawSleepyCloud(x, y, awake) {
  ctx.fillStyle = '#B9B3CC';
  ctx.strokeStyle = '#3A2626';
  ctx.lineWidth = 3;
  const puffs = [[-20, 4, 18], [0, -6, 22], [20, 4, 18], [0, 10, 18]];
  for (const [px, py, r] of puffs) {          // outline first...
    ctx.beginPath();
    ctx.arc(x + px, y + py, r + 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const [px, py, r] of puffs) {          // ...then fill, so only the outside edge shows
    ctx.beginPath();
    ctx.arc(x + px, y + py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (awake) {
    ctx.arc(x - 8, y, 3, 0, Math.PI * 2);   // eyes open
    ctx.moveTo(x + 11, y);
    ctx.arc(x + 8, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#3A2626';
    ctx.fill();
    // Rain drops
    ctx.fillStyle = '#3B8FE0';
    for (let i = -1; i <= 1; i++) {
      const dropY = y + 36 + ((time * 120 + i * 20) % 30);
      ctx.beginPath();
      ctx.ellipse(x + i * 14, dropY, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.arc(x - 8, y, 4, 0.2, Math.PI - 0.2);  // sleepy closed eyes
    ctx.moveTo(x + 12, y + 1);
    ctx.arc(x + 8, y, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.font = `700 16px ${FONT}`;
    ctx.fillStyle = '#7A4FC0';
    ctx.textAlign = 'center';
    ctx.fillText('z', x + 26, y - 22 - Math.abs(Math.sin(time * 2)) * 6);
  }
}

// A small speech bubble with a few words (for Frog)
function drawSpeech(x, y, text) {
  ctx.font = `700 20px ${FONT}`;
  const w = ctx.measureText(text).width + 28;
  roundedBox(x - w / 2, y - 36, w, 36, 16);
  ctx.fillStyle = '#FFFDF7';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();
  ctx.fillStyle = '#5FA46A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - 17);
}

function sequenceMiddle(c) {
  return c.targets.reduce((sum, t) => sum + t.x, 0) / c.targets.length;
}

function startShow(c, delay) {
  c.phase = 'show';
  c.timer = 0.8 - delay; // wait a moment before the first one lights up
  c.showIndex = 0;
  c.step = 0;
}

function lightTarget(c, i) {
  c.lit = i;
  c.litTime = 0.5;
  Music.chime(CHIME_NOTES[i]);
}

// Sends a bowling pin flying. dir = which way (1 right, -1 left), power = how hard
function knockPin(pin, dir, power) {
  pin.state = 'flying';
  pin.vx = dir * (220 + Math.random() * 200) * power;
  pin.vy = -(300 + Math.random() * 250) * power;
  pin.spinSpeed = dir * (10 + Math.random() * 6);
  Sounds.play('click');
}

// The bird's trip: fly in (BIRD_FLY), sit on the nest (BIRD_SIT), fly away (BIRD_AWAY)
const BIRD_FLY = 1.6, BIRD_SIT = 0.9, BIRD_AWAY = 0.7;
const BIRD_TRIP = BIRD_FLY + BIRD_SIT + BIRD_AWAY;

// trip = which egg she's hiding now (0, 1, 2...), t = time into that trip
function drawBirdTrip(c, trip, t) {
  if (trip >= c.answers.length) return;
  const tree = c.treeList[c.answers[trip]];
  const nestX = tree.x + 22, nestY = tree.top - 20;
  const startX = camera.x - 40, startY = 60;          // comes in from the left edge of the screen
  let x, y;
  if (t < BIRD_FLY) {
    const p = t / BIRD_FLY;
    x = startX + (nestX - startX) * p;
    y = startY + (nestY - startY) * p - Math.sin(p * Math.PI) * 60; // a little swoop
  } else if (t < BIRD_FLY + BIRD_SIT) {
    x = nestX;
    y = nestY;
  } else {
    const p = (t - BIRD_FLY - BIRD_SIT) / BIRD_AWAY;
    x = nestX + p * 400;
    y = nestY - p * 200;
  }
  drawBird(x, y);
}

// A little blue bird
function drawBird(x, y) {
  const flap = Math.sin(time * 18) * 8;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.fillStyle = '#9DD3F5';
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 12, 0, 0, Math.PI * 2);   // body
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 13, y - 8, 8, 0, Math.PI * 2);      // head
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - 2, y - 6 - flap / 2, 10, 6, -0.5, 0, Math.PI * 2); // wing
  ctx.fillStyle = '#3B8FE0';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();                                 // beak
  ctx.moveTo(x + 20, y - 10);
  ctx.lineTo(x + 28, y - 7);
  ctx.lineTo(x + 20, y - 4);
  ctx.fillStyle = '#F4A259';
  ctx.fill();
  ctx.fillStyle = '#1E1412';
  ctx.beginPath();
  ctx.arc(x + 15, y - 10, 2, 0, Math.PI * 2);      // eye
  ctx.fill();
}

// A twiggy nest, with an egg in it if egg = true
function drawNest(x, y, egg) {
  if (egg) {
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 9, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF1DC';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3A2626';
    ctx.stroke();
    ctx.fillStyle = '#F48FC2';
    ctx.beginPath(); ctx.arc(x - 3, y - 11, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3, y - 5, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 9, 0, 0, Math.PI);  // bowl of the nest
  ctx.lineTo(x - 22, y);
  ctx.fillStyle = '#8B5A3C';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.stroke();
  ctx.strokeStyle = '#C49272';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 16, y + 3); ctx.lineTo(x + 10, y + 6);
  ctx.moveTo(x - 8, y + 7); ctx.lineTo(x + 17, y + 2);
  ctx.stroke();
}

// A flower floating in the air (for the memory game)
function drawFlower(x, y, color, glow) {
  const r = glow ? 13 : 11;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 + time * 0.5;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFDF7';
  ctx.fill();
  ctx.stroke();
}

// A bell hanging in the air (for the memory game)
function drawBell(x, y, color, glow) {
  const s = glow ? 1.15 : 1;
  const swing = glow ? Math.sin(time * 20) * 0.3 : Math.sin(time * 2) * 0.05;
  ctx.save();
  ctx.translate(x, y - 24 * s);
  ctx.rotate(swing);
  ctx.scale(s, s);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3A2626';
  ctx.beginPath();
  ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); // top loop
  ctx.fillStyle = '#8B5A3C';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.quadraticCurveTo(-10, 30, -22, 42);
  ctx.lineTo(22, 42);
  ctx.quadraticCurveTo(10, 30, 8, 6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 46, 6, 0, Math.PI * 2);  // the clapper
  ctx.fillStyle = '#FFD166';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// A big pink X on the ground
function drawX(x, y, r) {
  ctx.lineCap = 'round';
  for (const [width, color] of [[11, '#3A2626'], [6, '#E6378F']]) {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r * 0.6); ctx.lineTo(x + r, y + r * 0.6);
    ctx.moveTo(x + r, y - r * 0.6); ctx.lineTo(x - r, y + r * 0.6);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

// Magic fog that hides a challenge until the puzzle is solved
function drawFog(c) {
  for (const spot of CHALLENGES[c.type].spots(c)) {
    const drift = Math.sin(time * 1.5 + spot.x) * 6;
    ctx.globalAlpha = 0.92;
    drawSprite(images.puff, spot.x + drift, spot.y + 70, 140, 1);
    ctx.globalAlpha = 1;
    ctx.font = `700 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#3A2626';
    ctx.fillText('?', spot.x + drift, spot.y + 8);
  }
}

// ---------- Puzzles that clear the magic fog ----------
// Each one gives back: { title, prompt, show, answers (3 choices), correct }

const PATTERN_PICTURES = ['🐱', '🐰', '🦋', '🐹', '⭐', '🌸', '🍄', '🥕'];

// Level 2: "What comes next?" with pictures
function makePatternPuzzle() {
  const [a, b, c] = shuffle(PATTERN_PICTURES).slice(0, 3);
  const kinds = [
    { seq: [a, b, a, b, a], next: b },
    { seq: [a, a, b, a, a], next: b },
    { seq: [a, b, c, a, b], next: c },
    { seq: [a, b, b, a, b], next: b },
    { seq: [a, a, b, b, a], next: a },
    { seq: [a, b, c, a, b, c, a], next: b },
  ];
  const kind = kinds[randomInt(0, kinds.length - 1)];
  return {
    title: 'Pattern puzzle!',
    prompt: 'What comes next?',
    show: kind.seq.join(' ') + '  ?',
    answers: shuffle([a, b, c]),
    correct: kind.next,
  };
}

// Level 3: a math problem for a 7 year old (adding, taking away, counting by 2s, 5s or 10s)
function makeMathPuzzle() {
  const animal = ['Bunny', 'Cat', 'Hamster', 'Butterfly'][randomInt(0, 3)];
  const thing = ['carrots', 'gems', 'flowers', 'stars'][randomInt(0, 3)];
  const kinds = [
    () => { const a = randomInt(2, 9), b = randomInt(1, 9); return { show: `${a} + ${b} = ?`, correct: a + b }; },
    () => { const a = randomInt(6, 15), b = randomInt(1, Math.min(9, a - 1)); return { show: `${a} − ${b} = ?`, correct: a - b }; },
    () => { const a = randomInt(1, 8), b = randomInt(2, 9); return { show: `${a} + ? = ${a + b}`, correct: b }; },
    () => { const a = randomInt(2, 8), b = randomInt(2, 7);
            return { prompt: `${animal} has ${a} ${thing}. She finds ${b} more. How many now?`, correct: a + b }; },
    () => { const a = randomInt(5, 12), b = randomInt(1, a - 2);
            return { prompt: `${animal} has ${a} ${thing}. She gives ${b} away. How many are left?`, correct: a - b }; },
    () => { const step = [2, 5, 10][randomInt(0, 2)], start = step * randomInt(1, 3);
            return { prompt: 'Count along!', show: `${start}, ${start + step}, ${start + 2 * step}, ?`, correct: start + 3 * step, spread: step }; },
  ];
  const q = kinds[randomInt(0, kinds.length - 1)]();
  return finishMathPuzzle(q, 'Math magic!');
}

// Level 4: bigger math (a grown-up might help!): tens, doubles, groups, bigger adding and taking away
function makeBigMathPuzzle() {
  const animal = ['Bunny', 'Cat', 'Hamster', 'Butterfly'][randomInt(0, 3)];
  const thing = ['carrots', 'gems', 'flowers', 'stars'][randomInt(0, 3)];
  const kinds = [
    () => { const a = randomInt(11, 39), b = randomInt(2, 9); return { show: `${a} + ${b} = ?`, correct: a + b }; },
    () => { const a = randomInt(2, 6) * 10, b = randomInt(1, 4) * 10; return { show: `${a} + ${b} = ?`, correct: a + b, spread: 10 }; },
    () => { const a = randomInt(21, 49), b = randomInt(1, a % 10 || 1); return { show: `${a} − ${b} = ?`, correct: a - b }; },
    () => { const a = randomInt(4, 10); return { prompt: 'Double it!', show: `${a} + ${a} = ?`, correct: a * 2 }; },
    () => { const groups = randomInt(2, 5), each = [2, 5, 10][randomInt(0, 2)];
            return { prompt: `${groups} bags with ${each} ${thing} in each bag. How many ${thing} in all?`, correct: groups * each, spread: each }; },
    () => { const a = randomInt(10, 20), b = randomInt(3, 9);
            return { prompt: `${animal} had ${a} ${thing}. She found ${b} more. How many now?`, correct: a + b }; },
    () => { const a = randomInt(3, 8), b = randomInt(10, 20);
            return { prompt: `${a} + ? = ${a + b}`, correct: b }; },
  ];
  const q = kinds[randomInt(0, kinds.length - 1)]();
  return finishMathPuzzle(q, 'Super math!');
}

// Turns a math question into 3 answer buttons (the right one, and two close wrong ones)
function finishMathPuzzle(q, title) {
  const spread = q.spread || 1;
  const nearby = spread === 1 ? [-2, -1, 1, 2] : [-1, 1];
  const wrong = shuffle(nearby).map(d => q.correct + d * spread).filter(n => n >= 0).slice(0, 2);
  return {
    title,
    prompt: q.prompt || 'What is the answer?',
    show: q.show || '',
    answers: shuffle([q.correct, ...wrong]).map(String),
    correct: String(q.correct),
  };
}

// Level 5: riddles! Some are tricky. Grown-ups can help.
const RIDDLES = [
  { q: 'I have wings, but I am not a bird. I love flowers. Who am I?', a: 'Butterfly', wrong: ['Cat', 'Hamster'] },
  { q: 'What has hands, but cannot clap?', a: 'A clock', wrong: ['A tree', 'A cloud'] },
  { q: 'What gets wetter the more it dries?', a: 'A towel', wrong: ['A rock', 'A carrot'] },
  { q: 'I am full of holes, but I can still hold water. What am I?', a: 'A sponge', wrong: ['A cup', 'A bucket'] },
  { q: 'What goes up, but never comes down?', a: 'Your age', wrong: ['A kite', 'A ball'] },
  { q: 'What has a neck, but no head?', a: 'A bottle', wrong: ['A giraffe', 'A snake'] },
  { q: 'What has keys, but cannot open a door?', a: 'A piano', wrong: ['A car', 'A lock'] },
  { q: 'You have 3 apples. You take away 2. How many apples do YOU have?', a: '2', wrong: ['1', '3'] },
  { q: 'Monday, Tuesday, Wednesday... what comes next?', a: 'Thursday', wrong: ['Friday', 'Sunday'] },
  { q: 'How many legs do 2 cats have?', a: '8', wrong: ['4', '6'] },
  { q: 'What has one eye, but cannot see?', a: 'A needle', wrong: ['A pirate', 'A fish'] },
  { q: 'What is full of stars, but is not the night sky?', a: 'The Friend Book', wrong: ['A shoe', 'A pond'] },
  { q: 'Which is more: 3 tens, or 25?', a: '3 tens', wrong: ['25', 'The same'] },
  { q: 'What can you catch, but not throw?', a: 'A cold', wrong: ['A ball', 'A frisbee'] },
];

function makeRiddlePuzzle() {
  const r = RIDDLES[randomInt(0, RIDDLES.length - 1)];
  return {
    title: 'Riddle time!',
    prompt: r.q,
    show: '',
    answers: shuffle([r.a, ...r.wrong]),
    correct: r.a,
  };
}
