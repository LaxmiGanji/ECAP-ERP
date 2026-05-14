const axios = require('axios');

const testStats = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/accounts/attendance/stats/CSEEMP02');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
};

testStats();
