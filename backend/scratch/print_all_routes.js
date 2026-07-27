const fs = require("fs");
const path = require("path");
const express = require("express");

// Load index.js content
const indexContent = fs.readFileSync(path.join(__dirname, "../index.js"), "utf8");

// Create a mock connectToMongo that does nothing
const mockDb = () => { console.log("Mock database connected"); };
const mockMiddlewares = {
  authenticateToken: (req, res, next) => next()
};

// Create a script to evaluate routes setup
const app = express();

// Register the route paths manually by inspecting index.js app.use lines
const routeLines = indexContent.split("\n").filter(line => line.includes("app.use("));

console.log("Analyzing Express routes from index.js:\n");
routeLines.forEach(line => {
  console.log(`- ${line.trim()}`);
});

console.log("\nInspecting subject.route.js:");
const subjectRouteContent = fs.readFileSync(path.join(__dirname, "../routes/Other Api/subject.route.js"), "utf8");
console.log(subjectRouteContent);
