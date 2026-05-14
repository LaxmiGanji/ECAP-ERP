const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/multer.middleware.js");
const studentDetails = require("../../models/Students/details.model.js");

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
} = require("../../controllers/Student/details.controller.js");

// Routes
router.post("/getDetails", getDetails);
router.get("/getDetails2", getDetails2);
router.get("/getDetailsByEnrollment", getDetailsByEnrollment);
router.post("/addDetails", upload.single("profile"), addDetails);
router.put("/updateDetails/:id", upload.single("profile"), updateDetails);
router.put("/updateDetails2/:id", upload.single("profile"), updateDetails2);
router.put("/assignSection", assignSectionToStudents); // Changed from PUT to POST
router.delete('/delete/:id', deleteDetails);
router.post("/getCount", getCount); // Changed from GET to POST to match controller
router.post("/assignBooks", assignBooksToStudent);
router.post("/returnBooks", returnBooks);
router.get("/search", searchStudents);
router.get("/reports/byBatchBranch", getStudentsByBatchAndBranch);

// Find students by book - Enhanced version
router.get("/findByBook", async (req, res) => {
  try {
    const { bookId } = req.query;
    
    if (!bookId) {
      return res.status(400).json({ 
        success: false, 
        message: "Book ID is required" 
      });
    }

    // Validate bookId format
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid book ID format" 
      });
    }

    const students = await studentDetails.find({
      'books.bookId': bookId,
      'books.status': 'issued'
    })
    .select('firstName lastName enrollmentNo branch semester section phoneNumber')
    .populate('books.bookId', 'bookName author bookCode'); // Populate book details

    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error("Find by book error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Additional useful routes you might want to add:

// Get student's issued books
router.get("/:enrollmentNo/issued-books", async (req, res) => {
  try {
    const { enrollmentNo } = req.params;
    
    const student = await studentDetails.findOne({ enrollmentNo })
      .populate('books.bookId', 'bookName author bookCode genre')
      .select('firstName lastName enrollmentNo books');
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    const issuedBooks = student.books.filter(book => book.status === 'issued');
    
    res.json({
      success: true,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        enrollmentNo: student.enrollmentNo,
        issuedBooks
      }
    });
  } catch (error) {
    console.error("Get issued books error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});

// Get students with active books (for reports)
router.get("/reports/active-borrowers", async (req, res) => {
  try {
    const students = await studentDetails.find({
      'books.status': 'issued'
    })
    .populate('books.bookId', 'bookName author bookCode')
    .select('firstName lastName enrollmentNo branch semester books')
    .sort({ enrollmentNo: 1 });

    const activeBorrowers = students.filter(student => 
      student.books.some(book => book.status === 'issued')
    );

    res.json({
      success: true,
      count: activeBorrowers.length,
      students: activeBorrowers
    });
  } catch (error) {
    console.error("Active borrowers report error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});

module.exports = router;