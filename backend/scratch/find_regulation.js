const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../controllers/Other/finalAttainment.controller.js");
const content = fs.readFileSync(filePath, "utf8");
const lines = content.split("\n");

console.log("Lines containing 'studentDetails' or 'Student':");
lines.forEach((line, idx) => {
  if (line.includes("studentDetails") || line.includes("Student")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
