const sinon = require("sinon");
const { expect } = require("chai");

// Models
const FacultyLeave = require("../../models/Faculty/leave.model.js");
const FacultyDetail = require("../../models/Faculty/details.model.js");
const FacultyAttendance = require("../../models/Accounts/facultyAttendance.model.js");
const AttendanceConfig = require("../../models/Accounts/attendanceConfig.model.js");
const Substitution = require("../../models/Faculty/substitution.model.js");
const LeaveQuota = require("../../models/Faculty/leaveQuota.model.js");

// Controller under test
const leaveController = require("../../controllers/Faculty/leave.controller.js");

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
// Faculty leave.controller.js — Test Suite
// =============================================================================
describe("Faculty Leave Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // setLeaveQuotas & getLeaveQuotas
  // -------------------------------------------------------------------------
  describe("setLeaveQuotas & getLeaveQuotas", function () {
    it("should set leave quotas successfully", async function () {
      const mockQuota = { year: 2024, quotas: { casual: 12 } };
      sinon.stub(LeaveQuota, "findOneAndUpdate").resolves(mockQuota);

      const req = { body: { year: 2024, quotas: { casual: 12 } } };
      const res = mockRes();

      await leaveController.setLeaveQuotas(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.quotas).to.deep.equal(mockQuota);
    });

    it("should get leave quotas for a year", async function () {
      sinon.stub(LeaveQuota, "findOne").resolves({ quotas: { casual: 12 } });

      const req = { query: { year: "2024" } };
      const res = mockRes();

      await leaveController.getLeaveQuotas(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.quotas).to.deep.equal({ casual: 12 });
    });
  });

  // -------------------------------------------------------------------------
  // requestLeave
  // -------------------------------------------------------------------------
  describe("requestLeave", function () {
    it("should return 404 if faculty or department is not found", async function () {
      sinon.stub(FacultyDetail, "findOne").resolves(null);

      const req = {
        body: { facultyId: "F1", dates: ["2024-10-01"], leaveType: "Casual Leave" },
      };
      const res = mockRes();

      await leaveController.requestLeave(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.include("Faculty department not found");
    });

    it("should return 400 if leave already exists for dates", async function () {
      sinon.stub(FacultyDetail, "findOne").resolves({ department: "CSE" });
      sinon.stub(FacultyLeave, "findOne").resolves({ id: "leave1" });

      const req = {
        body: { facultyId: "F1", dates: ["2024-10-01"], leaveType: "Casual Leave" },
      };
      const res = mockRes();

      await leaveController.requestLeave(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Leave already exists for some of these dates");
    });

    it("should submit leave request successfully", async function () {
      sinon.stub(FacultyDetail, "findOne").resolves({ department: "CSE" });
      sinon.stub(FacultyLeave, "findOne").resolves(null);
      const createdLeave = { id: "l1", facultyId: "F1", status: "pending" };
      sinon.stub(FacultyLeave, "create").resolves(createdLeave);

      const req = {
        body: {
          facultyId: "F1",
          facultyName: "Alice",
          dates: ["2024-10-01"],
          leaveType: "Casual Leave",
        },
      };
      const res = mockRes();

      await leaveController.requestLeave(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.include("Leave request submitted successfully");
    });
  });

  // -------------------------------------------------------------------------
  // approveLeave & rejectLeave (HOD)
  // -------------------------------------------------------------------------
  describe("HOD approveLeave & rejectLeave", function () {
    it("should return 404 when approving non-existent leave", async function () {
      sinon.stub(FacultyLeave, "findById").resolves(null);

      const req = { params: { leaveId: "ghost" }, body: {} };
      const res = mockRes();

      await leaveController.approveLeave(req, res);

      expect(res.statusCode).to.equal(404);
    });

    it("should return 400 if substitute is not assigned before HOD approval", async function () {
      sinon.stub(FacultyLeave, "findById").resolves({ id: "l1", substituteId: null });

      const req = { params: { leaveId: "l1" }, body: { approvedBy: "HOD_CSE" } };
      const res = mockRes();

      await leaveController.approveLeave(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Substitution is not done yet");
    });

    it("should approve leave by HOD successfully when substitute is assigned", async function () {
      const mockLeave = {
        id: "l1",
        substituteId: "SUB1",
        status: "pending",
        save: sinon.stub().resolves(),
      };
      sinon.stub(FacultyLeave, "findById").resolves(mockLeave);

      const req = { params: { leaveId: "l1" }, body: { approvedBy: "HOD_CSE" } };
      const res = mockRes();

      await leaveController.approveLeave(req, res);

      expect(res.statusCode).to.equal(200);
      expect(mockLeave.status).to.equal("approved_by_hod");
    });

    it("should reject leave by HOD successfully", async function () {
      sinon.stub(FacultyLeave, "findByIdAndUpdate").resolves({ id: "l1", status: "rejected" });

      const req = {
        params: { leaveId: "l1" },
        body: { rejectionReason: "Exams scheduled", rejectedBy: "HOD_CSE" },
      };
      const res = mockRes();

      await leaveController.rejectLeave(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal("Leave rejected by HOD");
    });
  });

  // -------------------------------------------------------------------------
  // approveLeaveByPrincipal & rejectLeaveByPrincipal
  // -------------------------------------------------------------------------
  describe("Principal approveLeaveByPrincipal & rejectLeaveByPrincipal", function () {
    it("should return 400 if leave is not approved by HOD first", async function () {
      sinon.stub(FacultyLeave, "findById").resolves({ id: "l1", status: "pending" });

      const req = { params: { leaveId: "l1" }, body: { approvedBy: "Principal" } };
      const res = mockRes();

      await leaveController.approveLeaveByPrincipal(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Leave must be approved by HOD first");
    });

    it("should approve leave by Principal and update attendance", async function () {
      const mockLeave = {
        id: "l1",
        facultyId: "F1",
        dates: ["2024-10-10"],
        leaveType: "Casual Leave",
        status: "approved_by_hod",
        save: sinon.stub().resolves(),
      };
      sinon.stub(FacultyLeave, "findById").resolves(mockLeave);
      sinon.stub(FacultyAttendance, "findOne").resolves({
        facultyId: "F1",
        month: 10,
        year: 2024,
        regularLeavesTaken: 0,
        save: sinon.stub().resolves(),
      });
      sinon.stub(AttendanceConfig, "findOne").resolves({ totalWorkingDays: 25 });

      const req = { params: { leaveId: "l1" }, body: { approvedBy: "Principal" } };
      const res = mockRes();

      await leaveController.approveLeaveByPrincipal(req, res);

      expect(res.statusCode).to.equal(200);
      expect(mockLeave.status).to.equal("confirmed");
    });

    it("should reject leave by Principal successfully", async function () {
      sinon.stub(FacultyLeave, "findByIdAndUpdate").resolves({ id: "l1", status: "rejected" });

      const req = {
        params: { leaveId: "l1" },
        body: { rejectionReason: "Not allowed", rejectedBy: "Principal" },
      };
      const res = mockRes();

      await leaveController.rejectLeaveByPrincipal(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal("Leave rejected by Principal");
    });
  });

  // -------------------------------------------------------------------------
  // Helper Getters & Operations
  // -------------------------------------------------------------------------
  describe("Leave queries & operations", function () {
    it("should get faculty leaves", async function () {
      const leavesList = [{ id: "l1", facultyId: "F1" }];
      sinon.stub(FacultyLeave, "find").returns({
        sort: sinon.stub().resolves(leavesList),
      });

      const req = { params: { facultyId: "f1" } };
      const res = mockRes();

      await leaveController.getFacultyLeaves(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.leaves).to.deep.equal(leavesList);
    });

    it("should cancel leave successfully", async function () {
      const mockLeave = {
        id: "l1",
        facultyId: "F1",
        status: "pending",
        save: sinon.stub().resolves(),
      };
      sinon.stub(FacultyLeave, "findById").resolves(mockLeave);

      const req = { params: { leaveId: "l1" } };
      const res = mockRes();

      await leaveController.cancelLeave(req, res);

      expect(res.statusCode).to.equal(200);
      expect(mockLeave.status).to.equal("cancelled");
    });

    it("should assign substitute and create substitution records", async function () {
      const mockLeave = {
        _id: "l1",
        facultyId: "FAC01",
        dates: ["2026-08-10"], // Monday
        substituteId: "FAC02",
        save: sinon.stub().resolves(),
      };
      sinon.stub(FacultyLeave, "findById").resolves(mockLeave);

      const mockOriginal = {
        employeeId: "FAC01",
        timetable: [
          {
            day: "Monday",
            periods: [
              { periodNumber: 1, subject: "Mathematics", startTime: "09:00", endTime: "10:00", branch: "CSE", semester: 3, section: "A" },
            ],
          },
        ],
      };
      const mockSubstitute = {
        employeeId: "FAC02",
        timetable: [
          {
            day: "Monday",
            periods: [],
          },
        ],
      };

      sinon.stub(FacultyDetail, "findOne")
        .withArgs({ employeeId: "FAC01" }).resolves(mockOriginal)
        .withArgs({ employeeId: "FAC02" }).resolves(mockSubstitute);

      sinon.stub(Substitution, "findOne").resolves(null);
      sinon.stub(Substitution, "create").resolves({ _id: "sub1" });

      const req = {
        params: { leaveId: "l1" },
        body: { substituteId: "FAC02", substituteName: "Bob" },
      };
      const res = mockRes();

      await leaveController.assignSubstitute(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should get pending leaves for branch and all leaves", async function () {
      sinon.stub(FacultyLeave, "find").returns({
        sort: sinon.stub().resolves([{ facultyId: "FAC01", status: "pending" }]),
      });

      const res1 = mockRes();
      await leaveController.getPendingLeavesByBranch({ params: { branch: "CSE" } }, res1);
      expect(res1.statusCode).to.equal(200);

      const res2 = mockRes();
      await leaveController.getAllLeaves({}, res2);
      expect(res2.statusCode).to.equal(200);
    });

    it("should cancel approved leave and revert attendance", async function () {
      const mockLeave = {
        id: "l1",
        facultyId: "FAC01",
        dates: ["2026-08-10"],
        leaveType: "Casual Leave",
        status: "approved_by_hod",
        save: sinon.stub().resolves(),
      };
      sinon.stub(FacultyLeave, "findById").resolves(mockLeave);

      const mockAttendance = {
        facultyId: "FAC01",
        regularLeavesTaken: 2,
        presentDays: 23,
        save: sinon.stub().resolves(),
      };
      sinon.stub(FacultyAttendance, "findOne").resolves(mockAttendance);
      sinon.stub(AttendanceConfig, "findOne").resolves({ totalWorkingDays: 25 });

      const req = { params: { leaveId: "l1" } };
      const res = mockRes();

      await leaveController.cancelLeave(req, res);

      expect(res.statusCode).to.equal(200);
      expect(mockLeave.status).to.equal("cancelled");
      expect(mockAttendance.regularLeavesTaken).to.equal(1);
    });

    it("should calculate leave summary for a month and year", async function () {
      const confirmedLeaves = [
        {
          facultyId: "F1",
          dates: ["2024-10-05"],
          leaveType: "Casual Leave",
        },
      ];
      sinon.stub(FacultyLeave, "find").resolves(confirmedLeaves);

      const req = { query: { month: "10", year: "2024" } };
      const res = mockRes();

      await leaveController.getLeaveSummary(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.summary).to.have.property("F1");
    });
  });
});

