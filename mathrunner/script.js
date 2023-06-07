// Find out if on touch screen device.
// Mouse click behaviour will be different
let user_agent_string = navigator.userAgent;
let mobile_regexp = /android|iphone|kindle|ipad/i;
let isMobileDevice = mobile_regexp.test(user_agent_string);
// let isMobileDevice = 1; // to_remove
let chromebook_regexp = /CrOS/;
let isChromebook = chromebook_regexp.test(user_agent_string);
// Click on a desktop seems to last longer than screen touch event
let tap_dur_thresh;
if (isMobileDevice) {
  tap_dur_thresh = 150;
} else {
  tap_dur_thresh = 500;
}
// Note: Chromebook touchscreen seems to require different treatment.
// If on a Chromebook, only the trackpad mouse works properly for now.
// Also, touches on Firefox on Android don't seem to register at all!

let puppy_step = 2.5;
let jump_vel = -7;
let level = 0;
let lives_remaining = 5;
let num_target_blocks = 5;
let num_targets_left_to_find = num_target_blocks;
let num_levels = 8;
let intro_screen = 1;
let game_has_started = 0;
let mouse_has_been_pressed = 0;
let game_paused = 0;
let game_over = 0;
let this_level_cleared = 0;

let puppy_animation, puppy;
let target_hit_sound, wrong_sound, click_sound;
let jump_sound, running_sound;
let diff_history_length = 6;
let stop_thresh = diff_history_length * 5;
let swipe_thresh = diff_history_length * 15;
let mouse_xdiff_history = new Array(diff_history_length).fill(0);
let puppy_direction = 0;
let running_sound_playing = 0;
let running_sound_start_time = 0;
let mouse_down_or_touch = 0;
let left_x_min = 150;
let right_x_max = 200;
let floor_block_xsize = 40;
let floor_block_ysize = 20;
let floor_baseline_y = 350;
let step_height = floor_block_ysize * 1.8;
let puppy_x0 = 100;
let puppy_y0 = 200;
let terrain_length = 500;
let num_blocks_per_feature = 7;
let num_terrain_features = terrain_length / num_blocks_per_feature;
let terrain = new Array(terrain_length).fill(floor_baseline_y);
let terrain_x_start = -300;
let score = 0;
let number_block_xsize = 80;
let number_block_ysize = 0.6 * number_block_xsize;
let num_categories = 12;
let blocks_categ_list;
let display_types_not_to_use;
let good_emoji_list = ['😎', '🤩', '🤠', '🐯', '🦊', '👑', '🦁',
  '🐶', '🦄', '🦋', '🐙', '🤪', '🌈', '🍔', '🧁', '🍨', '😁',
  '🥇', '🎸', '🚀', '💰', '💎', '🧸', '🎁', '😺', '💩'];
let num_good_emojis = good_emoji_list.length;
let bad_emoji_list = ['😱', '☠️', '🙀'];
let num_bad_emojis = bad_emoji_list.length;
let message_colour;
let double_digit_anchors = _.range(20, 108, 7);
let random_offsets = Array.from({ length: 13 }, () => Math.floor(Math.random() * 6));
let double_digit_vals = _.zipWith(double_digit_anchors, random_offsets, function(a, b) {
  return a + b;
});
let puppy_categ_text_list = [];
let superscript_list = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
let subscript_list = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
let levels_cleared_list;
let times_of_levels_list;
let seconds_elapsed;
let this_text, click_start_time, hi_score;
let pause_button_press_time = 0;
let paused_button;
let show_hint_button, game_over_button, congrats_button;
let help_button, music_button, sound_effects_button;
// let sound_button_press_time = 0;
// let music_button_press_time = 0;
let button_press_time = 0;
let help_shown_time = 0;
let music_on = 1;
let music;
let sound_effects_on = 1;
let touch_has_ended = 1;
let y_gap, y_start;

function draw() {
  clear();
  if (intro_screen == 1) {
    show_intro_screen();
  }
  if (intro_screen == 0) {
    if (game_has_started == 0) {
      clear();
      start_new_level();
    }
    if (game_paused == 0 && game_over == 0 && this_level_cleared == 0) {
      main_draw_loop();
    }
  }
  // Let the matching process complete and let level get cleared
  // before announcing game over
  if (lives_remaining <= 0 && game_over == 0) {
    game_over_button = new message_button.Sprite();
    game_over_button.text = 'GAME OVER\nClick for new game';
    game_over = 1;
  }
  // Check if any buttons are being pressed, and perform appropriate actions
  if (intro_screen == 0) {
    check_for_button_presses();
  }
}

function main_draw_loop() {
  check_for_swipes();
  make_puppy_run_or_stand();
  show_score_etc();
  scroll_terrain();
  check_for_number_block_collisions();
  // Check to see if level has been passed
  if (num_targets_left_to_find <= 0 && this_level_cleared == 0) {
    congrats_level_cleared();
  }
  textSize(24);
  text(puppy.display_text, puppy.x - 20, puppy.y - 40);
}

function preload() {  // Free sounds from PixaBay
  run_anim = loadAnimation('assets/puppy_sprite_sheet_smaller.png',
    { frameSize: [93, 75], frames: 6 });
  stand_anim = loadAnimation('assets/puppy_stand.png',
    { frameSize: [93, 75], frames: 1 });
  soundFormats('mp3');
  target_hit_sound = loadSound('assets/collectcoin-6075.mp3')
  // bad_hit_sound = loadSound('assets/error-when-entering-the-game-menu-132111.mp3')
  // bad_hit_sound.setVolume(0.5);
  running_sound = loadSound('assets/running_sound_040.mp3');
  running_sound.setVolume(0.5);
  jump_sound = loadSound('assets/boing.mp3');
  jump_sound.setVolume(0.15);
  wrong_sound = loadSound('assets/wrong.mp3');
  wrong_sound.setVolume(0.3);
  click_sound = loadSound('assets/click.mp3');
  click_sound.setVolume(0.4);
  music = createAudio('assets/Thats_Mathematics_smaller_file_quieter.mp3')
  // music.loop();
}

