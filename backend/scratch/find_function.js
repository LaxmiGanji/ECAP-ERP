const fs = require("fs");
const path = require("path");

const servicePath = path.join(__dirname, "../services/coattainment.service.js");
const content = fs.readFileSync(servicePath, "utf8");
const lines = content.split("\n");

console.log("Lines containing calculatePOAttainments:");
lines.forEach((line, idx) => {
  if (line.includes("calculatePOAttainments")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
