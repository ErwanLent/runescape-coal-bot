const robot = require("robotjs");

async function pressKey(key, duration) {
  robot.keyToggle(key, "down");
  await sleep(duration);
  robot.keyToggle(key, "up");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
    pressKey
};