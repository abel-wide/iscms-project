import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';

export default function TeacherExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError('');
      const r = await API.get('/exams/my-exams');
      // Normalize response array safely
      const list = Array.isArray(r.data)
        ? r.data
        : (Array.isArray(r.data?.data) ? r.data.data : []);
      setExams(list);
    } catch (err) {
      console.error('Failed to load exams:', err);
      setError(err.response?.data?.message || 'Failed to load exams. Please try again.');
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
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-slate-400">Loading exams...</p>
      </div>
    );
  }

  const examList = Array.isArray(exams) ? exams : [];

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>📝</span> Online Exams & Quizzes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and manage automatically graded objective tests for your classes
          </p>
        </div>
        <Link
          to="/teacher/exams/create"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <span>+</span> Create New Exam
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchExams} className="underline font-medium hover:text-red-900 text-xs">
            Retry
          </button>
        </div>
      )}

      {examList.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No Online Exams Created Yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            You haven't published any quizzes. Create an objective multiple-choice quiz and students will be graded automatically!
          </p>
          <Link
            to="/teacher/exams/create"
            className="inline-block bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition shadow-sm"
          >
            Create Your First Exam
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {examList.map((exam) => {
            const questions = exam?.questions || [];
            const totalMarks = exam?.totalMarks || questions.reduce((s, q) => s + (q.marks || 1), 0);
            const isExpired = exam?.deadline ? new Date(exam.deadline) < new Date() : false;
            const classroomName = exam?.classroom?.className || exam?.classroom?.name || 'Class';
            const submissionCount = exam?.submissionCount ?? 0;

            return (
              <div
                key={exam._id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-lg">{exam.title}</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          isExpired
                            ? 'bg-rose-100 text-rose-700'
                            : exam.status === 'closed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isExpired ? 'Expired' : exam.status || 'Active'}
                      </span>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
                        {classroomName}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">📚 {exam.subject}</span>
                      <span className="flex items-center gap-1">❓ {questions.length} questions</span>
                      <span className="flex items-center gap-1">🏆 {totalMarks} total marks</span>
                      <span className="flex items-center gap-1">⏱ {exam.durationMinutes || 20} min limit</span>
                      <span className="flex items-center gap-1">
                        👥 {submissionCount} submissions
                      </span>
                      {exam.deadline && (
                        <span className="flex items-center gap-1">
                          📅 Deadline: {new Date(exam.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/teacher/exams/${exam._id}/results`}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-semibold transition text-center"
                    >
                      View Results ({submissionCount})
                    </Link>
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
