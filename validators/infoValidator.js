const validator = require('validator');

module.exports = {
  // Validator for name field
  isValidName: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('Name is required');
    }
    if (!validator.isLength(value, { min: 2, max: 50 })) {
      throw new Error('Name must be between 2 and 50 characters');
    }
    if (!/^[A-Za-z\s]+$/.test(value)) {
      throw new Error('Name can only contain letters and spaces');
    }
    return true;
  },

  // Validator for gender field
  isValidGender: (value) => {
    const allowedGenders = ['male', 'female', 'other'];
    if (!allowedGenders.includes(value)) {
      throw new Error('Gender must be either male, female, or other');
    }
    return true;
  },

  // Validator for phone number
  isValidPhoneNumber: (value) => {
    if (
      !validator.isLength(value, { min: 10, max: 15 }) ||
      !/^[0-9]{10,15}$/.test(value)
    ) {
      throw new Error('Phone number must be between 10 and 15 digits');
    }
    return true;
  },

  // Validator for address field
  isValidAddress: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('Address is required');
    }
    return true;
  },

  // Validator for Date of Birth (DOB) field
  isValidDOB: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('Date of birth is required');
    }
    if (!validator.isDate(value)) {
      throw new Error('Please provide a valid date of birth');
    }
    const date = new Date(value);
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();

    if (!day || !month || !year) {
      throw new Error('Date of birth must include day, month, and year');
    }
    return true;
  },

  // Validator for email field
  isValidEmail: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('An email is required');
    }
    if (!validator.isEmail(value)) {
      throw new Error('Please provide a valid email address');
    }
    return true;
  },

  // Validator for password field
  isValidPassword: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('A password is required');
    }
    if (!validator.isLength(value, { min: 8 })) {
      throw new Error('Password must be at least 8 characters long');
    }
    return true;
  },

  // Validator for password confirmation
  isPasswordConfirm: (value, password) => {
    if (validator.isEmpty(value)) {
      throw new Error('Password confirmation cannot be empty');
    }
    if (value !== password) {
      throw new Error('Passwords do not match');
    }
    return true;
  },

  // Validator for role field
  isValidRole: (value) => {
    const allowedRoles = ['admin', 'teacher'];
    if (!allowedRoles.includes(value)) {
      throw new Error('Invalid role');
    }
    return true;
  },

  // Generic date validation
  isValidDate: (value) => {
    if (!validator.isDate(value)) {
      throw new Error('Must be a valid date');
    }
    return true;
  },
};
