const RandomEvents = require("./RandomEvents");
const Image = require("./Image");
const Utils = require("./Utils");
const Game = require("./Game");
const Core = require("./Core");
const Mouse = require("./Mouse");
const CoalOre = require("./CoalOre");
const Minimap = require("./Minimap");
const Bank = require("./Bank");
const Keyboard = require("./Keyboard");
const Compass = require("./Compass");

global.CurrentImage;
global.MaxInventoryCount = 25;

let CheckRandomEventIteration = 0;
let CheckRandomEventEveryCount = 2;

async function start() {
  console.log("MaxInventoryCount: ", MaxInventoryCount);
  initialize();
}

async function test(initialization = true) {
  await initialize(false);

  // await Minimap.getUndergroundLadderMapLocation(true);

  await CoalOre.getCoalOreLocations(true);
}

async function run() {
  console.log("run");
  await Core.updateCapture();

  CheckRandomEventIteration++;

  const isGameRunning = await Core.isGameRunning();

  if (!isGameRunning) {
    console.log("Game is not running.");
    await Core.spawnGame();
    initialize();
    return;
  }

  console.time("isBeingAttacked");
  const isBeingAttackedResult = await Game.isBeingAttacked();
  console.timeEnd("isBeingAttacked");

  if (isBeingAttackedResult) {
    await Game.flee();

    run();
    return;
  }

  if (CheckRandomEventIteration > CheckRandomEventEveryCount) {
    CheckRandomEventIteration = 0;

    console.time("randomEventCheck");
    const randomEventResult = await RandomEvents.checkForRandomEvent();
    console.timeEnd("randomEventCheck");

    if (randomEventResult) {
      await Game.logOut();
      await Core.sleep(2000);

      start();
      return;
    }
  }

  if (RandomEvents.isInDrillSeargantSite()) {
    console.log("Drill Seargant Detected");
    await RandomEvents.handleDrillSeargant();

    run();
    return;
  }

  const currentInventoryCount = Game.getInventoryCount();

  if (currentInventoryCount >= MaxInventoryCount) {
    // Fight drift
    await Compass.setCamera(155);

    // Go to bank and back
    const didGoToBankAndBack = await Bank.goToBankAndBack();

    if (!didGoToBankAndBack) {
      console.log("Could not go to bank and back. Logging out.");
      await Game.logOut();
      await Core.sleep(2000);

      start();
      return;
    }

    run();
    return;
  }

  console.time("coalMatches");
  const coalMatches = await CoalOre.getCoalOreLocations();
  console.timeEnd("coalMatches");

  // If there are coal matches
  if (coalMatches.length > 0) {
    // Calculate median Y-coordinate
    const sortedByY = [...coalMatches].sort((a, b) => a.y - b.y);
    const medianY = sortedByY[Math.floor(sortedByY.length / 2)].y;

    // Separate into top and bottom rows
    const topRow = coalMatches.filter((match) => match.y <= medianY).sort((a, b) => b.x - a.x);
    const bottomRow = coalMatches.filter((match) => match.y > medianY).sort((a, b) => b.x - a.x);

    // Combine the two rows
    const orderedMatches = [...topRow, ...bottomRow];

    // Pick the first match
    const { x, y } = orderedMatches[0];
    const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);

    await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y, Utils.getRandomNumberBetween(400, 900));

    console.time("waitUntilInventoryChanges");
    await Game.waitUntilInventoryChanges(Game.getInventoryCount(currentInventoryCount, 10));
    console.timeEnd("waitUntilInventoryChanges");

    run();
  } else {
    const didMoveToCoal = await Minimap.moveToCoal();

    if (didMoveToCoal) {
      await Core.sleep(600);
      run();
    } else {
      await Game.logOut();
      await Core.sleep(2000);

      start();
      return;
    }
  }
}

async function initialize(shouldRun = true) {
  await Core.updateCapture();

  const isGameRunning = await Core.isGameRunning();

  if (!isGameRunning) {
    console.log("Game is not running.");
    await Core.spawnGame();
    await Core.updateCapture();
  }

  if (!Game.isOnLoginScreen()) {
    console.log("Already logged in. Skipping initialization.");
    if (!shouldRun) return;

    await Game.goToStartingPoint();
    run();
    return;
  } else {
    await Game.logIn();
    await Core.updateCapture();

    const didOpenBackpack = await Game.toggleBackpack();
    if (!didOpenBackpack) {
      initialize();
      return;
    }

    await Keyboard.pressKey("up", 800);
    await Keyboard.pressKey("down", 200);

    await Compass.setCamera(155);

    await Core.updateCapture();

    if (!shouldRun) return;

    await Game.goToStartingPoint();
    run();
  }
}

module.exports = {
  start,
  test,
};
