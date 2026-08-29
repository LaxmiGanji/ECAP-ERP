const sinon = require("sinon");
const { expect } = require("chai");
const mongoose = require("mongoose");

// Models
const studentDetails = require("../../models/Students/details.model.js");
const Library = require("../../models/Other/library.model.js");
const Attendance = require("../../models/Other/attedence.model.js");

// Controller under test
const {
  getDetails,
  getDetails2,
  getDetailsByEnrollment,
  addDetails,
  updateDetails,
  updateDetails2,
  assignSectionToStudents,
  deleteDetails,
  getCount,
  assignBooksToStudent,
  returnBooks,
  searchStudents,
  getStudentsByBatchAndBranch,
  graduateStudents,
  updateBacklogs,
} = require("../../controllers/Student/details.controller.js");

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

/** Build a fake Mongoose query that supports .populate().lean() chaining */
function fakeQuery(result) {
  const q = {
    populate: sinon.stub().returnsThis(),
    lean: sinon.stub().resolves(result),
    select: sinon.stub().returnsThis(),
    sort: sinon.stub().resolves(result),
  };
  // If lean is not called (some queries resolve directly)
  q.then = (resolve) => resolve(result);
  return q;
}

// =============================================================================
// details.controller.js  —  Test Suite
// =============================================================================
describe("Student Details Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // getDetails
  // -------------------------------------------------------------------------
  describe("getDetails", function () {
    it("should return students matching the body filter", async function () {
      const students = [{ enrollmentNo: "S1", firstName: "Alice" }];
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().resolves(students),
      };
      sinon.stub(studentDetails, "find").returns(query);

      const req = { body: { branch: "CSE" } };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.user).to.deep.equal(students);
    });

    it("should return 404 when no students match", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().resolves([]),
      };
      sinon.stub(studentDetails, "find").returns(query);

      const req = { body: { branch: "NONE" } };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("No Student Found");
    });

    it("should return 404 when find returns null", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().resolves(null),
      };
      sinon.stub(studentDetails, "find").returns(query);

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(404);
    });

    it("should return 500 on database error", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().rejects(new Error("DB crash")),
      };
      sinon.stub(studentDetails, "find").returns(query);

      const req = { body: {} };
      const res = mockRes();

      await getDetails(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  // getDetailsByEnrollment
  // -------------------------------------------------------------------------
  describe("getDetailsByEnrollment", function () {
    it("should return 400 when enrollmentNo is missing", async function () {
      const req = { query: {} };
      const res = mockRes();

      await getDetailsByEnrollment(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Enrollment number is required");
    });

    it("should return student when found", async function () {
      const student = { enrollmentNo: "S1", firstName: "Bob" };
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().resolves(student),
      };
      sinon.stub(studentDetails, "findOne").returns(query);

      const req = { query: { enrollmentNo: "S1" } };
      const res = mockRes();

      await getDetailsByEnrollment(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.user).to.deep.equal([student]);
    });

    it("should return 404 when student not found", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().resolves(null),
      };
      sinon.stub(studentDetails, "findOne").returns(query);

      const req = { query: { enrollmentNo: "GHOST" } };
      const res = mockRes();

      await getDetailsByEnrollment(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("Student not found");
    });

    it("should return 500 on database error", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().rejects(new Error("DB")),
      };
      sinon.stub(studentDetails, "findOne").returns(query);

      const req = { query: { enrollmentNo: "S1" } };
      const res = mockRes();

      await getDetailsByEnrollment(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // getDetails2
  // -------------------------------------------------------------------------
  describe("getDetails2", function () {
    it("should return all students", async function () {
      const students = [{ enrollmentNo: "S1" }, { enrollmentNo: "S2" }];
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().resolves(students),
      };
      sinon.stub(studentDetails, "find").returns(query);

      const req = {};
      const res = mockRes();

      await getDetails2(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.students).to.have.lengthOf(2);
    });

    it("should return 404 when no students exist", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().resolves([]),
      };
      sinon.stub(studentDetails, "find").returns(query);

      const req = {};
      const res = mockRes();

      await getDetails2(req, res);

      expect(res.statusCode).to.equal(404);
    });

    it("should return 500 on error", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
        lean: sinon.stub().rejects(new Error("DB")),
      };
      sinon.stub(studentDetails, "find").returns(query);

      const req = {};
      const res = mockRes();

      await getDetails2(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // addDetails
  // -------------------------------------------------------------------------
  describe("addDetails", function () {
    it("should add student details successfully", async function () {
      sinon.stub(studentDetails, "findOne").resolves(null);
      const created = {
        enrollmentNo: "S100",
        firstName: "Test",
        batch: 2024,
        branch: "CSE",
        semester: 1,
        phoneNumber: "9876543210",
        regulation: "R20",
      };
      sinon.stub(studentDetails, "create").resolves(created);

      const req = {
        body: {
          enrollmentNo: "S100",
          firstName: "Test",
          batch: "2024",
          branch: "CSE",
          semester: 1,
          phoneNumber: "9876543210",
          regulation: "R20",
        },
        file: undefined,
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Student Details Added!");
    });

    it("should return 400 when enrollmentNo is missing", async function () {
      const req = { body: { firstName: "No Enrollment" }, file: undefined };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("enrollmentNo is required");
    });

    it("should return 400 when batch is missing", async function () {
      sinon.stub(studentDetails, "findOne").resolves(null);

      const req = {
        body: { enrollmentNo: "S100", firstName: "Test" },
        file: undefined,
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Batch is required");
    });

    it("should return 400 when batch is not a valid number", async function () {
      sinon.stub(studentDetails, "findOne").resolves(null);

      const req = {
        body: { enrollmentNo: "S100", batch: "not_a_year" },
        file: undefined,
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Batch must be a valid year");
    });

    it("should return 400 when enrollment already exists (no overwrite)", async function () {
      sinon.stub(studentDetails, "findOne").resolves({ enrollmentNo: "S100" });

      const req = {
        body: { enrollmentNo: "S100", batch: "2024" },
        file: undefined,
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Already Exists");
    });

    it("should overwrite when type is excel-import and overwrite is true", async function () {
      sinon
        .stub(studentDetails, "findOne")
        .resolves({ enrollmentNo: "S100", semester: 1 });
      sinon.stub(studentDetails, "updateOne").resolves({ modifiedCount: 1 });

      const req = {
        body: {
          enrollmentNo: "S100",
          batch: "2024",
          type: "excel-import",
          overwrite: "true",
        },
        file: undefined,
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.include("Import Overwrite");
    });

    it("should return 500 on database error", async function () {
      sinon.stub(studentDetails, "findOne").rejects(new Error("DB"));

      const req = {
        body: { enrollmentNo: "S100", batch: "2024" },
        file: undefined,
      };
      const res = mockRes();

      await addDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // updateDetails
  // -------------------------------------------------------------------------
  describe("updateDetails", function () {
    it("should update student details successfully", async function () {
      const current = {
        _id: "id1",
        enrollmentNo: "S1",
        semester: 3,
        detained: false,
      };
      sinon.stub(studentDetails, "findById").resolves(current);
      sinon
        .stub(studentDetails, "findByIdAndUpdate")
        .resolves({ ...current, firstName: "Updated" });

      const req = {
        params: { id: "id1" },
        body: { firstName: "Updated" },
        file: undefined,
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Updated Successfully!");
    });

    it("should return 400 for invalid phone number", async function () {
      const req = {
        params: { id: "id1" },
        body: { phoneNumber: "12345" },
        file: undefined,
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Invalid phone number");
    });

    it("should return 400 for invalid email", async function () {
      const req = {
        params: { id: "id1" },
        body: { email: "bad-email" },
        file: undefined,
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Invalid email format");
    });

    it("should return 404 when student not found", async function () {
      sinon.stub(studentDetails, "findById").resolves(null);

      const req = {
        params: { id: "ghost" },
        body: { firstName: "X" },
        file: undefined,
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("No Student Found");
    });

    it("should respond with shouldDetain when student is being detained", async function () {
      const current = {
        _id: "id1",
        enrollmentNo: "S1",
        semester: 3,
        detained: false,
      };
      sinon.stub(studentDetails, "findById").resolves(current);

      const req = {
        params: { id: "id1" },
        body: { detained: true },
        file: undefined,
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.body.success).to.be.true;
      expect(res.body.shouldDetain).to.be.true;
      expect(res.body.studentId).to.equal("id1");
    });

    it("should return 400 for invalid semester (out of 1-8 range)", async function () {
      const req = {
        params: { id: "id1" },
        body: { semester: "10" },
        file: undefined,
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Semester must be between 1 and 8");
    });

    it("should return 500 on database error", async function () {
      sinon.stub(studentDetails, "findById").rejects(new Error("DB"));

      const req = {
        params: { id: "id1" },
        body: { firstName: "X" },
        file: undefined,
      };
      const res = mockRes();

      await updateDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // updateDetails2
  // -------------------------------------------------------------------------
  describe("updateDetails2", function () {
    it("should update student by enrollmentNo", async function () {
      sinon
        .stub(studentDetails, "findOneAndUpdate")
        .resolves({ enrollmentNo: "S1", firstName: "Updated" });

      const req = {
        params: { id: "S1" },
        body: { firstName: "Updated" },
        file: undefined,
      };
      const res = mockRes();

      await updateDetails2(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should push certification when type is certification", async function () {
      sinon
        .stub(studentDetails, "findOneAndUpdate")
        .resolves({ enrollmentNo: "S1", certifications: ["cert.pdf"] });

      const req = {
        params: { id: "S1" },
        body: { type: "certification" },
        file: { path: "/uploads/cert.pdf" },
      };
      const res = mockRes();

      await updateDetails2(req, res);

      expect(res.body.success).to.be.true;
      // Verify $push was used for certifications
      const call = studentDetails.findOneAndUpdate.getCall(0);
      expect(call.args[1]).to.have.property("$push");
    });

    it("should return 400 when student not found", async function () {
      sinon.stub(studentDetails, "findOneAndUpdate").resolves(null);

      const req = {
        params: { id: "GHOST" },
        body: { firstName: "X" },
        file: undefined,
      };
      const res = mockRes();

      await updateDetails2(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("No Student Found");
    });

    it("should return 500 on database error", async function () {
      sinon
        .stub(studentDetails, "findOneAndUpdate")
        .rejects(new Error("DB"));

      const req = { params: { id: "S1" }, body: {}, file: undefined };
      const res = mockRes();

      await updateDetails2(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // assignSectionToStudents
  // -------------------------------------------------------------------------
  describe("assignSectionToStudents", function () {
    it("should return 400 when required fields are missing", async function () {
      const req = { body: { branch: "CSE" } }; // missing semester and section
      const res = mockRes();

      await assignSectionToStudents(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should return 400 when neither enrollments nor range is provided", async function () {
      const req = {
        body: { branch: "CSE", semester: 3, section: "A" },
      };
      const res = mockRes();

      await assignSectionToStudents(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("enrollment");
    });

    it("should assign section using studentEnrollments array", async function () {
      sinon
        .stub(studentDetails, "updateMany")
        .resolves({ modifiedCount: 3 });

      const req = {
        body: {
          branch: "CSE",
          semester: 3,
          section: "B",
          studentEnrollments: ["S1", "S2", "S3"],
        },
      };
      const res = mockRes();

      await assignSectionToStudents(req, res);

      expect(res.body.success).to.be.true;
      expect(res.body.message).to.include("3");
    });

    it("should assign section using enrollment range", async function () {
      sinon
        .stub(studentDetails, "updateMany")
        .resolves({ modifiedCount: 5 });

      const req = {
        body: {
          branch: "CSE",
          semester: 3,
          section: "A",
          fromEnrollment: "S001",
          toEnrollment: "S005",
        },
      };
      const res = mockRes();

      await assignSectionToStudents(req, res);

      expect(res.body.success).to.be.true;
      expect(res.body.message).to.include("5");
    });

    it("should return 500 on database error", async function () {
      sinon
        .stub(studentDetails, "updateMany")
        .rejects(new Error("DB"));

      const req = {
        body: {
          branch: "CSE",
          semester: 3,
          section: "A",
          studentEnrollments: ["S1"],
        },
      };
      const res = mockRes();

      await assignSectionToStudents(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // deleteDetails
  // -------------------------------------------------------------------------
  describe("deleteDetails", function () {
    it("should delete student successfully", async function () {
      sinon
        .stub(studentDetails, "findByIdAndDelete")
        .resolves({ enrollmentNo: "S1" });

      const req = { params: { id: "id1" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Deleted Successfully!");
    });

    it("should return 400 when student not found", async function () {
      sinon.stub(studentDetails, "findByIdAndDelete").resolves(null);

      const req = { params: { id: "ghost" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should return 500 on database error", async function () {
      sinon
        .stub(studentDetails, "findByIdAndDelete")
        .rejects(new Error("DB"));

      const req = { params: { id: "id1" } };
      const res = mockRes();

      await deleteDetails(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // getCount
  // -------------------------------------------------------------------------
  describe("getCount", function () {
    it("should return count of matching students", async function () {
      sinon.stub(studentDetails, "count").resolves(42);

      const req = { body: { branch: "CSE" } };
      const res = mockRes();

      await getCount(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.user).to.equal(42);
    });

    it("should return 500 on error", async function () {
      sinon.stub(studentDetails, "count").rejects(new Error("DB"));

      const req = { body: {} };
      const res = mockRes();

      await getCount(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // searchStudents
  // -------------------------------------------------------------------------
  describe("searchStudents", function () {
    it("should search by query string", async function () {
      const students = [{ firstName: "Alice", enrollmentNo: "S1" }];
      sinon.stub(studentDetails, "find").resolves(students);

      const req = { query: { query: "Alice" } };
      const res = mockRes();

      await searchStudents(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.students).to.deep.equal(students);
    });

    it("should return 500 on database error", async function () {
      sinon.stub(studentDetails, "find").rejects(new Error("DB"));

      const req = { query: { query: "test" } };
      const res = mockRes();

      await searchStudents(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.body.message).to.equal("Search failed");
    });
  });

  // -------------------------------------------------------------------------
  // assignBooksToStudent
  // -------------------------------------------------------------------------
  describe("assignBooksToStudent", function () {
    it("should return 400 when enrollmentNo or bookIds missing", async function () {
      const req = { body: {} };
      const res = mockRes();

      await assignBooksToStudent(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("required");
    });

    it("should return 400 when no valid book IDs provided", async function () {
      const req = {
        body: { enrollmentNo: "S1", bookIds: ["invalid_id"] },
      };
      const res = mockRes();

      await assignBooksToStudent(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("No valid book IDs");
    });

    it("should return 404 when student not found", async function () {
      const validId = new mongoose.Types.ObjectId().toString();
      sinon.stub(studentDetails, "findOne").resolves(null);

      const req = {
        body: { enrollmentNo: "GHOST", bookIds: [validId] },
      };
      const res = mockRes();

      await assignBooksToStudent(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.include("not found");
    });

    it("should return 404 when some books not found in library", async function () {
      const bookId1 = new mongoose.Types.ObjectId().toString();
      const bookId2 = new mongoose.Types.ObjectId().toString();

      sinon.stub(studentDetails, "findOne").resolves({
        enrollmentNo: "S1",
        books: [],
      });
      sinon.stub(Library, "find").resolves([
        { _id: bookId1, bookName: "Book1", quantity: 5, issuedCount: 0 },
      ]); // only 1 of 2 found

      const req = {
        body: { enrollmentNo: "S1", bookIds: [bookId1, bookId2] },
      };
      const res = mockRes();

      await assignBooksToStudent(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.include("not found in library");
    });

    it("should return 400 when books are unavailable (issuedCount >= quantity)", async function () {
      const bookId1 = new mongoose.Types.ObjectId().toString();
      sinon.stub(studentDetails, "findOne").resolves({
        enrollmentNo: "S1",
        books: [],
      });
      sinon.stub(Library, "find").resolves([
        { _id: bookId1, bookName: "Book1", quantity: 2, issuedCount: 2 },
      ]);

      const req = {
        body: { enrollmentNo: "S1", bookIds: [bookId1] },
      };
      const res = mockRes();

      await assignBooksToStudent(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("not available for issue");
    });

    it("should assign books to student successfully", async function () {
      const bookId1 = new mongoose.Types.ObjectId().toString();
      const mockStudent = {
        enrollmentNo: "S1",
        books: [{ status: "returned", bookId: "oldBook" }],
        markModified: sinon.stub(),
        save: sinon.stub().resolves(),
      };

      const populateQuery = {
        populate: sinon.stub().resolves({ enrollmentNo: "S1", books: mockStudent.books }),
      };

      sinon.stub(studentDetails, "findOne")
        .onFirstCall().resolves(mockStudent)
        .onSecondCall().returns(populateQuery);

      sinon.stub(Library, "find").resolves([
        { _id: bookId1, bookName: "Book1", quantity: 5, issuedCount: 1 },
      ]);
      sinon.stub(Library, "updateMany").resolves();

      const req = {
        body: { enrollmentNo: "S1", bookIds: [bookId1] },
      };
      const res = mockRes();

      await assignBooksToStudent(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should return 500 on database error", async function () {
      const validId = new mongoose.Types.ObjectId().toString();
      sinon.stub(studentDetails, "findOne").rejects(new Error("DB"));

      const req = {
        body: { enrollmentNo: "S1", bookIds: [validId] },
      };
      const res = mockRes();

      await assignBooksToStudent(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // returnBooks
  // -------------------------------------------------------------------------
  describe("returnBooks", function () {
    it("should return 400 when data is missing", async function () {
      const req = { body: {} };
      const res = mockRes();

      await returnBooks(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Invalid request data");
    });

    it("should return 404 when student not found", async function () {
      const query = {
        populate: sinon.stub().returnsThis(),
      };
      // Make the query chain resolve to null
      sinon.stub(studentDetails, "findOne").returns({
        populate: sinon.stub().resolves(null),
      });

      const req = {
        body: { enrollmentNo: "GHOST", bookIds: ["b1"] },
      };
      const res = mockRes();

      await returnBooks(req, res);

      expect(res.statusCode).to.equal(404);
    });

    it("should return 400 when no matching issued books found", async function () {
      const bookId = new mongoose.Types.ObjectId();
      const student = {
        enrollmentNo: "S1",
        books: [
          {
            bookId: { _id: bookId, toString: () => bookId.toString() },
            status: "returned", // already returned
          },
        ],
        markModified: sinon.stub(),
        save: sinon.stub().resolves(),
      };
      sinon.stub(studentDetails, "findOne").returns({
        populate: sinon.stub().resolves(student),
      });

      const req = {
        body: { enrollmentNo: "S1", bookIds: [bookId.toString()] },
      };
      const res = mockRes();

      await returnBooks(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("No matching issued books found");
    });

    it("should return 500 on database error", async function () {
      sinon.stub(studentDetails, "findOne").returns({
        populate: sinon.stub().rejects(new Error("DB")),
      });

      const req = {
        body: { enrollmentNo: "S1", bookIds: ["b1"] },
      };
      const res = mockRes();

      await returnBooks(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // getStudentsByBatchAndBranch
  // -------------------------------------------------------------------------
  describe("getStudentsByBatchAndBranch", function () {
    it("should return 400 when no filter is provided", async function () {
      const req = { query: {} };
      const res = mockRes();

      await getStudentsByBatchAndBranch(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("Provide at least");
    });

    it("should return 400 for invalid batch", async function () {
      const req = { query: { batch: "abc" } };
      const res = mockRes();

      await getStudentsByBatchAndBranch(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("Invalid batch");
    });

    it("should return students filtered by batch and branch", async function () {
      const students = [{ enrollmentNo: "S1", batch: 2024, branch: "CSE" }];
      const query = {
        populate: sinon.stub().resolves(students),
      };
      sinon.stub(studentDetails, "find").returns(query);

      const req = { query: { batch: "2024", branch: "CSE" } };
      const res = mockRes();

      await getStudentsByBatchAndBranch(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(1);
    });

    it("should return 500 on database error", async function () {
      const query = {
        populate: sinon.stub().rejects(new Error("DB")),
      };
      sinon.stub(studentDetails, "find").returns(query);

      const req = { query: { batch: "2024" } };
      const res = mockRes();

      await getStudentsByBatchAndBranch(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // graduateStudents
  // -------------------------------------------------------------------------
  describe("graduateStudents", function () {
    it("should return 400 when enrollmentNos is missing or empty", async function () {
      const req = { body: {} };
      const res = mockRes();

      await graduateStudents(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.include("enrollmentNos");
    });

    it("should return 400 when enrollmentNos is empty array", async function () {
      const req = { body: { enrollmentNos: [] } };
      const res = mockRes();

      await graduateStudents(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should graduate students successfully", async function () {
      const student = {
        enrollmentNo: "S1",
        isGraduated: false,
        firstName: "Alice",
      };
      sinon.stub(studentDetails, "findOne").resolves(student);
      sinon.stub(studentDetails, "updateOne").resolves({ modifiedCount: 1 });

      // Stub mongoose.model for Student Credential lookup
      const credModel = {
        findOne: sinon.stub().resolves({ loginid: "S1", password: "hash" }),
      };
      sinon.stub(mongoose, "model").returns(credModel);

      // Stub alumni credential
      const alumniCredential = require("../../models/Alumni/credential.model.js");
      sinon.stub(alumniCredential, "findOne").resolves(null);
      sinon.stub(alumniCredential, "create").resolves({});

      const req = { body: { enrollmentNos: ["S1"] } };
      const res = mockRes();

      await graduateStudents(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.results[0].success).to.be.true;
    });

    it("should handle student not found during graduation", async function () {
      sinon.stub(studentDetails, "findOne").resolves(null);

      const req = { body: { enrollmentNos: ["GHOST"] } };
      const res = mockRes();

      await graduateStudents(req, res);

      expect(res.body.results[0].success).to.be.false;
      expect(res.body.results[0].message).to.equal("Student not found");
    });

    it("should handle already graduated student", async function () {
      sinon.stub(studentDetails, "findOne").resolves({
        enrollmentNo: "S1",
        isGraduated: true,
      });

      const req = { body: { enrollmentNos: ["S1"] } };
      const res = mockRes();

      await graduateStudents(req, res);

      expect(res.body.results[0].success).to.be.false;
      expect(res.body.results[0].message).to.equal("Already graduated");
    });

    it("should return 500 on unexpected error", async function () {
      sinon.stub(studentDetails, "findOne").rejects(new Error("DB"));

      const req = { body: { enrollmentNos: ["S1"] } };
      const res = mockRes();

      await graduateStudents(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // updateBacklogs
  // -------------------------------------------------------------------------
  describe("updateBacklogs", function () {
    it("should return 400 when enrollmentNo is missing", async function () {
      const req = { body: { activeBacklogs: 2 } };
      const res = mockRes();

      await updateBacklogs(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal("enrollmentNo is required");
    });

    it("should update backlogs successfully", async function () {
      sinon.stub(studentDetails, "findOneAndUpdate").resolves({
        enrollmentNo: "S1",
        activeBacklogs: 2,
        backlogDetails: "Math, Physics",
      });

      const req = {
        body: {
          enrollmentNo: "S1",
          activeBacklogs: 2,
          backlogDetails: "Math, Physics",
        },
      };
      const res = mockRes();

      await updateBacklogs(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.activeBacklogs).to.equal(2);
    });

    it("should return 404 when student not found", async function () {
      sinon.stub(studentDetails, "findOneAndUpdate").resolves(null);

      const req = {
        body: { enrollmentNo: "GHOST", activeBacklogs: 0 },
      };
      const res = mockRes();

      await updateBacklogs(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal("Student not found");
    });

    it("should return 500 on database error", async function () {
      sinon
        .stub(studentDetails, "findOneAndUpdate")
        .rejects(new Error("DB"));

      const req = {
        body: { enrollmentNo: "S1", activeBacklogs: 1 },
      };
      const res = mockRes();

      await updateBacklogs(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });
});
