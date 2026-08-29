const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Model
const alumniCredential = require("../../models/Alumni/credential.model.js");

// Controller under test
const { loginHandler } = require("../../controllers/Alumni/credential.controller.js");

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
// Alumni Credential Controller — Test Suite
// =============================================================================
describe("Alumni Credential Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  describe("loginHandler", function () {
    it("should return 400 when loginid is not found", async function () {
      sinon.stub(alumniCredential, "findOne").resolves(null);

      const req = { body: { loginid: "alum01", password: "password" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 400 when password is wrong", async function () {
      sinon.stub(alumniCredential, "findOne").resolves({
        id: "a1",
        loginid: "alum01",
        password: "hashed_password",
      });
      sinon.stub(bcrypt, "compare").resolves(false);

      const req = { body: { loginid: "alum01", password: "wrong" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Wrong Credentials");
    });

    it("should return 200 with JWT token on valid login", async function () {
      sinon.stub(alumniCredential, "findOne").resolves({
        id: "a1",
        loginid: "alum01",
        enrollmentNo: "EN01",
        password: "hashed_password",
      });
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon.stub(jwt, "sign").returns("alumni_jwt_token");

      const req = { body: { loginid: "alum01", password: "correct" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.token).to.equal("alumni_jwt_token");
      expect(res.body.enrollmentNo).to.equal("EN01");
    });

    it("should return 500 on database error", async function () {
      sinon.stub(alumniCredential, "findOne").rejects(new Error("DB Error"));

      const req = { body: { loginid: "alum01", password: "password" } };
      const res = mockRes();

      await loginHandler(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});
