const Exam = require('../models/Exam');
const ExamSubmission = require('../models/ExamSubmission');
const Class = require('../models/Class');
const Mark = require('../models/Mark');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Teacher creates a new objective exam / quiz
// @route   POST /api/exams
// @access  Private (Teacher, Admin)
exports.createExam = async (req, res) => {
  try {
    const {
      title,
      subject,
      classroomId,
      durationMinutes,
      passingMarks,
      term,
      deadline,
      questions
    } = req.body;

    if (!title || !subject || !classroomId || !questions || !questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, classroom, and at least one question are required'
      });
    }

    const classroom = await Class.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    // Validate questions structure
    let totalMarks = 0;
    for (const q of questions) {
      if (!q.questionText || !q.options || q.options.length < 2 || q.correctAnswerIndex === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each question must have text, at least 2 options, and a valid correct answer'
        });
      }
      totalMarks += Number(q.marks || 1);
    }

    const exam = await Exam.create({
      title,
      subject,
      classroom: classroomId,
      createdBy: req.user._id,
      durationMinutes: durationMinutes || 20,
      totalMarks,
      passingMarks: passingMarks || Math.ceil(totalMarks / 2),
      term: term || 'Term 1',
      deadline: deadline || null,
      questions
    });

    // Notify students in the classroom
    try {
      if (classroom.students?.length) {
        const notifications = classroom.students.map((studentId) => ({
          recipient: studentId,
          sender: req.user._id,
          title: `New Online Quiz: ${title}`,
          message: `Your ${subject} teacher published an online objective quiz (${totalMarks} Marks, ${durationMinutes || 20} Mins).`,
          type: 'general',
          priority: 'high'
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn('Could not dispatch notifications:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ success: false, message: 'Failed to create exam', error: error.message });
  }
};

// @desc    Get exams list for the logged-in user
// @route   GET /api/exams/my-exams
// @access  Private
exports.getMyExams = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'teacher') {
      // Teacher views their created exams + submission counts
      const exams = await Exam.find({ createdBy: user._id })
        .populate('classroom', 'className gradeLevel section')
        .sort({ createdAt: -1 });

      const examsWithStats = await Promise.all(
        exams.map(async (exam) => {
          const submissionCount = await ExamSubmission.countDocuments({ exam: exam._id });
          return {
            ...exam.toObject(),
            submissionCount
          };
        })
      );

      return res.json({ success: true, data: examsWithStats });
    }

    if (user.role === 'student') {
      // Find class where student is enrolled
      const studentClass = await Class.findOne({ students: user._id });
      if (!studentClass) {
        return res.json({ success: true, data: [] });
      }

      const exams = await Exam.find({ classroom: studentClass._id, status: 'published' })
        .populate('classroom', 'className gradeLevel')
        .populate('createdBy', 'fullName')
        .sort({ createdAt: -1 });

      // Check submission status for each exam
      const studentExams = await Promise.all(
        exams.map(async (exam) => {
          const submission = await ExamSubmission.findOne({ exam: exam._id, student: user._id });
          const examObj = exam.toObject();

          // Hide correct answers from question list
          examObj.questions = examObj.questions.map((q) => {
            const { correctAnswerIndex, ...safeQ } = q;
            return safeQ;
          });

          return {
            ...examObj,
            isSubmitted: !!submission,
            submission: submission || null
          };
        })
      );

      return res.json({ success: true, data: studentExams });
    }

    // Admin / Registrar view all exams
    const allExams = await Exam.find({})
      .populate('classroom', 'className gradeLevel')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: allExams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }
};

// @desc    Get single exam by ID
// @route   GET /api/exams/:id
// @access  Private
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('classroom', 'className gradeLevel')
      .populate('createdBy', 'fullName');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const submission = await ExamSubmission.findOne({ exam: exam._id, student: req.user._id });

    const examData = exam.toObject();

    // If student has NOT submitted, hide correct answers to prevent cheating
    if (req.user.role === 'student' && !submission) {
      examData.questions = examData.questions.map((q) => {
        const { correctAnswerIndex, ...safeQ } = q;
        return safeQ;
      });
    }

    res.json({
      success: true,
      data: examData,
      isSubmitted: !!submission,
      submission: submission || null
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exam', error: error.message });
  }
};

// @desc    Student submits exam -> Automated Marking Engine
// @route   POST /api/exams/:id/submit
// @access  Private (Student)
exports.submitExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedOption }
    const studentId = req.user._id;

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check if already submitted
    const existingSubmission = await ExamSubmission.findOne({ exam: id, student: studentId });
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this exam',
        data: existingSubmission
      });
    }

    // ⚡ AUTOMATED MARKING ENGINE
    let totalScore = 0;
    let totalPossible = 0;
    const gradedAnswers = [];

    const submittedAnswerMap = new Map();
    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        submittedAnswerMap.set(ans.questionId?.toString(), Number(ans.selectedOption));
      });
    }

    exam.questions.forEach((question) => {
      const qIdStr = question._id.toString();
      const studentOption = submittedAnswerMap.has(qIdStr) ? submittedAnswerMap.get(qIdStr) : -1;
      const isCorrect = studentOption === question.correctAnswerIndex;
      const marksAwarded = isCorrect ? (question.marks || 1) : 0;

      totalScore += marksAwarded;
      totalPossible += (question.marks || 1);

      gradedAnswers.push({
        questionId: question._id,
        selectedOption: studentOption,
        isCorrect,
        marksAwarded
      });
    });

    const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    const passed = totalScore >= (exam.passingMarks || Math.ceil(totalPossible / 2));

    const submission = await ExamSubmission.create({
      exam: exam._id,
      student: studentId,
      answers: gradedAnswers,
      score: totalScore,
      totalPossible,
      percentage,
      passed,
      submittedAt: new Date()
    });

    // 🔗 Automatic Grade System Integration: save to Mark model
    try {
      const classroom = await Class.findById(exam.classroom);
      await Mark.findOneAndUpdate(
        {
          student: studentId,
          classroom: exam.classroom,
          subject: exam.subject,
          assessmentType: 'Quiz',
          assessmentName: exam.title
        },
        {
          student: studentId,
          classroom: exam.classroom,
          subject: exam.subject,
          term: 'Term 1',
          academicYear: classroom?.academicYear || '2026',
          assessmentType: 'Quiz',
          assessmentName: exam.title,
          score: totalScore,
          maxScore: totalPossible,
          recordedBy: exam.createdBy
        },
        { upsert: true, new: true }
      );
    } catch (markErr) {
      console.warn('Could not sync mark to Mark model:', markErr.message);
    }

    // Notify student & parent of instant score
    try {
      await Notification.create({
        recipient: studentId,
        title: `Exam Graded: ${exam.title}`,
        message: `Your exam was automatically graded. You scored ${totalScore}/${totalPossible} (${percentage}%). Status: ${passed ? 'PASSED ✅' : 'FAILED ❌'}`,
        type: 'grade',
        priority: 'normal'
      });

      const studentUser = await User.findById(studentId);
      if (studentUser?.parent) {
        await Notification.create({
          recipient: studentUser.parent,
          title: `Quiz Result: ${studentUser.fullName}`,
          message: `${studentUser.fullName} scored ${totalScore}/${totalPossible} (${percentage}%) in ${exam.subject} online quiz.`,
          type: 'grade',
          priority: 'normal'
        });
      }
    } catch (notifErr) {
      console.warn('Notification error on exam grading:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Exam submitted and automatically graded successfully!',
      data: {
        score: totalScore,
        totalPossible,
        percentage,
        passed,
        gradedAnswers,
        submission
      }
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ success: false, message: 'Failed to submit exam', error: error.message });
  }
};

// @desc    Teacher views all student submissions and results for an exam
// @route   GET /api/exams/:id/submissions
// @access  Private (Teacher, Admin)
exports.getExamSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id).populate('classroom', 'className');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const submissions = await ExamSubmission.find({ exam: id })
      .populate('student', 'fullName email')
      .sort({ score: -1 });

    res.json({
      success: true,
      exam,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: error.message });
  }
};
