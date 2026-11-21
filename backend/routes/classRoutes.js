const express = require('express');
const router = express.Router();
const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudent,
  removeStudent,
  getMyClasses
} = require('../controllers/classController');
const { protect, allow } = require('../middleware/auth');

// ==========================================
// CLASS ROUTES
// ==========================================

// List all classes (any logged-in user)
router.get(
  '/',
  protect,
  allow('admin', 'teacher', 'registrar'),
  getAllClasses
);

// Get classes taught by me (teacher only)
router.get(
  '/teacher/mine',
  protect,
  allow('teacher'),
  getMyClasses
);

// Alias for convenience
router.get(
  '/my-classes',
  protect,
  allow('teacher'),
  getMyClasses
);

// Get single class
router.get(
  '/:id',
  protect,
  allow('admin', 'teacher', 'registrar'),
  getClassById
);

// Create class (admin only)
router.post(
  '/',
  protect,
  allow('admin'),
  createClass
);

// Update class (admin only)
router.put(
  '/:id',
  protect,
  allow('admin'),
  updateClass
);

// Delete class (admin only)
router.delete(
  '/:id',
  protect,
  allow('admin'),
  deleteClass
);

// Add student to class (admin/registrar/teacher)
router.post(
  '/:id/students',
  protect,
  allow('admin', 'registrar', 'teacher'),
  addStudent
);

// Remove student from class (admin/registrar/teacher)
router.delete(
  '/:id/students/:studentId',
  protect,
  allow('admin', 'registrar', 'teacher'),
  removeStudent
);

module.exports = router;