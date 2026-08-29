const sinon = require("sinon");
const { expect } = require("chai");

// Model
const libraryDetails = require("../../models/Library/details.model.js");

// Controller under test
const {
  getDetails,
  addDetails,
  deleteDetails,
  getCount,
} = require("../../controllers/Library/details.controller.js");

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
// Library details.controller.js — Test Suite
// =============================================================================
describe("Library Details Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // getDetails
  // -------------------------------------------------------------------------
  describe("getDetails", function () {
    it("should return librarian details when found", async function () {
      const mockLibrarians = [{ libraryId: "LIB01", firstName: "Librarian", lastName: "One" }];
      sinon.stub(libraryDetails, "find").resolves(mockLibrarians);

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Librarian Details Found!");
      expect(res.body.user).to.deep.equal(mockLibrarians);
    });

    it("should return 400 when user result is null/falsy", async function () {
      sinon.stub(libraryDetails, "find").resolves(null);

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No Librarian Found");
    });

    it("should return 500 when database query fails", async function () {
      sinon.stub(libraryDetails, "find").rejects(new Error("DB Error"));

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Internal Server Error2");
    });
  });

  // -------------------------------------------------------------------------
  // addDetails
  // -------------------------------------------------------------------------
  describe("addDetails", function () {
    it("should return 400 for invalid phone number format", async function () {
      const req = {
        body: { phoneNumber: "12345", email: "lib@test.com" },
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
          email: "lib@test.com",
          libraryId: "LIB01",
          // missing firstName, lastName, etc.
        },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("All fields are required.");
    });

    it("should return 400 if librarian with libraryId already exists", async function () {
      sinon.stub(libraryDetails, "findOne").resolves({ libraryId: "LIB01" });

      const req = {
        body: {
          phoneNumber: "9876543210",
          email: "lib@test.com",
          libraryId: "LIB01",
          firstName: "John",
          lastName: "Doe",
          gender: "Male",
        },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Librarian with this ID already exists.");
    });

    it("should add librarian details successfully", async function () {
      sinon.stub(libraryDetails, "findOne").resolves(null);
      const newLibrarian = {
        libraryId: "LIB01",
        firstName: "John",
        lastName: "Doe",
        email: "lib@test.com",
        phoneNumber: "9876543210",
        gender: "Male",
      };
      sinon.stub(libraryDetails, "create").resolves(newLibrarian);

      const req = {
        body: newLibrarian,
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Library Details Added!");
      expect(res.body.user).to.deep.equal(newLibrarian);
    });

    it("should return 500 when database creation fails", async function () {
      sinon.stub(libraryDetails, "findOne").rejects(new Error("DB Error"));

      const req = {
        body: {
          phoneNumber: "9876543210",
          email: "lib@test.com",
          libraryId: "LIB01",
          firstName: "John",
          lastName: "Doe",
          gender: "Male",
        },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Internal Server Error");
    });
  });

  // -------------------------------------------------------------------------
  // deleteDetails
  // -------------------------------------------------------------------------
  describe("deleteDetails", function () {
    it("should delete librarian details successfully", async function () {
      sinon.stub(libraryDetails, "findByIdAndDelete").resolves({ id: "l1" });

      const req = { params: { id: "l1" }, body: {} };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Deleted Successfull!");
    });

    it("should return 400 if librarian to delete is not found", async function () {
      sinon.stub(libraryDetails, "findByIdAndDelete").resolves(null);

      const req = { params: { id: "ghost" }, body: {} };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("No Librarian Found");
    });

    it("should return 500 on database error during deletion", async function () {
      sinon.stub(libraryDetails, "findByIdAndDelete").rejects(new Error("DB Error"));

      const req = { params: { id: "l1" }, body: {} };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // getCount
  // -------------------------------------------------------------------------
  describe("getCount", function () {
    it("should return librarian count successfully", async function () {
      sinon.stub(libraryDetails, "count").resolves(5);

      const req = { body: {} };
      const res = mockRes();

      await getCount(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.user).to.equal(5);
      expect(res.body.message).to.equal("Count Successfull!");
    });

    it("should return 500 on error", async function () {
      sinon.stub(libraryDetails, "count").rejects(new Error("DB Error"));

      const req = { body: {} };
      const res = mockRes();

      await getCount(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });
});
