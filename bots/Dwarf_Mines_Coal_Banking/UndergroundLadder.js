const MachineVision = require("./MachineVision");
const Image = require("./Image");
const Utils = require("./Utils");
const Core = require("./Core");
const Minimap = require("./Minimap");
const Mouse = require("./Mouse");

const { CENTER_CROP_TOP_LEFT } = require("./Constants");

async function leaveUnderground() {
    const didMoveToUndergroundLadder = await Minimap.moveToUndergroundLadder();

    if (!didMoveToUndergroundLadder) {
        console.log("Failed to move to underground ladder.");
        return false;
    }
    
    await Core.updateCapture();

    const undergroundLadderLocationMatches = await getUndergroundLadderLocation();

    if (undergroundLadderLocationMatches.length > 0) {
        const { x, y } = undergroundLadderLocationMatches[0];
        const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);
    
        await Mouse.moveToAndClick(adjustedCoordinates.x, adjustedCoordinates.y, Utils.getRandomNumberBetween(400, 900));
        await Core.sleep(4000);

        return true;
    }
}

async function getUndergroundLadderLocation(draw = false) {
  return new Promise(async (resolve, reject) => {
    try {
      const templateDirectory = "./bots/Dwarf_Mines_Coal_Banking/underground_ladder_template";
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

      console.log("Underground Ladder: ", adjustedMatches);
      resolve(adjustedMatches);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getUndergroundLadderLocation,
  leaveUnderground
};