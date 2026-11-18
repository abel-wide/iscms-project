const JobPosting = require('../models/JobPosting');

// GET all open jobs (public — no auth needed)
exports.getJobs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const jobs = await JobPosting.find(filter)
      .populate('postedBy', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET single job by ID (public)
exports.getJobById = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id)
      .populate('postedBy', 'fullName email');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST create a new job (admin/head only)
exports.createJob = async (req, res) => {
  try {
    const { title, department, description, requirements, type, location, salary, deadline } = req.body;
    const job = await JobPosting.create({
      title, department, description, requirements,
      type, location, salary, deadline,
      postedBy: req.user._id
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT update job (admin/head only)
exports.updateJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE job (admin/head only)
exports.deleteJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST apply to a job (public — no auth required)
exports.applyToJob = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status === 'closed') return res.status(400).json({ message: 'This job is no longer accepting applications.' });
    if (new Date(job.deadline) < new Date()) {
      job.status = 'closed';
      await job.save();
      return res.status(400).json({ message: 'Application deadline has passed.' });
    }

    const { name, email, phone, coverLetter } = req.body;
    // Check duplicate application
    const alreadyApplied = job.applications.some(a => a.email === email);
    if (alreadyApplied) return res.status(400).json({ message: 'You have already applied for this position.' });

    job.applications.push({ name, email, phone, coverLetter });
    await job.save();
    res.status(201).json({ message: 'Application submitted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET applications for a job (admin/head only)
exports.getApplications = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id).select('title applications');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ title: job.title, applications: job.applications });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
