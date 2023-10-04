const MachineVision = require("./MachineVision");
const Image = require("./Image");
const Utils = require("./Utils");
const Core = require("./Core");
const Mouse = require("./Mouse");

const { CENTER_CROP_TOP_LEFT } = require("./Constants");

async function depositItemsInBank() {
  const bankBoothLocation = await getBankBoothLocation();

  if (bankBoothLocation.length > 0) {
    const { x, y } = Utils.getCenterCoordinates(bankBoothLocation[0]);
    const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);

    // Open bank booth
    await Mouse.clickMenuOption(adjustedCoordinates.x, adjustedCoordinates.y, 2);
    await Core.sleep(5000);

    // Deposit items button
    await Mouse.moveToAndClick(880, 647, Utils.getRandomNumberBetween(400, 900));
    await Core.sleep(Utils.getRandomNumberBetween(800, 1000));

    // Select Inventory
    await Mouse.moveToAndClick(360, 763, Utils.getRandomNumberBetween(400, 900));
    await Core.sleep(Utils.getRandomNumberBetween(800, 1000));
  }
}

async function getBankBoothLocation(draw = false) {
  return new Promise(async (resolve, reject) => {
    try {
      const templateDirectory = "./bots/Al_Kharid_Smelting/bank_booth_template";
      const template_paths = Utils.getTemplatesFromDirectory(templateDirectory);

      const croppedImage = await Image.generateCroppedCenterImage();
      const filterColors = [];
      const scale = 0.7;
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


      console.log('Bank Matches: ', adjustedMatches)
      resolve(adjustedMatches);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  depositItemsInBank,
  getBankBoothLocation,
};
