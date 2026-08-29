const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Model
const libraryCredential = require("../../models/Library/credential.model.js");

// Controller under test
const {
  loginHandler,
  registerHandler,
  updateHandler,
  deleteHandler,
} = require("../../controllers/Library/credential.controller.js");

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
// Library credential.controller.js — Test Suite
// =============================================================================
describe("Library Credential Controller", function () {
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
      sinon.stub(libraryCredential, "findOne").resolves(null);

      const req = { body: { loginid: "LIB001", password: "libPassword" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 400 when password comparison fails", async function () {
      sinon.stub(libraryCredential, "findOne").resolves({
        id: "l1",
        loginid: "LIB001",
        password: "$2b$10$hashedpass",
      });
      sinon.stub(bcrypt, "compare").resolves(false);

      const req = { body: { loginid: "LIB001", password: "wrongPassword" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 200 with JWT token on valid credentials", async function () {
      sinon.stub(libraryCredential, "findOne").resolves({
        id: "l1",
        loginid: "LIB001",
        password: "$2b$10$hashedpass",
      });
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon.stub(jwt, "sign").returns("jwt_library_token");

      const req = { body: { loginid: "LIB001", password: "correctPassword" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Login Successfull!");
      expect(res.body.token).to.equal("jwt_library_token");
      expect(res.body.loginid).to.equal("LIB001");
      expect(res.body.id).to.equal("l1");
    });

    it("should return 500 when database error occurs during login", async function () {
      sinon.stub(libraryCredential, "findOne").rejects(new Error("DB Error"));

      const req = { body: { loginid: "LIB001", password: "password" } };
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
    it("should register a new librarian user successfully", async function () {
      sinon.stub(libraryCredential, "findOne").resolves(null);
      sinon.stub(bcrypt, "hash").resolves("new_hashed_password");
      sinon.stub(libraryCredential, "create").resolves({
        id: "l2",
        loginid: "LIB002",
        password: "new_hashed_password",
      });

      const req = { body: { loginid: "LIB002", password: "libPass123!" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Register Successfull!");
      expect(res.body.loginid).to.equal("LIB002");
      expect(res.body.id).to.equal("l2");
    });

    it("should return 400 if user with loginId already exists", async function () {
      sinon.stub(libraryCredential, "findOne").resolves({
        id: "l2",
        loginid: "LIB002",
      });

      const req = { body: { loginid: "LIB002", password: "libPass123!" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Admin With This LoginId Already Exists");
    });

    it("should return 500 when database error occurs during registration", async function () {
      sinon.stub(libraryCredential, "findOne").rejects(new Error("DB Error"));

      const req = { body: { loginid: "LIB002", password: "password" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  // updateHandler
  // -------------------------------------------------------------------------
  describe("updateHandler", function () {
    it("should update librarian credentials successfully without changing password", async function () {
      sinon.stub(libraryCredential, "findByIdAndUpdate").resolves({
        id: "l1",
        loginid: "LIB001_UPDATED",
      });

      const req = { params: { id: "l1" }, body: { loginid: "LIB001_UPDATED" } };
      const res = mockRes();

      await updateHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Updated Successfull!");
    });

    it("should hash password if password field is provided in update", async function () {
      const hashStub = sinon.stub(bcrypt, "hash").resolves("new_hashed_password");
      sinon.stub(libraryCredential, "findByIdAndUpdate").resolves({ id: "l1" });

      const req = { params: { id: "l1" }, body: { password: "newLibPass123!" } };
      const res = mockRes();

      await updateHandler(req, res);

      expect(hashStub.calledOnceWith("newLibPass123!", 10)).to.be.true;
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should return 400 if librarian to update is not found", async function () {
      sinon.stub(libraryCredential, "findByIdAndUpdate").resolves(null);

      const req = { params: { id: "ghost" }, body: { loginid: "LIB999" } };
      const res = mockRes();

      await updateHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No Librarian Exists!");
    });

    it("should return 500 when database error occurs during update", async function () {
      sinon.stub(libraryCredential, "findByIdAndUpdate").rejects(new Error("DB Error"));

      const req = { params: { id: "l1" }, body: {} };
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
    it("should delete librarian user successfully", async function () {
      sinon.stub(libraryCredential, "findByIdAndDelete").resolves({ id: "l1" });

      const req = { params: { id: "l1" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Deleted Successfull!");
    });

    it("should return 400 if librarian to delete is not found", async function () {
      sinon.stub(libraryCredential, "findByIdAndDelete").resolves(null);

      const req = { params: { id: "nonexistent" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No Admin Exists!");
    });

    it("should return 500 when database error occurs on deletion", async function () {
      sinon.stub(libraryCredential, "findByIdAndDelete").rejects(new Error("DB Error"));

      const req = { params: { id: "l1" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});
