/* 
Written by Raj Raizada: rajeev dot raizada at gmail dot com 
Released under Creative Commons license: Attribution-NonCommercial 
https://creativecommons.org/licenses/by-nc/2.0/
Source code available on Github:
https://github.com/rajeevraizada/rajeevraizada.github.io/tree/master/NumberDrop
Using libraries: p5play.org and p5js.org
*/

let details = navigator.userAgent;
let regexp_touchscreen = /android|iphone|kindle|ipad/i;
let regexp_smallscreen = /android|iphone/i;
let isTouchScreenDevice = regexp_touchscreen.test(details);
let isSmallScreen = regexp_smallscreen.test(details);
let xmax = 370;
let ymax = 600;
let below_box_buffer = 100;
let discs;
let initial_num_discs = 10;
let disc_diam = 70;
let min_disc_num = 1;
let max_disc_num = 10;
let new_disc_delay = 5000;
let last_drop_time = 0;
let num_discs_to_use_for_target = 2;
let target_num = 0;
let previous_target_num = -1;
let target_creation_time = 0;
let nums_list = [];
let selected_nums = [];
let submitted_nums = [];
let submission_made = 0;
let submitted_time = -5000;
let submitted_target_num = 0;
let submitted_total = 0;
let selected_total = 0;
let total = 0;
let unselection_time = 0;
let num_selected_discs = 0;
let game_has_started = 0;
let score = 0;
let hi_score = 0;
let start_time = 0;
let game_over = 0;
let game_over_sound_has_played = 0;
let level_cleared = 0;
let emoji_list = ['😎', '🤩', '🤠', '🐯', '🦊', '👑', '🦁',
  '🐶', '🦄', '🦋', '🐙', '🤪', '🌈', '🍔', '🧁', '🍨', '😁',
  '🥇', '🎸', '🎯', '🚀', '💰', '💎', '🧸', '🎁', '😺', '💩'];
let num_emojis = emoji_list.length;
let new_target_num_needed = 0;
let level = 1;
let solution_set = [];
let highest_disc_y = 0;
let mouse_has_been_pressed = 0;
let pi = Math.PI;
let auto_submit = 1;
let time_pressure_on = 0;

function draw() {
  clear();
  if (game_has_started == 0) {
    check_start_button();
  } else {
    discs.draw();
    // text(solution_set,xmax/2,200);
    // get_nums_list();
    // text(nums_list,xmax,230);
    // show_disc_values();
    calculate_acceleration_make_sounds();
    // Drop a new disc at regular intervals
    if ((millis() - last_drop_time > new_disc_delay) &&
      level_cleared == 0) {
      this_value = Math.round(max_disc_num * random());
      if (game_over == 0) {
        drop_new_disc(this_value);
      }
      // Make the discs gradually drop quicker
      new_disc_delay = Math.max(new_disc_delay - 200, 2500);
      last_drop_time = millis();
    }
    display_target();
    check_for_touch_or_click();
    // If auto-submit is off:
    // If the submit button has been pressed, check if correct or not
    if (auto_submit == 0) {
      if (submission_made == 1 && num_selected_discs > 0) {
        submitted_nums = selected_nums;
        submitted_target_num = target_num;
        check_submission_v2();
        submitted_time = millis();
        display_submitted_nums();
        reset_selection_state();
        submission_made = 0;
      }
    }
    // Check the sum, if auto-submit is on
    get_selected_nums();
    selected_total = sum_array(selected_nums);
    if (auto_submit == 1) {
      if (sum_array(selected_nums) >= target_num) {
        if (submission_made == 0) {
          submitted_nums = selected_nums;
          submission_made = 1;
          submitted_total = sum_array(submitted_nums);
          submitted_target_num = target_num;
        }
        check_submission_v2();
        submitted_time = millis();
        display_submitted_nums();
        reset_selection_state();
      }
    }
    // Shortly after discs have been removed, make a new target number
    if (new_target_num_needed == 1 &&
      millis() - submitted_time > 200 &&
      discs.length > 0) {
      make_new_target_num();
      new_target_num_needed = 0;
    }
    // Make a new target, if needed
    if (new_target_num_needed == 1) {
      make_new_target_num();
      new_target_num_needed = 0;
    }
    // Also, check if a new target is needed
    // in the period shortly after a successful submission
    // and occasionally at other times, to stop target
    // from getting out of synch with current discs
    if (discs.length > 0 &&
      (correct_sound.isPlaying() ||
        Math.abs(millis() - submitted_time) % 200 < 50)
    ) {
      check_if_new_target_needed_v3();
    }
    // Show the submitted numbers for a few seconds after submission
    if (millis() - submitted_time < 3000 &&
      level_cleared == 0) {
      display_submitted_nums();
    }
    // Check if game over
    check_if_danger_line_touched();
    if (game_over == 1) {
      check_game_over_button();
    }
    // Check if level has been cleared
    if (discs.length == 0 && level_cleared == 0) {
      new level_cleared_sprite.Sprite();
      if (!fanfare_sound.isPlaying()) {
        fanfare_sound.play();
      }
      score += 100;
      level_cleared = 1;
      level += 1;
    }
    display_score_and_level();
  }
}

