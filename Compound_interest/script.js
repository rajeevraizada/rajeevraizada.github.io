let xMax = Math.min(window.innerWidth, 500);
let yMax = Math.min(window.innerHeight, 1000);
let screenNum = 0;
let fontSize = 15;
let topMargin = 40;
let lineSpacing = 1.5 * fontSize;
let pi = Math.PI;
let vertices, counter;
let A0, A1, A2, checkButton;
let correctSelection = 0;
let checkButtonPressTime = 0;
let correctAnswerSubmitted = 0;
let somethingIsSelected = 0;

function setup() {
  new Canvas(xMax, yMax);

  A0 = makeSquircle(xMax / 6, 0.75 * yMax, 65, 50, 'Answer 1');
  A1 = makeSquircle(xMax / 2, 0.75 * yMax, 65, 50, 'Answer 2');
  A2 = makeSquircle(5 * xMax / 6, 0.75 * yMax, 65, 50, 'Answer 3');
  checkButton = makeSquircle(xMax / 2, 0.85 * yMax, 250, 40, 'Select an answer to check');
  checkButton.color = 'DarkSlateGray';

  graphSprite = new Sprite();
  graphSprite.img = 'Images/graph.png';
  graphSprite.y = 170;
  graphSprite.visible = false;
}

function draw() {
  background('black');

  showScreenContent(screenNum);
  checkForAnswerSelection();
  // text(screenNum, 20, 30);
}

