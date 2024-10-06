// Helper functions for date manipulation in the payment process
exports.addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

exports.addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};
