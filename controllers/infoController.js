// Database Model
const { Info } = require('../models');

// Factory Handler
const factory = require('./handlerFactory');

// Get one Info
exports.getInfo = factory.getOne(Info, 'info_id');

// Get all Infos
exports.getAllInfos = factory.getAll(Info);

// Update Info
exports.updateInfo = factory.updateOne(Info, 'info_id');

// Delete Info
exports.deleteInfo = factory.deleteOne(Info, 'info_id');
