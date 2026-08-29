const sinon = require("sinon");
const { expect } = require("chai");

// Models
const facultyDetails = require("../../models/Faculty/details.model.js");
const Substitution = require("../../models/Faculty/substitution.model.js");
const FacultyLeave = require("../../models/Faculty/leave.model.js");

// Controller under test
const {
  getDetails,
  getDetails2,
  addDetails,
  updateDetails,
  deleteDetails,
  getCount,
  updateTimetable,
  getFacultyByBatchAndBranch,
  validateTimetable,
  getFacultyWithFreePeriods,
  substituteFaculty,
  updateSubstitutionStatus,
  undoSubstitution,
  resetTimetable,
  getSubstitutionHistory,
} = require("../../controllers/Faculty/details.controller.js");

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
// Faculty details.controller.js — Test Suite
// =============================================================================
describe("Faculty Details Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // getDetails
  // -------------------------------------------------------------------------
  describe("getDetails", function () {
    it("should return faculty details when found", async function () {
      const faculties = [
        {
          employeeId: "EMP01",
          firstName: "John",
          timetable: [],
          toObject: () => ({ employeeId: "EMP01", firstName: "John", timetable: [] }),
        },
      ];
      sinon.stub(facultyDetails, "find").resolves(faculties);
      sinon.stub(Substitution, "find").resolves([]);

      const req = { body: { department: "CSE" }, query: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Faculty Details Found!");
    });

    it("should return 400 when no faculty found", async function () {
      sinon.stub(facultyDetails, "find").resolves([]);

      const req = { body: { department: "NONEXISTENT" }, query: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No Faculty Found");
    });

    it("should return 500 on database error", async function () {
      sinon.stub(facultyDetails, "find").rejects(new Error("DB Error"));

      const req = { body: {}, query: {} };
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
    it("should return 400 if employeeId is missing", async function () {
      const req = { body: { firstName: "Jane" } };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("employeeId is required");
    });

    it("should return 400 if batch is invalid", async function () {
      const req = { body: { employeeId: "EMP01", batch: "not-a-year" } };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Batch must be a valid year");
    });

    it("should return 400 if phone number is invalid", async function () {
      const req = { body: { employeeId: "EMP01", phoneNumber: "12345" } };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Invalid phone number");
    });

    it("should return 400 if faculty with employeeId already exists", async function () {
      sinon.stub(facultyDetails, "findOne").resolves({ employeeId: "EMP01" });

      const req = { body: { employeeId: "EMP01", phoneNumber: "9876543210" } };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Faculty With This EmployeeId Already Exists");
    });

    it("should overwrite existing faculty if excel-import and allowOverwrite are set", async function () {
      sinon.stub(facultyDetails, "findOne").resolves({ employeeId: "EMP01" });
      sinon.stub(facultyDetails, "updateOne").resolves({ modifiedCount: 1 });

      const req = {
        body: {
          employeeId: "EMP01",
          phoneNumber: "9876543210",
          type: "excel-import",
          overwrite: "true",
        },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal("Faculty Details Updated (Import Overwrite)!");
    });

    it("should add new faculty details successfully", async function () {
      sinon.stub(facultyDetails, "findOne").resolves(null);
      sinon.stub(facultyDetails, "create").resolves({ employeeId: "EMP01", firstName: "Alice" });

      const req = {
        body: { employeeId: "EMP01", phoneNumber: "9876543210", firstName: "Alice" },
        file: { path: "/uploads/profile.png" },
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Faculty Details Added!");
    });

    it("should return 500 on database error during addition", async function () {
      sinon.stub(facultyDetails, "findOne").rejects(new Error("DB Error"));

      const req = { body: { employeeId: "EMP01", phoneNumber: "9876543210" } };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // updateDetails
  // -------------------------------------------------------------------------
  describe("updateDetails", function () {
    it("should return 400 for invalid phone number in update", async function () {
      const req = { params: { id: "f1" }, body: { phoneNumber: "123" } };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Invalid phone number");
    });

    it("should update details successfully", async function () {
      sinon.stub(facultyDetails, "findByIdAndUpdate").resolves({ id: "f1", firstName: "Bob" });

      const req = { params: { id: "f1" }, body: { firstName: "Bob", phoneNumber: "9876543210" } };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Updated Successfull!");
    });

    it("should update profile picture when file is uploaded", async function () {
      const stub = sinon.stub(facultyDetails, "findByIdAndUpdate").resolves({ id: "f1" });

      const req = {
        params: { id: "f1" },
        body: { firstName: "Bob" },
        file: { path: "/path/img.jpg" },
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(stub.getCall(0).args[1]).to.have.property("profile", "/path/img.jpg");
      expect(res.statusCode).to.equal(200);
    });

    it("should return 400 if faculty to update is not found", async function () {
      sinon.stub(facultyDetails, "findByIdAndUpdate").resolves(null);

      const req = { params: { id: "nonexistent" }, body: {} };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("No Faculty Found");
    });

    it("should return 500 on database error", async function () {
      sinon.stub(facultyDetails, "findByIdAndUpdate").rejects(new Error("DB Error"));

      const req = { params: { id: "f1" }, body: {} };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // deleteDetails
  // -------------------------------------------------------------------------
  describe("deleteDetails", function () {
    it("should delete faculty successfully", async function () {
      sinon.stub(facultyDetails, "findByIdAndDelete").resolves({ id: "f1" });

      const req = { params: { id: "f1" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Deleted Successfull!");
    });

    it("should return 400 if faculty to delete is not found", async function () {
      sinon.stub(facultyDetails, "findByIdAndDelete").resolves(null);

      const req = { params: { id: "ghost" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("No Faculty Found");
    });

    it("should return 500 on database error", async function () {
      sinon.stub(facultyDetails, "findByIdAndDelete").rejects(new Error("DB Error"));

      const req = { params: { id: "f1" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // getCount
  // -------------------------------------------------------------------------
  describe("getCount", function () {
    it("should return count of faculties", async function () {
      sinon.stub(facultyDetails, "count").resolves(15);

      const req = { body: { department: "CSE" } };
      const res = mockRes();

      await getCount(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.user).to.equal(15);
      expect(res.body.message).to.equal("Count Successfull!");
    });

    it("should return 500 on database error", async function () {
      sinon.stub(facultyDetails, "count").rejects(new Error("DB Error"));

      const req = { body: {} };
      const res = mockRes();

      await getCount(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // updateTimetable
  // -------------------------------------------------------------------------
  describe("updateTimetable", function () {
    it("should return 400 for invalid timetable format", async function () {
      const req = { params: { id: "EMP01" }, body: { timetable: "invalid" } };
      const res = mockRes();

      await updateTimetable(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Invalid timetable data format");
    });

    it("should return 400 when timetable clash is detected", async function () {
      sinon.stub(facultyDetails, "find").resolves([
        {
          employeeId: "EMP02",
          firstName: "Bob",
          timetable: [
            {
              day: "Monday",
              periods: [
                {
                  startTime: "09:00",
                  endTime: "10:00",
                  semester: 3,
                  section: "A",
                  branch: "CSE",
                  subject: "DBMS",
                },
              ],
            },
          ],
        },
      ]);

      const req = {
        params: { id: "EMP01" },
        body: {
          timetable: [
            {
              day: "Monday",
              periods: [
                {
                  startTime: "09:00",
                  endTime: "10:00",
                  semester: 3,
                  section: "A",
                  branch: "CSE",
                  subject: "OS",
                },
              ],
            },
          ],
        },
      };
      const res = mockRes();

      await updateTimetable(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Faculty timetable clash detected");
    });

    it("should update timetable successfully when no clashes", async function () {
      sinon.stub(facultyDetails, "find").resolves([]);
      sinon.stub(facultyDetails, "findOneAndUpdate").resolves({
        employeeId: "EMP01",
        timetable: [],
      });

      const req = {
        params: { id: "EMP01" },
        body: { timetable: [] },
      };
      const res = mockRes();

      await updateTimetable(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Timetable updated successfully");
    });

    it("should return 404 if faculty is not found during timetable update", async function () {
      sinon.stub(facultyDetails, "find").resolves([]);
      sinon.stub(facultyDetails, "findOneAndUpdate").resolves(null);

      const req = {
        params: { id: "ghost" },
        body: { timetable: [] },
      };
      const res = mockRes();

      await updateTimetable(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("Faculty not found");
    });
  });

  // -------------------------------------------------------------------------
  // getFacultyByBatchAndBranch
  // -------------------------------------------------------------------------
  describe("getFacultyByBatchAndBranch", function () {
    it("should return 400 if neither batch nor branch is provided", async function () {
      const req = { query: {} };
      const res = mockRes();

      await getFacultyByBatchAndBranch(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Provide at least batch or branch");
    });

    it("should return 400 for invalid batch", async function () {
      const req = { query: { batch: "invalid" } };
      const res = mockRes();

      await getFacultyByBatchAndBranch(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Invalid batch");
    });

    it("should return faculty list filtered by batch and department", async function () {
      const list = [{ employeeId: "EMP01", department: "CSE", batch: 2024 }];
      sinon.stub(facultyDetails, "find").resolves(list);

      const req = { query: { batch: "2024", branch: "CSE" } };
      const res = mockRes();

      await getFacultyByBatchAndBranch(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(1);
    });
  });

  // -------------------------------------------------------------------------
  // validateTimetable
  // -------------------------------------------------------------------------
  describe("validateTimetable", function () {
    it("should return 400 for invalid timetable payload", async function () {
      const req = { body: { timetable: "not-array" } };
      const res = mockRes();

      await validateTimetable(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Invalid timetable data format");
    });

    it("should return success true when no clashes are found", async function () {
      sinon.stub(facultyDetails, "find").resolves([]);

      const req = { body: { employeeId: "EMP01", timetable: [] } };
      const res = mockRes();

      await validateTimetable(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("No clashes found");
    });
  });

  // -------------------------------------------------------------------------
  // getFacultyWithFreePeriods
  // -------------------------------------------------------------------------
  describe("getFacultyWithFreePeriods", function () {
    it("should return 400 if required query fields are missing", async function () {
      const req = { query: { day: "Monday" } };
      const res = mockRes();

      await getFacultyWithFreePeriods(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Day, startTime and endTime are required");
    });

    it("should return list of faculty with free periods", async function () {
      sinon.stub(facultyDetails, "find").resolves([
        {
          employeeId: "EMP02",
          firstName: "Bob",
          department: "CSE",
          timetable: [],
        },
      ]);

      const req = {
        query: {
          day: "Monday",
          startTime: "09:00",
          endTime: "10:00",
          currentFacultyId: "EMP01",
        },
      };
      const res = mockRes();

      await getFacultyWithFreePeriods(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.facultyWithFreePeriods).to.be.an("array");
    });
  });

  // -------------------------------------------------------------------------
  // substituteFaculty & updateSubstitutionStatus
  // -------------------------------------------------------------------------
  describe("substituteFaculty & updateSubstitutionStatus", function () {
    it("should return 400 when missing required fields for substitution", async function () {
      const req = { body: { originalFacultyId: "EMP01" } };
      const res = mockRes();

      await substituteFaculty(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Missing required fields");
    });

    it("should return 404 when faculty is not found", async function () {
      sinon.stub(facultyDetails, "findOne").resolves(null);

      const req = {
        body: {
          originalFacultyId: "EMP01",
          substituteFacultyId: "EMP02",
          day: "Monday",
          periodNumber: 1,
        },
      };
      const res = mockRes();

      await substituteFaculty(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.include("One or both faculties not found");
    });

    it("should return 400 for invalid status update in updateSubstitutionStatus", async function () {
      const req = { body: { substitutionId: "sub1", status: "invalid_status" } };
      const res = mockRes();

      await updateSubstitutionStatus(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Invalid status update");
    });

    it("should return 404 when substitution is not found in updateSubstitutionStatus", async function () {
      sinon.stub(Substitution, "findById").resolves(null);

      const req = { body: { substitutionId: "sub1", status: "active" } };
      const res = mockRes();

      await updateSubstitutionStatus(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("Substitution request not found");
    });

    it("should update substitution status to active successfully", async function () {
      const mockSub = { status: "pending", save: sinon.stub().resolves() };
      sinon.stub(Substitution, "findById").resolves(mockSub);

      const req = { body: { substitutionId: "sub1", status: "active" } };
      const res = mockRes();

      await updateSubstitutionStatus(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(mockSub.status).to.equal("active");
    });
  });

  // -------------------------------------------------------------------------
  // undoSubstitution & resetTimetable & getSubstitutionHistory
  // -------------------------------------------------------------------------
  describe("undoSubstitution & resetTimetable & getSubstitutionHistory", function () {
    it("should return 400 on missing parameters for undoSubstitution", async function () {
      const req = { body: {} };
      const res = mockRes();

      await undoSubstitution(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should return 404 when active substitution is not found for undoSubstitution", async function () {
      sinon.stub(Substitution, "findOne").resolves(null);

      const req = {
        body: {
          originalFacultyId: "EMP01",
          substituteFacultyId: "EMP02",
          day: "Monday",
          periodNumber: 1,
        },
      };
      const res = mockRes();

      await undoSubstitution(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("No active substitution found");
    });

    it("should return 400 if facultyId missing for resetTimetable", async function () {
      const req = { body: {} };
      const res = mockRes();

      await resetTimetable(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should reset timetable for faculty with substitutions as original and substitute", async function () {
      const subAsOrig = {
        _id: "s1",
        originalFacultyId: "FAC01",
        substituteFacultyId: "FAC02",
        day: "Monday",
        periodNumber: 1,
        status: "active",
        substituteOriginalPeriod: { subject: "Math", startTime: "09:00", endTime: "10:00" },
        save: sinon.stub().resolves(),
      };
      const subAsSub = {
        _id: "s2",
        originalFacultyId: "FAC03",
        substituteFacultyId: "FAC01",
        day: "Tuesday",
        periodNumber: 2,
        subject: "Physics",
        branch: "CSE",
        semester: 3,
        section: "A",
        startTime: "10:00",
        endTime: "11:00",
        status: "active",
        save: sinon.stub().resolves(),
      };

      sinon.stub(Substitution, "find")
        .onFirstCall().resolves([subAsOrig])
        .onSecondCall().resolves([subAsSub]);

      const mockSubstitute = {
        employeeId: "FAC02",
        timetable: [
          {
            day: "Monday",
            periods: [
              { periodNumber: 1, subject: "Physics", substitutedFrom: "FAC01" },
            ],
          },
        ],
      };
      const mockOriginal = {
        employeeId: "FAC03",
        timetable: [
          {
            day: "Tuesday",
            periods: [
              { periodNumber: 2, subject: "Chemistry" },
            ],
          },
        ],
      };
      const mockTarget = {
        employeeId: "FAC01",
        timetable: [
          {
            day: "Monday",
            periods: [
              { periodNumber: 1, subject: "Physics", substitutedFrom: "FAC03", originalSubject: "Math" },
            ],
          },
        ],
      };

      sinon.stub(facultyDetails, "findOne")
        .withArgs({ employeeId: "FAC02" }).resolves(mockSubstitute)
        .withArgs({ employeeId: "FAC03" }).resolves(mockOriginal)
        .withArgs({ employeeId: "FAC01" }).resolves(mockTarget);

      sinon.stub(facultyDetails, "findOneAndUpdate").resolves(mockTarget);

      const req = { body: { facultyId: "FAC01" } };
      const res = mockRes();

      await resetTimetable(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should get details2 with leave status when date is provided", async function () {
      const mockFaculties = [
        { employeeId: "FAC01", timetable: [] },
      ];
      sinon.stub(facultyDetails, "find").resolves(mockFaculties);
      sinon.stub(FacultyLeave, "find").resolves([
        { facultyId: "FAC01", dates: ["2026-08-10"], status: "confirmed" },
      ]);
      sinon.stub(Substitution, "find").resolves([]);

      const req = { query: { date: "2026-08-10" } };
      const res = mockRes();

      await getDetails2(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.faculties).to.have.lengthOf(1);
      expect(res.body.faculties[0].onLeave).to.be.true;
    });

    it("should get substitution history for a faculty", async function () {
      const mockSubs = [
        {
          originalFacultyId: "EMP01",
          substituteFacultyId: "EMP02",
          toObject: () => ({ originalFacultyId: "EMP01", substituteFacultyId: "EMP02" }),
        },
      ];
      sinon.stub(Substitution, "find").returns({
        sort: sinon.stub().resolves(mockSubs),
      });
      sinon.stub(facultyDetails, "find").resolves([
        { employeeId: "EMP01", firstName: "Alice", lastName: "Smith" },
        { employeeId: "EMP02", firstName: "Bob", lastName: "Jones" },
      ]);

      const req = { params: { facultyId: "EMP01" } };
      const res = mockRes();

      await getSubstitutionHistory(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.substitutions).to.be.an("array");
    });
  });
});

