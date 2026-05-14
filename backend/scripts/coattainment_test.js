// Test script to validate CO attainment calculations (replicates logic from coattainment.service.js)

function computeCoSummary(assessment) {
  // replicate calculateSummary coSummary part
  const coMap = {};
  const coList = (assessment.questions || []).map(q => q.coNumber).filter(Boolean);
  (coList || []).forEach(co => {
    coMap[co] = { totalPerc: 0, totalLevel: 0, count: 0, levelCounts: { '3': 0, '2': 0, '1': 0 } };
  });

  (assessment.studentMarks || []).forEach(student => {
    if (!student.coResults) return;
    student.coResults.forEach(cr => {
      if (!coMap[cr.coNumber]) {
        coMap[cr.coNumber] = { totalPerc: 0, totalLevel: 0, count: 0, levelCounts: { '3': 0, '2': 0, '1': 0 } };
      }
      coMap[cr.coNumber].totalPerc += cr.percentage || 0;
      coMap[cr.coNumber].totalLevel += cr.attainmentLevel || 0;
      coMap[cr.coNumber].count += 1;
      const lvl = String(cr.attainmentLevel || 1);
      coMap[cr.coNumber].levelCounts[lvl] = (coMap[cr.coNumber].levelCounts[lvl] || 0) + 1;
    });
  });

  const res = Object.keys(coMap).map(co => {
    const entry = coMap[co];
    const avgPerc = entry.count > 0 ? parseFloat((entry.totalPerc / entry.count).toFixed(2)) : 0;
    const avgLevel = entry.count > 0 ? parseFloat((entry.totalLevel / entry.count).toFixed(2)) : 0;
    return { coNumber: co, averagePercentage: avgPerc, averageAttainment: avgLevel, levelCounts: entry.levelCounts, studentCount: entry.count };
  });

  return res;
}

function computeStudentCoResults(assessment, uploadedStudent) {
  // replicate coResults per student
  const coPossible = {};
  (assessment.questions || []).forEach(question => {
    const qTotal = (question.subQuestions && question.subQuestions.length > 0)
      ? question.subQuestions.reduce((s, sq) => s + (Number(sq.totalMarks) || 0), 0)
      : (Number(question.totalMarks) || 0);
    const co = question.coNumber || 'UNMAPPED';
    if (!coPossible[co]) coPossible[co] = 0;
    coPossible[co] += qTotal;
  });

  const coObtained = {};
  assessment.questions.forEach((qDef, qIdx) => {
    // For test, uploadedStudent will have keys like Q1a or Q1
    if (qDef.subQuestions && qDef.subQuestions.length > 0) {
      let sum = 0;
      qDef.subQuestions.forEach(sq => {
        const key = `Q${qDef.questionNumber}${sq.subQuestionNumber}`;
        sum += Number(uploadedStudent[key] || 0);
      });
      const co = qDef.coNumber || 'UNMAPPED';
      coObtained[co] = (coObtained[co] || 0) + sum;
    } else {
      const key = `Q${qDef.questionNumber}`;
      const val = Number(uploadedStudent[key] || 0);
      const co = qDef.coNumber || 'UNMAPPED';
      coObtained[co] = (coObtained[co] || 0) + val;
    }
  });

  const coResults = [];
  Object.keys(coPossible).forEach(co => {
    const obtained = coObtained[co] || 0;
    const possible = coPossible[co] || 0;
    const perc = possible > 0 ? (obtained / possible) * 100 : 0;
    let coLevel = 1;
    if (perc > 50) coLevel = 3;
    else if (perc >= 30) coLevel = 2;
    coResults.push({ coNumber: co, obtainedMarks: obtained, totalMarks: possible, percentage: parseFloat(perc.toFixed(2)), attainmentLevel: coLevel });
  });

  return coResults;
}

// Sample assessment
const assessment = {
  totalMarks: 20,
  questions: [
    { questionNumber: 1, coNumber: 'CO1', subQuestions: [{ subQuestionNumber: 'a', totalMarks: 10 }] },
    { questionNumber: 2, coNumber: 'CO2', subQuestions: [{ subQuestionNumber: 'a', totalMarks: 10 }] }
  ],
  studentMarks: []
};

// Sample uploaded students showing different performance
const studentsUploaded = [
  { enrollment: 'S1', Q1a: 8, Q2a: 8 }, // CO1 80% -> L3, CO2 80% -> L3
  { enrollment: 'S2', Q1a: 6, Q2a: 6 }, // 60% -> L3, 60% -> L3
  { enrollment: 'S3', Q1a: 4, Q2a: 4 }, // 40% -> L2, 40% -> L2
  { enrollment: 'S4', Q1a: 2, Q2a: 0 }, // 20% -> L1, 0% -> L1
  { enrollment: 'S5', Q1a: 0, Q2a: 6 }  // 0% -> L1, 60% -> L3
];

assessment.studentMarks = studentsUploaded.map(u => {
  const coResults = computeStudentCoResults(assessment, u);
  // overall total and percentage
  const totalObtained = (Number(u.Q1a||0) + Number(u.Q2a||0));
  const percentage = (totalObtained / assessment.totalMarks) * 100;
  let attainmentLevel = 1;
  if (percentage > 50) attainmentLevel = 3;
  else if (percentage >= 30) attainmentLevel = 2;
  return { enrollmentNo: u.enrollment, totalObtainedMarks: totalObtained, percentage: parseFloat(percentage.toFixed(2)), attainmentLevel, coResults };
});

console.log('Student-wise coResults:');
assessment.studentMarks.forEach(s => {
  console.log(s.enrollmentNo, 'overall%', s.percentage, 'Level', s.attainmentLevel, 'coResults:', s.coResults.map(c=>`${c.coNumber}:${c.percentage}%/L${c.attainmentLevel}`).join(', '));
});

const summary = computeCoSummary(assessment);
console.log('\nComputed CO Summary:');
summary.forEach(s => {
  console.log(s.coNumber, 'avgAttainment', s.averageAttainment, 'counts', s.levelCounts);
});

// totals
console.log('\nTotals per CO (sanity):');
summary.forEach(s => {
  const total = s.levelCounts['3'] + s.levelCounts['2'] + s.levelCounts['1'];
  console.log(s.coNumber, 'students', s.studentCount, 'counts sum', total);
});