function get_selected_nums() {
  selected_nums = [];
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    if (this_disc != null) {
      if (this_disc.is_selected == 1) {
        selected_nums.push(this_disc.number);
      }
    }
  }
}

function get_nums_list() {
  nums_list = [];
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    this_num = this_disc.number;
    nums_list.push(this_num);
  }
}

function highlight_selected_discs() {
  discs.draw();
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    if (this_disc.is_selected == 1) {
      noFill();
      stroke('lime');
      strokeWeight('8');
      ellipse(this_disc.x, this_disc.y, disc_diam, disc_diam);
    }
  }
}

function check_if_danger_line_touched() {
  danger_disc_num = -1;
  danger_disc_motion = -1;
  if (danger_line.overlapping(discs)) {
    // If a disc is touching the danger line,
    // check if it is in free fall or not.
    // If it's not falling, then game over
    for (i = 0; i < discs.length; i++) {
      this_disc = discs[i];
      this_disc_is_colliding = 0;
      if (this_disc.overlapping(danger_line)) {
        // See if this disc is touching any others
        for (j = 0; j < discs.length; j++) {
          other_disc = discs[j];
          if (this_disc.colliding(other_disc)) {
            this_disc_is_colliding = 1;
          }
        }
      }
      if (this_disc.overlapping(danger_line) &&
        this_disc_is_colliding == 1) {
        danger_disc_num = i;
      }
    }
  }
  // If we have a danger disc that is colliding,
  // let's check its motion too, to be safe.
  // It shouldn't be moving
  if (danger_disc_num > -1) {
    danger_disc = discs[danger_disc_num];
    if (danger_disc != null) {
      danger_disc_motion = Math.abs(danger_disc.vel.x) +
        Math.abs(danger_disc.vel.y);
    }
    if (danger_disc_motion > -1 && danger_disc_motion < 0.1) {
      game_over_button.visible = true;
      game_over = 1;
      if (game_over_sound_has_played == 0) {
        //  sad_trombone_sound.play();
      }
      game_over_sound_has_played = 1;
    }
  }
}

function display_target() {
  time_since_new_target = millis() - target_creation_time;
  colorMode(HSB, 100);
  color_t = time_since_new_target / 15;
  background_color = color(15, 100 - color_t, 100);
  target_background_button.color = background_color;
  // Present target inn middle
  ypos = danger_line.y - 50;
  target_background_button.y = ypos;
  target_background_button.x = xmax / 2;
  target_background_button.draw();
  noStroke();
  fill('black');
  textSize(36);
  textAlign(CENTER, CENTER);
  text('Target: ' + target_num, xmax / 2, ypos);
  textSize(16);
  text('using addition', xmax / 2, ypos + 25);
}