function setup() {
  new Canvas(displayWidth, displayHeight);
  world.gravity.y = 8;

  floor_blocks = new Group();
  floor_blocks.collider = 'static';
  floor_blocks.width = floor_block_xsize;
  floor_blocks.height = floor_block_ysize;
  floor_blocks.bounciness = 0;
  floor_blocks.friction = 0.1;

  number_blocks = new Group();
  number_blocks.collider = 'dynamic';
  number_blocks.color = 'white';
  number_blocks.width = number_block_xsize;
  number_blocks.height = number_block_ysize;
  number_blocks.textSize = 16;
  number_blocks.rotationDrag = 20;
  // number_blocks.rotationLock = true; // Prevent lopsided blocks

  buttons = new Group();
  buttons.textSize = 15;
  buttons.collider = 'static';
  buttons.width = 2 * number_block_xsize;
  buttons.height = 0.35 * number_block_xsize;
  buttons.color = 'white';
  buttons.overlaps(number_blocks);

  confetti = new Group();
  confetti.textSize = 30;
  confetti.text = '🎉';
  confetti.collider = 'dynamic';
  confetti.diameter = 10;
  // confetti.drag = 3;
  confetti.overlaps(number_blocks);
  confetti.overlaps(floor_blocks);
  confetti.overlaps(confetti);
  confetti.overlaps(buttons);
  // confetti.overlaps(puppy);

  message_button = new Group();
  message_button.x = 2.5 * number_block_xsize;
  message_button.y = 3 * number_block_xsize;
  message_button.textSize = 24;
  message_button.width = 3.5 * number_block_xsize;
  message_button.height = 2 * number_block_xsize;
  message_button.textColor = 'red';
  message_button.color = 'white';
  message_button.collider = 'static';

  hi_score = getItem('hi_score');
  if (typeof (hi_score) != 'number') {
    hi_score = 0;
  }
  levels_cleared_list = getItem('levels_cleared_list');
  if (levels_cleared_list == null &&
    typeof (levels_cleared_list) == 'object') {
    levels_cleared_list = new Array(num_levels).fill(0);
  }
  // Same for times_of_levels_list
  times_of_levels_list = getItem('times_of_levels_list');
  if (times_of_levels_list == null &&
    typeof (times_of_levels_list) == 'object') {
    times_of_levels_list = new Array(num_levels).fill(0);
  }
}

function make_terrain_number_blocks_and_puppy() {
  puppy = new Sprite(puppy_x0, puppy_y0);
  puppy.diameter = 40;
  puppy.addAni('run', run_anim);
  puppy.addAni('stand', stand_anim);
  puppy.anis.frameDelay = 5;
  puppy.bounciness = 0;
  puppy.rotationLock = true;
  // puppy.debug = true;
  puppy.allowSleeping = false;
  puppy.course_x = puppy_x0;
  puppy.x_offset = 0;
  puppy.category = Math.floor(random(num_categories));
  puppy.this_is_not_the_puppy = false;
  puppy.display_text = make_text_for_this_level(puppy);
  puppy_categ_text_list.push(puppy.display_text);
  puppy.overlaps(confetti);

  // We will have a num_target_blocks target blocks,
  // and then one each of all the other categories
  targets_list = new Array(num_target_blocks - 1).fill(puppy.category);
  categ_list = _.range(num_categories);
  combined_list = targets_list.concat(categ_list);
  blocks_categ_list = _.shuffle(combined_list);
  // Landscape types: flat 0, hill +1, valley -1, gap -2
  // First, put in left wall
  let x = terrain_x_start;
  let y = floor_baseline_y;
  for (i = 0; i < 6; i++) {
    this_floor_block = new floor_blocks.Sprite();
    this_floor_block.x = x;
    this_floor_block.y = floor_baseline_y - i * floor_block_ysize;
  }
  // Next, put in a random sequence of terrain features
  // and also number blocks when terrain is flat
  number_block_counter = 0;
  for (i = 0; i < num_terrain_features; i++) {
    terrain_random_num = random();
    if (terrain_random_num <= 0.5) {
      // Make a flat section
      // Also, put a number block in middle of flat section
      for (j = 0; j < num_blocks_per_feature; j++) {
        y = floor_baseline_y;
        terrain[i * num_blocks_per_feature + j] = y;
        if (i > 1 && j == 4 && number_block_counter < blocks_categ_list.length) {
          new_block = new number_blocks.Sprite();
          new_block.x = terrain_x_start +
            (i * num_blocks_per_feature + j) * floor_block_xsize;
          new_block.y = puppy_y0;
          new_block.textSize = 20;
          new_block.category = blocks_categ_list[number_block_counter];
          new_block.text = make_text_for_this_level(new_block);
          number_block_counter += 1;
        }
      }
    }
    if (i > 1 && terrain_random_num > 0.5 && terrain_random_num <= 0.75) {
      // Make a valley
      for (j = 0; j < num_blocks_per_feature; j++) {
        if (j < num_blocks_per_feature / 2) { y += step_height; }
        if (j >= num_blocks_per_feature / 2) { y -= step_height; }
        terrain[i * num_blocks_per_feature + j] = y;
      }
      y -= step_height;  // Get back to baseline height
    }
    if (i > 1 && terrain_random_num > 0.75) {
      starting_y = y.valueOf();
      for (j = 0; j < num_blocks_per_feature; j++) {
        if (abs(j - num_blocks_per_feature / 2) < 2) {
          y = starting_y + 50;
        } else {
          y = starting_y;
        }
        terrain[i * num_blocks_per_feature + j] = y;
      }
    }
  } // End of loop through terrain features
  // Now make the blocks
  total_num_blocks = num_blocks_per_feature * num_terrain_features;
  x = terrain_x_start;
  for (i = 0; i < total_num_blocks; i++) {
    this_floor_block = new floor_blocks.Sprite();
    this_floor_block.x = x;
    this_floor_block.y = terrain[i];
    // this_floor_block.text = x;
    x += floor_block_xsize;
  }

}

