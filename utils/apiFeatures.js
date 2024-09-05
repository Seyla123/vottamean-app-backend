// Import Sequelize Module
const { Sequelize } = require('sequelize');

// Create a new instance of Sequelize
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.options = {}; // Collect options for findAll here
  }

  // Filter Object Function
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let filters = {};
    Object.keys(queryObj).forEach((key) => {
      if (/\b(gte|gt|lte|lt)\b/.test(key)) {
        const [field, operator] = key.split('_');
        filters[field] = { [Sequelize.Op[operator]]: queryObj[key] };
      } else {
        filters[key] = queryObj[key];
      }
    });

    console.log('Filters:', filters); // Debug log
    this.options.where = filters;

    return this;
  }

  // Sort Object Function
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort
        .split(',')
        .map((el) => el.split(':'));
      this.options.order = sortBy;
    } else {
      this.options.order = [['createdAt', 'DESC']];
    }

    console.log('Sort Order:', this.options.order); // Debug log
    return this;
  }

 
  // Execute the query
  async exec() {
    try {
      const result = await this.query.findAll(this.options);
      console.log('Result:', result); // Debug log
      return result;
    } catch (err) {
      console.error('Error executing query:', err); // Debug log for errors
      throw err;
    }
  }
}

module.exports = APIFeatures;
