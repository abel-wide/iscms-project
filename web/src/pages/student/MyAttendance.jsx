import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/useLanguage'; // 👈 ተጨምሯል

export default function MyAttendance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const { t } = useLanguage(); // 👈 ተጨምሯል

  useEffect(() => {
    let cancelled = false;

    const fetchAttendance = async () => {
      try {
        const res = await API.get(`/attendance/student/${user.id}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error('Failed to load attendance:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAttendance();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;
  }

  const summary = data?.summary || {};
  const records = data?.records || [];

  const statusConfig = {
    present: { label: t('present'), color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-100' },
    absent: { label: t('absent'), color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-100' },
    late: { label: t('late'), color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-100' },
    excused: { label: t('excused'), color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-100' },
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('myAttendance')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your attendance history and rate
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title={t('total')}
          value={summary.total || 0}
          color="bg-slate-700"
          onClick={() => setSelectedRecord(null)}
        />
        <StatCard
          title={t('present')}
          value={summary.present || 0}
          color="bg-green-500"
          onClick={() => setSelectedRecord('present')}
        />
        <StatCard
          title={t('absent')}
          value={summary.absent || 0}
          color="bg-red-500"
          onClick={() => setSelectedRecord('absent')}
        />
        <StatCard
          title={t('late')}
          value={summary.late || 0}
          color="bg-yellow-500"
          onClick={() => setSelectedRecord('late')}
        />
        <StatCard
          title={t('excused')}
          value={summary.excused || 0}
          color="bg-blue-500"
          onClick={() => setSelectedRecord('excused')}
        />
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            📅 {t('attendanceHistory')}
          </h2>
          {selectedRecord && (
            <button 
              onClick={() => setSelectedRecord(null)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span className="text-lg">×</span> {t('showAll')}
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4">{t('day')}</th>
                <th className="px-6 py-4">{t('class')}</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4 text-right">{t('details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records
                .filter((r) => !selectedRecord || r.status === selectedRecord)
                .map((r) => {
                  const dateObj = new Date(r.date);
                  const status = statusConfig[r.status] || statusConfig.present;
                  
                  return (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {r.className || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.color}`}></span>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {t('viewDetails')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              
              {records.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    {t('noAttendanceRecords')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRecord && typeof selectedRecord === 'object' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">{t('attendanceDetails')}</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('date')}</p>
                <p className="text-lg font-bold text-slate-800">
                  {new Date(selectedRecord.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('status')}</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${statusConfig[selectedRecord.status]?.bg} ${statusConfig[selectedRecord.status]?.text}`}>
                  {statusConfig[selectedRecord.status]?.label}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('class')}</p>
                <p className="text-md font-bold text-slate-800">{selectedRecord.className || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('remarks')}</p>
                <p className="text-sm text-slate-600">{selectedRecord.remark || t('noRemarks')}</p>
              </div>
            </div>
            <button onClick={() => setSelectedRecord(null)} className="w-full mt-6 bg-slate-800 text-white py-2.5 rounded-xl font-medium">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-left w-full group focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
    >
      <div className={`w-10 h-10 ${color} rounded-lg mb-3 group-hover:scale-110 transition-transform`}></div>
      <div className="text-2xl font-bold text-gray-800">{value ?? 0}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </button>
  );
}