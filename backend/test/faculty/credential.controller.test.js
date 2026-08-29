const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Model
const facultyCredential = require("../../models/Faculty/credential.model.js");

// Controller under test
const {
  loginHandler,
  registerHandler,
  updateHandler,
  deleteHandler,
} = require("../../controllers/Faculty/credential.controller.js");

// Helper mock for Express response
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
// Faculty credential.controller.js — Test Suite
// =============================================================================
describe("Faculty Credential Controller", function () {
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
      sinon.stub(facultyCredential, "findOne").resolves(null);

      const req = { body: { loginid: "FAC001", password: "password123" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 400 when password comparison fails", async function () {
      sinon.stub(facultyCredential, "findOne").resolves({
        id: "f1",
        loginid: "FAC001",
        password: "$2b$10$hashedpass",
      });
      sinon.stub(bcrypt, "compare").resolves(false);

      const req = { body: { loginid: "FAC001", password: "wrongpassword" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 200 with JWT token on valid credentials", async function () {
      sinon.stub(facultyCredential, "findOne").resolves({
        id: "f1",
        loginid: "FAC001",
        password: "$2b$10$hashedpass",
      });
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon.stub(jwt, "sign").returns("jwt_faculty_token");

      const req = { body: { loginid: "FAC001", password: "correctpassword" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Login Successfull!");
      expect(res.body.token).to.equal("jwt_faculty_token");
      expect(res.body.loginid).to.equal("FAC001");
      expect(res.body.id).to.equal("f1");
    });

    it("should return 500 when database throws an error", async function () {
      sinon.stub(facultyCredential, "findOne").rejects(new Error("DB Connection Error"));

      const req = { body: { loginid: "FAC001", password: "password" } };
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
    it("should register a new faculty user successfully", async function () {
      sinon.stub(facultyCredential, "findOne").resolves(null);
      sinon.stub(bcrypt, "hash").resolves("new_hashed_password");
      sinon.stub(facultyCredential, "create").resolves({
        id: "f2",
        loginid: "FAC002",
        password: "new_hashed_password",
      });

      const req = { body: { loginid: "FAC002", password: "pass123Word!" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Register Successfull!");
      expect(res.body.loginid).to.equal("FAC002");
      expect(res.body.id).to.equal("f2");
    });

    it("should return 400 if user with loginId already exists", async function () {
      sinon.stub(facultyCredential, "findOne").resolves({
        id: "f2",
        loginid: "FAC002",
      });

      const req = { body: { loginid: "FAC002", password: "pass123Word!" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("User With This LoginId Already Exists");
    });

    it("should return 500 when database throws error on registration", async function () {
      sinon.stub(facultyCredential, "findOne").rejects(new Error("DB Error"));

      const req = { body: { loginid: "FAC002", password: "password" } };
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
    it("should update user successfully without changing password", async function () {
      sinon.stub(facultyCredential, "findByIdAndUpdate").resolves({
        id: "f1",
        loginid: "FAC001_UPDATED",
      });

      const req = { params: { id: "f1" }, body: { loginid: "FAC001_UPDATED" } };
      const res = mockRes();

      await updateHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Updated Successfull!");
    });

    it("should hash password if password field is present in update payload", async function () {
      const hashStub = sinon.stub(bcrypt, "hash").resolves("hashed_new_pass");
      sinon.stub(facultyCredential, "findByIdAndUpdate").resolves({ id: "f1" });

      const req = { params: { id: "f1" }, body: { password: "newPassword123" } };
      const res = mockRes();

      await updateHandler(req, res);

      expect(hashStub.calledOnceWith("newPassword123", 10)).to.be.true;
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should return 400 if user to update is not found", async function () {
      sinon.stub(facultyCredential, "findByIdAndUpdate").resolves(null);

      const req = { params: { id: "nonexistent" }, body: { loginid: "X" } };
      const res = mockRes();

      await updateHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No User Exists!");
    });

    it("should return 500 when database error occurs during update", async function () {
      sinon.stub(facultyCredential, "findByIdAndUpdate").rejects(new Error("DB Fail"));

      const req = { params: { id: "f1" }, body: {} };
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
    it("should delete faculty user successfully", async function () {
      sinon.stub(facultyCredential, "findByIdAndDelete").resolves({ id: "f1" });

      const req = { params: { id: "f1" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Deleted Successfull!");
    });

    it("should return 400 if user to delete is not found", async function () {
      sinon.stub(facultyCredential, "findByIdAndDelete").resolves(null);

      const req = { params: { id: "invalid" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No User Exists!");
    });

    it("should return 500 when database error occurs on deletion", async function () {
      sinon.stub(facultyCredential, "findByIdAndDelete").rejects(new Error("DB Exception"));

      const req = { params: { id: "f1" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});
