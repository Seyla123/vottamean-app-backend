const factory = require('./handlerFactory');
const { Status } = require('../models');

exports.getAllStatus = factory.getAll(Status, [],[],[],
    ['status_id','status'])