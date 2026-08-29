const sinon = require("sinon");
const { expect } = require("chai");

// Model
const transportDetails = require("../../models/Transport/details.model.js");

// Controller under test
const {
  getDetails,
  addDetails,
  deleteDetails,
  getCount,
} = require("../../controllers/Transport/details.controller.js");

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
// Transport details.controller.js — Test Suite
// =============================================================================
describe("Transport Details Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // getDetails
  // -------------------------------------------------------------------------
  describe("getDetails", function () {
    it("should return transport incharge details when found", async function () {
      const mockTransport = [{ transportId: "TRP01", firstName: "Driver", lastName: "One" }];
      sinon.stub(transportDetails, "find").resolves(mockTransport);

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Transport details found!");
      expect(res.body.user).to.deep.equal(mockTransport);
    });

    it("should return 400 when user result is null/falsy", async function () {
      sinon.stub(transportDetails, "find").resolves(null);

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No Transport Incharge Found");
    });

    it("should return 500 when database query fails", async function () {
      sinon.stub(transportDetails, "find").rejects(new Error("DB Error"));

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  // addDetails
  // -------------------------------------------------------------------------
  describe("addDetails", function () {
    it("should return 400 for invalid phone number format", async function () {
      const req = {
        body: { phoneNumber: "12345", email: "trp@test.com" },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Invalid phone number");
    });

    it("should return 400 for invalid email format", async function () {
      const req = {
        body: { phoneNumber: "9876543210", email: "invalid-email" },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Invalid email format");
    });

    it("should return 400 if required fields are missing", async function () {
      const req = {
        body: {
          phoneNumber: "9876543210",
          email: "trp@test.com",
          transportId: "TRP01",
          // missing firstName, lastName, gender, etc.
        },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Missing required fields");
    });

    it("should return 400 if transport incharge with transportId already exists", async function () {
      sinon.stub(transportDetails, "findOne").resolves({ transportId: "TRP01" });

      const req = {
        body: {
          phoneNumber: "9876543210",
          email: "trp@test.com",
          transportId: "TRP01",
          firstName: "John",
          lastName: "Doe",
          gender: "Male",
        },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Transport Incharge with this ID already exists.");
    });

    it("should add transport details successfully", async function () {
      sinon.stub(transportDetails, "findOne").resolves(null);
      const newTransport = {
        transportId: "TRP01",
        firstName: "John",
        lastName: "Doe",
        email: "trp@test.com",
        phoneNumber: "9876543210",
        gender: "Male",
      };
      sinon.stub(transportDetails, "create").resolves(newTransport);

      const req = {
        body: newTransport,
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Transport details added!");
      expect(res.body.user).to.deep.equal(newTransport);
    });

    it("should return 500 when database creation fails", async function () {
      sinon.stub(transportDetails, "findOne").rejects(new Error("DB Error"));

      const req = {
        body: {
          phoneNumber: "9876543210",
          email: "trp@test.com",
          transportId: "TRP01",
          firstName: "John",
          lastName: "Doe",
          gender: "Male",
        },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  // deleteDetails
  // -------------------------------------------------------------------------
  describe("deleteDetails", function () {
    it("should delete transport incharge details successfully", async function () {
      sinon.stub(transportDetails, "findByIdAndDelete").resolves({ id: "t1" });

      const req = { params: { id: "t1" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Deleted Successfully!");
    });

    it("should return 400 if transport incharge to delete is not found", async function () {
      sinon.stub(transportDetails, "findByIdAndDelete").resolves(null);

      const req = { params: { id: "ghost" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("No Transport Incharge Found");
    });

    it("should return 500 on database error during deletion", async function () {
      sinon.stub(transportDetails, "findByIdAndDelete").rejects(new Error("DB Error"));

      const req = { params: { id: "t1" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // getCount
  // -------------------------------------------------------------------------
  describe("getCount", function () {
    it("should return count of transport incharges", async function () {
      sinon.stub(transportDetails, "count").resolves(8);

      const req = {};
      const res = mockRes();

      await getCount(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.user).to.equal(8);
      expect(res.body.message).to.equal("Count Successful!");
    });

    it("should return 500 on error", async function () {
      sinon.stub(transportDetails, "count").rejects(new Error("DB Error"));

      const req = {};
      const res = mockRes();

      await getCount(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });
});
