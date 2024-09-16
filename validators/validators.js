const validator = require('validator');

module.exports = {
  // Function to validate that an end time is after a start time
  isAfterStartTime: (startTimeField, endTimeField) => {
    return function (value) {
      const startTime = this[startTimeField];
      if (startTime && value <= startTime) {
        throw new Error(`${endTimeField} must be after ${startTimeField}`);
      }
    };
  },

  // Validator for date fields (Used in Period)
  isValidDate: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('Date is required');
    }
    if (!validator.isDate(value)) {
      throw new Error('Date must be a valid date');
    }
    if (!validator.isAfter(value, new Date().toISOString().split('T')[0])) {
      throw new Error('Date must be today or in the future');
    }
    return true;
  },

  // Validator for subject
  isValidSubject: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('Subject name is required');
    }
    if (!validator.isLength(value, { min: 3, max: 50 })) {
      throw new Error('Subject name must be between 3 and 50 characters');
    }
    return true;
  },

  // Validator for school name
  isValidSchoolName: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('School name is required');
    }
    if (!validator.isLength(value, { min: 3, max: 100 })) {
      throw new Error('School name must be between 3 and 100 characters');
    }
    return true;
  },

  // Validator for class name
  isValidClassName: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('Class name is required');
    }
    if (!validator.isLength(value, { min: 3, max: 50 })) {
      throw new Error('Class name must be between 3 and 50 characters');
    }
    return true;
  },

  // Validator for description
  isValidDescription: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('Description cannot be empty');
    }
    if (!validator.isLength(value, { max: 255 })) {
      throw new Error('Description cannot exceed 255 characters');
    }
    return true;
  },

  // Validator for period name
  isValidPeriodName: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('Period name is required');
    }
    if (!validator.isLength(value, { min: 3, max: 50 })) {
      throw new Error('Period name must be between 3 and 50 characters');
    }
    return true;
  },

  // Validator for guardian relationship
  isValidGuardianRelationship: (value) => {
    if (validator.isEmpty(value)) {
      throw new Error('Guardian relationship cannot be empty');
    }
    return true;
  },
};
