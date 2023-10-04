const Jimp = require("jimp");

const {
  CENTER_CROP_TOP_LEFT,
  CENTER_CROP_DIMENSIONS
} = require("./Constants");

async function generateCroppedCenterImage() {
  const croppedImage = await CurrentImage.clone().crop(
    CENTER_CROP_TOP_LEFT.x,
    CENTER_CROP_TOP_LEFT.y,
    CENTER_CROP_TOP_LEFT.x + CENTER_CROP_DIMENSIONS.width,
    CENTER_CROP_TOP_LEFT.y + CENTER_CROP_DIMENSIONS.height
  );

  return croppedImage;
}

async function containsColors(image, hexColors) {
  const { width, height } = image.bitmap;
  const xCenter = Math.floor(width / 2);
  const yCenter = Math.floor(height / 2);
  const quarterWidth = Math.floor(width / 4);
  const quarterHeight = Math.floor(height / 4);
  let found = false;

  // Check the central part of the image first
  for (let x = xCenter - quarterWidth; x < xCenter + quarterWidth; x++) {
    for (let y = yCenter - quarterHeight; y < yCenter + quarterHeight; y++) {
      const pixelColor = getHexColor(x, y, image).substring(1);
      if (hexColors.includes(pixelColor)) {
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // If the target colors were not found in the central part, check the rest of the image
  if (!found) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // Skip the central part of the image
        if (
          x >= xCenter - quarterWidth &&
          x < xCenter + quarterWidth &&
          y >= yCenter - quarterHeight &&
          y < yCenter + quarterHeight
        ) {
          continue;
        }

        const pixelColor = getHexColor(x, y, image).substring(1);
        if (hexColors.includes(pixelColor)) {
          console.log("Found color at (" + x + ", " + y + ")");
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }

  return found;
}

function findHexColor(image, hexColor, xOffset = 0, yOffset = 0) {
  const { width, height } = image.bitmap;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (getHexColor(x, y, image) === hexColor) {
        return { x: x + xOffset, y: y + yOffset };
      }
    }
  }

  return null;
}

// Convert HEX to RGB
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// Calculate color distance
function colorDistance(color1, color2) {
  const [r1, g1, b1] = color1;
  const [r2, g2, b2] = color2;
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function jimpToRobotCoordinates(jimpX, jimpY) {
  const scaleX = 0.444;
  const scaleY = 0.444;
  const offsetY = 23;

  const robotX = jimpX * scaleX;
  const robotY = jimpY * scaleY + offsetY;

  return { x: Math.round(robotX), y: Math.round(robotY) };
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function convertRobotImageToJimp(robotImage) {
  let img = new Jimp(robotImage.width, robotImage.height);
  for (let x = 0; x < img.bitmap.width; x++) {
    for (let y = 0; y < img.bitmap.height; y++) {
      const i = robotImage.image.readUInt32LE((y * robotImage.width + x) * 4);
      const rgba = {
        b: i & 0xff, // Blue
        g: (i >> 8) & 0xff, // Green
        r: (i >> 16) & 0xff, // Red
        a: (i >> 24) & 0xff, // Alpha
      };
      const hex = Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a);
      img.setPixelColor(hex, x, y);
    }
  }
  return img;
}

function getHexColor(x, y, image = null) {
  const imageToUse = image || CurrentImage;
  const colorIndexStart = imageToUse.getPixelIndex(x, y);
  const red = imageToUse.bitmap.data[colorIndexStart];
  const green = imageToUse.bitmap.data[colorIndexStart + 1];
  const blue = imageToUse.bitmap.data[colorIndexStart + 2];

  return rgbToHex(red, green, blue);
}

// Utility function to map cropped coordinates back to the original image
function adjustCoordinatesBackToOriginal(coord, offsetX, offsetY) {
  return {
    x: coord.x + offsetX,
    y: coord.y + offsetY,
    w: coord.w,
    h: coord.h,
  };
}

module.exports = {
    generateCroppedCenterImage,
    containsColors,
    findHexColor,
    hexToRgb,
    colorDistance,
    jimpToRobotCoordinates,
    componentToHex,
    rgbToHex,
    convertRobotImageToJimp,
    getHexColor,
    adjustCoordinatesBackToOriginal
};