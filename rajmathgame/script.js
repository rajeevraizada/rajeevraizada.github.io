// Written by Raj Raizada: rajeev.raizada@gmail.com
// Using libraries p5.play, p5js, lodash and number.js
// Released under Creative Commons license: Attribution-NonCommercial
// https://creativecommons.org/licenses/by-nc/2.0/

// Find out if on touch screen device.
// Mouse click behaviour will be different
let user_agent_string = navigator.userAgent;
let mobile_regexp = /android|iphone|kindle|ipad/i;
let isMobileDevice = mobile_regexp.test(user_agent_string);
let chromebook_regexp = /CrOS/;
let isChromebook = chromebook_regexp.test(user_agent_string);
let floor, left_wall, right_wall, number_blocks, t0;
let new_cell = 0;
let select_time = 0;
let block_size;
let box_blocks_width = 4;
let box_blocks_height = 6;
let max_blocks = box_blocks_width * box_blocks_height;
let wall_thickness = 6;
let gap = 5;
let scale_value;
let motion_thresh = 0.01;
let max_x, max_y;
let y_offset = 100;
let row_rec, col_rec, block_count;
let total_motion = 0;
let selected_blocks = [];
let b1x0, b1y0, b2x0, b2y0; // The two blocks getting swapped
let swap_started = 0;
let swap_dur = 500;
let selected_categs = [];
let first_selection_time = 0;
let touch_has_ended = 1;
let matching_blocks = [];
let match_highlight_started = 0;
let highlight_start_time = 0;
let match_highlight_dur = 500;
let matches_removed = 0;
let bang_sound_playing = 0;
let mouse_has_been_pressed = 0;
let sup1 = String.fromCharCode(0x00B9);
let sup2 = String.fromCharCode(0x00B2);
let sup_slash = String.fromCharCode(0x141F);
let num_categories = 12;
let num_display_types = 2;
let cat_to_val_list; // = _.range(3, 3 + 1 + num_categories);
let cat_to_string_list;
let col_removal_rec = new Array(box_blocks_width).fill(0);
let swaps_remaining, needed_to_clear;
let score = 0;
let show_hint_button, game_over_button, new_game_button;
let intro_screen = 1;
let game_has_started = 0;
let level = 1;
let this_level_cleared = 0;
let num_levels = 9;
// People don't seem to like levels being locked. 
// Next line prevents that:
let highest_level_unlocked = num_levels; 
let fr = 60;
let g = 7; // Math.log(fr);
let emoji_list = ['😎', '🤩', '🤠', '🐯', '🦊', '👑', '🦁',
  '🐶', '🦄', '🦋', '🐙', '🤪', '🌈', '🍔', '🧁', '🍨', '😁',
  '🥇', '🎸', '🎯', '🚀', '💰', '💎', '🧸', '🎁', '😺', '💩'];
let num_emojis = emoji_list.length;
let emoji_to_use;
let blocks_with_this_categ, block_rows, block_cols;
let this_categ_rows, this_categ_cols;
let smallest_dist_so_far;
let rows_of_smallest_dist_blocks, cols_of_smallest_dist_blocks;
let congrats_being_pressed = 0;
let hint_happening = 0;
let hint_dur = 5000;
let hint_start_time;
let hints_remaining;
let hi_score = 0;
hint_start_time = -hint_dur; // Prevent any initial hint on start

function draw() {
  // frameRate(fr);
  clear();
  if (intro_screen == 1) {
    show_intro_screen();
  } else {
    if (game_has_started == 0) {
      start_new_level()
    }
    if (this_level_cleared == 0) {
      main_draw_loop();
    }
    if (congrats_button != null) {
      congrats_being_pressed = check_for_mouse_click_or_touch(congrats_button);
      if (congrats_being_pressed) {
        start_new_level();
      }
    }
  }
}

function main_draw_loop() {
  show_score_etc();

  total_motion = calculate_total_motion();
  block_count = number_blocks.length;
  // show_debug_info();

  // Check for matches, and highlight and swap if matches found
  if (block_count > 0 && swaps_remaining > 0 &&
    total_motion < motion_thresh) {
    update_row_col_recs();
    
    // Don't do any extra highlighting or swapping 
    // or block adding if a swap is already underway.
    // Also, wait for a short time after start of level,
    // to prevent menu-selection from selecting a block
    if (swap_started == 0 && millis() - t0 > 500) {
      check_for_block_selection();
      color_blocks();
      matching_blocks = check_neighbor_matches();
      highlight_matching_blocks();
      show_bangs();
      remove_matching_blocks();
      add_new_blocks();
    }
    if (selected_blocks.length == 2) {
      swap_positions();
    }
  }
  // Check to see if level has been passed
  if (needed_to_clear <= 0 && this_level_cleared == 0) {
    congrats_level_cleared();
  }
  if (swaps_remaining <= 0) {
    new game_over_button.Sprite();
    new new_game_button.Sprite();
    new_game_button.overlaps(game_over_button);
  }
  show_hint_being_pressed = check_for_mouse_click_or_touch(show_hint_button);
  if (show_hint_being_pressed && hint_happening == 0 &&
    hints_remaining > 0) {
    hint_happening = 1;
    hint_start_time = millis();
    hints_remaining -= 1;
  }
  if (millis() - hint_start_time < hint_dur) {
    find_matching_pair_for_hint();
  } else {
    hint_happening = 0;
  }
  if (new_game_button != null) {
    new_game_being_pressed = check_for_mouse_click_or_touch(new_game_button);
    if (new_game_being_pressed) {
      score = 0;
      start_new_level();
      // intro_screen = 1;
      // show_intro_screen();

    }
  }
  // Check for uncleared overlap bug
  if (block_count>0 && swaps_remaining>0 && swap_started==0 ) {    
    check_for_uncleared_overlap();
  }
}

