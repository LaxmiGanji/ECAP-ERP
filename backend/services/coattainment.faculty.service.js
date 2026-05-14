const CoAttainmentAssessment = require('../models/Other/coAttainmentAssessment.model');
const Subject = require('../models/Other/subject.model');
const Branch = require('../models/Other/branch.model');
const Student = require('../models/Students/details.model');
const ExcelJS = require('exceljs');

/**
 * Create CO Assessment - Initialize assessment with subject, CO, branch, semester
 */
exports.createAssessment = async (data) => {
    try {
        const {
            facultyId,
            subjectId,
            coNumber,
            branchId,
            semester,
            academicYear,
            questions = [],
            assignments = []
        } = data;

        // Fetch subject details
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            throw new Error('Subject not found');
        }

        // Find CO in subject
        const co = subject.courseOutcomes.find(c => c.coNumber.toString() === coNumber.toString());
        if (!co) {
            throw new Error(`Course Outcome ${coNumber} not found for this subject`);
        }

        // Fetch branch details
        const branch = await Branch.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        // Fetch students for this branch and semester
        // Note: Student model stores branch as String, so we query by branch name
        const branchInfo = await Branch.findById(branchId);
        const branchName = branchInfo ? branchInfo.name : branchId.toString();
        
        const students = await Student.find({
            $or: [
                { branch: branchName },  // If branch is stored as name
                { branch: branchId.toString() }  // If branch is stored as ID
            ],
            semester: semester,
            status: 'active'
        }).select('enrollmentNo firstName lastName middleName');

        if (students.length === 0) {
            throw new Error('No students found for the selected branch and semester');
        }

        // Calculate total marks
        let totalMarks = 0;
        const processedQuestions = questions.map(q => {
            let qTotal = 0;
            const subQuestions = (q.subQuestions || []).map(sq => {
                qTotal += sq.totalMarks || 0;
                return {
                    subQuestionNumber: sq.subQuestionNumber,
                    description: sq.description || '',
                    totalMarks: sq.totalMarks || 0
                };
            });

            if (subQuestions.length === 0) {
                qTotal = q.totalMarks || 0;
            }
            totalMarks += qTotal;

            return {
                questionNumber: q.questionNumber,
                description: q.description || '',
                totalMarks: qTotal,
                subQuestions: subQuestions
            };
        });

        const processedAssignments = assignments.map(a => {
            totalMarks += a.totalMarks || 0;
            return {
                assignmentNumber: a.assignmentNumber,
                assignmentName: a.assignmentName || '',
                totalMarks: a.totalMarks || 0
            };
        });

        // Initialize student marks structure
        const studentMarks = students.map(student => ({
            enrollmentNo: student.enrollmentNo,
            studentName: `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim(),
            questionMarks: processedQuestions.map(q => ({
                questionNumber: q.questionNumber,
                subQuestionMarks: q.subQuestions.map(sq => ({
                    subQuestionNumber: sq.subQuestionNumber,
                    marks: sq.totalMarks,
                    obtainedMarks: 0
                })),
                totalMarks: q.totalMarks,
                obtainedMarks: 0
            })),
            assignmentMarks: processedAssignments.map(a => ({
                assignmentNumber: a.assignmentNumber,
                totalMarks: a.totalMarks,
                obtainedMarks: 0
            })),
            totalObtainedMarks: 0,
            percentage: 0,
            attainmentLevel: 1
        }));

        // Create assessment record
        const assessment = new CoAttainmentAssessment({
            facultyId,
            subjectId,
            subjectCode: subject.code,
            subjectName: subject.name,
            coNumber: coNumber.toString(),
            coDescription: co.description,
            branchId,
            branchName: branch.name,
            semester,
            academicYear,
            questions: processedQuestions,
            assignments: processedAssignments,
            totalMarks,
            studentMarks,
            status: 'draft'
        });

        await assessment.save();

        return {
            _id: assessment._id,
            subjectCode: assessment.subjectCode,
            subjectName: assessment.subjectName,
            coNumber: assessment.coNumber,
            totalMarks: assessment.totalMarks,
            studentCount: studentMarks.length,
            status: assessment.status
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Generate Excel Template for marks entry with student list auto-populated
 */
exports.generateExcelTemplate = async (assessmentId) => {
    try {
        const assessment = await CoAttainmentAssessment.findById(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student Marks');

        // Add header with assessment info
        worksheet.columns = [
            { header: 'Enrollment No', key: 'enrollmentNo', width: 15 },
            { header: 'Student Name', key: 'studentName', width: 25 }
        ];

        // Add question columns with max marks
        assessment.questions.forEach(q => {
            if (q.subQuestions && q.subQuestions.length > 0) {
                q.subQuestions.forEach(sq => {
                    const columnKey = `Q${q.questionNumber}_${sq.subQuestionNumber}`;
                    const columnHeader = `Q${q.questionNumber}.${sq.subQuestionNumber} [Max: ${sq.totalMarks}]`;
                    worksheet.columns.push({ header: columnHeader, key: columnKey, width: 14 });
                });
            } else {
                const columnKey = `Q${q.questionNumber}`;
                const columnHeader = `Q${q.questionNumber} [Max: ${q.totalMarks}]`;
                worksheet.columns.push({ header: columnHeader, key: columnKey, width: 14 });
            }
        });

        // Add assignment columns
        assessment.assignments.forEach(a => {
            const columnKey = `A${a.assignmentNumber}`;
            const columnHeader = `${a.assignmentName || `Assignment ${a.assignmentNumber}`} [Max: ${a.totalMarks}]`;
            worksheet.columns.push({ header: columnHeader, key: columnKey, width: 14 });
        });

        // Add calculation columns
        worksheet.columns.push({ header: 'Total Obtained', key: 'totalObtained', width: 14 });
        worksheet.columns.push({ header: 'Percentage (%)', key: 'percentage', width: 12 });
        worksheet.columns.push({ header: 'Attainment Level', key: 'attainmentLevel', width: 15 });

        // Add assessment info rows
        const infoRows = [
            [{ value: 'Subject Code', font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } }, { value: assessment.subjectCode, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } }, { value: 'Subject Name', font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } }, { value: assessment.subjectName }],
            [{ value: 'CO Number', font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } }, { value: assessment.coNumber, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } }, { value: 'CO Description', font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } }, { value: assessment.coDescription }],
            [{ value: 'Branch', font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } }, { value: assessment.branchName }, { value: 'Semester', font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } }, { value: assessment.semester }],
            [{ value: 'Academic Year', font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } }, { value: assessment.academicYear }, { value: 'Total Marks', font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } } }, { value: assessment.totalMarks }],
            []
        ];

        // Insert info rows
        worksheet.insertRows(1, infoRows, 1);

        // Add header row with styling (row 6 after info rows)
        const headerRowNum = 6;
        const headerRow = worksheet.getRow(headerRowNum);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };

        // Add student data rows (auto-populated with enrollment and names)
        const dataStartRow = headerRowNum + 1;
        assessment.studentMarks.forEach((student, index) => {
            const row = worksheet.getRow(dataStartRow + index);
            row.getCell('enrollmentNo').value = student.enrollmentNo;
            row.getCell('studentName').value = student.studentName;

            // Add data validation for marks cells
            assessment.questions.forEach(q => {
                if (q.subQuestions && q.subQuestions.length > 0) {
                    q.subQuestions.forEach(sq => {
                        const columnKey = `Q${q.questionNumber}_${sq.subQuestionNumber}`;
                        const cell = row.getCell(columnKey);
                        cell.dataValidation = {
                            type: 'decimal',
                            operator: 'between',
                            formula1: 0,
                            formula2: sq.totalMarks,
                            showInputMessage: true,
                            prompt: `Enter marks (0-${sq.totalMarks})`
                        };
                    });
                } else {
                    const columnKey = `Q${q.questionNumber}`;
                    const cell = row.getCell(columnKey);
                    cell.dataValidation = {
                        type: 'decimal',
                        operator: 'between',
                        formula1: 0,
                        formula2: q.totalMarks,
                        showInputMessage: true,
                        prompt: `Enter marks (0-${q.totalMarks})`
                    };
                }
            });

            assessment.assignments.forEach(a => {
                const columnKey = `A${a.assignmentNumber}`;
                const cell = row.getCell(columnKey);
                cell.dataValidation = {
                    type: 'decimal',
                    operator: 'between',
                    formula1: 0,
                    formula2: a.totalMarks,
                    showInputMessage: true,
                    prompt: `Enter marks (0-${a.totalMarks})`
                };
            });

            row.alignment = { horizontal: 'center' };
        });

        // Freeze panes
        worksheet.views = [{ state: 'frozen', ySplit: headerRowNum }];

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    } catch (error) {
        throw error;
    }
};

/**
 * Upload and process marks from Excel file
 */
exports.uploadAndProcessMarks = async (assessmentId, fileBuffer) => {
    try {
        const assessment = await CoAttainmentAssessment.findById(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }

        // Parse Excel file
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.getWorksheet('Student Marks');

        if (!worksheet) {
            throw new Error('Sheet "Student Marks" not found in Excel file');
        }

        // Find data start row (skip assessment info and header)
        const marksData = [];
        let headerRowFound = false;
        let dataStartRow = 0;

        worksheet.eachRow((row, rowNumber) => {
            // Find header row
            if (!headerRowFound && row.getCell('enrollmentNo').value === 'Enrollment No') {
                headerRowFound = true;
                dataStartRow = rowNumber + 1;
                return;
            }

            // Extract student marks data
            if (headerRowFound && rowNumber >= dataStartRow) {
                const enrollmentNo = row.getCell('enrollmentNo').value;
                const studentName = row.getCell('studentName').value;

                if (enrollmentNo) {
                    const studentRow = {
                        enrollmentNo: enrollmentNo.toString().trim(),
                        studentName: studentName ? studentName.toString().trim() : ''
                    };

                    // Extract marks for questions
                    assessment.questions.forEach(q => {
                        if (q.subQuestions && q.subQuestions.length > 0) {
                            q.subQuestions.forEach(sq => {
                                const columnKey = `Q${q.questionNumber}_${sq.subQuestionNumber}`;
                                const marks = row.getCell(columnKey).value;
                                studentRow[columnKey] = parseFloat(marks) || 0;
                            });
                        } else {
                            const columnKey = `Q${q.questionNumber}`;
                            const marks = row.getCell(columnKey).value;
                            studentRow[columnKey] = parseFloat(marks) || 0;
                        }
                    });

                    // Extract marks for assignments
                    assessment.assignments.forEach(a => {
                        const columnKey = `A${a.assignmentNumber}`;
                        const marks = row.getCell(columnKey).value;
                        studentRow[columnKey] = parseFloat(marks) || 0;
                    });

                    marksData.push(studentRow);
                }
            }
        });

        if (marksData.length === 0) {
            throw new Error('No student marks data found in Excel file');
        }

        // Update assessment with marks data
        assessment.studentMarks = assessment.studentMarks.map(student => {
            const uploadedStudent = marksData.find(u => 
                u.enrollmentNo === student.enrollmentNo
            );

            if (uploadedStudent) {
                let totalObtained = 0;

                // Process question marks
                student.questionMarks = student.questionMarks.map((q, qIndex) => {
                    const processedQ = {
                        ...q,
                        subQuestionMarks: q.subQuestionMarks.map((sq, sqIndex) => {
                            const columnKey = `Q${q.questionNumber}_${sq.subQuestionNumber}`;
                            const marks = uploadedStudent[columnKey] || 0;
                            return {
                                ...sq,
                                obtainedMarks: marks
                            };
                        }),
                        obtainedMarks: 0
                    };

                    // Calculate total for question
                    if (processedQ.subQuestionMarks.length > 0) {
                        processedQ.obtainedMarks = processedQ.subQuestionMarks.reduce((sum, sq) => sum + sq.obtainedMarks, 0);
                    } else {
                        const columnKey = `Q${q.questionNumber}`;
                        processedQ.obtainedMarks = uploadedStudent[columnKey] || 0;
                    }

                    totalObtained += processedQ.obtainedMarks;
                    return processedQ;
                });

                // Process assignment marks
                student.assignmentMarks = student.assignmentMarks.map(a => {
                    const columnKey = `A${a.assignmentNumber}`;
                    const marks = uploadedStudent[columnKey] || 0;
                    totalObtained += marks;
                    return {
                        ...a,
                        obtainedMarks: marks
                    };
                });

                student.totalObtainedMarks = totalObtained;

                // Calculate percentage
                student.percentage = assessment.totalMarks > 0 ?
                    parseFloat(((totalObtained / assessment.totalMarks) * 100).toFixed(2)) : 0;

                // Determine attainment level based on percentage
                if (student.percentage > 50) {
                    student.attainmentLevel = 3;
                } else if (student.percentage >= 30) {
                    student.attainmentLevel = 2;
                } else {
                    student.attainmentLevel = 1;
                }
            }

            return student;
        });

        // Calculate summary
        calculateSummary(assessment);

        assessment.status = 'marks_uploaded';
        await assessment.save();

        return {
            _id: assessment._id,
            subjectCode: assessment.subjectCode,
            subjectName: assessment.subjectName,
            coNumber: assessment.coNumber,
            totalStudents: assessment.summary.totalStudents,
            studentsAppeared: assessment.summary.studentsAppeared,
            averagePercentage: assessment.summary.averagePercentage,
            averageMarks: assessment.summary.averageMarks,
            attainmentLevel: assessment.summary.attainmentLevel,
            status: assessment.status
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Calculate results and finalize assessment
 */
exports.calculateResults = async (assessmentId) => {
    try {
        const assessment = await CoAttainmentAssessment.findById(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }

        // Recalculate summary
        calculateSummary(assessment);

        assessment.status = 'completed';
        await assessment.save();

        return {
            _id: assessment._id,
            summary: assessment.summary,
            status: assessment.status
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Generate Excel with results and statistics
 */
exports.generateResultsExcel = async (assessmentId) => {
    try {
        const assessment = await CoAttainmentAssessment.findById(assessmentId)
            .populate('subjectId', 'code name')
            .populate('branchId', 'name');

        if (!assessment) {
            throw new Error('Assessment not found');
        }

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        // Sheet 1: Student Results
        const resultsSheet = workbook.addWorksheet('Student Results');
        resultsSheet.columns = [
            { header: 'Enrollment No', key: 'enrollmentNo', width: 15 },
            { header: 'Student Name', key: 'studentName', width: 25 },
            { header: 'Total Marks Obtained', key: 'totalObtainedMarks', width: 15 },
            { header: 'Percentage (%)', key: 'percentage', width: 14 },
            { header: 'Attainment Level', key: 'attainmentLevel', width: 16 }
        ];

        // Style header
        const headerRow = resultsSheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'center' };

        // Add data
        assessment.studentMarks.forEach((student, index) => {
            resultsSheet.addRow({
                enrollmentNo: student.enrollmentNo,
                studentName: student.studentName,
                totalObtainedMarks: student.totalObtainedMarks,
                percentage: student.percentage,
                attainmentLevel: student.attainmentLevel
            });
        });

        // Sheet 2: Summary
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 25 },
            { header: 'Value', key: 'value', width: 20 }
        ];

        const summaryData = [
            { metric: 'Subject Code', value: assessment.subjectCode },
            { metric: 'Subject Name', value: assessment.subjectName },
            { metric: 'CO Number', value: assessment.coNumber },
            { metric: 'CO Description', value: assessment.coDescription },
            { metric: 'Branch', value: assessment.branchName },
            { metric: 'Semester', value: assessment.semester },
            { metric: 'Academic Year', value: assessment.academicYear },
            { metric: 'Total Marks', value: assessment.totalMarks },
            { metric: 'Total Students', value: assessment.summary.totalStudents },
            { metric: 'Students Appeared', value: assessment.summary.studentsAppeared },
            { metric: 'Average Percentage (%)', value: `${assessment.summary.averagePercentage}%` },
            { metric: 'Average Marks', value: assessment.summary.averageMarks },
            { metric: 'Overall Attainment Level', value: assessment.summary.attainmentLevel },
            { metric: '', value: '' },
            { metric: 'Level 3 Count (>50%)', value: assessment.summary.levelDistribution.level3 },
            { metric: 'Level 2 Count (30-50%)', value: assessment.summary.levelDistribution.level2 },
            { metric: 'Level 1 Count (<30%)', value: assessment.summary.levelDistribution.level1 }
        ];

        summaryData.forEach(data => {
            summarySheet.addRow(data);
        });

        // Style summary sheet
        summarySheet.getColumn('metric').font = { bold: true };
        summarySheet.getColumn('metric').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    } catch (error) {
        throw error;
    }
};

/**
 * Helper function to calculate summary statistics
 */
function calculateSummary(assessment) {
    const totalStudents = assessment.studentMarks.length;
    const studentsAppeared = assessment.studentMarks.filter(s => s.totalObtainedMarks > 0).length;

    let totalPercentage = 0;
    let totalMarksObtained = 0;
    const levelDistribution = { level3: 0, level2: 0, level1: 0 };

    assessment.studentMarks.forEach(student => {
        totalPercentage += student.percentage;
        totalMarksObtained += student.totalObtainedMarks;

        if (student.attainmentLevel === 3) {
            levelDistribution.level3++;
        } else if (student.attainmentLevel === 2) {
            levelDistribution.level2++;
        } else {
            levelDistribution.level1++;
        }
    });

    const averagePercentage = totalStudents > 0 ?
        parseFloat((totalPercentage / totalStudents).toFixed(2)) : 0;

    const averageMarks = totalStudents > 0 ?
        parseFloat((totalMarksObtained / totalStudents).toFixed(2)) : 0;

    let attainmentLevel;
    if (averagePercentage > 50) {
        attainmentLevel = 3;
    } else if (averagePercentage >= 30) {
        attainmentLevel = 2;
    } else {
        attainmentLevel = 1;
    }

    assessment.summary = {
        totalStudents,
        studentsAppeared,
        averagePercentage,
        averageMarks,
        attainmentLevel,
        levelDistribution,
        calculatedAt: new Date()
    };
}

module.exports = exports;
