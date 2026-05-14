const axios = require('axios');

const registerUsers = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Register HOD
    console.log('Registering HOD...');
    const hodResponse = await axios.post(`${baseURL}/hod/auth/register`, {
      loginid: 'hod_cs',
      password: 'password123',
      branch: 'Computer Science'
    });
    console.log('HOD Response:', hodResponse.data);

    // Register Accounts
    console.log('Registering Accounts...');
    const accountsResponse = await axios.post(`${baseURL}/accounts/auth/register`, {
      loginid: 'accounts_01',
      password: 'password123'
    });
    console.log('Accounts Response:', accountsResponse.data);

  } catch (error) {
    console.error('Error during registration:', error.response ? error.response.data : error.message);
  }
};

registerUsers();
