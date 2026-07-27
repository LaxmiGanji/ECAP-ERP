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
console.log(`Found ${files.length} js/jsx files. Scanning for headers/interceptors...`);

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("headers") || content.includes("token") || content.includes("Authorization")) {
    const relPath = path.relative(srcPath, file);
    if (relPath.includes("index.js") || relPath.includes("App.js") || relPath.includes("baseUrl.js")) {
      console.log(`- ${relPath}`);
    }
  }
});
