const express = require("express");
const app = express();

const router = express.Router();

router.get("/:id", (req, res) => {
  console.log("Matched route /:id with id =", req.params.id);
  res.json({ route: "/:id", id: req.params.id });
});

router.get("/getCoPoMappings/:subjectId", (req, res) => {
  console.log("Matched route /getCoPoMappings/:subjectId with subjectId =", req.params.subjectId);
  res.json({ route: "/getCoPoMappings/:subjectId" });
});

app.use("/api/subject", router);

const requestPath = "/api/subject/getCoPoMappings/123456";
console.log(`Simulating request to ${requestPath}...`);

// Query express router directly using mock request
const mockReq = {
  method: "GET",
  url: requestPath,
  headers: {}
};

const mockRes = {
  statusCode: 200,
  setHeader: () => {},
  end: (data) => {
    console.log("Response sent:", data);
  }
};

app(mockReq, mockRes);
