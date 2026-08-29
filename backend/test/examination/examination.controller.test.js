const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Models
const examinationCredential = require("../../models/Examination/credential.model.js");
const examinationDetails = require("../../models/Examination/details.model.js");

// Controllers
const {
  loginHandler,
  registerHandler,
  getAll,
  updateHandler,
  deleteHandler,
} = require("../../controllers/Examination/credential.controller.js");

const {
  getDetails,
  addDetails,
  updateDetails,
  deleteDetails,
  getCount,
} = require("../../controllers/Examination/details.controller.js");

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
// Examination Controllers — Test Suite
// =============================================================================
describe("Examination Controllers", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // Examination Credential Controller
  // -------------------------------------------------------------------------
  describe("Examination Credential Controller", function () {
    describe("loginHandler", function () {
      it("should return 400 when loginid is not found", async function () {
        sinon.stub(examinationCredential, "findOne").resolves(null);

        const req = { body: { loginid: "exam01", password: "password" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal("Wrong Credentials");
      });

      it("should return 400 when password fails", async function () {
        sinon.stub(examinationCredential, "findOne").resolves({
          id: "e1",
          loginid: "exam01",
          password: "hashed_password",
        });
        sinon.stub(bcrypt, "compare").resolves(false);

        const req = { body: { loginid: "exam01", password: "wrong" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal("Wrong Credentials");
      });

      it("should return 200 with JWT token on valid login", async function () {
        sinon.stub(examinationCredential, "findOne").resolves({
          id: "e1",
          loginid: "exam01",
          password: "hashed_password",
        });
        sinon.stub(bcrypt, "compare").resolves(true);
        sinon.stub(jwt, "sign").returns("exam_token");

        const req = { body: { loginid: "exam01", password: "correct" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.token).to.equal("exam_token");
      });

      it("should return 500 on database error", async function () {
        sinon.stub(examinationCredential, "findOne").rejects(new Error("DB error"));

        const req = { body: { loginid: "exam01", password: "password" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(500);
      });
    });

    describe("registerHandler & getAll & update & delete", function () {
      it("should return 400 if user with loginId already exists", async function () {
        sinon.stub(examinationCredential, "findOne").resolves({ loginid: "exam01" });

        const req = { body: { loginid: "exam01", password: "password" } };
        const res = mockRes();

        await registerHandler(req, res);

        expect(res.statusCode).to.equal(400);
      });

      it("should register examination user successfully", async function () {
        sinon.stub(examinationCredential, "findOne").resolves(null);
        sinon.stub(bcrypt, "hash").resolves("hashed_pass");
        sinon.stub(examinationCredential, "create").resolves({ loginid: "exam01", id: "e1" });

        const req = { body: { loginid: "exam01", password: "password" } };
        const res = mockRes();

        await registerHandler(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });

      it("should get all examination users excluding password", async function () {
        sinon.stub(examinationCredential, "find").resolves([{ loginid: "exam01" }]);

        const req = {};
        const res = mockRes();

        await getAll(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.users).to.have.lengthOf(1);
      });

      it("should update examination credential user", async function () {
        sinon.stub(bcrypt, "hash").resolves("hashed_pass");
        sinon.stub(examinationCredential, "findByIdAndUpdate").resolves({ id: "e1" });

        const req = { params: { id: "e1" }, body: { password: "newPass" } };
        const res = mockRes();

        await updateHandler(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });

      it("should delete examination credential user", async function () {
        sinon.stub(examinationCredential, "findByIdAndDelete").resolves({ id: "e1" });

        const req = { params: { id: "e1" } };
        const res = mockRes();

        await deleteHandler(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });
    });
  });

  // -------------------------------------------------------------------------
  // Examination Details Controller
  // -------------------------------------------------------------------------
  describe("Examination Details Controller", function () {
    describe("getDetails", function () {
      it("should return examination records", async function () {
        sinon.stub(examinationDetails, "find").resolves([{ employeeId: "EMP01" }]);

        const req = { body: {} };
        const res = mockRes();

        await getDetails(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });

      it("should return 400 when no records found", async function () {
        sinon.stub(examinationDetails, "find").resolves([]);

        const req = { body: {} };
        const res = mockRes();

        await getDetails(req, res);

        expect(res.statusCode).to.equal(400);
      });
    });

    describe("addDetails", function () {
      it("should return 400 if employeeId is missing", async function () {
        const req = { body: {} };
        const res = mockRes();

        await addDetails(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal("employeeId is required");
      });

      it("should return 400 for invalid phone number", async function () {
        const req = { body: { employeeId: "EMP01", phoneNumber: "123" } };
        const res = mockRes();

        await addDetails(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.include("Invalid phone number");
      });

      it("should return 400 if examination record with employeeId already exists", async function () {
        sinon.stub(examinationDetails, "findOne").resolves({ employeeId: "EMP01" });

        const req = { body: { employeeId: "EMP01", phoneNumber: "9876543210" } };
        const res = mockRes();

        await addDetails(req, res);

        expect(res.statusCode).to.equal(400);
      });

      it("should add examination record with uploaded profile file", async function () {
        sinon.stub(examinationDetails, "findOne").resolves(null);
        sinon.stub(examinationDetails, "create").resolves({ employeeId: "EMP01" });

        const req = {
          body: {
            employeeId: "EMP01",
            phoneNumber: "9876543210",
            firstName: "John",
            lastName: "Doe",
            department: "CSE",
            post: "Exam Cell Incharge",
          },
          file: { path: "uploads/profile.jpg" },
        };
        const res = mockRes();

        await addDetails(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });
    });

    describe("updateDetails, deleteDetails & getCount", function () {
      it("should update examination record details", async function () {
        sinon.stub(examinationDetails, "findByIdAndUpdate").resolves({ id: "ex1" });

        const req = { params: { id: "ex1" }, body: { phoneNumber: "9876543210" } };
        const res = mockRes();

        await updateDetails(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });

      it("should delete examination record", async function () {
        sinon.stub(examinationDetails, "findByIdAndDelete").resolves({ id: "ex1" });

        const req = { params: { id: "ex1" } };
        const res = mockRes();

        await deleteDetails(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });

      it("should get count of examination records", async function () {
        sinon.stub(examinationDetails, "countDocuments").resolves(12);

        const req = { body: {} };
        const res = mockRes();

        await getCount(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.count).to.equal(12);
      });
    });
  });
});
