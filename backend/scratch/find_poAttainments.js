const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../frontend/src/Screens/Admin/OBE/CoPoMapping.jsx");
const content = fs.readFileSync(filePath, "utf8");
const lines = content.split("\n");

console.log("Lines containing poAttainments:");
lines.forEach((line, idx) => {
  if (line.includes("poAttainments")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
