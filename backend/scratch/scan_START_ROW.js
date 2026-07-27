const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../controllers/Other/finalAttainment.controller.js");
const content = fs.readFileSync(filePath, "utf8");
const lines = content.split("\n");

console.log("Lines declaring START_ROW:");
lines.forEach((line, idx) => {
  if (line.includes("const START_ROW") || line.includes("let START_ROW")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
