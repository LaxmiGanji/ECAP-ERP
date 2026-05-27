const connectToMongo = require("../Database/db");
const Subject = require("../models/Other/subject.model");
const finalAttainmentController = require("../controllers/Other/finalAttainment.controller");
const fs = require("fs");
const path = require("path");

async function debug() {
  await connectToMongo();
  
  // Find a subject
  const subject = await Subject.findOne();
  if (!subject) {
    console.error("No subject found");
    process.exit(1);
  }
  console.log("Found subject:", subject.name, "ID:", subject._id);

  // Read mock files
  const templatePath = path.join(__dirname, "../templates/COPO_TEMPLATE.xlsx");
  const fileBuffer = fs.readFileSync(templatePath);

  // Mock req and res
  const req = {
    body: {
      subjectId: subject._id.toString(),
      results: JSON.stringify({
        coAttainments: [
          { coNumber: "CO1", directAttainment: 2.5, indirectAttainment: 2.0, iaLevel: 2, assignmentLevel: 2, seeLevel: 2, overallAttainment: 2.4 },
          { coNumber: "CO2", directAttainment: 2.0, indirectAttainment: 2.0, iaLevel: 2, assignmentLevel: 2, seeLevel: 2, overallAttainment: 2.0 }
        ],
        poAttainments: [
          { poNumber: "PO1", attainment: 2.0, directAttainment: 2.0, indirectAttainment: 2.0 }
        ]
      }),
      uiData: JSON.stringify({
        cesCounts: {
          CO1: { rating1: 10, rating2: 40, rating3: 30 },
          CO2: { rating1: 5, rating2: 45, rating3: 30 }
        },
        manualIndirect: {
          CO1: 2.5,
          CO2: 2.0
        },
        actionPlan: {
          CO1: { target: 2.5, observation: "obs 1", action: "act 1" },
          CO2: { target: 2.0, observation: "obs 2", action: "act 2" }
        },
        caym1Actions: [
          { action: "cay action", change: "cay change" }
        ],
        poActionPlan: {
          PO1: "po action details"
        }
      })
    },
    files: {
      iaFile: [{ buffer: fileBuffer }],
      seeFile: [{ buffer: fileBuffer }]
    }
  };

  const res = {
    setHeader: (name, val) => console.log(`Header: ${name} = ${val}`),
    end: () => console.log("Response ended successfully!"),
    status: (code) => {
      console.log(`Status set to: ${code}`);
      return {
        json: (data) => console.log("Response JSON:", data)
      };
    }
  };

  try {
    console.log("Invoking exportWithResults...");
    await finalAttainmentController.exportWithResults(req, res);
  } catch (error) {
    console.error("CRITICAL EXPORT ERROR:", error);
  }
  
  process.exit(0);
}

debug();