function display_score_and_level() {
  fill('black');
  noStroke();
  textSize(14);
  textAlign(RIGHT);
  text('Difficulty level: ' + level, xmax - 20, 20);
  text('Personal hi-score: ' + hi_score, xmax - 20, 40);
  text('Score: ' + score, xmax - 20, 60);
  // text('Selected total: ' + selected_total, 120, 20);
  // text('Target num: ' + target_num, 120, 40);
  // text('Selected nums: ' + selected_nums, 200, 60);
  textAlign(LEFT);
  if (auto_submit == 1) {
    text('Auto-submit: ON', 20, 20);
  } else {
    text('Auto-submit: OFF', 20, 20);
  }
  if (time_pressure_on == 1) {
    text('Time-pressure: ON', 20, 40);
  } else {
    text('Time-pressure: OFF', 20, 40);
  }
}

function setup_new_level() {
  initial_num_discs = 10 + Math.min(2 * level, 10);
  num_discs_to_use_for_target = 2 + Math.floor(level / 5);
  if (time_pressure_on == 0) {
    new_disc_delay = 10000000;
  } else {
    new_disc_delay = Math.max(5000 - level * 200, 2500);
  }
  max_disc_num = 10 + level;
  min_disc_num = 1;
  last_drop_time = millis();
  level_cleared = 0;
  make_discs();
  make_new_target_num();
}

function make_discs() {
  for (i = 0; i < initial_num_discs; i++) {
    // this_val_unrounded = min_disc_num + random() * (max_disc_num - min_disc_num);
    this_val_unrounded = min_disc_num + (i / initial_num_discs) * (max_disc_num + 1 - min_disc_num);
    this_val = Math.round(this_val_unrounded);
    drop_new_disc(this_val);
  }
}

function drop_new_disc(this_value) {
  this_disc = new discs.Sprite();
  this_disc.x = (0.1 + 0.8 * Math.random()) * xmax;
  this_disc.y = 50 + Math.random() * ymax / 5;
  // this_disc.number = this_value % max_disc_num + 1;
  if (this_value == 0) {
    this_value = 1;
  }
  this_disc.number = this_value;
  // this_disc.color = num_to_color(this_disc.number);
  if ((this_value + 100) % 10 == 0) {
    this_disc.image = gold_color;
  }
  if ((this_value + 100) % 10 == 1) {
    this_disc.image = jade_color;
  }
  if ((this_value + 100) % 10 == 2) {
    this_disc.image = green_color;
  }
  if ((this_value + 100) % 10 == 3) {
    this_disc.image = grey_color;
  }
  if ((this_value + 100) % 10 == 4) {
    this_disc.image = pink_color;
  }
  if ((this_value + 100) % 10 == 5) {
    this_disc.image = lavender_color;
  }
  if ((this_value + 100) % 10 == 6) {
    this_disc.image = sea_color;
  }
  if ((this_value + 100) % 10 == 7) {
    this_disc.image = sky_color;
  }
  if ((this_value + 100) % 10 == 8) {
    this_disc.image = tan_color;
  }
  if ((this_value + 100) % 10 == 9) {
    this_disc.image = purple_color;
  }
  this_disc.textSize = 22;
  this_disc.text = this_value;
  return this_disc;
}

// New version of check_submission, to include auto-submit possibility
function check_submission_v2() {
  selected_total = 0;
  selected_nums = [];
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    if (this_disc.is_selected == 1) {
      selected_nums.push(this_disc.number);
      selected_total += this_disc.number;
    }
  }
  // If the submitted total matches the target,
  // remove the selected discs bt giving them short life.
  if (selected_total == target_num) {
    for (i = 0; i < discs.length; i++) {
      this_disc = discs[i];
      if (this_disc.is_selected == 1) {
        this_disc.life = 1;
        make_confetti(this_disc);
        score += 10;
        if (score > hi_score) {
          hi_score = score;
          storeItem('hi_score', hi_score);
        }
      }
    }
    // We'll need a new target number, after this correct submission
    new_target_num_needed = 1;
    correct_sound.play();
  }
  // If submission was wrong, drop a new disc,
  // or, if auto-submit, drop a new disc if total exceeds target
  if ((auto_submit == 0 && selected_total != target_num) ||
    (auto_submit == 1 && total > target_num)) {
    this_value = Math.round(max_disc_num * random());
    penalty_disc = drop_new_disc(this_value);
    penalty_disc.y = ymax / 4;
    // penalty_disc.x = 50;
    penalty_disc.vel.x = 2 - 4 * random();
    penalty_disc.vel.y = -15;
    penalty_disc.drag = 10;
    score -= 10;
    wrong_sound.play();
  }
}

