const { Status } = require('../models');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllStatus = catchAsync(async (req, res, next) => {
    const response = await Status.findAll();

    if (!response) {
        return next(new AppError('Fail to load status', 404));
    }

    return res.status(200).json({
        status: 'success',
        data: response,
    });
});