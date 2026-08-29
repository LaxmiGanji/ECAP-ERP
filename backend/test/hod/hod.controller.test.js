const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Models
const HODCredential = require("../../models/HOD/credential.model.js");
const FacultyDetail = require("../../models/Faculty/details.model.js");
const StudentDetail = require("../../models/Students/details.model.js");
const Notice = require("../../models/Other/notice.model.js");

// Controllers
const { loginHandler, registerHandler } = require("../../controllers/HOD/credential.controller.js");
const {
  getBranchFaculty,
  getBranchStudents,
  getBranchNotices,
} = require("../../controllers/HOD/management.controller.js");

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
// HOD Controllers — Test Suite
// =============================================================================
describe("HOD Controllers", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // HOD Credential Controller
  // -------------------------------------------------------------------------
  describe("HOD Credential Controller", function () {
    describe("loginHandler", function () {
      it("should return 400 when loginid is not found", async function () {
        sinon.stub(HODCredential, "findOne").resolves(null);

        const req = { body: { loginid: "hod_cse", password: "password" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal("Wrong Credentials");
      });

      it("should return 400 when password is wrong", async function () {
        sinon.stub(HODCredential, "findOne").resolves({
          id: "h1",
          loginid: "hod_cse",
          branch: "CSE",
          password: "hashed_password",
        });
        sinon.stub(bcrypt, "compare").resolves(false);

        const req = { body: { loginid: "hod_cse", password: "wrong" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(400);
      });

      it("should return 200 with JWT token on valid login", async function () {
        sinon.stub(HODCredential, "findOne").resolves({
          id: "h1",
          loginid: "hod_cse",
          branch: "CSE",
          password: "hashed_password",
        });
        sinon.stub(bcrypt, "compare").resolves(true);
        sinon.stub(jwt, "sign").returns("hod_token");

        const req = { body: { loginid: "hod_cse", password: "correct" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.branch).to.equal("CSE");
        expect(res.body.token).to.equal("hod_token");
      });

      it("should return 500 on database error", async function () {
        sinon.stub(HODCredential, "findOne").rejects(new Error("DB Error"));

        const req = { body: { loginid: "hod_cse", password: "password" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(500);
      });
    });

    describe("registerHandler", function () {
      it("should return 400 if HOD user already exists", async function () {
        sinon.stub(HODCredential, "findOne").resolves({ loginid: "hod_cse" });

        const req = { body: { loginid: "hod_cse", password: "password", branch: "CSE" } };
        const res = mockRes();

        await registerHandler(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal("HOD With This LoginId Already Exists");
      });

      it("should register HOD user successfully", async function () {
        sinon.stub(HODCredential, "findOne").resolves(null);
        sinon.stub(bcrypt, "hash").resolves("hashed_pass");
        sinon.stub(HODCredential, "create").resolves({ loginid: "hod_cse" });

        const req = { body: { loginid: "hod_cse", password: "password", branch: "CSE" } };
        const res = mockRes();

        await registerHandler(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });

      it("should return 500 on database error", async function () {
        sinon.stub(HODCredential, "findOne").rejects(new Error("DB Error"));

        const req = { body: { loginid: "hod_cse", password: "password" } };
        const res = mockRes();

        await registerHandler(req, res);

        expect(res.statusCode).to.equal(500);
      });
    });
  });

  // -------------------------------------------------------------------------
  // HOD Management Controller
  // -------------------------------------------------------------------------
  describe("HOD Management Controller", function () {
    it("should get branch faculty members", async function () {
      sinon.stub(FacultyDetail, "find").resolves([{ employeeId: "FAC01", department: "CSE" }]);

      const req = { params: { branch: "CSE" } };
      const res = mockRes();

      await getBranchFaculty(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.faculties).to.have.lengthOf(1);
    });

    it("should get branch students", async function () {
      sinon.stub(StudentDetail, "find").resolves([{ enrollmentNo: "EN01", branch: "CSE" }]);

      const req = { params: { branch: "CSE" } };
      const res = mockRes();

      await getBranchStudents(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.students).to.have.lengthOf(1);
    });

    it("should get branch notices", async function () {
      sinon.stub(Notice, "find").resolves([{ title: "Midterm Exam", branch: "CSE" }]);

      const req = { params: { branch: "CSE" } };
      const res = mockRes();

      await getBranchNotices(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.notices).to.have.lengthOf(1);
    });

    it("should return 500 when error occurs", async function () {
      sinon.stub(FacultyDetail, "find").rejects(new Error("DB Error"));

      const req = { params: { branch: "CSE" } };
      const res = mockRes();

      await getBranchFaculty(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });
});
