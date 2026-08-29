const studentDetails = require("../../models/Students/details.model.js");
const Library = require("../../models/Other/library.model.js");
const Attendance = require("../../models/Other/attedence.model.js");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const alumniCredential = require("../../models/Alumni/credential.model.js");
const { validatePhoneNumber, validateEmail } = require("../../utils/validation.js");

const studentPlacementProfileModel = require("../../models/Placement/studentProfile.model.js");

const mergePlacementData = async (student) => {
  if (!student || !student.enrollmentNo) return student;
  try {
    const pProfile = await studentPlacementProfileModel.findOne({ enrollmentNo: student.enrollmentNo }).lean();
    if (pProfile) {
      return {
        ...student,
        tenthPercentage: student.tenthPercentage !== undefined && student.tenthPercentage !== null ? student.tenthPercentage : pProfile.tenthPercentage,
        twelfthPercentage: student.twelfthPercentage !== undefined && student.twelfthPercentage !== null ? student.twelfthPercentage : pProfile.twelfthPercentage,
        cgpa: student.cgpa !== undefined && student.cgpa !== null ? student.cgpa : pProfile.cgpa,
        activeBacklogs: student.activeBacklogs !== undefined && student.activeBacklogs !== null ? student.activeBacklogs : (pProfile.activeBacklogs || 0),
        resumeLink: student.resumeLink || pProfile.resumeLink || "",
        linkedinLink: student.linkedinLink || pProfile.linkedinLink || pProfile.githubLink || "",
      };
    }
  } catch (err) {
    console.error("Error merging placement data:", err);
  }
  return student;
};

const getJntuRank = (s) => {
  const str = (typeof s === "object" ? (s?.enrollmentNo || s?.enrollment || s?.rollNo || s?.loginid || "") : (s || "")).toString().trim().toUpperCase();
  if (!str) return { prefix: "", rank: 0 };
  if (str.length < 3) return { prefix: str, rank: 0 };

  const prefix = str.substring(0, str.length - 2);
  const suff = str.substring(str.length - 2);

  if (/^\d{2}$/.test(suff)) return { prefix, rank: parseInt(suff, 10) };
  if (/^[A-Z]\d$/.test(suff)) {
    const charCode = suff.charCodeAt(0) - 65;
    const digit = parseInt(suff[1], 10);
    return { prefix, rank: 100 + charCode * 10 + digit };
  }
  return { prefix, rank: 9999 };
};

const sortEnrollmentNo = (a, b) => {
  const rA = getJntuRank(a);
  const rB = getJntuRank(b);

  if (rA.prefix !== rB.prefix) {
    return rA.prefix.localeCompare(rB.prefix, undefined, { numeric: true, sensitivity: "base" });
  }

  return rA.rank - rB.rank;
};

