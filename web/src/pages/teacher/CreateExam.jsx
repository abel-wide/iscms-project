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
    classId: '',
    durationMinutes: 30,
    term: 'Term1',
    deadline: '',
    passingMarks: 50,
  });

  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctAnswerIndex: 0, marks: 1 },
  ]);

  useEffect(() => {
    API.get('/classes/my-classes').then(r => setClasses(r.data)).catch(() => {});
  }, []);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctAnswerIndex: 0, marks: 1 }]);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
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
    setLoading(true);
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        passingMarks: Number(form.passingMarks),
        questions: questions.map(q => ({
          text: q.text,
          options: q.options.filter(o => o.trim() !== ''),
          correctAnswerIndex: Number(q.correctAnswerIndex),
          marks: Number(q.marks),
        })),
      };
      await API.post('/exams', payload);
      setSuccess('✅ Exam created successfully!');
      setTimeout(() => navigate('/teacher/exams'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam.');
    } finally {
      setLoading(false);
    }
  };

  const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);

  return (
    <div className="max-w-3xl mx-auto p-4 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/teacher/exams')} className="text-indigo-600 hover:text-indigo-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Create Online Exam</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-lg">📋 Exam Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Exam Title *</label>
              <input name="title" required value={form.title} onChange={handleFormChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                placeholder="e.g. Chapter 3 MCQ Quiz" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Subject *</label>
              <input name="subject" required value={form.subject} onChange={handleFormChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Classroom *</label>
              <select name="classId" required value={form.classId} onChange={handleFormChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
                <option value="">Select class</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name} {c.section} ({c.academicYear})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Term *</label>
              <select name="term" value={form.term} onChange={handleFormChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
                <option value="Term1">Term 1</option>
                <option value="Term2">Term 2</option>
                <option value="Term3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Duration (minutes) *</label>
              <input name="durationMinutes" type="number" min="5" max="180" required value={form.durationMinutes} onChange={handleFormChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Deadline *</label>
              <input name="deadline" type="datetime-local" required value={form.deadline} onChange={handleFormChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Passing Marks (%)</label>
              <input name="passingMarks" type="number" min="1" max="100" value={form.passingMarks} onChange={handleFormChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
            <div className="flex items-end">
              <div className="bg-indigo-50 rounded-xl px-4 py-2 text-sm text-indigo-700 w-full text-center">
                <span className="font-bold text-lg">{totalMarks}</span> Total Marks
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-700 text-lg">❓ Questions ({questions.length})</h2>
            <button type="button" onClick={addQuestion}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
              + Add Question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-semibold text-indigo-600">Q{qIdx + 1}</span>
                <button type="button" onClick={() => removeQuestion(qIdx)}
                  className="text-red-400 hover:text-red-600 text-xs">Remove</button>
              </div>

              <div className="mb-3">
                <input
                  value={q.text}
                  onChange={e => updateQuestion(qIdx, 'text', e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="Question text..." />
              </div>

              <div className="space-y-2 mb-3">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctAnswerIndex === oIdx}
                      onChange={() => updateQuestion(qIdx, 'correctAnswerIndex', oIdx)}
                      className="accent-green-500 w-4 h-4 flex-shrink-0"
                      title="Mark as correct answer"
                    />
                    <input
                      value={opt}
                      onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                      required
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                      placeholder={`Option ${oIdx + 1}`} />
                    <button type="button" onClick={() => removeOption(qIdx, oIdx)}
                      className="text-gray-400 hover:text-red-500 text-xs px-1">✕</button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => addOption(qIdx)}
                  className="text-xs text-indigo-500 hover:text-indigo-700">+ Add option</button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Marks:</span>
                  <input type="number" min="1" value={q.marks}
                    onChange={e => updateQuestion(qIdx, 'marks', e.target.value)}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:ring-2 focus:ring-indigo-300 outline-none" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">✅ Green radio = correct answer</p>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl transition shadow-md disabled:opacity-50">
          {loading ? 'Creating Exam...' : '🚀 Publish Exam'}
        </button>
      </form>
    </div>
  );
}
