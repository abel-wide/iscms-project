import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';

export default function MyGrades() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all'); // all, Term 1, Term 2, Term 3

  useEffect(() => {
    let cancelled = false;

    const fetchGrades = async () => {
      try {
        const res = await API.get(`/grades/student/${user.id}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error('Failed to load grades:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGrades();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading grades...</div>;
  }

  const marks = data?.marks || [];
  const filtered =
    filter === 'all' ? marks : marks.filter((m) => m.term === filter);

  const subjectSummary = data?.subjectSummary || [];
  
  // 👇 አጠቃላይ ድምርን በትክክል ማስላት (ለምሳሌ 6 ትምህርቶች ካሉ 510 / 600 ያሳያል)
  const totalMarks = subjectSummary.reduce((sum, s) => sum + s.average, 0);
  const totalPossible = subjectSummary.length * 100;
  
  // 👇 አማካይ ውጤት (ከ100)
  const overallAverage = subjectSummary.length > 0 
    ? (totalMarks / subjectSummary.length).toFixed(2) 
    : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Grades</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your complete academic record
          </p>
        </div>

        {/* 👇 የ Term መምረጫ ሳጥን */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
        >
          <option value="all">All Terms</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>
      </div>

      {/* 👇 አጠቃላይ አማካይ ውጤት ማሳያ ካርድ */}
      {subjectSummary.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-md p-6 mb-6 text-white flex justify-between items-center">
          <div>
            <p className="text-indigo-100 font-medium mb-1">Overall Average</p>
            <h2 className="text-4xl font-bold">{overallAverage}%</h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-100">Total Score</p>
            {/* 👇 ድምሩን በትክክል ያሳያል (ለምሳሌ 510 / 600) */}
            <p className="text-xl font-bold">{totalMarks} / {totalPossible}</p>
          </div>
        </div>
      )}

      {/* Subject summary */}
      {subjectSummary.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-3">📊 Subject Averages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subjectSummary.map((s) => (
              <div key={s.subject} className="bg-white rounded-lg shadow p-5 border border-slate-100">
                <h3 className="font-bold text-gray-800 mb-2">{s.subject}</h3>
                <p className="text-3xl font-bold text-indigo-600">
                  {s.average} <span className="text-lg text-gray-400">/ 100</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {s.markCount} assessment(s) recorded
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All marks */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3">
          📝 All Assessments
        </h2>
        {filtered.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            No marks found for this term.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-100">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Assessment
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Term
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const percentage = m.maxScore
                    ? Math.round((m.score / m.maxScore) * 100)
                    : 0;

                  return (
                    <tr key={m._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {m.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">
                        {m.assessmentType}
                        {m.assessmentName && ` — ${m.assessmentName}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {m.term}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700">
                          {percentage} / 100
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}