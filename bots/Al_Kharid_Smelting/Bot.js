const robot = require("robotjs");
const ks = require("node-key-sender");

const Utils = require("./Utils");
const Game = require("./Game");
const Core = require("./Core");
const Mouse = require("./Mouse");
const Keyboard = require("./Keyboard");
const Bank = require("./Bank");
const Rug = require("./Rug");
const Furnace = require("./Furnace");
const Compass = require("./Compass");

global.CurrentImage;

// create enum for the different states of the bot
const BotFunctions = {
  STEEL_BARS: "STEEL_BARS",
  CANNON_BALLS: "CANNON_BALLS",
};

const BotFunction = BotFunctions.CANNON_BALLS;

async function start() {
  initialize();
}

async function test() {
  await initialize(false);

  await Core.updateCapture(true);
  await Rug.getRugLocation(true);
}

async function run() {
  console.log("run");

  // Click on bank tab
  await Mouse.moveToAndClick(628, 328, 800);
  await Core.sleep(500);

  switch (BotFunction) {
    case BotFunctions.STEEL_BARS:
      // Click on coal withdraw option
      await Mouse.clickMenuOption(639, 384, 5);
      await Core.sleep(2000);

      // Enter 18 bars and enter
      robot.typeString("18");
      robot.keyTap("enter");
      await Core.sleep(2000);

      // Withdraw all iron
      await Mouse.clickMenuOption(699, 385, 6);
      await Core.sleep(2000);
      break;
    case BotFunctions.CANNON_BALLS:
      // Click on mold
      await Mouse.moveToAndClick(809, 384);
      await Core.sleep(1000);

      // Click on steel bar withdraw option
      await Mouse.clickMenuOption(930, 381, 6);
      await Core.sleep(2000);
      break;
  }

  // CLose bank
  await Mouse.moveToAndClick(1160, 288, 800);
  await Core.sleep(1000);

  // Fight drift
  await Compass.setCamera(72);

  await Core.updateCapture();

  // switch statement again
  switch (BotFunction) {
    case BotFunctions.STEEL_BARS:
      // Click on coal
      await Furnace.clickItemOnFurnace(1);

      // Select steel bar
      await Mouse.clickMenuOption(329, 764, 4);
      await Core.sleep(2000);
      robot.typeString("20");
      robot.keyTap("enter");

      // Wait until done - 29 seconds
      await Core.sleep(29000);
      break;
    case BotFunctions.CANNON_BALLS:
      // Click on steel bar
      await Furnace.clickItemOnFurnace(2);

      // Select all steel bar
      await Mouse.clickMenuOption(330, 791, 3);
      await Core.sleep(2000);

      // Wait until done - 3 minutes
      await Core.sleep(180000);
      break;
  }

  await Core.updateCapture();
  await Rug.moveToRug();
  await Core.updateCapture();
  await Bank.depositItemsInBank();

  run();
}

async function initialize(shouldRun = true) {
  await Core.updateCapture();

  const isGameRunning = await Core.isGameRunning();

  if (isGameRunning) {
    console.log("Game is not running.");
    await Core.spawnGame();
    await Core.updateCapture();
  }

  if (!Game.isOnLoginScreen()) {
    console.log("Already logged in. Skipping initialization.");
    if (!shouldRun) return;

    await Bank.depositItemsInBank();
    run();
  } else {
    await Game.logIn();
    await Core.updateCapture();
    await Game.toggleBackpack();

    await Keyboard.pressKey("up", 1000);
    await Core.sleep(500);

    await Compass.setCamera(72);

    await Core.updateCapture();

    if (!shouldRun) return;

    await Bank.depositItemsInBank();
    run();
  }
}

module.exports = {
  start,
  test,
};
