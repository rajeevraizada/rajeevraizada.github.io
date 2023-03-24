let peg, block, goal;
let score = 0;
let timer = 0;
let colour_change_timer = 0;

function setup() {
  new Canvas(500, 600);
  world.gravity.y = 10;
  peg = new Sprite();
  peg.diameter = 50;
  goal = new Sprite();
  goal.diameter = 50;
  goal.x = 35
  goal.y = 60
  goal.collider = 'static'
  goal.color = 'black'
  make_new_block()
  textSize(20)
}

function make_new_block() {
  block = new Sprite();
  block.collider = 'dynamic';
  block.width = 50;
  block.y = 0;
  // block.x = width/2 + random(width/4);
  block.x = 250
  block.vel.x = random(-2,2)
  block.rotationSpeed = random(-5,5)
}

function draw() {
  clear();
  peg.moveTowards(mouse.x,mouse.y,1);
  if (block.collides(goal)) {
    score += 1
    colour_change_timer = millis()
    goal.color = 'red'
    fill('red')
  } 
  if (millis() > timer+2000) {
    make_new_block()
    timer = millis()
    // When new block arrives, remove previous
    allSprites[2].remove()
  }
    if (millis()>colour_change_timer+400) {
    goal.color = 'black'
    fill('black')
  }
  text('Score: '+score, 0, 20)
}