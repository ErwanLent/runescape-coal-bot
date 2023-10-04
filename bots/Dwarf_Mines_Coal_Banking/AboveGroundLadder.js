const MachineVision = require("./MachineVision");
const Image = require("./Image");
const Utils = require("./Utils");
const Core = require("./Core");
const Minimap = require("./Minimap");
const Mouse = require("./Mouse");

const { CENTER_CROP_TOP_LEFT } = require("./Constants");


let aboveGroundLadderMissCount = 0;

async function goUnderground() {
  await Core.updateCapture();

  const aboveGroundLadderLocationMatches = await getAboveGroundLadderLocation();

  if (aboveGroundLadderLocationMatches.length > 0) {
    aboveGroundLadderMissCount = 0;

    const { x, y } = aboveGroundLadderLocationMatches[0];
    const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);

    await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y, Utils.getRandomNumberBetween(400, 900));
    await Core.sleep(1500);

    return true;
  } else {
    aboveGroundLadderMissCount++;

    if (aboveGroundLadderMissCount > 3) {
      return false;
    }

    // Click on minimap
    const aboveGroundLadderMapLocation = await Minimap.getAboveLadderMapLocation();
    if (aboveGroundLadderMapLocation.length > 0) {
      const { x, y } = aboveGroundLadderMapLocation[0];
      const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);
      await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y, Utils.getRandomNumberBetween(400, 900));
      await Core.sleep(8000);
    }

    await goUnderground();
  }
}

async function getAboveGroundLadderLocation(draw = false) {
  return new Promise(async (resolve, reject) => {
    try {
      const templateDirectory = "./bots/Dwarf_Mines_Coal_Banking/above_ground_ladder_template";
      const template_paths = Utils.getTemplatesFromDirectory(templateDirectory);

      const croppedImage = await Image.generateCroppedCenterImage();
      const filterColors = [];
      const scale = 0.6;
      const threshold = 0.5;

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

      const adjustedMatches = matches.map((match) => {
        const adjustedMatch = Image.adjustCoordinatesBackToOriginal(
          match,
          CENTER_CROP_TOP_LEFT.x,
          CENTER_CROP_TOP_LEFT.y
        );

        return Utils.getCenterCoordinates(adjustedMatch);
      });

      console.log("getAboveGroundLadderLocation: ", adjustedMatches);
      resolve(adjustedMatches);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getAboveGroundLadderLocation,
  goUnderground,
};
