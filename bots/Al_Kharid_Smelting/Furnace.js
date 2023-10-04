const Jimp = require("jimp");

const Core = require("./Core");
const Image = require("./Image");
const Mouse = require("./Mouse");
const Game = require("./Game");
const Compass = require("./Compass");

const { FURNACE_CROP_TOP_LEFT, FURNACE_CROP_DIMENSIONS } = require("./Constants");

async function clickItemOnFurnace(slotNumber) {
  const { x, y } = await getFurnaceLocation();
  const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);

  const slotCenter = Game.getSlotCenter(slotNumber);
  const adjustedSlotCenter = Image.jimpToRobotCoordinates(slotCenter.x, slotCenter.y);

  // Click on item
  await Mouse.moveToAndClick(adjustedSlotCenter.x, adjustedSlotCenter.y, 800);
  await Core.sleep(1000);

  // Click on furnace
  await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y, 800);
  await Core.sleep(11000);
}

async function getFurnaceLocation() {
  console.time("getFurnaceLocation");
  const targetColors = ["#89250e", "#861308", "#ca6732", "#c7602f", "#781108"];
  const coordinates = findPixelColorInBoundingBox(targetColors);
  console.timeEnd("getFurnaceLocation");

  if (coordinates) {
    return coordinates;
  }

  await Compass.setCamera(72);
  return await getFurnaceLocation();
}

function findPixelColorInBoundingBox(hexColors) {
  // Make sure hexColors is an array and normalize to uppercase
  const normalizedHexColors = hexColors.map(color => color.toUpperCase());

  // Define the bounds for the search
  const xEnd = FURNACE_CROP_TOP_LEFT.x + FURNACE_CROP_DIMENSIONS.width;
  const yEnd = FURNACE_CROP_TOP_LEFT.y + FURNACE_CROP_DIMENSIONS.height;

  // Start from the top right corner
  for (let x = xEnd - 1; x >= FURNACE_CROP_TOP_LEFT.x; x--) {
    for (let y = FURNACE_CROP_TOP_LEFT.y; y < yEnd; y++) {
      const pixelColor = CurrentImage.getPixelColor(x, y);
      const rgba = Jimp.intToRGBA(pixelColor);

      // Convert the rgba to hex for comparison
      const currentHex = "#" + rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a).toUpperCase();

      if (normalizedHexColors.includes(currentHex)) {
        return { x, y, color: currentHex };
      }
    }
  }

  return null;
}

function rgbaToHex(r, g, b, a) {
  return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

module.exports = {
  getFurnaceLocation,
  clickItemOnFurnace,
};
