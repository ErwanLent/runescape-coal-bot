const robot = require("robotjs");

const Image = require("./Image");
const Utils = require("./Utils");
const Core = require("./Core");
const Mouse = require("./Mouse");

const { BackpackToggleLocation } = require("./Constants");

async function goToStartingPoint() {

}

function getSlotCenter(slotNumber) {
  if (slotNumber < 1 || slotNumber > 28) {
    throw new Error("Invalid slot number. Must be between 1 and 28.");
  }

  // Backpack's starting dimensions and coordinates
  const startX = 3255;
  const startY = 1091;
  const totalWidth = 561;
  const totalHeight = 774;

  // Number of columns and rows in the backpack grid
  const columns = 4;
  const rows = 7;

  // Given gaps
  const leftSpace = 45;
  const rightSpace = 45;
  const topSpace = 24;
  const middleSpaceVertical = 21;
  const bottomSpace = 12;

  // Horizontal drift adjustment per slot
  const driftPerSpace = 8;

  // Calculate the inner width and height of the backpack (excluding the left and right spaces)
  const innerWidth = totalWidth - leftSpace - rightSpace;
  const slotWidth = innerWidth / columns;

  const slotHeight = (totalHeight - topSpace - (rows - 1) * middleSpaceVertical - bottomSpace) / rows;

  // Determine the row and column of the slot in the backpack grid
  const row = Math.ceil(slotNumber / columns) - 1; // -1 because it's 0-indexed
  const col = (slotNumber - 1) % columns; // -1 to make it 0-indexed

  // Calculate top-left corner of the desired slot, adjusting for the drift
  const slotStartX = startX + leftSpace + col * slotWidth + col * driftPerSpace;
  const slotStartY = startY + topSpace + row * slotHeight + row * middleSpaceVertical;

  // Calculate the center of the slot
  const centerX = slotStartX + slotWidth / 2;
  const centerY = slotStartY + slotHeight / 2;

  return {
    x: centerX,
    y: centerY,
  };
}

async function isBeingAttacked() {
  const croppedImage = await Image.generateCroppedCenterImage();
  const containsRandomEvent = await Image.containsColors(croppedImage, ["00ff00", "c00000", "4040ff"]);

  if (containsRandomEvent) {
    console.log("Is being attacked detected.");
  }

  return containsRandomEvent;
}

async function flee() {
  // await UndergroundLadder.leaveUnderground();
  // await Core.sleep(1000);
  // await Core.updateCapture();
  // await AboveGroundLadder.goUnderground();
  // await Core.sleep(1000);
  // await Core.updateCapture();
  // await Minimap.moveToCoal();
}

async function waitUntilInventoryChanges(currentCount, maxIterations = 10, iteration = 0) {
  const checkInventoryCount = () => {
    const newCount = getInventoryCount();
    return newCount != currentCount;
  };

  if (iteration >= maxIterations) {
    return;
  }

  if (checkInventoryCount()) {
    return;
  } else {
    await Core.updateCapture();

    const isBeingAttackedResult = await isBeingAttacked();

    if (isBeingAttackedResult) {
      return;
    }

    await waitUntilInventoryChanges(currentCount, maxIterations, iteration + 1);
  }
}

function isOnLoginScreen() {
  const loginScreenHexColor1 = Image.getHexColor(1792, 683);
  const loginScreenHexColor2 = Image.getHexColor(1799, 1619);

  return loginScreenHexColor1 === "#c4b37c" && loginScreenHexColor2 === "#ccba7b";
}

async function logIn() {
  // async promise
  return new Promise(async (resolve, reject) => {
    await Core.updateCapture();

    if (!isOnLoginScreen()) {
      console.log("Already logged in.");
      resolve();
    }

    const firstClickLocation = { x: 848, y: 379 };
    const secondClickLocation = { x: 862, y: 635 };
    const thirdClickLocation = { x: 858, y: 598 };

    await Mouse.moveToAndClick(firstClickLocation.x, firstClickLocation.y);
    await Core.sleep(1500);
    await Mouse.moveToAndClick(secondClickLocation.x, secondClickLocation.y);
    await Core.sleep(2000);
    await Mouse.moveToAndClick(thirdClickLocation.x, thirdClickLocation.y);

    resolve();
  });
}

