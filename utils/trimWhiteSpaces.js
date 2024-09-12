// Function to trim white spaces from specified fields
exports.trimWhiteSpaces = (fields) => {
  return (instance) => {
    fields.forEach((field) => {
      if (instance[field]) {
        instance[field] = instance[field].trim();
      }
    });
  };
};
