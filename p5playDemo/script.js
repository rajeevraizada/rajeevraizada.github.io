// Set up some variables for the size of the canvas,
// where to put the basketball net, etc.
let xMax = 400;
let yMax = 500;
let netLeftX = 250;
let netWidth = 75;
let netY = 200;
let ballHasHitscoreDetector = 0;
let score = 0;
// How many balls will drop before game over
let numRemaining = 21;
let ballCount = 0; // Keep track of how many dropped
// Declare the time variable dropTime
// We will give it an initial value in setup()
let dropTime;
// We'll drop in a new basketball every 3s, i.e. 3000ms
let dropInterval = 3000;
// Move mouse after initial mouse click or touch
let mouseHasBeenPressed = 0;

// p5js has two essential functions: setup and draw.
// The setup function gets called once at the beginning.
// You use it to define your canvas and sprites.
// The draw loop gets called repeatedly at frame-rate.

function setup() {
  new Canvas(xMax, yMax);
  world.gravity.y = 10;
  // Record an initial value value for dropTime, in milliseconds
  dropTime = millis() - dropInterval;

  ballGroup = new Group();
  ballGroup.diameter = 70;
  ballGroup.collider = 'dynamic'; // Dynamic sprites get pulled by gravity
  ballGroup.img = 'Images/basketball.png';
  ballGroup.y = 0;  // In p5js (and in web coordinates in general) y=0 is at top of screen
  // ballGroup.debug = true;
  ballGroup.bounciness = 0.7;
  ballGroup.scale = 0.65;

  striker = new Sprite();
  striker.diameter = 100;
  striker.collider = 'kinetic'; // Kinetic sprites can be moved by user,
  // but they don't get pulled by gravity
  striker.color = 'white';
  striker.text = ' Move me\n to hit ball';
  striker.x = 100;
  striker.y = 350;

  // These bars make the two sides of the "basket"
  bars = new Group();
  bars.width = 5;
  bars.height = 80;
  bars.color = 'lightgrey';
  bars.stroke = 'none';
  bars.collider = 'static'; // Static sprites don't move at all

  // Left hand side of the basket
  netLeft = new bars.Sprite();
  netLeft.x = netLeftX;
  netLeft.y = netY;
  netLeft.rotation = -15;

  // Right hand side of the basket
  netRight = new bars.Sprite();
  netRight.x = netLeftX + netWidth;
  netRight.y = netY;
  netRight.rotation = 15;

  // This scoreDetector is a big round sprite inside the basket.
  // Its purpose is to detect when the ball touches it,
  // as that means that a basket has been scored.
  // It could be made invisible, but here we show it as a green outline,
  // to make it easier to see what is going on
  scoreDetector = new Sprite();
  scoreDetector.x = netLeftX + netWidth / 2;
  scoreDetector.y = netY;
  scoreDetector.diameter = netWidth * 2 / 3;
  scoreDetector.debug = true; // This debug=true bit makes it a green outline
  scoreDetector.collider = 'static';

  // This next line means that the ball will pass right through the
  // scoreDetector, as opposed to bouncing off it
  ballGroup.overlaps(scoreDetector);

  // Add some text confetti
  textConfetti = new Group();
  textConfetti.diameter = 5;
  textConfetti.vel.y = -5;  // Make text jump upwards a bit
  textConfetti.color = 'white';
  textConfetti.textSize = 40;
  textConfetti.text = '🎉Basket!🎉';
  textConfetti.textColor = 'red';
  textConfetti.overlaps(scoreDetector);
  textConfetti.overlaps(ballGroup);
  textConfetti.overlaps(bars);
}

// This draw function gets called on every frame
function draw() {
  clear(); // Clear the screen, so that previous sprite positions don't show up

  if (numRemaining <= 0) {
    textSize(40);
    text('Game over', xMax / 2, 50);
  } else {
    // Move the the striker towards the mouse position
    // after the initial click
    if (mouseHasBeenPressed == 1) {
      striker.moveTowards(mouse.x, mouse.y, 1);
    }

    // At fixed intervals, drop in a new ball, and reset the timer
    if (millis() - dropTime > dropInterval) {
      newBall = new ballGroup.Sprite();
      newBall.x = 50 + random(100);  // Randomly vary the drop position a bit
      newBall.vel.x = 2 * (1 - random(2)); // Give a small amount of random sideway motion
      newBall.hasHitScoreDetector = 0;
      ballCount += 1;       // Keep track of how many dropped
      numRemaining -= 1;
      dropTime = millis();  // Reset the timer
    }

    // Display the score at the top of the screen, above the basket
    textSize(20);
    textAlign('center');
    // text('Ball number: ' + ballCount, 100, 20);
    text('Remaining: ' + numRemaining, 100, 20);
    text('Score: ' + score, netLeftX + netWidth / 2, 20);

    // Loop through any basketballs that are present.
    // There will often be only one, but might sometimes me more than one
    // if the previous one is still getting bounced around
    for (i = 0; i < ballGroup.length; i++) {
      thisBall = ballGroup[i];
      // Check if this ball is hitting the score detector for the first time
      if (thisBall.overlaps(scoreDetector) && thisBall.hasHitScoreDetector == 0) {
        score += 1;
        correctSound.play();
        thisConfetti = new textConfetti.Sprite();
        thisConfetti.x = thisBall.x;
        thisConfetti.y = thisBall.y;
        thisBall.hasHitScoreDetector = 1; // This ball won't trigger a score any more after this
      }
      // The next part is not really essential. 
      // It just makes the bounce sound-effect a bit more realistic,
      // by making it louder when the ball is moving faster, and quieter if slower
      if (thisBall.collides(bars) || thisBall.collides(striker)) {
        thisVel = Math.sqrt((thisBall.vel.x) ** 2 + (thisBall.vel.y) ** 2)
        bounceSound.setVolume(min(thisVel / 10, 0.5));
        bounceSound.play();
      }
    }
  }
}

// This next function just preloads the sounds, so that they play quicker
function preload() {
  soundFormats('mp3');
  correctSound = loadSound('Sounds/correct.mp3');
  correctSound.setVolume(0.7);
  bounceSound = loadSound('Sounds/bounce.mp3');
}

function mousePressed() {
  // Make an initial sound, triggered by this user action
  // iPhone requires this in order for sounds to play
  if (mouseHasBeenPressed == 0) {
    bounceSound.setVolume(0.01);
    bounceSound.play();
  }
  mouseHasBeenPressed = 1;
}

function touchStarted() {
  // Make an initial sound, triggered by this user action
  // iPhone requires this in order for sounds to play
  if (mouseHasBeenPressed == 0) {
    bounceSound.setVolume(0.01);
    bounceSound.play();
  }
  mouseHasBeenPressed = 1;
}

