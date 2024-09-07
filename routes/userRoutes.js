// Authentication and User Controller
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// Protect all route after this middleware
router.use(authController.protect);

// Restrict all routes to admin
router.use(authController.restrictTo('admin'));

// User management routes
router
  .route('/')
  .get(userController.getAllUsers)
  .post(studentController.addStudent);

router
  .route('/:id')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
