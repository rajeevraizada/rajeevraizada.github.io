let nearest_link;
let springiness_factor = 0;
let num_cols = 8;
let num_rows = 13;
let distance_step = 46;
let link_size = 12;
let x0 = 10;
let y0 = 10;

function draw() {
  // clear();
  background(0, 30);
  colour_links();
  last_link = chain_links.length;
  if (mouse.presses()) {
    nearest_link = find_nearest_link();
  }
  if (mouse.pressing()) {
    link_to_move = chain_links[nearest_link];
    if (link_to_move != null) {
      // link_to_move.color = 'blue';
      link_to_move.moveTowards(mouseX, mouseY, 0.2);
    }
  }
}

function find_nearest_link() {
  min_dist = 1000;
  nearest_link = -1;
  for (i = 0; i < chain_links.length; i++) {
    this_link = chain_links[i];
    this_dist = dist(this_link.x, this_link.y, mouseX, mouseY);
    if (this_dist < min_dist) {
      nearest_link = i;
      min_dist = this_dist;
    }
  }
  return nearest_link;
}


function setup() {
  new Canvas(displayWidth, displayHeight);
  world.gravity.y = 0;
  // world.autoStep = false;

  chain_links = new Group();
  chain_links.color = 'white';
  chain_links.strokeWeight = 0;
  chain_links.diameter = link_size;
  chain_links.collider = 'dynamic';
  chain_links.overlaps(chain_links);
  chain_links.drag = 0.2;

  // Make grids
  for (row = 1; row < num_rows; row++) {
    for (col = 1; col < num_cols; col++) {
      this_link = new chain_links.Sprite();
      if ((row == 1 && col == 1) || (row == 1 && col == num_cols - 1) ||
        (row == num_rows - 1 && col == num_cols - 1) ||
        (row == num_rows - 1 && col == 1)) {
        this_link.collider = 'static';
      }
      this_link.x = x0 + col * distance_step;
      this_link.y = y0 + row * distance_step;
      if (row > 1) {
        link_num_above = (num_cols - 1) * (row - 2) + col - 1;
        j1 = new DistanceJoint(chain_links[link_num_above], this_link);
        j1.springiness = springiness_factor;
        j1.visible = false;
      }
      if (col > 1) {
        link_num_to_left = (num_cols - 1) * (row - 1) + col - 2;
        j2 = new DistanceJoint(chain_links[link_num_to_left], this_link);
        j2.springiness = springiness_factor;
        j2.visible = false;
      }
    }
  }
}

function colour_links() {
  for (i = 0; i < chain_links.length; i++) {
    this_link = chain_links[i];
    this_speed = Math.sqrt((this_link.vel.x) ** 2 + (this_link.vel.y) ** 2);
    baseline = 80;
    this_link.color = color(200 + 50 * this_link.vel.x, 200, 200 + 50 * this_link.vel.y);
    // his_link.color = color(baseline + 30 * this_speed, baseline + 30 * this_speed, baseline);
  }
}
