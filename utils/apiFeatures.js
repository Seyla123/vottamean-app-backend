const { Sequelize, Op } = require('sequelize');
const AppError = require('../utils/appError');
const dayjs = require('dayjs');
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.options = {};
  }
  static getDateFilters(dateRange) {
    const now = dayjs();

    switch (dateRange) {
      case 'today':
        return {
          [Op.gte]: now.startOf('day').toDate(),
          [Op.lt]: now.endOf('day').toDate(),
        };
      case 'thisWeek':
        return {
          [Op.gte]: now.startOf('week').toDate(),
          [Op.lt]: now.endOf('week').toDate(),
        };
      case 'thisMonth':
        return {
          [Op.gte]: now.startOf('month').toDate(),
          [Op.lt]: now.endOf('month').toDate(),
        };
      case 'thisYear':
        return {
          [Op.gte]: now.startOf('year').toDate(),
          [Op.lt]: now.endOf('year').toDate(),
        };
      case 'lastWeek':
        return {
          [Op.gte]: now.subtract(7, 'day').startOf('week').toDate(),
          [Op.lt]: now.subtract(7, 'day').endOf('week').toDate(),
        };
      case 'lastMonth':
        return {
          [Op.gte]: now.subtract(1, 'month').startOf('month').toDate(),
          [Op.lt]: now.subtract(1, 'month').endOf('month').toDate(),
        };
      case 'lastYear':
        return {
          [Op.gte]: now.subtract(1, 'year').startOf('year').toDate(),
          [Op.lt]: now.subtract(1, 'year').endOf('year').toDate(),
        };
      case 'last7days':
        return {
          [Op.gte]: now.subtract(7, 'days').startOf('day').toDate(), // 7 days ago
          [Op.lt]: now.endOf('day').toDate(),                        // up to today
        };
      case 'last30days':
        return {
          [Op.gte]: now.subtract(30, 'days').startOf('day').toDate(), // 30 days ago
          [Op.lt]: now.endOf('day').toDate(),                         // up to today
        };
      default:
        return null;
    }
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let filters = {};
    Object.keys(queryObj).forEach((key) => {
      if (/\b(gte|gt|lte|lt)_\w+\b/.test(key)) {
        const [operator, field] = key.split('_');
        if (field === 'date') {
          filters.date = { ...filters.date, [Op[operator]]: queryObj[key] };
        } else {
          filters[field] = { [Op[operator]]: queryObj[key] };
        }
      } else if (key === 'filter') {
        const dateRange = queryObj[key];
        if (APIFeatures.getDateFilters(dateRange) !== null) {
          filters.created_at = APIFeatures.getDateFilters(dateRange);
        }
      } else {
        filters[key] = queryObj[key];
      }
    });

    this.options.where = filters;
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort
        .split(',')
        .map((el) => el.split(':'));
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
  async count(additionalOptions = {}) {
    const countOptions = {
      ...this.options 
    };
    countOptions.where = { ...countOptions.where, ...additionalOptions.where };

    try {
      const totalCount = await this.query.count(countOptions);
      return totalCount;
    } catch (error) {
      console.error('Error counting records:', error);
      throw new Error(`Error counting records: ${error.message}`);
    }
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
  search(searchFields = []) {
    if (this.queryString.search) {
      const searchQuery = this.queryString.search;

      if (searchFields.length > 0) {
        this.options.where = this.options.where || {};

        this.options.where[Op.or] = searchFields.map((field) => {
          const fieldParts = field.split('.');
          if (fieldParts.length === 1) {
            return { [field]: { [Op.like]: `%${searchQuery}%` } };
          } else {
            const associationField = fieldParts.pop();
            const associationPath = fieldParts.join('.');

            // Use Sequelize.literal to handle nested fields in the where clause
            return Sequelize.literal(
              `${associationPath}.${associationField} LIKE '%${searchQuery}%'`
            );
          }
        });
      }
    }
    return this;
  }

  async exec(additionalOptions = {}, options=false) {
    let finalOptions = {
      ...this.options // external filters passed here
    };
    finalOptions.where = { ...finalOptions.where, ...additionalOptions.where };
    if(options) {
      finalOptions = { ...finalOptions, ...options };
    }
    try {
      const result = await this.query.findAll(finalOptions);
      console.log('result :', result);

      return result;
    } catch (err) {
      console.log('error :', err);
      throw new Error(`Error executing query: ${err.message}`);
    }
  }
}

module.exports = APIFeatures;
