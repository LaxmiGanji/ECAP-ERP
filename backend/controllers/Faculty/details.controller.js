// Faculty Details Controller
const facultyDetails = require("../../models/Faculty/details.model.js")
const Substitution = require("../../models/Faculty/substitution.model.js");
const { validatePhoneNumber } = require("../../utils/validation.js");

const getDetails = async (req, res) => {
    try {
        let user = await facultyDetails.find(req.body);
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "No Faculty Found" });
        }
        const data = {
            success: true,
            message: "Faculty Details Found!",
            user,
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


const addDetails = async (req, res) => {
    try {
      const data = req.body;
      const employeeId = (data.employeeId || data.loginid || "").toString().trim();
      if (!employeeId) {
        return res.status(400).json({ success: false, message: "employeeId is required" });
      }

      // Normalize optional batch
      if (typeof data.batch !== 'undefined' && data.batch !== null && data.batch !== '') {
        const parsedBatch = parseInt(data.batch, 10);
        if (!Number.isFinite(parsedBatch)) {
          return res.status(400).json({ success: false, message: "Batch must be a valid year" });
        }
        data.batch = parsedBatch;
      }


      const { phoneNumber } = data;
      if (!validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({ success: false, message: "Invalid phone number. Must be 10 digits starting with 6-9." });
      }

      const rawType = (data?.type || "").toString().toLowerCase();
      const rawOverwrite = (data?.overwrite ?? "").toString().toLowerCase();
      const isExcelImport = rawType === "excel-import" || rawType === "excel" || rawType === "import";
      const allowOverwrite = rawOverwrite === "true" || rawOverwrite === "1" || rawOverwrite === "yes" || rawOverwrite === "on";

      let existing = await facultyDetails.findOne({ employeeId });
      if (existing) {
        if (isExcelImport && allowOverwrite) {
          const updatePayload = { ...data };
          delete updatePayload.type;
          delete updatePayload.overwrite;
          if (req.file?.path) updatePayload.profile = req.file.path;
          await facultyDetails.updateOne({ employeeId }, { $set: updatePayload });
          return res.json({ success: true, message: "Faculty Details Updated (Import Overwrite)!" });
        }
        return res.status(400).json({
          success: false,
          message: "Faculty With This EmployeeId Already Exists",
        });
      }

      // Handle profile picture - use default if not provided
      const profileData = req.file 
        ? { ...data, employeeId, profile: req.file.path }
        : { ...data, employeeId, profile: 'default-profile.png' };

      const user = await facultyDetails.create(profileData);
      const response = {
        success: true,
        message: "Faculty Details Added!",
        user,
      };
      res.json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const updateDetails = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ success: false, message: "Invalid phone number. Must be 10 digits starting with 6-9." });
        }
        let user;
        if (req.file) {
            user = await facultyDetails.findByIdAndUpdate(req.params.id, { ...req.body, profile: req.file.path });
        } else {
            user = await facultyDetails.findByIdAndUpdate(req.params.id, req.body);
        }
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Faculty Found",
            });
        }
        const data = {
            success: true,
            message: "Updated Successfull!",
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


const deleteDetails = async (req, res) => {
    try {
        let user = await facultyDetails.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Faculty Found",
            });
        }
        const data = {
            success: true,
            message: "Deleted Successfull!",
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const getCount = async (req, res) => {
    try {
        let user = await facultyDetails.count(req.body);
        const data = {
            success: true,
            message: "Count Successfull!",
            user,
        };
        res.json(data);
    } catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Internal Server Error", error });
    }
}

