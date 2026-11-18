const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswerIndex: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: 0
  },
  marks: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: true });

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Classroom is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 20,
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 10
  },
  passingMarks: {
    type: Number,
    default: 5
  },
  term: {
    type: String,
    enum: ['Term 1', 'Term 2', 'Term 3', 'Midterm', 'Final'],
    default: 'Midterm'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'published'
  },
  deadline: {
    type: Date,
    default: null
  },
  questions: [questionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
