let xmax = 370;
let ymax = 600;
let num_anchors = 6;
let max_anchors = 12;
let radius = 180;
let ratio = 2 / 3;
let num_points_per_frame = 1000;
let previous_point;
let counter = 0;
let max_points = num_anchors * 20000;
let ratio_slider_y = 80;
let ratio_slider_xmin = 70;
let ratio_slider_range = 150;
let ratio_slider_xmax = ratio_slider_xmin + ratio_slider_range;
let vertex_slider_y = 20;
let vertex_slider_xmin = 70;
let vertex_slider_range = 150;
let vertex_slider_xmax = vertex_slider_xmin + vertex_slider_range;

function draw() {
  update_sliders();
  if (counter < max_points) {
    for (i = 0; i < num_points_per_frame; i++) {
      anchor_to_use = Math.floor(num_anchors * Math.random());
      this_anchor = anchors[anchor_to_use];
      current_point.x = (1 - ratio) * previous_point.x + ratio * this_anchor.x;
      current_point.y = (1 - ratio) * previous_point.y + ratio * this_anchor.y;
      current_point.color = color(anchor_to_use * 360 / num_anchors, 100, 80);
      current_point.draw();
      counter++;
      previous_point = current_point;
    }
  }
}

function update_sliders() {
  if (ratio_slider_button.mouse.pressing()) {
    clear();
    ratio = 0.5 + 0.5 * (ratio_slider_button.x - ratio_slider_xmin) / ratio_slider_range;
    ratio = Math.min(ratio, 1);
    ratio = Math.max(ratio, 0.5);
    show_text();
    ratio_slider_button.moveTowards(mouse, 1);
    ratio_slider_button.y = ratio_slider_y;
    ratio_slider_button.x = Math.min(ratio_slider_xmax, ratio_slider_button.x);
    ratio_slider_button.x = Math.max(ratio_slider_xmin, ratio_slider_button.x);
  } else {
    ratio_slider_button.vel.x = 0;
    ratio_slider_button.vel.y = 0;
    ratio_slider_button.y = ratio_slider_y;
    ratio_slider_button.x = Math.min(ratio_slider_xmax, ratio_slider_button.x);
    ratio_slider_button.x = Math.max(ratio_slider_xmin, ratio_slider_button.x);
    counter = 0;
  }
  if (vertex_slider_button.mouse.pressing()) {
    clear();
    num_anchors = 3 + (max_anchors - 3) * (vertex_slider_button.x - vertex_slider_xmin) / vertex_slider_range;
    num_anchors = Math.round(num_anchors);
    num_anchors = Math.max(num_anchors, 3);
    num_anchors = Math.min(num_anchors, max_anchors);
    max_points = num_anchors * 20000;
    make_anchors();
    show_text();
    vertex_slider_button.moveTowards(mouse, 1);
    vertex_slider_button.y = vertex_slider_y;
    vertex_slider_button.x = Math.min(vertex_slider_xmax, vertex_slider_button.x);
    vertex_slider_button.x = Math.max(vertex_slider_xmin, vertex_slider_button.x);
  } else {
    vertex_slider_button.vel.x = 0;
    vertex_slider_button.vel.y = 0;
    vertex_slider_button.y = vertex_slider_y;
    // vertex_slider_button.x = vertex_slider_xmin + (num_anchors - 3) / (max_anchors-3) * vertex_slider_range;
    vertex_slider_button.x = Math.min(vertex_slider_xmax, vertex_slider_button.x);
    vertex_slider_button.x = Math.max(vertex_slider_xmin, vertex_slider_button.x);
    counter = 0;
  }
}


function setup() {
  new Canvas(xmax, ymax);
  // world.autoStep = false;
  colorMode(HSB);

  point_sprites = new Group();
  point_sprites.diameter = 1;
  point_sprites.collider = 'static';
  point_sprites.color = 'black';
  point_sprites.strokeWeight = 0;

  anchors = new Group();
  anchors.diameter = 5;
  anchors.collider = 'static';
  anchors.color = 'white';
  anchors.strokeWeight = 0;
  anchors.visible = false;

  current_point = new point_sprites.Sprite();
  current_point.x = Math.random();
  current_point.y = Math.random();
  previous_point = current_point;

  slider_buttons = new Group();
  slider_buttons.diameter = 35;
  slider_buttons.collider = 'kinematic';
  slider_buttons.color = 'DodgerBlue';
  slider_buttons.strokeWeight = 0;

  ratio_slider_button = new slider_buttons.Sprite();
  ratio_slider_button.y = ratio_slider_y;
  ratio_slider_button.x = ratio_slider_xmin + (ratio-0.5)/0.5 * ratio_slider_range;

  vertex_slider_button = new slider_buttons.Sprite();
  vertex_slider_button.y = vertex_slider_y;
  vertex_slider_button.x = vertex_slider_xmin + (num_anchors - 3) / (max_anchors-3) * vertex_slider_range;

  slider_lines = new Group();
  slider_lines.height = 3;
  slider_lines.collider = 'static';
  slider_lines.color = 'black';
  slider_lines.overlaps(slider_buttons);

  ratio_slider_line = new slider_lines.Sprite();
  ratio_slider_line.width = ratio_slider_range;
  ratio_slider_line.y = ratio_slider_y;
  ratio_slider_line.x = ratio_slider_xmin + ratio_slider_range / 2;

  vertex_slider_line = new slider_lines.Sprite();
  vertex_slider_line.width = vertex_slider_range;
  vertex_slider_line.y = vertex_slider_y;
  vertex_slider_line.x = vertex_slider_xmin + vertex_slider_range / 2;

  slider_lines.layer = 1;
  slider_buttons.layer = 2;

  make_anchors();
  show_text();
}

function make_anchors() {
  exterior_angle = 2 * Math.PI / num_anchors;
  interior_angle = Math.PI - exterior_angle;
  half_interior = interior_angle / 2;
  let offset_angle = Math.PI - interior_angle - half_interior;
  anchors.removeAll();
  for (i = 0; i < num_anchors; i++) {
    this_anchor = new anchors.Sprite();
    this_angle = -offset_angle + 2 * Math.PI * i / num_anchors;
    this_anchor.x = xmax / 2 + radius * Math.cos(this_angle);
    this_anchor.y = ymax / 2 + radius * Math.sin(this_angle);
  }
}

function show_text() {
  textAlign(CENTER, CENTER);
  text('0.5', ratio_slider_xmin - 15, ratio_slider_y);
  text('1', ratio_slider_xmin + ratio_slider_range + 10, ratio_slider_y);
  text('Ratio:', ratio_slider_xmin - 50, ratio_slider_y);
  ratio_slider_button.text = Math.round(100 * ratio) / 100;
  ratio_slider_button.textColor = 'white';

  text('3', vertex_slider_xmin - 10, vertex_slider_y);
  text(max_anchors, vertex_slider_xmin + vertex_slider_range + 11, vertex_slider_y);
  text('Vertices:', vertex_slider_xmin - 45, vertex_slider_y);
  vertex_slider_button.textSize = 20;
  vertex_slider_button.text = num_anchors;
  vertex_slider_button.textColor = 'white';
}
