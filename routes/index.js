const express = require('express');
const router = express.Router();

// User Routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const teacherRoutes = require('./teacherRoutes');
const studentRoutes = require('./studentRoutes');

// Payment Routes
const paymentRoutes = require('./paymentRoutes');

// School Routes
const schoolAdminRoutes = require('./schoolAdminRoutes');

// Features Route
const classRoutes = require('./classRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const periodRoutes = require('./periodRoutes');
const dayRoutes = require('./dayRoutes');
const sessionRoutes = require('./sessionRoutes');
const subjectRoutes = require('./subjectRoutes');
const statusRoutes = require('./statusRoutes');

// Information Route
const infoRoutes = require('./infoRoutes');

// User Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admins', adminRoutes);
router.use('/teachers', teacherRoutes);
router.use('/students', studentRoutes);

// Payment Routes
router.use('/payment', paymentRoutes);

// School Routes
router.use('/school-admin', schoolAdminRoutes);

// Features Routes
router.use('/subjects', subjectRoutes);
router.use('/classes', classRoutes);
router.use('/periods', periodRoutes);
router.use('/subjects', subjectRoutes);
router.use('/days', dayRoutes);
router.use('/status', statusRoutes);
router.use('/sessions', sessionRoutes);
router.use('/attendance', attendanceRoutes);

// Information Route
router.use('/info', infoRoutes);

module.exports = router;
