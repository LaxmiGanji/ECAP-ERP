/*
  Simple script to invoke the new /api/timetable/generate endpoint
  using axios.  This can be run with `node scripts/test_auto_timetable.js`
*/

const axios = require('axios');

const payload = {
  branch: 'CSE',
  semester: 7,
  section: 'A',
  subjects: [
    { name: 'Data Structures', count: 4 },
    { name: 'Algorithms', count: 3 },
    { name: 'OS', count: 3 },
    { name: 'DBMS', count: 2 }
  ]
};

// second test: section ATT where no manual exists
const payload2 = {
  branch: 'CSE',
  semester: 7,
  section: 'ATT',
  subjects: payload.subjects
};

async function run() {
  try {
    // first test for section A with manual schedule
    const manualSchedule = [{
      day: 'Monday',
      periods: [
        { periodNumber: 1, subject: 'ManualSubject', faculty: 'Prof X', startTime: '09:00', endTime: '10:00' }
      ]
    }];
    await axios.post('http://localhost:5000/api/timetable/addTimetable', {
      branch: payload.branch,
      semester: payload.semester,
      section: payload.section,
      schedule: JSON.stringify(manualSchedule)
    }).then(r=>console.log('manual add response', r.data));

    const res = await axios.post('http://localhost:5000/api/timetable/generate', payload);
    console.log('generation response', res.data);

    let fetched = await axios.post('http://localhost:5000/api/timetable/getTimetable', {
      branch: payload.branch,
      semester: payload.semester,
      section: payload.section,
    });
    console.log('fetch response (A)', fetched.data);

    // now second test for section ATT where no manual exists
    const res2 = await axios.post('http://localhost:5000/api/timetable/generate', payload2);
    console.log('generation response 2', res2.data);

    fetched = await axios.post('http://localhost:5000/api/timetable/getTimetable', {
      branch: payload2.branch,
      semester: payload2.semester,
      section: payload2.section,
    });
    console.log('fetch response (ATT)', fetched.data);

  } catch (err) {
    console.error('error', err.response ? err.response.data : err.message);
  }
}

run();
