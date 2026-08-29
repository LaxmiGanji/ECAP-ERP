const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Models
const AccountsCredential = require("../../models/Accounts/credential.model.js");
const AttendanceConfig = require("../../models/Accounts/attendanceConfig.model.js");
const FacultyAttendance = require("../../models/Accounts/facultyAttendance.model.js");
const FacultyDetail = require("../../models/Faculty/details.model.js");
const FacultyLeave = require("../../models/Faculty/leave.model.js");

// Controllers
const {
  loginHandler,
  registerHandler,
} = require("../../controllers/Accounts/credential.controller.js");

const {
  setMonthlyConfig,
  getMonthlyConfig,
  updateFacultyAttendance,
  getAllFacultyAttendance,
  getFacultyAttendanceStats,
} = require("../../controllers/Accounts/attendance.controller.js");

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
// Accounts Controllers — Test Suite
// =============================================================================
describe("Accounts Controllers", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // Accounts Credential Controller
  // -------------------------------------------------------------------------
  describe("Accounts Credential Controller", function () {
    describe("loginHandler", function () {
      it("should return 400 when loginid is not found", async function () {
        sinon.stub(AccountsCredential, "findOne").resolves(null);

        const req = { body: { loginid: "acc01", password: "pass" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal("Wrong Credentials");
      });

      it("should return 400 when password comparison fails", async function () {
        sinon.stub(AccountsCredential, "findOne").resolves({
          id: "a1",
          loginid: "acc01",
          password: "hashed_password",
        });
        sinon.stub(bcrypt, "compare").resolves(false);

        const req = { body: { loginid: "acc01", password: "wrong" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal("Wrong Credentials");
      });

      it("should return 200 with token on valid login", async function () {
        sinon.stub(AccountsCredential, "findOne").resolves({
          id: "a1",
          loginid: "acc01",
          password: "hashed_password",
        });
        sinon.stub(bcrypt, "compare").resolves(true);
        sinon.stub(jwt, "sign").returns("mock_token");

        const req = { body: { loginid: "acc01", password: "correct" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.token).to.equal("mock_token");
      });

      it("should return 500 on database error", async function () {
        sinon.stub(AccountsCredential, "findOne").rejects(new Error("DB error"));

        const req = { body: { loginid: "acc01", password: "pass" } };
        const res = mockRes();

        await loginHandler(req, res);

        expect(res.statusCode).to.equal(500);
      });
    });

    describe("registerHandler", function () {
      it("should return 400 if accounts user already exists", async function () {
        sinon.stub(AccountsCredential, "findOne").resolves({ loginid: "acc01" });

        const req = { body: { loginid: "acc01", password: "pass" } };
        const res = mockRes();

        await registerHandler(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal("Accounts User Already Exists");
      });

      it("should register accounts user successfully", async function () {
        sinon.stub(AccountsCredential, "findOne").resolves(null);
        sinon.stub(bcrypt, "hash").resolves("hashed_pass");
        sinon.stub(AccountsCredential, "create").resolves({ loginid: "acc01" });

        const req = { body: { loginid: "acc01", password: "pass" } };
        const res = mockRes();

        await registerHandler(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });

      it("should return 500 on database error", async function () {
        sinon.stub(AccountsCredential, "findOne").rejects(new Error("DB error"));

        const req = { body: { loginid: "acc01", password: "pass" } };
        const res = mockRes();

        await registerHandler(req, res);

        expect(res.statusCode).to.equal(500);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Accounts Attendance Controller
  // -------------------------------------------------------------------------
  describe("Accounts Attendance Controller", function () {
    describe("setMonthlyConfig", function () {
      it("should set monthly config and recalculate faculty attendance", async function () {
        sinon.stub(AttendanceConfig, "findOneAndUpdate").resolves({ month: 8, year: 2026 });
        sinon.stub(FacultyDetail, "find").resolves([
          { employeeId: "FAC01" },
        ]);
        sinon.stub(FacultyLeave, "find")
          .onFirstCall().resolves([
            { dates: ["2026-08-10"], leaveType: "Casual Leave" },
          ])
          .onSecondCall().resolves([
            { dates: ["2026-08-15"], leaveType: "Optional Leave" },
          ]);
        sinon.stub(FacultyAttendance, "findOneAndUpdate").resolves({});

        const req = {
          body: {
            month: 8,
            year: 2026,
            totalWorkingDays: 22,
            globalHolidays: [{ date: "2026-08-15" }],
          },
        };
        const res = mockRes();

        await setMonthlyConfig(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });

      it("should return 500 on database error", async function () {
        sinon.stub(AttendanceConfig, "findOneAndUpdate").rejects(new Error("DB Error"));

        const req = { body: { month: 8, year: 2026 } };
        const res = mockRes();

        await setMonthlyConfig(req, res);

        expect(res.statusCode).to.equal(500);
      });
    });

    describe("getMonthlyConfig", function () {
      it("should return monthly config", async function () {
        sinon.stub(AttendanceConfig, "findOne").resolves({ month: 8, year: 2026, totalWorkingDays: 22 });

        const req = { query: { month: "8", year: "2026" } };
        const res = mockRes();

        await getMonthlyConfig(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.config.totalWorkingDays).to.equal(22);
      });

      it("should return 500 on database error", async function () {
        sinon.stub(AttendanceConfig, "findOne").rejects(new Error("DB error"));

        const req = { query: { month: "8", year: "2026" } };
        const res = mockRes();

        await getMonthlyConfig(req, res);

        expect(res.statusCode).to.equal(500);
      });
    });

    describe("updateFacultyAttendance", function () {
      it("should update faculty attendance record", async function () {
        sinon.stub(FacultyAttendance, "findOne").resolves({ optionalLeavesUsed: 0 });
        sinon.stub(AttendanceConfig, "findOne").resolves({ totalWorkingDays: 25 });
        sinon.stub(FacultyAttendance, "findOneAndUpdate").resolves({ facultyId: "FAC01", presentDays: 22 });

        const req = {
          body: {
            facultyId: "FAC01",
            month: 8,
            year: 2026,
            presentDays: 22,
            optionalLeavesUsed: 1,
          },
        };
        const res = mockRes();

        await updateFacultyAttendance(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
      });
    });

    describe("getAllFacultyAttendance", function () {
      it("should get all faculty attendance enriched with leave info", async function () {
        sinon.stub(FacultyAttendance, "find").resolves([
          { _doc: { facultyId: "FAC01", month: 8, year: 2026 }, facultyId: "FAC01", optionalLeavesUsed: 1 },
        ]);
        sinon.stub(FacultyAttendance, "findOne").resolves({ optionalLeavesUsed: 0 });

        const req = { query: { month: "8", year: "2026" } };
        const res = mockRes();

        await getAllFacultyAttendance(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.attendance).to.have.lengthOf(1);
      });
    });

    describe("getFacultyAttendanceStats", function () {
      it("should return attendance stats for a specific faculty", async function () {
        sinon.stub(FacultyAttendance, "findOne").resolves({ presentDays: 20, optionalLeavesUsed: 1 });
        sinon.stub(AttendanceConfig, "findOne").resolves({ totalWorkingDays: 22 });

        const req = { params: { facultyId: "FAC01" } };
        const res = mockRes();

        await getFacultyAttendanceStats(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.stats).to.have.lengthOf(6);
      });
    });
  });
});
