module.exports = {
  isValidGuardianName: {
    notEmpty: { msg: 'Guardian name cannot be empty' },
    len: {
      args: [3, 100],
      msg: 'Guardian name must be between 3 and 100 characters',
    },
  },

  isValidGuardianEmail: {
    isEmail: { msg: 'Please provide a valid email address' },
  },

  isValidGuardianRelationship: {
    notEmpty: { msg: 'Guardian relationship cannot be empty' },
  },

  isValidGuardianPhoneNumber: {
    notEmpty: { msg: 'Guardian contact cannot be empty' },
    isNumeric: { msg: 'Guardian contact must contain only numbers' },
  },
};
