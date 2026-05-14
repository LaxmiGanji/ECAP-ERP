// Password must be at least 8 characters, include uppercase, lowercase, number, and special character
function validatePassword(password) {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return re.test(password);
}

// Phone number: Indian 10-digit starting with 6-9
function validatePhoneNumber(phone) {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
}

// Email validation
function validateEmail(email) {
  const re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return re.test(email);
}

module.exports = {
  validatePassword,
  validatePhoneNumber,
  validateEmail,
}; 