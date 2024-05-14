let xMax = 350;
let yMax = 600;
let targetY = 50;
let spaceShipY = 550;
let emojis;
let zapTime = 0;
let zapDelay = 1500;
let numMin = 0;
let numMax = 1;
let leftPadding = 10;
let rightPadding = 2 * leftPadding;
let thisFrac;
let lastValue = 1;
let missileIsInFlight = 0;

class fraction {
  constructor(numerator, denominator, value) {
    this.numerator = numerator;
    this.denominator = denominator;
    this.value = value;
  }
}

function draw() {
  clear();
  drawNumberLine();

  if (thisFrac == null) {
    thisFrac = makeFractionVal();
  }
  displayGoalFraction(thisFrac, xMax / 2, yMax / 2);
  checkForMissileLaunch();

  spaceShip.moveTowards(mouse.x, spaceShipY, 0.04);
  spaceShip.x = max(min(spaceShip.x, xMax), 0);

  // Check if zaps have gone off the top of screen
  // If they have, get rid of current target and fraction
  if (zaps.length > 0) {
    for (i = 0; i < zaps.length; i++) {
      thisZap = zaps[i];
      if (thisZap.y < 0) {
        thisZap.life = 1;
        missileIsInFlight = 0;
        thisFrac = null;
        targets[0].life = 0;
      }
    }
  }

  if (missileIsInFlight == 1) {
    if (targets.length == 0) {
      makeNewTarget(thisFrac);
    } else {
      thisTarget = targets[0];
      allSprites.draw();
      displayTargetFraction(thisFrac, thisTarget.x, thisTarget.y);
    }
  }

}

function makeFractionVal() {
  value = 1;
  // Make sure we get a different value from previous one
  while (value==lastValue) {
    numerator = 1 + Math.floor(9 * Math.random());
    // The number 11.5 below, instead of 11, is so that sometimes, but rarely
    // we get a fraction of type n/n = 1.
    denominator = Math.floor(numerator + (11.5 - numerator) * Math.random());
    value = numerator / denominator;
  }
  thisFrac = new fraction(numerator, denominator, value);
  lastValue = thisFrac.value;
  return (thisFrac);
}

function makeNewTarget(frac) {
  if (targets.length == 0) {
    thisTarget = new targets.Sprite();
    thisTarget.x = numberToX(frac.value, 1);
    thisTarget.y = 70;
  }
}

function checkForMissileLaunch() {
  if (missileIsInFlight == 0) {
    textSize(20);
    text('🔥', spaceShip.x, spaceShip.y - 45);
    if (spaceShip.mouse.pressed()) {
      zapTime = millis();
      thisZap = new zaps.Sprite();
      thisZap.y = spaceShip.y - 70;
      thisZap.x = spaceShip.x - 3;
      missileSound.play();
      missileIsInFlight = 1;
    }
  }
}

function setup() {
  new Canvas(xMax, yMax);

  spaceShip = new Sprite();
  spaceShip.width = 80;
  spaceShip.height = 120;
  spaceShip.image = 'Images/rocket2.png';
  spaceShip.color = 'white';
  spaceShip.x = 50;
  spaceShip.y = spaceShipY;
  // spaceShip.debug = true;

  targets = new Group();
  targets.width = 40;
  targets.height = 80;
  targets.color = 'lightblue';
  targets.stroke = 'white';
  // targets.debug = true;

  zaps = new Group();
  zaps.width = 3;
  zaps.height = 20;
  zaps.color = 'orange';
  zaps.stroke = 'yellow';
  zaps.rotationLock = 'true';
  // zaps.life = 60;
  zaps.textSize = 40;
  zaps.vel.y = -2;
  zaps.collides(targets, explode);

  confetti = new Group();
  confetti.diameter = 5;
  confetti.text = '💥';
  confetti.overlaps(confetti);
  confetti.overlaps(targets);
  confetti.life = 50;
  confetti.drag = 5;
}

function explode(obj1, obj2) {
  obj1.life = 1;
  obj2.life = 20;
  obj2.textSize = 80;
  obj2.text = '💥';
  obj2.color = 'white';
  for (i = 0; i < 8; i++) {
    thisConfetti = new confetti.Sprite();
    thisConfetti.x = obj2.x;
    thisConfetti.y = obj2.y;
    thisConfetti.textSize = 10 + 30 * Math.random();
    thisDir = 2 * Math.PI * Math.random();
    thisConfetti.vel.x = 8 * Math.cos(thisDir);
    thisConfetti.vel.y = 8 * Math.sin(thisDir);
    thisConfetti2 = new confetti.Sprite();
    thisConfetti2.x = obj2.x;
    thisConfetti2.y = obj2.y;
    thisConfetti2.textSize = thisConfetti.textSize;
    thisConfetti2.vel.x = -thisConfetti.vel.x;
    thisConfetti2.vel.y = -thisConfetti.vel.y;
  }
  explosionSound.play();
  // correctSound.play();
  if (missileSound.isPlaying()) {
    missileSound.stop();
  }
  missileIsInFlight = 0;
  thisFrac = null;
}

function drawNumberLine() {
  textSize(12);
  for (i = 0; i < 11; i++) {
    thisX = numberToX(i / 10, 1);
    text(i / 10, thisX, 20);
    textAlign(CENTER);
    line(thisX, 1, thisX, 7);
  }
  line(numberToX(0, 1), 1, numberToX(1, 1), 1);
}

function numberToX(num, numRange) {
  xRange = (xMax - rightPadding) - leftPadding;
  numProportion = num / numRange;
  xVal = leftPadding + numProportion * xRange;
  return (xVal);
}

function displayGoalFraction(thisFraction, x, y) {
  if (thisFraction != null) {
    fontSize = 30;
    textSize(fontSize);
    xOffset = 1.2 * fontSize;
    yOffset = 0.6 * fontSize;
    text('Target:', x - xOffset, y - 5);
    text(thisFraction.numerator, x + xOffset, y - yOffset);
    text(thisFraction.denominator, x + xOffset, y + yOffset);
    text('—', x + xOffset, y - yOffset / 8);
  }
}

function displayTargetFraction(thisFraction, x, y) {
  if (thisFraction != null) {
    fontSize = 30;
    textSize(fontSize);
    yOffset = 0.6 * fontSize;
    text(thisFraction.numerator, x, y + 10 - yOffset);
    text(thisFraction.denominator, x, y + 10 + yOffset);
    text('—', x, y + 10 - yOffset / 8);
  }
}

function preload() {
  soundFormats('mp3');
  missileSound = loadSound('Sounds/rocket-launch.mp3');
  missileSound.setVolume(0.7);
  explosionSound = loadSound('Sounds/explosion.mp3');
}