function check_submission() {
  submitted_total = 0;
  selected_nums = [];
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    if (this_disc.is_selected == 1) {
      selected_nums.push(this_disc.number);
      submitted_total += this_disc.number;
    }
  }
  // If the submitted total matches the target,
  // remove the selected discs bt giving them short life.
  if (submitted_total == target_num) {
    for (i = 0; i < discs.length; i++) {
      this_disc = discs[i];
      if (this_disc.is_selected == 1) {
        this_disc.life = 1;
        make_confetti(this_disc);
        score += 10;
        if (score > hi_score) {
          hi_score = score;
          storeItem('hi_score', hi_score);
        }
      }
    }
    // We'll need a new target number, after this correct submission
    new_target_num_needed = 1;
    correct_sound.play();
  } else { // If submission was wrong, drop a new disc
    this_value = Math.round(max_disc_num * random());
    penalty_disc = drop_new_disc(this_value);
    penalty_disc.y = ymax / 4;
    // penalty_disc.x = 50;
    penalty_disc.vel.x = 2 - 4 * random();
    penalty_disc.vel.y = -15;
    penalty_disc.drag = 10;
    score -= 10;
    wrong_sound.play();
  }
  // Get the position of the highest disc, for displaying submission
  highest_disc_y = ymax;
  for (j = 0; j < discs.length; j++) {
    this_disc = discs[j];
    if (this_disc.y < highest_disc_y &&
      Math.abs(this_disc.vel.y) < 0.01) {
      highest_disc_y = this_disc.y;
    }
  }
}

function display_submitted_nums() {
  display_string = '';
  for (i = 0; i < submitted_nums.length; i++) {
    display_string += submitted_nums[i];
    if (i < submitted_nums.length - 1) {
      display_string += ' + ';
    }
  }
  if (submitted_nums.length > 1) {
    display_string += ' = ' + sum_array(submitted_nums);
    if (sum_array(submitted_nums) != submitted_target_num) {
      if (auto_submit == 0) {
        display_string += ' ≠ ';
        display_string += submitted_target_num;
      }
      if (auto_submit == 1 && sum_array(submitted_nums) > submitted_target_num) {
        display_string += ' > ';
        display_string += submitted_target_num;
      }
    }
  }
  if (sum_array(submitted_nums) == submitted_target_num) {
    display_string += ' ✅';
  } else {
    display_string += ' ❌';
  }
  // Display the numbers
  fill('black');
  noStroke();
  textSize(20);
  textAlign(CENTER);
  text(display_string, xmax / 2, danger_line.y + 50);
  if (auto_submit == 1 && sum_array(submitted_nums) > submitted_target_num) {
    textSize(30);
    fill('red');
    text('Too much!', xmax / 2, danger_line.y + 90);
    fill('black');
  }
}

function reset_selection_state() {
  submission_made = 0;
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    if (this_disc != null) {
      this_disc.is_selected = 0;
      this_disc.textSize = 22;
      // this_disc.stroke = 'black';
      // this_disc.strokeWeight = 1;
    }
  }
}

function sum_array(this_array) {
  total = 0;
  for (i = 0; i < this_array.length; i++) {
    total += this_array[i];
  }
  return total;
}