function check_for_uncleared_overlap() {
  textSize(15);
  // text('Checking for uncleared overlap',20,100)
  block_count = number_blocks.length
  // The p5play physics engine doesn't seem to detect
  // uncleared overlap in some cases. It looks like
  // we need to bypass the collision and overlap functions,
  // and build our own manual checking.
  for (i = 0; i < block_count; i++) {
    block_i = number_blocks[i]; 
    for (j = 0; j < block_count; j++) {
      block_j = number_blocks[j];   
      // Check how far vertically apart the two blocks are. 
      // Move apart if too close.
      vertical_sep = Math.abs(block_i.y - block_j.y);
      // We only care about vertical sep if in same column,
      // i.e. if horizontal_sep < tol.
      // Also, we want i and j to be different blocks!
      horizontal_sep = Math.abs(block_i.x - block_j.x);      
      tol = 0.1 * block_size;
      if ( horizontal_sep<tol && i!=j ) {
        if ( vertical_sep<(block_size-tol) ) {
          // text('Uncleared overlap found',150,100)
          // If overlapping too much, move top block upwards
          if (block_i.y < block_j.y) {
            block_i.vel.y -= 10;
            block_i.flag = 1;
            text('Moving up block ' + i,20,100)
          } else {
            block_j.vel.y -= 10;
            block_j.flag = 1;
            text('Moving up block ' + j,20,100)
          }
        }  
      }  
    } 
  }
}

function find_matching_pair_for_hint() {
  // Go through all the categories, and find the closest-together
  // pair of blocks that have the same category as each other
  categ_with_smallest_dist = [];
  smallest_dist_so_far = 100;
  inds_of_smallest_dist_blocks = [];
  rows_of_smallest_dist_blocks = [];
  cols_of_smallest_dist_blocks = [];
  for (this_cat = 0; this_cat < num_categories; this_cat++) {
    blocks_with_this_categ = [];
    for (b = 0; b < number_blocks.length; b++) {
      this_block = number_blocks[b];
      if (this_block.category == this_cat) {
        blocks_with_this_categ.push(b);
      }
    }
    num_blocks_this_categ = blocks_with_this_categ.length;
    // If there is more than one block, see how close they are 
    this_categ_rows = [];
    this_categ_cols = [];
    if (num_blocks_this_categ > 0) {
      // text(blocks_with_this_categ,200,40+10*this_cat) // to_remove
      for (n = 0; n < blocks_with_this_categ.length; n++) {
        this_categ_block = number_blocks[blocks_with_this_categ[n]];
        this_categ_rows.push(this_categ_block.row);
        this_categ_cols.push(this_categ_block.col);
      }
      for (j = 0; j < num_blocks_this_categ; j++) {
        for (k = 0; k < num_blocks_this_categ; k++) {
          if (j != k) {
            this_cityblock_dist =
              Math.abs(this_categ_rows[j] - this_categ_rows[k]) +
              Math.abs(this_categ_cols[j] - this_categ_cols[k]);
            if (this_cityblock_dist < smallest_dist_so_far) {
              inds_of_smallest_dist_blocks = [j, k];
              rows_of_smallest_dist_blocks = [this_categ_rows[j], this_categ_rows[k]];
              cols_of_smallest_dist_blocks = [this_categ_cols[j], this_categ_cols[k]];
              smallest_dist_so_far = this_cityblock_dist;
              categ_with_smallest_dist = this_cat;
            }
          }
        }
      } // End of loop through blocks of this cat, getting smallest distance
    }
  } // End of loop through categories. Show the hint markers
  for (i = 0; i < 2; i++) {
    this_blockx = col_to_x(cols_of_smallest_dist_blocks[i]);
    this_blocky = row_to_y(rows_of_smallest_dist_blocks[i]);
    textSize(20);
    text('✅', this_blockx + 12, this_blocky - 17);
  }
}

function show_debug_info() {
  // text('num_categories: ' + num_categories, 20, 80)
  block_count = number_blocks.length
  // text('smallest_dist_so_far: ' + smallest_dist_so_far, 200, 60)
  // text('rows_of_smallest_dist_blocks: ' + rows_of_smallest_dist_blocks, 20, 80)
  // text('cols_of_smallest_dist_blocks: ' + cols_of_smallest_dist_blocks, 20, 100)
  // text('highest_level_unlocked: ' + highest_level_unlocked, 20, 80); //to_remove
  // text('Type: ' + typeof (highest_level_unlocked), 200, 80); // to_remove
  // text('isMobile: ' + isMobileDevice, 20, 100);
  // text('isChromebook: ' + isChromebook, 20, 120);
  // text('Display size: ' + displayWidth + 'x' + displayHeight, 200, 100);

  // text('Gravity ' + round(g, 2), 300, 60)
  // text('Time since selected ' + round((millis()-first_selection_time)/1000, 1), 300, 60)
  for (i = 0; i < block_count; i++) {
    this_block = number_blocks[i];
    // text(this_block.category, this_block.x, this_block.y + 30);
    if (this_block.flag==1) {
      text('⛳️', this_block.x, this_block.y + 30);
    }
  }
}

