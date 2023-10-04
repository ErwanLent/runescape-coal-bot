const robot = require("robotjs");

const MachineVision = require("./MachineVision");
const Image = require("./Image");
const Utils = require("./Utils");
const Core = require("./Core");
const Mouse = require("./Mouse");

const { DRILL_SEARGANT_MAT_CROP_TOP_LEFT, DRILL_SEARGANT_MAT_CROP_DIMENSIONS } = require("./Constants");

async function checkForRandomEvent(draw = false) {
  return new Promise(async (resolve, reject) => {
    const templateDirectory = "./bots/Dwarf_Mines_Coal_Banking/random_events_templates";
    const template_paths = Utils.getTemplatesFromDirectory(templateDirectory);

    const croppedImage = await Image.generateCroppedCenterImage();
    const filterColors = [];
    const scale = 0.5;
    const threshold = 0.72;

    if (draw) {
      MachineVision.drawMatches(croppedImage, template_paths, threshold, filterColors, scale);
      resolve();
      return;
    }

    const matches = await MachineVision.findTemplateMatches(
      croppedImage,
      template_paths,
      threshold,
      filterColors,
      scale,
      true
    );

    resolve(matches.length > 0);
  });
}

async function handleDrillSeargant() {
  await Core.updateCapture();

  if (isInDrillSeargantSite()) {
    // Check for success dialogue
    if (Image.getHexColor(1293, 1760) === "#000000" && Image.getHexColor(1134, 1861) === "#0000ff") {
      const adjustedCoordinates = Image.jimpToRobotCoordinates(856, 1854);
      await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y, Utils.getRandomNumberBetween(200, 600));
      await Core.sleep(3000);
      return;
    }

    const firstMatColor = "#284222";
    const matPositions = [];

    const firstMatColorLocation = Image.findHexColor(CurrentImage, firstMatColor);

    if (!firstMatColorLocation) {
      return;
    }

    matPositions.push(firstMatColorLocation);

    matPositions.push({
      x: firstMatColorLocation.x + 280,
      y: firstMatColorLocation.y,
    });

    matPositions.push({
      x: firstMatColorLocation.x + 600,
      y: firstMatColorLocation.y - 75,
    });

    matPositions.push({
      x: firstMatColorLocation.x + 900,
      y: firstMatColorLocation.y - 250,
    });

    const randomMatClickPosition = matPositions[Math.floor(Math.random() * matPositions.length)];
    const adjustedCoordinates = Image.jimpToRobotCoordinates(randomMatClickPosition.x, randomMatClickPosition.y);

    await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y, Utils.getRandomNumberBetween(200, 600));
    robot.mouseClick();
    await Core.sleep(10000);

    await handleDrillSeargant();
  } else {
    console.log('No longer in drill sg site.');
  }
}

function isInDrillSeargantSite() {
  const hexColor1 = Image.getHexColor(2599, 1942);
  const hexColor2 = Image.getHexColor(2700, 1942);
  const hexColor3 = Image.getHexColor(2797, 1942);
  const hexColor4 = Image.getHexColor(2896, 1942);

  const color = "#5c5449";

  return hexColor1 === color && hexColor2 === color && hexColor3 === color && hexColor4 === color;
}

module.exports = {
  checkForRandomEvent,
  handleDrillSeargant,
  isInDrillSeargantSite,
};
