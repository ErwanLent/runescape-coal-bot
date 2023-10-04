const fs = require("fs");
const path = require("path");

function getCenterCoordinates(obj) {
  return {
    ...obj,
    x: obj.x + Math.floor(obj.w / 2),
    y: obj.y + Math.floor(obj.h / 2),
  };
}

function getRandomNumberBetween(min = 700, max = 2500) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTemplatesFromDirectory(directoryPath) {
  return fs
    .readdirSync(directoryPath)
    .filter((filename) => path.extname(filename).toLowerCase() === ".png")
    .map((filename) => path.join(directoryPath, filename));
}

module.exports = {
  getCenterCoordinates,
  getRandomNumberBetween,
  getTemplatesFromDirectory,
};