function check_for_touch_or_click() {
  disc_idx_being_clicked = -1;
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    if (this_disc != null) {
      if (this_disc.mouse.pressed()) {
        disc_idx_being_clicked = i;
        // Toggle whether disc is selected
        this_disc.is_selected = 1 - this_disc.is_selected;
        click_sound.play();
      }
      if (this_disc.is_selected == 1) {
        this_disc.textSize = 44;
      } else {
        this_disc.textSize = 22;
      }
    }
  }

  // Ok, that's the end of handling clicking on the discs.
  // Let's do a similar process for the submit_button.
  // We can only submit if at least once disc is selected:
  num_selected_discs = 0;
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    if (this_disc.is_selected == 1) {
      num_selected_discs += 1;
    }
  }
  // If auto-submit is off,
  // check for touch of submit button, or spacebar being pressed
  if (auto_submit == 0) {
    if (num_selected_discs > 0) {
      if (submit_button.mouse.pressed() || kb.pressing(' ')) {
        if (submission_made == 0) {
          submission_made = 1;
          click_sound.play();
        }
      }
    }
  }
  // Check if the level-cleared button is being pressed
  if (discs.length == 0) {
    if (level_cleared_sprite.mouse.pressed()) {
      level_cleared_sprite.remove();
      setup_new_level();
    }
  }
  // Check toggle buttons
  if (toggle_auto_submit_button.mouse.pressed()) {
    click_sound.play();
    auto_submit = 1 - auto_submit;
    if (auto_submit == 1) {
      submit_button.visible = false;
      can_press_space_button.visible = false;
    } else {
      submit_button.visible = true;
      if (isTouchScreenDevice == 0) {
        can_press_space_button.visible = true;
      }
    }
  }
  if (toggle_time_pressure_button.mouse.pressed()) {
    click_sound.play();
    time_pressure_on = 1 - time_pressure_on;
    if (time_pressure_on == 0) {
      new_disc_delay = 10000000;
    } else {
      new_disc_delay = Math.max(5000 - level * 200, 2500);
    }
  }
}

function check_start_button() {
  if (start_button.mouse.pressed()) {
    start_new_game();
  }
}

function check_game_over_button() {
  if (mouse.pressed() && game_over_button.visible == true) {
    game_over_button.visible = false;
    game_over = 0;
    discs.remove();
    start_new_game();
  }
}

function start_new_game() {
  score = 0;
  level = 1;
  game_has_started = 1;
  game_over = 0;
  game_over_sound_has_played = 0;
  start_time = millis();
  start_button.visible = false;
  if (auto_submit == 0) {
    submit_button.visible = true;
    if (isTouchScreenDevice == 0) {
      can_press_space_button.visible = true;
    }
  }
  click_sound.play();
  setup_new_level();
}

function make_new_target_num() {
  target_num = 1;
  nums_list = [];
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    this_num = this_disc.number;
    nums_list.push(this_num);
  }
  max_num = Math.max(...nums_list);
  shuffled_nums = nums_list.sort((a, b) => 0.5 - Math.random());
  if (shuffled_nums.length > num_discs_to_use_for_target) {
    j = 0;
    // Make sure that target_num is bigger than max disc num
    while (target_num <= max_num || j < num_discs_to_use_for_target) {
      target_num += shuffled_nums[j];
      j += 1;
    }
  } else {
    target_num = sum_array(shuffled_nums);
  }
  // If the new target num happens to be the same as the previous one,
  // reshuffle and try one more time, using first three if there are that many
  if (target_num == previous_target_num) {
    shuffled_nums = nums_list.sort((a, b) => 0.5 - Math.random());
    how_many_to_use = Math.min(nums_list.length, 3);
    new_target = 0;
    for (k = 0; k < how_many_to_use; k++) {
      new_target += shuffled_nums[k];
    }
    target_num = new_target;
  }
  previous_target_num = target_num;
  target_creation_time = millis();
  // Prevent accidental target_num = NaN
  if (isNaN(target_num)) {
    target_num = Math.max(nums_list);
  }
  if (isNaN(target_num)) {
    target_num = nums_list[0] + nums_list[1];
  }
}

