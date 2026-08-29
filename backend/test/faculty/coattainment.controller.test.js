const sinon = require("sinon");
const { expect } = require("chai");

// Models & Services
const CoAttainmentAssessment = require("../../models/Other/coAttainmentAssessment.model.js");
const Subject = require("../../models/Other/subject.model.js");
const Branch = require("../../models/Other/branch.model.js");
const Student = require("../../models/Students/details.model.js");
const coattainmentService = require("../../services/coattainment.faculty.service.js");
const subjectFilter = require("../../utils/subjectFilter.js");

// Controller under test
const coattainmentController = require("../../controllers/Faculty/coattainment.controller.js");

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
  res.setHeader = sinon.stub();
  res.end = sinon.stub().callsFake((data) => {
    res.body = data;
    return res;
  });
  return res;
}

// =============================================================================
// Faculty coattainment.controller.js — Test Suite
// =============================================================================
describe("Faculty CO-Attainment Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // getSubjectsWithCOs
  // -------------------------------------------------------------------------
  describe("getSubjectsWithCOs", function () {
    it("should return 400 if facultyId is missing", async function () {
      const req = { body: {} };
      const res = mockRes();

      await coattainmentController.getSubjectsWithCOs(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Faculty ID is required");
    });

    it("should return subjects list with COs successfully", async function () {
      const rawSubjects = [{ code: "CS101", name: "Programming" }];
      const query = {
        populate: sinon.stub().returnsThis(),
        select: sinon.stub().resolves(rawSubjects),
      };
      sinon.stub(Subject, "find").returns(query);
      sinon.stub(Student, "aggregate").resolves([]);
      sinon.stub(subjectFilter, "filterSubjectsByStudentRegulation").resolves(rawSubjects);

      const req = { body: { facultyId: "FAC01" } };
      const res = mockRes();

      await coattainmentController.getSubjectsWithCOs(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal(rawSubjects);
    });

    it("should return 500 on internal server error", async function () {
      sinon.stub(Subject, "find").throws(new Error("DB Error"));

      const req = { body: { facultyId: "FAC01" } };
      const res = mockRes();

      await coattainmentController.getSubjectsWithCOs(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  // getStudentsForAssessment
  // -------------------------------------------------------------------------
  describe("getStudentsForAssessment", function () {
    it("should return 400 if branchId or semester is missing", async function () {
      const req = { body: { branchId: "b1" } };
      const res = mockRes();

      await coattainmentController.getStudentsForAssessment(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Branch ID and semester are required");
    });

    it("should fetch students for assessment successfully", async function () {
      sinon.stub(Branch, "findById").resolves({ name: "CSE" });
      const studentsList = [{ enrollmentNo: "S101", firstName: "Alice" }];
      const query = { select: sinon.stub().resolves(studentsList) };
      sinon.stub(Student, "find").returns(query);

      const req = { body: { branchId: "b1", semester: 3 } };
      const res = mockRes();

      await coattainmentController.getStudentsForAssessment(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(1);
    });
  });

  // -------------------------------------------------------------------------
  // createAssessment
  // -------------------------------------------------------------------------
  describe("createAssessment", function () {
    it("should return 400 if required fields are missing", async function () {
      const req = { body: { facultyId: "F1" } };
      const res = mockRes();

      await coattainmentController.createAssessment(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("All required fields must be provided");
    });

    it("should return 400 if neither questions nor assignments provided", async function () {
      const req = {
        body: {
          facultyId: "F1",
          subjectId: "Sub1",
          coNumber: 1,
          branchId: "B1",
          semester: 3,
          academicYear: "2024-2025",
          questions: [],
          assignments: [],
        },
      };
      const res = mockRes();

      await coattainmentController.createAssessment(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("At least one question or assignment must be provided");
    });

    it("should create assessment successfully via service", async function () {
      sinon.stub(coattainmentService, "createAssessment").resolves({ id: "ass1" });

      const req = {
        body: {
          facultyId: "F1",
          subjectId: "Sub1",
          coNumber: 1,
          branchId: "B1",
          semester: 3,
          academicYear: "2024-2025",
          questions: [{ qNo: 1, totalMarks: 10 }],
        },
      };
      const res = mockRes();

      await coattainmentController.createAssessment(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal({ id: "ass1" });
    });
  });

  // -------------------------------------------------------------------------
  // generateExcelTemplate & exportResults
  // -------------------------------------------------------------------------
  describe("generateExcelTemplate & exportResults", function () {
    it("should return 400 if assessmentId is missing for template", async function () {
      const req = { body: {} };
      const res = mockRes();

      await coattainmentController.generateExcelTemplate(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should generate Excel template successfully", async function () {
      const fakeBuffer = Buffer.from("excel-content");
      sinon.stub(coattainmentService, "generateExcelTemplate").resolves(fakeBuffer);

      const req = { body: { assessmentId: "ass1" } };
      const res = mockRes();

      await coattainmentController.generateExcelTemplate(req, res);

      expect(res.setHeader.calledWith("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).to.be.true;
      expect(res.end.calledWith(fakeBuffer)).to.be.true;
    });

    it("should export results to Excel successfully", async function () {
      const fakeBuffer = Buffer.from("results-excel");
      sinon.stub(coattainmentService, "generateResultsExcel").resolves(fakeBuffer);

      const req = { body: { assessmentId: "ass1" } };
      const res = mockRes();

      await coattainmentController.exportResults(req, res);

      expect(res.setHeader.calledWith("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).to.be.true;
      expect(res.end.calledWith(fakeBuffer)).to.be.true;
    });
  });

  // -------------------------------------------------------------------------
  // uploadMarks & calculateResults
  // -------------------------------------------------------------------------
  describe("uploadMarks & calculateResults", function () {
    it("should return 400 if assessmentId or file missing in uploadMarks", async function () {
      const req = { body: { assessmentId: "ass1" } };
      const res = mockRes();

      await coattainmentController.uploadMarks(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Excel file is required");
    });

    it("should upload marks successfully via service", async function () {
      sinon.stub(coattainmentService, "uploadAndProcessMarks").resolves({ processedCount: 20 });

      const req = {
        body: { assessmentId: "ass1" },
        file: { buffer: Buffer.from("file-data") },
      };
      const res = mockRes();

      await coattainmentController.uploadMarks(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should calculate results successfully via service", async function () {
      sinon.stub(coattainmentService, "calculateResults").resolves({ attainmentLevel: 3 });

      const req = { body: { assessmentId: "ass1" } };
      const res = mockRes();

      await coattainmentController.calculateResults(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.deep.equal({ attainmentLevel: 3 });
    });
  });

  // -------------------------------------------------------------------------
  // getAssessment & updateAssessment & deleteAssessment & getFacultyAssessments
  // -------------------------------------------------------------------------
  describe("getAssessment & updateAssessment & deleteAssessment & getFacultyAssessments", function () {
    it("should return 404 if assessment to get is not found", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
      };
      query.populate = sinon.stub().returns({
        populate: sinon.stub().returns({
          populate: sinon.stub().resolves(null),
        }),
      });
      sinon.stub(CoAttainmentAssessment, "findById").returns(query);

      const req = { params: { assessmentId: "ghost" } };
      const res = mockRes();

      await coattainmentController.getAssessment(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("Assessment not found");
    });

    it("should return 404 if assessment to delete is not found", async function () {
      sinon.stub(CoAttainmentAssessment, "findById").resolves(null);

      const req = { params: { assessmentId: "ghost" } };
      const res = mockRes();

      await coattainmentController.deleteAssessment(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("Assessment not found");
    });

    it("should delete assessment successfully when found", async function () {
      sinon.stub(CoAttainmentAssessment, "findById").resolves({ _id: "ass1" });
      sinon.stub(CoAttainmentAssessment, "findByIdAndDelete").resolves();

      const req = { params: { assessmentId: "ass1" } };
      const res = mockRes();

      await coattainmentController.deleteAssessment(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Assessment deleted successfully");
    });

    it("should update draft assessment questions and assignments", async function () {
      const mockAssessment = {
        _id: "ass1",
        status: "draft",
        questions: [],
        assignments: [],
        totalMarks: 0,
        save: sinon.stub().resolves(),
      };
      sinon.stub(CoAttainmentAssessment, "findById").resolves(mockAssessment);

      const req = {
        params: { assessmentId: "ass1" },
        body: {
          questions: [
            { qNo: 1, subQuestions: [{ subQNo: "a", totalMarks: 5 }] },
          ],
          assignments: [{ assignmentNo: 1, totalMarks: 10 }],
        },
      };
      const res = mockRes();

      await coattainmentController.updateAssessment(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(mockAssessment.totalMarks).to.equal(15);
    });

    it("should return 400 when updating non-draft assessment", async function () {
      sinon.stub(CoAttainmentAssessment, "findById").resolves({ _id: "ass1", status: "submitted" });

      const req = { params: { assessmentId: "ass1" }, body: {} };
      const res = mockRes();

      await coattainmentController.updateAssessment(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("draft status");
    });

    it("should get assessment summary successfully", async function () {
      const mockAssessment = {
        subjectCode: "CS101",
        subjectName: "Programming",
        coNumber: 1,
        coDescription: "Learn C",
        branchName: "CSE",
        semester: 1,
        academicYear: "2024",
        summary: {},
        status: "finalized",
      };
      const query = { populate: sinon.stub().returnsThis() };
      query.populate = sinon.stub().returns({
        populate: sinon.stub().resolves(mockAssessment),
      });
      sinon.stub(CoAttainmentAssessment, "findById").returns(query);

      const req = { params: { assessmentId: "ass1" } };
      const res = mockRes();

      await coattainmentController.getAssessmentSummary(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should get faculty assessments", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
      };
      query.populate = sinon.stub().returns({
        populate: sinon.stub().returns({
          sort: sinon.stub().resolves([{ _id: "ass1" }]),
        }),
      });
      sinon.stub(CoAttainmentAssessment, "find").returns(query);

      const req = { body: { facultyId: "FAC01" }, query: { academicYear: "2024" } };
      const res = mockRes();

      await coattainmentController.getFacultyAssessments(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });
});
