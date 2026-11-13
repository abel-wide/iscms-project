const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Notification = require('../models/Notification'); // 👈 ተጨምሯል

// ==========================================
// 1. MARK ATTENDANCE (Teacher only)
// POST /api/attendance/mark
// ==========================================
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, classroomId, date, status, note } = req.body;

    if (!studentId || !classroomId) {
      return res.status(400).json({ 
        message: 'studentId and classroomId are required' 
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        message: 'Student not found' 
      });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      student: studentId,
      date: attendanceDate
    });

    if (existing) {
      return res.status(400).json({ 
        message: 'Attendance already recorded for this student today' 
      });
    }

    const attendance = await Attendance.create({
      student: studentId,
      classroom: classroomId,
      teacher: req.user._id,
      date: attendanceDate,
      status: status || 'present',
      note: note || '',
      markedBy: req.user._id
    });

    // 👇 ማሳወቂያ ፍጠር (ወላጅ ካለ)
    if (student.parent && status === 'absent') {
      await Notification.create({
        recipient: student.parent,
        title: 'Absence Alert',
        message: `${student.fullName} was marked absent on ${attendanceDate.toLocaleDateString()}.`,
        type: 'absence',
        priority: 'high'
      });
    }

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error marking attendance',
      error: error.message 
    });
  }
};

// ==========================================
// 2. MARK BULK ATTENDANCE (Teacher only)
// POST /api/attendance/mark-bulk
// ==========================================
exports.markBulkAttendance = async (req, res) => {
  try {
    const { classroomId, date, records } = req.body;

    if (!classroomId || !records || !Array.isArray(records)) {
      return res.status(400).json({ 
        message: 'classroomId and records array required' 
      });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const created = [];
    const failed = [];

    for (const record of records) {
      try {
        const attendance = await Attendance.create({
          student: record.studentId,
          classroom: classroomId,
          teacher: req.user._id,
          date: attendanceDate,
          status: record.status || 'present',
          note: record.note || '',
          markedBy: req.user._id
        });
        created.push(attendance);

        // 👇 ማሳወቂያ ፍጠር (ወላጅ ካለ እና አልተገኘም ከሆነ)
        if (record.status === 'absent') {
          const student = await User.findById(record.studentId);
          if (student && student.parent) {
            await Notification.create({
              recipient: student.parent,
              title: 'Absence Alert',
              message: `${student.fullName} was marked absent on ${attendanceDate.toLocaleDateString()}.`,
              type: 'absence',
              priority: 'high'
            });
          }
        }
      } catch (err) {
        failed.push({ 
          studentId: record.studentId, 
          reason: err.message 
        });
      }
    }

    res.status(201).json({
      message: `${created.length} attendance records created, ${failed.length} failed`,
      created,
      failed
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error marking bulk attendance',
      error: error.message 
    });
  }
};

// ==========================================
// 3. GET ATTENDANCE BY STUDENT (Parent/Student/Teacher)
// GET /api/attendance/student/:studentId
// ==========================================
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { student: studentId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (req.user.role === 'parent') {
      const child = await User.findById(studentId);
      if (!child || child.parent?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'You can only view your own child\'s attendance' 
        });
      }
    }

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ 
        message: 'You can only view your own attendance' 
      });
    }

    const attendance = await Attendance.find(filter)
      .populate('student', 'fullName email')
      .populate('classroom', 'className')
      .populate('teacher', 'fullName')
      .sort({ date: -1 });

    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };

    const attendanceRate = summary.total > 0 
      ? ((summary.present + summary.late) / summary.total * 100).toFixed(2) 
      : 0;

    res.json({
      message: 'Attendance fetched successfully',
      summary: {
        ...summary,
        attendanceRate: `${attendanceRate}%`
      },
      records: attendance
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching attendance',
      error: error.message 
    });
  }
};

// ==========================================
// 4. GET ATTENDANCE BY CLASS (Teacher/Admin)
// GET /api/attendance/class/:classroomId
// ==========================================
exports.getClassAttendance = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { date } = req.query;

    const filter = { classroom: classroomId };

    if (date) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      filter.date = attendanceDate;
    }

    const attendance = await Attendance.find(filter)
      .populate('student', 'fullName email')
      .populate('teacher', 'fullName')
      .sort({ date: -1, 'student.fullName': 1 });

    res.json({
      message: 'Class attendance fetched',
      count: attendance.length,
      records: attendance
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching class attendance',
      error: error.message 
    });
  }
};

// ==========================================
// 5. GET DAILY REPORT (Teacher/Admin)
// GET /api/attendance/report/daily?date=2026-10-08
// ==========================================
exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendance = await Attendance.find({
      date: { $gte: attendanceDate, $lt: nextDay }
    })
      .populate('student', 'fullName email')
      .populate('classroom', 'className')
      .sort({ 'student.fullName': 1 });

    const summary = {
      date: attendanceDate,
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };

    res.json({
      message: 'Daily report generated',
      summary,
      records: attendance
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error generating report',
      error: error.message 
    });
  }
};

// ==========================================
// 6. UPDATE ATTENDANCE (Teacher/Admin)
// PUT /api/attendance/:id
// ==========================================
exports.updateAttendance = async (req, res) => {
  try {
    const { status, note } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ 
        message: 'Attendance record not found' 
      });
    }

    if (status) attendance.status = status;
    if (note !== undefined) attendance.note = note;

    await attendance.save();

    res.json({
      message: 'Attendance updated',
      attendance
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating attendance',
      error: error.message 
    });
  }
};

// ==========================================
// 7. DELETE ATTENDANCE (Admin only)
// DELETE /api/attendance/:id
// ==========================================
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ 
        message: 'Attendance record not found' 
      });
    }

    await attendance.deleteOne();

    res.json({ 
      message: 'Attendance deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting attendance',
      error: error.message 
    });
  }
};