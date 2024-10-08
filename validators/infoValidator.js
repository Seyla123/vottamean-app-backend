const validator = require('validator');

module.exports = {
  // Validator for name field
  isValidName: (value) => {
    // Check if the name is empty
    if (validator.isEmpty(value)) {
      throw new Error('Name is required');
    }

    // Check if the length is between 2 and 50 characters
    if (!validator.isLength(value, { min: 2, max: 50 })) {
      throw new Error('Name must be between 2 and 50 characters');
    }

    // Check if the name contains only letters and spaces using regex
    if (!/^[A-Za-z\s]+$/.test(value)) {
      throw new Error(
        'Name can only contain letters and spaces, no numbers or symbols'
      );
    }

    return true;
  },

  // Validator for gender field
  isValidGender: (value) => {
    const allowedGenders = ['Male', 'Female', 'Other'];
    if (!allowedGenders.includes(value)) {
      throw new Error('Gender must be either male, female, or other');
    }
    return true;
  },

  // Validator for phone number
  isValidPhoneNumber: (value) => {
    // Remove non-numeric characters (except for +)
    const cleanedValue = value.replace(/[^\d+]/g, '');

    // Check length and format
    if (
      !validator.isLength(cleanedValue, { min: 10, max: 15 }) ||
      !/^\+?\d{9,15}$/.test(cleanedValue) // Allow optional '+' at the start and validate digits
    ) {
      throw new Error(
        'Phone number must be between 10 and 15 digits and can include a country code.'
      );
    }

    return true;
  },

  isValidAddress: (value) => {
    if (!validator.isLength(value, { max: 225 })) {
      throw new Error('Address cannot be longer than 225 characters');
    }
    return true;
  },

  // Validator for Date of Birth (DOB) field
  isValidDOB: (value) => {
    // Check if the value is empty
    if (validator.isEmpty(value)) {
      throw new Error('Date of birth is required');
    }

    // Check if the format is YYYY-MM-DD using regex
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error('Date of birth must be in the format YYYY-MM-DD');
    }

    // Check if the value is a valid date
    if (!validator.isDate(value, { format: 'YYYY-MM-DD', strictMode: true })) {
      throw new Error(
        'Please provide a valid date of birth in the format YYYY-MM-DD'
      );
    }

    // Optional: Further check that the date is not in the future
    if (validator.isAfter(value, new Date().toISOString().split('T')[0])) {
      throw new Error('Date of birth cannot be in the future');
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

    if (!/[a-zA-Z]/.test(value)) {
      throw new Error('Password must contain at least one letter');
    }

    if (!/[0-9]/.test(value)) {
      throw new Error('Password must contain at least one number');
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

  // Validator for photo field
  isValidPhoto: (value) => {
    const defaultPhoto = 'default.jpg';
    if (value !== defaultPhoto && !validator.isURL(value)) {
      throw new Error('Photo must be a valid URL or the default image');
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
