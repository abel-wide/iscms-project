import { useState, useEffect } from 'react';
import API from '../../services/api';

export default function HeadReports() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/classes')
      .then(r => setClasses(r.data?.classes || (Array.isArray(r.data) ? r.data : [])))
      .catch(() => setClasses([]));
  }, []);

  const fetchMarks = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await API.get(`/marks?classId=${selectedClass}`);
      setMarks(res.data);
    } catch {
      setMarks([]);
    } finally {
      setLoading(false);
    }
  };

  // Group marks by subject
  const bySubject = marks.reduce((acc, m) => {
    if (!acc[m.subject]) acc[m.subject] = [];
    acc[m.subject].push(m);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 All Reports</h2>

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-col sm:flex-row gap-3">
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white"
        >
          <option value="">Select a class</option>
          {Array.isArray(classes) && classes.map(c => (
            <option key={c._id} value={c._id}>{c.name || c.className} {c.section} ({c.academicYear})</option>
          ))}
        </select>
        <button
          onClick={fetchMarks}
          disabled={!selectedClass || loading}
          className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Report'}
        </button>
      </div>

      {/* Results */}
      {Object.keys(bySubject).length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          Select a class and click "Load Report" to view grades.
        </div>
      )}

      {Object.entries(bySubject).map(([subject, subjectMarks]) => {
        const avg = (subjectMarks.reduce((s, m) => s + (m.score / m.maxScore) * 100, 0) / subjectMarks.length).toFixed(1);
        return (
          <div key={subject} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">{subject}</h3>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${Number(avg) >= 70 ? 'bg-green-100 text-green-700' : Number(avg) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                Class Avg: {avg}%
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-left px-3 py-2">Student</th>
                    <th className="text-center px-3 py-2">Type</th>
                    <th className="text-center px-3 py-2">Score</th>
                    <th className="text-center px-3 py-2">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subjectMarks.map(m => (
                    <tr key={m._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">{m.student?.name || m.student?.fullName || 'Unknown'}</td>
                      <td className="px-3 py-2 text-center text-gray-500">{m.assessmentType}</td>
                      <td className="px-3 py-2 text-center font-semibold text-purple-700">{m.score}/{m.maxScore}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-semibold ${(m.score/m.maxScore)*100 >= 70 ? 'text-green-600' : (m.score/m.maxScore)*100 >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {((m.score / m.maxScore) * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
