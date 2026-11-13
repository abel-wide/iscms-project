const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit'); // 👈 ተጨምሯል
const User = require('../models/User'); // 👈 ተጨምሯል
const Mark = require('../models/Mark'); // 👈 ተጨምሯል

const {
  enterMark,
  enterBulkMarks,
  getStudentMarks,
  getClassMarks,
  getStudentReport,
  updateMark,
  deleteMark
} = require('../controllers/gradeController');

const { protect, allow } = require('../middleware/auth');

// ==========================================
// GRADE ROUTES
// ==========================================

// Teacher enters a single mark
router.post(
  '/entry',
  protect,
  allow('teacher', 'admin'),
  enterMark
);

// Teacher enters marks for whole class
router.post(
  '/entry-bulk',
  protect,
  allow('teacher', 'admin'),
  enterBulkMarks
);

// Get a student's marks
router.get(
  '/student/:studentId',
  protect,
  allow('student', 'parent', 'teacher', 'admin', 'registrar'),
  getStudentMarks
);

// Get class marks
router.get(
  '/class/:classroomId',
  protect,
  allow('teacher', 'admin', 'registrar'),
  getClassMarks
);

// Get student report card
router.get(
  '/student/:studentId/report',
  protect,
  allow('student', 'parent', 'teacher', 'admin', 'registrar'),
  getStudentReport
);

// ==========================================
// 👇 አዲሱ የ PDF ማውረድ መንገድ (Report Card PDF)
// ==========================================
router.get('/report/:studentId/download', protect, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const marks = await Mark.find({ studentId: req.params.studentId });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_card_${student.fullName}.pdf"`);
    doc.pipe(res);

    // ርዕስ
    doc.fontSize(20).text('Wachemo Community Excellency School', { align: 'center' });
    doc.fontSize(14).text('Student Report Card', { align: 'center' });
    doc.moveDown();

    // የተማሪ መረጃ
    doc.fontSize(12).text(`Student: ${student.fullName}`);
    doc.text(`Grade: ${student.gradeLevel || 'N/A'}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // የውጤት ዝርዝር
    doc.fontSize(12).text('Grades:', { underline: true });
    doc.moveDown(0.5);

    if (marks.length === 0) {
      doc.fontSize(10).text('No grades recorded yet.');
    } else {
      marks.forEach((m) => {
        doc.fontSize(10).text(`${m.subject}: ${m.score} / ${m.maxScore} (${m.term})`);
      });
    }

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

// Update mark
router.put(
  '/:id',
  protect,
  allow('teacher', 'admin'),
  updateMark
);

// Delete mark (admin only)
router.delete(
  '/:id',
  protect,
  allow('admin'),
  deleteMark
);

module.exports = router;