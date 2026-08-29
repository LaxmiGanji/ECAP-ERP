const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Model
const PrincipalCredential = require("../../models/Principal/credential.model.js");

// Controller under test
const { loginHandler, registerHandler } = require("../../controllers/Principal/credential.controller.js");

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
// Principal Credential Controller — Test Suite
// =============================================================================
describe("Principal Credential Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  describe("loginHandler", function () {
    it("should return 400 when loginid is not found", async function () {
      sinon.stub(PrincipalCredential, "findOne").resolves(null);

      const req = { body: { loginid: "prn01", password: "password" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 400 when password is wrong", async function () {
      sinon.stub(PrincipalCredential, "findOne").resolves({
        id: "p1",
        loginid: "prn01",
        password: "hashed_password",
      });
      sinon.stub(bcrypt, "compare").resolves(false);

      const req = { body: { loginid: "prn01", password: "wrong" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should return 200 with JWT token on valid login", async function () {
      sinon.stub(PrincipalCredential, "findOne").resolves({
        id: "p1",
        loginid: "prn01",
        password: "hashed_password",
      });
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon.stub(jwt, "sign").returns("principal_token");

      const req = { body: { loginid: "prn01", password: "correct" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.token).to.equal("principal_token");
    });

    it("should return 500 on database error", async function () {
      sinon.stub(PrincipalCredential, "findOne").rejects(new Error("DB Error"));

      const req = { body: { loginid: "prn01", password: "password" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  describe("registerHandler", function () {
    it("should return 400 if principal user already exists", async function () {
      sinon.stub(PrincipalCredential, "findOne").resolves({ loginid: "prn01" });

      const req = { body: { loginid: "prn01", password: "password" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should register principal user successfully", async function () {
      sinon.stub(PrincipalCredential, "findOne").resolves(null);
      sinon.stub(bcrypt, "hash").resolves("hashed_pass");
      sinon.stub(PrincipalCredential, "create").resolves({ loginid: "prn01" });

      const req = { body: { loginid: "prn01", password: "password" } };
      const res = mockRes();

      await registerHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });
});
