import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 ለመሄድ የሚያገለግል
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function ParentOverview() {
  const { t } = useLanguage();
  const navigate = useNavigate(); // 👈 ለመሄድ የሚያገለግል
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childData, setChildData] = useState({
    grades: null,
    attendance: null,
    payments: null
  });

  useEffect(() => {
    let cancelled = false;

    const fetchChildren = async () => {
      try {
        const res = await API.get('/auth/my-children');
        if (!cancelled) {
          const kids = res.data.children || [];
          setChildren(kids);
          if (kids.length > 0) setSelectedChild(kids[0]);
        }
      } catch (err) {
        console.error('Failed to load children:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchChildren();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;

    const fetchChildData = async () => {
      try {
        const [gradesRes, attRes, payRes] = await Promise.all([
          API.get(`/grades/student/${selectedChild._id}`).catch(() => ({ data: null })),
          API.get(`/attendance/student/${selectedChild._id}`).catch(() => ({ data: null })),
          API.get(`/payments/student/${selectedChild._id}`).catch(() => ({ data: null }))
        ]);

        if (!cancelled) {
          setChildData({
            grades: gradesRes.data,
            attendance: attRes.data,
            payments: payRes.data
          });
        }
      } catch (err) {
        console.error('Failed to load child data:', err);
      }
    };

    fetchChildData();
    return () => { cancelled = true; };
  }, [selectedChild]);

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  if (children.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('parentDashboard') || 'Parent Dashboard'}</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <span className="text-5xl mb-4 block">🔗</span>
          <p className="text-amber-800 font-bold text-lg mb-2">{t('noChildrenLinked') || 'No children linked to your account'}</p>
          <p className="text-sm text-amber-700">
            {t('contactAdminLinkChild') || "Please contact the school administrator to link your child's account."}
          </p>
        </div>
      </div>
    );
  }

  const overallAvg = childData.grades?.subjectSummary?.length
    ? Math.round(
        (childData.grades.subjectSummary.reduce((sum, s) => sum + s.average, 0) /
          childData.grades.subjectSummary.length) * 100
      ) / 100
    : 0;

  const attendanceRate = childData.attendance?.summary?.attendanceRate || '0%';
  const totalPaid = childData.payments?.summary?.totalPaid || 0;
  const totalPenalty = childData.payments?.summary?.totalPenalty || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('parentDashboard') || 'Parent Dashboard'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('parentOverviewSubtitle') || "Overview of your child's academic progress"}
        </p>
      </div>

      {/* Child Selector & Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md shrink-0">
          {selectedChild?.fullName?.charAt(0) || '?'}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-bold text-gray-800">{selectedChild?.fullName}</h2>
          <p className="text-sm text-gray-500">{selectedChild?.email}</p>
        </div>

        {children.length > 1 && (
          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 text-center md:text-left">
              {t('selectChild') || 'Select Child'}
            </label>
            <select
              value={selectedChild?._id || ''}
              onChange={(e) => {
                const c = children.find((k) => k._id === e.target.value);
                setSelectedChild(c);
              }}
              className="w-full md:w-48 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-medium text-gray-700"
            >
              {children.map((c) => (
                <option key={c._id} value={c._id}>{c.fullName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 👇 Stats Grid (Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('overallAverage') || 'Overall Average'} 
          value={`${overallAvg}%`} 
          color="bg-blue-500" 
          icon="📊" 
          onClick={() => navigate('/parent/grades')} // 👈 ሲነካ ወደ ውጤት ገጽ ይሄዳል
        />
        <StatCard 
          title={t('attendanceRate') || 'Attendance Rate'} 
          value={attendanceRate} 
          color="bg-emerald-500" 
          icon="📅" 
          onClick={() => navigate('/parent/attendance')} // 👈 ሲነካ ወደ ክትትል ገጽ ይሄዳል
        />
        <StatCard 
          title={t('totalPaid') || 'Total Paid'} 
          value={`${totalPaid} Birr`} 
          color="bg-teal-500" 
          icon="💰" 
          onClick={() => navigate('/parent/history')} // 👈 ሲነካ ወደ ክፍያ ታሪክ ገጽ ይሄዳል
        />
        <StatCard 
          title={t('penalties') || 'Penalties'} 
          value={`${totalPenalty} Birr`} 
          color="bg-red-500" 
          icon="⚠️" 
          onClick={() => navigate('/parent/history')} // 👈 ሲነካ ወደ ክፍያ ታሪክ ገጽ ይሄዳል
        />
      </div>

      {/* Summary Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📝</span> {t('recentGrades') || 'Recent Grades'}
          </h3>
          {childData.grades?.subjectSummary?.length > 0 ? (
            <ul className="space-y-3">
              {childData.grades.subjectSummary.slice(0, 5).map((s) => (
                <li key={s.subject} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">{s.subject}</span>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {s.average}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm italic">
              {t('noGradesYet') || 'No grades yet'}
            </div>
          )}
        </section>

        {/* Recent Payments */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💰</span> {t('recentPayments') || 'Recent Payments'}
          </h3>
          {childData.payments?.payments?.length > 0 ? (
            <ul className="space-y-3">
              {childData.payments.payments.slice(0, 5).map((p) => (
                <li key={p._id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">{p.periodLabel || 'Payment'}</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    p.status === 'overdue' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {t(p.status) || p.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm italic">
              {t('noPaymentsYet') || 'No payments yet'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// 👇 StatCard አሁን Clickable ነው
function StatCard({ title, value, color, icon, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left w-full group focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl text-white shadow-sm group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-800 mb-1 group-hover:text-emerald-600 transition-colors">{value ?? 0}</div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
      </div>
    </button>
  );
}