const updateTimetable = async (req, res) => {
  try {
    const { timetable } = req.body;
    const employeeId = req.params.id;

    // Validate input
    if (!timetable || !Array.isArray(timetable)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timetable data format",
      });
    }

    // Check for faculty timetable clashes
    const clashValidation = await checkFacultyTimetableClash(employeeId, timetable);
    if (!clashValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Faculty timetable clash detected",
        clashes: clashValidation.clashes,
      });
    }

    // Find and update the faculty's timetable
    const updatedFaculty = await facultyDetails.findOneAndUpdate(
      { employeeId },
      { $set: { timetable } },
      { new: true }
    );

    if (!updatedFaculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    res.json({
      success: true,
      message: "Timetable updated successfully",
      faculty: updatedFaculty,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Function to check for faculty timetable clashes
const checkFacultyTimetableClash = async (currentEmployeeId, newTimetable) => {
  try {
    const clashes = [];
    
    // Get all faculty timetables except the current one
    const allFaculties = await facultyDetails.find(
      { employeeId: { $ne: currentEmployeeId } },
      { employeeId: 1, firstName: 1, middleName: 1, lastName: 1, timetable: 1 }
    );

    // Check each period in the new timetable against all other faculty timetables
    for (const dayData of newTimetable) {
      if (!dayData.periods || !Array.isArray(dayData.periods)) continue;
      
      for (const period of dayData.periods) {
        // Skip special periods (Break, Sports, Library, Other) as they don't have academic constraints
        if (["Break", "Sports", "Library", "Other"].includes(period.subject)) {
          continue;
        }

        // Check if this period conflicts with any other faculty
        for (const faculty of allFaculties) {
          if (!faculty.timetable || !Array.isArray(faculty.timetable)) continue;
          
          for (const facultyDayData of faculty.timetable) {
            if (facultyDayData.day !== dayData.day) continue;
            
            if (!facultyDayData.periods || !Array.isArray(facultyDayData.periods)) continue;
            
            for (const facultyPeriod of facultyDayData.periods) {
              // Skip special periods for faculty as well
              if (["Break", "Sports", "Library", "Other"].includes(facultyPeriod.subject)) {
                continue;
              }
              
              // Check for clash conditions:
              // 1. Same day
              // 2. Same time slot (startTime and endTime match)
              // 3. Same semester, section, and branch
              if (
                facultyPeriod.startTime === period.startTime &&
                facultyPeriod.endTime === period.endTime &&
                facultyPeriod.semester === period.semester &&
                facultyPeriod.section === period.section &&
                facultyPeriod.branch === period.branch
              ) {
                clashes.push({
                  day: dayData.day,
                  time: `${period.startTime} - ${period.endTime}`,
                  semester: period.semester,
                  section: period.section,
                  branch: period.branch,
                  subject: period.subject,
                  conflictingFaculty: {
                    employeeId: faculty.employeeId,
                    name: `${faculty.firstName} ${faculty.middleName || ''} ${faculty.lastName}`.trim(),
                    subject: facultyPeriod.subject
                  }
                });
              }
            }
          }
        }
      }
    }

    return {
      isValid: clashes.length === 0,
      clashes: clashes
    };
  } catch (error) {
    console.error("Error checking faculty timetable clash:", error);
    return {
      isValid: false,
      clashes: [],
      error: "Error checking timetable clashes"
    };
  }
};

const getFacultyByBatchAndBranch = async (req, res) => {
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
      // Map branch to department for faculty
      filter.department = branch;
    }
    if (Object.keys(filter).length === 0) {
      return res.status(400).json({ success: false, message: "Provide at least batch or branch" });
    }
    const faculties = await facultyDetails.find(filter);
    return res.json({ success: true, count: faculties.length, faculties });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const validateTimetable = async (req, res) => {
  try {
    const { employeeId, timetable } = req.body;

    if (!timetable || !Array.isArray(timetable)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timetable data format",
      });
    }

    // Check for faculty timetable clashes
    const clashValidation = await checkFacultyTimetableClash(employeeId, timetable);
    
    return res.json({
      success: clashValidation.isValid,
      message: clashValidation.isValid ? "No clashes found" : "Clashes detected",
      clashes: clashValidation.clashes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  // Handle both "HH:MM" and "HH:MMam/pm" formats
  let hours = 0, minutes = 0;
  
  if (timeStr.includes('am') || timeStr.includes('pm')) {
    // Parse 12-hour format
    const match = timeStr.match(/(\d+):(\d+)(am|pm)/i);
    if (match) {
      hours = parseInt(match[1]);
      minutes = parseInt(match[2]);
      const meridiem = match[3].toLowerCase();
      
      if (meridiem === 'pm' && hours !== 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
    }
  } else {
    // Parse 24-hour format
    const [h, m] = timeStr.split(':').map(Number);
    hours = h || 0;
    minutes = m || 0;
  }
  
  return hours * 60 + minutes;
};

// Get faculty with free periods (Break, Sports, Library, Other) at given time
const getFacultyWithFreePeriods = async (req, res) => {
  try {
    const { day, startTime, endTime, currentFacultyId } = req.query;

    if (!day || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Day, startTime and endTime are required"
      });
    }

    // Get all faculty except current faculty
    const allFaculty = await facultyDetails.find(
      { employeeId: { $ne: currentFacultyId } },
      { employeeId: 1, firstName: 1, middleName: 1, lastName: 1, department: 1, timetable: 1 }
    );

    const facultyWithFreePeriods = [];

    const targetStart = timeToMinutes(startTime);
    const targetEnd = timeToMinutes(endTime);

    // Check each faculty for free periods at the given time
    for (const faculty of allFaculty) {
      if (!faculty.timetable || !Array.isArray(faculty.timetable) || faculty.timetable.length === 0) {
        // Faculty with no timetable is considered available
        facultyWithFreePeriods.push({
          employeeId: faculty.employeeId,
          name: `${faculty.firstName} ${faculty.middleName || ''} ${faculty.lastName}`.trim(),
          department: faculty.department,
          freePeriodType: "No timetable assigned"
        });
        continue;
      }

      const daySchedule = faculty.timetable.find(t => t.day === day);
      if (!daySchedule || !daySchedule.periods || daySchedule.periods.length === 0) {
        // Faculty with no schedule on this day is available
        facultyWithFreePeriods.push({
          employeeId: faculty.employeeId,
          name: `${faculty.firstName} ${faculty.middleName || ''} ${faculty.lastName}`.trim(),
          department: faculty.department,
          freePeriodType: "No classes on this day"
        });
        continue;
      }

      // Check if faculty has any period at this time
      let periodAtThisTime = null;
      for (const period of daySchedule.periods) {
        const periodStart = timeToMinutes(period.startTime);
        const periodEnd = timeToMinutes(period.endTime);
        
        const hasTimeOverlap = (
          (targetStart >= periodStart && targetStart < periodEnd) ||
          (targetEnd > periodStart && targetEnd <= periodEnd) ||
          (targetStart <= periodStart && targetEnd >= periodEnd)
        );

        if (hasTimeOverlap) {
          periodAtThisTime = period;
          break;
        }
      }

      // If faculty has a period at this time, check if it's a free period
      if (periodAtThisTime) {
        if (["Break", "Sports", "Library", "Other"].includes(periodAtThisTime.subject)) {
          // Faculty has a free period at this time
          facultyWithFreePeriods.push({
            employeeId: faculty.employeeId,
            name: `${faculty.firstName} ${faculty.middleName || ''} ${faculty.lastName}`.trim(),
            department: faculty.department,
            freePeriodType: periodAtThisTime.subject
          });
        }
        // If it's an academic period, faculty is not available
      } else {
        // Faculty has no period at this time (completely free)
        facultyWithFreePeriods.push({
          employeeId: faculty.employeeId,
          name: `${faculty.firstName} ${faculty.middleName || ''} ${faculty.lastName}`.trim(),
          department: faculty.department,
          freePeriodType: "Free Period"
        });
      }
    }

    return res.json({
      success: true,
      message: "Faculty with free periods fetched successfully",
      facultyWithFreePeriods
    });
  } catch (error) {
    console.error("Error getting faculty with free periods:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Substitute faculty for a period - FIXED: Store substitute's original period
const substituteFaculty = async (req, res) => {
  try {
    const { 
      originalFacultyId, 
      substituteFacultyId, 
      day, 
      periodNumber,
      startTime,
      endTime,
      subject,
      branch,
      semester,
      section
    } = req.body;

    if (!originalFacultyId || !substituteFacultyId || !day || !periodNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for substitution"
      });
    }

    // Get both faculties
    const originalFaculty = await facultyDetails.findOne({ employeeId: originalFacultyId });
    const substituteFaculty = await facultyDetails.findOne({ employeeId: substituteFacultyId });

    if (!originalFaculty || !substituteFaculty) {
      return res.status(404).json({
        success: false,
        message: "One or both faculties not found"
      });
    }

    // Find the period in original faculty's timetable
    let periodToMove = null;
    let updatedOriginalTimetable = JSON.parse(JSON.stringify(originalFaculty.timetable || []));
    
    const originalDayIndex = updatedOriginalTimetable.findIndex(t => t.day === day);
    if (originalDayIndex !== -1) {
      const periodIndex = updatedOriginalTimetable[originalDayIndex].periods.findIndex(
        p => p.periodNumber === periodNumber
      );
      
      if (periodIndex !== -1) {
        periodToMove = { ...updatedOriginalTimetable[originalDayIndex].periods[periodIndex] };
        
        // Store the original subject before marking as substituted
        const originalSubject = periodToMove.subject;
        
        // Mark this period as substituted in original faculty
        updatedOriginalTimetable[originalDayIndex].periods[periodIndex] = {
          ...periodToMove,
          substituted: true,
          substitutedTo: substituteFacultyId,
          substitutionDate: new Date(),
          subject: "Substituted",
          originalSubject: originalSubject,
          branch: branch,
          semester: semester,
          section: section
        };
      }
    }

    if (!periodToMove) {
      return res.status(404).json({
        success: false,
        message: "Period not found in original faculty's timetable"
      });
    }

    // CRITICAL: Find and store substitute faculty's original period at this slot
    let substituteOriginalPeriod = null;
    let updatedSubstituteTimetable = JSON.parse(JSON.stringify(substituteFaculty.timetable || []));
    const subDayIndex = updatedSubstituteTimetable.findIndex(t => t.day === day);
    
    if (subDayIndex !== -1) {
      // Find the period at this period number
      const existingPeriodIndex = updatedSubstituteTimetable[subDayIndex].periods.findIndex(
        p => p.periodNumber === periodNumber
      );
      
      if (existingPeriodIndex !== -1) {
        // Store the original period data BEFORE replacing it
        substituteOriginalPeriod = { 
          ...updatedSubstituteTimetable[subDayIndex].periods[existingPeriodIndex],
          isSpecialPeriod: ["Break", "Sports", "Library", "Other"].includes(
            updatedSubstituteTimetable[subDayIndex].periods[existingPeriodIndex].subject
          )
        };
        
        // Replace with new period
        updatedSubstituteTimetable[subDayIndex].periods[existingPeriodIndex] = {
          ...periodToMove,
          periodNumber: periodNumber,
          substitutedFrom: originalFacultyId,
          substitutionDate: new Date(),
          isSubstitute: true,
          originalSubject: periodToMove.subject,
          branch: branch,
          semester: semester,
          section: section,
          replacedOriginalSubject: substituteOriginalPeriod.subject, // Store what was replaced
          replacedOriginalData: substituteOriginalPeriod // Store full original data
        };
      } else {
        // No existing period, just add the new one
        updatedSubstituteTimetable[subDayIndex].periods.push({
          ...periodToMove,
          periodNumber: periodNumber,
          substitutedFrom: originalFacultyId,
          substitutionDate: new Date(),
          isSubstitute: true,
          originalSubject: periodToMove.subject,
          branch: branch,
          semester: semester,
          section: section
        });
        
        // Sort periods
        updatedSubstituteTimetable[subDayIndex].periods.sort((a, b) => a.periodNumber - b.periodNumber);
      }
    } else {
      // Create new day entry
      updatedSubstituteTimetable.push({
        day,
        periods: [{
          ...periodToMove,
          periodNumber: periodNumber,
          substitutedFrom: originalFacultyId,
          substitutionDate: new Date(),
          isSubstitute: true,
          originalSubject: periodToMove.subject,
          branch: branch,
          semester: semester,
          section: section
        }]
      });
    }

    // Create substitution record with substitute's original period data
    const substitution = new Substitution({
      originalFacultyId,
      substituteFacultyId,
      day,
      periodNumber,
      subject: periodToMove.subject,
      branch,
      semester,
      section,
      startTime: periodToMove.startTime,
      endTime: periodToMove.endTime,
      substituteOriginalPeriod: substituteOriginalPeriod ? {
        subject: substituteOriginalPeriod.subject,
        branch: substituteOriginalPeriod.branch || "",
        semester: substituteOriginalPeriod.semester || "",
        section: substituteOriginalPeriod.section || "",
        startTime: substituteOriginalPeriod.startTime,
        endTime: substituteOriginalPeriod.endTime,
        isSpecialPeriod: substituteOriginalPeriod.isSpecialPeriod
      } : null,
      status: 'active'
    });
    await substitution.save();

    // Update both faculties
    await facultyDetails.findOneAndUpdate(
      { employeeId: originalFacultyId },
      { $set: { timetable: updatedOriginalTimetable } }
    );

    await facultyDetails.findOneAndUpdate(
      { employeeId: substituteFacultyId },
      { $set: { timetable: updatedSubstituteTimetable } }
    );

    return res.json({
      success: true,
      message: "Faculty substituted successfully",
      data: {
        originalFacultyId,
        substituteFacultyId,
        day,
        periodNumber,
        subject: periodToMove.subject,
        substitutionId: substitution._id,
        substituteOriginalRestored: substituteOriginalPeriod ? substituteOriginalPeriod.subject : "No original period"
      }
    });
  } catch (error) {
    console.error("Error substituting faculty:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Undo substitution - FIXED: Restore substitute's original period
const undoSubstitution = async (req, res) => {
  try {
    const { 
      originalFacultyId, 
      substituteFacultyId, 
      day, 
      periodNumber
    } = req.body;

    if (!originalFacultyId || !substituteFacultyId || !day || !periodNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for undo substitution"
      });
    }

    console.log(`Undoing substitution: ${originalFacultyId} -> ${substituteFacultyId}, ${day} Period ${periodNumber}`);

    // Find the active substitution with substitute's original period data
    const substitution = await Substitution.findOne({
      originalFacultyId,
      substituteFacultyId,
      day,
      periodNumber,
      status: 'active'
    });

    if (!substitution) {
      return res.status(404).json({
        success: false,
        message: "No active substitution found"
      });
    }

    // Get both faculties
    const originalFaculty = await facultyDetails.findOne({ employeeId: originalFacultyId });
    const substituteFaculty = await facultyDetails.findOne({ employeeId: substituteFacultyId });

    if (!originalFaculty || !substituteFaculty) {
      return res.status(404).json({
        success: false,
        message: "One or both faculties not found"
      });
    }

    // 1. RESTORE ORIGINAL FACULTY'S PERIOD
    let updatedOriginalTimetable = JSON.parse(JSON.stringify(originalFaculty.timetable || []));
    let originalRestored = false;
    
    const originalDayIndex = updatedOriginalTimetable.findIndex(t => t.day === day);
    if (originalDayIndex !== -1) {
      // Look for the period that was substituted out
      const periodIndex = updatedOriginalTimetable[originalDayIndex].periods.findIndex(
        p => p.periodNumber === periodNumber
      );
      
      if (periodIndex !== -1) {
        const period = updatedOriginalTimetable[originalDayIndex].periods[periodIndex];
        
        // Restore using originalSubject
        const restoredSubject = period.originalSubject || substitution.subject;
        
        console.log(`Restoring original faculty period: ${restoredSubject}`);
        
        updatedOriginalTimetable[originalDayIndex].periods[periodIndex] = {
          periodNumber: period.periodNumber,
          subject: restoredSubject,
          branch: substitution.branch,
          semester: substitution.semester,
          section: substitution.section,
          startTime: period.startTime || substitution.startTime,
          endTime: period.endTime || substitution.endTime
        };
        originalRestored = true;
      }
    }

    // 2. RESTORE SUBSTITUTE FACULTY'S ORIGINAL PERIOD
    let updatedSubstituteTimetable = JSON.parse(JSON.stringify(substituteFaculty.timetable || []));
    let substituteRestored = false;
    
    const subDayIndex = updatedSubstituteTimetable.findIndex(t => t.day === day);
    
    if (subDayIndex !== -1) {
      // Remove the substituted period
      updatedSubstituteTimetable[subDayIndex].periods = updatedSubstituteTimetable[subDayIndex].periods.filter(
        p => !(p.substitutedFrom === originalFacultyId && p.periodNumber === periodNumber)
      );
      
      // RESTORE THE ORIGINAL PERIOD FROM SUBSTITUTION RECORD
      if (substitution.substituteOriginalPeriod) {
        const originalPeriod = substitution.substituteOriginalPeriod;
        
        // Check if a period already exists at this number
        const existingPeriodIndex = updatedSubstituteTimetable[subDayIndex].periods.findIndex(
          p => p.periodNumber === periodNumber
        );
        
        if (existingPeriodIndex !== -1) {
          // Replace with original period
          updatedSubstituteTimetable[subDayIndex].periods[existingPeriodIndex] = {
            periodNumber: periodNumber,
            subject: originalPeriod.subject,
            branch: originalPeriod.branch || "",
            semester: originalPeriod.semester || "",
            section: originalPeriod.section || "",
            startTime: originalPeriod.startTime,
            endTime: originalPeriod.endTime
          };
        } else {
          // Add original period back
          updatedSubstituteTimetable[subDayIndex].periods.push({
            periodNumber: periodNumber,
            subject: originalPeriod.subject,
            branch: originalPeriod.branch || "",
            semester: originalPeriod.semester || "",
            section: originalPeriod.section || "",
            startTime: originalPeriod.startTime,
            endTime: originalPeriod.endTime
          });
        }
        
        // Sort periods by period number
        updatedSubstituteTimetable[subDayIndex].periods.sort((a, b) => a.periodNumber - b.periodNumber);
        substituteRestored = true;
        console.log(`Restored substitute faculty's original period: ${originalPeriod.subject}`);
      } else {
        // No original period was stored, meaning substitute had no period at this slot
        // Just reorder remaining periods
        if (updatedSubstituteTimetable[subDayIndex].periods.length === 0) {
          updatedSubstituteTimetable.splice(subDayIndex, 1);
        } else {
          updatedSubstituteTimetable[subDayIndex].periods = updatedSubstituteTimetable[subDayIndex].periods
            .sort((a, b) => a.periodNumber - b.periodNumber)
            .map((p, idx) => ({
              ...p,
              periodNumber: idx + 1
            }));
        }
        substituteRestored = true;
      }
    }

    // Update substitution status
    substitution.status = 'cancelled';
    await substitution.save();

    // Update both faculties
    if (originalRestored) {
      await facultyDetails.findOneAndUpdate(
        { employeeId: originalFacultyId },
        { $set: { timetable: updatedOriginalTimetable } }
      );
      console.log(`Updated original faculty: ${originalFacultyId}`);
    }

    if (substituteRestored) {
      await facultyDetails.findOneAndUpdate(
        { employeeId: substituteFacultyId },
        { $set: { timetable: updatedSubstituteTimetable } }
      );
      console.log(`Updated substitute faculty: ${substituteFacultyId} with original period restored`);
    }

    return res.json({
      success: true,
      message: "Substitution undone successfully. Original periods restored for both faculties.",
      data: {
        originalFacultyId,
        substituteFacultyId,
        day,
        periodNumber,
        subject: substitution.subject,
        substituteOriginalRestored: substitution.substituteOriginalPeriod ? substitution.substituteOriginalPeriod.subject : "Free Period"
      }
    });
  } catch (error) {
    console.error("Error undoing substitution:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Reset timetable to original state - FIXED VERSION
const resetTimetable = async (req, res) => {
  try {
    const { facultyId } = req.body;

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID is required"
      });
    }

    console.log(`Starting reset for faculty: ${facultyId}`);

    // Find all active substitutions involving this faculty
    const substitutionsAsOriginal = await Substitution.find({
      originalFacultyId: facultyId,
      status: 'active'
    });

    const substitutionsAsSubstitute = await Substitution.find({
      substituteFacultyId: facultyId,
      status: 'active'
    });

    console.log(`Found ${substitutionsAsOriginal.length} substitutions as original`);
    console.log(`Found ${substitutionsAsSubstitute.length} substitutions as substitute`);

    // Process each substitution
    const processedSubstitutions = [];

    // 1. Handle cases where this faculty is the ORIGINAL (gave away periods)
    for (const sub of substitutionsAsOriginal) {
      console.log(`Processing original substitution: ${sub._id}`);
      
      // Get the substitute faculty
      const substituteFaculty = await facultyDetails.findOne({ employeeId: sub.substituteFacultyId });
      
      if (substituteFaculty && substituteFaculty.timetable) {
        // Restore substitute faculty's timetable using stored original period
        let subTimetable = JSON.parse(JSON.stringify(substituteFaculty.timetable));
        let modified = false;
        
        const dayIndex = subTimetable.findIndex(d => d.day === sub.day);
        if (dayIndex !== -1) {
          // Remove the substituted period
          subTimetable[dayIndex].periods = subTimetable[dayIndex].periods.filter(
            p => !(p.substitutedFrom === facultyId && p.periodNumber === sub.periodNumber)
          );
          
          // Restore substitute's original period from substitution record
          if (sub.substituteOriginalPeriod) {
            const originalPeriod = sub.substituteOriginalPeriod;
            
            // Check if period already exists
            const periodExists = subTimetable[dayIndex].periods.some(
              p => p.periodNumber === sub.periodNumber
            );
            
            if (!periodExists) {
              subTimetable[dayIndex].periods.push({
                periodNumber: sub.periodNumber,
                subject: originalPeriod.subject,
                branch: originalPeriod.branch || "",
                semester: originalPeriod.semester || "",
                section: originalPeriod.section || "",
                startTime: originalPeriod.startTime,
                endTime: originalPeriod.endTime
              });
            }
          }
          
          // Reorder periods
          if (subTimetable[dayIndex].periods.length === 0) {
            subTimetable.splice(dayIndex, 1);
          } else {
            subTimetable[dayIndex].periods = subTimetable[dayIndex].periods
              .sort((a, b) => a.periodNumber - b.periodNumber)
              .map((p, idx) => ({
                ...p,
                periodNumber: idx + 1
              }));
          }
          modified = true;
        }
        
        if (modified) {
          await facultyDetails.findOneAndUpdate(
            { employeeId: sub.substituteFacultyId },
            { $set: { timetable: subTimetable } }
          );
        }
      }
      
      sub.status = 'cancelled';
      await sub.save();
      processedSubstitutions.push(sub._id);
    }

    // 2. Handle cases where this faculty is the SUBSTITUTE (received periods)
    for (const sub of substitutionsAsSubstitute) {
      console.log(`Processing substitute substitution: ${sub._id}`);
      
      const originalFaculty = await facultyDetails.findOne({ employeeId: sub.originalFacultyId });
      
      if (originalFaculty && originalFaculty.timetable) {
        let origTimetable = JSON.parse(JSON.stringify(originalFaculty.timetable));
        let modified = false;
        
        const dayIndex = origTimetable.findIndex(d => d.day === sub.day);
        if (dayIndex !== -1) {
          const periodIndex = origTimetable[dayIndex].periods.findIndex(
            p => p.periodNumber === sub.periodNumber
          );
          
          if (periodIndex !== -1) {
            // Restore original faculty's period
            origTimetable[dayIndex].periods[periodIndex] = {
              periodNumber: sub.periodNumber,
              subject: sub.subject,
              branch: sub.branch,
              semester: sub.semester,
              section: sub.section,
              startTime: sub.startTime,
              endTime: sub.endTime
            };
            modified = true;
          }
        }
        
        if (modified) {
          await facultyDetails.findOneAndUpdate(
            { employeeId: sub.originalFacultyId },
            { $set: { timetable: origTimetable } }
          );
        }
      }
      
      sub.status = 'cancelled';
      await sub.save();
      processedSubstitutions.push(sub._id);
    }

    // 3. Reset this faculty's own timetable
    const faculty = await facultyDetails.findOne({ employeeId: facultyId });
    
    if (faculty && faculty.timetable) {
      let resetTimetable = [];
      
      // Reconstruct timetable without any substitution markers
      const originalTimetable = JSON.parse(JSON.stringify(faculty.timetable));
      
      for (const dayData of originalTimetable) {
        const cleanPeriods = dayData.periods
          .filter(p => !p.substitutedFrom) // Remove periods received from others
          .map(p => {
            if (p.originalSubject) {
              // Restore original subject for periods given away
              return {
                periodNumber: p.periodNumber,
                subject: p.originalSubject,
                branch: p.branch || "",
                semester: p.semester || "",
                section: p.section || "",
                startTime: p.startTime,
                endTime: p.endTime
              };
            }
            // Keep regular periods
            return {
              periodNumber: p.periodNumber,
              subject: p.subject,
              branch: p.branch || "",
              semester: p.semester || "",
              section: p.section || "",
              startTime: p.startTime,
              endTime: p.endTime
            };
          });
        
        if (cleanPeriods.length > 0) {
          resetTimetable.push({
            day: dayData.day,
            periods: cleanPeriods.sort((a, b) => a.periodNumber - b.periodNumber)
          });
        }
      }
      
      await facultyDetails.findOneAndUpdate(
        { employeeId: facultyId },
        { $set: { timetable: resetTimetable } }
      );
    }

    const updatedFaculty = await facultyDetails.findOne({ employeeId: facultyId });

    return res.json({
      success: true,
      message: `Timetable reset successfully. Processed ${processedSubstitutions.length} substitutions.`,
      faculty: updatedFaculty,
      stats: {
        substitutionsUndone: processedSubstitutions.length,
        asOriginal: substitutionsAsOriginal.length,
        asSubstitute: substitutionsAsSubstitute.length
      }
    });
  } catch (error) {
    console.error("Error resetting timetable:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Get substitution history for a faculty
const getSubstitutionHistory = async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Find all substitutions involving this faculty
    const substitutions = await Substitution.find({
      $or: [
        { originalFacultyId: facultyId },
        { substituteFacultyId: facultyId }
      ]
    }).sort({ substitutionDate: -1 });

    // Get faculty names for display
    const facultyIds = [...new Set(substitutions.flatMap(s => [s.originalFacultyId, s.substituteFacultyId]))];
    const faculties = await facultyDetails.find(
      { employeeId: { $in: facultyIds } },
      { employeeId: 1, firstName: 1, middleName: 1, lastName: 1 }
    );

    const facultyMap = {};
    faculties.forEach(f => {
      facultyMap[f.employeeId] = {
        name: `${f.firstName} ${f.middleName || ''} ${f.lastName}`.trim()
      };
    });

    const history = substitutions.map(sub => ({
      ...sub.toObject(),
      originalFacultyName: facultyMap[sub.originalFacultyId]?.name || sub.originalFacultyId,
      substituteFacultyName: facultyMap[sub.substituteFacultyId]?.name || sub.substituteFacultyId,
      originalPeriodRestored: sub.substituteOriginalPeriod ? sub.substituteOriginalPeriod.subject : "Free Period"
    }));

    return res.json({
      success: true,
      message: "Substitution history fetched successfully",
      substitutions: history
    });
  } catch (error) {
    console.error("Error fetching substitution history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

module.exports = { 
  getDetails, 
  addDetails, 
  updateDetails, 
  deleteDetails, 
  getCount, 
  updateTimetable, 
  getFacultyByBatchAndBranch, 
  validateTimetable,
  getFacultyWithFreePeriods,
  substituteFaculty,
  undoSubstitution,
  resetTimetable,
  getSubstitutionHistory
};