function showScreenContent(screenNum) {
  textFont('Arial');
  // textStyle(BOLD);

  if (screenNum == 0) {
    fill('lime');
    textAlign(CENTER);
    textSize(1.3 * fontSize);
    text("Let's learn about compound interest!", xMax / 2, topMargin);
    textSize(fontSize);
    textAlign(LEFT);
    fill('white');
    text("'Interest' is the rate your money grows.", xMax / 14, topMargin + 2 * lineSpacing);
    text("'Compound' means that the new money grows too!", xMax / 14, topMargin + 3 * lineSpacing);
    text("Let's take a closer look.", xMax / 14, topMargin + 5 * lineSpacing);
    text("Bea starts with $200 in her bank account.", xMax / 14, topMargin + 7 * lineSpacing);
    text("It earns 10% interest per year.", xMax / 14, topMargin + 8 * lineSpacing);
    fill('lime');
    text("How much money will Bea have after 1 year?", xMax / 14, topMargin + 10 * lineSpacing);
    A0.text = '$210';
    A1.text = '$220';
    A2.text = '$240';
    correctSelection = 1;
  }

  if (screenNum == 1) {
    fill('lime');
    textAlign(CENTER);
    textSize(1.3 * fontSize);
    text("The magic of compound interest", xMax / 2, topMargin);
    textSize(fontSize);
    textAlign(LEFT);
    fill('white');
    text("The great thing about compound interest is this:", xMax / 14, topMargin + 2 * lineSpacing);
    text("the money that you earned in interest will also", xMax / 14, topMargin + 3 * lineSpacing);
    text("earn interest itself!", xMax / 14, topMargin + 4 * lineSpacing);
    text("After 1 year, Bea has $220 in her bank account.", xMax / 14, topMargin + 6 * lineSpacing);
    text("In the next year, all of that $220 earns 10% interest.", xMax / 14, topMargin + 7 * lineSpacing);
    fill('lime');
    text("How much money will Bea have after 2 years?", xMax / 14, topMargin + 9 * lineSpacing);
    A0.text = '$230';
    A1.text = '$240';
    A2.text = '$242';
    correctSelection = 2;
  }

  if (screenNum == 2) {
    fill('lime');
    textAlign(CENTER);
    textSize(1.3 * fontSize);
    text("The more you have, the more you get!", xMax / 2, topMargin);
    textSize(fontSize);
    textAlign(LEFT);
    fill('white');
    text("Bea starts with $200 in her account.", xMax / 14, topMargin + 2 * lineSpacing);
    text("10% interest on $200 is ¹⁰⁄₁₀₀ × $200.", xMax / 14, topMargin + 3 * lineSpacing);
    text("That is ⅒ × $200, which makes $20.", xMax / 14, topMargin + 4 * lineSpacing);
    text("So, she gets $20 interest, making $220 after 1 year.", xMax / 14, topMargin + 5 * lineSpacing);
    text("The 2nd year, that $220 amount earns the interest.", xMax / 14, topMargin + 6 * lineSpacing);
    text("So, she gets 10% of $220, which is $22.", xMax / 14, topMargin + 7 * lineSpacing);
    text("That brings her account to 220 + 22 = $242.", xMax / 14, topMargin + 8 * lineSpacing);
    text("Let's say the interest rate stays fixed at 10%.", xMax / 14, topMargin + 10 * lineSpacing);
    fill('lime');
    text("To the nearest dollar, how much money", xMax / 14, topMargin + 11 * lineSpacing);
    text("will Bea have at the end of year 3?", xMax / 14, topMargin + 12 * lineSpacing);

    A0.text = '$264';
    A1.text = '$266';
    A2.text = '$280';
    correctSelection = 1;
  }

  if (screenNum == 3) {
    fill('lime');
    textAlign(CENTER);
    textSize(1.3 * fontSize);
    text("Compound interest wins in the long run", xMax / 2, topMargin);
    textSize(fontSize);
    textAlign(LEFT);
    fill('white');
    text("This graph shows growth from compound interest", xMax / 14, topMargin + 12 * lineSpacing);
    text("(the red cruve) compared to a constant increase", xMax / 14, topMargin + 13 * lineSpacing);
    text("of $40 per year (the blue curve).", xMax / 14, topMargin + 14 * lineSpacing);
    text("At first, compound interest gives less: $20 vs $40", xMax / 14, topMargin + 15 * lineSpacing);
    text("in year 1. However, its growth builds on itself,", xMax / 14, topMargin + 16 * lineSpacing);
    text("and eventually it starts to earn much more.", xMax / 14, topMargin + 17 * lineSpacing);

    fill('lime');
    text("In which year does compound interest take the lead?", xMax / 14, topMargin + 18 * lineSpacing);
    A0.text = '12';
    A1.text = '14';
    A2.text = '18';
    correctSelection = 1;
    graphSprite.visible = true;
  }

  if (screenNum == 4) {
    fill('lime');
    textAlign(CENTER);
    textSize(1.3 * fontSize);
    text("Exponential growth", xMax / 2, topMargin);
    textSize(fontSize);
    textAlign(LEFT);
    fill('white');
    text("Compound interest is a type of 'exponential growth.'", xMax / 14, topMargin + 2 * lineSpacing);
    text("Let's take a look at what that means.", xMax / 14, topMargin + 4 * lineSpacing);
    text("An exponent is basically just a multiplication counter.", xMax / 14, topMargin + 6 * lineSpacing);
    text("It's written as a small number floating up to the right.", xMax / 14, topMargin + 7 * lineSpacing);
    text("So, 2³ is shorthand for '2 multiplied by itself, 3 times'.", xMax / 14, topMargin + 8 * lineSpacing);
    text("So, 2³ = 2 × 2 × 2, which is equal to 8.", xMax / 14, topMargin + 9 * lineSpacing);
    text("Adding 10% is the same as multiplying by 1.1.", xMax / 14, topMargin + 11 * lineSpacing);
    text("So, Bea has 200, then 200×1.1, then 200×(1.1)², etc.", xMax / 14, topMargin + 12 * lineSpacing);

    fill('lime');
    text("How much money will Bea have after 5 years?", xMax / 14, topMargin + 14 * lineSpacing);
    A0.text = '200×(1.1)⁵';
    A1.text = '200+1.1×5';
    A2.text = '200×5×1.1';
    correctSelection = 0;
    graphSprite.visible = false;
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
  thisSquircle.stroke = 'cyan';
  thisSquircle.color = 'black';
  thisSquircle.strokeWeight = 4;
  thisSquircle.text = thisString;
  thisSquircle.textSize = fontSize;
  thisSquircle.textColor = 'white';
  thisSquircle.isSelected = 0;
  return (thisSquircle);
}

function checkForAnswerSelection() {
  buttonsList = [A0, A1, A2];
  for (i = 0; i < buttonsList.length; i++) {
    thisButton = buttonsList[i];
    if (thisButton.mouse.pressed()) {
      thisButton.isSelected = 1;
      somethingIsSelected = 1;
      checkButton.text = 'Check';
      buttonsList[(i + 1) % 3].isSelected = 0;
      buttonsList[(i + 2) % 3].isSelected = 0;
      checkButton.color = 'DarkSlateGray';
      checkButton.text = 'Check';
    }
    if (thisButton.isSelected == 1) {
      thisButton.strokeWeight = 8;
      thisButton.textSize = 1.3 * fontSize;
    } else {
      thisButton.strokeWeight = 4;
      thisButton.textSize = fontSize;
      thisButton.stroke = 'cyan';
    }
  }
  if (checkButton.mouse.pressed() && somethingIsSelected == 1) {
    if (correctAnswerSubmitted == 1 && screenNum < 4) {
      screenNum++;
      resetButtons();
    } else {
      // checkButtonPressTime = millis();
      if (buttonsList[correctSelection].isSelected == 1) {
        correctSound.play();
        buttonsList[correctSelection].stroke = 'lime';
        if (screenNum < 4) {
          checkButton.text = 'Correct! Press here for next screen';
        } else {
          checkButton.text = 'Correct! You completed the lesson!';
        }
        checkButton.color = 'green';
        correctAnswerSubmitted = 1;
      } else {
        checkButton.text = "Oops, that's not correct. Try again";
        checkButton.color = 'red';
      }
    }
  }
}

function preload() {
  soundFormats('mp3');
  correctSound = loadSound('Sounds/correct.mp3');
  correctSound.setVolume(0.7);
}

function resetButtons() {
  buttonsList = [A0, A1, A2];
  somethingIsSelected = 0;
  checkButton.color = 'DarkSlateGray';
  checkButton.text = 'Select an answer to check';
  correctAnswerSubmitted = 0;
  for (i = 0; i < buttonsList.length; i++) {
    thisButton = buttonsList[i];
    thisButton.strokeWeight = 4;
    thisButton.textSize = fontSize;
    thisButton.stroke = 'cyan';
    thisButton.isSelected = 0;
  }
}

