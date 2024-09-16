// routes/index.js
const express = require('express');
const router = express.Router();

// User Routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const teacherRoutes = require('./teacherRoutes');
const studentRoutes = require('./studentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
// School Routes
const schoolAdminRoutes = require('./schoolAdminRoutes');

// Features Routes
const subjectRoutes = require('./subjectRoutes');

// Information Route
const infoRoutes = require('./infoRoutes');

// User Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admins', adminRoutes);
router.use('/teachers', teacherRoutes);
router.use('/students', studentRoutes);

// School Routes
router.use('/school-admin', schoolAdminRoutes);

// Features Routes
router.use('/subjects', subjectRoutes);

// Information Route
router.use('/info', infoRoutes);

// Attendance Routes
router.use('/attendance', attendanceRoutes);
module.exports = router;
