const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "../../frontend/src");

function walk(dir, results = []) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath, results);
    } else {
      if (file.endsWith(".jsx") || file.endsWith(".js")) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walk(srcPath);
console.log(`Found ${files.length} js/jsx files. Scanning for 'getSubjectsByBranch'...`);

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("getSubjectsByBranch")) {
    const relPath = path.relative(srcPath, file);
    console.log(`- ${relPath}`);
  }
});
