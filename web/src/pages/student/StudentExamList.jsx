import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';

export default function StudentExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/exams')
      .then(r => setExams(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📝 My Online Exams</h1>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500">No exams available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map(exam => {
            const totalMarks = exam.questions?.reduce((s, q) => s + q.marks, 0) || 0;
            const isExpired = new Date(exam.deadline) < new Date();
            const hasSubmitted = exam.hasSubmitted;
            return (
              <div key={exam._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{exam.title}</h3>
                      {hasSubmitted ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-600">Submitted</span>
                      ) : isExpired ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Expired</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-600">Open</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                      <span>📚 {exam.subject}</span>
                      <span>❓ {exam.questions?.length || 0} questions</span>
                      <span>🏆 {totalMarks} marks</span>
                      <span>⏱ {exam.durationMinutes} min</span>
                      <span>📅 Deadline: {new Date(exam.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {hasSubmitted ? (
                    <Link to={`/student/exams/${exam._id}`}
                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition text-center">
                      View Result
                    </Link>
                  ) : !isExpired ? (
                    <Link to={`/student/exams/${exam._id}`}
                      className="bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition text-center shadow-md">
                      🚀 Start Exam
                    </Link>
                  ) : (
                    <span className="text-xs text-red-400 font-medium">Deadline passed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
