// For handling file uploads
const multer = require('multer');
// For image resizing
const sharp = require('sharp');

// Import error controller
const catchAsync = require('../utils/catchAsync');

// Setup multer for file uploads
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Upload user photo using multer
exports.uploadUserPhoto = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
}).single('photo');

// Resize uploaded photo
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500) // Resize image to 500x500 pixels
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
