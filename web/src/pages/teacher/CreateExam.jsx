import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

export default function CreateExam() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    subject: '',
    classroomId: '',
    durationMinutes: 20,
    term: 'Term 1',
    deadline: '',
    passingMarks: 5,
  });

  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0, marks: 1 },
  ]);

  useEffect(() => {
    // Fetch teacher's classes with fallback
    API.get('/classes/my-classes')
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data || []);
        if (list.length > 0) {
          setClasses(list);
        } else {
          // fallback to all classes
          API.get('/classes').then((res) => {
            setClasses(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          }).catch(() => {});
        }
      })
      .catch(() => {
        API.get('/classes').then((res) => {
          setClasses(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        }).catch(() => {});
      });
  }, []);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0, marks: 1 }
    ]);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestionText = (idx, value) => {
    const updated = [...questions];
    updated[idx].questionText = value;
    setQuestions(updated);
  };

  const updateQuestionMarks = (idx, value) => {
    const updated = [...questions];
    updated[idx].marks = Math.max(1, Number(value) || 1);
    setQuestions(updated);
  };

  const updateCorrectAnswer = (idx, optionIndex) => {
    const updated = [...questions];
    updated[idx].correctAnswerIndex = optionIndex;
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const addOption = (qIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length < 5) updated[qIdx].options.push('');
    setQuestions(updated);
  };

  const removeOption = (qIdx, oIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) return;
    updated[qIdx].options.splice(oIdx, 1);
    if (updated[qIdx].correctAnswerIndex >= updated[qIdx].options.length) {
      updated[qIdx].correctAnswerIndex = 0;
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.classroomId) {
      setError('Please select a target classroom for this exam.');
      return;
    }

    // Validate that questions are filled out
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setError(`Question #${i + 1} is missing its question text.`);
        return;
      }
      const filledOptions = q.options.filter((o) => o.trim() !== '');
      if (filledOptions.length < 2) {
        setError(`Question #${i + 1} must have at least 2 choices.`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        classroomId: form.classroomId,
        durationMinutes: Number(form.durationMinutes) || 20,
        passingMarks: Number(form.passingMarks) || 5,
        term: form.term,
        deadline: form.deadline ? new Date(form.deadline) : null,
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          options: q.options.filter((o) => o.trim() !== ''),
          correctAnswerIndex: Number(q.correctAnswerIndex),
          marks: Number(q.marks) || 1,
        })),
      };

      await API.post('/exams', payload);
      setSuccess('✅ Exam created and published successfully!');
      setTimeout(() => navigate('/teacher/exams'), 1200);
    } catch (err) {
      console.error('Failed to create exam:', err);
      setError(err.response?.data?.message || 'Failed to create exam. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks || 1), 0);

  return (
    <div className="max-w-3xl mx-auto p-4 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/teacher/exams')}
          className="p-2 text-slate-500 hover:text-emerald-700 bg-white border border-slate-200 rounded-xl transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Create Online Exam</h1>
          <p className="text-xs text-slate-500">Configure quiz details and objective questions</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>📋</span> Exam Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Title *</label>
              <input
                name="title"
                required
                value={form.title}
                onChange={handleFormChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                placeholder="e.g. Chapter 3 MCQ Quiz"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subject *</label>
              <input
                name="subject"
                required
                value={form.subject}
                onChange={handleFormChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                placeholder="e.g. Mathematics"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Classroom *</label>
              <select
                name="classroomId"
                required
                value={form.classroomId}
                onChange={handleFormChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none bg-white"
              >
                <option value="">-- Select Class --</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className || c.name} {c.section ? `(${c.section})` : ''} - {c.academicYear || ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Term *</label>
              <select
                name="term"
                value={form.term}
                onChange={handleFormChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none bg-white"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
                <option value="Midterm">Midterm</option>
                <option value="Final">Final</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Minutes) *</label>
              <input
                name="durationMinutes"
                type="number"
                min="1"
                max="180"
                required
                value={form.durationMinutes}
                onChange={handleFormChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Deadline *</label>
              <input
                name="deadline"
                type="datetime-local"
                required
                value={form.deadline}
                onChange={handleFormChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Passing Marks (Points)</label>
              <input
                name="passingMarks"
                type="number"
                min="1"
                max="100"
                value={form.passingMarks}
                onChange={handleFormChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
              />
            </div>
            <div className="flex items-end">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs text-emerald-800 w-full text-center">
                Total Marks: <span className="font-bold text-base text-emerald-700">{totalMarks}</span> Points
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span>❓</span> Questions ({questions.length})
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition shadow-sm"
            >
              + Add Question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Question #{qIdx + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-rose-500 hover:text-rose-700 text-xs font-medium"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Question Prompt</label>
                <textarea
                  value={q.questionText}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                  required
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none resize-none"
                  placeholder="Enter your question here..."
                />
              </div>

              <div className="space-y-2 mb-4">
                <label className="block text-xs font-semibold text-slate-600">
                  Options (Select radio for correct answer):
                </label>
                {q.options.map((opt, oIdx) => {
                  const isCorrect = q.correctAnswerIndex === oIdx;
                  return (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={isCorrect}
                        onChange={() => updateCorrectAnswer(qIdx, oIdx)}
                        className="accent-emerald-600 w-4 h-4 cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <input
                        value={opt}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        required
                        className={`flex-1 border rounded-xl px-3 py-1.5 text-sm outline-none transition ${
                          isCorrect
                            ? 'border-emerald-400 bg-emerald-50/50 text-emerald-900 font-medium'
                            : 'border-slate-200 bg-white text-slate-800'
                        }`}
                        placeholder={`Choice ${String.fromCharCode(65 + oIdx)}`}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIdx, oIdx)}
                          className="text-slate-400 hover:text-rose-500 text-xs px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => addOption(qIdx)}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  + Add another choice
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Marks for this question:</span>
                  <input
                    type="number"
                    min="1"
                    value={q.marks}
                    onChange={(e) => updateQuestionMarks(qIdx, e.target.value)}
                    className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md disabled:opacity-50 text-sm"
        >
          {loading ? 'Publishing Exam...' : '🚀 Publish Online Exam'}
        </button>
      </form>
    </div>
  );
}