function check_if_new_target_needed_v3() {
  // nums_list = [];
  solution_set = [];
  get_nums_list();
  pos_nums = [];
  neg_nums = [];
  odd_nums = [];
  new_target_num_needed = 0;
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    this_num = this_disc.number;
    // nums_list.push(this_num);
    if (this_num < 0) {
      neg_nums.push(this_num);
    }
    if (this_num > 0) {
      pos_nums.push(this_num);
    }
    if (this_num % 2 == 1) {
      odd_nums.push(this_num);
    }
  }
  if ((target_num < 0 && target_num < sum_array(neg_nums)) ||
    (target_num <= 0 && neg_nums.length == 0) ||
    (target_num % 2 == 1 && odd_nums.length == 0) ||
    (target_num > sum_array(pos_nums))) {
    new_target_num_needed = 1;
  }
  // Try a full search, for 10 discs or fewer
  target_found = 0;
  max_nums_to_use = Math.min(nums_list.length, 10);
  for (j = 0; j < 2 ** max_nums_to_use; j++) {
    j_bin = j.toString(2);
    this_sum = 0;
    this_set = [];
    for (k = 0; k < nums_list.length; k++) {
      if (j_bin[k] == 1) {
        this_sum += nums_list[k];
        this_set.push(nums_list[k])
      }
    }
    if (this_sum == target_num) {
      target_found = 1;
      solution_set = this_set;
      break;
    }
  }
  if (target_found == 1) {
    new_target_num_needed = 0;
  }
  // Verify that the found solution set really is in refreshed nums_list
  if (solution_set.length > 0) {
    get_nums_list;
    for (i = 0; i < solution_set.length; i++) {
      this_solution_num = solution_set[i];
      if (!nums_list.includes(this_solution_num)) {
        new_target_num_needed = 1;
      }
    }
  }
  if (solution_set.length == 0) {
    new_target_num_needed = 1;
  }
}

function calculate_acceleration_make_sounds() {
  for (i = 0; i < discs.length; i++) {
    this_disc = discs[i];
    if (this_disc != null) {
      accel_x = this_disc.vel.x - this_disc.previous_vel_x;
      accel_y = this_disc.vel.y - this_disc.previous_vel_y;
      abs_accel = Math.abs(accel_x) + Math.abs(accel_y);
      // text(Math.round(10*abs_accel)/10,this_disc.x,this_disc.y+20);
      this_disc.previous_vel_x = this_disc.vel.x;
      this_disc.previous_vel_y = this_disc.vel.y;
      // Gravity strength is 10
      // Gravity acceleration per frame is 10/60.
      // Want to detect acceleration that isn't gravity
      if (abs_accel > 1 && Math.abs(60 * accel_y - 10) > 0.1 &&
        !drop_sound.isPlaying()) {
        drop_sound.setVolume(abs_accel / 10);
        drop_sound.play();
      }
    }
  }
}

function preload() {  // Free sounds from PixaBay
  soundFormats('mp3');
  correct_sound = loadSound('Sounds/correct.mp3')
  wrong_sound = loadSound('Sounds/wrong.mp3');
  wrong_sound.setVolume(0.3);
  click_sound = loadSound('Sounds/click.mp3');
  click_sound.setVolume(0.4);
  quiet_click_sound = loadSound('Sounds/click.mp3');
  quiet_click_sound.setVolume(0.05);
  pop_sound = loadSound('Sounds/pop.mp3');
  pop_sound.setVolume(0.4);
  drop_sound = loadSound('Sounds/drop.mp3');
  drop_sound.setVolume(0.4);
  fanfare_sound = loadSound('Sounds/fanfare.mp3');
  sad_trombone_sound = loadSound('Sounds/sad_trombone.mp3');
  gold_color = loadImage('Images/gold.png');
  green_color = loadImage('Images/light_green.png');
  jade_color = loadImage('Images/jade.png');
  grey_color = loadImage('Images/light_grey.png');
  pink_color = loadImage('Images/light_pink.png');
  red_color = loadImage('Images/light_red.png');
  sea_color = loadImage('Images/light_sea.png');
  sky_color = loadImage('Images/light_sky.png');
  purple_color = loadImage('Images/light_purple.png');
  tan_color = loadImage('Images/tan.png');
  lavender_color = loadImage('Images/lavender.png');
  danger_strip = loadImage('Images/danger.jpg')
  // fanfare_sound.setVolume(0.4);
  // music = createAudio('assets/Thats_Mathematics_smaller_file_quieter.mp3')
  // music.loop();
}

