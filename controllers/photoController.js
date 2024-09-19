// AWS S3
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Multer library
const multer = require('multer');
const sharp = require('sharp');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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

  // Create a custom filename for the image
  req.file.filename = `user-${req.user.user_id}-${Date.now()}.jpeg`;

  // Resize image in memory
  const resizedImageBuffer = await sharp(req.file.buffer)
    .resize(500, 500) // Resize image to 500x500 pixels
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();

  // Upload to AWS S3 using the v3 SDK
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME, // S3 bucket name
    Key: `users/${req.file.filename}`, // S3 object key (file path in the bucket)
    Body: resizedImageBuffer, // File content
    ContentType: 'image/jpeg', // MIME type
    ACL: 'public-read', // File access permissions
  };

  const command = new PutObjectCommand(uploadParams);
  const data = await s3.send(command);

  // Attach the uploaded file URL to the request object (to save to the database later)
  req.file.location = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;

  next();
});
