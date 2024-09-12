module.exports = {
  // Function to validate that an end time is after a start time
  isAfterStartTime: (startTimeField, endTimeField) => {
    return function (value) {
      if (this[startTimeField] && value <= this[startTimeField]) {
        throw new Error(`${endTimeField} must be after ${startTimeField}`);
      }
    };
  },

  // Validator for date fields (Used in Period)
  isValidDate: {
    notNull: { msg: 'Date is required' },
    isDate: { msg: 'Date must be a valid date' },
    isAfter: {
      args: [new Date().toISOString().split('T')[0]],
      msg: 'Date must be today or in the future',
    },
  },

  // Validator for subject
  isValidSubject: {
    notNull: { msg: 'Subject name is required' },
    notEmpty: { msg: 'Subject name cannot be empty' },
    len: {
      args: [3, 50],
      msg: 'Subject name must be between 3 and 50 characters',
    },
  },

  // Validator for school name
  isValidSchoolName: {
    notNull: { msg: 'School name is required' },
    notEmpty: { msg: 'School name cannot be empty' },
    len: {
      args: [3, 100],
      msg: 'School name must be between 3 and 100 characters',
    },
  },

  // Validator for class name
  isValidClassName: {
    notNull: { msg: 'Class name is required' },
    notEmpty: { msg: 'Class name cannot be empty' },
    len: {
      args: [3, 50],
      msg: 'Class name must be between 3 and 50 characters',
    },
  },

  // Validator for description
  isValidDescription: {
    notEmpty: { msg: 'Description cannot be empty' },
    len: {
      args: [0, 255],
      msg: 'Description cannot exceed 255 characters',
    },
  },

  // Validator for period name
  isValidPeriodName: {
    notNull: { msg: 'Period name is required' },
    notEmpty: { msg: 'Period name cannot be empty' },
    len: {
      args: [3, 50],
      msg: 'Period name must be between 3 and 50 characters',
    },
  },

  isValidGuardianRelationship: {
    notEmpty: { msg: 'Guardian relationship cannot be empty' },
  },
};
