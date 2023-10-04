const MachineVision = require("./MachineVision");
const Image = require("./Image");
const Utils = require("./Utils");
const Core = require("./Core");
const Minimap = require("./Minimap");
const Mouse = require("./Mouse");
const AboveGroundLadder = require("./AboveGroundLadder");
const UndergroundLadder = require("./UndergroundLadder");

const { CENTER_CROP_TOP_LEFT } = require("./Constants");

async function goToBankAndBack() {
  const didLeaveUnderground = await UndergroundLadder.leaveUnderground();

  if (!didLeaveUnderground) {
    console.log("Failed to leave underground.");
    return false;
  }

  // Click on bank area in minimap
  Mouse.moveToAndClick(1660, 197, Utils.getRandomNumberBetween(400, 900));

  // Wait to run there
  await Core.sleep(18000);
  await Core.updateCapture();

  const didDepositItemsInBank = await depositItemsInBank();
  if (!didDepositItemsInBank) {
    return false;
  }

  const didGoUnderground = await goFromBankToUndergound();

  if (!didGoUnderground) {
    return false;
  }

  await Core.updateCapture();
  await Minimap.moveToCoal();

  return true;
}

async function goFromBankToUndergound() {
  await Mouse.moveToAndClick(1514, 86, Utils.getRandomNumberBetween(400, 900));
  await Core.sleep(17000);
  return await AboveGroundLadder.goUnderground();
}

let bankBoothMissCount = 0;

async function depositItemsInBank() {
  const bankBoothLocation = await getBankBoothLocation();

  if (bankBoothLocation.length > 0) {
    bankBoothMissCount = 0;
    const { x, y } = bankBoothLocation[0];
    const adjustedCoordinates = Image.jimpToRobotCoordinates(x, y);

    // Open bank booth
    await Mouse.clickMenuOption(adjustedCoordinates.x, adjustedCoordinates.y, 2);
    await Core.sleep(7500);

    // Deposit items button
    await Mouse.moveToAndClick(880, 647, Utils.getRandomNumberBetween(400, 900));
    await Core.sleep(Utils.getRandomNumberBetween(800, 1000));

    // Select Inventory
    await Mouse.moveToAndClick(360, 763, Utils.getRandomNumberBetween(400, 900));
    await Core.sleep(Utils.getRandomNumberBetween(800, 1000));

    return true;
  } else {
    bankBoothMissCount++;

    if (bankBoothMissCount > 5) {
      return false;
    }

    await Core.sleep(1500);
    return await depositItemsInBank();
  }
}

async function getBankBoothLocation(draw = false) {
  return new Promise(async (resolve, reject) => {
    try {
      const templateDirectory = "./bots/Dwarf_Mines_Coal_Banking/bank_booth_template";
      const template_paths = Utils.getTemplatesFromDirectory(templateDirectory);

      const croppedImage = await Image.generateCroppedCenterImage();
      const filterColors = [];
      const scale = 0.6;
      const threshold = 0.7;

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

      console.log("getBankBoothLocation: ", adjustedMatches);
      resolve(adjustedMatches);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  goToBankAndBack,
  getBankBoothLocation,
  depositItemsInBank,
  goFromBankToUndergound,
};
