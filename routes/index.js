const express = require('express');
const router = express.Router();

// User Routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const teacherRoutes = require('./teacherRoutes');
const studentRoutes = require('./studentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const periodRoutes = require('./periodRoutes');
const dayRoutes = require('./dayRoutes');
const sessionRoutes = require('./sessionRoutes');
// School Routes
const schoolAdminRoutes = require('./schoolAdminRoutes');

// Features Routes
const subjectRoutes = require('./subjectRoutes');
// Features Route
const classRoutes = require('./classRoutes');

// Information Route
const infoRoutes = require('./infoRoutes');

// User Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admins', adminRoutes);
router.use('/teachers', teacherRoutes);
router.use('/students', studentRoutes);
router.use("/periods", periodRoutes); 
router.use('/subjects', subjectRoutes);
router.use('/days', dayRoutes);
router.use('/sessions', sessionRoutes);
// School Routes
router.use('/school-admin', schoolAdminRoutes);

// Features Routes
router.use('/subjects', subjectRoutes);
router.use('/classes', classRoutes);

// Information Route
router.use('/info', infoRoutes);

// Attendance Routes
router.use('/attendance', attendanceRoutes);

module.exports = router;
