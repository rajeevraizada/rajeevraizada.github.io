// Copyright (c) 2024 ml5
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
// Requires: https://unpkg.com/ml5@1/dist/ml5.js
// Documentation: https://docs.ml5js.org/#/reference/handpose

let handpose;
let video;
let hands = [];
let rocket, rocket_pic;
let options = { maxHands: 2, flipHorizontal: true, runtime: "mediapipe" };
let xMax = 1*640;
let yMax = 1*480;
let whichHand;
let obstacle, obstacles;
let numLives = 5;
let explodeTime = 1000000;
let obstacles_list = [ '🪨' ]; // '🚕', '🚃', '🚚', '🦠', '🐀' 
let targets_list = [ '📚', '♟️', '🪐', '🎶', '🏀', '🎭', '🎨', '𝛑' ];
let flow_speed = 5;
let score = 0;
let gameOver = 0;

function preload() {
  // Load the handPose model.
  handpose = ml5.handPose(options);
	// rocket_pic = loadImage("rocket.gif");
	dragon_pic = loadImage("https://rajeevraizada.github.io/Images/dragon_smaller.png");
	explosion_sound = loadSound("https://upload.wikimedia.org/wikipedia/commons/3/37/Explosion_10.ogg");
	reward_sound = loadSound("https://upload.wikimedia.org/wikipedia/commons/8/85/Achievement_unlocked_sound_effect_video_game.wav");
}

function setup() {
  createCanvas(xMax, yMax);
	// p5play.renderStats = true;
	
	// world.gravity.y = 20;
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(xMax, yMax);
  video.hide();
  // start detecting hands from the webcam video
  handpose.detectStart(video, gotHands);

	rockets = new Group();
	rockets.width = 50;
	rockets.height = 80;
	rockets.img = dragon_pic; // rocket_pic;
	rockets.rotationLock = true;
	rockets.image.scale = 0.7;
	// rockets.debug = true;
	
	makeNewRocket();
	
	obstacles = new Group();
	obstacles.diameter = 60;
	obstacles.img = '🪨';
	obstacles.img.scale = 1.1;
	// obstacles.debug = true;
	
	targets = new Group();
	targets.diameter = 60;
	targets.img = '📚';
	targets.img.scale = 1.1;
	targets.collected = 0;
	// targets.debug = true;
	
	rockets.collides(obstacles, (the_rocket, the_obstacle) => {
	  the_rocket.img = '💥';
		the_rocket.life = 10;
		explosion_sound.play();
		explodeTime = frameCount;
	});
	
	rockets.collides(targets, (the_rocket, the_target) => {
	  if (the_target.collected == 0) {
			the_target.img = '🌟';
			the_target.life = 10;
			reward_sound.play();
			score += 100;
			the_target.collected = 1;
		}
	});
	
}

function draw() {
	showVideo();
	// getHandedness();
	showHandPoints();
	textSize(20);
	fill('black');
	text("Lives remaining: " + numLives, 0.65*xMax, 30);
	text("Score: " + score, 0.65*xMax, 60);
	if (hands.length>0) {
		jointToTrack = hands[0].keypoints[8];
		rocket.moveTowards(xMax/4, jointToTrack.y, 0.5);
	}
	
	// Gradually increase flow speed over time
	flow_speed = 3 + Math.min(7, frameCount/1000 );
	
	if (frameCount % 40 == 0 && gameOver==0) {
		this_obstacle = new obstacles.Sprite();
		obstacle_idx_to_show = Math.floor(obstacles_list.length * Math.random());
		this_obstacle.img = obstacles_list[obstacle_idx_to_show];
		this_obstacle.y = Math.random() * yMax;
		this_obstacle.x = xMax;
		this_obstacle.vel.x = -flow_speed; // * Math.random();
		this_obstacle.rotationSpeed = 4*Math.random() - 2;
	}
	if (frameCount % 100 == 0 && gameOver==0) {
		this_target = new targets.Sprite();
		target_idx_to_show = Math.floor(targets_list.length * Math.random());
		this_target.img = targets_list[target_idx_to_show];
		// Show the text symbol (pi) bigger
		if (this_target.img == '𝛑') {
			this_target.img.scale = 2.5;
		}
		this_target.y = Math.random() * yMax;
		this_target.x = xMax;
		this_target.vel.x = -flow_speed; // * Math.random();
		this_target.rotationSpeed = 4*Math.random() - 2;
	}
	// Add a new rocket, after a delay
	if ( (frameCount - explodeTime > 60) &&
			 (rockets.length == 0) ) {
		obstacles.removeAll();
		makeNewRocket();
		numLives -= 1;
		if (numLives<0) {
			gameOver = 1;
			numLives = 0;
		}
	}
	// Display game over, if out of lives
	if (gameOver == 1) {
		world.timeScale = 0;
		textAlign(CENTER);
		allSprites.removeAll();
		fill('red');
		textSize(70);
		text('😱 GAME OVER 😱', xMax/2, yMax/2);
		textSize(40);
		text('Reload page to play again', xMax/2, yMax/2 + 100);
	}
	// Stop the rocket from going off screen
	rocket.x = xMax/4;
	rocket.y = Math.max( Math.min(rocket.y, yMax), 0);
}

function makeNewRocket() {
	rocket = new rockets.Sprite();
	rocket.x = xMax/4;
}

function showVideo() {
  // Draw the webcam video
	background(255);
	push();
	if (options.flipHorizontal){
		translate(width,0); 
		scale(-1,1);
	}
	let transparency = 100; // reduce this to make video transparent
	tint(255,255,255,transparency); 
  image(video, 0, 0, width, height);
	pop();
	
	push();
	// Cope with difference between capture size and canvas size
	scale(width/xMax, height/yMax); 
	pop();
}

function showHandPoints() {
	// Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
			if (j != 8) {
	      fill('lime');
			} else {
				fill('red');
			}
      // noStroke();
			textSize(16);
			text(j, keypoint.x, keypoint.y);
      // circle(keypoint.x, keypoint.y, 10);
    }
		
	}
}

function getHandedness() {
	for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
		whichHand = hand.handedness;
		let wx = hand.keypoints[0].x;
		let wy = hand.keypoints[0].y;
		// textSize(24); 
		// fill('lime');
		// text(whichHand, wx, wy+30); 
	}
}


// Callback function for when handpose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}

