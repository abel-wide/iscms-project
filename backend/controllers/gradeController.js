const Mark = require('../models/Mark');
const User = require('../models/User');
const Class = require('../models/Class');
const Notification = require('../models/Notification'); // 👈 ተጨምሯል

// ==========================================
// HELPER: Letter grade from percentage
// ==========================================
function getLetterGrade(percent) {
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
}

// ==========================================
// 1. ENTER MARK (Teacher only)
// POST /api/grades/entry
// ==========================================
exports.enterMark = async (req, res) => {
  try {
    const {
      studentId,
      classroomId,
      subject,
      term,
      academicYear,
      assessmentType,
      assessmentName,
      score,
      maxScore,
      comments
    } = req.body;

    if (!studentId || !classroomId || !subject || !academicYear || score === undefined) {
      return res.status(400).json({
        message: 'studentId, classroomId, subject, academicYear, and score are required'
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const classroom = await Class.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const max = maxScore || 100;
    if (score < 0 || score > max) {
      return res.status(400).json({
        message: `Score must be between 0 and ${max}`
      });
    }

    const existing = await Mark.findOne({
      student: studentId,
      subject,
      term: term || 'Term 1',
      academicYear,
      assessmentType: assessmentType || 'Final',
      assessmentName: assessmentName || ''
    });

    if (existing) {
      return res.status(400).json({
        message: 'Mark already exists for this student, subject, term, and assessment'
      });
    }

    const mark = await Mark.create({
      student: studentId,
      classroom: classroomId,
      subject,
      term: term || 'Term 1',
      academicYear,
      assessmentType: assessmentType || 'Final',
      assessmentName: assessmentName || '',
      score,
      maxScore: max,
      teacher: req.user._id,
      comments: comments || ''
    });

    // 👇 ማሳወቂያ ፍጠር (ለተማሪ እና ለወላጅ)
    if (student) {
      // ለተማሪ
      await Notification.create({
        recipient: student._id,
        title: 'New Grade Posted',
        message: `You received a score of ${score}/${max} in ${subject}.`,
        type: 'grade',
        priority: 'normal'
      });

      // ለወላጅ (ካለ)
      if (student.parent) {
        await Notification.create({
          recipient: student.parent,
          title: 'Child Grade Posted',
          message: `${student.fullName} received a score of ${score}/${max} in ${subject}.`,
          type: 'grade',
          priority: 'normal'
        });
      }
    }

    res.status(201).json({
      message: 'Mark entered successfully',
      mark
    });
  } catch (error) {
    console.error('=== enterMark ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error entering mark',
      error: error.message
    });
  }
};

// ==========================================
// 2. BULK ENTER MARKS (Teacher)
// POST /api/grades/entry-bulk
// ==========================================
exports.enterBulkMarks = async (req, res) => {
  try {
    const {
      classroomId,
      subject,
      term,
      academicYear,
      assessmentType,
      maxScore,
      records
    } = req.body;

    if (!classroomId || !subject || !academicYear || !records || !Array.isArray(records)) {
      return res.status(400).json({
        message: 'classroomId, subject, academicYear, and records array required'
      });
    }

    const created = [];
    const failed = [];

    for (const r of records) {
      try {
        const mark = await Mark.create({
          student: r.studentId,
          classroom: classroomId,
          subject,
          term: term || 'Term 1',
          academicYear,
          assessmentType: assessmentType || 'Final',
          score: r.score,
          maxScore: maxScore || 100,
          teacher: req.user._id,
          comments: r.comments || ''
        });
        created.push(mark);

        // 👇 ማሳወቂያ ፍጠር (ለተማሪ እና ለወላጅ)
        const student = await User.findById(r.studentId);
        if (student) {
          // ለተማሪ
          await Notification.create({
            recipient: student._id,
            title: 'New Grade Posted',
            message: `You received a score of ${r.score}/${maxScore || 100} in ${subject}.`,
            type: 'grade',
            priority: 'normal'
          });

          // ለወላጅ (ካለ)
          if (student.parent) {
            await Notification.create({
              recipient: student.parent,
              title: 'Child Grade Posted',
              message: `${student.fullName} received a score of ${r.score}/${maxScore || 100} in ${subject}.`,
              type: 'grade',
              priority: 'normal'
            });
          }
        }
      } catch (err) {
        failed.push({
          studentId: r.studentId,
          reason: err.message
        });
      }
    }

    res.status(201).json({
      message: `${created.length} marks created, ${failed.length} failed`,
      created,
      failed
    });
  } catch (error) {
    console.error('=== enterBulkMarks ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error entering bulk marks',
      error: error.message
    });
  }
};

// ==========================================
// 3. GET STUDENT'S MARKS
// GET /api/grades/student/:studentId
// ==========================================
exports.getStudentMarks = async (req, res) => {
  console.log('=== getStudentMarks CALLED ===');
  try {
    console.log('Step 1: studentId =', req.params.studentId);
    console.log('Step 2: req.user =', req.user ? { id: req.user._id, role: req.user.role } : 'UNDEFINED');

    const { studentId } = req.params;
    const { term, academicYear, subject } = req.query;

    const filter = { student: studentId };
    if (term) filter.term = term;
    if (academicYear) filter.academicYear = academicYear;
    if (subject) filter.subject = subject;
    console.log('Step 3: filter =', filter);

    if (!req.user) {
      return res.status(401).json({ message: 'No user in request. Middleware failed.' });
    }

    // Access control: parents only see their own children
    if (req.user.role === 'parent') {
      const child = await User.findById(studentId);
      if (!child || child.parent?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You can only view your own child's marks"
        });
      }
    }

    // Access control: students only see their own marks
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        message: 'You can only view your own marks'
      });
    }

    console.log('Step 4: Querying marks...');
    const marks = await Mark.find(filter)
      .populate('student', 'fullName email')
      .populate('classroom', 'className')
      .populate('teacher', 'fullName')
      .sort({ subject: 1, assessmentType: 1, createdAt: -1 });

    console.log('Step 5: marks found =', marks ? marks.length : 'UNDEFINED');

    if (!marks || !Array.isArray(marks)) {
      console.error('marks is not an array!', typeof marks);
      return res.status(500).json({
        message: 'Internal error: marks query returned invalid data',
        type: typeof marks
      });
    }

    // Group by subject for summary
    const subjectSummary = {};
    marks.forEach(m => {
      if (!subjectSummary[m.subject]) {
        subjectSummary[m.subject] = { total: 0, count: 0, marks: [] };
      }
      const percent = m.maxScore ? (m.score / m.maxScore) * 100 : 0;
      subjectSummary[m.subject].total += percent;
      subjectSummary[m.subject].count += 1;
      subjectSummary[m.subject].marks.push(m);
    });

    const summary = Object.keys(subjectSummary).map(subj => ({
      subject: subj,
      average: Math.round((subjectSummary[subj].total / subjectSummary[subj].count) * 100) / 100,
      markCount: subjectSummary[subj].count
    }));

    console.log('Step 6: Sending response with', marks.length, 'marks');

    res.json({
      message: 'Marks fetched',
      total: marks.length,
      subjectSummary: summary,
      marks
    });
  } catch (error) {
    console.error('=== getStudentMarks ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      message: 'Error fetching marks',
      error: error.message,
      stack: error.stack
    });
  }
};

