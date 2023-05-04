// Written by Raj Raizada: rajeev.raizada@gmail.com
// Using libraries p5.play, p5js, lodash and number.js
// Released under Creative Commons license: Attribution-NonCommercial
// https://creativecommons.org/licenses/by-nc/2.0/

// A bunch of the functions are separated off in the
// other file that getted sourced in: block_and_grid_functions.js

// Comment out this next part after use for debugging:

// Find out if on touch screen device.
// Mouse click behaviour will be different
let user_agent_string = navigator.userAgent;
let mobile_regexp = /android|iphone|kindle|ipad/i;
let isMobileDevice = mobile_regexp.test(user_agent_string);
let chromebook_regexp = /CrOS/;
let isChromebook = chromebook_regexp.test(user_agent_string);
// Note: Chromebook touchscreen seems to require different treatment.
// If on a Chromebook, only the trackpad mouse works properly for now.
// Also, touches on Firefox on Android don't seem to register at all!

// Lots of global variables. Yes, I'm new to javascript,
// and this is my unsophisticated way of getting around
// all the weird scope-restrictions that are not at all like
// what I'm used to in Python. Maybe next time I'll write it better...
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
let max_x, max_y, floor_y;
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
let num_categories = 12;
let num_display_types = 2;
let cat_to_val_list; // = _.range(3, 3 + 1 + num_categories);
let cat_to_string_list;
let col_removal_rec = new Array(box_blocks_width).fill(0);
let swaps_remaining, needed_to_clear;
let score = 0;
let show_hint_button, game_over_button, congrats_button;
let help_button, music_button, sound_effects_button;
let sound_button_press_time = 0;
let music_button_press_time = 0;
let music_on = 1;
let music;
let sound_effects_on = 1;
let intro_screen = 1;
let game_has_started = 0;
let level = 0;
let this_level_cleared = 0;
let num_levels = 12;
let levels_cleared_list;
let times_of_levels_list;
let seconds_rounded;
// People don't seem to like levels being locked. 
// Next line prevents that:
let highest_level_unlocked = num_levels;
let fr = 60; // frame-rate, not used at present
let g = 10; // gravity strength
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
let help_shown_time = 0;
hint_start_time = -hint_dur; // Prevent any initial hint on start
let double_digit_anchors = _.range(20, 108, 7);
let random_offsets = Array.from({ length: 13 }, () => Math.floor(Math.random() * 6));
let double_digit_vals = _.zipWith(double_digit_anchors, random_offsets, function(a, b) {
  return a + b;
});
let top_row_categs_sliced;
let show_mathy = 0;
let score_incremented = 0;
let show_new_high_score_confetti = 0;

