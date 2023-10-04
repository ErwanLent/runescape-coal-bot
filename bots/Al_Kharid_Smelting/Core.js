const robot = require("robotjs");
const ks = require('node-key-sender');
const { exec } = require("child_process");

const Image = require("./Image");
const Keyboard = require("./Keyboard");
const Mouse = require("./Mouse");

const { ScreenSize } = require("./Constants");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateCapture(saveCapture = false) {
  let robotImage = robot.screen.capture(0, 55, ScreenSize.width, ScreenSize.height - 160);
  CurrentImage = Image.convertRobotImageToJimp(robotImage);

  await sleep(100);

  if (!saveCapture) return;

  const fileName = `./screenshots/screenshot-${Date.now()}.png`;
  CurrentImage.write(fileName);
}

async function isGameRunning() {
  if (!global.CurrentImage) {
    await updateCapture();
  }

  const pixel1Color = Image.getHexColor(1552, 679);
  const pixel2Color = Image.getHexColor(1684, 30);

  return pixel1Color === "#fae3dd" && pixel2Color === "#c8c7cc";
}

async function spawnGame() {
  console.log('Spawning game...');
  exec("start C:\\Users\\erwan\\OneDrive\\Documents\\2009scape-launcher-sc.exe");
  await sleep(10000);

  await Mouse.moveToAndClick(858, 717, 500);
  await sleep(120000);

  await Mouse.moveToAndClick(1454, 14, 500);
  await sleep(3000);
}

module.exports = {
  sleep,
  updateCapture,
  isGameRunning,
  spawnGame
};