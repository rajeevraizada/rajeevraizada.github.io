// Face Mesh with Particle Emitter
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/facemesh
// https://youtu.be/R5UZsIwPbJA

let video;
let faceMesh;
let faces = [];
let face;
let xmax = 600;
let ymax = 500;
let leftEyeBrowChain, rightEyeBrowChain;

function preload() {
	// Load FaceMesh model
	faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true });
}

function gotFaces(results) {
	faces = results;
}

function setup() {
	createCanvas(xmax, ymax);
	world.gravity.y = 10;
	video = createCapture(VIDEO, { flipped: true });
	video.hide();

	box = new Sprite([
		[1, 1],
		[xmax, 1],
		[xmax, ymax],
		[1, ymax],
		[1, 1]
	]);

	box.collider = "static";
	box.shape = "chain";
	box.color = "skyblue";

	rain = new Group();
	rain.color = "cyan";
	rain.stroke = "cyan";
	rain.diameter = 5;
	rain.life = 200;
	rain.y = 10;
	// Start detecting faces
	faceMesh.detectStart(video, gotFaces);
}

function draw() {
	background(0);
	image(video, 0, 0);

	if (faces.length > 0) {
		face = faces[0];

		// Draw eyebrows
		// drawEyeBrows();
		makeEyeBrowChains();
		drawLips();

		textSize(25);
		fill("white");
		stroke("black");
		text("Open your mouth to drop p5play sprites", 100, 30);
	}

	makeItRain();
}

function drawLips() {
	// Draw exterior lip contour
	stroke(255, 255, 0);
	strokeWeight(2);
	noFill();
	beginShape();
	for (let i = 0; i < lipsExterior.length; i++) {
		let index = lipsExterior[i];
		let keypoint = face.keypoints[index];
		vertex(keypoint.x, keypoint.y);
	}
	endShape(CLOSE);

	// Draw interior lip contour
	beginShape();
	for (let i = 0; i < lipsInterior.length; i++) {
		let index = lipsInterior[i];
		let keypoint = face.keypoints[index];
		vertex(keypoint.x, keypoint.y);
	}
	endShape(CLOSE);

	// Get mouth opening distance
	let a = face.keypoints[13];
	let b = face.keypoints[14];
	let d = dist(a.x, a.y, b.x, b.y);
	let x = (a.x + b.x) * 0.5;
	let y = (a.y + b.y) * 0.5;

	// Emit particles when mouth is open
	if (d > 20 && random(1) < 0.25) {
		this_ball = new Sprite(x, y, d);
		this_ball.stroke = "white";
	}
}

function makeEyeBrowChains() {
	let this_chain = [];
	for (i = 0; i < leftEyeBrow.length; i++) {
		this_index = leftEyeBrow[i];
		next_index = leftEyeBrow[i + 1];
		this_chain.push([face.keypoints[this_index].x, face.keypoints[this_index].y]);
	}
	if (leftEyeBrowChain != null) {
		leftEyeBrowChain.remove();
	}
	leftEyeBrowChain = new Sprite(this_chain);
	leftEyeBrowChain.collider = "chain";
	leftEyeBrowChain.stroke = "yellow";
	leftEyeBrowChain.strokeWeight = 5;

	this_chain = [];
	for (i = 0; i < rightEyeBrow.length; i++) {
		this_index = rightEyeBrow[i];
		next_index = rightEyeBrow[i + 1];
		this_chain.push([face.keypoints[this_index].x, face.keypoints[this_index].y]);
	}
	if (rightEyeBrowChain != null) {
		rightEyeBrowChain.remove();
	}
	rightEyeBrowChain = new Sprite(this_chain);
	rightEyeBrowChain.collider = "chain";
	rightEyeBrowChain.stroke = "yellow";
	rightEyeBrowChain.strokeWeight = 5;
}

function makeItRain() {
	// for (i = 0; i < 50; i++) {
	this_drop = new rain.Sprite();
	this_drop.x = xmax / 2 + 150 * (2 * random() - 1);
	// }
}

// Thank you Jack B. Du for these lists!

let leftEyeBrow = [70, 63, 105, 66, 107];
let rightEyeBrow = [336, 296, 334, 293, 300];

// Define the exterior lip landmark indices for drawing the outer lip contour
let lipsExterior = [
	267,
	269,
	270,
	409,
	291,
	375,
	321,
	405,
	314,
	17,
	84,
	181,
	91,
	146,
	61,
	185,
	40,
	39,
	37,
	0
];

// Define the interior lip landmark indices for drawing the inner lip contour
let lipsInterior = [
	13,
	312,
	311,
	310,
	415,
	308,
	324,
	318,
	402,
	317,
	14,
	87,
	178,
	88,
	95,
	78,
	191,
	80,
	81,
	82
];
