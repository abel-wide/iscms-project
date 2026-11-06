import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function MakePayment() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);

  // 1. Fetch children linked to this parent
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

  // 2. Fetch payment status for the selected child
  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await API.get(`/payments/status/${selectedChild._id}`);
        if (!cancelled) {
          setStatus(res.data);
          setMessage(null);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus(null);
          setMessage({
            type: 'error',
            text: err.response?.data?.message || t('fetchStatusError') || 'Unable to fetch payment status'
          });
        }
      }
    };

    fetchStatus();
    return () => { cancelled = true; };
  }, [selectedChild, t]);

  // 3. Handle Chapa Payment Initiation
  const handleChapaPay = async () => {
    setProcessing(true);
    setMessage(null);

    try {
      const res = await API.post('/payments/chapa/initiate', {
        studentId: selectedChild._id
      });
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || t('paymentInitiationError') || 'Payment initiation failed'
      });
      setProcessing(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('makePayment') || 'Make Payment'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('makePaymentSubtitle') || 'Pay school fees for your child securely via Chapa'}
          </p>
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

      {message && (
        <div className={`px-4 py-3 rounded-xl border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Paid Status */}
      {status && status.status === 'paid' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
          <span className="text-5xl mb-4 block">✅</span>
          <p className="text-emerald-800 font-bold text-xl mb-2">{t('alreadyPaid') || 'Already Paid'}</p>
          <p className="text-sm text-emerald-700">
            {t('receiptNumber') || 'Receipt'}: <span className="font-mono font-bold">{status.payment?.receiptNumber || 'N/A'}</span>
          </p>
        </div>
      )}

      {/* Blocked Status */}
      {status && status.status === 'blocked' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <span className="text-5xl mb-4 block">🚫</span>
          <p className="text-red-800 font-bold text-xl mb-2">{t('paymentBlocked') || 'Payment Blocked'}</p>
          <p className="text-sm text-red-700">
            {/* 👇 ተለዋዋጭ በትክክል ተተክቷል */}
            {t('blockedMessage').replace('{days}', status.daysLate)}
          </p>
        </div>
      )}

      {/* Payment Details */}
      {status && status.status !== 'paid' && status.status !== 'blocked' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Top Bar */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
            <h2 className="text-lg font-bold">{t('paymentDetails') || 'Payment Details'}</h2>
            <p className="text-indigo-100 text-sm mt-1">{t('securePaymentNote') || 'Secure payment powered by Chapa'}</p>
          </div>

          <div className="p-6 md:p-8">
            <dl className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <dt className="text-gray-500 font-medium">{t('period') || 'Period'}</dt>
                <dd className="font-bold text-gray-800">{status.periodLabel || '—'}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <dt className="text-gray-500 font-medium">{t('baseAmount') || 'Base Amount'}</dt>
                <dd className="font-bold text-gray-800">{status.baseAmount} Birr</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <dt className="text-gray-500 font-medium">{t('daysLate') || 'Days Late'}</dt>
                <dd className={`font-bold ${status.daysLate > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {status.daysLate > 0 ? `${status.daysLate} ${t('days') || 'day(s)'}` : t('onTime') || 'On time'}
                </dd>
              </div>
              {status.penalty > 0 && (
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <dt className="text-gray-500 font-medium">{t('penalty') || 'Penalty'}</dt>
                  <dd className="font-bold text-red-600">+{status.penalty} Birr</dd>
                </div>
              )}
              
              <div className="flex justify-between items-center py-4 bg-indigo-50 px-4 rounded-xl mt-4">
                <dt className="font-bold text-indigo-900 text-lg">{t('totalDue') || 'Total Due'}</dt>
                <dd className="font-bold text-2xl text-indigo-600">
                  {status.totalAmount} <span className="text-lg">Birr</span>
                </dd>
              </div>
            </dl>

            {/* Chapa Payment Button */}
            <button
              onClick={handleChapaPay}
              disabled={processing}
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {t('redirecting') || 'Redirecting to Chapa...'}
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                  {/* 👇 ተለዋዋጭ በትክክል ተተክቷል */}
                  {t('payWithChapa').replace('{amount}', status.totalAmount)}
                </>
              )}
            </button>
            
            <p className="text-xs text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              {t('securePayment') || 'Secure payment powered by Chapa. You will be redirected.'}
            </p>
          </div>
        </div>
      )}

      {/* No active payment */}
      {!status && !message && (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
          <span className="text-4xl mb-3 block">💰</span>
          {t('noActivePayment') || "No active payment period for your child's class."}
        </div>
      )}
    </div>
  );
}