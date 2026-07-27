const axios = require("axios");

async function test() {
  try {
    // 1. Get subjects list to find a valid subject ID
    const url = "http://localhost:5001/api/subject/getSubject";
    console.log(`Fetching subjects from ${url}...`);
    const res = await axios.get(url);
    if (!res.data.success || !res.data.subject || res.data.subject.length === 0) {
      console.log("No subjects found!");
      return;
    }

    const subject = res.data.subject[0];
    const subjectId = subject._id;
    console.log(`Found subject code: ${subject.code}, ID: ${subjectId}`);

    // 2. Fetch CO-PO mappings
    const mappingsUrl = `http://localhost:5001/api/subject/getCoPoMappings/${subjectId}`;
    console.log(`Fetching mappings from ${mappingsUrl}...`);
    try {
      const mapRes = await axios.get(mappingsUrl);
      console.log("Mappings response:", mapRes.data);
    } catch (e) {
      console.log("Mappings error:", e.response ? `${e.response.status} - ${JSON.stringify(e.response.data)}` : e.message);
    }

    // 3. Fetch attainments
    const attainmentsUrl = `http://localhost:5001/api/coattainment/attainments/${subjectId}`;
    console.log(`Fetching attainments from ${attainmentsUrl}...`);
    try {
      const attRes = await axios.get(attainmentsUrl);
      console.log("Attainments response:", attRes.data);
    } catch (e) {
      console.log("Attainments error:", e.response ? `${e.response.status} - ${JSON.stringify(e.response.data)}` : e.message);
    }

  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

test();
