let xMax = 400;
let yMax = 500;
let waitFrames = 200;
let mouseHasBeenPressed = 0;

function setup() {
  new Canvas(xMax, yMax);

}

// This draw function gets called on every frame
function draw() {
  clear(); // Clear the screen, so that previous sprite positions don't show up
  textSize(14);
  text('Mouse pressed yet: ' + mouseHasBeenPressed, 10, 100);

  text('Sound-play command happens every ' + waitFrames + ' frames', 10, 130);
  text('Framecount: ' + frameCount, 10, 160);

  text('Sound.isPlaying: ' + correctSound.isPlaying(), 10, 190);
    
  if (frameCount % waitFrames == 0){
    correctSound.play();
  }
}

// This next function just preloads the sounds, so that they play quicker
function preload() {
  soundFormats('mp3');
  correctSound = loadSound('Sounds/correct.mp3');
  correctSound.setVolume(0.5);
}

function mousePressed() {
  // Make an initial sound, triggered by this user action
  // iPhone requires this in order for sounds to play
  // if (mouseHasBeenPressed == 0) {
    correctSound.play();
  // }
  mouseHasBeenPressed = 1;
}

