const sinon = require("sinon");
const { expect } = require("chai");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

// Models
const StudentDetail = require("../models/Students/details.model.js");
const FacultyDetail = require("../models/Faculty/details.model.js");
const AdminDetail = require("../models/Admin/details.model.js");
const ExaminationDetail = require("../models/Examination/details.model.js");
const LibraryDetail = require("../models/Library/details.model.js");
const TransportDetail = require("../models/Transport/details.model.js");

// Controller under test
const { googleLogin } = require("../controllers/googleAuth.controller.js");

// Express res mock helper
function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = sinon.stub().callsFake((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = sinon.stub().callsFake((data) => {
    res.body = data;
    return res;
  });
  return res;
}

// =============================================================================
// Google Auth Controller — Test Suite
// =============================================================================
describe("Google Auth Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  it("should return 400 when no Google credential token is provided", async function () {
    const req = { body: {} };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal("No Google token provided");
  });

  it("should return 400 when Google ticket payload has no email", async function () {
    sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: () => ({}),
    });

    const req = { body: { credential: "no_email_token" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal("Could not retrieve email from Google");
  });

  it("should return 401 when Google user email is not registered in system", async function () {
    sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: () => ({ email: "unregistered@example.com" }),
    });

    sinon.stub(StudentDetail, "findOne").resolves(null);
    sinon.stub(FacultyDetail, "findOne").resolves(null);
    sinon.stub(AdminDetail, "findOne").resolves(null);
    sinon.stub(ExaminationDetail, "findOne").resolves(null);
    sinon.stub(LibraryDetail, "findOne").resolves(null);
    sinon.stub(TransportDetail, "findOne").resolves(null);

    const req = { body: { credential: "valid_google_id_token" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(401);
    expect(res.body.message).to.include("not registered");
  });

  it("should login registered student via Google OAuth", async function () {
    sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: () => ({ email: "student@example.com" }),
    });

    sinon.stub(StudentDetail, "findOne").resolves({
      _id: "s1",
      email: "student@example.com",
      enrollmentNo: "EN01",
    });
    sinon.stub(jwt, "sign").returns("jwt_google_student_token");

    const req = { body: { credential: "valid_google_id_token" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.loginid).to.equal("EN01");
    expect(res.body.role).to.equal("Student");
  });

  it("should login registered faculty via Google OAuth", async function () {
    sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: () => ({ email: "faculty@example.com" }),
    });

    sinon.stub(StudentDetail, "findOne").resolves(null);
    sinon.stub(FacultyDetail, "findOne").resolves({
      _id: "f1",
      email: "faculty@example.com",
      employeeId: "FAC01",
    });
    sinon.stub(jwt, "sign").returns("jwt_google_faculty_token");

    const req = { body: { credential: "valid_google_id_token" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.role).to.equal("Faculty");
  });

  it("should login registered admin via Google OAuth", async function () {
    sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: () => ({ email: "admin@example.com" }),
    });

    sinon.stub(StudentDetail, "findOne").resolves(null);
    sinon.stub(FacultyDetail, "findOne").resolves(null);
    sinon.stub(AdminDetail, "findOne").resolves({
      _id: "a1",
      email: "admin@example.com",
      employeeId: "ADM01",
    });
    sinon.stub(jwt, "sign").returns("jwt_google_admin_token");

    const req = { body: { credential: "valid_google_id_token" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.role).to.equal("Admin");
  });

  it("should login registered examination user via Google OAuth", async function () {
    sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: () => ({ email: "exam@example.com" }),
    });

    sinon.stub(StudentDetail, "findOne").resolves(null);
    sinon.stub(FacultyDetail, "findOne").resolves(null);
    sinon.stub(AdminDetail, "findOne").resolves(null);
    sinon.stub(ExaminationDetail, "findOne").resolves({
      _id: "e1",
      email: "exam@example.com",
      employeeId: "EXM01",
    });
    sinon.stub(jwt, "sign").returns("jwt_google_exam_token");

    const req = { body: { credential: "valid_google_id_token" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.role).to.equal("Examination");
  });

  it("should login registered library user via Google OAuth", async function () {
    sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: () => ({ email: "lib@example.com" }),
    });

    sinon.stub(StudentDetail, "findOne").resolves(null);
    sinon.stub(FacultyDetail, "findOne").resolves(null);
    sinon.stub(AdminDetail, "findOne").resolves(null);
    sinon.stub(ExaminationDetail, "findOne").resolves(null);
    sinon.stub(LibraryDetail, "findOne").resolves({
      _id: "l1",
      email: "lib@example.com",
      employeeId: "LIB01",
    });
    sinon.stub(jwt, "sign").returns("jwt_google_lib_token");

    const req = { body: { credential: "valid_google_id_token" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.role).to.equal("Library");
  });

  it("should login registered transport user via Google OAuth", async function () {
    sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: () => ({ email: "trp@example.com" }),
    });

    sinon.stub(StudentDetail, "findOne").resolves(null);
    sinon.stub(FacultyDetail, "findOne").resolves(null);
    sinon.stub(AdminDetail, "findOne").resolves(null);
    sinon.stub(ExaminationDetail, "findOne").resolves(null);
    sinon.stub(LibraryDetail, "findOne").resolves(null);
    sinon.stub(TransportDetail, "findOne").resolves({
      _id: "t1",
      email: "trp@example.com",
      employeeId: "TRP01",
    });
    sinon.stub(jwt, "sign").returns("jwt_google_trp_token");

    const req = { body: { credential: "valid_google_id_token" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.role).to.equal("Transport");
  });

  it("should return 500 when Google ID token verification fails", async function () {
    sinon.stub(OAuth2Client.prototype, "verifyIdToken").rejects(new Error("Invalid Token"));

    const req = { body: { credential: "invalid_google_id_token" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.statusCode).to.equal(500);
    expect(res.body.message).to.include("Internal Server Error");
  });
});