function setup() {
  new Canvas(xmax, ymax);
  world.gravity.y = 10;

  box = new Sprite([
    [1, 1],
    [xmax, 1],
    [xmax, ymax - below_box_buffer],
    [1, ymax - below_box_buffer],
    [1, 1]
  ]);
  box.collider = 'static';
  box.shape = 'chain';
  box.color = 'black';
  // box.strokeWeight = 1;

  discs = new Group();
  discs.diameter = disc_diam;
  discs.mass = 1;
  discs.is_selected = 0;
  discs.selection_time = 0;
  discs.previous_vel_x = 0;
  discs.previous_vel_y = 0;
  discs.rotationLock = true;
  discs.friction = 0;

  submit_button = makeSquircle(xmax / 2, ymax / 2, 150, 40, 'Submit');
  submit_button.width = 150;
  submit_button.height = 40;
  submit_button.textSize = 25;
  submit_button.text = 'Submit';
  submit_button.y = ymax - below_box_buffer
    + submit_button.height / 2 + 4;
  submit_button.color = 'cyan';
  submit_button.stroke = 'black';
  submit_button.visible = false;
  submit_button.overlaps(discs);

  can_press_space_button = new Group();
  can_press_space_button.width = 70;
  can_press_space_button.height = 10;
  can_press_space_button.textSize = 10;
  can_press_space_button.text = 'Can also hit spacebar to submit';
  can_press_space_button.textColor = 'black';
  can_press_space_button.color = 'white';
  can_press_space_button.stroke = 'white';
  can_press_space_button.collider = 'static';
  can_press_space_button.x = xmax / 2;
  can_press_space_button.y = ymax - 40;
  new can_press_space_button.Sprite();
  can_press_space_button.visible = false;
  can_press_space_button.overlaps(discs);

  danger_line = new Sprite();
  danger_line.collider = 'static';
  danger_line.color = 'white';
  danger_line.stroke = 'black';
  danger_line.x = xmax / 2;
  danger_line.y = 150;
  danger_line.width = xmax;
  danger_line.height = 15;
  danger_line.textSize = 30;
  danger_line.image = danger_strip;
  //danger_line.text = '⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️';
  danger_line.overlaps(discs);

  game_over_button = makeSquircle(xmax / 2, ymax / 2, 200, 150, 'Game over!');
  game_over_button.textSize = 25;
  game_over_button.text = 'Game over!\n Click for new game';
  game_over_button.color = 'red';
  game_over_button.overlaps(discs);
  game_over_button.visible = false;
  game_over_button.stroke = 'black';

  level_cleared_sprite = new Group();
  level_cleared_sprite.textSize = 26;
  level_cleared_sprite.text = 'Congrats, level cleared!\n100 bonus points!\nClick here for next level';
  level_cleared_sprite.collider = 'static';
  level_cleared_sprite.width = 330;
  level_cleared_sprite.height = 110;
  level_cleared_sprite.x = xmax / 2;
  level_cleared_sprite.y = 300;
  level_cleared_sprite.color = 'lime';
  level_cleared_sprite.overlaps(discs);

  start_button = makeSquircle(xmax / 2, ymax / 2, 250, 70, 'Start game!');
  start_button.overlaps(discs);

  target_background_button = new Group();
  target_background_button.collider = 'static';
  target_background_button.width = 180;
  target_background_button.height = 40;
  target_background_button.x = 80;
  target_background_button.y = ymax - below_box_buffer + 22;
  target_background_button.color = 'white';
  target_background_button.stroke = 'white';
  target_background_button.overlaps(discs);
  new target_background_button.Sprite();

  hi_score = getItem('hi_score');
  if (typeof (hi_score) != 'number') {
    hi_score = 0;
  }

  toggle_auto_submit_button = new Sprite();
  toggle_auto_submit_button.width = 100;
  toggle_auto_submit_button.height = 40;
  toggle_auto_submit_button.x = 50;
  toggle_auto_submit_button.y = submit_button.y;
  toggle_auto_submit_button.text = 'Toggle\n auto-submit';
  toggle_auto_submit_button.color = 'white';
  toggle_auto_submit_button.stroke = 'black';
  toggle_auto_submit_button.collider = 'static';

  toggle_time_pressure_button = new Sprite();
  toggle_time_pressure_button.width = 100;
  toggle_time_pressure_button.height = 40;
  toggle_time_pressure_button.x = xmax - 50;
  toggle_time_pressure_button.y = submit_button.y;
  toggle_time_pressure_button.text = 'Toggle\n time-pressure';
  toggle_time_pressure_button.color = 'white';
  toggle_time_pressure_button.stroke = 'black';
  toggle_time_pressure_button.collider = 'static';

  confetti = new Group();
  confetti.textSize = 30;
  confetti.text = '🎉';
  confetti.collider = 'dynamic';
  confetti.diameter = 10;
  // confetti.drag = 3;
  confetti.overlaps(discs);
  confetti.overlaps(confetti);
  confetti.overlaps(submit_button);
  confetti.overlaps(can_press_space_button);
  confetti.overlaps(danger_line);
  confetti.overlaps(box);
  confetti.overlaps(target_background_button);
  confetti.overlaps(start_button);
  confetti.overlaps(game_over_button);
  confetti.overlaps(toggle_auto_submit_button);
  confetti.overlaps(toggle_time_pressure_button);
}

