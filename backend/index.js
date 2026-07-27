//index.js
const connectToMongo = require("./Database/db");
const express = require("express");
const app = express();
const path = require("path")
connectToMongo();

const port = process.env.PORT || 5001;

const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { authenticateToken } = require("./middlewares/auth.middleware");

// Security Headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Increased to allow bulk imports (each student takes 2 requests)
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use(limiter);

// Protect against NoSQL injection
app.use(mongoSanitize());

// Allow ALL origins for now to resolve the persistent CORS issues on Render
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.send("Hello 👋 ECAP SPHN Backend is Working Fine 🚀")
})

app.use('/media', express.static(path.join(__dirname, 'media')));

// Credential Apis
app.use("/api/student/auth", require("./routes/Student Api/credential.route"));
app.use("/api/faculty/auth", require("./routes/Faculty Api/credential.route"));
app.use("/api/admin/auth", require("./routes/Admin Api/credential.route"));
app.use("/api/library/auth", require("./routes/Library Api/credential.route"));
app.use("/api/transport/auth", require("./routes/Transport Api/credential.route"));
app.use("/api/examination/auth", require("./routes/Examination Api/credential.route"));
app.use("/api/placement/auth", require("./routes/Placement Api/credential.route"));
app.use("/api/hod/auth", require("./routes/HOD Api/credential.route"));
app.use("/api/principal/auth", require("./routes/Principal Api/credential.route"));
app.use("/api/hod/management", require("./routes/HOD Api/management.route"));
app.use("/api/accounts/auth", require("./routes/Accounts Api/credential.route"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/parent", require("./routes/Other Api/parentPortal.route"));

app.use(authenticateToken);

// Details Apis
app.use("/api/student/details", require("./routes/Student Api/details.route"));
app.use("/api/student/detain", require("./routes/Student Api/detain.route"));
app.use("/api/faculty/details", require("./routes/Faculty Api/details.route"));
app.use("/api/admin/details", require("./routes/Admin Api/details.route"));
app.use("/api/library/details", require("./routes/Library Api/details.route"));
app.use("/api/transport/details", require("./routes/Transport Api/details.route"));
app.use("/api/examination/details", require("./routes/Examination Api/details.route"));
app.use("/api/placement/details", require("./routes/Placement Api/details.route"));

// Other Apis
app.use("/api/timetable", require("./routes/Other Api/timetable.route"));
app.use("/api/material", require("./routes/Other Api/material.route"));
app.use("/api/notice", require("./routes/Other Api/notice.route"));
app.use("/api/subject", require("./routes/Other Api/subject.route"));
app.use("/api/marks", require("./routes/Other Api/marks.route"));
app.use("/api/branch", require("./routes/Other Api/branch.route"));
app.use("/api/library", require("./routes/Other Api/library.route"));
app.use("/api/library/rag", require("./routes/Other Api/rag.route"));
app.use("/api/rag", require("./routes/Other Api/rag.route"));
app.use("/api/newspaper", require("./routes/Other Api/newspaper.route"));
app.use("/api/attendence", require("./routes/Other Api/attedence.route"));
app.use('/api/compiler', require("./routes/Other Api/compiler.route"));
app.use("/api/ai", require("./routes/Other Api/ai.route"));
app.use('/api/transport', require("./routes/Other Api/transport.route"));
app.use('/api/po', require("./routes/Other Api/po.route"));
app.use('/api/download', require("./routes/Other Api/download.route"));
app.use('/api/obe/template/final-copo', require("./routes/Other Api/finalAttainment.route"));
app.use('/api/coattainment', require("./routes/Other Api/coattainment.routes"));
app.use("/api/accounts/attendance", require("./routes/Accounts Api/attendance.route"));
app.use("/api/biometric-attendance", require("./routes/Other Api/biometricAttendance.route"));
app.use("/api/faculty/leave", require("./routes/Faculty Api/leave.route"));
app.use("/api/placement/companies", require("./routes/Placement Api/company.route"));
app.use("/api/placement/drives", require("./routes/Placement Api/drive.route"));
app.use("/api/placement/applications", require("./routes/Placement Api/application.route"));
app.use("/api/placement/training", require("./routes/Placement Api/training.route"));
app.use("/api/student/placement", require("./routes/Student Api/placement.route"));
app.use("/api/notification", require("./routes/Other Api/notification.route"));
app.use("/api/parent-message", require("./routes/Other Api/parentMessage.route"));

// Initialize Automated Cron Jobs
const { initAbsentCron } = require("./scripts/absentCron.job");
initAbsentCron();

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});