function check_for_number_block_collisions() {
  if (puppy.colliding(number_blocks)) {
    for (i = 0; i < number_blocks.length; i++) {
      this_block = number_blocks[i];
      if (puppy.colliding(this_block)) {
        if (this_block.category == puppy.category) {
          emoji_to_use = good_emoji_list[Math.floor(random(num_good_emojis))];
          message = emoji_to_use + ' Match! ' + emoji_to_use;
          message = message + '\n' + puppy.display_text + ' = ' + this_block.text;
          message = message + '\n' + '🎯 ' + String(num_targets_left_to_find - 1) + ' targets left to find 🎯';
          message_colour = 'blue';
          make_new_text_confetti(message);
          this_block.remove();
          if (sound_effects_on == 1) {
            target_hit_sound.play();
          }
          num_targets_left_to_find -= 1;
          score += 100;
          if (score > hi_score) {
            hi_score = score;
            storeItem('hi_score', hi_score);
          }
        } else {
          emoji_to_use = bad_emoji_list[Math.floor(random(num_bad_emojis))];
          message = emoji_to_use + ' Not equal! ' + emoji_to_use;
          message = message + '\n' + puppy.display_text + ' ≠ ' + this_block.text;
          message = message + '\n' + 'One life lost!';
          message_colour = 'red';
          make_new_text_confetti(message);
          this_block.remove();
          if (sound_effects_on == 1) {
            wrong_sound.play();
          }
          lives_remaining -= 1;
        }
      }
    }
  }
}

function scroll_terrain() {
  puppy.course_x = puppy.x + puppy.x_offset;

  // Scroll the floor if we get too close to edge of screen
  if (puppy.x >= right_x_max && puppy_direction == 1) {
    puppy.x_offset += puppy_step;
    puppy.vel.x = 0;
    for (fb = 0; fb < floor_blocks.length; fb++) {
      floor_blocks[fb].x -= puppy_step;
    }
    for (nb = 0; nb < number_blocks.length; nb++) {
      number_blocks[nb].x -= puppy_step;
    }
  }
  if (puppy.x <= left_x_min && puppy_direction == -1) {
    puppy.x_offset -= puppy_step;
    puppy.vel.x = 0;
    for (fb = 0; fb < floor_blocks.length; fb++) {
      floor_blocks[fb].x += puppy_step;
    }
    for (nb = 0; nb < number_blocks.length; nb++) {
      number_blocks[nb].x += puppy_step;
    }
  }
  if (puppy.x > left_x_min && puppy.x < right_x_max) {
    puppy.course_x += puppy_direction * puppy_step;
  }
}

function show_score_etc() {
  textSize(18);
  text('Score: ' + score, 20, 20);
  text('Lives remaining: ', 20, 45);
  for (i = 0; i < lives_remaining; i++) {
    text('❤️', 170 + 20 * i, 47);
  }
  text('Targets left to find: ', 20, 70);
  for (i = 0; i < num_targets_left_to_find; i++) {
    text('🎯', 170 + 20 * i, 70);
  }
  seconds_elapsed = (millis() - t0) / 1000;
  text('Elapsed time: ' + seconds_to_min_sec_string(seconds_elapsed), 20, 95);
  // text('click_start_time: ' + Math.round(click_start_time), 20, 120);
  // text('puppy.course_x: ' + Math.round(puppy.course_x), puppy.x - 50, puppy.y - 50);
}

function make_puppy_run_or_stand() {
  if (puppy_direction == 1) {
    puppy.ani = 'run';
    puppy.mirror.x = false;
    if (puppy.x < right_x_max) {
      puppy.vel.x = puppy_step;
    }
  }
  if (puppy_direction == -1) {
    puppy.ani = 'run';
    puppy.mirror.x = true;
    if (puppy.x > left_x_min) {
      puppy.vel.x = -puppy_step;
    }
  }
  if (puppy_direction == 0) {
    puppy.ani = 'stand';
    puppy.vel.x = 0;
  }
  if (puppy_direction != 0 && running_sound_playing == 0 &&
    puppy.colliding(floor_blocks)) {
    if (sound_effects_on == 1) {
      running_sound.play();
    }
    running_sound_start_time = millis();
    running_sound_playing = 1;
  }
  if (millis() - running_sound_start_time > 400) {
    running_sound_playing = 0;
  }
}

function check_for_swipes() {
  // Update the mouse ydiff history. Remove first element, and add current val to end
  // Only count swipes if mouse is in bottom half of screen
  this_mouse_xdiff = mouseX - pmouseX
  mouse_xdiff_history = mouse_xdiff_history.slice(1)
  mouse_xdiff_history.push(this_mouse_xdiff)

  if (puppy_direction == 1 &&
    _.sum(mouse_xdiff_history) < -stop_thresh) {
    puppy_direction = 0;
  }
  if (puppy_direction == -1 &&
    _.sum(mouse_xdiff_history) > stop_thresh) {
    puppy_direction = 0;
  }

  if (_.sum(mouse_xdiff_history) > swipe_thresh) {
    puppy_direction = 1;
  }
  if (_.sum(mouse_xdiff_history) < -swipe_thresh) {
    puppy_direction = -1;
  }
}

