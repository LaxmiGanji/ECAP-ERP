const fs = require("fs");
const XLSX = require("xlsx");
const Library = require("../../models/Other/library.model.js");
const studentDetails = require("../../models/Students/details.model.js");

const sanitizeBookPayload = (payload = {}) => {
  const bookCode = Number(payload.bookCode);
  const quantity = Number(payload.quantity);

  return {
    bookName: payload.bookName?.trim(),
    bookCode: Number.isNaN(bookCode) ? undefined : bookCode,
    author: payload.author?.trim(),
    genre: payload.genre?.trim() || "General",
    quantity: Number.isNaN(quantity) ? 1 : Math.max(quantity, 0),
    rackNumber: payload.rackNumber?.trim() || "",
    publisher: payload.publisher?.trim(),
    publishedYear: payload.publishedYear ? Number(payload.publishedYear) : undefined,
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : payload.tags
      ? String(payload.tags)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
    notes: payload.notes?.trim(),
  };
};

const addLibraryBook = async (req, res) => {
  try {
    const payload = sanitizeBookPayload(req.body);

    if (!payload.bookName || typeof payload.bookCode === "undefined" || !payload.author) {
      return res
        .status(400)
        .json({ success: false, message: "Book name, code and author are required" });
    }

    let libraryBook = await Library.findOne({ bookCode: payload.bookCode });
    if (libraryBook) {
      return res.status(400).json({ success: false, message: "Book Already Exists" });
    }

    await Library.create(payload);
    res.json({
      success: true,
      message: "Book Added!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateLibraryBook = async (req, res) => {
  try {
    const payload = sanitizeBookPayload(req.body);
    const updated = await Library.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) {
      return res.status(400).json({ success: false, message: "No Book Available!" });
    }
    res.json({
      success: true,
      message: "Book Updated Successfully",
      book: updated,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const { deleteCloudFile } = require("../../utils/cloudDelete");

const deleteLibraryBook = async (req, res) => {
  try {
    let book = await Library.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(400).json({ success: false, message: "No Book Exists!" });
    }

    // Clean up uploaded book file / pdf from cloud storage
    if (book.fileUrl) await deleteCloudFile(book.fileUrl);
    if (book.pdfUrl) await deleteCloudFile(book.pdfUrl);
    if (book.link) await deleteCloudFile(book.link);

    res.json({
      success: true,
      message: "Book Deleted!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const getLibraryBook = async (req, res) => {
  try {
    const book = await Library.find().sort({ updatedAt: -1 });
    res.json({
      success: true,
      message: "All Books Loaded!",
      book,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const searchLibraryBooks = async (req, res) => {
  const query = req.query.query || "";
  try {
    const filters = [
      { bookName: new RegExp(query, "i") },
      { author: new RegExp(query, "i") },
      { genre: new RegExp(query, "i") },
    ];
    if (!Number.isNaN(Number(query))) {
      filters.push({ bookCode: Number(query) });
    }

    const books = await Library.find({ $or: filters }).limit(20);
    res.json({ success: true, books });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const bulkImportLibraryBooks = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Excel file is required" });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const firstSheet = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });

    const normalizeRow = (row = {}) => {
      const mapping = {
        bookName: row.bookName || row["Book Name"] || row["book_name"] || row["Title"],
        bookCode: row.bookCode || row["Book Code"] || row["Code"],
        author: row.author || row["Author"],
        genre: row.genre || row["Genre"],
        quantity: row.quantity || row["Quantity"] || row["Copies"],
        rackNumber: row.rackNumber || row["Rack"] || row["Rack Number"],
        publisher: row.publisher || row["Publisher"],
        publishedYear: row.publishedYear || row["Published Year"] || row["Year"],
        notes: row.notes || row["Notes"],
      };
      return sanitizeBookPayload(mapping);
    };

    const validRows = rows
      .map(normalizeRow)
      .filter((row) => row.bookName && typeof row.bookCode !== "undefined" && row.author);

    if (!validRows.length) {
      return res.status(400).json({ success: false, message: "No valid rows found in Excel" });
    }

    const ops = validRows.map((row) => ({
      updateOne: {
        filter: { bookCode: row.bookCode },
        update: {
          $setOnInsert: { issuedCount: 0 },
          $set: row,
        },
        upsert: true,
      },
    }));

    const result = await Library.bulkWrite(ops);
    res.json({
      success: true,
      message: "Import completed",
      summary: {
        inserted: result.upsertedCount || 0,
        updated: result.modifiedCount || 0,
        totalProcessed: validRows.length,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to import books", error: error.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
};

const getBorrowerSummary = async (_req, res) => {
  try {
    const students = await studentDetails
      .find({ "books.status": "issued" })
      .select("firstName lastName enrollmentNo branch semester books")
      .populate("books.bookId", "bookName author bookCode");

    const borrowers = students
      .map((student) => {
        const issuedBooks = student.books.filter((book) => book.status === "issued");
        return {
          id: student._id,
          name: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
          enrollmentNo: student.enrollmentNo,
          branch: student.branch,
          semester: student.semester,
          currentIssuedCount: issuedBooks.length,
          issuedBooks: issuedBooks.map((book) => ({
            bookId: book.bookId?._id,
            bookName: book.bookId?.bookName,
            author: book.bookId?.author,
            bookCode: book.bookId?.bookCode,
            issueDate: book.issueDate,
          })),
        };
      })
      .filter((student) => student.currentIssuedCount > 0)
      .sort((a, b) => b.currentIssuedCount - a.currentIssuedCount);

    const totals =
      (await Library.aggregate([
        {
          $group: {
            _id: null,
            totalTitles: { $sum: 1 },
            totalCopies: { $sum: "$quantity" },
            totalIssued: { $sum: "$issuedCount" },
          },
        },
      ])) || [];

    const meta = totals[0] || { totalTitles: 0, totalCopies: 0, totalIssued: 0 };
    meta.totalAvailable = Math.max(meta.totalCopies - meta.totalIssued, 0);

    res.json({
      success: true,
      borrowers,
      meta,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to load borrower summary" });
  }
};

module.exports = {
  getLibraryBook,
  addLibraryBook,
  deleteLibraryBook,
  updateLibraryBook,
  searchLibraryBooks,
  bulkImportLibraryBooks,
  getBorrowerSummary,
};
