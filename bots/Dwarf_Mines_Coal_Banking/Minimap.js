const MachineVision = require("./MachineVision");
const Image = require("./Image");
const Utils = require("./Utils");
const Mouse = require("./Mouse");
const Core = require("./Core");

const { MINIMAP_CROP_TOP_LEFT, MINIMAP_CROP_DIMENSIONS } = require("./Constants");

let FailedMoveToCoalAttempts = 0;

async function moveToCoal() {
  if (FailedMoveToCoalAttempts >= 3) {
    FailedMoveToCoalAttempts = 0;
    return false;
  }

  const coalMapLocation = await getCoalMapLocation();

  if (coalMapLocation.length > 0) {
    FailedMoveToCoalAttempts = 0;
    
    const { x, y } = coalMapLocation[0];
    const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);

    await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y, Utils.getRandomNumberBetween(400, 900));

    await Core.sleep(Utils.getRandomNumberBetween(5000, 8000));
    return true;
  } else {
    FailedMoveToCoalAttempts++;
    await Core.sleep(1000);
    return await moveToCoal;
  }
}

let FailedMoveToUndergroundLadderAttempts = 0;

async function moveToUndergroundLadder() {
  if (FailedMoveToUndergroundLadderAttempts >= 3) {
    FailedMoveToUndergroundLadderAttempts = 0;
    return false;
  }

  const undergroundLadderLocation = await getUndergroundLadderMapLocation();

  if (undergroundLadderLocation.length > 0) {
    FailedMoveToUndergroundLadderAttempts = 0;

    const { x, y } = undergroundLadderLocation[0];
    const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);

    await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y, Utils.getRandomNumberBetween(400, 900));

    await Core.sleep(Utils.getRandomNumberBetween(5000, 8000));
    
    return true;
  }

  FailedMoveToUndergroundLadderAttempts++;

  await Core.sleep(1000);
  return await moveToUndergroundLadder;
}

async function getCoalMapLocation(draw = false) {
  return new Promise(async (resolve, reject) => {
    const templateDirectory = "./bots/Dwarf_Mines_Coal_Banking/coal_map_marker_template";
    const template_paths = Utils.getTemplatesFromDirectory(templateDirectory);

    const croppedImage = await generateCroppedMiniMapImage();
    const filterColors = [];
    const scale = 1;
    const threshold = 0.6;

    if (draw) {
      MachineVision.drawMatches(croppedImage, template_paths, threshold, filterColors, scale);
      resolve();
      return;
    }

    const matches = await MachineVision.findTemplateMatches(croppedImage, template_paths, threshold, filterColors);

    const adjustedMatches = matches.map((match) => {
      const adjustedMatch = Image.adjustCoordinatesBackToOriginal(
        match,
        MINIMAP_CROP_TOP_LEFT.x,
        MINIMAP_CROP_TOP_LEFT.y
      );

      return Utils.getCenterCoordinates(adjustedMatch);
    });

    resolve(adjustedMatches);
  });
}

async function getUndergroundLadderMapLocation(draw = false) {
  return new Promise(async (resolve, reject) => {
    const templateDirectory = "./bots/Dwarf_Mines_Coal_Banking/underground_ladder_map_marker_template";
    const template_paths = Utils.getTemplatesFromDirectory(templateDirectory);

    const croppedImage = await generateCroppedMiniMapImage();
    const filterColors = [];
    const scale = 1;
    const threshold = 0.5;

    if (draw) {
      MachineVision.drawMatches(croppedImage, template_paths, threshold, filterColors, scale);
      resolve();
      return;
    }

    const matches = await MachineVision.findTemplateMatches(croppedImage, template_paths, threshold, filterColors, scale, true);

    const adjustedMatches = matches.map((match) => {
      const adjustedMatch = Image.adjustCoordinatesBackToOriginal(
        match,
        MINIMAP_CROP_TOP_LEFT.x,
        MINIMAP_CROP_TOP_LEFT.y
      );

      return Utils.getCenterCoordinates(adjustedMatch);
    });

    resolve(adjustedMatches);
  });
}

async function getAboveLadderMapLocation(draw = false) {
  return new Promise(async (resolve, reject) => {
    const templateDirectory = "./bots/Dwarf_Mines_Coal_Banking/above_ground_ladder_map_marker_template";
    const template_paths = Utils.getTemplatesFromDirectory(templateDirectory);

    const croppedImage = await generateCroppedMiniMapImage();
    const filterColors = [];
    const scale = 1;
    const threshold = 0.6;

    if (draw) {
      MachineVision.drawMatches(croppedImage, template_paths, threshold, filterColors, scale);
      resolve();
      return;
    }

    const matches = await MachineVision.findTemplateMatches(croppedImage, template_paths, threshold, filterColors, scale, true);

    const adjustedMatches = matches.map((match) => {
      const adjustedMatch = Image.adjustCoordinatesBackToOriginal(
        match,
        MINIMAP_CROP_TOP_LEFT.x,
        MINIMAP_CROP_TOP_LEFT.y
      );

      return Utils.getCenterCoordinates(adjustedMatch);
    });

    resolve(adjustedMatches);
  });
}

async function generateCroppedMiniMapImage() {
  const croppedImage = CurrentImage.clone().crop(
    MINIMAP_CROP_TOP_LEFT.x,
    MINIMAP_CROP_TOP_LEFT.y,
    MINIMAP_CROP_DIMENSIONS.width,
    MINIMAP_CROP_DIMENSIONS.height
  );

  return croppedImage;
}

module.exports = {
  getCoalMapLocation,
  getUndergroundLadderMapLocation,
  generateCroppedMiniMapImage,
  moveToCoal,
  moveToUndergroundLadder,
  getAboveLadderMapLocation
};
