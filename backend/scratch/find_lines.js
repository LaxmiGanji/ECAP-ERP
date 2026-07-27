const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../controllers/Other/finalAttainment.controller.js");
const content = fs.readFileSync(filePath, "utf8");
const lines = content.split("\n");

console.log("Searching for keywords...");
lines.forEach((line, idx) => {
  if (line.includes("exports.uploadAndCalculate") || line.includes("exports.exportWithResults")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