async function logOut() {
  const logOutXLocation = { x: 1689, y: 45 };
  const logOutFinalButtonLocation = { x: 1567, y: 737 };

  return new Promise(async (resolve, reject) => {
    await Mouse.moveToAndClick(logOutXLocation.x, logOutXLocation.y, Utils.getRandomNumberBetween(400, 800));
    await Core.sleep(800);
    await Mouse.moveToAndClick(
      logOutFinalButtonLocation.x,
      logOutFinalButtonLocation.y,
      Utils.getRandomNumberBetween(400, 800)
    );

    await Core.sleep(2000);
    resolve();
  });
}

async function toggleBackpack() {
  return new Promise(async (resolve, reject) => {
    const checkBackpackOpen = () => {
      const backpackHexColor = Image.getHexColor(BackpackToggleLocation.x, BackpackToggleLocation.y);
      return isBackpackOpen(backpackHexColor);
    };

    const convertedCoordinates = Image.jimpToRobotCoordinates(BackpackToggleLocation.x, BackpackToggleLocation.y);

    if (!checkBackpackOpen()) {
      console.log("Opening backpack...");
      await Mouse.moveToAndClick(
        convertedCoordinates.x,
        convertedCoordinates.y,
        Utils.getRandomNumberBetween(700, 1700)
      );

      await Core.sleep(700);
      await Core.updateCapture(); // re-capture the screen after click

      // After clicking, verify again if the backpack is open
      if (checkBackpackOpen()) {
        console.log("Backpack is now open.");
        resolve();
      } else {
        console.log("Failed to open backpack. Retrying...");
        toggleBackpack().then(resolve).catch(reject); // recursive call
      }
    } else {
      console.log("Backpack already open.");
      resolve();
    }
  });
}

function isBackpackOpen(hex) {
  return hex === "#7a2920";
}

async function dropItemsByRange(startSlot, endSlot) {
  for (let i = startSlot; i <= endSlot; i++) {
    await dropItem(i);
  }
}

async function dropItem(slotNumber) {
  const slotCenter = getSlotCenter(slotNumber);
  const convertedCoordinates = Image.jimpToRobotCoordinates(slotCenter.x, slotCenter.y);
  const mouseMovementTime = Utils.getRandomNumberBetween(100, 200);

  await Mouse.moveMouse(convertedCoordinates.x, convertedCoordinates.y, mouseMovementTime);
  await Core.sleep(50);

  robot.keyToggle("shift", "down");
  robot.mouseClick();

  await Core.sleep(50);
  robot.keyToggle("shift", "up");
}

function getInventoryCount() {
  let count = 0;

  for (let i = 1; i <= 28; i++) {
    const { x, y } = getSlotCenter(i);
    if (isSlotEmpty(x, y)) {
      // console.log("Slot " + i + " has item.");
    } else {
      count++;
      // console.log("Slot " + i + " is not empty.");
    }
  }

  console.log("Backpack has " + count + " items.");
  return count;
}

function isSlotEmpty(centerX, centerY) {
  const offsetX = centerX - 21; // This is the secondary x-coordinate

  // Check color for both the center and the offset coordinate
  const centerHasItem = checkItemAtCoordinate(centerX, centerY);
  const offsetHasItem = checkItemAtCoordinate(offsetX, centerY);

  const isSlotEmpty = !(centerHasItem || offsetHasItem);

  // Return false if either of them has an item
  return isSlotEmpty;
}

function checkItemAtCoordinate(x, y, log = false) {
  const pixelColorHex = Image.getHexColor(x, y);

  if (log) {
    console.log("pixelColorHex at (" + x + ", " + y + "): ", pixelColorHex);
  }

  const pixelColor = Image.hexToRgb(pixelColorHex);

  const itemColors = ["#221603", "#3d2218", "#2b2a1b", "#251803", "#40251b", "#302020", "#090c6a", "#08650b"].map(
    Image.hexToRgb
  );

  // Check against item colors
  for (const itemColor of itemColors) {
    if (Image.colorDistance(pixelColor, itemColor) < 5) {
      return true;
    }
  }

  return false;
}

module.exports = {
  getSlotCenter,
  isBeingAttacked,
  flee,
  waitUntilInventoryChanges,
  isOnLoginScreen,
  logIn,
  logOut,
  toggleBackpack,
  dropItemsByRange,
  dropItem,
  getInventoryCount,
  isSlotEmpty,
  checkItemAtCoordinate,
  goToStartingPoint
};
