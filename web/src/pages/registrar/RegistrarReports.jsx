import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function RegistrarReports() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [finance, setFinance] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);

  // 👇 ለModal የሚያገለግሉ ስቴቶች
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'paid', 'pending', 'penalties', 'class'
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

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

  // 👇 የFinance ካርድ ሲነካ ዝርዝሩን አምጣ
  const handleFinanceClick = async (type) => {
    setModalType(type);
    setModalTitle(
      type === 'paid' ? t('paidStudents') || 'Paid Students' :
      type === 'pending' ? t('pendingStudents') || 'Pending Students' :
      t('penaltyStudents') || 'Students with Penalties'
    );
    setShowModal(true);
    setModalLoading(true);

    try {
      // 👇 ሁሉንም የክፍያ መረጃዎች አምጣ
      const res = await API.get('/payments/all');
      const payments = res.data.payments || [];

      let filtered = [];
      if (type === 'paid') {
        filtered = payments.filter(p => p.status === 'paid');
      } else if (type === 'pending') {
        filtered = payments.filter(p => p.status === 'pending');
      } else if (type === 'penalties') {
        filtered = payments.filter(p => p.penalty > 0);
      }

      setModalData(filtered);
    } catch (err) {
      console.error(err);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  // 👇 የClass ካርድ ሲነካ ተማሪዎችን አምጣ
  const handleClassClick = (cls) => {
    setModalType('class');
    setModalTitle(`${cls.className} - ${t('students') || 'Students'}`);
    setModalData(cls.students || []);
    setShowModal(true);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('reports') || 'Reports'}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('reportsSubtitle') || 'System-wide analytics and summaries'}</p>
      </div>

      {/* Finance Summary (Clickable) */}
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
            onClick={() => handleFinanceClick('paid')}
          />
          <MetricCard
            title={t('paid') || 'Paid'}
            value={finance?.summary?.paidCount || 0}
            color="bg-green-500"
            icon="✅"
            onClick={() => handleFinanceClick('paid')}
          />
          <MetricCard
            title={t('pending') || 'Pending'}
            value={finance?.summary?.pendingCount || 0}
            color="bg-amber-500"
            icon="⏳"
            onClick={() => handleFinanceClick('pending')}
          />
          <MetricCard
            title={t('penalties') || 'Penalties'}
            value={`${finance?.summary?.totalPenalties || 0} Birr`}
            color="bg-red-500"
            icon="⚠️"
            onClick={() => handleFinanceClick('penalties')}
          />
        </div>
      </section>

      {/* Classes Overview (Clickable) */}
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
              <div 
                key={c._id} 
                onClick={() => handleClassClick(c)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{c.className}</h3>
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

      {/* 👇 Modal ለዝርዝር መረጃ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{modalTitle}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="text-center py-8 text-gray-500">{t('loading')}</div>
              ) : modalData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('noData') || 'No data available.'}
                </div>
              ) : modalType === 'class' ? (
                // የተማሪዎች ዝርዝር
                <div className="space-y-3">
                  {modalData.map((s) => (
                    <div key={s._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {s.fullName?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{s.fullName}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // የክፍያ ዝርዝር
                <div className="space-y-3">
                  {modalData.map((p) => (
                    <div key={p._id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800">{p.student?.fullName || 'Student'}</p>
                        <p className="text-xs text-gray-500">{p.periodLabel || 'Payment'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">{p.totalAmount} Birr</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {t(p.status) || p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 👇 MetricCard (Clickable & Hover)
function MetricCard({ title, value, color, icon, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-left w-full group"
    >
      <div className={`w-10 h-10 ${color} rounded-lg mb-3 flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{value ?? 0}</div>
      <div className="text-sm text-gray-500 font-medium mt-1">{title}</div>
    </button>
  );
}