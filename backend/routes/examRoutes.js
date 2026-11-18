const express = require('express');
const router = express.Router();
const { protect, allow } = require('../middleware/auth');
const {
  createExam,
  getMyExams,
  getExamById,
  submitExam,
  getExamSubmissions
} = require('../controllers/examController');

router.use(protect);

// Get my exams (Teacher / Student / Admin) - support both / and /my-exams
router.get('/', getMyExams);
router.get('/my-exams', getMyExams);

// Single exam details
router.get('/:id', getExamById);

// Teacher creates new objective exam
router.post('/', allow('teacher', 'admin'), createExam);

// Student submits answers -> Auto-marked
router.post('/:id/submit', allow('student'), submitExam);

// Teacher reviews student submissions
router.get('/:id/submissions', allow('teacher', 'admin'), getExamSubmissions);

module.exports = router;