const getDetails = async (req, res) => {
  try {
    // Use .lean() to avoid hydration issues when stored documents contain unexpected types
    const user = await studentDetails
      .find(req.body)
      .populate("books.bookId", "bookName author bookCode")
      .lean();

    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: "No Student Found" });
    }

    const mergedUsers = await Promise.all(user.map(mergePlacementData));
    mergedUsers.sort(sortEnrollmentNo);

    res.json({ success: true, message: "Student Details Found!", user: mergedUsers });
  } catch (error) {
    console.error("getDetails error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const getDetailsByEnrollment = async (req, res) => {
  try {
    const { enrollmentNo } = req.query;
    if (!enrollmentNo) {
      return res.status(400).json({ success: false, message: "Enrollment number is required" });
    }

    const student = await studentDetails
      .findOne({ enrollmentNo })
      .populate("books.bookId", "bookName author bookCode")
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const mergedStudent = await mergePlacementData(student);

    res.json({ success: true, message: "Student Details Found!", user: [mergedStudent] });
  } catch (error) {
    console.error("getDetailsByEnrollment error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const getDetails2 = async (req, res) => {
  try {
    // Use .lean() to avoid Mongoose casting errors for documents with unexpected field types
    // (e.g., legacy records where `transport` may be stored as a string)
    const students = await studentDetails
      .find()
      .populate("books.bookId", "bookName author")
      .lean();

    if (!students || students.length === 0) {
      return res.status(404).json({ success: false, message: "No Students Found" });
    }

    students.sort(sortEnrollmentNo);

    res.json({ success: true, message: "Student Details Found!", students });
  } catch (error) {
    console.error("getDetails2 error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const addDetails = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const enrollment = (req.body.enrollmentNo || req.body.enrollment || req.body.loginid || "").toString().trim();
    if (!enrollment) {
      return res.status(400).json({ success: false, message: "enrollmentNo is required" });
    }
    req.body.enrollmentNo = enrollment;
    const existing = await studentDetails.findOne({ enrollmentNo: enrollment });
    if (!req.body.batch) {
      return res.status(400).json({ success: false, message: "Batch is required" });
    }
    const batchParsed = parseInt(req.body.batch, 10);
    if (!Number.isFinite(batchParsed)) {
      return res.status(400).json({ success: false, message: "Batch must be a valid year" });
    }
    
    const rawType = (req.body?.type || "").toString().toLowerCase();
    const rawOverwrite = (req.body?.overwrite ?? "").toString().toLowerCase();
    const isExcelImport = rawType === "excel-import" || rawType === "excel" || rawType === "import";
    const allowOverwrite = rawOverwrite === "true" || rawOverwrite === "1" || rawOverwrite === "yes" || rawOverwrite === "on";

    if (existing) {
      if (isExcelImport && allowOverwrite) {
        const updatePayload = { ...req.body, batch: batchParsed };
        delete updatePayload.type;
        delete updatePayload.overwrite;
        if (req.file?.path) updatePayload.profile = req.file.path;
        await studentDetails.updateOne({ enrollmentNo: req.body.enrollmentNo }, { $set: updatePayload });

        // If semester has changed during import overwrite, delete old attendance
        if (updatePayload.semester && existing.semester && Number(updatePayload.semester) !== Number(existing.semester)) {
          try {
            await Attendance.deleteMany({
              enrollmentNo: existing.enrollmentNo,
              semester: { $ne: Number(updatePayload.semester) }
            });
            console.log(`Deleted old attendance for ${existing.enrollmentNo} because semester changed from ${existing.semester} to ${updatePayload.semester} via bulk import`);
          } catch (err) {
            console.error("Error deleting old attendance:", err);
          }
        }

        return res.json({ success: true, message: "Student Details Updated (Import Overwrite)!" });
      }
      return res.status(400).json({ success: false, message: "Student With This Enrollment Already Exists" });
    }
    const createPayload = { ...req.body, batch: batchParsed, profile: req.file?.path };
    delete createPayload.type;
    delete createPayload.overwrite;
    const user = await studentDetails.create(createPayload);
    res.json({ success: true, message: "Student Details Added!", user });
  } catch (error) {
    console.error("Add student error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateDetails = async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;
    
    // Only validate phone number if provided and not empty
    if (phoneNumber && phoneNumber.trim() !== "" && !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid phone number. Must be 10 digits starting with 6-9." 
      });
    }
    
    // Only validate email if provided and not empty
    if (email && email.trim() !== "" && !validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format." 
      });
    }
    
    // Validate batch if provided and not empty
    if (req.body.batch && req.body.batch.trim() !== "") {
      const parsedBatch = parseInt(req.body.batch, 10);
      if (!Number.isFinite(parsedBatch)) {
        return res.status(400).json({ 
          success: false, 
          message: "Batch must be a valid year" 
        });
      }
      req.body.batch = parsedBatch;
    }
    
    // Validate semester if provided and not empty
    if (req.body.semester && req.body.semester.trim() !== "") {
      const parsedSemester = parseInt(req.body.semester, 10);
      if (!Number.isFinite(parsedSemester) || parsedSemester < 1 || parsedSemester > 8) {
        return res.status(400).json({ 
          success: false, 
          message: "Semester must be between 1 and 8" 
        });
      }
      req.body.semester = parsedSemester;
    }

    // First, get the current student data
    const currentStudent = await studentDetails.findById(req.params.id);
    
    if (!currentStudent) {
      return res.status(404).json({
        success: false,
        message: "No Student Found",
      });
    }

    // Check if detained is being set to true
    const isBeingDetained = req.body.detained === true || req.body.detained === 'true';
    const wasDetained = currentStudent.detained || false;

    // If student is being detained now
    if (isBeingDetained && !wasDetained) {
      return res.json({
        success: true,
        shouldDetain: true,
        message: "Student marked for detention",
        studentId: req.params.id
      });
    }

    // Prepare update data - only include fields that are present in request
    const updateData = {};
    
    // List of all possible fields - including academic & placement credentials
    const fields = [
      'firstName', 'middleName', 'lastName', 'email', 'phoneNumber',
      'FatherName', 'MotherName', 'FatherPhoneNumber', 'MotherPhoneNumber',
      'semester', 'branch', 'batch', 'regulation', 'gender', 'detained', 'passed',
      'tenthPercentage', 'twelfthPercentage', 'cgpa', 'activeBacklogs', 'resumeLink', 'linkedinLink'
    ];
    
    // Only add fields that exist in req.body (they can be empty strings)
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Convert string booleans to actual booleans
        if (field === 'detained' || field === 'passed') {
          updateData[field] = req.body[field] === 'true' || req.body[field] === true;
        } else if (field === 'tenthPercentage' || field === 'twelfthPercentage' || field === 'cgpa' || field === 'activeBacklogs') {
          const num = Number(req.body[field]);
          updateData[field] = Number.isFinite(num) ? num : undefined;
        } else {
          // Allow empty strings for all fields
          updateData[field] = req.body[field];
        }
      }
    });

    // Add profile if file was uploaded
    if (req.file) {
      updateData.profile = req.file.path;
    }

    console.log("Updating student with data:", updateData);

    // Update the student
    const updatedStudent = await studentDetails.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Also sync placement profile if enrollmentNo exists
    if (updatedStudent && updatedStudent.enrollmentNo) {
      try {
        const studentPlacementProfile = require("../../models/Placement/studentProfile.model.js");
        const placementPayload = {
          enrollmentNo: updatedStudent.enrollmentNo,
          branch: updatedStudent.branch,
          tenthPercentage: updatedStudent.tenthPercentage,
          twelfthPercentage: updatedStudent.twelfthPercentage,
          cgpa: updatedStudent.cgpa,
          activeBacklogs: updatedStudent.activeBacklogs || 0,
          resumeLink: updatedStudent.resumeLink,
          linkedinLink: updatedStudent.linkedinLink,
        };
        await studentPlacementProfile.findOneAndUpdate(
          { enrollmentNo: updatedStudent.enrollmentNo },
          { $set: placementPayload },
          { upsert: true }
        );
      } catch (err) {
        console.error("Error syncing student placement profile:", err);
      }
    }
    
    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Failed to update student"
      });
    }

    // If semester has changed, delete the old attendance records
    if (updateData.semester && currentStudent.semester && updateData.semester !== currentStudent.semester) {
      try {
        await Attendance.deleteMany({
          enrollmentNo: currentStudent.enrollmentNo,
          semester: { $ne: updateData.semester }
        });
        console.log(`Deleted old attendance for ${currentStudent.enrollmentNo} because semester changed from ${currentStudent.semester} to ${updateData.semester}`);
      } catch (err) {
        console.error("Error deleting old attendance:", err);
      }
    }

    return res.json({
      success: true,
      message: "Updated Successfully!",
      user: updatedStudent
    });
    
  } catch (error) {
    console.error("Update student error:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error. Please try again later." 
    });
  }
};

