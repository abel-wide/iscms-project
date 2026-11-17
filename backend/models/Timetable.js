const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  startTime: {
    type: String,
    required: true,
    default: '08:30'
  },
  endTime: {
    type: String,
    required: true,
    default: '09:15'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  roomNumber: {
    type: String,
    default: ''
  }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  slots: [timetableSlotSchema]
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Classroom is required'],
    unique: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  schedule: [dayScheduleSchema]
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
