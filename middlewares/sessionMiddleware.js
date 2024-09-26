const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Session, Class, Period, Teacher, Subject } = require('../models');
const { isBelongsToAdmin } = require('../utils/helper');
// Function to check if session already exists
exports.checkExistingSession = catchAsync(async (req, res, next) => {
    const existingSession = await Session.findOne({
        where: {
            class_id: req.body.class_id,
            teacher_id: req.body.teacher_id,
            day_id: req.body.day_id,
            period_id: req.body.period_id,
            subject_id: req.body.subject_id,
            school_admin_id: req.school_admin_id,
            active: true,
        },
    });
    if (existingSession) {
        return next(new AppError('Session already exists', 400));
    }
    next();
});

// Function to validate admin ownership
exports.validateAdminOwnership = catchAsync(async (req, res, next) => {
    await Promise.all([
        isBelongsToAdmin(req.body.class_id, 'class_id', req.school_admin_id, Class),
        isBelongsToAdmin(req.body.period_id, 'period_id', req.school_admin_id, Period),
        isBelongsToAdmin(req.body.teacher_id, 'teacher_id', req.school_admin_id, Teacher),
        isBelongsToAdmin(req.body.subject_id, 'subject_id', req.school_admin_id, Subject),
    ]);
    next();
});