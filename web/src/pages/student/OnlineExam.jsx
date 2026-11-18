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
      .then((r) => {
        const examObj = r.data?.data || r.data;
        setExam(examObj);

        // If already submitted, display submission results directly
        const sub = r.data?.submission || examObj?.submission;
        if (sub || r.data?.isSubmitted) {
          setResult(sub);
        } else {
          const duration = Number(examObj?.durationMinutes) || 20;
          setTimeLeft(duration * 60);
        }
      })
      .catch((err) => {
        console.error('Error loading exam:', err);
        setError(err.response?.data?.message || 'Failed to load exam details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
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
    if (result || submitting) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
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
      const resData = res.data?.data || res.data;
      setResult(resData);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit exam.');
      setSubmitting(false);
    }
  }, [answers, id, submitting, result]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-16">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-slate-400">Loading your exam...</p>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/student/exams')}
          className="text-amber-600 font-semibold text-sm hover:underline"
        >
          ← Back to Exams
        </button>
      </div>
    );
  }

  const questions = exam?.questions || [];
  const totalQuestions = questions.length;
  const totalMarks = exam?.totalMarks || questions.reduce((s, q) => s + (q.marks || 1), 0);
  const answeredCount = Object.keys(answers).length;

  // ==========================================
  // RESULT VIEW
  // ==========================================
  if (result) {
    const scoreVal = result.score ?? 0;
    const totalVal = result.totalPossible || totalMarks;
    const percentVal = result.percentage ?? Math.round((scoreVal / (totalVal || 1)) * 100);
    const isPassed = result.passed ?? (scoreVal >= (exam?.passingMarks || totalVal / 2));
    const gradedAnswers = result.gradedAnswers || result.answers || [];

    return (
      <div className="max-w-2xl mx-auto p-4 pb-20">
        <div className="text-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-6xl mb-3">{isPassed ? '🎉' : '📝'}</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            {isPassed ? 'Congratulations! You Passed!' : 'Exam Completed'}
          </h1>
          <p className="text-sm text-slate-500">
            {exam?.title} — {exam?.subject}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-indigo-700">
              {scoreVal} / {totalVal}
            </p>
            <p className="text-xs text-slate-500 mt-1">Final Score</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-700">{percentVal}%</p>
            <p className="text-xs text-slate-500 mt-1">Percentage</p>
          </div>
          <div
            className={`border rounded-2xl p-4 text-center shadow-sm ${
              isPassed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}
          >
            <p className={`text-2xl font-bold ${isPassed ? 'text-emerald-700' : 'text-rose-600'}`}>
              {isPassed ? '✓ Passed' : '✗ Failed'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Result Status</p>
          </div>
        </div>

        {/* Question Breakdown */}
        {gradedAnswers.length > 0 && (
          <div className="space-y-3 mb-8">
            <h3 className="font-bold text-slate-800 text-sm">Question Breakdown</h3>
            {questions.map((q, idx) => {
              const ans = gradedAnswers.find((a) => (a.questionId?._id || a.questionId) === q._id);
              const isCorrect = ans?.isCorrect;
              const selectedOpt = ans?.selectedOption;
              const qText = q.questionText || q.text;

              return (
                <div
                  key={q._id || idx}
                  className={`p-4 rounded-xl border ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-rose-200 bg-rose-50/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`text-sm font-bold mt-0.5 ${
                        isCorrect ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        Q{idx + 1}: {qText}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Your Choice:{' '}
                        <span className="font-semibold">
                          {selectedOpt !== undefined && selectedOpt >= 0 && q.options[selectedOpt]
                            ? q.options[selectedOpt]
                            : 'No Answer Selected'}
                        </span>
                        {!isCorrect && q.correctAnswerIndex !== undefined && (
                          <span className="text-emerald-700 font-semibold ml-2">
                            → Correct: {q.options[q.correctAnswerIndex]}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      {ans?.marksAwarded ?? (isCorrect ? q.marks || 1 : 0)} / {q.marks || 1} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate('/student/exams')}
          className="w-full bg-slate-800 text-white py-3.5 rounded-2xl font-semibold hover:bg-slate-900 transition"
        >
          ← Back to Exams
        </button>
      </div>
    );
  }

  // ==========================================
  // EXAM TAKING VIEW
  // ==========================================
  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      {/* Timer & Progress Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 mb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-slate-800 text-base">{exam?.title}</h1>
            <p className="text-xs text-slate-500">
              {exam?.subject} • {totalQuestions} Questions
            </p>
          </div>
          <div
            className={`text-center px-4 py-1.5 rounded-xl border ${
              timeLeft !== null && timeLeft < 60
                ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse'
                : timeLeft !== null && timeLeft < 300
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}
          >
            <p className="text-xl font-mono font-bold">{formatTime(timeLeft)}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider">Time Left</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all rounded-full"
              style={{
                width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            {answeredCount} / {totalQuestions} Answered
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5 mb-8">
        {questions.map((q, idx) => {
          const qText = q.questionText || q.text;
          const isAnswered = answers[q._id] !== undefined;

          return (
            <div
              key={q._id || idx}
              className={`bg-white rounded-2xl shadow-sm border p-5 transition ${
                isAnswered ? 'border-amber-300' : 'border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <p className="font-semibold text-slate-800 text-sm leading-relaxed">
                  <span className="text-amber-600 font-bold mr-1.5">Q{idx + 1}.</span> {qText}
                </p>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium ml-2 whitespace-nowrap">
                  {q.marks || 1} pt{(q.marks || 1) > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {(q.options || []).map((opt, oIdx) => {
                  const isSelected = answers[q._id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelect(q._id, oIdx)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition border flex items-center gap-3 ${
                        isSelected
                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold shadow-sm'
                          : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition flex-shrink-0 ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-slate-300 bg-white text-slate-500'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || answeredCount === 0}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl transition shadow-md disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            <span>Grading your exam instantly...</span>
          </>
        ) : (
          <span>
            📤 Submit Exam ({answeredCount} of {totalQuestions} answered)
          </span>
        )}
      </button>
    </div>
  );
}
