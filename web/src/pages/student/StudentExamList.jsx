import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';

export default function StudentExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError('');
      const r = await API.get('/exams/my-exams');
      const list = Array.isArray(r.data?.data)
        ? r.data.data
        : Array.isArray(r.data)
        ? r.data
        : [];
      setExams(list);
    } catch (err) {
      console.error('Failed to load student exams:', err);
      setError(err.response?.data?.message || 'Failed to load exams.');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-16">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-slate-400">Loading your exams...</p>
      </div>
    );
  }

  const examList = Array.isArray(exams) ? exams : [];

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span>📝</span> My Online Exams & Quizzes
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Take your timed objective exams and get instant auto-grading
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchExams} className="underline font-medium hover:text-rose-900 text-xs">
            Retry
          </button>
        </div>
      )}

      {examList.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No Pending Exams</h3>
          <p className="text-sm text-slate-500">
            There are currently no active online exams published for your class. Check back later!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {examList.map((exam) => {
            const questions = exam?.questions || [];
            const totalMarks = exam?.totalMarks || questions.reduce((s, q) => s + (q.marks || 1), 0);
            const isExpired = exam?.deadline ? new Date(exam.deadline) < new Date() : false;
            const hasSubmitted = exam?.isSubmitted || exam?.hasSubmitted || !!exam?.submission;

            return (
              <div
                key={exam._id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-lg">{exam.title}</h3>
                      {hasSubmitted ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
                          ✓ Submitted
                        </span>
                      ) : isExpired ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-700">
                          Expired
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">
                          Open Now
                        </span>
                      )}
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {exam.term || 'Quiz'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">📚 {exam.subject}</span>
                      <span className="flex items-center gap-1">❓ {questions.length} questions</span>
                      <span className="flex items-center gap-1">🏆 {totalMarks} marks</span>
                      <span className="flex items-center gap-1">⏱ {exam.durationMinutes || 20} min</span>
                      {exam.deadline && (
                        <span className="flex items-center gap-1">
                          📅 Deadline: {new Date(exam.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {hasSubmitted ? (
                      <Link
                        to={`/student/exams/${exam._id}`}
                        className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-100 transition text-center"
                      >
                        View Score Breakdown
                      </Link>
                    ) : !isExpired ? (
                      <Link
                        to={`/student/exams/${exam._id}`}
                        className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition text-center shadow-sm"
                      >
                        🚀 Take Exam
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-rose-500">Submission Closed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
