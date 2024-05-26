let xmax = 350;
let ymax = 600;
let ballDiameter = 10;
let numSegments = 150;
let segmentLength = 6;
let bigCircleLinesAndAngles;
let bigCircleStartX = 200;
let bigCircleStartY = 200;
let max_speed = 10;
let ball_bounciness = 1.08;
let tones_pentatonic = [0, 2, 4, 7, 9, 12];
let initial_drop_made = 0;

function draw() {
  // clear();
  if (initial_drop_made == 0) {
    noStroke();
    textSize(14);
    text('Click anywhere to start', 120, 20);
    stroke('black');
  } else {
    // Make colors change slightly out of sync, with prime mods
    ball0.color = color(frameCount % 360, 100, 100);
    ball1.color = color(frameCount % 331, 100, 100);
    ball2.color = color(frameCount % 307, 100, 100);
  }
}


function setup() {
  new Canvas(xmax, ymax);
  world.gravity.y = 10;

  // Draw the big circle as a line-mode chain collider
  // https://p5play.org/learn/sprite.html?page=11
  bigCircleLinesAndAngles = [];
  turnAngle = 360 / numSegments;
  for (i = 0; i < numSegments; i++) {
    bigCircleLinesAndAngles.push(segmentLength)
    bigCircleLinesAndAngles.push(turnAngle)
  }
  bigCircle = new Sprite(bigCircleStartX, bigCircleStartY,
    bigCircleLinesAndAngles, 's');
  bigCircle.collider = 'static';
  bigCircle.color = 'black';
  bigCircle.friction = 10;
  bigCircle.bounciness = 0;

  ball_group = new Group();
  ball_group.diameter = ballDiameter;
  ball_group.bounciness = ball_bounciness;
  ball_group.y = bigCircleStartY;
  ball_group.x = bigCircleStartX + 70;
  ball_group.direction_int = 0;
  ball_group.collides(bigCircle, (this_ball, bigCircle) => {
    // Make the ball bigger, up to some max size
    this_ball.diameter = min(this_ball.diameter + 1, 60);
    // Keep the ball below some max speed
    this_ball.speed = min(this_ball.speed, 9);
    // Make the sound be one of the twelve half-tones in a scale
    direction_int = Math.round(6 * Math.abs(this_ball.direction) / 180);
    pentatonic_ind = Math.min(Math.max(0, direction_int), 5);
    this_ball.direction_int = direction_int;
    tone_to_play = 200 * 2 ** (tones_pentatonic[pentatonic_ind] / 12);
    synth.triggerAttackRelease(tone_to_play, 0.1);
  }
  );

  colorMode(HSB);
  // Make a new tone.js tone object
  synth = new Tone.PolySynth().toDestination();
}

// Play a sound on mousePress, as sound has to be user-initiated
function mousePressed() {
  if (initial_drop_made == 0) {
    synth.triggerAttackRelease(200, 0.1);
    initial_drop();
  }
}


function initial_drop() {
  if (initial_drop_made == 0) {
    ball0 = new ball_group.Sprite();
    ball1 = new ball_group.Sprite();
    ball2 = new ball_group.Sprite();
    ball1.x = ball0.x + 30 + 5 * Math.random();
    ball2.x = ball0.x + 60 + 5 * Math.random();
    initial_drop_made = 1;
  }
}