function congrats_level_cleared() {
  highest_level_unlocked = Math.max(level + 1, highest_level_unlocked);
  // storeItem('highest_level_unlocked', highest_level_unlocked);
  level = min(num_levels, level + 1);
  this_level_cleared = 1;
  new congrats_button.Sprite();
  if (level >= num_levels) {
    congrats_button.text = '🎉 Congrats! Highest level completed! 🎉';
  }
}

function show_intro_screen() {
  if (intro_screen == 1) {
    font_size = 16;
    textSize(font_size);
    text_x = 50;
    y_start = -110; // 20;
    y_gap = 1.2 * font_size;
    textAlign(LEFT);
    // text('Click on neighboring blocks', text_x, y_start);
    // text('to swap their positions.', text_x, y_start + y_gap);
    // text('When blocks with the same value', text_x, y_start + 3 * y_gap);
    // text('touch each other, they explode.', text_x, y_start + 4 * y_gap);
    // text('Goal:', text_x, y_start + 6 * y_gap);
    // text('Complete a level by clearing 100 blocks', text_x, y_start + 7 * y_gap);
    // text('before you run out of swaps!', text_x, y_start + 8 * y_gap);
    text('Personal hi-score: ' + hi_score, text_x, y_start + 9 * y_gap);
    // text('Highest level unlocked so far: ' + highest_level_unlocked, text_x, y_start + 8 * y_gap);

    // text('Completing a level unlocks the next one.', text_x, y_start + 9 * y_gap);
    text('Select a level below:', text_x, y_start + 11 * y_gap);

    rect(text_x - 20, y_start + 12 * y_gap, 250, 1.5 * y_gap);
    text('Level 1: addition', text_x, y_start + 13 * y_gap);
    rect(text_x - 20, y_start + 14 * y_gap, 250, 1.5 * y_gap);
    text('Level 2: subtraction', text_x, y_start + 15 * y_gap);
    rect(text_x - 20, y_start + 16 * y_gap, 250, 1.5 * y_gap);
    text('Level 3: multiplication', text_x, y_start + 17 * y_gap);
    rect(text_x - 20, y_start + 18 * y_gap, 250, 1.5 * y_gap);
    text('Level 4: fractions and decimals', text_x, y_start + 19 * y_gap);
    rect(text_x - 20, y_start + 20 * y_gap, 250, 1.5 * y_gap);
    text('Level 5: percentage changes', text_x, y_start + 21 * y_gap);
    rect(text_x - 20, y_start + 22 * y_gap, 250, 1.5 * y_gap);
    text('Level 6: exponents', text_x, y_start + 23 * y_gap);
    rect(text_x - 20, y_start + 24 * y_gap, 250, 1.5 * y_gap);
    text('Level 7: logarithms', text_x, y_start + 25 * y_gap);
    rect(text_x - 20, y_start + 26 * y_gap, 250, 1.5 * y_gap);
    text('Level 8: trigonometry', text_x, y_start + 27 * y_gap);
    rect(text_x - 20, y_start + 28 * y_gap, 250, 1.5 * y_gap);
    text('Level 9: calculus', text_x, y_start + 29 * y_gap);

    textSize(30);
    for (i = highest_level_unlocked; i < num_levels; i++) {
      text('🔒', text_x - 30, y_start + (13 + 2 * i) * y_gap + 5);
    }
  } // End of if intro_screen
}

