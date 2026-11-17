const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

// Default standard periods
const STANDARD_PERIODS = [
  { period: 1, startTime: '08:30', endTime: '09:15' },
  { period: 2, startTime: '09:20', endTime: '10:05' },
  { period: 3, startTime: '10:25', endTime: '11:10' },
  { period: 4, startTime: '11:15', endTime: '12:00' },
  { period: 5, startTime: '01:00', endTime: '01:45' },
  { period: 6, startTime: '01:50', endTime: '02:35' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Default standard subject distribution weights (30 periods per week)
const DEFAULT_CURRICULUM = [
  { name: 'Mathematics', periodsPerWeek: 5 },
  { name: 'English', periodsPerWeek: 5 },
  { name: 'Amharic', periodsPerWeek: 4 },
  { name: 'General Science', periodsPerWeek: 5 },
  { name: 'Social Studies', periodsPerWeek: 4 },
  { name: 'Information Technology (ICT)', periodsPerWeek: 3 },
  { name: 'Health & Physical Education (HPE)', periodsPerWeek: 2 },
  { name: 'Art & Music', periodsPerWeek: 2 }
];

// @desc    Auto-generate a balanced, collision-free timetable for a classroom
// @route   POST /api/timetable/generate/:classroomId
// @access  Private (Admin, Registrar, Teacher)
exports.generateTimetable = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Class.findById(classroomId).populate('homeroomTeacher');
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    // Get active teachers for subject allocation
    const allTeachers = await User.find({ role: 'teacher', isActive: true });
    
    // Determine subject pool
    let subjectWeights = [];
    if (classroom.subjects && classroom.subjects.length >= 4) {
      const count = classroom.subjects.length;
      const baseWeight = Math.floor(30 / count);
      let remainder = 30 % count;
      subjectWeights = classroom.subjects.map((sub, idx) => ({
        name: sub,
        periodsPerWeek: baseWeight + (idx < remainder ? 1 : 0)
      }));
    } else {
      subjectWeights = DEFAULT_CURRICULUM;
    }

    // Build the weekly pool of 30 periods
    let weeklySubjectPool = [];
    subjectWeights.forEach((s) => {
      for (let i = 0; i < s.periodsPerWeek; i++) {
        weeklySubjectPool.push(s.name);
      }
    });

    // Ensure exactly 30 periods
    while (weeklySubjectPool.length < 30) {
      weeklySubjectPool.push('Library & Study');
    }
    weeklySubjectPool = weeklySubjectPool.slice(0, 30);

    // Shuffle pool for randomized fair distribution
    weeklySubjectPool.sort(() => Math.random() - 0.5);

    // Fetch other existing timetables to prevent teacher clashes
    const otherTimetables = await Timetable.find({
      classroom: { $ne: classroomId },
      academicYear: classroom.academicYear
    });

    const teacherBusyMap = new Set();
    otherTimetables.forEach((tt) => {
      tt.schedule?.forEach((daySched) => {
        daySched.slots?.forEach((slot) => {
          if (slot.teacher) {
            teacherBusyMap.add(`${daySched.day}_${slot.period}_${slot.teacher.toString()}`);
          }
        });
      });
    });

    // Assign teachers to subjects
    const subjectTeacherMap = new Map();
    if (classroom.homeroomTeacher) {
      subjectTeacherMap.set('Mathematics', classroom.homeroomTeacher);
    }

    allTeachers.forEach((t, i) => {
      const subj = subjectWeights[i % subjectWeights.length]?.name;
      if (subj && !subjectTeacherMap.has(subj)) {
        subjectTeacherMap.set(subj, t);
      }
    });

    // Generate schedule day by day
    const schedule = [];
    let poolIndex = 0;

    for (const day of DAYS) {
      const daySlots = [];
      const daySubjectsUsed = new Set();

      for (let pIndex = 0; pIndex < STANDARD_PERIODS.length; pIndex++) {
        const periodInfo = STANDARD_PERIODS[pIndex];

        // Find a subject not already used too many times today
        let chosenSubject = weeklySubjectPool[poolIndex % weeklySubjectPool.length];
        let attempts = 0;

        while (daySubjectsUsed.has(chosenSubject) && attempts < 10 && poolIndex + 1 < weeklySubjectPool.length) {
          poolIndex++;
          chosenSubject = weeklySubjectPool[poolIndex % weeklySubjectPool.length];
          attempts++;
        }

        daySubjectsUsed.add(chosenSubject);
        poolIndex++;

        // Find non-clashing teacher
        let assignedTeacher = subjectTeacherMap.get(chosenSubject) || classroom.homeroomTeacher || null;
        if (assignedTeacher && teacherBusyMap.has(`${day}_${periodInfo.period}_${assignedTeacher._id.toString()}`)) {
          // If clash, fallback to alternative free teacher
          const freeTeacher = allTeachers.find(
            (t) => !teacherBusyMap.has(`${day}_${periodInfo.period}_${t._id.toString()}`)
          );
          assignedTeacher = freeTeacher || null;
        }

        daySlots.push({
          period: periodInfo.period,
          startTime: periodInfo.startTime,
          endTime: periodInfo.endTime,
          subject: chosenSubject,
          teacher: assignedTeacher ? assignedTeacher._id : null,
          roomNumber: classroom.roomNumber || `Room ${classroom.section}`
        });
      }

      schedule.push({
        day,
        slots: daySlots
      });
    }

    // Save or update timetable
    let timetable = await Timetable.findOneAndUpdate(
      { classroom: classroomId },
      {
        classroom: classroomId,
        academicYear: classroom.academicYear,
        generatedAt: new Date(),
        schedule
      },
      { new: true, upsert: true }
    )
      .populate('classroom', 'className gradeLevel section roomNumber academicYear')
      .populate({
        path: 'schedule.slots.teacher',
        select: 'fullName email'
      });

    res.status(200).json({
      success: true,
      message: `Automated timetable successfully generated for ${classroom.className}`,
      data: timetable
    });
  } catch (error) {
    console.error('Error generating timetable:', error);
    res.status(500).json({ success: false, message: 'Failed to generate timetable', error: error.message });
  }
};

