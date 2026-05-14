const studentDetails = require("../../models/Students/details.model.js");
const DetainStudent = require("../../models/Students/detain.students.js");
const Library = require("../../models/Other/library.model.js");
const mongoose = require("mongoose");

const moveToDetainStudents = async (req, res) => {
  try {
    const { studentId, detentionReason } = req.body;

    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Student ID is required" 
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the student with all details
      const student = await studentDetails.findById(studentId).session(session);
      
      if (!student) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          success: false, 
          message: "Student not found" 
        });
      }

      // Check if student is already detained
      const existingDetained = await DetainStudent.findOne({ 
        enrollmentNo: student.enrollmentNo 
      }).session(session);

      if (existingDetained) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Student already in detained records" 
        });
      }

      // Create detain student record
      const detainStudentData = {
        originalStudentId: student._id,
        enrollmentNo: student.enrollmentNo,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        email: student.email,
        phoneNumber: student.phoneNumber,
        FatherName: student.FatherName,
        MotherName: student.MotherName,
        FatherPhoneNumber: student.FatherPhoneNumber,
        MotherPhoneNumber: student.MotherPhoneNumber,
        semester: student.semester,
        branch: student.branch,
        batch: student.batch,
        gender: student.gender,
        profile: student.profile,
        section: student.section,
        certifications: student.certifications || [],
        books: student.books || [],
        transport: student.transport || {},
        transportPreferences: student.transportPreferences || {},
        transportHistory: student.transportHistory || [],
        detentionDate: new Date(),
        detainedBy: req.user?.email || "system",
        detentionReason: detentionReason || "Student detained"
      };

      const detainedStudent = await DetainStudent.create([detainStudentData], { session });

      // Return any books the student had
      const issuedBooks = student.books.filter(book => book.status === 'issued');
      if (issuedBooks.length > 0) {
        const bookIds = issuedBooks.map(book => book.bookId);
        
        // Update library issued counts
        await Library.updateMany(
          { _id: { $in: bookIds } },
          { $inc: { issuedCount: -1 } },
          { session }
        );

        // Clean up negative counts
        await Library.updateMany(
          { issuedCount: { $lt: 0 } },
          { $set: { issuedCount: 0 } },
          { session }
        );
      }

      // Delete the student from original collection
      await studentDetails.findByIdAndDelete(studentId).session(session);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      res.json({ 
        success: true, 
        message: "Student moved to detained students successfully",
        detainedStudent: detainedStudent[0]
      });

    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error("Error moving student to detain:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDetainedStudents = async (req, res) => {
  try {
    const { branch, batch, semester } = req.query;
    
    let query = {};
    if (branch) query.branch = branch;
    if (batch) query.batch = parseInt(batch);
    if (semester) query.semester = parseInt(semester);

    const detainedStudents = await DetainStudent.find(query)
      .sort({ detentionDate: -1 });

    res.json({
      success: true,
      count: detainedStudents.length,
      students: detainedStudents
    });

  } catch (error) {
    console.error("Error fetching detained students:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

const restoreDetainedStudent = async (req, res) => {
  try {
    const { detainId } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find detained student
      const detainedStudent = await DetainStudent.findById(detainId).session(session);
      
      if (!detainedStudent) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          success: false, 
          message: "Detained student not found" 
        });
      }

      // Check if student already exists in main collection
      const existingStudent = await studentDetails.findOne({ 
        enrollmentNo: detainedStudent.enrollmentNo 
      }).session(session);

      if (existingStudent) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Student already exists in main collection" 
        });
      }

      // Create student data without detention fields
      const studentData = {
        enrollmentNo: detainedStudent.enrollmentNo,
        firstName: detainedStudent.firstName,
        middleName: detainedStudent.middleName,
        lastName: detainedStudent.lastName,
        email: detainedStudent.email,
        phoneNumber: detainedStudent.phoneNumber,
        FatherName: detainedStudent.FatherName,
        MotherName: detainedStudent.MotherName,
        FatherPhoneNumber: detainedStudent.FatherPhoneNumber,
        MotherPhoneNumber: detainedStudent.MotherPhoneNumber,
        semester: detainedStudent.semester,
        branch: detainedStudent.branch,
        batch: detainedStudent.batch,
        gender: detainedStudent.gender,
        profile: detainedStudent.profile,
        section: detainedStudent.section,
        certifications: detainedStudent.certifications || [],
        books: detainedStudent.books || [],
        transport: detainedStudent.transport || {},
        transportPreferences: detainedStudent.transportPreferences || {},
        transportHistory: detainedStudent.transportHistory || [],
        detained: false,
        passed: false
      };

      // Restore student to main collection
      const restoredStudent = await studentDetails.create([studentData], { session });

      // Delete from detained collection
      await DetainStudent.findByIdAndDelete(detainId).session(session);

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: "Student restored successfully",
        student: restoredStudent[0]
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error("Error restoring detained student:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

module.exports = {
  moveToDetainStudents,
  getDetainedStudents,
  restoreDetainedStudent
};