function mousePressed() {
  if (mouse_has_been_pressed == 0) {
    click_sound.play()
    mouse_has_been_pressed = 1;
  }
  if (intro_screen == 0) {
    if (mouse_down_or_touch == 0) {
      click_start_time = millis();
      mouse_down_or_touch = 1;
    }
  }
  if (intro_screen == 1) {
    click_sound.play();
    detect_level_selection();
  }
}

function mouseReleased() {
  // Make a jump if it's a short touch or click, i.e. a tap
  // and if the puppy is not already in mid-air
  if (millis() - click_start_time < tap_dur_thresh
    && (puppy.colliding(floor_blocks) || puppy.colliding(number_blocks))
  ) {
    puppy.vel.y = jump_vel;
    if (sound_effects_on == 1) {
      jump_sound.play();
    }
  }
  mouse_down_or_touch = 0;
  touch_has_ended = 1;
}

function keyPressed() {
  // We'll allow spacebar also to trigger a jump
  if (keyCode == 32
    && (puppy.colliding(floor_blocks) || puppy.colliding(number_blocks))
    // && puppy.vel.y >= 0
  ) {
    puppy.vel.y = jump_vel;
    if (sound_effects_on == 1) {
      jump_sound.play();
    }
  }
}

function show_intro_screen() {
  if (intro_screen == 1) {
    font_size = 16;
    textSize(font_size);
    text_x = 45;
    y_start = -80; // 20;
    y_gap = 1.2 * font_size;
    textAlign(LEFT);

    fill('white');
    for (i = 0; i < num_levels; i++) {
      rect(text_x - 20, y_start + (12 + 2 * i) * y_gap, 280, 1.5 * y_gap);
    }
    fill('black');

    if (touches.length > 0 && (millis() - button_press_time) > 1000) {
      detect_level_selection();
    }

    text('Score: ' + score, text_x, y_start + 7 * y_gap);
    text('Your hi-score: ' + hi_score, text_x, y_start + 9 * y_gap);
    // text('Points per block = Level.', text_x, y_start + 9 * y_gap);
    // text('Mathy matching: ×2 points!', text_x, y_start + 10 * y_gap);
    text('Select a level below:', text_x, y_start + 11 * y_gap);
    // text('Your fastest\n      times:', text_x + 243, y_start + 10.5 * y_gap);

    text('Level 1: addition, small numbers', text_x, y_start + 13 * y_gap);
    text('Level 2: subtraction, small numbers', text_x, y_start + 15 * y_gap);
    text('Level 3: multiplication', text_x, y_start + 17 * y_gap);
    text('Level 4: division', text_x, y_start + 19 * y_gap);
    text('Level 5: fractions and decimals', text_x, y_start + 21 * y_gap);
    text('Level 6: addition, double digits', text_x, y_start + 23 * y_gap);
    text('Level 7: subtraction, double digits', text_x, y_start + 25 * y_gap);
    text('Level 8: percentage changes', text_x, y_start + 27 * y_gap);
    // text('Level 9: exponents', text_x, y_start + 29 * y_gap);
    // text('Level 10: logarithms', text_x, y_start + 31 * y_gap);
    // text('Level 11: trigonometry', text_x, y_start + 33 * y_gap);
    // text('Level 12: calculus', text_x, y_start + 35 * y_gap);

    textSize(30);
    if (levels_cleared_list != null) {
      // textSize(15);
      // text('levels_cleared_list: ' + levels_cleared_list, 20, 70);
      textSize(35);
      for (i = 0; i < num_levels; i++) {
        if (levels_cleared_list[i] == 1) {
          text('👑', text_x - 40, y_start + (13 + 2 * i) * y_gap + 4);
        }
      }
    }
    if (times_of_levels_list != null) {
      textSize(15);
      for (i = 0; i < num_levels; i++) {
        if (times_of_levels_list[i] != 0 &&
          times_of_levels_list[i] != null) {
          // text(times_of_levels_list[i],
          text(seconds_to_min_sec_string(times_of_levels_list[i]),
            text_x + 265, y_start + (13 + 2 * i) * y_gap);
        }
      }
    }
    // text(times_of_levels_list, 150, 20);
    show_how_to_play();
  } // End of if intro_screen
}

function detect_level_selection() {
  // Detect which level is being selected
  if (intro_screen == 1) {
    if ((y_start + 12 * y_gap < mouseY) && (mouseY < y_start + 14 * y_gap)) {
      level = 1;
    }
    if (y_start + 14 * y_gap < mouseY && mouseY < y_start + 16 * y_gap) {
      level = 2;
    }
    if (y_start + 16 * y_gap < mouseY && mouseY < y_start + 18 * y_gap) {
      level = 3;
    }
    if (y_start + 18 * y_gap < mouseY && mouseY < y_start + 20 * y_gap) {
      level = 4;
    }
    if (y_start + 20 * y_gap < mouseY && mouseY < y_start + 22 * y_gap) {
      level = 5;
    }
    if (y_start + 22 * y_gap < mouseY && mouseY < y_start + 24 * y_gap) {
      level = 6;
    }
    if (y_start + 24 * y_gap < mouseY && mouseY < y_start + 26 * y_gap) {
      level = 7;
    }
    if (y_start + 26 * y_gap < mouseY && mouseY < y_start + 28 * y_gap) {
      level = 8;
    }
    /*
    if (y_start + 28 * y_gap < mouseY && mouseY < y_start + 30 * y_gap) {
      level = 9;
    }
    if (y_start + 30 * y_gap < mouseY && mouseY < y_start + 32 * y_gap) {
      level = 10;
    }
    if (y_start + 32 * y_gap < mouseY && mouseY < y_start + 34 * y_gap) {
      level = 11;
    }
    if (y_start + 34 * y_gap < mouseY && mouseY < y_start + 36 * y_gap) {
      level = 12;
    }
    */
  }
  if (level > 0) {
    intro_screen = 0;
    start_new_level();
  }
}

