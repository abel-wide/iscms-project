import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';

export default function StudentOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [gradesRes, attRes, annRes] = await Promise.all([
          API.get(`/grades/student/${user.id}`).catch(() => ({ data: {} })),
          API.get(`/attendance/student/${user.id}`).catch(() => ({ data: {} })),
          API.get('/announcements/active').catch(() => ({ data: { announcements: [] } }))
        ]);

        if (!cancelled) {
          setGrades(gradesRes.data);
          setAttendance(attRes.data);
          setAnnouncements(annRes.data.announcements || []);
        }
      } catch (err) {
        console.error('Failed to load student overview:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const subjectSummary = grades?.subjectSummary || [];
  
  // 1. የሁሉንም ውጤቶች ድምር (ከ600 የተገኘው)
  const totalMarks = subjectSummary.reduce((sum, s) => sum + s.average, 0);
  
  // 2. አማካይ ውጤት (ከ100 የተገኘው) - ድምሩን ለትምህርት አይነቶች ቁጥር ከፍሎ
  const overallAverage = subjectSummary.length > 0 
    ? (totalMarks / subjectSummary.length).toFixed(2) 
    : 0;

  const attendanceRate = attendance?.summary?.attendanceRate || '0%';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your academic progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Overall Average (Out of 100)"
          value={`${overallAverage}%`}
          subValue={`Total: ${totalMarks} / ${subjectSummary.length * 100}`}
          color="bg-blue-500"
        />
        <StatCard
          title="Subjects"
          value={subjectSummary.length}
          color="bg-purple-500"
        />
        <StatCard
          title="Attendance"
          value={attendanceRate}
          color="bg-green-500"
        />
        <StatCard
          title="Announcements"
          value={announcements.length}
          color="bg-orange-500"
        />
      </div>

      {/* Grades overview */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-3">📝 Recent Grades</h2>
        {subjectSummary.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            No grades recorded yet.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Score (Out of 100)
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjectSummary.map((s) => (
                  <tr key={s.subject} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{s.subject}</td>
                    {/* 👇 የእያንዳንዱ ትምህርት ውጤት ከ100 */}
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700">
                        {s.average} / 100
                      </span>
                    </td>
                  </tr>
                ))}
                
                {/* 👇 የአጠቃላይ ድምር እና አማካይ ማሳያ ረድፍ */}
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-sm text-right text-gray-700">Total / Overall Average</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-xs text-gray-500">Total: {totalMarks} / {subjectSummary.length * 100}</span>
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Average: {overallAverage} / 100
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Announcements */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3">📢 School Announcements</h2>
        {announcements.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            No announcements.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div
                key={a._id}
                className="bg-white rounded-lg shadow p-4 border-l-4 border-l-blue-500"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-gray-800">{a.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      a.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : a.priority === 'high'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {a.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{a.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  By {a.publishedBy?.fullName} ·{' '}
                  {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// 👇 ስታቲስቲክስ ካርድ (subValue የሚል ተጨማሪ አማራጭ ተጨምሮበታል)
function StatCard({ title, value, subValue, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex flex-col justify-between">
      <div>
        <div className={`w-10 h-10 ${color} rounded-lg mb-3`}></div>
        <div className="text-2xl font-bold text-gray-800">{value ?? 0}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
      {subValue && (
        <div className="text-xs text-gray-400 mt-2 font-medium border-t pt-2 border-gray-100">
          {subValue}
        </div>
      )}
    </div>
  );
}