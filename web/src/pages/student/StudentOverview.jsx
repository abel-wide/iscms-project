import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/useLanguage';

export default function StudentOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
    return () => { cancelled = true; };
  }, [user.id]);

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  const subjectSummary = grades?.subjectSummary || [];
  const totalMarks = subjectSummary.reduce((sum, s) => sum + s.average, 0);
  const overallAverage = subjectSummary.length > 0 ? (totalMarks / subjectSummary.length).toFixed(2) : 0;
  const attendanceRate = attendance?.summary?.attendanceRate || '0%';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 👇 የተማሪው መረጃ እና የክፍል ደረጃ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md shrink-0">
          {user?.name?.charAt(0) || 'S'}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{user?.name || 'Student'}</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            {/* 👇 የክፍል ደረጃ ከ user ነገር */}
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100">
              🎓 {user?.gradeLevel || 'Not Assigned'}
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100">
              {t('student') || 'Student'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('overallAverage') || 'Overall Average'} value={`${overallAverage}%`} subValue={`${t('total') || 'Total'}: ${totalMarks} / ${subjectSummary.length * 100}`} color="bg-blue-500" />
        <StatCard title={t('subjects') || 'Subjects'} value={subjectSummary.length} color="bg-purple-500" />
        <StatCard title={t('attendance') || 'Attendance'} value={attendanceRate} color="bg-emerald-500" />
        <StatCard title={t('announcements') || 'Announcements'} value={announcements.length} color="bg-orange-500" />
      </div>

      {/* Grades overview */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>📝</span> {t('recentGrades') || 'Recent Grades'}
        </h2>
        {subjectSummary.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
            {t('noGradesYet') || 'No grades recorded yet.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-4">{t('subject') || 'Subject'}</th>
                  <th className="px-6 py-4 text-center">{t('score') || 'Score'} ( / 100)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectSummary.map((s) => (
                  <tr key={s.subject} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{s.subject}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700">
                        {s.average} / 100
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="px-6 py-4 text-sm text-right text-gray-700">{t('total') || 'Total'} / {t('overallAverage') || 'Overall Average'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-xs text-gray-500">{t('total') || 'Total'}: {totalMarks} / {subjectSummary.length * 100}</span>
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {t('average') || 'Average'}: {overallAverage} / 100
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
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>📢</span> {t('schoolAnnouncements') || 'School Announcements'}
        </h2>
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
            {t('noAnnouncements') || 'No announcements.'}
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div key={a._id} className="bg-white rounded-xl shadow-sm border-l-4 border-l-indigo-500 p-5 border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800">{a.title}</h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    a.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    a.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {t(a.priority) || a.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{a.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {t('by') || 'By'} {a.publishedBy?.fullName} · {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, subValue, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 ${color} rounded-xl mb-3`}></div>
      <div className="text-2xl font-bold text-gray-800">{value ?? 0}</div>
      <div className="text-sm text-gray-500 font-medium mt-1">{title}</div>
      {subValue && (
        <div className="text-xs text-gray-400 mt-2 font-medium border-t pt-2 border-gray-100">
          {subValue}
        </div>
      )}
    </div>
  );
}