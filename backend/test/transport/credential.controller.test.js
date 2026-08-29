const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Model
const transportCredential = require("../../models/Transport/credential.model.js");

// Controller under test
const {
  loginHandler,
  registerHandler,
  updateHandler,
  deleteHandler,
} = require("../../controllers/Transport/credential.controller.js");

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
// Transport credential.controller.js — Test Suite
// =============================================================================
describe("Transport Credential Controller", function () {
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
      sinon.stub(transportCredential, "findOne").resolves(null);

      const req = { body: { loginid: "TRP001", password: "trpPassword" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 400 when password comparison fails", async function () {
      sinon.stub(transportCredential, "findOne").resolves({
        id: "t1",
        loginid: "TRP001",
        password: "$2b$10$hashedpass",
      });
      sinon.stub(bcrypt, "compare").resolves(false);

      const req = { body: { loginid: "TRP001", password: "wrongPassword" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 200 with JWT token on valid credentials", async function () {
      sinon.stub(transportCredential, "findOne").resolves({
        id: "t1",
        loginid: "TRP001",
        password: "$2b$10$hashedpass",
      });
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon.stub(jwt, "sign").returns("jwt_transport_token");

      const req = { body: { loginid: "TRP001", password: "correctPassword" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Login Successful!");
      expect(res.body.token).to.equal("jwt_transport_token");
      expect(res.body.loginid).to.equal("TRP001");
      expect(res.body.id).to.equal("t1");
    });

    it("should return 500 when database error occurs during login", async function () {
      sinon.stub(transportCredential, "findOne").rejects(new Error("DB Error"));

      const req = { body: { loginid: "TRP001", password: "password" } };
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
    it("should register a new transport user successfully", async function () {
      sinon.stub(transportCredential, "findOne").resolves(null);
      sinon.stub(bcrypt, "hash").resolves("new_hashed_password");
      sinon.stub(transportCredential, "create").resolves({
        id: "t2",
        loginid: "TRP002",
        password: "new_hashed_password",
      });

      const req = { body: { loginid: "TRP002", password: "trpPass123!" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Register Successful!");
      expect(res.body.loginid).to.equal("TRP002");
      expect(res.body.id).to.equal("t2");
    });

    it("should return 400 if transport user with loginId already exists", async function () {
      sinon.stub(transportCredential, "findOne").resolves({
        id: "t2",
        loginid: "TRP002",
      });

      const req = { body: { loginid: "TRP002", password: "trpPass123!" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include("already exists");
    });

    it("should return 500 when database error occurs during registration", async function () {
      sinon.stub(transportCredential, "findOne").rejects(new Error("DB Error"));

      const req = { body: { loginid: "TRP002", password: "password" } };
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
    it("should update transport credentials successfully without changing password", async function () {
      sinon.stub(transportCredential, "findByIdAndUpdate").resolves({
        id: "t1",
        loginid: "TRP001_UPDATED",
      });

      const req = { params: { id: "t1" }, body: { loginid: "TRP001_UPDATED" } };
      const res = mockRes();

      await updateHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Updated Successfully!");
    });

    it("should hash password if password field is provided in update", async function () {
      const hashStub = sinon.stub(bcrypt, "hash").resolves("new_hashed_password");
      sinon.stub(transportCredential, "findByIdAndUpdate").resolves({ id: "t1" });

      const req = { params: { id: "t1" }, body: { password: "newTrpPass123!" } };
      const res = mockRes();

      await updateHandler(req, res);

      expect(hashStub.calledOnceWith("newTrpPass123!", 10)).to.be.true;
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should return 400 if transport incharge to update is not found", async function () {
      sinon.stub(transportCredential, "findByIdAndUpdate").resolves(null);

      const req = { params: { id: "ghost" }, body: { loginid: "TRP999" } };
      const res = mockRes();

      await updateHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No Transport Incharge Exists!");
    });

    it("should return 500 when database error occurs during update", async function () {
      sinon.stub(transportCredential, "findByIdAndUpdate").rejects(new Error("DB Error"));

      const req = { params: { id: "t1" }, body: {} };
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
    it("should delete transport incharge user successfully", async function () {
      sinon.stub(transportCredential, "findByIdAndDelete").resolves({ id: "t1" });

      const req = { params: { id: "t1" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Deleted Successfully!");
    });

    it("should return 400 if transport incharge to delete is not found", async function () {
      sinon.stub(transportCredential, "findByIdAndDelete").resolves(null);

      const req = { params: { id: "nonexistent" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No Transport Incharge Exists!");
    });

    it("should return 500 when database error occurs on deletion", async function () {
      sinon.stub(transportCredential, "findByIdAndDelete").rejects(new Error("DB Error"));

      const req = { params: { id: "t1" } };
      const res = mockRes();

      await deleteHandler(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});
