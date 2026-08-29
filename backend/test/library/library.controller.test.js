const sinon = require("sinon");
const { expect } = require("chai");
const fs = require("fs");
const XLSX = require("xlsx");

// Models
const Library = require("../../models/Other/library.model.js");
const studentDetails = require("../../models/Students/details.model.js");

// Controller under test
const {
  getLibraryBook,
  addLibraryBook,
  deleteLibraryBook,
  updateLibraryBook,
  searchLibraryBooks,
  bulkImportLibraryBooks,
  getBorrowerSummary,
} = require("../../controllers/Other/library.controller.js");

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
// Other library.controller.js — Test Suite
// =============================================================================
describe("Other Library Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // getLibraryBook
  // -------------------------------------------------------------------------
  describe("getLibraryBook", function () {
    it("should load all library books sorted by updatedAt desc", async function () {
      const books = [{ bookName: "Clean Code", bookCode: 101 }];
      sinon.stub(Library, "find").returns({
        sort: sinon.stub().resolves(books),
      });

      const req = {};
      const res = mockRes();

      await getLibraryBook(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.book).to.deep.equal(books);
    });

    it("should return 500 on database error", async function () {
      sinon.stub(Library, "find").returns({
        sort: sinon.stub().rejects(new Error("DB Error")),
      });

      const req = {};
      const res = mockRes();

      await getLibraryBook(req, res);

      expect(res.statusCode).to.equal(500);
    });
  });

  // -------------------------------------------------------------------------
  // addLibraryBook
  // -------------------------------------------------------------------------
  describe("addLibraryBook", function () {
    it("should return 400 if bookName, bookCode, or author is missing", async function () {
      const req = { body: { bookName: "Book Without Code" } };
      const res = mockRes();

      await addLibraryBook(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should return 400 if book with same bookCode already exists", async function () {
      sinon.stub(Library, "findOne").resolves({ bookCode: 101 });

      const req = {
        body: { bookName: "Java 101", bookCode: "101", author: "Gosling" },
      };
      const res = mockRes();

      await addLibraryBook(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should add a new library book successfully", async function () {
      sinon.stub(Library, "findOne").resolves(null);
      sinon.stub(Library, "create").resolves({ bookName: "Java 101", bookCode: 101, author: "Gosling" });

      const req = {
        body: { bookName: "Java 101", bookCode: "101", author: "Gosling", quantity: "5" },
      };
      const res = mockRes();

      await addLibraryBook(req, res);

      expect(res.statusCode).to.equal(200);
    });
  });

  // -------------------------------------------------------------------------
  // updateLibraryBook & deleteLibraryBook
  // -------------------------------------------------------------------------
  describe("update & delete LibraryBook", function () {
    it("should update a book successfully", async function () {
      sinon.stub(Library, "findByIdAndUpdate").resolves({ _id: "b1", bookName: "Java 200" });

      const req = {
        params: { id: "b1" },
        body: { bookName: "Java 200", bookCode: "101", author: "Gosling" },
      };
      const res = mockRes();

      await updateLibraryBook(req, res);

      expect(res.statusCode).to.equal(200);
    });

    it("should delete book successfully", async function () {
      sinon.stub(Library, "findByIdAndDelete").resolves({ _id: "b1" });

      const req = { params: { id: "b1" } };
      const res = mockRes();

      await deleteLibraryBook(req, res);

      expect(res.statusCode).to.equal(200);
    });
  });

  // -------------------------------------------------------------------------
  // searchLibraryBooks
  // -------------------------------------------------------------------------
  describe("searchLibraryBooks", function () {
    it("should search library books by string and numeric code", async function () {
      const searchResults = [{ bookName: "Algorithms", bookCode: 201 }];
      sinon.stub(Library, "find").returns({
        limit: sinon.stub().resolves(searchResults),
      });

      const req = { query: { query: "101" } };
      const res = mockRes();

      await searchLibraryBooks(req, res);

      expect(res.statusCode).to.equal(200);
    });
  });

  // -------------------------------------------------------------------------
  // bulkImportLibraryBooks & getBorrowerSummary
  // -------------------------------------------------------------------------
  describe("bulkImportLibraryBooks & getBorrowerSummary", function () {
    it("should return 400 if no file uploaded in bulk import", async function () {
      const req = {};
      const res = mockRes();

      await bulkImportLibraryBooks(req, res);

      expect(res.statusCode).to.equal(400);
    });

    it("should bulk import books from excel file successfully", async function () {
      sinon.stub(XLSX, "readFile").returns({
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: {},
        },
      });
      sinon.stub(XLSX.utils, "sheet_to_json").returns([
        { Title: "Clean Code", Code: "101", Author: "Robert Martin", Copies: "5" },
      ]);
      sinon.stub(Library, "bulkWrite").resolves({ upsertedCount: 1, modifiedCount: 0 });
      sinon.stub(fs, "unlink").callsFake((path, cb) => cb && cb());

      const req = { file: { path: "uploads/books.xlsx" } };
      const res = mockRes();

      await bulkImportLibraryBooks(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should get borrower summary successfully", async function () {
      const studentQuery = {
        select: sinon.stub().returnsThis(),
        populate: sinon.stub().resolves([
          {
            _id: "s1",
            firstName: "Alice",
            lastName: "Smith",
            enrollmentNo: "EN01",
            branch: "CSE",
            semester: 3,
            books: [{ status: "issued", bookId: { _id: "b1", bookName: "C++", author: "Bjarne", bookCode: 105 } }],
          },
        ]),
      };
      sinon.stub(studentDetails, "find").returns(studentQuery);
      sinon.stub(Library, "aggregate").resolves([{ totalTitles: 1, totalCopies: 10, totalIssued: 1 }]);

      const req = {};
      const res = mockRes();

      await getBorrowerSummary(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.borrowers).to.have.lengthOf(1);
    });
  });
});