function draw() {
  // frameRate(fr);
  clear();
  if (intro_screen == 1) {
    show_intro_screen();
  } else {
    if (game_has_started == 0) {
      start_new_level()
    }
    // if (this_level_cleared == 0) {
    main_draw_loop();
    // }
  }
  if (swaps_remaining <= 0) {
    game_over_button = new buttons.Sprite();
    game_over_button.x = (box_blocks_width + 2) * block_size / 2;
    game_over_button.y = (box_blocks_height + 3) * block_size / 2;
    game_over_button.textSize = 24;
    game_over_button.text = 'GAME OVER\nClick for new game';
    game_over_button.width = 3.5 * block_size;
    game_over_button.height = 2 * block_size;
    game_over_button.textColor = 'red';
  }
  check_for_uncleared_overlap();
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
    if (swap_started == 0 && (millis() - t0 > 1000) &&
      this_level_cleared == 0 && swaps_remaining > 0) {
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
  // Check if any buttons are being pressed, and perform appropriate actions
  check_for_button_presses();

  // Check for uncleared overlap bug
  if (block_count > 0 && swaps_remaining > 0 && swap_started == 0) {
    check_for_uncleared_overlap();
  }
}

function check_for_button_presses() {
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
  help_being_pressed = check_for_mouse_click_or_touch(help_button);
  if (help_being_pressed == 1 && (millis() - help_shown_time) > 3000) {
    window.alert('Aim: put equal-value blocks next to each other, to make them explode. To move blocks around, click on two that are next to each other to swap their positions.');
    help_shown_time = millis();
  }
  toggle_music_being_pressed = check_for_mouse_click_or_touch(music_button);
  if (toggle_music_being_pressed == 1 && (millis() - music_button_press_time) > 1000) {
    music_button_press_time = millis();
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
  if (toggle_sound_being_pressed == 1 && (millis() - sound_button_press_time) > 1000) {
    sound_button_press_time = millis();
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
    }
  }
}

function make_text_for_this_level(this_block) {
  category = this_block.category;
  num_display_types = 2;
  // Level 1: addition, small numbers
  if (level == 1) {
    cat_to_val_list = _.range(3, 3 + 1 + num_categories);
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    // if (this_display_type == 0) {
    //  this_text = this_cat_val;
    // } else {
    d = Math.ceil(Math.random() * this_cat_val * 0.6);
    this_text = (this_cat_val - d).toString() + ' + ' + d.toString();
    // }
  }
  // Level 6: addition, double digits
  if (level == 6) {
    cat_to_val_list = double_digit_vals;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    // if (this_display_type == 0) {
    //  this_text = this_cat_val;
    // } else {
    d = Math.ceil(Math.random() * this_cat_val * 0.8);
    this_text = (this_cat_val - d).toString() + ' + ' + d.toString();
    this_block.textSize = 16;
    // }
  }
  // Level 2: subtraction, small numbers
  if (level == 2) {
    cat_to_val_list = _.range(3, 3 + 1 + num_categories);
    num_display_types = 2;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    // if (this_display_type == 0) {
    //   this_text = this_cat_val;
    // } else {
    d = Math.ceil(Math.random() * this_cat_val * 0.7);
    this_text = (this_cat_val + d).toString() + ' - ' + d.toString();
    this_block.textSize = 18;
    // }
  }
  // Level 7: subtraction, double digits
  if (level == 7) {
    cat_to_val_list = double_digit_vals;
    this_display_type = Math.floor(random(num_display_types));
    this_cat_val = cat_to_val_list[category];
    // if (this_display_type == 0) {
    //  this_text = this_cat_val;
    // } else {
    d = Math.ceil(Math.random() * this_cat_val * 0.8);
    this_text = (this_cat_val + d).toString() + ' - ' + d.toString();
    this_block.textSize = 16;
    // }
  }
  // Level 3: multiplication
  if (level == 3) {
    num_display_types = 2;
    cat_to_val_list = [12, 18, 20, 24, 30, 36,
      42, 48, 56, 60, 72, 84, 90, 96];
    this_cat_val = cat_to_val_list[category];
    prime_factors = numbers.prime.factorization(this_cat_val);
    prime_factors = _.shuffle(prime_factors);
    slice_point = 1 + Math.floor(random(prime_factors.length - 1));
    array1 = prime_factors.slice(0, slice_point);
    array2 = prime_factors.slice(slice_point);
    text_part1 = numbers.basic.product(array1);
    text_part2 = numbers.basic.product(array2);
    product_text = text_part1.toString() + '×' + text_part2.toString();
    this_display_type = Math.floor(random(num_display_types));
    this_text = product_text;
  }
  // Level 4: division
  if (level == 4) {
    cat_to_val_list = _.range(2, 2 + 1 + num_categories);
    divisor = 2 + Math.floor(random() * 7);
    this_cat_val = cat_to_val_list[category];
    text_part1 = this_cat_val * divisor;
    text_part2 = divisor;
    quotient_text = text_part1.toString() + ' ÷ ' + text_part2.toString();
    this_text = quotient_text;
    this_block.textSize = 18;
  }
  // Level 5: equivalent fractions and decimals
  if (level == 5) {
    num_display_types = 3;
    cat_to_val_list = [0.05, 0.1, 0.2, 0.25, '0.333…', 0.4, 0.5,
      0.6, '0.666…', 0.75, 0.8, 0.9, 1];
    // Unicode fractions made with https://lights0123.com/fractions/
    cat_to_string_list1 = ['¹⁄₂₀', '⅒', '⅕', '¼', '⅓', '⅖', '½',
      '⅗', '⅔', '¾', '⅘', '⁹⁄₁₀', '⁴⁄₄'];
    cat_to_string_list2 = ['²⁄₄₀', '²⁄₂₀', '³⁄₁₅', '²⁄₈', '³⁄₉', '⁶⁄₁₅', '⁴⁄₈',
      '⁹⁄₁₅', '⁶⁄₉', '⁶⁄₈', '¹²⁄₁₅', '¹⁸⁄₂₀', '⁷⁄₇'];
    this_cat_val = cat_to_val_list[category];
    this_cat_string1 = cat_to_string_list1[category];
    this_cat_string2 = cat_to_string_list2[category];
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
      this_text = this_cat_string2;
      this_block.textSize = 28;
    }
  }
  // Level 8: percentage changes
  if (level == 8) {
    cat_to_val_list = [12, 17, 25, 40, 54, 60,
      80, 90, 120, 180, 72, 48];
    cat_to_string_list1 =
      ['10 +20%', '20 -15%', '20 +25%', '50 -20%', '50 +8%', '50 +20%',
        '100 -20%', '100 -10%', '100 +20%', '200 -10%', '60 +20%', '40 +20%'];
    cat_to_string_list2 =
      ['20 -40%', '10 +70%', '50% of 50', '50% of 80', '60 -10%', '40 +50%',
        '50 +60%', '60 +50%', '150 -20%', '150 +20%', '80 -10%', '60 -20%'];
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
      this_block.textSize = 13;
    }
    if (this_display_type == 2) {
      this_text = this_cat_string2;
      this_block.textSize = 13;
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

function setup() {
  // clearStorage();
  new Canvas(displayWidth, displayHeight);
  world.gravity.y = g; // to_remove
  max_x = min(displayWidth, 800);
  max_y = min(displayHeight, 1300);
  if (isMobileDevice) {
    scale_value = 0.95;
    y_offset = -20;
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
  // number_blocks.stroke = 'coral';
  number_blocks.width = block_size;
  number_blocks.height = block_size;
  number_blocks.bounciness = 0.05;
  number_blocks.mass = 0.1;
  number_blocks.textSize = 20;
  number_blocks.rotationLock = true; // Prevent lopsided blocks

  buttons = new Group();
  buttons.textSize = 15;
  buttons.collider = 'static';
  buttons.width = 2 * block_size;
  buttons.height = 0.35 * block_size;
  buttons.color = 'white';
  buttons.overlaps(number_blocks);

  confetti = new Group();
  confetti.textSize = 30;
  confetti.text = '🎉';
  confetti.collider = 'dynamic';
  confetti.diameter = 10;
  // confetti.drag = 3;
  confetti.overlaps(number_blocks);
  confetti.overlaps(confetti);
  confetti.overlaps(buttons);

  // Try to retrieve highest-level unlocked and hi-score
  // highest_level_unlocked = getItem('highest_level_unlocked');
  // if (typeof (highest_level_unlocked) != 'number') {
  //   highest_level_unlocked = 1;
  // }
  hi_score = getItem('hi_score');
  if (typeof (hi_score) != 'number') {
    hi_score = 0;
  }
  // Try to read levels_cleared_list.
  // Null is of type object, and so is array.
  // If we didn't read it yet, then it will be a null object
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
  // text('Double digit vals: ' + double_digit_vals, 20, 100);
  top_row_categs = get_categories_in_top_two_rows();
  // text('Categs in top two rows: ' + top_row_categs, 20, 100);
  text('Top row categs, sliced: ' + top_row_categs_sliced, 20, 120);
  for (i = 0; i < block_count; i++) {
    this_block = number_blocks[i];
    text(this_block.category, this_block.x, this_block.y + 30);
    if (this_block.flag == 1) {
      text('⛳️', this_block.x + 20, this_block.y + 30);
    }
  }
}

function show_intro_screen() {
  if (intro_screen == 1) {
    font_size = 14;
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
    text('Score: ' + score, text_x, y_start + 7 * y_gap);
    text('Your hi-score: ' + hi_score, text_x, y_start + 8 * y_gap);
    text('Points per block = Level.', text_x, y_start + 9 * y_gap);
    text('Mathy matching: ×2 points!', text_x, y_start + 10 * y_gap);
    text('Select a level below:', text_x, y_start + 11 * y_gap);
    text('Your fastest\n      times:', text_x + 243, y_start + 10.5 * y_gap);

    text('Level 1: addition, small numbers', text_x, y_start + 13 * y_gap);
    text('Level 2: subtraction, small numbers', text_x, y_start + 15 * y_gap);
    text('Level 3: multiplication', text_x, y_start + 17 * y_gap);
    text('Level 4: division', text_x, y_start + 19 * y_gap);
    text('Level 5: fractions and decimals', text_x, y_start + 21 * y_gap);
    text('Level 6: addition, double digits', text_x, y_start + 23 * y_gap);
    text('Level 7: subtraction, double digits', text_x, y_start + 25 * y_gap);
    text('Level 8: percentage changes', text_x, y_start + 27 * y_gap);
    text('Level 9: exponents', text_x, y_start + 29 * y_gap);
    text('Level 10: logarithms', text_x, y_start + 31 * y_gap);
    text('Level 11: trigonometry', text_x, y_start + 33 * y_gap);
    text('Level 12: calculus', text_x, y_start + 35 * y_gap);

    textSize(30);
    for (i = highest_level_unlocked; i < num_levels; i++) {
      text('🔒', text_x - 30, y_start + (13 + 2 * i) * y_gap + 5);
    }
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
  // Detect which level is being selected
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
    if (y_start + 30 * y_gap < mouseY && mouseY < y_start + 32 * y_gap) {
      level = 10;
    }
    if (y_start + 32 * y_gap < mouseY && mouseY < y_start + 34 * y_gap) {
      level = 11;
    }
    if (y_start + 34 * y_gap < mouseY && mouseY < y_start + 36 * y_gap) {
      level = 12;
    }

    if (level > highest_level_unlocked) {
      level = 0;
    }
    if (level > 0) {
      intro_screen = 0;
      start_new_level();
    }
  }
}

function start_new_level() {
  t0 = millis();
  swaps_remaining = 14;
  needed_to_clear = 30;
  hints_remaining = 5;
  number_blocks.remove();
  make_box_walls();
  grid0 = make_non_matching_grid_categs();
  fill_grid(grid0);
  update_row_col_recs();
  matching_blocks = check_neighbor_matches();
  game_has_started = 1;
  this_level_cleared = 0;
  hint_happening = 0;
  music.loop();

  show_hint_button = new buttons.Sprite();
  show_hint_button.x = 300;
  show_hint_button.y = 55;
  show_hint_button.text = 'Show hint';
  show_hint_button.textColor = 'blue';

  help_button = new buttons.Sprite();
  help_button.x = 300;
  help_button.y = 15;
  help_button.text = 'How to play';
  help_button.textColor = 'purple';

  music_button = new buttons.Sprite();
  music_button.x = 70;
  music_button.width = 120;
  music_button.y = floor_y + 40;
  if (music_on == 1) {
    music_button.text = 'Turn off 🎵';
    music_button.textColor = 'red';
  } else {
    music_button.text = 'Turn on 🎵';
    music_button.textColor = 'green';
  }

  sound_effects_button = new buttons.Sprite();
  sound_effects_button.x = 270;
  sound_effects_button.y = floor_y + 40;
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

function seconds_to_min_sec_string(seconds) {
  minutes = Math.floor(seconds / 60);
  seconds_mod_mins = Math.floor(seconds - 60 * minutes);
  time_string = String(minutes) + ':' + String(seconds_mod_mins).padStart(2, '0') + 's';
  return (time_string);
}

function show_score_etc() {
  fill('black');
  textFont('Arial')
  textAlign(LEFT);
  textSize(15);
  if (score == hi_score && score > 0) {
    fill('blue');
    text('🎉 Score: ' + score + ' 🎉', 20, 20);
    text('🎉 Hi-score: ' + hi_score + ' 🎉', 20, 40);
    fill('black');
  } else {
    fill('black');
    text('Score: ' + score, 20, 20);
    text('Hi-score: ' + hi_score, 20, 40);
  }

  text('Needed to clear level: ' + needed_to_clear, 20, 60);
  seconds_elapsed = (millis() - t0) / 1000;
  text('Elapsed time: ' + seconds_to_min_sec_string(seconds_elapsed), 20, 100);
  text('Hints remaining: ' + hints_remaining, 235, 83);
  if (swaps_remaining <= 3) {
    fill('red');
  } else {
    fill('black');
  }
  text('Swaps remaining: ' + swaps_remaining, 20, 80);
}

