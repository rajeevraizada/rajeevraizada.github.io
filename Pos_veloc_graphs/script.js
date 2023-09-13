let details = navigator.userAgent;
let regexp = /android|iphone|kindle|ipad/i;
let regexp_smallscreen = /android|iphone/i;
let isMobileDevice = regexp.test(details);
let isSmallScreen = regexp_smallscreen.test(details);
let xmax;
if (isSmallScreen) {
  xmax = 380;
} else {
  xmax = 600;
}
let ymax = 700;
let graph_gap = 200;
let x0 = 40;
let yrange = 300;
let car_sprite_diameter = 80;
let y0 = yrange / 2;
let vel_y0 = y0 + yrange / 2 + graph_gap;
let t_history, ypos_history, yvel_history, accel;
let accel_history, clock_has_started, t0, time, zero_crossings;
let friction_amount = 1;
let mouse_padding = 20;

function reset_variables() {
  t_history = [0];
  ypos_history = [y0];
  yvel_history = [0];
  accel_history = [0];
  clock_has_started = 0;
  t0 = 0;
  time = 0;
  zero_crossings = [];
  car.vel.y = 0;
  car.vel.x = 0;
  car.x = x0;
  car.y = y0;
  accel = 0;
}

function move_car() {
  // Move the car up or down if mouse is pressing
  if (mouse.pressing() && !reset_button.mouse.pressing()) {
    if (Math.abs(mouse.y - car.y) > mouse_padding) {
      car.attractTo(car.x, mouse.y, 10);
    }
  }
  // Stop the car from going past upper and lower boundaries
  // Upper boundarry (higher on screen): car hits box, so not necessary
  // Lower bound:
  if (car.y >= y0 + yrange / 2) {
    car.vel.y = 0;
    car.y = y0 + yrange / 2;
  }
}

function record_histories() {
  // Record time and y history
  if (clock_has_started == 1) {
    t_history.push(time);
    ypos_history.push(car.y);
    yvel_history.push(car.vel.y);
  }
  current_index = t_history.length - 1;
  accel = yvel_history[current_index] - yvel_history[current_index - 1]
  // Record zero crossings
  if (Math.sign(car.vel.y) != Math.sign(yvel_history[current_index - 1]) &&
    current_index > 20 && Math.abs(accel) > 0.01) {
    zero_crossings.push(current_index);
  }
}

function mousePressed() {
  if (clock_has_started == 0) {
    clock_has_started = 1;
    t0 = frameCount;
    time = 0;
  }
  if (reset_button.mouse.pressing()) {
    reset_variables();
  }
  loop();
}

function draw() {
  clear();
  move_car();
  record_histories();
  show_position_axes();
  show_velocity_axes();
  plot_graphs();
  show_velocity_zero_crossings();
  if (clock_has_started == 1) {
    time = (frameCount - t0) / 2;
  }
  // Stop looping if car has reached end of journey.
  // This saves CPU when idle. 
  // mousePressed() turns loop back on.
  if (time > xmax) {
    noLoop();
  }
}

function show_velocity_zero_crossings() {
  for (i = 0; i < zero_crossings.length; i++) {
    stroke('lightgrey');
    strokeWeight(1);
    this_index = zero_crossings[i];
    line(t_history[this_index] + x0, vel_y0, t_history[this_index] + x0, ypos_history[this_index]);
  }

}

function plot_graphs() {
  // Plot the position line
  stroke('red');
  strokeWeight(3);
  for (i = 1; i < t_history.length; i++) {
    line(t_history[i - 1] + x0, ypos_history[i - 1], t_history[i] + x0, ypos_history[i]);
  }
  // Plot the velocity line
  stroke('royalblue');
  strokeWeight(3);
  for (i = 1; i < t_history.length; i++) {
    line(t_history[i - 1] + x0, 50 * yvel_history[i - 1] + vel_y0,
      t_history[i] + x0, 50 * yvel_history[i] + vel_y0);
  }
}

function show_position_axes() {
  // Draw position graph axes
  stroke('black');
  strokeWeight(2);
  line(0, y0, xmax, y0);
  line(x0, y0 - yrange / 2, x0, y0 + yrange / 2);
  textSize(20);
  strokeWeight(0);
  text('Time ➡', xmax - 70, y0 + 20);
  push();
  translate(x0 - 20, 100);
  rotate(-90);
  fill('red');
  text('Position ➡', 0, 0);
  pop();
  textSize(12);
  text('Drag car up or down to start. Friction damps its motion.', xmax / 2 - 120, 20);
}

function show_velocity_axes() {
  // Draw velocity graph axes
  stroke('black');
  strokeWeight(2);
  line(0, vel_y0, xmax, vel_y0);
  line(x0, vel_y0 - yrange / 2, x0, vel_y0 + yrange / 2);
  textSize(20);
  strokeWeight(0);
  text('Time ➡', xmax - 70, vel_y0 + 20);
  push();
  translate(x0 - 20, vel_y0 - 50);
  rotate(-90);
  fill('royalblue');
  text('Velocity ➡', 0, 0);
  pop();
  textSize(12);
  text('Velocity of car vs. time', xmax / 2 - 40, vel_y0 - yrange / 2 + 20);
}

function setup() {
  new Canvas(xmax, ymax);

  box = new Sprite([
    [1, 1],
    [xmax, 1],
    [xmax, ymax],
    [1, ymax],
    [1, 1]
  ]);
  box.bounciness = 0;
  box.collider = 'static';
  box.shape = 'chain';
  box.color = 'blue';
  box.strokeWeight = 0;

  car = new Sprite();
  car.diameter = car_sprite_diameter;
  car.color = 'white';
  car.x = x0;
  car.y = y0;
  car.bounciness = 0;
  car.img = 'Assets/car_topview.png';
  car.rotationLock = true;
  // Give the car some drag, as friction when not being pulled to mouse
  car.drag = friction_amount;

  reset_button = new Sprite();
  reset_button.x = xmax - 35;
  reset_button.y = y0 + yrange / 2;
  reset_button.width = 70;
  reset_button.height = 30;
  reset_button.textSize = 20;
  reset_button.text = 'Reset';
  reset_button.color = 'lightgreen';
  reset_button.stroke = 'white';

  reset_variables();
}

