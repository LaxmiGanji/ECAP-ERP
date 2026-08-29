const sinon = require("sinon");
const { expect } = require("chai");
const mongoose = require("mongoose");

// Models
const studentDetails = require("../../models/Students/details.model.js");
const DetainStudent = require("../../models/Students/detain.students.js");
const Library = require("../../models/Other/library.model.js");

// Controller under test
const {
  moveToDetainStudents,
  getDetainedStudents,
  restoreDetainedStudent,
} = require("../../controllers/Student/detainStudent.controller.js");

// ---------- helpers ----------
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

/**
 * Creates a fake Mongoose session that supports startTransaction,
 * commitTransaction, abortTransaction, endSession.
 */
function fakeSession() {
  return {
    startTransaction: sinon.stub(),
    commitTransaction: sinon.stub().resolves(),
    abortTransaction: sinon.stub().resolves(),
    endSession: sinon.stub(),
  };
}

// =============================================================================
// detainStudent.controller.js  —  Test Suite
// =============================================================================
describe("Student Detain Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // moveToDetainStudents
  // -------------------------------------------------------------------------
  describe("moveToDetainStudents", function () {
    it("should return 400 when studentId is missing", async function () {
      const req = { body: {}, user: {} };
      const res = mockRes();

      await moveToDetainStudents(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Student ID is required");
    });

    it("should return 404 when student is not found", async function () {
      const session = fakeSession();
      sinon.stub(mongoose, "startSession").resolves(session);

      // findById().session() returns null
      sinon.stub(studentDetails, "findById").returns({
        session: sinon.stub().resolves(null),
      });

      const req = {
        body: { studentId: "nonexistent" },
        user: { email: "admin@test.com" },
      };
      const res = mockRes();

      await moveToDetainStudents(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("Student not found");
      expect(session.abortTransaction.calledOnce).to.be.true;
      expect(session.endSession.calledOnce).to.be.true;
    });

    it("should return 400 when student is already detained", async function () {
      const session = fakeSession();
      sinon.stub(mongoose, "startSession").resolves(session);

      const student = {
        _id: "s1",
        enrollmentNo: "S1",
        firstName: "Alice",
        books: [],
      };
      sinon.stub(studentDetails, "findById").returns({
        session: sinon.stub().resolves(student),
      });
      sinon.stub(DetainStudent, "findOne").returns({
        session: sinon.stub().resolves({ enrollmentNo: "S1" }), // already exists
      });

      const req = {
        body: { studentId: "s1" },
        user: { email: "admin@test.com" },
      };
      const res = mockRes();

      await moveToDetainStudents(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Student already in detained records");
      expect(session.abortTransaction.calledOnce).to.be.true;
    });

    it("should successfully move student to detained collection", async function () {
      const session = fakeSession();
      sinon.stub(mongoose, "startSession").resolves(session);

      const student = {
        _id: "s1",
        enrollmentNo: "S1",
        firstName: "Alice",
        middleName: "",
        lastName: "Smith",
        email: "alice@test.com",
        phoneNumber: "9876543210",
        FatherName: "Bob",
        MotherName: "Carol",
        FatherPhoneNumber: "9876543211",
        MotherPhoneNumber: "9876543212",
        semester: 3,
        branch: "CSE",
        batch: 2024,
        gender: "Female",
        profile: null,
        section: "A",
        certifications: [],
        books: [],
        transport: {},
        transportPreferences: {},
        transportHistory: [],
      };
      sinon.stub(studentDetails, "findById").returns({
        session: sinon.stub().resolves(student),
      });
      sinon.stub(DetainStudent, "findOne").returns({
        session: sinon.stub().resolves(null), // not already detained
      });
      sinon
        .stub(DetainStudent, "create")
        .resolves([{ enrollmentNo: "S1", _id: "d1" }]);
      sinon.stub(studentDetails, "findByIdAndDelete").returns({
        session: sinon.stub().resolves(student),
      });

      const req = {
        body: { studentId: "s1", detentionReason: "Academic issues" },
        user: { email: "admin@test.com" },
      };
      const res = mockRes();

      await moveToDetainStudents(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.include("detained students successfully");
      expect(session.commitTransaction.calledOnce).to.be.true;
      expect(session.endSession.calledOnce).to.be.true;
    });

    it("should return issued books to library when detaining", async function () {
      const session = fakeSession();
      sinon.stub(mongoose, "startSession").resolves(session);

      const bookId = new mongoose.Types.ObjectId();
      const student = {
        _id: "s1",
        enrollmentNo: "S1",
        firstName: "Alice",
        middleName: "",
        lastName: "Smith",
        email: "alice@test.com",
        phoneNumber: "9876543210",
        FatherName: "",
        MotherName: "",
        FatherPhoneNumber: "",
        MotherPhoneNumber: "",
        semester: 3,
        branch: "CSE",
        batch: 2024,
        gender: "Female",
        profile: null,
        section: "A",
        certifications: [],
        books: [{ bookId: bookId, status: "issued" }],
        transport: {},
        transportPreferences: {},
        transportHistory: [],
      };
      sinon.stub(studentDetails, "findById").returns({
        session: sinon.stub().resolves(student),
      });
      sinon.stub(DetainStudent, "findOne").returns({
        session: sinon.stub().resolves(null),
      });
      sinon
        .stub(DetainStudent, "create")
        .resolves([{ enrollmentNo: "S1" }]);

      const libraryUpdateMany = sinon.stub(Library, "updateMany").resolves();
      sinon.stub(studentDetails, "findByIdAndDelete").returns({
        session: sinon.stub().resolves(student),
      });

      const req = {
        body: { studentId: "s1" },
        user: { email: "admin@test.com" },
      };
      const res = mockRes();

      await moveToDetainStudents(req, res);

      expect(res.body.success).to.be.true;
      // Library.updateMany should be called to decrement issuedCount
      expect(libraryUpdateMany.called).to.be.true;
    });

    it("should return 500 on unexpected error", async function () {
      sinon
        .stub(mongoose, "startSession")
        .rejects(new Error("Session error"));

      const req = {
        body: { studentId: "s1" },
        user: { email: "admin@test.com" },
      };
      const res = mockRes();

      await moveToDetainStudents(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  // getDetainedStudents
  // -------------------------------------------------------------------------
  describe("getDetainedStudents", function () {
    it("should return all detained students without filter", async function () {
      const detained = [
        { enrollmentNo: "S1", branch: "CSE" },
        { enrollmentNo: "S2", branch: "ECE" },
      ];
      sinon.stub(DetainStudent, "find").returns({
        sort: sinon.stub().resolves(detained),
      });

      const req = { query: {} };
      const res = mockRes();

      await getDetainedStudents(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(2);
      expect(res.body.students).to.have.lengthOf(2);
    });

    it("should filter by branch, batch, semester", async function () {
      const detained = [{ enrollmentNo: "S1", branch: "CSE", batch: 2024, semester: 3 }];
      const sortStub = sinon.stub().resolves(detained);
      const findStub = sinon.stub(DetainStudent, "find").returns({
        sort: sortStub,
      });

      const req = {
        query: { branch: "CSE", batch: "2024", semester: "3" },
      };
      const res = mockRes();

      await getDetainedStudents(req, res);

      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(1);

      // Verify the query object passed to find
      const queryArg = findStub.getCall(0).args[0];
      expect(queryArg.branch).to.equal("CSE");
      expect(queryArg.batch).to.equal(2024);
      expect(queryArg.semester).to.equal(3);
    });

    it("should return 500 on database error", async function () {
      sinon.stub(DetainStudent, "find").returns({
        sort: sinon.stub().rejects(new Error("DB")),
      });

      const req = { query: {} };
      const res = mockRes();

      await getDetainedStudents(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  // restoreDetainedStudent
  // -------------------------------------------------------------------------
  describe("restoreDetainedStudent", function () {
    it("should return 404 when detained student not found", async function () {
      const session = fakeSession();
      sinon.stub(mongoose, "startSession").resolves(session);

      sinon.stub(DetainStudent, "findById").returns({
        session: sinon.stub().resolves(null),
      });

      const req = { params: { detainId: "nonexistent" } };
      const res = mockRes();

      await restoreDetainedStudent(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("Detained student not found");
      expect(session.abortTransaction.calledOnce).to.be.true;
    });

    it("should return 400 when student already exists in main collection", async function () {
      const session = fakeSession();
      sinon.stub(mongoose, "startSession").resolves(session);

      sinon.stub(DetainStudent, "findById").returns({
        session: sinon.stub().resolves({
          enrollmentNo: "S1",
          firstName: "Alice",
        }),
      });
      sinon.stub(studentDetails, "findOne").returns({
        session: sinon.stub().resolves({ enrollmentNo: "S1" }), // already exists
      });

      const req = { params: { detainId: "d1" } };
      const res = mockRes();

      await restoreDetainedStudent(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal(
        "Student already exists in main collection"
      );
    });

    it("should restore detained student successfully", async function () {
      const session = fakeSession();
      sinon.stub(mongoose, "startSession").resolves(session);

      const detainedStudent = {
        _id: "d1",
        enrollmentNo: "S1",
        firstName: "Alice",
        middleName: "",
        lastName: "Smith",
        email: "alice@test.com",
        phoneNumber: "9876543210",
        FatherName: "Bob",
        MotherName: "Carol",
        FatherPhoneNumber: "9876543211",
        MotherPhoneNumber: "9876543212",
        semester: 3,
        branch: "CSE",
        batch: 2024,
        gender: "Female",
        profile: null,
        section: "A",
        certifications: [],
        books: [],
        transport: {},
        transportPreferences: {},
        transportHistory: [],
      };

      sinon.stub(DetainStudent, "findById").returns({
        session: sinon.stub().resolves(detainedStudent),
      });
      sinon.stub(studentDetails, "findOne").returns({
        session: sinon.stub().resolves(null), // no duplicate
      });
      sinon.stub(studentDetails, "create").resolves([
        { enrollmentNo: "S1", firstName: "Alice" },
      ]);
      sinon.stub(DetainStudent, "findByIdAndDelete").returns({
        session: sinon.stub().resolves(detainedStudent),
      });

      const req = { params: { detainId: "d1" } };
      const res = mockRes();

      await restoreDetainedStudent(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Student restored successfully");
      expect(session.commitTransaction.calledOnce).to.be.true;
    });

    it("should return 500 on unexpected error", async function () {
      sinon
        .stub(mongoose, "startSession")
        .rejects(new Error("Session fail"));

      const req = { params: { detainId: "d1" } };
      const res = mockRes();

      await restoreDetainedStudent(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });
});