// @desc    Get timetable for a specific classroom
// @route   GET /api/timetable/class/:classroomId
// @access  Private
exports.getClassTimetable = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const timetable = await Timetable.findOne({ classroom: classroomId })
      .populate('classroom', 'className gradeLevel section roomNumber academicYear')
      .populate({
        path: 'schedule.slots.teacher',
        select: 'fullName email'
      });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No timetable generated yet for this class'
      });
    }

    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timetable', error: error.message });
  }
};

// @desc    Get timetable relevant to logged-in user (Student, Parent, or Teacher)
// @route   GET /api/timetable/my-timetable
// @access  Private
exports.getMyTimetable = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'student') {
      // Find class where student is enrolled
      const studentClass = await Class.findOne({ students: user._id });
      if (!studentClass) {
        return res.status(404).json({ success: false, message: 'You are not enrolled in any class yet' });
      }

      const timetable = await Timetable.findOne({ classroom: studentClass._id })
        .populate('classroom', 'className gradeLevel section roomNumber academicYear')
        .populate('schedule.slots.teacher', 'fullName email');

      return res.json({ success: true, data: timetable, role: 'student', className: studentClass.className });
    }

    if (user.role === 'parent') {
      // Find child of parent
      const child = await User.findOne({ parent: user._id, role: 'student' });
      if (!child) {
        return res.status(404).json({ success: false, message: 'No student linked to this parent account' });
      }

      const childClass = await Class.findOne({ students: child._id });
      if (!childClass) {
        return res.status(404).json({ success: false, message: `${child.fullName} is not assigned to a class yet` });
      }

      const timetable = await Timetable.findOne({ classroom: childClass._id })
        .populate('classroom', 'className gradeLevel section roomNumber academicYear')
        .populate('schedule.slots.teacher', 'fullName email');

      return res.json({
        success: true,
        data: timetable,
        role: 'parent',
        childName: child.fullName,
        className: childClass.className
      });
    }

    if (user.role === 'teacher') {
      // Return teacher's personal teaching schedule across all classes
      const allTimetables = await Timetable.find({})
        .populate('classroom', 'className gradeLevel section roomNumber')
        .populate('schedule.slots.teacher', 'fullName email');

      // Filter and map only periods taught by this teacher
      const teacherWeeklySchedule = DAYS.map((day) => {
        const slots = [];
        allTimetables.forEach((tt) => {
          const dayMatch = tt.schedule.find((d) => d.day === day);
          if (dayMatch) {
            dayMatch.slots.forEach((s) => {
              if (s.teacher && s.teacher._id.toString() === user._id.toString()) {
                slots.push({
                  period: s.period,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  subject: s.subject,
                  className: tt.classroom?.className,
                  roomNumber: s.roomNumber || tt.classroom?.roomNumber
                });
              }
            });
          }
        });
        slots.sort((a, b) => a.period - b.period);
        return { day, slots };
      });

      return res.json({
        success: true,
        role: 'teacher',
        teacherSchedule: teacherWeeklySchedule
      });
    }

    // Admin / Registrar: return recent timetables summary
    const allTimetables = await Timetable.find({})
      .populate('classroom', 'className gradeLevel section roomNumber academicYear')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, role: user.role, data: allTimetables });
  } catch (error) {
    console.error('Error fetching personal timetable:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timetable', error: error.message });
  }
};

