import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function RegistrarReports() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [finance, setFinance] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [finRes, teachRes, classRes] = await Promise.all([
          API.get('/reports/finance/summary').catch(() => ({ data: null })),
          API.get('/reports/teacher/performance').catch(() => ({ data: { performance: [] } })),
          API.get('/classes').catch(() => ({ data: { classes: [] } }))
        ]);

        if (!cancelled) {
          setFinance(finRes.data);
          setTeachers(teachRes.data.performance || []);
          setClasses(classRes.data.classes || []);
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('reports') || 'Reports'}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('reportsSubtitle') || 'System-wide analytics and summaries'}</p>
      </div>

      {/* Finance Summary */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>💰</span> {t('financeSummary') || 'Finance Summary'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t('totalCollected') || 'Total Collected'}
            value={`${finance?.summary?.totalPaid || 0} Birr`}
            color="bg-emerald-500"
            icon="💵"
          />
          <MetricCard
            title={t('paid') || 'Paid'}
            value={finance?.summary?.paidCount || 0}
            color="bg-green-500"
            icon="✅"
          />
          <MetricCard
            title={t('pending') || 'Pending'}
            value={finance?.summary?.pendingCount || 0}
            color="bg-amber-500"
            icon="⏳"
          />
          <MetricCard
            title={t('penalties') || 'Penalties'}
            value={`${finance?.summary?.totalPenalties || 0} Birr`}
            color="bg-red-500"
            icon="⚠️"
          />
        </div>
      </section>

      {/* Classes Overview */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>🏫</span> {t('classesOverview') || 'Classes Overview'}
        </h2>
        {classes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
            {t('noClasses') || 'No classes yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c) => (
              <div key={c._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-800">{c.className}</h3>
                <p className="text-sm text-gray-500">{c.gradeLevel} - {t('section') || 'Section'} {c.section}</p>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>👥 {t('capacity') || 'Capacity'}: {c.capacity}</p>
                  <p>🎓 {t('enrolled') || 'Enrolled'}: {c.students?.length || 0}</p>
                  <p>👩‍🏫 {t('teacher') || 'Teacher'}: {c.homeroomTeacher?.fullName || t('notAssigned')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Teacher Performance */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>👩‍🏫</span> {t('teacherPerformance') || 'Teacher Performance'}
        </h2>
        {teachers.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
            {t('noTeacherActivity') || 'No teacher activity yet.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-4">{t('teacher') || 'Teacher'}</th>
                    <th className="px-4 py-4 text-center">{t('classes') || 'Classes'}</th>
                    <th className="px-4 py-4 text-center">{t('attendance') || 'Attendance'}</th>
                    <th className="px-4 py-4 text-center">{t('marks') || 'Marks'}</th>
                    <th className="px-4 py-4 text-center">{t('resources') || 'Resources'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((t_item) => (
                    <tr key={t_item.teacher.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                            {t_item.teacher.name?.charAt(0).toUpperCase() || 'T'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{t_item.teacher.name}</p>
                            <p className="text-xs text-gray-500">{t_item.teacher.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{t_item.classesAsHomeroom}</td>
                      <td className="px-4 py-3 text-sm text-center">{t_item.attendanceMarked}</td>
                      <td className="px-4 py-3 text-sm text-center">{t_item.marksEntered}</td>
                      <td className="px-4 py-3 text-sm text-center">{t_item.resourcesUploaded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// 👇 MetricCard (Responsive & Hover)
function MetricCard({ title, value, color, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 ${color} rounded-lg mb-3 flex items-center justify-center text-white text-lg`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-800">{value ?? 0}</div>
      <div className="text-sm text-gray-500 font-medium mt-1">{title}</div>
    </div>
  );
}