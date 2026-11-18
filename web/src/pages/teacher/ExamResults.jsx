import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';

export default function ExamResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [examRes, subRes] = await Promise.all([
          API.get(`/exams/${id}`),
          API.get(`/exams/${id}/submissions`),
        ]);

        const examObj = examRes.data?.data || examRes.data;
        const subList = Array.isArray(subRes.data?.data)
          ? subRes.data.data
          : Array.isArray(subRes.data)
          ? subRes.data
          : [];

        setExam(examObj);
        setSubmissions(subList);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError(err.response?.data?.message || 'Failed to load results.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-16">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-slate-400">Loading student submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
        <button
          onClick={() => navigate('/teacher/exams')}
          className="text-emerald-600 hover:underline text-sm font-medium"
        >
          ← Back to Exams
        </button>
      </div>
    );
  }

  const questions = exam?.questions || [];
  const totalMarks = exam?.totalMarks || questions.reduce((s, q) => s + (q.marks || 1), 0);
  const subList = Array.isArray(submissions) ? submissions : [];

  const avgScore = subList.length
    ? (subList.reduce((s, sub) => s + (sub.score || 0), 0) / subList.length).toFixed(1)
    : 0;
  const passCount = subList.filter((s) => s.passed).length;
  const passRate = subList.length ? Math.round((passCount / subList.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 pb-20">
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
          <h1 className="text-2xl font-bold text-slate-800">Exam Results & Submissions</h1>
          <p className="text-sm text-slate-500">
            {exam?.title} — {exam?.subject} ({exam?.classroom?.className || 'Class'})
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{subList.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Submissions</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-indigo-600">
            {avgScore} / {totalMarks}
          </p>
          <p className="text-xs text-slate-500 mt-1">Average Score</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-teal-600">{passRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Pass Rate</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-purple-600">{totalMarks}</p>
          <p className="text-xs text-slate-500 mt-1">Maximum Points</p>
        </div>
      </div>

      {/* Results Table */}
      {subList.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          <div className="text-4xl mb-2">⏳</div>
          <p className="font-semibold text-slate-700">No student submissions yet.</p>
          <p className="text-xs text-slate-400 mt-1">Once students submit their tests, grades appear here automatically.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Student Name</th>
                  <th className="text-center px-4 py-3">Score</th>
                  <th className="text-center px-4 py-3">Percentage</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Submission Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subList.map((sub, idx) => {
                  const studentName = sub.student?.fullName || sub.student?.name || 'Unknown Student';
                  const studentEmail = sub.student?.email || '';
                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {studentName}
                        {studentEmail && <div className="text-xs text-slate-400">{studentEmail}</div>}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">
                        {sub.score} / {totalMarks}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-slate-700">{sub.percentage}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            sub.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {sub.passed ? '✓ Passed' : '✗ Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