// @desc    Download Timetable as PDF
// @route   GET /api/timetable/class/:classroomId/pdf
// @access  Private
exports.downloadTimetablePDF = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const timetable = await Timetable.findOne({ classroom: classroomId })
      .populate('classroom', 'className gradeLevel section roomNumber academicYear')
      .populate('schedule.slots.teacher', 'fullName');

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found for this class' });
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="timetable_${timetable.classroom.className}.pdf"`
    );
    doc.pipe(res);

    // Title & Header
    doc.fontSize(18).text('Wachemo Community Excellency School', { align: 'center' });
    doc.fontSize(13).text(`Class Timetable: ${timetable.classroom.className} (${timetable.academicYear})`, {
      align: 'center'
    });
    doc.fontSize(10).text(`Room: ${timetable.classroom.roomNumber || 'Main Block'} | Generated: ${new Date().toLocaleDateString()}`, {
      align: 'center'
    });
    doc.moveDown(1.5);

    // Table Header
    const colWidth = 120;
    const startX = 35;
    let startY = 120;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Day / Time', startX, startY);

    STANDARD_PERIODS.forEach((p, idx) => {
      doc.text(`P${p.period} (${p.startTime}-${p.endTime})`, startX + 90 + idx * 110, startY, {
        width: 105,
        align: 'center'
      });
    });

    startY += 20;
    doc.moveTo(startX, startY).lineTo(startX + 750, startY).stroke();
    startY += 10;

    // Table Rows
    doc.font('Helvetica');
    timetable.schedule.forEach((daySchedule) => {
      doc.fontSize(10).font('Helvetica-Bold').text(daySchedule.day, startX, startY + 10);
      doc.font('Helvetica').fontSize(8);

      daySchedule.slots.forEach((slot) => {
        const xPos = startX + 90 + (slot.period - 1) * 110;
        doc.text(slot.subject, xPos, startY + 5, { width: 105, align: 'center' });
        if (slot.teacher?.fullName) {
          doc.fontSize(7).text(`(${slot.teacher.fullName})`, xPos, startY + 18, {
            width: 105,
            align: 'center'
          });
          doc.fontSize(8);
        }
      });

      startY += 35;
      doc.moveTo(startX, startY).lineTo(startX + 750, startY).stroke();
      startY += 10;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating timetable PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};
