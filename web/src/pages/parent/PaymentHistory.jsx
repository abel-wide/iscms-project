import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function PaymentHistory() {
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
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;

    const fetchHistory = async () => {
      try {
        const res = await API.get(`/payments/student/${selectedChild._id}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
    return () => { cancelled = true; };
  }, [selectedChild]);

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

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

  const payments = data?.payments || [];
  const summary = data?.summary || {};

  // 👇 በተመረጠው ሁኔታ መሰረት ማጣራት
  const filteredPayments = filterStatus 
    ? payments.filter(p => p.status === filterStatus)
    : payments;

  // 👇 ካርዱ ሲነካ ማጣሪያውን የሚቀይር ፈንክሽን
  const handleCardClick = (status) => {
    if (filterStatus === status) {
      setFilterStatus(null); // ተመሳሳይ ከሆነ አጥፋ
    } else {
      setFilterStatus(status);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('paymentHistory') || 'Payment History'}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('allPaymentRecords') || 'All payment records'}</p>
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

      {/* 👇 Summary Cards (Clickable) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard 
          label={t('totalPaid') || 'Total Paid'} 
          value={`${summary.totalPaid || 0} Birr`} 
          color="bg-emerald-500" 
          onClick={() => setFilterStatus(null)}
          isActive={filterStatus === null}
        />
        <SummaryCard 
          label={t('penalties') || 'Penalties'} 
          value={`${summary.totalPenalty || 0} Birr`} 
          color="bg-red-500" 
          onClick={() => handleCardClick('overdue')} // ቅጣት ካለባቸው ጋር ይዛመዳል
          isActive={filterStatus === 'overdue'}
        />
        <SummaryCard 
          label={t('paidCount') || 'Paid Count'} 
          value={summary.paidCount || 0} 
          color="bg-green-500" 
          onClick={() => handleCardClick('paid')}
          isActive={filterStatus === 'paid'}
        />
        <SummaryCard 
          label={t('pending') || 'Pending'} 
          value={summary.pendingCount || 0} 
          color="bg-amber-500" 
          onClick={() => handleCardClick('pending')}
          isActive={filterStatus === 'pending'}
        />
      </div>

      {/* Payments Table */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📜 {t('paymentRecords') || 'Payment Records'}
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
        
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {t('noPaymentRecords') || 'No payment records yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">{t('period') || 'Period'}</th>
                  <th className="px-4 py-3 text-center">{t('amount') || 'Amount'}</th>
                  <th className="px-4 py-3 text-center">{t('penalty') || 'Penalty'}</th>
                  <th className="px-4 py-3 text-center">{t('total') || 'Total'}</th>
                  <th className="px-4 py-3 text-center">{t('date') || 'Date'}</th>
                  <th className="px-4 py-3 text-center">{t('status') || 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.periodLabel}</td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">{p.amount} Birr</td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-red-600">
                      {p.penalty > 0 ? `+${p.penalty}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-slate-800">{p.totalAmount} Birr</td>
                    <td className="px-4 py-3 text-sm text-center text-slate-500">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={p.status} t={t} />
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

// 👇 SummaryCard (Clickable & Hover)
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

// 👇 StatusBadge (የቋንቋ ድጋፍ ያለው)
function StatusBadge({ status, t }) {
  const config = {
    paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('paid') || 'Paid' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: t('pending') || 'Pending' },
    overdue: { bg: 'bg-orange-100', text: 'text-orange-700', label: t('overdue') || 'Overdue' },
    blocked: { bg: 'bg-red-100', text: 'text-red-700', label: t('blocked') || 'Blocked' }
  };
  
  const style = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}