const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../frontend/src/Screens/Faculty/FinalCOPOAttainment.jsx");
const content = fs.readFileSync(filePath, "utf8");
const lines = content.split("\n");

console.log("Lines referencing iaQuestions:");
lines.forEach((line, idx) => {
  if (line.includes("iaQuestions") || line.includes("seeQuestions")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
