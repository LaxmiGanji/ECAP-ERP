// services/co-assessment.service.js
const COAssessment = require('../models/Other/coattainment.model');
const Student = require('../models/Students/details.model');
const Subject = require('../models/Other/subject.model');
const Branch = require('../models/Other/branch.model');

exports.createCOAssessment = async (data) => {
    try {
        // Fetch subject details
        const subject = await Subject.findById(data.subjectId)
            .populate('branch', 'name');
            
        if (!subject) {
            throw new Error('Subject not found');
        }
        
        // Fetch CO details if a top-level coNumber was provided
        let co = null;
        if (data.coNumber) {
            co = subject.courseOutcomes.find(c => c.coNumber === data.coNumber);
            if (!co) {
                // don't throw: allow creation when per-question CO mappings exist; just warn
                console.warn('[createCOAssessment] top-level coNumber provided but not found on subject:', data.coNumber);
                co = null;
            }
        }
        
        // Fetch branch details - handle both ObjectId and branch name
        let branch;
        let branchName = data.branchId;
        
        // Try to find branch by ID first
        try {
            branch = await Branch.findById(data.branchId);
            if (branch) {
                branchName = branch.name;
            }
        } catch (err) {
            // Not a valid ObjectId, treat as branch name
            branch = await Branch.findOne({ name: data.branchId });
            if (!branch) {
                branchName = data.branchId; // Use as-is if branch doc not found
            } else {
                branchName = branch.name;
            }
        }
        
        if (!branchName) {
            throw new Error('Branch not found');
        }
        
        // Fetch students for this branch and semester
        // Student.branch is a String field containing branch name
        const students = await Student.find({
            branch: branchName,
            semester: data.semester,
            status: { $ne: 'inactive' }  // Include all active students
        }).select('enrollmentNo firstName middleName lastName');
        
        // Prefer user-provided totalMarks if present (user input is authoritative)
        let totalMarks = 0;
        if (data.totalMarks && Number(data.totalMarks) > 0) {
            totalMarks = Number(data.totalMarks);
            console.log('[createCOAssessment] Using provided totalMarks=', totalMarks);
        } else {
            // Calculate total marks (coerce to numbers to avoid string issues)
            if (data.questions && Array.isArray(data.questions)) {
                data.questions.forEach(question => {
                    if (question.subQuestions && question.subQuestions.length > 0) {
                        question.subQuestions.forEach(subQ => {
                            totalMarks += Number(subQ.totalMarks) || 0;
                        });
                    } else {
                        totalMarks += Number(question.totalMarks) || 0;
                    }
                });
            }

            // Add assignment marks
            if (data.assignments && Array.isArray(data.assignments)) {
                data.assignments.forEach(assignment => {
                    totalMarks += Number(assignment.totalMarks) || 0;
                });
            }

            console.log('[createCOAssessment] Computed totalMarks=', totalMarks);
            console.log('[createCOAssessment] Received questions=', JSON.stringify(data.questions).slice(0,1000));
            console.log('[createCOAssessment] Received assignments=', JSON.stringify(data.assignments).slice(0,1000));
        }
        
        // Prepare student marks array
        const studentMarks = students.map(student => ({
            enrollmentNo: student.enrollmentNo,
            studentName: `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim().replace(/\s+/g, ' '),
            questionMarks: data.questions ? data.questions.map(q => ({
                questionNumber: q.questionNumber,
                subQuestionMarks: q.subQuestions ? q.subQuestions.map(sq => ({
                    subQuestionNumber: sq.subQuestionNumber,
                    obtainedMarks: 0
                })) : [],
                totalObtainedMarks: 0
            })) : [],
            assignmentMarks: data.assignments ? data.assignments.map(a => ({
                assignmentNumber: a.assignmentNumber,
                obtainedMarks: 0
            })) : [],
            totalObtainedMarks: 0,
            percentage: 0,
            attainmentLevel: 1
        }));
        
        // Create assessment record (in-memory, don't save during template creation)
        const assessment = {
            facultyId: data.facultyId,
            subjectId: data.subjectId,
            subjectCode: subject.code,
            subjectName: subject.name,
            coNumber: data.coNumber || null,
            coDescription: co ? co.description : '',
            branchId: data.branchId,
            branchName: branchName,
            semester: data.semester,
            academicYear: data.academicYear,
            questions: data.questions || [],
            assignments: data.assignments || [],
            totalMarks: totalMarks,
            studentMarks: studentMarks,
            status: 'draft'
        };
        
        return {
            success: true,
            assessment,
            studentCount: students.length
        };
        
    } catch (error) {
        throw error;
    }
};

exports.generateTemplate = async (assessmentId) => {
    try {
        const assessment = await COAssessment.findById(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        // Generate Excel template data
        const templateData = generateExcelTemplate(assessment);
        
        // Update status
        assessment.status = 'template_generated';
        await assessment.save();
        
        return {
            success: true,
            assessment,
            templateData
        };
        
    } catch (error) {
        throw error;
    }
};

exports.uploadMarks = async (assessmentId, marksData) => {
    try {
        const assessment = await COAssessment.findById(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        // Process uploaded marks
        assessment.studentMarks = processMarksData(marksData, assessment);
        
        // Calculate attainment for each student (if not already calculated in processMarksData)
        assessment.studentMarks.forEach(student => {
            // If totalObtainedMarks not set, calculate it
            if (typeof student.totalObtainedMarks === 'undefined' || student.totalObtainedMarks === null) {
                let totalObtained = 0;
                
                // Sum question marks
                if (student.questionMarks && Array.isArray(student.questionMarks)) {
                    student.questionMarks.forEach(q => {
                        totalObtained += (q.totalObtainedMarks || 0);
                    });
                }
                
                // Sum assignment marks
                if (student.assignmentMarks && Array.isArray(student.assignmentMarks)) {
                    student.assignmentMarks.forEach(a => {
                        totalObtained += (a.obtainedMarks || 0);
                    });
                }
                
                student.totalObtainedMarks = totalObtained;
            }
            
            // Calculate percentage if not already set
            if (typeof student.percentage === 'undefined' || student.percentage === null) {
                const totalMarks = assessment.totalMarks > 0 ? assessment.totalMarks : 100;
                student.percentage = assessment.totalMarks > 0 ? 
                    parseFloat(((student.totalObtainedMarks / assessment.totalMarks) * 100).toFixed(2)) : 0;
            }
            
            // Determine attainment level if not already set
            if (typeof student.attainmentLevel === 'undefined' || student.attainmentLevel === null) {
                if (student.percentage > 50) {
                    student.attainmentLevel = 3;
                } else if (student.percentage >= 30) {
                    student.attainmentLevel = 2;
                } else {
                    student.attainmentLevel = 1;
                }
            }
        });
        
        // Calculate summary (includes per-CO summaries)
        calculateSummary(assessment);
        
        // Update CO attainment in Subject model for ALL COs using per-CO student results
        await updateCOAttainment(assessment.subjectId, null, assessment);
        
        assessment.status = 'marks_uploaded';
        await assessment.save();
        
        return {
            success: true,
            assessment
        };
        
    } catch (error) {
        throw error;
    }
};

function generateExcelTemplate(assessment) {
    const headers = ['Enrollment No', 'Student Name'];
    
    // Add question headers
    assessment.questions.forEach(question => {
        if (question.subQuestions && question.subQuestions.length > 0) {
            question.subQuestions.forEach(subQ => {
                headers.push(`Q${question.questionNumber}${subQ.subQuestionNumber}`);
            });
        } else {
            headers.push(`Q${question.questionNumber}`);
        }
    });
    
    // Add assignment headers
    assessment.assignments.forEach(assignment => {
        headers.push(`A${assignment.assignmentNumber}`);
    });
    
    // Create rows for each student
    const rows = assessment.studentMarks.map(student => {
        const row = {
            'Enrollment No': student.enrollmentNo,
            'Student Name': student.studentName
        };
        
        // Add question columns
        assessment.questions.forEach((question, qIndex) => {
            if (question.subQuestions && question.subQuestions.length > 0) {
                question.subQuestions.forEach((subQ, sqIndex) => {
                    const marks = student.questionMarks[qIndex]?.subQuestionMarks[sqIndex]?.obtainedMarks || 0;
                    row[`Q${question.questionNumber}${subQ.subQuestionNumber}`] = marks;
                });
            } else {
                const marks = student.questionMarks[qIndex]?.totalObtainedMarks || 0;
                row[`Q${question.questionNumber}`] = marks;
            }
        });
        
        // Add assignment columns
        assessment.assignments.forEach((assignment, aIndex) => {
            const marks = student.assignmentMarks[aIndex]?.obtainedMarks || 0;
            row[`A${assignment.assignmentNumber}`] = marks;
        });
        
        return row;
    });
    
    return {
        headers,
        rows,
        assessmentInfo: {
            subjectCode: assessment.subjectCode,
            subjectName: assessment.subjectName,
            coNumber: assessment.coNumber,
            branch: assessment.branchName,
            semester: assessment.semester,
            academicYear: assessment.academicYear,
            totalMarks: assessment.totalMarks
        }
    };
}

function processMarksData(uploadedData, assessment) {
    console.log('processMarksData: Starting with', uploadedData.length, 'rows');
    console.log('processMarksData: Assessment has', assessment.studentMarks.length, 'students');
    
    // Process the uploaded Excel data and map it to student marks
    const processedMarks = assessment.studentMarks.map(student => {
        // Find this student's data in uploaded data by trying multiple enrollment no variations
        const enrollmentNoStr = student.enrollmentNo.toString();
        const uploadedStudent = uploadedData.find(u => {
            if (!u) return false;
            const uEnrollNo = String(u['Enrollment No'] || u['enrollment no'] || u['Enrollment no'] || u['EnrollmentNo'] || '').trim();
            return uEnrollNo === enrollmentNoStr || uEnrollNo === student.enrollmentNo;
        });
        
        if (uploadedStudent) {
            console.log('processMarksData: Found data for student', enrollmentNoStr);
            
            // Process question marks
            const questionMarks = assessment.questions.map((question, qIndex) => {
                const qMark = {
                    questionNumber: question.questionNumber,
                    subQuestionMarks: [],
                    totalObtainedMarks: 0
                };
                
                if (question.subQuestions && question.subQuestions.length > 0) {
                    // Process sub-questions
                    question.subQuestions.forEach((subQ, sqIndex) => {
                        const key = `Q${question.questionNumber}${subQ.subQuestionNumber}`;
                        const marks = parseFloat(uploadedStudent[key]) || 0;
                        qMark.subQuestionMarks.push({
                            subQuestionNumber: subQ.subQuestionNumber,
                            obtainedMarks: marks
                        });
                        qMark.totalObtainedMarks += marks;
                    });
                } else {
                    // Process direct question marks
                    const key = `Q${question.questionNumber}`;
                    qMark.totalObtainedMarks = parseFloat(uploadedStudent[key]) || 0;
                }
                
                return qMark;
            });
            
            // Process assignment marks
            const assignmentMarks = assessment.assignments.map((assignment, aIndex) => {
                const key = `A${assignment.assignmentNumber}`;
                return {
                    assignmentNumber: assignment.assignmentNumber,
                    obtainedMarks: parseFloat(uploadedStudent[key]) || 0
                };
            });
            
            // Calculate total obtained marks
            let totalObtained = 0;
            questionMarks.forEach(q => {
                totalObtained += q.totalObtainedMarks;
            });
            assignmentMarks.forEach(a => {
                totalObtained += a.obtainedMarks;
            });
            
            // Calculate percentage
            const totalMarks = assessment.totalMarks > 0 ? assessment.totalMarks : 100;
            const percentage = (totalObtained / totalMarks) * 100;
            
            // Compute per-CO obtained and percentages
            const coPossible = {}; // coNumber -> possible marks
            (assessment.questions || []).forEach(question => {
                const qTotal = (question.subQuestions && question.subQuestions.length > 0)
                    ? question.subQuestions.reduce((s, sq) => s + (Number(sq.totalMarks) || 0), 0)
                    : (Number(question.totalMarks) || 0);
                const co = question.coNumber || 'UNMAPPED';
                if (!coPossible[co]) coPossible[co] = 0;
                coPossible[co] += qTotal;
            });

            const coResults = [];
            const coObtained = {};
            // Sum obtained per CO from questionMarks
            questionMarks.forEach((qMark, qIdx) => {
                const qDef = assessment.questions[qIdx] || {};
                const co = qDef.coNumber || 'UNMAPPED';
                if (!coObtained[co]) coObtained[co] = 0;
                coObtained[co] += Number(qMark.totalObtainedMarks) || 0;
            });

            Object.keys(coPossible).forEach(co => {
                const obtained = coObtained[co] || 0;
                const possible = coPossible[co] || 0;
                // Calculate percentage relative to the CO's possible marks (correct CO-level metric)
                const perc = possible > 0 ? (obtained / possible) * 100 : 0;
                let coLevel = 1;
                if (perc > 50) coLevel = 3;
                else if (perc >= 30) coLevel = 2;
                coResults.push({ coNumber: co, obtainedMarks: obtained, totalMarks: possible, percentage: parseFloat(perc.toFixed(2)), attainmentLevel: coLevel });
            });

            // Determine overall attainment level (based on total percentage)
            let attainmentLevel = 1;
            if (percentage > 50) {
                attainmentLevel = 3;
            } else if (percentage >= 30) {
                attainmentLevel = 2;
            }

            return {
                ...student.toObject ? student.toObject() : student,
                questionMarks,
                assignmentMarks,
                totalObtainedMarks: totalObtained,
                percentage: parseFloat(percentage.toFixed(2)),
                attainmentLevel,
                coResults
            };
        } else {
            console.log('processMarksData: No data found for student', enrollmentNoStr);
        }
        
        return student;
    });
    
    console.log('processMarksData: Processed', processedMarks.length, 'students');
    return processedMarks;
}

function calculateSummary(assessment) {
    const totalStudents = assessment.studentMarks.length;
    let totalPercentage = 0;
    const levelDistribution = { level3: 0, level2: 0, level1: 0 };

    assessment.studentMarks.forEach(student => {
        // Ensure numeric coercion to avoid string concatenation and wrong averages
        const percNum = Number(student.percentage) || 0;
        totalPercentage += percNum;

        const sLevel = Number(student.attainmentLevel) || (percNum > 50 ? 3 : (percNum >= 30 ? 2 : 1));
        if (sLevel === 3) {
            levelDistribution.level3++;
        } else if (sLevel === 2) {
            levelDistribution.level2++;
        } else {
            levelDistribution.level1++;
        }
    });
    
    const averagePercentage = totalStudents > 0 ? 
        parseFloat((totalPercentage / totalStudents).toFixed(2)) : 0;
    
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
        averagePercentage,
        attainmentLevel,
        levelDistribution,
        calculatedAt: new Date(),
        // Per-CO summary
        coSummary: (() => {
            const coMap = {}; // coNumber -> { totalPerc, totalLevel, counts }
            const coList = (assessment.questions || []).map(q => q.coNumber).filter(Boolean);
            // initialize from questions
            (coList || []).forEach(co => {
                coMap[co] = { totalPerc: 0, totalLevel: 0, count: 0, levelCounts: { '3': 0, '2': 0, '1': 0 } };
            });

            (assessment.studentMarks || []).forEach(student => {
                // Prefer explicit per-student coResults when available
                let studentCoResults = student.coResults || student.co_results || [];

                // If coResults missing, try to derive per-CO obtained/possible from questionMarks and assessment.questions
                if ((!studentCoResults || studentCoResults.length === 0) && Array.isArray(assessment.questions) && Array.isArray(student.questionMarks)) {
                    const coPossible = {}; // co -> possible marks
                    const coObtained = {}; // co -> obtained marks

                    assessment.questions.forEach((qDef, qIdx) => {
                        const co = qDef.coNumber || 'UNMAPPED';
                        let qPossible = 0;
                        if (Array.isArray(qDef.subQuestions) && qDef.subQuestions.length > 0) {
                            qDef.subQuestions.forEach(sq => {
                                qPossible += Number(sq.totalMarks) || 0;
                            });
                        } else {
                            qPossible = Number(qDef.totalMarks) || 0;
                        }

                        const qMark = student.questionMarks[qIdx] || {};
                        const obtained = Number(qMark.totalObtainedMarks) || 0;

                        coPossible[co] = (coPossible[co] || 0) + qPossible;
                        coObtained[co] = (coObtained[co] || 0) + obtained;
                    });

                    studentCoResults = Object.keys(coPossible).map(co => {
                        const obtained = coObtained[co] || 0;
                        const possible = coPossible[co] || 0;
                        const perc = possible > 0 ? (obtained / possible) * 100 : 0;
                        let coLevel = 1;
                        if (perc > 50) coLevel = 3;
                        else if (perc >= 30) coLevel = 2;
                        return { coNumber: co, obtainedMarks: obtained, totalMarks: possible, percentage: parseFloat(perc.toFixed(2)), attainmentLevel: coLevel };
                    });
                }

                // Aggregate from the student's coResults (either original or derived)
                (studentCoResults || []).forEach(cr => {
                    const coKey = String(cr.coNumber || 'UNMAPPED').trim();
                    if (!coMap[coKey]) {
                        coMap[coKey] = { totalPerc: 0, totalLevel: 0, count: 0, levelCounts: { '3': 0, '2': 0, '1': 0 } };
                    }

                    const perc = Number(cr.percentage) || 0;
                    const derivedLevel = perc > 50 ? 3 : (perc >= 30 ? 2 : 1);

                    coMap[coKey].totalPerc += perc;
                    coMap[coKey].totalLevel += derivedLevel;
                    coMap[coKey].count += 1;
                    const lvl = String(derivedLevel);
                    coMap[coKey].levelCounts[lvl] = (coMap[coKey].levelCounts[lvl] || 0) + 1;
                });
            });

            return Object.keys(coMap).map(co => {
                const entry = coMap[co];
                const avgPerc = entry.count > 0 ? parseFloat((entry.totalPerc / entry.count).toFixed(2)) : 0;
                const avgLevel = entry.count > 0 ? parseFloat((entry.totalLevel / entry.count).toFixed(2)) : 0;
                return { coNumber: co, averagePercentage: avgPerc, averageAttainment: avgLevel, levelCounts: entry.levelCounts, studentCount: entry.count };
            });
        })()
    };
}

// Calculate and store average CO attainment
async function updateCOAttainment(subjectId, coNumber, assessment) {
    try {
        // Calculate average attainment level from all students in this assessment
        let totalAttainment = 0;
        let studentCount = 0;
        
        if (assessment.studentMarks && Array.isArray(assessment.studentMarks)) {
            assessment.studentMarks.forEach(student => {
                if (typeof student.attainmentLevel !== 'undefined' && student.attainmentLevel !== null) {
                    totalAttainment += student.attainmentLevel;
                    studentCount++;
                }
            });
        }
        
        const averageAttainment = studentCount > 0 ? 
            parseFloat((totalAttainment / studentCount).toFixed(2)) : 0;
        
        console.log(`[updateCOAttainment] Calculated CO ${coNumber} attainment: ${averageAttainment} from ${studentCount} students`);
        
        // Find the subject and the CO index first
        let subject = await Subject.findById(subjectId);
        if (!subject) {
            console.error(`[updateCOAttainment] Subject ${subjectId} not found`);
            return null;
        }
        
        // If a specific coNumber provided, update only that CO. Otherwise update all COs based on assessment data
        if (coNumber) {
            // Find CO index
            const coIndex = subject.courseOutcomes.findIndex(co => co.coNumber === coNumber);
            if (coIndex === -1) {
                console.error(`[updateCOAttainment] CO ${coNumber} not found in subject ${subjectId}`);
            } else {
                console.log(`[updateCOAttainment] Found CO at index ${coIndex}, updating attainment to ${averageAttainment}`);
                subject.courseOutcomes[coIndex].attainment = averageAttainment;
            }
        } else {
            // Build per-CO average attainment from assessment.studentMarks.coResults
            const coSums = {}; // coNumber -> { totalAttainment, count }
            if (assessment && Array.isArray(assessment.studentMarks)) {
                assessment.studentMarks.forEach(student => {
                    let studentCoResults = student.coResults || student.co_results || [];

                    // If missing, derive from questionMarks
                    if ((!studentCoResults || studentCoResults.length === 0) && Array.isArray(assessment.questions) && Array.isArray(student.questionMarks)) {
                        const coPossible = {};
                        const coObtained = {};

                        assessment.questions.forEach((qDef, qIdx) => {
                            const co = qDef.coNumber || 'UNMAPPED';
                            let qPossible = 0;
                            if (Array.isArray(qDef.subQuestions) && qDef.subQuestions.length > 0) {
                                qDef.subQuestions.forEach(sq => { qPossible += Number(sq.totalMarks) || 0; });
                            } else {
                                qPossible = Number(qDef.totalMarks) || 0;
                            }
                            const qMark = student.questionMarks[qIdx] || {};
                            const obtained = Number(qMark.totalObtainedMarks) || 0;

                            coPossible[co] = (coPossible[co] || 0) + qPossible;
                            coObtained[co] = (coObtained[co] || 0) + obtained;
                        });

                        studentCoResults = Object.keys(coPossible).map(co => {
                            const obtained = coObtained[co] || 0;
                            const possible = coPossible[co] || 0;
                            const perc = possible > 0 ? (obtained / possible) * 100 : 0;
                            const lvl = perc > 50 ? 3 : (perc >= 30 ? 2 : 1);
                            return { coNumber: co, attainmentLevel: lvl };
                        });
                    }

                    (studentCoResults || []).forEach(cr => {
                        if (!coSums[cr.coNumber]) coSums[cr.coNumber] = { total: 0, count: 0 };
                        coSums[cr.coNumber].total += Number(cr.attainmentLevel) || 0;
                        coSums[cr.coNumber].count += 1;
                    });
                });
            }

            // Update each CO in subject
            subject.courseOutcomes.forEach((co, idx) => {
                const sums = coSums[co.coNumber];
                if (sums && sums.count > 0) {
                    const avg = parseFloat((sums.total / sums.count).toFixed(2));
                    subject.courseOutcomes[idx].attainment = avg;
                    console.log(`[updateCOAttainment] Updated CO ${co.coNumber} attainment -> ${avg}`);
                } else {
                    // No data for this CO in this assessment: leave unchanged or set 0
                    subject.courseOutcomes[idx].attainment = subject.courseOutcomes[idx].attainment || 0;
                    console.log(`[updateCOAttainment] No data for CO ${co.coNumber}; left as ${subject.courseOutcomes[idx].attainment}`);
                }
            });
        }

        // Mark modified and save
        subject.markModified('courseOutcomes');
        await subject.save();
        console.log(`[updateCOAttainment] Subject saved successfully`);

        // Fetch fresh subject with updated data
        subject = await Subject.findById(subjectId);

        // Calculate and update PO attainments based on new CO attainment
        await updatePOAttainments(subject);

        return true;
    } catch (error) {
        console.error('Error updating CO attainment:', error);
        // Don't throw - just log the error to avoid disrupting main workflow
    }
}

// Calculate PO attainments from a subject (without saving, for reading current values)
exports.calculatePOAttainments = async (subject) => {
    try {
        const poAttainments = {};
        
        // Initialize all POs
        ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'].forEach(po => {
            poAttainments[po] = { totalWeightedAttainment: 0, totalStrength: 0 };
        });
        
        // Iterate through each CO-PO mapping
        subject.coPoMappings.forEach(mapping => {
            // Find the CO attainment
            const co = subject.courseOutcomes.find(c => c.coNumber === mapping.coNumber);
            if (co && co.attainment) {
                const poKey = mapping.poNumber;
                // Add weighted attainment: CO_Attainment × Strength
                poAttainments[poKey].totalWeightedAttainment += (co.attainment * mapping.strength);
                // Add strength for normalization
                poAttainments[poKey].totalStrength += mapping.strength;
            }
        });
        
        // Calculate final PO attainments
        const poAttainmentsList = [];
        Object.entries(poAttainments).forEach(([poNumber, data]) => {
            const attainment = data.totalStrength > 0 ? 
                parseFloat((data.totalWeightedAttainment / data.totalStrength).toFixed(2)) : 0;
            
            poAttainmentsList.push({
                poNumber,
                attainment
            });
        });
        
        return poAttainmentsList;
    } catch (error) {
        console.error('Error calculating PO attainments:', error);
        return [];
    }
};

// PO Attainment = Σ(CO_Attainment × Strength) / Σ(Strength)
async function updatePOAttainments(subject) {
    try {
        if (!subject) {
            console.error('[updatePOAttainments] Subject is null');
            return [];
        }
        
        const poAttainments = {};
        
        // Initialize all POs
        ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'].forEach(po => {
            poAttainments[po] = { totalWeightedAttainment: 0, totalStrength: 0 };
        });
        
        console.log(`[updatePOAttainments] Processing ${subject.coPoMappings?.length || 0} mappings for subject ${subject._id}`);
        console.log(`[updatePOAttainments] COs with attainments:`, subject.courseOutcomes.map(c => ({ co: c.coNumber, att: c.attainment })));
        
        // Iterate through each CO-PO mapping
        if (subject.coPoMappings && Array.isArray(subject.coPoMappings)) {
            subject.coPoMappings.forEach(mapping => {
                // Find the CO attainment
                const co = subject.courseOutcomes.find(c => c.coNumber === mapping.coNumber);
                const attainmentValue = co?.attainment;
                
                console.log(`[updatePOAttainments] Mapping: ${mapping.coNumber} -> ${mapping.poNumber} (strength: ${mapping.strength}), CO attainment: ${attainmentValue}`);
                
                if (co && typeof attainmentValue === 'number' && attainmentValue > 0) {
                    const poKey = mapping.poNumber;
                    // Add weighted attainment: CO_Attainment × Strength
                    poAttainments[poKey].totalWeightedAttainment += (attainmentValue * mapping.strength);
                    // Add strength for normalization
                    poAttainments[poKey].totalStrength += mapping.strength;
                }
            });
        }
        
        // Calculate final PO attainments
        const poAttainmentsList = [];
        Object.entries(poAttainments).forEach(([poNumber, data]) => {
            const attainment = data.totalStrength > 0 ? 
                parseFloat((data.totalWeightedAttainment / data.totalStrength).toFixed(2)) : 0;
            
            console.log(`[updatePOAttainments] PO ${poNumber}: attainment=${attainment} (weighted=${data.totalWeightedAttainment}, strength=${data.totalStrength})`);
            
            poAttainmentsList.push({
                poNumber,
                attainment
            });
        });
        
        // Update PO attainments in subject
        subject.poAttainments = poAttainmentsList;
        subject.markModified('poAttainments');
        
        await subject.save();
        
        console.log(`[updatePOAttainments] Updated PO attainments for subject ${subject._id}`);
        return poAttainmentsList;
    } catch (error) {
        console.error('[updatePOAttainments] Error calculating PO attainments:', error);
        // Don't throw - just log the error
        return [];
    }
}


// Wrapper to create assessment and/or upload marks based on payload
exports.calculate = async (data) => {
    try {
        // If marksData provided, process marks upload
        if (data.marksData) {
            // If assessmentId provided, directly upload to existing assessment
            if (data.assessmentId) {
                return await exports.uploadMarks(data.assessmentId, data.marksData);
            }

            // Otherwise create assessment first, then process marks inline
            const createResult = await exports.createCOAssessment(data);
            const assessment = createResult.assessment;
            
            // Process marks data directly without saving to DB first
            try {
                assessment.studentMarks = processMarksData(data.marksData, assessment);
                
                // Calculate attainment for each student
                assessment.studentMarks.forEach(student => {
                    // If totalObtainedMarks not set, calculate it
                    if (typeof student.totalObtainedMarks === 'undefined' || student.totalObtainedMarks === null) {
                        let totalObtained = 0;
                        
                        // Sum question marks
                        if (student.questionMarks && Array.isArray(student.questionMarks)) {
                            student.questionMarks.forEach(q => {
                                totalObtained += (q.totalObtainedMarks || 0);
                            });
                        }
                        
                        // Sum assignment marks
                        if (student.assignmentMarks && Array.isArray(student.assignmentMarks)) {
                            student.assignmentMarks.forEach(a => {
                                totalObtained += (a.obtainedMarks || 0);
                            });
                        }
                        
                        student.totalObtainedMarks = totalObtained;
                    }
                    
                    // Calculate percentage if not already set
                    if (typeof student.percentage === 'undefined' || student.percentage === null) {
                        const totalMarks = assessment.totalMarks > 0 ? assessment.totalMarks : 100;
                        student.percentage = assessment.totalMarks > 0 ? 
                            parseFloat(((student.totalObtainedMarks / assessment.totalMarks) * 100).toFixed(2)) : 0;
                    }
                    
                    // Determine attainment level if not already set
                    if (typeof student.attainmentLevel === 'undefined' || student.attainmentLevel === null) {
                        if (student.percentage > 50) {
                            student.attainmentLevel = 3;
                        } else if (student.percentage >= 30) {
                            student.attainmentLevel = 2;
                        } else {
                            student.attainmentLevel = 1;
                        }
                    }
                });
                
                // Calculate summary (includes per-CO summaries)
                calculateSummary(assessment);
                
                // Update CO attainment in Subject model for ALL COs
                await updateCOAttainment(assessment.subjectId, null, assessment);
                
                assessment.status = 'marks_uploaded';
                // Log small sample for debugging per-CO results (first 5 students and coSummary)
                try {
                    console.log('[coattainment.calculate] sample student coResults:', (assessment.studentMarks || []).slice(0,5).map(s => ({ enrollmentNo: s.enrollmentNo, coResults: s.coResults }))); 
                    console.log('[coattainment.calculate] coSummary sample:', (assessment.summary && assessment.summary.coSummary) ? (assessment.summary.coSummary.slice(0,10)) : assessment.summary);
                } catch (e) {
                    console.warn('[coattainment.calculate] debug log failed', e && e.message);
                }

                return { success: true, assessment };
            } catch (processError) {
                console.error('Error processing marks:', processError);
                throw new Error('Failed to process uploaded marks: ' + processError.message);
            }
        }

        // If no marksData, create assessment and return it (for template generation)
        if (data.questions || data.assignments) {
            const createResult = await exports.createCOAssessment(data);
            return { success: true, assessment: createResult.assessment };
        }

        throw new Error('Invalid payload for calculate');
    } catch (error) {
        throw error;
    }
};

// Get all CO and PO attainments for a subject
exports.getCOAttainments = async (subjectId) => {
    try {
        const subject = await Subject.findById(subjectId)
            .select('name code courseOutcomes coPoMappings poAttainments');
        
        if (!subject) {
            throw new Error('Subject not found');
        }
        
        const coAttainments = subject.courseOutcomes.map(co => ({
            coNumber: co.coNumber,
            description: co.description,
            attainment: co.attainment || 0
        }));
        
        const poAttainments = subject.poAttainments || [];
        
        return {
            success: true,
            subject: {
                id: subject._id,
                name: subject.name,
                code: subject.code
            },
            coAttainments,
            poAttainments,
            coPoMappings: subject.coPoMappings
        };
    } catch (error) {
        throw error;
    }
};