function make_text_for_this_level(this_block) {
  category = this_block.category;
  num_display_types = 2;
  // Level 1: addition, small numbers
  if (level == 1) {
    cat_to_val_list = _.range(10, 10 + 1 + num_categories);
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    this_text = puppy.display_text;
    while (this_block.this_is_not_the_puppy ||
      this_text == puppy.display_text ||
      puppy_categ_text_list.includes(this_text)) {
      d = Math.ceil(Math.random() * this_cat_val * 0.8);
      this_text = (this_cat_val - d).toString() + ' + ' + d.toString();
    }
    if (this_block.category == puppy.category) {
      puppy_categ_text_list.push(this_text);
    }
  }
  // Level 6: addition, double digits
  if (level == 6) {
    cat_to_val_list = double_digit_vals;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    this_text = puppy.display_text;
    while (this_block.this_is_not_the_puppy ||
      this_text == puppy.display_text ||
      puppy_categ_text_list.includes(this_text)) {
      d = Math.ceil(Math.random() * this_cat_val * 0.8);
      this_text = (this_cat_val - d).toString() + ' + ' + d.toString();
    }
    if (this_block.category == puppy.category) {
      puppy_categ_text_list.push(this_text);
    }
    this_block.textSize = 16;
    // }
  }
  // Level 2: subtraction, small numbers
  if (level == 2) {
    cat_to_val_list = _.range(10, 10 + 1 + num_categories);
    num_display_types = 2;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    this_text = puppy.display_text;
    while (this_block.this_is_not_the_puppy ||
      this_text == puppy.display_text ||
      puppy_categ_text_list.includes(this_text)) {
      d = Math.ceil(Math.random() * this_cat_val * 0.8);
      this_text = (this_cat_val + d).toString() + ' - ' + d.toString();
    }
    this_block.textSize = 18;
  }
  // Level 7: subtraction, double digits
  if (level == 7) {
    cat_to_val_list = double_digit_vals;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    this_text = puppy.display_text;
    while (this_block.this_is_not_the_puppy ||
      this_text == puppy.display_text ||
      puppy_categ_text_list.includes(this_text)) {
      d = Math.ceil(Math.random() * this_cat_val * 0.8);
      this_text = (this_cat_val + d).toString() + ' - ' + d.toString();
    }
    if (this_block.category == puppy.category) {
      puppy_categ_text_list.push(this_text);
    }
    this_block.textSize = 16;
  }
  // Level 3: multiplication
  if (level == 3) {
    num_display_types = 2;
    cat_to_val_list = [36, 48, 60, 72, 80, 84,
      90, 96, 100, 108, 112, 120, 144];
    this_cat_val = cat_to_val_list[category];
    prime_factors = numbers.prime.factorization(this_cat_val);
    prime_factors = _.shuffle(prime_factors);
    this_text = puppy.display_text;
    while (this_block.this_is_not_the_puppy ||
      this_text == puppy.display_text ||
      puppy_categ_text_list.includes(this_text)) {
      slice_point = 1 + Math.floor(random(prime_factors.length - 1));
      array1 = prime_factors.slice(0, slice_point);
      array2 = prime_factors.slice(slice_point);
      text_part1 = numbers.basic.product(array1);
      text_part2 = numbers.basic.product(array2);
      product_text = text_part1.toString() + '×' + text_part2.toString();
      this_text = product_text;
    }
    if (this_block.category == puppy.category &&
      puppy_categ_text_list.length < 4) {
      puppy_categ_text_list.push(this_text);
    }
    this_block.textSize = 18;
  }
  // Level 4: division
  if (level == 4) {
    cat_to_val_list = _.range(2, 2 + 1 + num_categories);
    divisor = 2 + Math.floor(random() * 9);
    this_cat_val = cat_to_val_list[category];
    this_text = puppy.display_text;
    while (this_block.this_is_not_the_puppy ||
      this_text == puppy.display_text ||
      puppy_categ_text_list.includes(this_text)) {
      text_part1 = this_cat_val * divisor;
      text_part2 = divisor;
      quotient_text = text_part1.toString() + ' ÷ ' + text_part2.toString();
      this_text = quotient_text;
    }
    // if (this_block.category == puppy.category // &&
    // puppy_categ_text_list.length < 1) {
    // puppy_categ_text_list.push(this_text);
    // }
    this_block.textSize = 18;
  }
  // Level 5: equivalent fractions and decimals
  if (level == 5) {
    num_display_types = 3;
    cat_to_val_list = [0.025, '0.0333…', 0.05, 0.1, '0.111…', 0.125,
      '0.166…', 0.2, 0.25, '0.333…', 0.5, 1];
    // Unicode fractions made with https://lights0123.com/fractions/
    cat_to_string_list1 = ['¹⁄₄₀', '¹⁄₃₀', '¹⁄₂₀', '⅒', '⅑', '⅛',
      '⅙', '⅕', '¼', '⅓', '½', '¹⁄₁'];
    numerator_list = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    denom_list = [40, 30, 20, 10, 9, 8, 6, 5, 4, 3, 2, 1];
    this_cat_val = cat_to_val_list[category];
    this_cat_string1 = cat_to_string_list1[category];
    this_text = puppy.display_text;
    while (this_block.this_is_not_the_puppy ||
      this_text == puppy.display_text ||
      puppy_categ_text_list.includes(this_text)) {
      this_display_type = Math.floor(random(num_display_types));
      if (this_display_type == 0) {
        this_text = this_cat_val;
        this_block.textSize = 18;
      }
      if (this_display_type == 1) {
        this_text = this_cat_string1;
        this_block.textSize = 28;
      }
      if (this_display_type == 2) {
        multiplier = 1 + Math.ceil(random(6));
        this_numerator = multiplier * numerator_list[category];
        this_denom = multiplier * denom_list[category];
        this_text = frac_to_string(this_numerator, this_denom);
        this_block.textSize = 28;
      }
    }
    if (this_block.category == puppy.category &&
      puppy_categ_text_list.length < 4) {
      puppy_categ_text_list.push(this_text);
    }
    // Next line is for debugging
    // this_text += '\n' + this_cat_val + '\n' + category;
  }
  // Level 8: percentage changes
  if (level == 8) {
    cat_to_val_list = [25, 40, 50, 60, 80, 100,
      120, 150, 200, 240, 300, 400];
    cat_to_string_list1 =
      ['20 +20%', '20 +100%', '40 +25%', '50 +20%', '40 +100%', '80 +20%',
        '100 +20%', '100 +50%', '100 +100%', '200 +20%', '250 +20%', '200 +100%'];
    cat_to_string_list2 =
      ['10 +150%', '10 +300%', '20 +150%', '40 +50%', '20 +300%', '50 +100%',
        '80 +50%', '75 +100%', '160 +25%', '160 +50%', '200 +100%', '320 +25%'];
    cat_to_string_list3 =
      ['50 -50%', '50 -20%', '100 -50%', '80 -25%', '100 -20%', '125 -20%',
        '150 -20%', '200 -25%', '250 -20%', '300 -20%', '500 -40%', '500 -20%'];
    cat_to_string_list4 =
      ['100 -75%', '80 -50%', '200 -75%', '75 -20%', '160 -50%', '200 -100%',
        '200 -40%', '250 -40%', '400 -50%', '400 -40%', '400 -25%', '800 -50%'];
    cat_to_string_list5 =
      ['50% of 50', '80% of 50', '20% of 250', '75% of 80', '50% of 160', '80% of 125',
        '75% of 160', '75% of 200', '80% of 250', '80% of 300', '75% of 400', '80% of 500'];
    num_display_types = 6;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 20;
    }
    if (this_display_type == 1) {
      this_text = cat_to_string_list1[category];
      this_block.textSize = 14;
    }
    if (this_display_type == 2) {
      this_text = cat_to_string_list2[category];
      this_block.textSize = 14;
    }
    if (this_display_type == 3) {
      this_text = cat_to_string_list3[category];
      this_block.textSize = 14;
    }
    if (this_display_type == 4) {
      this_text = cat_to_string_list4[category];
      this_block.textSize = 14;
    }
    if (this_display_type == 5) {
      this_text = cat_to_string_list5[category];
      this_block.textSize = 14;
    }
  }
  // Level 9: exponents
  if (level == 9) {
    cat_to_val_list = ['⅑', '⅛', '⅕', '1', '¼', '√5',
      '∛8', '4', '8', '3', '5', '3√3'];
    cat_to_string_list1 =
      ['3⁻²', '2⁻³', '5⁻¹', '7⁰', '(½)²', '5¹ᐟ²',
        '2', '8²ᐟ³', '2³', '9¹ᐟ²', '(⅕)⁻¹', '27¹ᐟ²'];
    cat_to_string_list2 =
      ['3 × 3⁻³', '2² × 2⁻⁵', '5³ ÷ 5⁴', '3¹ × 3⁻¹', '2 × 2⁻³', '25¹ᐟ⁴',
        '16¹ᐟ⁴', '16¹ᐟ²', '2⁻² × 2⁵', '(√3)²', '125¹ᐟ³', '3³ᐟ²'];
    num_display_types = 3;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    this_cat_string1 = cat_to_string_list1[category];
    this_cat_string2 = cat_to_string_list2[category];
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 20;
    }
    if (this_display_type == 1) {
      this_text = this_cat_string1;
      this_block.textSize = 20;
    }
    if (this_display_type == 2) {
      this_text = this_cat_string2;
      this_block.textSize = 17;
    }
  }
  // Level 10: logs
  if (level == 10) {
    cat_to_val_list = ['3', '-1', '2', 'log 12', '½',
      'log 3', 'log(3²)', '⅓', '-log 2',
      '1', '-2', '5'];
    cat_to_string_list1 =
      ['log₂8', 'log₃(⅓)', 'ln(e²)', 'log3+log4', 'log₃√3',
        'log6-log2', '2 log 3', 'log₂₇(3)', 'log(½)',
        'ln e', 'log₂(¼)', 'log(10⁵)'];
    cat_to_string_list2 =
      ['log₃27', 'log₂(½)', 'log₇(7²)', 'log2+log6', 'log₄2',
        'log9-log3', '4 log√3', 'log₈2', 'log(2⁻¹)',
        'log₃3', 'log₃(⅑)', 'log₂32'];
    num_display_types = 3;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    this_cat_string1 = cat_to_string_list1[category];
    this_cat_string2 = cat_to_string_list2[category];
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 15;
    }
    if (this_display_type == 1) {
      this_text = this_cat_string1;
      this_block.textSize = 14;
    }
    if (this_display_type == 2) {
      this_text = this_cat_string2;
      this_block.textSize = 14;
    }
  }
  // Level 11: trig
  if (level == 11) {
    cat_to_val_list = [
      'sin 𝜋', 'cos 0', 'cos(𝜋/3)', 'sin(𝜋/3)', 'sin(𝜋/4)',
      '𝜋 rads', 'sin(3𝜋/2)', 'cos(2𝜋/3)', 'sin(5𝜋/3)', 'sin(5𝜋/4)',
      '2𝜋 rads', '𝜋/2 rads'];
    cat_to_string_list1 = [
      'sin 2𝜋', 'sin(𝜋/2)', 'sin(𝜋/6)', 'cos(𝜋/6)', 'cos(𝜋/4)',
      '-𝜋 rads', 'cos 𝜋', 'sin(7𝜋/6)', 'cos(7𝜋/6)', 'cos(5𝜋/4)',
      '2𝜋 rads', '𝜋/2 rads'];
    cat_to_string_list2 =
      ['0', '1', '½', '√3 /2', '√2 /2',
        '180°', '-1', '-½', '-√3 /2', '-√2 /2',
        '-2𝜋 rads', 'sin⁻¹(1)'];
    num_display_types = 3;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    this_cat_string1 = cat_to_string_list1[category];
    this_cat_string2 = cat_to_string_list2[category];
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 14;
    }
    if (this_display_type == 1) {
      this_text = this_cat_string1;
      this_block.textSize = 14;
    }
    if (this_display_type == 2) {
      this_text = this_cat_string2;
      this_block.textSize = 16;
    }
  }
  // Level 12: calculus
  if (level == 12) {
    cat_to_val_list = [
      'd/dx x²', 'd/dx x³', 'd/dx ¹⁄ₓ', 'd/dx ln x', 'd/dx eˣ',
      'd/dx sin x', 'd/dx cos x', 'd/dx x⁻³', 'd/dx x⁻⁴', 'd/dx x⁴/4!',
      'd/dx 1', 'd/dx x'];
    cat_to_string_list =
      ['2x', '3x²', '-1/x²', '¹⁄ₓ', 'eˣ',
        'cos x', '-sin x', '-3x⁻⁴', '-4x⁻⁵', 'x³/3!',
        '0', '1'];
    num_display_types = 2;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    this_cat_string = cat_to_string_list[category];
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 14;
    } else {
      this_text = this_cat_string;
      this_block.textSize = 16;
    }
  }
  return this_text;
}

