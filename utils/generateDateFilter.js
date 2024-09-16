
//Function to generate the date filter for a filter
const generateDateFilter = (dateRange) => {
  const startDate = new Date();
  const endDate = new Date();

  switch (dateRange) {
    case 'today':
      startDate.setHours(0, 0, 0, 0); // Start of today
      endDate.setHours(23, 59, 59, 999); // End of today
      break;
    case 'lastWeek':
      startDate.setDate(startDate.getDate() - 7); // Start of last week
      startDate.setHours(0, 0, 0, 0); 
      break;
    case 'lastMonth':
      startDate.setMonth(startDate.getMonth() - 1); // Go to last month
      startDate.setDate(1); // First day of last month
      startDate.setHours(0, 0, 0, 0); 

      endDate.setMonth(endDate.getMonth() + 1); // Go to the next month
      endDate.setDate(0); // Last day of last month
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'lastYear':
      startDate.setFullYear(startDate.getFullYear() - 1); // Start of last year
      startDate.setMonth(0, 1); // January 1st of last year
      startDate.setHours(0, 0, 0, 0);

      endDate.setFullYear(endDate.getFullYear() - 1); // End of last year
      endDate.setMonth(11, 31); // December 31st of last year
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error(`Invalid dateRange: ${dateRange}`);
  }

  return { [Op.between]: [startDate, endDate] };
};

