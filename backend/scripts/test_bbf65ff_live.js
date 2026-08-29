const https = require("https");

function testLiveBbf() {
  const data = JSON.stringify({
    role: "Admin",
    loginid: "987654",
    email: "laxmiganji93980@gmail.com"
  });

  console.log("Testing live Render POST request for commit bbf65ff...");

  const req = https.request(
    {
      hostname: "ecap-erp.onrender.com",
      port: 443,
      path: "/api/auth/forgot-password",
      method: "POST",
      timeout: 35000,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    },
    (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        console.log("\n==============================================");
        console.log("RENDER LIVE BBF65FF TEST RESULT:");
        console.log("Status Code:", res.statusCode);
        console.log("Response Body:", body);
        console.log("==============================================\n");
      });
    }
  );

  req.on("error", (e) => console.error("Error:", e.message));
  req.write(data);
  req.end();
}

testLiveBbf();
