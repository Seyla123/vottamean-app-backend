const { Attendance, Student, Info, Class, SchoolAdmin, School, Admin, User, Status, Session, DayOfWeek, Period, Subject } = require('../models');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllAttendances = catchAsync(async (req, res, next) => {
  const { student_id } = req.query;

  // Define associations
  const associations = [
    {
      model: Student,
      as: 'Student',
      attributes: ['student_id'],
      where: student_id ? { student_id: student_id } : {}, 
      include: [
        {
          model: Info,
          as: 'Info',
          attributes: ['first_name', 'last_name', 'gender', 'phone_number', 'address', 'dob', 'photo'],
        },
        {
          model: Class,
          as: 'Class',
          attributes: ['class_name'],
        },
        {
          model: SchoolAdmin,
          as: 'SchoolAdmin',
          include: [
            {
              model: School,
              as: 'School',
              attributes: ['school_name'],
            },
            {
              model: Admin,
              as: 'Admin',
              include: [
                {
                  model: User,
                  as: 'User',
                  attributes: ['user_id', 'email'],
                },
                {
                  model: Info,
                  as: 'Info',
                  attributes: ['first_name', 'last_name'],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      model: Status,
      as: 'Status',
      attributes: ['status'],
    },
    {
      model: Session,
      as: 'Sessions',
      include: [
        {
          model: DayOfWeek,
          as: 'DayOfWeek',
          attributes: ['day'],
        },
        {
          model: Period,
          as: 'Period',
          attributes: ['start_time', 'end_time'],
        },
        {
          model: Subject,
          as: 'Subject',
          attributes: ['name'],
        },
      ],
    },
  ];

  // Use APIFeatures and pass the associations
  const features = new APIFeatures(Attendance, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .includeAssociations(associations);

  try {
    // Execute the query and get the result
    const allAttendances = await features.exec();
    console.log('result all attendance : ', allAttendances.length);
    
    // Check if any data is found
    if ( allAttendances.length == 0) {
      console.log('No attendance found');
      // Send the response with data
    res.status(404).json({
      status: 'erorr',
      results: allAttendances.length,
      data: allAttendances,
    });
      // return next(new AppError('No attendance found', 404));
    }
    // Send the response with data
    res.status(200).json({
      status: 'success',
      results: allAttendances.length,
      data: allAttendances,
    });
  } catch (error) {
    return next(new AppError(`Invalid Query: ${error.message}`, 400));
  }
});
