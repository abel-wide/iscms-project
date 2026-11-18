const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  location: { type: String, default: 'Wachemo University, Hossana' },
  salary: { type: String, default: 'Negotiable' },
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [{
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    coverLetter: { type: String },
    appliedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('JobPosting', jobPostingSchema);
