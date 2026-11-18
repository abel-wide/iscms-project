const express = require('express');
const router = express.Router();
const { protect, allow } = require('../middleware/auth');
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  getApplications,
} = require('../controllers/jobController');

// Public routes (no auth)
router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/:id/apply', applyToJob);

// Protected routes (admin & head only)
router.post('/', protect, allow('admin', 'head'), createJob);
router.put('/:id', protect, allow('admin', 'head'), updateJob);
router.delete('/:id', protect, allow('admin', 'head'), deleteJob);
router.get('/:id/applications', protect, allow('admin', 'head'), getApplications);

module.exports = router;
