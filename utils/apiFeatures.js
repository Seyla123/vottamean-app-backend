const { Sequelize } = require('sequelize');
const AppError = require('../utils/appError');
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.options = {};
  }

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

    this.options.where = filters;
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').map((el) => el.split(':'));
      this.options.order = sortBy;
    } else {
      this.options.order = [['createdAt', 'DESC']];
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',');
      this.options.attributes = fields;
    } else {
      this.options.attributes = { exclude: ['__v'] };
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const offset = (page - 1) * limit;

    this.options.limit = limit;
    this.options.offset = offset;
    return this;
  }

  includeAssociations(associations) {
    this.options.include = associations;
    return this;
  }

  async exec() {
    try {
      const result = await this.query.findAll(this.options);
      console.log('result :', result);
      
      return result;
    } catch (err) {
      console.log('error :', err);
      throw new Error(`Error executing query: ${err.message}`);
    }
  }
}

module.exports = APIFeatures;
