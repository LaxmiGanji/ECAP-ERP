require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("Checking API Key: ", process.env.GEMINI_API_KEY ? "PRESENT (length: " + process.env.GEMINI_API_KEY.length + ")" : "MISSING");

if (!process.env.GEMINI_API_KEY) {
  console.log("Error: GEMINI_API_KEY is not defined in process.env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Respond with 'Gemini 2.5 Flash is working!' if you can read this.");
    console.log("Success! Response from Gemini 2.5 Flash:");
    console.log(result.response.text());
  } catch (error) {
    console.error("Failed to connect or authenticate to Gemini 2.5 Flash:");
    console.error(error);
  }
}

run();
