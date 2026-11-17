const express = require('express');
const router = express.Router();
const { protect, allow } = require('../middleware/auth');
const {
  generateTimetable,
  getClassTimetable,
  getMyTimetable,
  downloadTimetablePDF
} = require('../controllers/timetableController');

router.use(protect);

// Get personal schedule (Student/Parent/Teacher/Admin)
router.get('/my-timetable', getMyTimetable);

// Get specific class timetable
router.get('/class/:classroomId', getClassTimetable);

// Download timetable PDF
router.get('/class/:classroomId/pdf', downloadTimetablePDF);

// Auto-generate timetable (Admin, Registrar, Teacher)
router.post('/generate/:classroomId', allow('admin', 'registrar', 'teacher'), generateTimetable);

module.exports = router;
