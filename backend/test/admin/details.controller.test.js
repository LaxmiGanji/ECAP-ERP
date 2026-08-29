const sinon = require("sinon");
const { expect } = require("chai");

// Model
const adminDetails = require("../../models/Admin/details.model.js");

// Controller under test
const {
  getDetails,
  addDetails,
  updateDetails,
  deleteDetails,
  getCount,
} = require("../../controllers/Admin/details.controller.js");

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
// Admin details.controller.js — Test Suite
// =============================================================================
describe("Admin Details Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // getDetails
  // -------------------------------------------------------------------------
  describe("getDetails", function () {
    it("should return admin details when found", async function () {
      const mockAdmins = [{ employeeId: "ADM01", firstName: "Super", lastName: "User" }];
      sinon.stub(adminDetails, "find").resolves(mockAdmins);

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Admin Details Found!");
      expect(res.body.user).to.deep.equal(mockAdmins);
    });

    it("should return 400 when user result is null/falsy", async function () {
      sinon.stub(adminDetails, "find").resolves(null);

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No Admin Found");
    });

    it("should return 500 when database query fails", async function () {
      sinon.stub(adminDetails, "find").rejects(new Error("DB Error"));

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
        body: { phoneNumber: "12345", email: "admin@test.com" },
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

    it("should return 400 if admin with employeeId already exists", async function () {
      sinon.stub(adminDetails, "findOne").resolves({ employeeId: "ADM01" });

      const req = {
        body: {
          employeeId: "ADM01",
          phoneNumber: "9876543210",
          email: "admin@test.com",
        },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Admin With This EmployeeId Already Exists");
    });

    it("should add admin details successfully without profile image", async function () {
      sinon.stub(adminDetails, "findOne").resolves(null);
      const newAdmin = {
        employeeId: "ADM01",
        phoneNumber: "9876543210",
        email: "admin@test.com",
        profile: null,
      };
      sinon.stub(adminDetails, "create").resolves(newAdmin);

      const req = {
        body: {
          employeeId: "ADM01",
          phoneNumber: "9876543210",
          email: "admin@test.com",
        },
        file: null,
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Admin Details Added!");
      expect(res.body.user).to.deep.equal(newAdmin);
    });

    it("should add admin details with profile picture when file is uploaded", async function () {
      sinon.stub(adminDetails, "findOne").resolves(null);
      const createStub = sinon.stub(adminDetails, "create").resolves({ employeeId: "ADM01" });

      const req = {
        body: {
          employeeId: "ADM01",
          phoneNumber: "9876543210",
          email: "admin@test.com",
        },
        file: { path: "/uploads/admin_pic.jpg" },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(createStub.getCall(0).args[0]).to.have.property("profile", "/uploads/admin_pic.jpg");
      expect(res.statusCode).to.equal(200);
    });

    it("should return 500 when error occurs during creation", async function () {
      sinon.stub(adminDetails, "findOne").rejects(new Error("DB Error"));

      const req = {
        body: {
          employeeId: "ADM01",
          phoneNumber: "9876543210",
          email: "admin@test.com",
        },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Internal Server Error1");
    });
  });

  // -------------------------------------------------------------------------
  // updateDetails
  // -------------------------------------------------------------------------
  describe("updateDetails", function () {
    it("should return 400 for invalid phone number on update", async function () {
      const req = { params: { id: "a1" }, body: { phoneNumber: "000" } };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Invalid phone number");
    });

    it("should return 400 for invalid email format on update", async function () {
      const req = { params: { id: "a1" }, body: { email: "bad_email" } };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Invalid email format");
    });

    it("should update admin details successfully without profile image", async function () {
      sinon.stub(adminDetails, "findByIdAndUpdate").resolves({ id: "a1", firstName: "Updated" });

      const req = {
        params: { id: "a1" },
        body: { firstName: "Updated", phoneNumber: "9876543210", email: "admin@test.com" },
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Updated Successfull!");
    });

    it("should update admin details with profile picture when file is uploaded", async function () {
      const updateStub = sinon.stub(adminDetails, "findByIdAndUpdate").resolves({ id: "a1" });

      const req = {
        params: { id: "a1" },
        body: { firstName: "Updated" },
        file: { path: "/uploads/new_pic.png" },
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(updateStub.getCall(0).args[1]).to.have.property("profile", "/uploads/new_pic.png");
      expect(res.statusCode).to.equal(200);
    });

    it("should return 400 if admin to update is not found", async function () {
      sinon.stub(adminDetails, "findByIdAndUpdate").resolves(null);

      const req = { params: { id: "ghost" }, body: {} };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("No Admin Found");
    });

    it("should return 500 on database error during update", async function () {
      sinon.stub(adminDetails, "findByIdAndUpdate").rejects(new Error("DB Error"));

      const req = { params: { id: "a1" }, body: {} };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // deleteDetails
  // -------------------------------------------------------------------------
  describe("deleteDetails", function () {
    it("should delete admin details successfully", async function () {
      sinon.stub(adminDetails, "findByIdAndDelete").resolves({ id: "a1" });

      const req = { params: { id: "a1" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Deleted Successfull!");
    });

    it("should return 400 if admin to delete is not found", async function () {
      sinon.stub(adminDetails, "findByIdAndDelete").resolves(null);

      const req = { params: { id: "ghost" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("No Admin Found");
    });

    it("should return 500 on database error during deletion", async function () {
      sinon.stub(adminDetails, "findByIdAndDelete").rejects(new Error("DB Error"));

      const req = { params: { id: "a1" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // getCount
  // -------------------------------------------------------------------------
  describe("getCount", function () {
    it("should handle error gracefully and return 500 when studentDetails model reference fails", async function () {
      const req = { body: {} };
      const res = mockRes();

      await getCount(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});
