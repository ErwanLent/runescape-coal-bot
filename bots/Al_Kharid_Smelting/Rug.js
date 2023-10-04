const Jimp = require("jimp");

const Utils = require("./Utils");
const Core = require("./Core");
const Image = require("./Image");
const Mouse = require("./Mouse");
const Compass = require("./Compass");

const { RUG_CROP_TOP_LEFT, RUG_CROP_DIMENSIONS } = require("./Constants");

async function moveToRug() {
  const { x, y } = await getRugLocation();
  const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);

  // Open bank booth
  await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y);
  await Core.sleep(11000);
}

async function getRugLocation() {
  console.time("getRugLocation");
  const targetColors = ["#7a1f19", "#87231c", "#cfc862", "#83221b", "#711e17", "#8c251c"];
  const coordinates = findPixelColorInBoundingBox(targetColors);
  console.timeEnd("getRugLocation");

  if (coordinates) {
    console.log(coordinates);
    return coordinates;
  }

  await Compass.setCamera(72);
  return await getRugLocation();
}

function findPixelColorInBoundingBox(hexColors) {
  // Make sure hexColors is an array and normalize to uppercase
  const normalizedHexColors = hexColors.map(color => color.toUpperCase());

  // Define the bounds for the search
  const xEnd = RUG_CROP_TOP_LEFT.x + RUG_CROP_DIMENSIONS.width;
  const yEnd = RUG_CROP_TOP_LEFT.y + RUG_CROP_DIMENSIONS.height;

  // Start from the top right corner
  for (let x = xEnd - 1; x >= RUG_CROP_TOP_LEFT.x; x--) {
    for (let y = RUG_CROP_TOP_LEFT.y; y < yEnd; y++) {
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
  getRugLocation,
  moveToRug,
};
