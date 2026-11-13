const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit'); // 👈 ተጨምሯል
const User = require('../models/User'); // 👈 ተጨምሯል
const Attendance = require('../models/Attendance'); // 👈 ተጨምሯል

const {
  markAttendance,
  markBulkAttendance,
  getStudentAttendance,
  getClassAttendance,
  getDailyReport,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');

const { protect, allow } = require('../middleware/auth');

// ==========================================
// ATTENDANCE ROUTES
// ==========================================

// Teacher marks single attendance
router.post(
  '/mark',
  protect,
  allow('teacher', 'admin'),
  markAttendance
);

// Teacher marks attendance for whole class
router.post(
  '/mark-bulk',
  protect,
  allow('teacher', 'admin'),
  markBulkAttendance
);

// View student's attendance (Student/Parent/Teacher/Admin)
router.get(
  '/student/:studentId',
  protect,
  allow('student', 'parent', 'teacher', 'admin', 'registrar'),
  getStudentAttendance
);

// View class attendance (Teacher/Admin)
router.get(
  '/class/:classroomId',
  protect,
  allow('teacher', 'admin', 'registrar'),
  getClassAttendance
);

// Daily report (Teacher/Admin/Registrar)
router.get(
  '/report/daily',
  protect,
  allow('teacher', 'admin', 'registrar'),
  getDailyReport
);

// ==========================================
// 👇 አዲሱ የ PDF ማውረድ መንገድ (Attendance Report PDF)
// ==========================================
router.get('/report/:studentId/download', protect, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // የክትትል መረጃ ከዳታቤዝ አምጣ
    const records = await Attendance.find({ studentId: req.params.studentId })
      .sort({ date: -1 })
      .limit(30); // የመጨረሻዎቹ 30 መዝገቦች

    // PDF ፍጠር
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${student.fullName}.pdf"`);
    doc.pipe(res);

    // ርዕስ
    doc.fontSize(20).text('Wachemo Community Excellency School', { align: 'center' });
    doc.fontSize(14).text('Attendance Report', { align: 'center' });
    doc.moveDown();

    // የተማሪ መረጃ
    doc.fontSize(12).text(`Student: ${student.fullName}`);
    doc.text(`Email: ${student.email}`);
    doc.text(`Grade: ${student.gradeLevel || 'N/A'}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // የክትትል ሰንጠረዥ
    doc.fontSize(12).text('Attendance Records:', { underline: true });
    doc.moveDown(0.5);

    records.forEach((r) => {
      const dateStr = new Date(r.date).toLocaleDateString();
      doc.fontSize(10).text(`${dateStr} - ${r.status.toUpperCase()} (${r.classroom?.className || 'N/A'})`);
    });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

// ==========================================
// Update attendance (Teacher/Admin)
// ==========================================
router.put(
  '/:id',
  protect,
  allow('teacher', 'admin'),
  updateAttendance
);

// Delete attendance (Admin only)
router.delete(
  '/:id',
  protect,
  allow('admin'),
  deleteAttendance
);

module.exports = router;