function frac_to_string(numerator, denom) {
  frac_string = '';
  if (numerator < 10) {
    frac_string += superscript_list[numerator];
  } else {
    tens_val = Math.floor(numerator / 10);
    units_val = numerator % 10;
    frac_string += superscript_list[tens_val] + superscript_list[units_val];
  }
  frac_string += '⁄';
  if (denom < 10) {
    frac_string += subscript_list[denom];
  }
  if (denom >= 10 && denom < 100) {
    tens_val = Math.floor(denom / 10);
    units_val = denom % 10;
    frac_string += subscript_list[tens_val] + subscript_list[units_val];
  }
  if (denom >= 100) {
    hundreds_val = Math.floor(denom / 100);
    tens_val = Math.floor((denom % 100) / 10);
    units_val = denom % 10;
    frac_string += subscript_list[hundreds_val] +
      subscript_list[tens_val] + subscript_list[units_val];
  }
  return frac_string;
}

function make_confetti() {
  emoji_to_use = emoji_list[Math.floor(random(num_emojis))];
  for (j = 0; j < 6; j++) {
    new_confetti = new confetti.Sprite();
    new_confetti.text = emoji_to_use;
    new_confetti.x = puppy.x;
    new_confetti.y = puppy.y;
    new_confetti.vel.x = 5 - random(10);
    new_confetti.vel.y = -random(2);
  }
}

