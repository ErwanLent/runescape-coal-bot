const { spawn } = require("child_process");
const Jimp = require("jimp");
const ks = require("node-key-sender");

const Core = require("./Core");

const CHANGE_RATE = 0.085;
const MIN_KEY_PRESS_DURATION = 50; // milliseconds

async function setCamera(target_angle) {
  const current_angle = await getCompassDirection();

  if (current_angle === undefined) {
    console.log("Failed to get compass direction. Trying again...");
    await Core.sleep(500);
    return await setCamera(target_angle);
  }

  // Calculate the shortest direction to turn
  let angle_diff = (target_angle - current_angle + 360) % 360;
  let direction;

  if (angle_diff > 180) {
    angle_diff = 360 - angle_diff;
    direction = "left";
  } else {
    direction = "right";
  }

  // If within 3 degrees of the target angle, stop
  if (Math.abs(angle_diff) <= 3) {
    console.log(`Camera set to approximately ${target_angle} degrees`);
    return;
  }

  // Calculate how long to press the key
  let key_press_duration = Math.min(Math.round(angle_diff / CHANGE_RATE), 2000);

  // Ensure the key press duration is not too short
  if (key_press_duration < MIN_KEY_PRESS_DURATION) {
    key_press_duration = MIN_KEY_PRESS_DURATION;
  }

  ks.setOption("globalDelayPressMillisec", key_press_duration);
  ks.sendKey(direction);

  // Wait for the key press duration plus an additional 300ms
  await Core.sleep(key_press_duration + 300);

  // If we're not at the desired angle yet, adjust the camera again
  return await setCamera(target_angle);
}

async function getCompassDirection() {
  await Core.updateCapture();

  const region = { x: 3346, y: 13, width: 99, height: 98 };
  const croppedImage = CurrentImage.clone().crop(region.x, region.y, region.width, region.height);

  return new Promise((resolve, reject) => {
    try {
      const pythonProcess = spawn("python", ["./bots/Al_Kharid_Smelting/compass_detector.py"]);
      let dataString = "";

      croppedImage.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
        if (err) reject(err);

        pythonProcess.stdin.write(buffer);
        pythonProcess.stdin.end();
      });

      pythonProcess.stdout.on("data", (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        reject(data.toString());
      });

      pythonProcess.on("close", () => {
        resolve(parseFloat(dataString.trim()));
      });
    } catch (error) {
      resolve();
    }
  });
}

module.exports = {
  getCompassDirection,
  setCamera,
};
