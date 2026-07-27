require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.log("Error: GEMINI_API_KEY is not defined in process.env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// A valid minimal base64 PDF representation (blank page)
const samplePdfBase64 = "JVBERi0xLjQKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCjIgMCBvYmoKICA8PCAvVHlwZSAvUGFnZXMKICAgICAvS2lkcyBbIDMgMCBSIF0KICAgICAvQ291bnQgMQogID4+CmVuZG9iagozIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2UKICAgICAvUGFyZW50IDIgMCBSCiAgICAgL1Jlc291cmNlcyA8PCA+PgogICAgIC9NZWRpYUJveCBbIDAgMCA1OTUgODQyIF0KICA+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNzMgMDAwMDAgbiAKMDAwMDAwMDEzNiAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgL1NpemUgNAogICAgIC9Sb290IDEgMCBSCiAgPj4Kc3RhcnR4cmVmCjIzMAolJUVPRgo=";

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      "Analyze this PDF document and describe its format.",
      {
        inlineData: {
          data: samplePdfBase64,
          mimeType: "application/pdf"
        }
      }
    ]);
    console.log("Success! Response from Gemini 2.5 Flash with PDF:");
    console.log(result.response.text());
  } catch (error) {
    console.error("Failed to call Gemini with PDF inlineData:");
    console.error(error);
  }
}

run();
