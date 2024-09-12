module.exports = {
  isValidName: {
    notNull: { msg: 'Name is required' },
    notEmpty: { msg: 'Name cannot be empty' },
    len: {
      args: [2, 50],
      msg: 'Name must be between 2 and 50 characters',
    },
    is: {
      args: /^[A-Za-z\s]+$/,
      msg: 'Name can only contain letters and spaces',
    },
  },

  isValidGender: {
    isIn: {
      args: [['male', 'female', 'other']],
      msg: 'Gender must be either male or female',
    },
  },

  isValidPhoneNumber: {
    is: {
      args: /^[0-9]{10,15}$/,
      msg: 'Phone number must be between 10 and 15 digits',
    },
  },

  isValidAddress: {
    notNull: { msg: 'Address is required' },
    notEmpty: { msg: 'Address cannot be empty' },
  },

  isValidDOB: {
    notNull: { msg: 'Date of birth is required' },
    isDate: { msg: 'Please provide a valid date of birth' },
    isValidDOB(value) {
      const date = new Date(value);
      // Check if the date is valid and includes day, month, and year
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      const day = date.getUTCDate();
      const month = date.getUTCMonth() + 1;
      const year = date.getUTCFullYear();

      if (!day || !month || !year) {
        throw new Error('Date of birth must include day, month, and year');
      }
    },
  },

  // Validator for email field
  isValidEmail: {
    notNull: { msg: 'An email is required' },
    notEmpty: { msg: 'Email cannot be empty' },
    isEmail: { msg: 'Please provide a valid email address' },
  },

  // Validator for password field
  isValidPassword: {
    notNull: { msg: 'A password is required' },
    notEmpty: { msg: 'Password cannot be empty' },
    len: {
      args: [8],
      msg: 'Password must be at least 8 characters long',
    },
  },

  // Validator for password confirmation
  isPasswordConfirm: {
    notEmpty: { msg: 'Password confirmation cannot be empty' },
    isMatch(value, password) {
      if (value !== password) {
        throw new Error('Passwords do not match');
      }
    },
  },

  // Validator for role field
  isValidRole: {
    isIn: {
      args: [['admin', 'teacher']],
      msg: 'Invalid role',
    },
  },

  // Validator for date fields
  isValidDate: {
    isDate: { msg: 'Must be a valid date' },
  },
};
