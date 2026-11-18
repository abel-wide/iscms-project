import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';

export default function OnlineExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    API.get(`/exams/${id}`)
      .then(r => {
        setExam(r.data);
        // If already submitted, show result
        if (r.data.submission) {
          setResult(r.data.submission);
        } else {
          setTimeLeft(r.data.durationMinutes * 60);
        }
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load exam.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, result]);

  const handleSelect = (questionId, optionIndex) => {
    if (result) return;
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId,
          selectedOption: Number(selectedOption),
        })),
      };
      const res = await API.post(`/exams/${id}/submit`, payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam.');
      setSubmitting(false);
    }
  }, [answers, id, submitting, result]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
      <button onClick={() => navigate('/student/exams')} className="text-indigo-600 text-sm hover:underline">← Back to Exams</button>
    </div>
  );

  const totalMarks = exam?.questions?.reduce((s, q) => s + q.marks, 0) || 0;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam?.questions?.length || 0;

  // === RESULT VIEW ===
  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-20">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{result.passed ? '🎉' : '😞'}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {result.passed ? 'Congratulations! You Passed!' : 'Better Luck Next Time'}
          </h1>
          <p className="text-gray-500">{exam?.title}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-indigo-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-700">{result.score}/{totalMarks}</p>
            <p className="text-xs text-gray-500 mt-1">Score</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{result.percentage}%</p>
            <p className="text-xs text-gray-500 mt-1">Percentage</p>
          </div>
          <div className={`${result.passed ? 'bg-green-50' : 'bg-red-50'} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${result.passed ? 'text-green-700' : 'text-red-600'}`}>
              {result.passed ? '✓ Pass' : '✗ Fail'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Status</p>
          </div>
        </div>

        {/* Per-question breakdown */}
        {result.answers && (
          <div className="space-y-3 mb-8">
            <h2 className="font-semibold text-gray-700">Question Breakdown</h2>
            {exam.questions.map((q, idx) => {
              const ans = result.answers.find(a => a.questionId === q._id);
              return (
                <div key={q._id} className={`p-4 rounded-xl border ${ans?.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`text-sm font-bold ${ans?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {ans?.isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Q{idx + 1}: {q.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Your answer: {q.options[ans?.selectedOption] || 'Not answered'} 
                        {!ans?.isCorrect && ` → Correct: ${q.options[q.correctAnswerIndex]}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">{ans?.marksAwarded}/{q.marks}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => navigate('/student/exams')}
          className="w-full bg-amber-500 text-white py-3 rounded-2xl font-medium hover:bg-amber-600 transition">
          ← Back to Exams
        </button>
      </div>
    );
  }

  // === EXAM VIEW ===
  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      {/* Timer Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-800 text-lg">{exam?.title}</h1>
            <p className="text-xs text-gray-500">{exam?.subject} • {totalQuestions} questions</p>
          </div>
          <div className={`text-center px-4 py-2 rounded-xl ${timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : timeLeft < 300 ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'}`}>
            <p className="text-2xl font-mono font-bold">{formatTime(timeLeft)}</p>
            <p className="text-xs">Time Left</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all rounded-full" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">{answeredCount}/{totalQuestions}</span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5 mb-8">
        {exam.questions.map((q, idx) => (
          <div key={q._id} className={`bg-white rounded-2xl shadow-sm border p-5 transition ${answers[q._id] !== undefined ? 'border-amber-200' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-3">
              <p className="font-medium text-gray-800">
                <span className="text-amber-600 font-bold mr-1">Q{idx + 1}.</span> {q.text}
              </p>
              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{q.marks} mk{q.marks > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelect(q._id, oIdx)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition border ${
                    answers[q._id] === oIdx
                      ? 'bg-amber-50 border-amber-300 text-amber-800 font-medium'
                      : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="inline-block w-5 h-5 mr-2 rounded-full border-2 text-center text-xs leading-5 align-middle
                    ${answers[q._id] === oIdx ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-300'}"
                  >
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || answeredCount === 0}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 rounded-2xl transition shadow-md disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : `📤 Submit Exam (${answeredCount}/${totalQuestions} answered)`}
      </button>
    </div>
  );
}
