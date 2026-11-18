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
        const [examRes, subRes] = await Promise.all([
          API.get(`/exams/${id}`),
          API.get(`/exams/${id}/submissions`),
        ]);
        setExam(examRes.data);
        setSubmissions(subRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
    </div>
  );

  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const totalMarks = exam?.questions?.reduce((s, q) => s + q.marks, 0) || 0;
  const avgScore = submissions.length
    ? (submissions.reduce((s, sub) => s + sub.score, 0) / submissions.length).toFixed(1)
    : 0;
  const passCount = submissions.filter(s => s.passed).length;
  const passRate = submissions.length ? Math.round((passCount / submissions.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/teacher/exams')} className="text-indigo-600 hover:text-indigo-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Results</h1>
          <p className="text-sm text-gray-500">{exam?.title} — {exam?.subject}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Students', value: submissions.length, color: 'indigo' },
          { label: 'Average Score', value: `${avgScore}/${totalMarks}`, color: 'blue' },
          { label: 'Pass Rate', value: `${passRate}%`, color: 'green' },
          { label: 'Total Marks', value: totalMarks, color: 'purple' },
        ].map(stat => (
          <div key={stat.label} className={`bg-${stat.color}-50 border border-${stat.color}-100 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold text-${stat.color}-700`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Results Table */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          No submissions yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-center px-4 py-3">Score</th>
                  <th className="text-center px-4 py-3">Percentage</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map((sub, idx) => (
                  <tr key={sub._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {sub.student?.name || 'Unknown'}
                      <div className="text-xs text-gray-400">{sub.student?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-indigo-700">
                      {sub.score} / {totalMarks}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-semibold text-gray-700">{sub.percentage}%</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${sub.percentage >= 70 ? 'bg-green-500' : sub.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${sub.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${sub.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {sub.passed ? '✓ Pass' : '✗ Fail'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