function make_new_text_confetti(message) {
  // emoji_to_use = emoji_list[Math.floor(random(num_emojis))];
  new_text_confetti = new confetti.Sprite();
  new_text_confetti.diameter = 1;
  new_text_confetti.color = 'white';
  new_text_confetti.stroke = 'white';
  new_text_confetti.text = message;
  new_text_confetti.textColor = message_colour;
  new_text_confetti.textSize = 30;
  new_text_confetti.x = this_block.x;
  new_text_confetti.y = this_block.y;
  new_text_confetti.vel.x = 0.5 - random();
  new_text_confetti.vel.y = -7 - random(2);
}

function start_new_level() {
  t0 = millis();
  // level = 0;
  lives_remaining = 5;
  num_target_blocks = 5;
  num_targets_left_to_find = num_target_blocks;
  game_has_started = 1;
  this_level_cleared = 0;
  game_over = 0;
  puppy_categ_text_list = [];
  make_terrain_number_blocks_and_puppy();

  if (music_on == 1) {
    music.loop();
  }

  help_button = new buttons.Sprite();
  help_button.x = 70;
  help_button.y = floor_baseline_y + 300;
  help_button.width = 120;
  help_button.text = 'How to play';
  help_button.textColor = 'purple';

  music_button = new buttons.Sprite();
  music_button.x = 70;
  music_button.width = 120;
  music_button.y = floor_baseline_y + 250;
  if (music_on == 1) {
    music_button.text = 'Turn off 🎵';
    music_button.textColor = 'red';
  } else {
    music_button.text = 'Turn on 🎵';
    music_button.textColor = 'green';
  }

  sound_effects_button = new buttons.Sprite();
  sound_effects_button.x = 270;
  sound_effects_button.y = floor_baseline_y + 250;
  sound_effects_button.width = 210;
  if (sound_effects_on == 1) {
    sound_effects_button.text = ' Turn off sound effects 🔊';
    sound_effects_button.textColor = 'red';
  } else {
    sound_effects_button.text = ' Turn on sound effects 🔊';
    sound_effects_button.textColor = 'green';
  }

  if (game_over_button != null) {
    game_over_button.remove();
  }
  if (congrats_button != null) {
    congrats_button.remove();
  }
}

