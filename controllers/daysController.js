const Day = require('../models/dayModel');

const factory = require('./handlerFactory');

exports.getAllDays = factory.getAll(Day);