function mousePressed() {
  // This function gets the mouse-press location for 
  // selecting a level on the intro screen.
  // It also helps to get sound to play on iOS
  // by making thr first click play a sound.
  // iOS needs sound-on to be triggered by a user action
  if (mouse_has_been_pressed == 0) {
    click_sound.play()
    mouse_has_been_pressed = 1;
  }
  if (intro_screen == 1) {
    if (y_start + 12 * y_gap < mouseY && mouseY < y_start + 14 * y_gap) {
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
    if (y_start + 28 * y_gap < mouseY && mouseY < y_start + 30 * y_gap) {
      level = 9;
    }
    if (level > highest_level_unlocked) {
      level = 0;
    }
    if (level > 0) {
      intro_screen = 0;
    }
  }
}

function start_new_level() {
  t0 = millis();
  swaps_remaining = 10;  
  needed_to_clear = 30;
  hints_remaining = 3;
  number_blocks.remove();
  make_box_walls();
  grid0 = make_non_matching_grid_categs();
  fill_grid(grid0);
  update_row_col_recs();
  matching_blocks = check_neighbor_matches();
  game_has_started = 1;
  this_level_cleared = 0;
  hint_happening = 0;
  if (show_hint_button != null) {
    new show_hint_button.Sprite();
  }
  if (game_over_button != null) {
    game_over_button.remove();
  }
  if (congrats_button != null) {
    congrats_button.remove();
  }
  if (new_game_button != null) {
    new_game_button.remove();
  }
}

function show_score_etc() {
  fill('black');
  textFont('Arial')
  textAlign(LEFT);
  textSize(15);
  text('Score: ' + score, 20, 20);
  text('Hi-score: ' + hi_score, 20, 40);
  text('Needed to clear level: ' + needed_to_clear, 20, 60);
  text('Hints remaining: ' + hints_remaining, 230, 60);
  if (swaps_remaining <= 3) {
    fill('red');
  } else {
    fill('black');
  }
  text('Swaps remaining: ' + swaps_remaining, 20, 80);
}

function highlight_matching_blocks() {
  // If blocks are matching, start the match highlighting process 
  // if it hasn't already started. Also, record highlight start time
  if (matching_blocks != null && matching_blocks.length > 1 &&
    match_highlight_started == 0) {
    highlight_start_time = millis();
    matches_removed = 0;
    for (i = 0; i < matching_blocks.length; i++) {
      this_block = number_blocks[matching_blocks[i]];
      this_block.color = 'green';
      this_block.color.setAlpha(30);
    }
    match_highlight_started = 1;
  }
}

function show_bangs() {
  // Show bang signs near end of match duration
  if (millis() - highlight_start_time > 0.8 * match_highlight_dur) {
    for (i = 0; i < matching_blocks.length; i++) {
      this_block = number_blocks[matching_blocks[i]];
      this_block.text = '💥';
      this_block.textSize = 80;
    }
  }
}

function remove_matching_blocks() {
  // Stop the match highlighting after its duration
  // and remove the matching blocks.
  // Update the score and needed-to-clear number.
  if (millis() - highlight_start_time > match_highlight_dur &&
    matches_removed == 0 && matching_blocks.length > 1) {
    // Simple approach: use emoji tag as marker of blocks to remove
    col_removal_rec.fill(0);
    emoji_to_use = emoji_list[Math.floor(random(num_emojis))];
    for (i = number_blocks.length - 1; i >= 0; i--) {
      this_block = number_blocks[i];
      if (this_block.text == '💥') {
        col_removal_rec[this_block.col] += 1;
        for (j = 0; j < 4; j++) {
          new_confetti = new confetti.Sprite();
          new_confetti.text = emoji_to_use;
          new_confetti.x = this_block.x;
          new_confetti.y = this_block.y;
          new_confetti.vel.x = 5 - random(10);
          new_confetti.vel.y = -random(2);
        }
        this_block.remove();
        needed_to_clear -= 1;
        score += 10;
        if (score > hi_score) {
          hi_score = score;
          storeItem('hi_score', hi_score);
        }
      }
    }
    pop_sound.play();
    matches_removed = 1;
    match_highlight_started = 0;
    matching_blocks = [];
  }
}

function add_new_blocks() {
  // Add new blocks at the top of cols with blocks removed
  for (i = 0; i < col_removal_rec.length; i++) {
    this_col_removal_count = col_removal_rec[i];
    if (this_col_removal_count > 0) {
      for (j = 0; j < this_col_removal_count; j++) {
        this_x = col_to_x(i);
        this_y = row_to_y(box_blocks_height) - j * block_size;
        add_new_block_above(this_x, this_y)
      }
      col_removal_rec[i] = 0; // Reset removal count for this col
    }
  }
}

function setup() {
  new Canvas(displayWidth, displayHeight);
  world.gravity.y = g; // to_remove
  max_x = min(displayWidth, 800);
  max_y = min(displayHeight, 1300);
  if (isMobileDevice) {
    scale_value = 1;
    y_offset = -50;
  } else {
    scale_value = 0.5;
    y_offset = 120;
  }
  if (isChromebook) {
    scale_value = 0.5;
    y_offset = 150;
  }
  block_size =
    round(min(scale_value * max_x / box_blocks_height,
      scale_value * max_y / box_blocks_width));

  number_blocks = new Group();
  number_blocks.collider = 'dynamic';
  number_blocks.color = 'white';
  number_blocks.width = block_size;
  number_blocks.height = block_size;
  number_blocks.bounciness = 0.05;
  number_blocks.mass = 0.1;
  number_blocks.textSize = 20;
  number_blocks.rotationLock = true; // Prevent lopsided blocks

  show_hint_button = new Group();
  show_hint_button.x = 300;
  show_hint_button.y = 20;
  show_hint_button.textSize = 16;
  show_hint_button.text = 'Show hint';
  show_hint_button.collider = 'static';
  show_hint_button.width = 2 * block_size;
  show_hint_button.height = 0.5 * block_size;
  show_hint_button.color = 'white';
  show_hint_button.textColor = 'blue';
  show_hint_button.overlaps(number_blocks);

  game_over_button = new Group();
  game_over_button.x = (box_blocks_width + 2) * block_size / 2;
  game_over_button.y = (box_blocks_height + 3) * block_size / 2;
  game_over_button.textSize = 28;
  game_over_button.text = 'GAME OVER';
  game_over_button.collider = 'static';
  game_over_button.width = 3.5 * block_size;
  game_over_button.height = 2 * block_size;
  game_over_button.color = 'white';
  game_over_button.textColor = 'red';
  game_over_button.overlaps(number_blocks);
  // game_over_button.overlaps(new_game_button);

  congrats_button = new Group();
  congrats_button.x = (box_blocks_width + 2) * block_size / 2;
  congrats_button.y = (box_blocks_height + 3) * block_size / 2;
  congrats_button.textSize = 14;
  congrats_button.text = '🎉 Congrats! Click for next level 🎉';
  congrats_button.collider = 'static';
  congrats_button.width = 4 * block_size;
  congrats_button.height = 2 * block_size;
  congrats_button.color = 'white';
  congrats_button.textColor = 'blue';
  congrats_button.overlaps(number_blocks);
  // congrats_button.overlaps(game_over_button);
  // congrats_button.overlaps(new_game_button);

  new_game_button = new Group();
  new_game_button.x = (box_blocks_width + 2) * block_size / 2;
  new_game_button.y = (box_blocks_height + 4.2) * block_size / 2;
  new_game_button.textSize = 14;
  new_game_button.text = 'Click here for new game';
  new_game_button.collider = 'static';
  new_game_button.width = 2.9 * block_size;
  new_game_button.height = 0.6 * block_size;
  new_game_button.color = 'white';
  new_game_button.textColor = 'blue';
  new_game_button.overlaps(number_blocks);
  // new_game_button.overlaps(game_over_button);

  confetti = new Group();
  confetti.textSize = 30;
  confetti.text = '🎉';
  confetti.collider = 'dynamic';
  confetti.diameter = 10;
  // confetti.drag = 3;
  confetti.overlaps(number_blocks);
  confetti.overlaps(confetti);
  // confetti.overlaps(game_over_button);

  // Try to retrieve highest-level unlocked and hi-score
  // highest_level_unlocked = getItem('highest_level_unlocked');
  // if (typeof (highest_level_unlocked) != 'number') {
  //   highest_level_unlocked = 1;
  // }
  hi_score = getItem('hi_score');
  if (typeof (hi_score) != 'number') {
    hi_score = 0;
  }
}

function swap_positions() {
  b1 = number_blocks[selected_blocks[0]];
  b2 = number_blocks[selected_blocks[1]];
  if (swap_started == 0) {
    start_swap();
    swap_start_time = millis();
    swap_started = 1;
  }
  swap_proportion = (millis() - swap_start_time) / swap_dur;
  if (swap_proportion <= 1) {
    b1.x = b1x0 + (b2x0 - b1x0) * swap_proportion;
    b1.y = b1y0 + (b2y0 - b1y0) * swap_proportion;
    b2.x = b2x0 + (b1x0 - b2x0) * swap_proportion;
    b2.y = b2y0 + (b1y0 - b2y0) * swap_proportion;
  } else {
    // Unselect the selected blocks, to reset
    selected_blocks = [];
    selected_categs = [];
    swap_started = 0;
    // Set blocks back to non-overlapping and dynamic
    b1.collide(b2);
    b2.collide(b1);
    number_blocks.collider = 'dynamic';
    swaps_remaining -= 1;
  } // End of if (swap_proportion <= 1)
}

function add_new_block_above(x, y) {
  new_block = new number_blocks.Sprite();
  new_block.x = x;
  new_block.y = y;
  new_block.textSize = 20;
  new_block.category = Math.ceil(Math.random() * num_categories);
  new_block.text = make_text_for_this_level(new_block);
  // Turn off any hint, if one is happening
  hint_start_time = millis() - hint_dur;
}

function make_non_matching_grid_categs() {
  // Set up grid of zeros
  grid0 = new Array(box_blocks_height).fill(0);
  for (row = 0; row < box_blocks_height; row++) {
    grid0[row] = new Array(box_blocks_width).fill(0);
  }
  // Next, loop through the grid and pick and repick
  // random categories for each cell until non-matching 
  // with cells below and to the left.
  for (row = 0; row < box_blocks_height; row++) {
    for (col = 0; col < box_blocks_width; col++) {
      text(row + ',' + col, 20, 20)
      this_cell_matches = 1;
      // If in lowest row, don't check below
      // If iin left col, don't check to left
      while (this_cell_matches > 0) {
        new_cell = Math.ceil(random(num_categories));
        if (row == 0 && col == 0) {
          this_cell_matches = 0;
        }
        if (row == 0 && col > 0) {
          this_cell_matches = (new_cell == grid0[row][col - 1]);
        }
        if (row > 0 && col == 0) {
          this_cell_matches = (new_cell == grid0[row - 1][col]);
        }
        if (row > 0 && col > 0) {
          this_cell_matches = (new_cell == grid0[row - 1][col]) +
            (new_cell == grid0[row][col - 1]);
        }
      } // End of while loop. We now have a non-matching cell
      grid0[row][col] = new_cell;
    } // End of loop through cols
  } // End of loop through rows
  return grid0;
}

function make_text_for_this_level(this_block) {
  category = this_block.category;
  num_display_types = 2;
  // Level 1: simple addition
  if (level == 1) {
    cat_to_val_list = _.range(3, 3 + 1 + num_categories);
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    if (this_display_type == 0) {
      this_text = this_cat_val;
    } else {
      d = Math.ceil(Math.random() * this_cat_val * 0.6);
      this_text = (this_cat_val - d).toString() + ' + ' + d.toString();
    }
  }
  // Level 2: subtraction
  if (level == 2) {
    cat_to_val_list = _.range(3, 3 + 1 + num_categories);
    num_display_types = 2;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    if (this_display_type == 0) {
      this_text = this_cat_val;
    } else {
      d = Math.ceil(Math.random() * this_cat_val * 0.6);
      this_text = (this_cat_val + d).toString() + ' - ' + d.toString();
    }
  }
  // Level 3: multiplication
  if (level == 3) {
    num_display_types = 2;
    cat_to_val_list = [12, 15, 20, 21, 30, 35,
      48, 49, 56, 63, 72, 81];
    this_cat_val = cat_to_val_list[category - 1];
    // this_cat_string = cat_to_string_list[category - 1];
    prime_factors = numbers.prime.factorization(this_cat_val);
    slice_point = 1 + Math.floor(random(prime_factors.length - 1));
    array1 = prime_factors.slice(0, slice_point);
    array2 = prime_factors.slice(slice_point);
    text_part1 = numbers.basic.product(array1);
    text_part2 = numbers.basic.product(array2);
    product_text = text_part1.toString() + '×' + text_part2.toString();
    this_display_type = Math.floor(random(num_display_types));
    if (this_display_type == 0) {
      this_text = this_cat_val;
    } else {
      this_text = product_text;
    }
  }
  // Level 4: equivalent fractions and decimals
  if (level == 4) {
    num_display_types = 2;
    cat_to_val_list = [0.1, 0.2, 0.25, '0.333…', 0.4, 0.5,
      0.6, '0.666…', 0.75, 0.8, 0.9, 1];
    // Unicode fractions made with https://lights0123.com/fractions/
    cat_to_string_list1 = ['⅒', '⅕', '¼', '⅓', '⅖', '½',
      '⅗', '⅔', '¾', '⅘', '⁹⁄₁₀', '⁴⁄₄'];
    cat_to_string_list2 = ['²⁄₂₀', '³⁄₁₅', '²⁄₈', '³⁄₉', '⁶⁄₁₅', '⁴⁄₈',
      '⁹⁄₁₅', '⁶⁄₉', '⁶⁄₈', '¹²⁄₁₅', '¹⁸⁄₂₀', '⁷⁄₇'];
    this_cat_val = cat_to_val_list[category - 1];
    this_cat_string1 = cat_to_string_list1[category - 1];
    // this_cat_string2 = cat_to_string_list2[category - 1];
    this_display_type = Math.floor(random(num_display_types));
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 18;
    }
    if (this_display_type == 1) {
      this_text = this_cat_string1;
      this_block.textSize = 28;
    }
    // if (this_display_type == 2) {
    //  this_text = this_cat_string2;
    //  this_block.textSize = 28;
    // }
  }
  // Level 5: percentage changes
  if (level == 5) {
    cat_to_val_list = [12, 17, 23, 40, 55, 60,
      80, 95, 110, 190, 206, 220];
    cat_to_string_list =
      ['10 +20%', '20 -15%', '20 +15%', '50 -20%', '50 +10%', '50 +20%',
        '100 -20%', '100 -5%', '100 +10%', '200 -5%', '200 +3%', '200 +10%'];
    num_display_types = 2;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category - 1];
    this_cat_string = cat_to_string_list[category - 1];
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 20;
    } else {
      this_text = this_cat_string;
      this_block.textSize = 14;
    }
  }
  // Level 6: exponents
  if (level == 6) {
    cat_to_val_list = ['⅑', '⅛', '⅕', '1', '¼', '√5',
      '∛8', '4', '8', '3', '5', '3√3'];
    cat_to_string_list =
      ['3⁻²', '2⁻³', '5⁻¹', '7⁰', '(½)²', '5¹ᐟ²',
        '2', '8²ᐟ³', '2³', '9¹ᐟ²', '(⅕)⁻¹', '27¹ᐟ²'];
    num_display_types = 2;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category - 1];
    this_cat_string = cat_to_string_list[category - 1];
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 20;
    } else {
      this_text = this_cat_string;
      this_block.textSize = 20;
    }
  }
  // Level 7: logs
  if (level == 7) {
    cat_to_val_list = ['3', '-1', '2', 'log 15', '½',
      'log 3', 'log(3²)', '⅓', '-log 2',
      '1', '-2', '5'];
    cat_to_string_list =
      ['log₂8', 'log₃(⅓)', 'ln(e²)', 'log3+log5', 'log₃√3',
        'log6-log2', '2 log 3', 'log₂₇(3)', 'log(½)',
        'ln e', 'log₂(¼)', 'log(10⁵)'];
    num_display_types = 2;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category - 1];
    this_cat_string = cat_to_string_list[category - 1];
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 15;
    } else {
      this_text = this_cat_string;
      this_block.textSize = 15;
    }
  }
  // Level 8: trig
  if (level == 8) {
    cat_to_val_list = [
      'sin 𝜋', 'cos 0', 'cos(𝜋/3)', 'sin(𝜋/3)', 'sin(𝜋/4)',
      '𝜋 rads', 'sin(3𝜋/2)', 'cos(2𝜋/3)', 'sin(5𝜋/3)', 'sin(5𝜋/4)',
      '2𝜋 rads', '𝜋/2 rads'];
    cat_to_string_list =
      ['0', '1', '½', '√3 /2', '√2 /2',
        '180°', '-1', '-½', '-√3 /2', '-√2 /2',
        '360°', '90°'];
    num_display_types = 2;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category - 1];
    this_cat_string = cat_to_string_list[category - 1];
    if (this_display_type == 0) {
      this_text = this_cat_val;
      this_block.textSize = 14;
    } else {
      this_text = this_cat_string;
      this_block.textSize = 16;
    }
  }
  // Level 9: calculus
  if (level == 9) {
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
    this_cat_val = cat_to_val_list[category - 1];
    this_cat_string = cat_to_string_list[category - 1];
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

function fill_grid(grid0) {
  counter = 0;
  for (row = 0; row < box_blocks_height; row++) {
    for (col = 0; col < box_blocks_width; col++) {
      this_block = new number_blocks.Sprite();
      this_block.x = col_to_x(col);
      this_block.y = row_to_y(row);
      this_block.textSize = 20;
      this_block.category = grid0[row][col];
      this_block.text = make_text_for_this_level(this_block);
      counter++;
    }
  }
}

function preload() {
  soundFormats('mp3');
  click_sound = loadSound('Sounds/click.mp3');
  click_sound.setVolume(0.4);
  // bang_sound = loadSound('Sounds/crash.mp3');
  // bang_sound.setVolume(0.5);
  // falling_sound = loadSound('Sounds/falling.mp3');
  sliding_sound = loadSound('Sounds/rolling.mp3');
  // sliding_sound .setVolume(0.4);
  wrong_sound = loadSound('Sounds/wrong.mp3');
  wrong_sound.setVolume(0.3);
  pop_sound = loadSound('Sounds/pop.mp3');
}

function start_swap() {
  // If we just copy plain numbers, they shouldn't change
  b1x0 = b1.x.valueOf();
  b1y0 = b1.y.valueOf();
  b2x0 = b2.x.valueOf();
  b2y0 = b2.y.valueOf();
  // Allow these two blocks to overlap each other
  b1.overlaps(b2);
  b2.overlaps(b1);
  // Temporarily make number_blocks static
  number_blocks.collider = 'static';
  sliding_sound.play();
}

function check_for_block_selection() {
  block_count = number_blocks.length;
  for (i = 0; i < block_count; i++) {
    this_block = number_blocks[i];
    if (swap_started == 0) {
      selection_action_happening = check_for_mouse_click_or_touch(this_block);
    }
    if (selection_action_happening) {
      // Turn off any hint, if one is happening
      hint_start_time = millis() - hint_dur;
      // If this is the first selection, always accept it
      if (selected_categs.length == 0 &&
        millis() - first_selection_time > 500) {
        selected_blocks.push(i);
        selected_categs.push(this_block.category);
        first_selection_time = millis();
        click_sound.play();
      } else {
        // If not first selection...
        // If this block is already selected,
        // and if not recently selected, unselect it
        if (selected_blocks.length == 1 &&
          _.includes(selected_blocks, i) &&
          millis() - first_selection_time > 500) {
          selected_blocks = []; // Unselected this block
          selected_categs = [];  // Unselect this category
          this_block.color = 'white';
          this_block.color.setAlpha(0);
          first_selection_time = millis();
        }
        // Otherwise, check that we only have
        // one previous block, and that new one is different.
        // Then check if they are adjacent
        selections_are_adjacent = 0;
        if ((selected_blocks.length > 0) &&
          !_.includes(selected_blocks, i)) {
          // Ok, now check if selections are adjacent
          selections_are_adjacent = check_if_adjacent(selected_blocks);
          if (selections_are_adjacent) {
            selected_blocks.push(i);
            selected_categs.push(this_block.category);
            click_sound.play();
          } else {
            // Wiggle an invalidly selected non-adjacent block
            // Do a smaller jump if on higher row
            this_block.vel.y = this_block.row - box_blocks_height;
            wrong_sound.play();
          }
        } // End of if checking for adjacency
      } // End of else for when selected_blocks.length != 0
    } // End of if (selection_action_happening)
  } // End of loop through blocks
}

function check_if_adjacent(selected_blocks) {
  selections_are_adjacent = 0;
  first_selected_block = number_blocks[selected_blocks[0]];
  first_selected_row = y_to_row(first_selected_block.y);
  first_selected_col = x_to_col(first_selected_block.x);
  new_row = y_to_row(this_block.y);
  new_col = x_to_col(this_block.x);
  // Check for adjacency. Sum of abs diffs must be 1
  adjacency_categ = abs(first_selected_row - new_row) +
    abs(first_selected_col - new_col);
  if (adjacency_categ == 1) {
    selections_are_adjacent = 1;
  } else {
    selections_are_adjacent = 0;
  }
  return selections_are_adjacent;
}

function color_blocks() {
  // Colour selected blocks orange and red
  for (i = 0; i < block_count; i++) {
    this_block = number_blocks[i];
    if (i == selected_blocks[0]) {
      this_block.color = 'orange';
      this_block.color.setAlpha(150);
      select_time = millis();
    } if (i == selected_blocks[1]) {
      this_block.color = 'red';
      this_block.strokeWeight = 1;
      this_block.color.setAlpha(150);
    } else {
      if ((millis() - select_time > 200) &&
        (millis() - highlight_start_time > match_highlight_dur)) {
        this_block.color = 'white';
        this_block.color.setAlpha(0);
      }
    }
  } // End of loop through coloring the blocks
}

function check_for_mouse_click_or_touch(this_block) {
  selection_action_happening = 0;
  if (isMobileDevice == 0) {  // Normal mouse click
    if (this_block.mouse.pressing()) {
      selection_action_happening = 1;
    }
  } else { // Touch screeen mobile: no click required
    if (touches.length > 0 && touch_has_ended) {
      if (_.inRange(touches[0].x, this_block.x - block_size / 2, this_block.x + block_size / 2) &&
        _.inRange(touches[0].y, this_block.y - block_size / 2, this_block.y + block_size / 2)) {
        selection_action_happening = 1;
        // Reset the touch_has_ended var, so that we don't get repeated calls
        touch_has_ended = 0;
      }
    }
  }
  return selection_action_happening;
}

function touchEnded() {
  touch_has_ended = 1;
}

function update_row_col_recs() {
  block_count = number_blocks.length
  row_rec = new Array(max_blocks).fill(-1);
  col_rec = new Array(max_blocks).fill(-1);
  for (i = block_count - 1; i >= 0; i--) {
    this_block = number_blocks[i];
    this_col = x_to_col(this_block.x);
    this_row = y_to_row(this_block.y);
    this_block.col = this_col;
    this_block.row = this_row;
    row_rec[i] = this_row;
    col_rec[i] = this_col;
    // to_remove
    // text(this_block.category,this_block.x,this_block.y+30)
  }
}

function check_neighbor_matches() {
  matching_blocks = [];
  textSize(14);
  for (row = 0; row < box_blocks_height; row++) {
    for (col = 0; col < box_blocks_width; col++) {
      // First, check if a block is here
      starting_block_ind = look_for_block_at(row, col);
      // If we have a block in this row,col slot,
      // check for blocks above and to the right
      if (starting_block_ind != null) {
        this_block = number_blocks[starting_block_ind];
        if (this_block != null) {
          this_block_categ = this_block.category;
          // text(this_block_categ,this_block.x-30,this_block.y-20) // to_remove
          // Now that all those checks passed ok,
          // we can check for above and right blocks
          above_block_ind = look_for_block_at(row + 1, col);
          if (above_block_ind != null) {
            above_block = number_blocks[above_block_ind];
            if (above_block != null) {
              above_block_categ = above_block.category;
              above_block_text = above_block.text;
              // text(above_block_categ +'⬆️',this_block.x+10,this_block.y-20) // to_remove
              if (above_block_categ == this_block_categ) {
                matching_blocks.push(starting_block_ind);
                matching_blocks.push(above_block_ind);
              }
            }
          }
          block_to_right_ind = look_for_block_at(row, col + 1);
          if (block_to_right_ind != null) {
            block_to_right = number_blocks[block_to_right_ind];
            if (block_to_right != null) {
              block_to_right_categ = block_to_right.category;
              block_to_right_text = block_to_right.text;
              // text(block_to_right_categ +'➡️',this_block.x+10,this_block.y+30) // to_remove
              if (block_to_right_categ == this_block_categ) {
                matching_blocks.push(starting_block_ind);
                matching_blocks.push(block_to_right_ind);
              }
            }
          } // End of checking block to right
        }
      } // End of if (starting_block_ind != null)
    } // End of loop through cols
  } // End of loop through rows
  // text('Matching blocks: ' + matching_blocks,20,60)
  return _.uniq(matching_blocks);
  // return matching_blocks
}

function calculate_total_motion() {
  block_count = number_blocks.length
  motion_tally = 0
  if (block_count > 0) {
    for (i = 0; i < block_count; i++) {
      this_block = number_blocks[i];
      motion_tally += abs(this_block.vel.x) +
        abs(this_block.vel.y);
    }
  }
  return motion_tally;
}

function col_to_x(this_col) {
  this_x = left_wall.x + gap * (this_col + 1) +
    block_size * (this_col + 1 / 2) + wall_thickness / 2;
  return this_x;
}

function row_to_y(this_row) {
  this_y = floor.y - block_size * (this_row + 1 / 2) - wall_thickness / 2;
  return this_y;
}

function x_to_col(this_x) {
  this_col = round((this_x - left_wall.x) / block_size - 1 / 2);
  return this_col;
}

function y_to_row(this_y) {
  this_row = round((floor.y - this_y) / block_size - 1 / 2);
  return this_row;
}

function make_box_walls() {
  left_wall = new Sprite();
  left_wall.collider = 'static';
  left_wall.width = wall_thickness;
  left_wall.height = box_blocks_height * block_size;
  left_wall.color = 'black';
  left_wall.overlaps(confetti);
  left_wall.x = scale_value * max_x / 2 - block_size * box_blocks_width / 2
    - gap * box_blocks_width / 2 - wall_thickness;
  left_wall.y = scale_value * max_y / 2 + y_offset;

  right_wall = new Sprite();
  right_wall.collider = 'static';
  right_wall.width = wall_thickness;
  right_wall.height = box_blocks_height * block_size;
  right_wall.color = 'black';
  right_wall.overlaps(confetti);
  right_wall.x = scale_value * max_x / 2 + block_size * box_blocks_width / 2
    + gap * (box_blocks_width - 1) / 2 + wall_thickness;
  right_wall.height = box_blocks_height * block_size;
  right_wall.y = scale_value * max_y / 2 + y_offset;

  floor = new Sprite();
  floor.collider = 'static';
  floor.overlaps(confetti);
  floor.width = right_wall.x - left_wall.x + wall_thickness;
  floor.height = wall_thickness;
  floor.color = 'black'
  floor.x = scale_value * max_x / 2 - gap / 4;
  floor.y = scale_value * max_y / 2 + block_size * box_blocks_height / 2 + y_offset;
}

function look_for_block_at(row, col) {
  matching_block_ind = [];
  // Apply the test x==row to every row_rec element.
  // If it is true, enter index value. Otherwise enter -1.
  row_matches = row_rec.map((x, index) => (x == row) ? index : -1);
  row_matches_filtered = row_matches.filter(x => (x > -1));
  col_matches = col_rec.map((x, index) => (x == col) ? index : -1);
  col_matches_filtered = col_matches.filter(x => (x > -1));

  if (row_matches_filtered != null && col_matches_filtered != null) {
    row_col_match =
      _.intersection(row_matches_filtered, col_matches_filtered);

    if (row_col_match != null) {
      matching_block_ind = row_col_match;
    }
  }
  return matching_block_ind;
}