const robot = require("robotjs");

const Utils = require("./Utils");

async function moveToAndClick(x, y, duration = 700, rightClick = false) {
  await moveMouse(x, y, duration);

  if (rightClick) {
    robot.mouseClick("right");
  } else {
    robot.mouseClick();
  }

  await sleep(300);
}

async function moveToAndRightClick(x, y, duration = 1000) {
  await moveToAndClick(x, y, duration, true);
}

async function moveMouse(x, y, duration = 1000) {
  return new Promise(async (resolve) => {
    const mousePos = robot.getMousePos();
    const steps = 50;
    const stepDuration = duration / steps;
    let currentStep = 0;

    // This is an ease-in-out function. It starts slow, speeds up in the middle, and then slows down at the end.
    const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const moveInterval = setInterval(() => {
      currentStep++;
      const ratio = easeInOutQuad(currentStep / steps);
      const newX = mousePos.x + (x - mousePos.x) * ratio;
      const newY = mousePos.y + (y - mousePos.y) * ratio;

      robot.moveMouse(newX, newY);

      if (currentStep >= steps) {
        clearInterval(moveInterval);
        resolve();
      }
    }, stepDuration);
  });
}

async function clickMenuOption(x, y, menuOptionNumber) {
  const moveDownAmount = 20 + menuOptionNumber * 20;

  await moveToAndRightClick(x, y, Utils.getRandomNumberBetween(200, 600));
  await moveToAndClick(x, y + moveDownAmount, Utils.getRandomNumberBetween(50, 100));
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  moveToAndClick,
  moveToAndRightClick,
  moveMouse,
  clickMenuOption,
};
