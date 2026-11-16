const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit'); // 👈 ተጨምሯል

const {
  register,
  login,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMe,
  linkParent,
  getMyChildren,
  changePassword,
  forgotPassword,
  resetPassword 
} = require('../controllers/authController');

const { protect, allow } = require('../middleware/auth');

// ==========================================
// 👇 የሎጊን ሙከራን መገደብ (Rate Limiter)
// ==========================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 ደቂቃ ጊዜ ገደብ
  max: 5, // 5 ሙከራ ብቻ ፈቀድ
  message: {
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 👇 በአይፒ አድራሻ መሰረት መገደብ
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  // 👇 ከተገደበ በኋላ ምን ማድረግ እንዳለበት
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many attempts! Please try again after 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Register a new user
router.post('/register', register);

// Login (ከ Rate Limiter ጋር)
router.post('/login', loginLimiter, login);

// Forgot & Reset Password (Public routes)
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// ==========================================
// PROTECTED ROUTES (require login)
// ==========================================

// Get current user profile
router.get('/me', protect, getMe);

// Change own password (any logged-in user)
router.put('/change-password', protect, changePassword);

// Parent: get own children
router.get('/my-children', protect, allow('parent'), getMyChildren);

// ==========================================
// ADMIN-ONLY ROUTES
// ==========================================

// Get all users
router.get('/users', protect, allow('admin', 'registrar'), getAllUsers);

// Get one user
router.get('/users/:id', protect, allow('admin', 'registrar'), getUserById);

// Update user
router.put('/users/:id', protect, allow('admin'), updateUser);

// Delete user
router.delete('/users/:id', protect, allow('admin'), deleteUser);

// Link parent to student (admin/registrar)
router.put(
  '/students/:studentId/parent',
  protect,
  allow('admin', 'registrar'),
  linkParent
);

module.exports = router;