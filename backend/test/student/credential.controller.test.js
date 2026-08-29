const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Models
const studentCredential = require("../../models/Students/credential.model.js");
const studentDetails = require("../../models/Students/details.model.js");

// Controller under test
const {
  loginHandler,
  registerHandler,
  updateHandler,
  deleteHandler,
} = require("../../controllers/Student/credential.controller.js");

// ---------- helpers ----------
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
// credential.controller.js  —  Test Suite
// =============================================================================
describe("Student Credential Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // loginHandler
  // -------------------------------------------------------------------------
  describe("loginHandler", function () {
    it("should return 400 when loginid does not exist", async function () {
      sinon.stub(studentCredential, "findOne").resolves(null);

      const req = { body: { loginid: "UNKNOWN", password: "pass123" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 400 when password is incorrect", async function () {
      sinon.stub(studentCredential, "findOne").resolves({
        id: "u1",
        loginid: "STU001",
        password: "$2b$10$hashedpassword",
      });
      sinon.stub(bcrypt, "compare").resolves(false);

      const req = { body: { loginid: "STU001", password: "wrong" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 403 when student has graduated", async function () {
      sinon.stub(studentCredential, "findOne").resolves({
        id: "u1",
        loginid: "STU001",
        password: "$2b$10$hashedpassword",
      });
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon
        .stub(studentDetails, "findOne")
        .resolves({ enrollmentNo: "STU001", isGraduated: true });

      const req = { body: { loginid: "STU001", password: "correct" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(403);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include("Alumni Portal");
    });

    it("should return 200 with token on valid login", async function () {
      sinon.stub(studentCredential, "findOne").resolves({
        id: "u1",
        loginid: "STU001",
        password: "$2b$10$hashedpassword",
      });
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon
        .stub(studentDetails, "findOne")
        .resolves({ enrollmentNo: "STU001", isGraduated: false });
      sinon.stub(jwt, "sign").returns("mock-jwt-token");

      const req = { body: { loginid: "STU001", password: "correct" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Login Successfull!");
      expect(res.body.token).to.equal("mock-jwt-token");
      expect(res.body.loginid).to.equal("STU001");
    });

    it("should return 200 when student record does not exist (non-graduated)", async function () {
      sinon.stub(studentCredential, "findOne").resolves({
        id: "u1",
        loginid: "STU001",
        password: "$2b$10$hashedpassword",
      });
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon.stub(studentDetails, "findOne").resolves(null); // no detail record
      sinon.stub(jwt, "sign").returns("mock-jwt-token");

      const req = { body: { loginid: "STU001", password: "correct" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.token).to.equal("mock-jwt-token");
    });

    it("should return 500 when a database error occurs", async function () {
      sinon
        .stub(studentCredential, "findOne")
        .rejects(new Error("DB failure"));

      const req = { body: { loginid: "STU001", password: "pass" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Internal Server Error");
    });
  });

  // -------------------------------------------------------------------------
  // registerHandler
  // -------------------------------------------------------------------------
  describe("registerHandler", function () {
    it("should register a new user successfully", async function () {
      sinon.stub(studentCredential, "findOne").resolves(null);
      sinon.stub(bcrypt, "hash").resolves("hashed_password");
      sinon.stub(studentCredential, "create").resolves({
        id: "new1",
        loginid: "STU002",
        password: "hashed_password",
      });

      const req = { body: { loginid: "STU002", password: "MyP@ss123" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Register Successfull!");
      expect(res.body.loginid).to.equal("STU002");
    });

    it("should return 400 when loginid already exists", async function () {
      sinon
        .stub(studentCredential, "findOne")
        .resolves({ id: "existing", loginid: "STU002" });

      const req = { body: { loginid: "STU002", password: "MyP@ss123" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include("Already Exists");
    });

    it("should hash the password with salt rounds 10", async function () {
      sinon.stub(studentCredential, "findOne").resolves(null);
      const hashStub = sinon.stub(bcrypt, "hash").resolves("hashed");
      sinon
        .stub(studentCredential, "create")
        .resolves({ id: "n1", loginid: "STU003", password: "hashed" });

      const req = { body: { loginid: "STU003", password: "Raw@1234" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(hashStub.calledOnceWith("Raw@1234", 10)).to.be.true;
    });

    it("should return 500 when a database error occurs", async function () {
      sinon
        .stub(studentCredential, "findOne")
        .rejects(new Error("DB failure"));

      const req = { body: { loginid: "STU002", password: "MyP@ss123" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Internal Server Error");
    });
  });

  // -------------------------------------------------------------------------
  // updateHandler
  // -------------------------------------------------------------------------
  describe("updateHandler", function () {
    it("should update credentials successfully", async function () {
      sinon
        .stub(studentCredential, "findByIdAndUpdate")
        .resolves({ id: "u1", loginid: "STU001" });

      const req = {
        params: { id: "u1" },
        body: { loginid: "STU001_new" },
      };
      const res = mockRes();

      await updateHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Updated Successfull!");
    });

    it("should hash password when password field is provided", async function () {
      const hashStub = sinon.stub(bcrypt, "hash").resolves("new_hashed");
      sinon
        .stub(studentCredential, "findByIdAndUpdate")
        .resolves({ id: "u1" });

      const req = {
        params: { id: "u1" },
        body: { password: "NewP@ss1" },
      };
      const res = mockRes();

      await updateHandler(req, res);

      expect(hashStub.calledOnceWith("NewP@ss1", 10)).to.be.true;
      expect(res.body.success).to.be.true;
    });

    it("should return 400 when user does not exist", async function () {
      sinon.stub(studentCredential, "findByIdAndUpdate").resolves(null);

      const req = {
        params: { id: "nonexistent" },
        body: { loginid: "STU999" },
      };
      const res = mockRes();

      await updateHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No User Exists!");
    });

    it("should return 500 on database error", async function () {
      sinon
        .stub(studentCredential, "findByIdAndUpdate")
        .rejects(new Error("DB"));

      const req = { params: { id: "u1" }, body: {} };
      const res = mockRes();

      await updateHandler(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  // deleteHandler
  // -------------------------------------------------------------------------
  describe("deleteHandler", function () {
    it("should delete user successfully", async function () {
      sinon
        .stub(studentCredential, "findByIdAndDelete")
        .resolves({ id: "u1" });

      const req = { params: { id: "u1" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Deleted Successfull!");
    });

    it("should return 400 when user does not exist", async function () {
      sinon.stub(studentCredential, "findByIdAndDelete").resolves(null);

      const req = { params: { id: "ghost" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No User Exists!");
    });

    it("should return 500 on database error", async function () {
      sinon
        .stub(studentCredential, "findByIdAndDelete")
        .rejects(new Error("DB"));

      const req = { params: { id: "u1" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});
