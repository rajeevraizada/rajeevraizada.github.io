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
      if (horizontal_sep < tol && i != j) {
        if (vertical_sep < (block_size - tol)) {
          // text('Uncleared overlap found',150,100)
          // If overlapping too much, move top block upwards
          if (block_i.y < block_j.y) {
            block_i.vel.y = -(20 - 1.4 * block_i.row);
            block_i.flag = 1;
            // text('Moving up block ' + i,20,100)
          } else {
            block_j.vel.y = -(20 - 1.4 * block_j.row);
            block_j.flag = 1;
            // text('Moving up block ' + j,20,100)
          }
        }
      }
    }
  }
}

function congrats_level_cleared() {
  highest_level_unlocked = Math.max(level + 1, highest_level_unlocked);
  // storeItem('highest_level_unlocked', highest_level_unlocked);
  levels_cleared_list[level - 1] = 1;
  storeItem('levels_cleared_list', levels_cleared_list);
  // Update best time for this level, if currently unset (zero)
  // or it is a longer time
  current_best_time = times_of_levels_list[level - 1];
  if (current_best_time == 0 ||
    (current_best_time != 0 && seconds_rounded < current_best_time)) {
    times_of_levels_list[level - 1] = seconds_rounded;
    storeItem('times_of_levels_list', times_of_levels_list);
  }
  level = min(num_levels, level + 1);
  this_level_cleared = 1;
  new congrats_button.Sprite();
  // if (level >= num_levels) {
  //  congrats_button.text = '🎉 Congrats! Highest level completed! 🎉';
  // }
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
  /*
  // Show hands on two blocks to select
  row_diff = rows_of_smallest_dist_blocks[1] -
    rows_of_smallest_dist_blocks[0];
  col_diff = cols_of_smallest_dist_blocks[1] -
    cols_of_smallest_dist_blocks[0];
  xval0 = col_to_x(cols_of_smallest_dist_blocks[0] + col_diff / 2);
  yval0 = row_to_y(rows_of_smallest_dist_blocks[0] + row_diff / 2);
  textSize(50);
  if (col_diff == 0) {
    yval1 = this_blocky;
    text('🤏', this_blockx, yval0 + 35);
    text('🤏', this_blockx, yval1 + 35);
  } else if (row_diff == 0) {
    xval1 = this_blockx;
    text('🤏', xval0, this_blocky + 35);
    text('🤏', xval1, this_blocky + 35);
  } else {  // Hint blocks in different rows and different cols
    xval0 = col_to_x(cols_of_smallest_dist_blocks[0] + col_diff);
    text('🤏', this_blockx, this_blocky + 35);
    text('🤏', xval0, this_blocky + 35);
  }
  */
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
    // Add a big "MATHY!" confetti if user-generated swap,
    // i.e. if swap_start_time was recent
    // and if the matching blocks have different text
    if ((millis() - swap_start_time) < 3 * swap_dur &&
      (number_blocks[matching_blocks[0]].text !=
        number_blocks[matching_blocks[1]].text)) {
      show_mathy = 1;
    } else {
      show_mathy = 0;
    }
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
        // Double points if did math-based matching
        if (show_mathy == 1) {
          // Only one block gets counted as mathy,
          // so need to give three-times points! 1+3 = 2*2
          score += 3 * level;
        } else {
          score += level;
        }
        for (j = 0; j < 4; j++) {
          new_confetti = new confetti.Sprite();
          new_confetti.text = emoji_to_use;
          new_confetti.x = this_block.x;
          new_confetti.y = this_block.y;
          new_confetti.vel.x = 5 - random(10);
          new_confetti.vel.y = -random(2);
        }
        if (show_mathy == 1) {
          new_mathy = new confetti.Sprite();
          new_mathy.diameter = 1;
          new_mathy.color = 'white';
          new_mathy.text = '🎉MATHY!🎉';
          r = random(255); g = 50 + random(100); b = 100 + random(150);
          new_mathy.textColor = color(r, g, b);
          new_mathy.textSize = 70;
          new_mathy.x = this_block.x;
          new_mathy.y = this_block.y;
          new_mathy.vel.x = 0.5 - random();
          new_mathy.vel.y = -3 - random(2);
          show_mathy = 0;
        }
        this_block.remove();
        needed_to_clear -= 1;
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
    score_incremented = 1;
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

function add_new_block_above(x, y) {
  new_block = new number_blocks.Sprite();
  new_block.x = x;
  new_block.y = y;
  new_block.textSize = 20;
  // Let's make it so that new blocks don't match top-row categories
  top_row_categs = get_categories_in_top_two_rows();
  // Ok, let's allow a bit of top row matching, 
  // because the chain reactions are fun.
  if (top_row_categs.length > 4) {
    top_row_categs_sliced = top_row_categs.slice(0, 4);
  } else {
    top_row_categs_sliced = top_row_categs;
  }
  available_categs = _.difference(_.range(num_categories), top_row_categs_sliced);
  shuffled_available = _.shuffle(available_categs);
  new_block.category = shuffled_available[0];
  // new_block.category = Math.ceil(Math.random() * num_categories);
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
        new_cell = Math.floor(random(num_categories));
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
  this_y = floor_y - block_size * (this_row + 1 / 2) - wall_thickness / 2;
  return this_y;
}

function x_to_col(this_x) {
  this_col = round((this_x - left_wall.x) / block_size - 1 / 2);
  return this_col;
}

function y_to_row(this_y) {
  this_row = round((floor_y - this_y) / block_size - 1 / 2);
  return this_row;
}

function make_box_walls() {
  left_wall = new Sprite();
  left_wall.collider = 'static';
  left_wall.width = wall_thickness;
  left_wall.height = box_blocks_height * block_size;
  left_wall.color = 'blue';
  left_wall.overlaps(confetti);
  left_wall.x = scale_value * max_x / 2 - block_size * box_blocks_width / 2
    - gap * box_blocks_width / 2 - wall_thickness;
  left_wall.y = scale_value * max_y / 2 + y_offset;

  right_wall = new Sprite();
  right_wall.collider = 'static';
  right_wall.width = wall_thickness;
  right_wall.height = box_blocks_height * block_size;
  right_wall.color = 'blue';
  right_wall.overlaps(confetti);
  right_wall.x = scale_value * max_x / 2 + block_size * box_blocks_width / 2
    + gap * (box_blocks_width - 1) / 2 + wall_thickness;
  right_wall.height = box_blocks_height * block_size;
  right_wall.y = scale_value * max_y / 2 + y_offset;

  floor_block = new Group();
  floor_block.collider = 'static';
  floor_block.overlaps(confetti);
  floor_block.width = right_wall.x - left_wall.x + wall_thickness;
  floor_block.height = wall_thickness;
  floor_block.color = 'blue';
  floor_y = scale_value*max_y/2 + block_size*box_blocks_height/2 + y_offset;
  floor_block1 = new floor_block.Sprite();
  floor_block1.x = scale_value * max_x / 2 - gap / 4;
  floor_block1.y = floor_y;  
  // Reinforce the floor
  floor_block2 = new floor_block.Sprite();
  floor_block2.x = floor_block1.x;
  floor_block2.y = floor_y + wall_thickness;
  floor_block2.visible = false;
  floor_block3 = new floor_block.Sprite();
  floor_block3.x = floor_block1.x;
  floor_block3.y = floor_y + 2*wall_thickness;
  floor_block3.visible = false;
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

function get_categories_in_top_two_rows() {
  categs_list_ij = [];
  top_two_rows = [box_blocks_height - 2, box_blocks_height - 1];
  for (ii = 0; ii < 2; ii++) {
    row_i = top_two_rows[ii];
    for (jj = 0; jj < box_blocks_width; jj++) {
      this_block_ind_ij = look_for_block_at(row_i, jj);
      if (this_block_ind_ij != null) {
        this_block_ij = number_blocks[this_block_ind_ij];
        if (this_block_ij != null) {
          this_categ_ij = this_block_ij.category;
          categs_list_ij.push(this_categ_ij);
        }
      }
    }
  }
  unique_list_ij = _.uniq(categs_list_ij);
  return unique_list_ij;
}
