import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function ChildAttendance() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [data, setData] = useState(null);
  
  // 👇 አዲስ ስቴት ለማጣሪያ (Filter)
  const [filterStatus, setFilterStatus] = useState(null); 

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
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchChildren();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedChild) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        const res = await API.get(`/attendance/student/${selectedChild._id}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedChild]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;
  }

  if (children.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
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

  const summary = data?.summary || {};
  const records = data?.records || [];
  
  // 👇 በተመረጠው ሁኔታ መሰረት ማጣራት
  const filteredRecords = filterStatus 
    ? records.filter(r => r.status === filterStatus)
    : records;

  // 👇 ካርዱ ሲነካ ማጣሪያውን የሚቀይር ፈንክሽን
  const handleCardClick = (status) => {
    // ተመሳሳይ ሁኔታ ከተጫነ ማጣሪያውን አጥፋ (ሁሉንም አሳይ)
    if (filterStatus === status) {
      setFilterStatus(null);
    } else {
      setFilterStatus(status);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('childAttendance') || "Child's Attendance"}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('attendanceHistory') || 'Attendance history'}</p>
        </div>

        {children.length > 1 && (
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 sm:hidden">
              {t('selectChild') || 'Select Child'}
            </label>
            <select
              value={selectedChild?._id || ''}
              onChange={(e) => {
                const c = children.find((k) => k._id === e.target.value);
                setSelectedChild(c);
                setFilterStatus(null); // ልጅ ሲቀየር ማጣሪያውን አጽዳ
              }}
              className="w-full sm:w-48 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-medium text-gray-700"
            >
              {children.map((c) => (
                <option key={c._id} value={c._id}>{c.fullName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 👇 Summary Grid (Clickable) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <SummaryCard 
          label={t('total') || 'Total'} 
          value={summary.total || 0} 
          color="bg-slate-700" 
          onClick={() => setFilterStatus(null)} 
          isActive={filterStatus === null}
        />
        <SummaryCard 
          label={t('present') || 'Present'} 
          value={summary.present || 0} 
          color="bg-emerald-500" 
          onClick={() => handleCardClick('present')} 
          isActive={filterStatus === 'present'}
        />
        <SummaryCard 
          label={t('absent') || 'Absent'} 
          value={summary.absent || 0} 
          color="bg-red-500" 
          onClick={() => handleCardClick('absent')} 
          isActive={filterStatus === 'absent'}
        />
        <SummaryCard 
          label={t('late') || 'Late'} 
          value={summary.late || 0} 
          color="bg-amber-500" 
          onClick={() => handleCardClick('late')} 
          isActive={filterStatus === 'late'}
        />
        <SummaryCard 
          label={t('excused') || 'Excused'} 
          value={summary.excused || 0} 
          color="bg-blue-500" 
          onClick={() => handleCardClick('excused')} 
          isActive={filterStatus === 'excused'}
        />
      </div>

      {/* Attendance Rate Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium text-gray-500 mb-1">{t('attendanceRate') || 'Attendance Rate'}</p>
          <p className="text-4xl font-bold text-gray-800">
            {summary.attendanceRate || '0%'}
          </p>
        </div>
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md ${
            parseFloat(summary.attendanceRate) >= 90
              ? 'bg-emerald-500'
              : parseFloat(summary.attendanceRate) >= 75
              ? 'bg-amber-500'
              : 'bg-red-500'
          }`}
        >
          {summary.attendanceRate || '0%'}
        </div>
      </div>

      {/* Records Table */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📅 {t('records') || 'Records'}
            {filterStatus && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({t(filterStatus) || filterStatus})
              </span>
            )}
          </h2>
          {filterStatus && (
            <button 
              onClick={() => setFilterStatus(null)}
              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
            >
              {t('showAll') || 'Show All'}
            </button>
          )}
        </div>
        
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {t('noAttendanceRecords') || 'No attendance records yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t('date') || 'Date'}</th>
                  <th className="px-6 py-4">{t('class') || 'Class'}</th>
                  <th className="px-6 py-4 text-center">{t('status') || 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {r.classroom?.className || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={r.status} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// 👇 SummaryCard (Clickable & Hover Effect)
function SummaryCard({ label, value, color, onClick, isActive }) {
  return (
    <button 
      onClick={onClick}
      className={`rounded-xl border p-4 text-center sm:text-left transition-all duration-300 w-full group focus:outline-none ${
        isActive 
          ? 'bg-slate-50 border-emerald-300 shadow-md ring-2 ring-emerald-500/20' 
          : 'bg-white border-slate-100 hover:shadow-md hover:-translate-y-1'
      }`}
    >
      <div className={`w-3 h-3 ${color} rounded-full mb-3 mx-auto sm:mx-0 group-hover:scale-125 transition-transform`}></div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs font-medium text-gray-500 mt-1">{label}</div>
    </button>
  );
}

// 👇 StatusBadge
function StatusBadge({ status, t }) {
  const config = {
    present: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('present') || 'Present' },
    absent: { bg: 'bg-red-100', text: 'text-red-700', label: t('absent') || 'Absent' },
    late: { bg: 'bg-amber-100', text: 'text-amber-700', label: t('late') || 'Late' },
    excused: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('excused') || 'Excused' }
  };
  
  const style = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}