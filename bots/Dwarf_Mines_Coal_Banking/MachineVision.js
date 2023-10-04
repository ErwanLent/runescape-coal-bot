const { spawn, exec } = require("child_process");
const Jimp = require("jimp");
const { v4: uuidv4 } = require("uuid");

// Core functions
async function findTemplateMatches(
  image,
  templatePaths,
  threshold = 0.8,
  colors = [],
  scale = 0.5,
  stopOnFirstMatch = false
) {
  return new Promise(async (resolve, reject) => {
    const runId = `findTemplateMatches-${uuidv4().substring(0, 8)}`;

    if (templatePaths.length > 0) {
      console.log(templatePaths[0]);
    }

    console.time(runId);

    const pythonArgs = [
      "--templates",
      ...templatePaths,
      "--threshold",
      threshold.toString(),
      "--colors",
      ...colors,
      "--scale",
      scale.toString(),
      stopOnFirstMatch ? "--stop_on_first_match" : null,
    ].filter((arg) => arg !== null);

    const pythonProcess = spawn("python", ["./bots/Dwarf_Mines_Coal_Banking/find_matches.py", ...pythonArgs]);

    let dataString = "";

    const resizedImage = image.clone().resize(Jimp.AUTO, Math.floor(image.getHeight() * scale));
    const imageBuffer = await resizedImage.getBufferAsync(Jimp.MIME_PNG);
    pythonProcess.stdin.write(imageBuffer);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => {
      dataString += data;
    });

    pythonProcess.stdout.on("end", () => {
      const output = JSON.parse(dataString);

      console.timeEnd(runId);
      console.log(`Pre-Filter Polygons: ${output.pre_filter_count}`);

      const scaledMatches = output.filtered_matches.map((match) => ({
        x: Math.round(match.x / scale),
        y: Math.round(match.y / scale),
        w: Math.round(match.w / scale),
        h: Math.round(match.h / scale),
      }));

      resolve(scaledMatches);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.log(data.toString());
      reject(data.toString());
    });
  });
}

async function drawMatches(
  jimpImage,
  templatePath,
  threshold = 0.8,
  colors = [],
  scale = 0.5,
  stopOnFirstMatch = false
) {
  try {
    const matches = await findTemplateMatches(jimpImage, templatePath, threshold, colors, scale, stopOnFirstMatch);
    console.log(matches.length + " matches found");

    for (const match of matches) {
      const { x, y, w, h } = match;
      // Draw the rectangle using Jimp
      for (let i = 0; i < w; i++) {
        jimpImage.setPixelColor(Jimp.rgbaToInt(0, 255, 0, 255), x + i, y);
        jimpImage.setPixelColor(Jimp.rgbaToInt(0, 255, 0, 255), x + i, y + h);
      }
      for (let j = 0; j < h; j++) {
        jimpImage.setPixelColor(Jimp.rgbaToInt(0, 255, 0, 255), x, y + j);
        jimpImage.setPixelColor(Jimp.rgbaToInt(0, 255, 0, 255), x + w, y + j);
      }
    }

    // if (matches.length > 0) {
    //     const outputPath = "output.png";
    //     await jimpImage.writeAsync(outputPath);
    //     exec(`start ${outputPath}`);
    // }

    // return;

    const outputPath = "output.png";
    await jimpImage.writeAsync(outputPath);
    exec(`start ${outputPath}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = {
  findTemplateMatches,
  drawMatches,
};