const updateDetails2 = async (req, res) => {
  try {
    const enrollmentNo = req.params.id;
    let user;

    if (req.body?.type === "certification" && req.file) {
      user = await studentDetails.findOneAndUpdate(
        { enrollmentNo },
        { $push: { certifications: req.file.path } },
        { new: true }
      );
    } else if (req.body?.type === "profile") {
      user = await studentDetails.findOneAndUpdate(
        { enrollmentNo },
        req.file ? { ...req.body, profile: req.file.path } : req.body,
        { new: true }
      );
    } else {
      user = await studentDetails.findOneAndUpdate(
        { enrollmentNo },
        req.file ? { ...req.body, file: req.file.path } : req.body,
        { new: true }
      );
    }

    if (!user) return res.status(400).json({ success: false, message: "No Student Found" });

    res.json({ success: true, message: "Updated Successfully!", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const assignSectionToStudents = async (req, res) => {
  try {
    const { branch, semester, section, fromEnrollment, toEnrollment, studentEnrollments } = req.body;

    if (!branch || !semester || !section) {
      return res.status(400).json({ success: false, message: "Branch, semester, and section are required" });
    }

    let query = { branch, semester };
    let message = "";

    if (studentEnrollments && studentEnrollments.length > 0) {
      query.enrollmentNo = { $in: studentEnrollments };
      message = `${studentEnrollments.length} student(s) selected for section assignment`;
    }
    else if (fromEnrollment && toEnrollment) {
      query.enrollmentNo = { $gte: fromEnrollment, $lte: toEnrollment };
      message = `Students from ${fromEnrollment} to ${toEnrollment} selected for section assignment`;
    }
    else {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide either student enrollments array or enrollment range (fromEnrollment and toEnrollment)" 
      });
    }

    const result = await studentDetails.updateMany(query, { $set: { section } });

    res.json({
      success: true,
      message: `${result.modifiedCount} student(s) updated to section ${section}. ${message}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const { deleteCloudFile } = require("../../utils/cloudDelete");

const deleteDetails = async (req, res) => {
  try {
    const user = await studentDetails.findByIdAndDelete(req.params.id);
    if (!user) return res.status(400).json({ success: false, message: "No Student Found" });

    // Clean up profile photo and certificates from AWS S3 / Cloudinary
    if (user.profile) {
      await deleteCloudFile(user.profile);
    }
    if (user.certifications && Array.isArray(user.certifications)) {
      for (const certUrl of user.certifications) {
        await deleteCloudFile(certUrl);
      }
    }

    res.json({ success: true, message: "Deleted Successfully!" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const getCount = async (req, res) => {
  try {
    const user = await studentDetails.countDocuments(req.body || {});
    res.json({ success: true, message: "Count Successful!", user });
  } catch (error) {
    try {
      const allStudents = await studentDetails.find(req.body || {});
      res.json({ success: true, message: "Count Successful!", user: allStudents.length });
    } catch (err) {
      res.status(500).json({ success: false, message: "Internal Server Error", error: err });
    }
  }
};

// FIXED: assignBooksToStudent function
const assignBooksToStudent = async (req, res) => {
  const { enrollmentNo, bookIds } = req.body;

  console.log("📚 Assigning books request:", { enrollmentNo, bookIds });

  try {
    // Validation
    if (!enrollmentNo || !bookIds?.length) {
      return res.status(400).json({ 
        success: false, 
        message: "Enrollment number and book IDs are required" 
      });
    }

    // Validate book IDs
    const validBookIds = bookIds.filter(id => 
      id && mongoose.Types.ObjectId.isValid(id)
    );

    if (validBookIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No valid book IDs provided" 
      });
    }

    console.log("✅ Valid book IDs:", validBookIds);

    // Find student
    const student = await studentDetails.findOne({ enrollmentNo });
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: `Student with enrollment ${enrollmentNo} not found` 
      });
    }

    console.log("✅ Found student:", student.enrollmentNo);

    // Find books and check availability
    const books = await Library.find({ 
      _id: { $in: validBookIds } 
    });

    console.log("✅ Found books:", books.length);

    if (books.length !== validBookIds.length) {
      const foundIds = books.map(book => book._id.toString());
      const missingIds = validBookIds.filter(id => !foundIds.includes(id.toString()));
      console.log("❌ Missing books:", missingIds);
      
      return res.status(404).json({ 
        success: false, 
        message: "Some books not found in library",
        missingBooks: missingIds
      });
    }

    // Clean up any malformed historical book entries to prevent validation errors
    const sanitizedBookEntries = (student.books || []).filter((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return false;
      }
      return Boolean(entry.bookId);
    });

    const booksWereSanitized = sanitizedBookEntries.length !== student.books.length;
    if (booksWereSanitized) {
      console.warn(
        `⚠️ Removed ${student.books.length - sanitizedBookEntries.length} invalid book entr${
          sanitizedBookEntries.length === 1 ? "y" : "ies"
        } for student ${student.enrollmentNo}`
      );
      student.books = sanitizedBookEntries;
    }

    // Check for already issued books to this student
    const existingIssuedBooks = sanitizedBookEntries
      .filter(book => book.status === "issued")
      .map((book) => {
        if (!book.bookId) return null;
        if (typeof book.bookId === "string") return book.bookId;
        if (book.bookId._id) return book.bookId._id.toString();
        if (typeof book.bookId.toString === "function") return book.bookId.toString();
        return null;
      })
      .filter(Boolean);

    console.log("📖 Existing issued books:", existingIssuedBooks);

    const newBookIds = validBookIds.filter(id => 
      !existingIssuedBooks.includes(id.toString())
    );

    console.log("🆕 New books to assign:", newBookIds);

    if (newBookIds.length === 0) {
      return res.json({
        success: true,
        message: "All selected books are already assigned to this student",
        student
      });
    }

    // Check book availability
    const unavailableBooks = books.filter(book => 
      (book.issuedCount || 0) >= book.quantity
    );

    if (unavailableBooks.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some books are not available for issue",
        unavailableBooks: unavailableBooks.map(book => ({
          name: book.bookName,
          available: book.quantity - (book.issuedCount || 0),
          total: book.quantity,
          issued: book.issuedCount || 0
        }))
      });
    }

    // Create new book assignments
    const newAssignments = newBookIds.map(bookId => ({
      bookId,
      issueDate: new Date(),
      status: "issued"
    }));

    console.log("➕ Adding new assignments:", newAssignments);

    // Update student's books
    student.books.push(...newAssignments);
    if (booksWereSanitized) {
      student.markModified("books");
    }
    await student.save();

    console.log("✅ Student books updated");

    // Update library issued counts
    await Library.updateMany(
      { _id: { $in: newBookIds } },
      { $inc: { issuedCount: 1 } }
    );

    console.log("✅ Library issued counts updated");

    // Return updated student data
    const updatedStudent = await studentDetails.findOne({ enrollmentNo })
      .populate("books.bookId", "bookName author bookCode");

    console.log("✅ Assignment completed successfully");

    res.json({ 
      success: true, 
      message: `${newBookIds.length} book(s) assigned successfully`, 
      student: updatedStudent 
    });

  } catch (error) {
    console.error("❌ assignBooksToStudent error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const returnBooks = async (req, res) => {
  const { enrollmentNo, bookIds } = req.body;

  try {
    if (!enrollmentNo || !bookIds?.length) {
      return res.status(400).json({ success: false, message: "Invalid request data" });
    }

    const student = await studentDetails
      .findOne({ enrollmentNo })
      .populate("books.bookId", "bookName author");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const ids = bookIds.map((id) => id.toString());
    const returnCounts = {};
    let updated = false;
    const now = new Date();

    student.books = student.books.map((entry) => {
      const entryId = entry.bookId?._id?.toString() || entry.bookId?.toString();
      if (entryId && ids.includes(entryId) && entry.status === "issued") {
        entry.status = "returned";
        entry.returnDate = now;
        returnCounts[entryId] = (returnCounts[entryId] || 0) + 1;
        updated = true;
      }
      return entry;
    });

    student.markModified("books");

    if (!updated) {
      return res.status(400).json({ success: false, message: "No matching issued books found" });
    }

    await student.save();

    const bulkOps = Object.entries(returnCounts).map(([bookId, count]) => ({
      updateOne: {
        filter: { _id: bookId },
        update: { $inc: { issuedCount: -count } },
      },
    }));
    
    if (bulkOps.length) {
      await Library.bulkWrite(bulkOps);
      await Library.updateMany({ issuedCount: { $lt: 0 } }, { $set: { issuedCount: 0 } });
    }

    const refreshed = await studentDetails
      .findOne({ enrollmentNo })
      .populate("books.bookId", "bookName author");

    res.json({ success: true, message: "Books returned successfully", student: refreshed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const searchStudents = async (req, res) => {
  try {
    const query = req.query.query;
    const students = await studentDetails.find({
      $or: [
        { firstName: new RegExp(query, "i") },
        { lastName: new RegExp(query, "i") },
        { enrollmentNo: new RegExp(query, "i") },
      ],
    });
    res.json({ students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Search failed", error: error.message });
  }
};

// Reports: filter students by batch and branch
const getStudentsByBatchAndBranch = async (req, res) => {
  try {
    const { batch, branch } = req.query;

    const filter = {};
    if (batch) {
      const parsed = parseInt(batch, 10);
      if (!Number.isFinite(parsed)) {
        return res.status(400).json({ success: false, message: "Invalid batch" });
      }
      filter.batch = parsed;
    }
    if (branch) {
      filter.branch = branch;
    }

    if (Object.keys(filter).length === 0) {
      return res.status(400).json({ success: false, message: "Provide at least batch or branch" });
    }

    const students = await studentDetails.find(filter).populate("books.bookId", "bookName author bookCode");
    return res.json({ success: true, count: students.length, students });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// Graduate selected students and create alumni credentials
const graduateStudents = async (req, res) => {
  try {
    const { enrollmentNos } = req.body;
    if (!enrollmentNos || !Array.isArray(enrollmentNos) || enrollmentNos.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide enrollmentNos array" });
    }

    const graduationYear = new Date().getFullYear().toString();
    const graduatedAt = new Date();
    const results = [];

    for (const enrollmentNo of enrollmentNos) {
      const student = await studentDetails.findOne({ enrollmentNo });
      if (!student) {
        results.push({ enrollmentNo, success: false, message: "Student not found" });
        continue;
      }
      if (student.isGraduated) {
        results.push({ enrollmentNo, success: false, message: "Already graduated" });
        continue;
      }

      // Mark student as graduated
      await studentDetails.updateOne(
        { enrollmentNo },
        { isGraduated: true, graduationYear, graduatedAt }
      );

      // Fetch existing student credential password hash
      const studentCred = await mongoose.model("Student Credential").findOne({ loginid: enrollmentNo });
      const existingPasswordHash = studentCred
        ? studentCred.password
        : await bcrypt.hash(enrollmentNo, 10);

      // Create alumni credential only if not already exists
      const existingAlumni = await alumniCredential.findOne({ loginid: enrollmentNo });
      if (!existingAlumni) {
        await alumniCredential.create({
          loginid: enrollmentNo,
          password: existingPasswordHash,
          enrollmentNo,
          graduationYear,
          graduatedAt,
        });
      }

      results.push({ enrollmentNo, success: true, message: "Graduated successfully" });
    }

    const successCount = results.filter(r => r.success).length;
    return res.json({
      success: true,
      message: `${successCount} of ${enrollmentNos.length} student(s) graduated successfully.`,
      results,
    });
  } catch (error) {
    console.error("graduateStudents error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const ungraduateStudent = async (req, res) => {
  try {
    const { enrollmentNo } = req.body;
    if (!enrollmentNo) {
      return res.status(400).json({ success: false, message: "Please provide enrollmentNo" });
    }

    const student = await studentDetails.findOne({ enrollmentNo });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    await studentDetails.updateOne(
      { enrollmentNo },
      { $set: { isGraduated: false, semester: 8 }, $unset: { graduationYear: "", graduatedAt: "" } }
    );

    return res.json({
      success: true,
      message: `Student ${enrollmentNo} restored to 8th Semester active status successfully.`,
    });
  } catch (error) {
    console.error("ungraduateStudent error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// Update student backlogs (called from student profile)
const updateBacklogs = async (req, res) => {
  try {
    const { enrollmentNo, activeBacklogs, backlogDetails } = req.body;
    if (!enrollmentNo) {
      return res.status(400).json({ success: false, message: "enrollmentNo is required" });
    }
    const updated = await studentDetails.findOneAndUpdate(
      { enrollmentNo },
      {
        activeBacklogs: Math.max(0, parseInt(activeBacklogs) || 0),
        backlogDetails: backlogDetails || ""
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.json({
      success: true,
      message: "Backlogs updated successfully",
      activeBacklogs: updated.activeBacklogs,
      backlogDetails: updated.backlogDetails
    });
  } catch (error) {
    console.error("updateBacklogs error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const getStudentRegulations = async (req, res) => {
  try {
    const regs = await studentDetails.distinct("regulation");
    const cleanRegs = (regs || []).filter(Boolean).sort();
    return res.json({
      success: true,
      message: "Regulations fetched successfully",
      regulations: cleanRegs
    });
  } catch (error) {
    console.error("getStudentRegulations error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCohortRegulation = async (req, res) => {
  try {
    const branchInput = req.query.branch || req.body.branch;
    const semInput = req.query.semester || req.body.semester;

    if (!semInput) {
      return res.status(400).json({
        success: false,
        message: "Semester is required"
      });
    }

    const Branch = require("../../models/Other/branch.model.js");
    let branchName = branchInput || "";
    if (branchInput && mongoose.Types.ObjectId.isValid(branchInput)) {
      const bObj = await Branch.findById(branchInput);
      if (bObj) branchName = bObj.name;
    }

    const query = {
      semester: Number(semInput),
      isGraduated: { $ne: true }
    };

    if (branchName && branchName.trim()) {
      const clean = branchName.trim();
      let branchPattern = clean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (/^cse$/i.test(clean) || /^computer science$/i.test(clean) || /^computer science & engineering$/i.test(clean)) {
        branchPattern = "(cse|computer science|computer science engineering|computer science & engineering)";
      }
      query.branch = { $regex: new RegExp(`^${branchPattern}$`, "i") };
    }

    const students = await studentDetails.find(query).select("regulation branch semester batch").lean();
    const count = students.length;

    if (count === 0) {
      return res.json({
        success: true,
        count: 0,
        regulations: [],
        regulation: "",
        academicYears: [],
        academicYear: "",
        message: "no student in that semester"
      });
    }

    const regulations = Array.from(new Set(students.map(s => s.regulation).filter(Boolean)));
    const academicYears = Array.from(new Set(students.map(s => {
      if (s.batch && s.semester) {
        const startYear = Number(s.batch) + Math.floor((Number(s.semester) - 1) / 2);
        return `${startYear}-${startYear + 1}`;
      }
      return null;
    }).filter(Boolean)));

    return res.json({
      success: true,
      count,
      regulations,
      regulation: regulations[0] || "",
      academicYears,
      academicYear: academicYears[0] || "",
      message: "Student regulation and academic year detected successfully"
    });
  } catch (error) {
    console.error("getCohortRegulation error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

module.exports = {
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
  ungraduateStudent,
  updateBacklogs,
  getStudentRegulations,
  getCohortRegulation,
};