// ==========================================
// 4. GET CLASS MARKS
// GET /api/grades/class/:classroomId
// ==========================================
exports.getClassMarks = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { subject, term, academicYear } = req.query;

    const filter = { classroom: classroomId };
    if (subject) filter.subject = subject;
    if (term) filter.term = term;
    if (academicYear) filter.academicYear = academicYear;

    const marks = await Mark.find(filter)
      .populate('student', 'fullName email')
      .populate('teacher', 'fullName')
      .sort({ 'student.fullName': 1, subject: 1 });

    res.json({
      message: 'Class marks fetched',
      count: marks.length,
      marks
    });
  } catch (error) {
    console.error('=== getClassMarks ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error fetching class marks',
      error: error.message
    });
  }
};

// ==========================================
// 5. GET STUDENT REPORT (report card data)
// GET /api/grades/student/:studentId/report
// ==========================================
exports.getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term, academicYear } = req.query;

    if (!term || !academicYear) {
      return res.status(400).json({
        message: 'term and academicYear query params are required'
      });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'No user in request' });
    }

    if (req.user.role === 'parent') {
      const child = await User.findById(studentId);
      if (!child || child.parent?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You can only view your own child's report"
        });
      }
    }
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        message: 'You can only view your own report'
      });
    }

    const marks = await Mark.find({
      student: studentId,
      term,
      academicYear
    })
      .populate('teacher', 'fullName')
      .sort({ subject: 1 });

    const bySubject = {};
    marks.forEach(m => {
      if (!bySubject[m.subject]) {
        bySubject[m.subject] = [];
      }
      bySubject[m.subject].push(m);
    });

    const subjectReports = Object.keys(bySubject).map(subj => {
      const list = bySubject[subj];
      const avg = list.reduce((sum, m) => {
        const percent = m.maxScore ? (m.score / m.maxScore) * 100 : 0;
        return sum + percent;
      }, 0) / list.length;

      return {
        subject: subj,
        marks: list,
        average: Math.round(avg * 100) / 100,
        letterGrade: getLetterGrade(avg)
      };
    });

    const overallAvg = subjectReports.length
      ? subjectReports.reduce((sum, s) => sum + s.average, 0) / subjectReports.length
      : 0;

    res.json({
      message: 'Report generated',
      studentId,
      term,
      academicYear,
      subjectCount: subjectReports.length,
      overallAverage: Math.round(overallAvg * 100) / 100,
      overallGrade: getLetterGrade(overallAvg),
      subjects: subjectReports
    });
  } catch (error) {
    console.error('=== getStudentReport ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error generating report',
      error: error.message
    });
  }
};

// ==========================================
// 6. UPDATE MARK (Teacher/Admin)
// PUT /api/grades/:id
// ==========================================
exports.updateMark = async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.id);

    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    if (
      req.user.role !== 'admin' &&
      mark.teacher.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'Only the original teacher or admin can update this mark'
      });
    }

    const fields = ['score', 'maxScore', 'comments', 'assessmentType', 'assessmentName'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) mark[f] = req.body[f];
    });

    await mark.save();

    res.json({
      message: 'Mark updated',
      mark
    });
  } catch (error) {
    console.error('=== updateMark ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error updating mark',
      error: error.message
    });
  }
};

// ==========================================
// 7. DELETE MARK (Admin only)
// DELETE /api/grades/:id
// ==========================================
exports.deleteMark = async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.id);

    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    await mark.deleteOne();

    res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    console.error('=== deleteMark ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error deleting mark',
      error: error.message
    });
  }
};