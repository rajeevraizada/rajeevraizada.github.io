let boid, boids;
let num_boids = 50;
// let boids_size = 10;
// let matching_factor = 0.0004;
let centering_factor = 0.001;
let rotation_alignment_factor = 0.5;
let min_speed = 5;
let max_speed = 10;
let speed_control_factor = 1.05;
let acceleration_factor = 1.01;
let direction_change_factor = 3;
let keep_position_in_box_factor = 1;
let margin_size = 20;
let obstacle;
let obst_diam = 150;
// Find out if on touch screen device.
// Mouse click behaviour will be different
let user_agent_string = navigator.userAgent;
let mobile_regexp = /android|iphone|kindle|ipad/i;
let isMobileDevice = mobile_regexp.test(user_agent_string);
let xmax = 400;
let ymax = 700;

function setup() {
  new Canvas(displayWidth, displayHeight);
  world.gravity.y = 0;
  obstacle = new Sprite(xmax / 2, ymax / 2);
  obstacle.diameter = obst_diam;
  obstacle.collider = 'kinematic'; // 'dynamic';
  obstacle.rotationLock = true;
  obstacle.color = 'white';
  obstacle.textSize = 16;
  // obstacle.text = 'Drag me around\n' +
  //  'to bump into boids\n' +
  //  'and change their flocking';

  box = new Sprite([
    [1, 1],
    [xmax, 1],
    [xmax, ymax],
    [1, ymax],
    [1, 1]
  ]);
  box.collider = 'static';
  box.shape = 'chain';
  // box.bounciness = 3;

  boids = new Group();
  boids.collider = 'dynamic';
  boids.color = 'skyblue';
  boids.neighbourCount = 0;
  // boids.bounciness = 0.6;
  // boids.overlaps(boids);
  boids.rotationDrag = 10;
  // boids.debug = true;

  for (i = 0; i < num_boids; i++) {
    this_x = 100 + 250 * random();
    this_y = 100 + 250 * random();
    let boid = new boids.Sprite(this_x, this_y,
      [[20, -5], [-20, -5], [0, 10]]);
    boid.addSensor(50, 0, 100);
    boid.vel.x = -3 + 6 * random();
    boid.vel.y = -3 + 6 * random();
  }
}

function draw() {
  clear();
  // Calculate average position, velocity and direction
  xvel_sum = 0;
  yvel_sum = 0;
  xpos_sum = 0;
  ypos_sum = 0;
  for (i = 0; i < num_boids; i++) {
    this_boid = boids[i];
    xvel_sum += this_boid.vel.x;
    yvel_sum += this_boid.vel.y;
    xpos_sum += this_boid.x;
    ypos_sum += this_boid.y;
  }
  xvel_mean = xvel_sum / num_boids;
  yvel_mean = yvel_sum / num_boids;
  direction_mean = Math.atan2(yvel_mean, xvel_mean);
  xpos_mean = xpos_sum / num_boids;
  ypos_mean = ypos_sum / num_boids;

  // Control the boids speed, direction and position
  for (i = 0; i < num_boids; i++) {
    this_boid = boids[i];
    // Alignment: Make direction of each boid approach average
    this_boid.rotateTowards(direction_mean, rotation_alignment_factor);
    // Cohesion: make each boid steer towards center of mass
    this_boid.vel.x += (xpos_mean - this_boid.x) * centering_factor;
    this_boid.vel.y += (ypos_mean - this_boid.y) * centering_factor;
    // Make position tend to return to inside box
    if (this_boid.x < margin_size) {
      this_boid.x += keep_position_in_box_factor;
      this_boid.direction += direction_change_factor;
    }
    if (this_boid.x > xmax - margin_size) {
      this_boid.x -= keep_position_in_box_factor;
      this_boid.direction += direction_change_factor;
    }
    if (this_boid.y < margin_size) {
      this_boid.y += keep_position_in_box_factor;
      this_boid.direction += direction_change_factor;
    }
    if (this_boid.y > ymax - margin_size) {
      this_boid.y -= keep_position_in_box_factor;
      this_boid.direction += direction_change_factor;
    }
    // Ensure speed stays within max-min range
    if (this_boid.speed < min_speed) {
      this_boid.speed *= speed_control_factor;
    }
    if (this_boid.speed > max_speed) {
      this_boid.speed *= (1 - speed_control_factor);
    }
    // Make the boid face towards direction of movement
    this_boid.rotateTowards(this_boid.direction, 1);
    // Make boids steer away from walls 
    if (this_boid.overlapping(box)) {
      this_boid.direction += direction_change_factor;
    }
    // Give boids a slight tendency to accelerate
    this_boid.speed *= acceleration_factor;

  }


  // Make the obstacle draggable
  if (isMobileDevice == 0) {  // Normal mouse click
    if (obstacle.mouse.dragging()) {
      obstacle.moveTowards(
        mouse.x + obstacle.mouse.x,
        mouse.y + obstacle.mouse.y,
        1 // full tracking
      );
    }
  } else { // Touch screen: no click required. Hover is enough
    if (obstacle.mouse.hovering()) {
      obstacle.moveTowards(
        mouse.x + obstacle.mouse.x,
        mouse.y + obstacle.mouse.y,
        1 // full tracking
      );
    }
  }

  // If obstacle isn't set to collide box, ensure it stays inside box
  obstacle.x = Math.min(obstacle.x, xmax);
  obstacle.x = Math.max(obstacle.x, 1);
  obstacle.y = Math.min(obstacle.y, ymax);
  obstacle.y = Math.max(obstacle.y, 1);

}