function num_to_color(this_num) {
  colorMode(HSB, 100);
  val_range = max_disc_num - min_disc_num;
  this_num_range_proportion = (this_num - min_disc_num) / val_range;
  this_color = color(100 * this_num_range_proportion, 30, 100);
  return this_color;
}

function make_confetti(this_disc) {
  emoji_to_use = emoji_list[Math.floor(random(num_emojis))];
  for (j = 0; j < 6; j++) {
    new_confetti = new confetti.Sprite();
    new_confetti.text = emoji_to_use;
    new_confetti.x = this_disc.x;
    new_confetti.y = this_disc.y;
    new_confetti.vel.x = 5 - random(10);
    new_confetti.vel.y = -random(5);
  }
}

function makeSquircle(xCenter, yCenter, width, height, thisString) {
  numAngleSteps = 3; // 20;
  verticesList = [];
  counter = 0;
  verticesList[counter] = [xCenter + width / 2, yCenter - height / 2];
  counter++;
  verticesList[counter] = [xCenter - width / 2, yCenter - height / 2];
  counter++;
  for (i = 0; i < numAngleSteps + 1; i++) {
    verticesList[counter] =
      [xCenter - width / 2 + height / 2 * Math.cos(i * pi / numAngleSteps + pi / 2),
      yCenter - height / 2 * Math.sin(i * pi / numAngleSteps + pi / 2)];
    counter++;
  }
  verticesList[counter] = [xCenter + width / 2, yCenter + height / 2];
  counter++;
  for (i = 0; i < numAngleSteps; i++) {
    verticesList[counter] =
      [xCenter + width / 2 + height / 2 * Math.cos(i * pi / numAngleSteps - pi / 2),
      yCenter - height / 2 * Math.sin(i * pi / numAngleSteps - pi / 2)];
    counter++;
  }
  verticesList[counter] = [xCenter + width / 2, yCenter - height / 2];
  thisSquircle = new Sprite(verticesList); //Sprite(verticesList);
  // thisSquircle.stroke = 'cyan';
  thisSquircle.color = 'lime';
  thisSquircle.strokeWeight = 4;
  thisSquircle.text = thisString;
  thisSquircle.textSize = 30;
  thisSquircle.textColor = 'black';
  thisSquircle.isSelected = 0;
  thisSquircle.collider = 'static';
  return (thisSquircle);
}

