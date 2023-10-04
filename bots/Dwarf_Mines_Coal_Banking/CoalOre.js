const MachineVision = require("./MachineVision");
const Image = require("./Image");
const Utils = require("./Utils");

const { CENTER_CROP_TOP_LEFT } = require("./Constants");

async function getCoalOreLocations(draw = false) {
  return new Promise(async (resolve, reject) => {
    try {
      const templateDirectory = "./bots/Dwarf_Mines_Coal_Banking/coal_ore_templates";
      const template_paths = Utils.getTemplatesFromDirectory(templateDirectory);

      const croppedImage = await Image.generateCroppedCenterImage();
      const filterColors = ['0f0f0a', '1d1c12', '13130c', '1a190f', '1a190f', '14140d', '1a1a10', '17160e', '1c1c11'];
      const scale = 0.4;
      const threshold = 0.6;

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
        scale
      );

      const adjustedMatches = matches.map((match) => {
        const adjustedMatch = Image.adjustCoordinatesBackToOriginal(
          match,
          CENTER_CROP_TOP_LEFT.x,
          CENTER_CROP_TOP_LEFT.y
        );

        return Utils.getCenterCoordinates(adjustedMatch);
      });

      console.log("Coal Ores: ", adjustedMatches);
      resolve(adjustedMatches);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getCoalOreLocations
};