function show_how_to_play() {
  textSize(14);
  y_text_start = 500;
  text('Collect matching blocks, but jump over non-matching ones.', 20, y_text_start)
  text('Swipe left or right to move puppy.', 20, y_text_start + 20);
  text('Tap screen, click mouse or press space to jump.', 20, y_text_start + 40);
  text('A short swipe opposite to running direction stops it.', 20, y_text_start + 60);
  text('Puppy can be swiped left or right in mid-jump!', 20, y_text_start + 80);
  text('That is useful for jumping over a block you are close to!', 20, y_text_start + 100);

}

function congrats_level_cleared() {
  this_level_cleared = 1;
  congrats_button = new message_button.Sprite();
  congrats_button.textSize = 18;
  congrats_button.textColor = 'blue';
  if (levels_cleared_list[level - 1] == 0) {
    congrats_button.text =
      '👑 Congrats! 👑\nFirst time clearing this level!\nClick here for next level';
  } else {
    congrats_button.text = '🎉 Congrats! 🎉\nClick here for next level';
  }
  levels_cleared_list[level - 1] = 1;
  storeItem('levels_cleared_list', levels_cleared_list);
  // Update best time for this level, if currently unset (zero)
  // or it is a longer time
  current_best_time = times_of_levels_list[level - 1];
  if (current_best_time == 0 ||
    (current_best_time != 0 && seconds_elapsed < current_best_time)) {
    times_of_levels_list[level - 1] = Math.round(seconds_elapsed);
    storeItem('times_of_levels_list', times_of_levels_list);
  }
  // level = min(num_levels, level + 1);
  if (current_best_time != 0 &&
    seconds_elapsed < current_best_time) {
    congrats_button.text =
      '🎉 Congrats! 🎉\nFastest time for this level!\nClick here for next level';
  }
}

function check_for_button_presses() {
  help_being_pressed = check_for_mouse_click_or_touch(help_button);
  if (help_being_pressed == 1 && (millis() - help_shown_time) > 3000) {
    window.alert('Collect matching blocks, but jump over non-matching ones.\n\nSwipe left or right to make puppy run.\n\nA short swipe opposite to running direction stops it.\n\nTap screen, click mouse or press space to jump.\n\nPuppy can be swiped left or right in mid-jump, which is useful for jumping over a block you are close to!');
    help_shown_time = millis();
  }
  toggle_music_being_pressed = check_for_mouse_click_or_touch(music_button);
  if (toggle_music_being_pressed == 1 && (millis() - button_press_time) > 1000) {
    button_press_time = millis();
    if (music_on == 0) {
      music_on = 1;
      music_button.text = 'Turn off 🎵';
      music_button.textColor = 'red';
      music.loop();
    } else {
      music_on = 0;
      music_button.text = 'Turn on 🎵';
      music_button.textColor = 'green';
      music.stop();
    }
  }
  toggle_sound_being_pressed = check_for_mouse_click_or_touch(sound_effects_button);
  if (toggle_sound_being_pressed == 1 && (millis() - button_press_time) > 1000) {
    button_press_time = millis();
    if (sound_effects_on == 0) {
      sound_effects_on = 1;
      sound_effects_button.text = ' Turn off sound effects 🔊';
      sound_effects_button.textColor = 'red';
    } else {
      sound_effects_on = 0;
      sound_effects_button.text = ' Turn on sound effects 🔊';
      sound_effects_button.textColor = 'green';
    }
  }
  if (congrats_button != null) {
    congrats_being_pressed = check_for_mouse_click_or_touch(congrats_button);
    if (congrats_being_pressed) {
      this_level_cleared == 1;
      clear();
      allSprites.remove();
      level = 0;
      intro_screen = 1;
      button_press_time = millis();
    }
  }
  if (game_over_button != null) {
    game_over_being_pressed = check_for_mouse_click_or_touch(game_over_button);
    if (game_over_being_pressed) {
      this_level_cleared == 1;
      clear();
      allSprites.remove();
      level = 0;
      score = 0;
      swaps_remaining = 14;
      intro_screen = 1;
      button_press_time = millis();
    }
  }
}

function check_for_mouse_click_or_touch(this_block) {
  selection_action_happening = 0;
  if (isMobileDevice == 0) {  // Normal mouse click
    if (this_block.mouse.pressing()) {
      selection_action_happening = 1;
    }
  }
  else { // Touch screen: no click required. Hover is enough
    if (this_block.mouse.hovering() && touch_has_ended) {
      selection_action_happening = 1;
      // Reset the touch_has_ended var, so that we don't get repeated calls
      touch_has_ended = 0;
    }
  }
  return selection_action_happening;
}

function seconds_to_min_sec_string(seconds) {
  minutes = Math.floor(seconds / 60);
  seconds_mod_mins = Math.floor(seconds - 60 * minutes);
  time_string = String(minutes) + ':' + String(seconds_mod_mins).padStart(2, '0') + 's';
  return time_string;
}

function touchEnded() {
  if (millis() - click_start_time < tap_dur_thresh
    && (puppy.colliding(floor_blocks) || puppy.colliding(number_blocks))
  ) {
    puppy.vel.y = jump_vel;
    if (sound_effects_on == 1) {
      jump_sound.play();
    }
  }
  touch_has_ended = 1;
  mouse_down_or_touch = 0;
}
