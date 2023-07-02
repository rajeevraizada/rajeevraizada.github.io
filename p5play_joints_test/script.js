let x0, platform, dropping_blocks;

function draw() {
  clear();
  if (platform.mouse.dragging()) {
	  platform.moveTowards(
			mouse.x + platform.mouse.x,
			mouse.y + platform.mouse.y,
			1); // full tracking
  }

  // Drop random blocks
  if  (frameCount %  100 == 0) {
    new_block = new dropping_blocks.Sprite();
    new_block.x = x0 - 80 + random(160);
    // Make some dropped blocks round instead of square
    if (random() > 0.5)  {
      new_block.diameter = 30;
    }
  }
}


function setup() {
  new Canvas(displayWidth, displayHeight);
  world.gravity.y = 10;

  x0 = 200;
  y0 = 50;

  pin = new Sprite();
  pin.collider = 'static';
  pin.diameter = 10;
  pin.x = x0;
  pin.y = y0;

  num_chain_links = 10;
  distance_step = 30;
  
  platform = new Sprite();
  platform.collider = 'dynamic';
  platform.width = num_chain_links*distance_step;
  platform.height = 20;
  platform.x = x0;
  platform.y = y0 + (num_chain_links-1)*distance_step;
  platform.friction = 10;
  
  chain_links = new Group();
  chain_links.diameter = 10;
  chain_links.collider = 'dynamic';

  // Make two chains
  for (chain_num=0; chain_num<2; chain_num++) {
    previous_link = pin;
    for (i=1; i<num_chain_links; i++) {
      this_link = new chain_links.Sprite();
      this_link.x = x0 + (-1)**chain_num * i*distance_step/2;
      this_link.y = y0 + i*distance_step;
      j = new DistanceJoint(previous_link,this_link);
      // j.springiness = -10;  // Seem to need strongly negative to be non-elastic
      // j.damping = 100;
      previous_link = this_link;
    }
    // Glue the bottom ends of the chain onto platform
    new GlueJoint(previous_link, platform);
  }

  dropping_blocks = new Group();
  dropping_blocks.collider = 'dynamic';
  dropping_blocks.width = 30;
  dropping_blocks.height = 30;
  dropping_blocks.y = 0;
  dropping_blocks.overlaps(chain_links);
  dropping_blocks.overlaps(pin);
}
