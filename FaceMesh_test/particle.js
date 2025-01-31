// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// A simple Particle class

class Particle {
  constructor(x, y, d) {
    this.position = createVector(x, y);
    this.acceleration = createVector(0, 0);
    this.velocity = p5.Vector.random2D();
    //this.velocity.mult(random(2, 5));
    this.lifespan = 255.0;
    this.r = d * 0.5;
  }

  run() {
    let gravity = createVector(0, -0.05);
    this.applyForce(gravity);
    this.update();
    this.show();
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  // Method to update position
  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.lifespan -= 2;
    this.acceleration.mult(0);
  }

  // Method to display
  show() {
    stroke(255, this.lifespan);
    fill(255, this.lifespan * 0.5);
    strokeWeight(4);
    circle(this.position.x, this.position.y, this.r * 2);
  }

  // Is the particle still useful?
  isDead() {
    return this.lifespan < 0.0;
  }
}
