import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function StudentApprovals() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStudents = async () => {
      try {
        const res = await API.get('/auth/users?role=student');
        if (!cancelled) {
          setStudents(res.data.users || []);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStudents();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    try {
      const res = await API.get('/auth/users?role=student');
      setStudents(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (student) => {
    setProcessingId(student._id);
    try {
      await API.put(`/auth/users/${student._id}`, {
        isActive: !student.isActive
      });
      setMessage({
        type: 'success',
        text: `${student.fullName} ${t('isNow')} ${!student.isActive ? t('active') : t('inactive')}`
      });
      refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || t('failedToUpdate')
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;
  }

  const pending = students.filter((s) => !s.isActive);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('studentApprovals') || 'Student Approvals'}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('approvalsSubtitle') || 'Approve or deactivate student accounts'}</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
            <span>⚠️</span> {pending.length} {t('studentsPendingApproval') || 'student(s) pending approval'}
          </p>
        </div>
      )}

      {/* Table (Responsive) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">{t('student') || 'Student'}</th>
                <th className="px-6 py-4 hidden md:table-cell">{t('email') || 'Email'}</th>
                <th className="px-6 py-4 text-center">{t('status') || 'Status'}</th>
                <th className="px-6 py-4 text-center">{t('action') || 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    {t('noStudentsFound') || 'No students found.'}
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                          {s.fullName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{s.fullName}</p>
                          {/* በሞባይል ላይ ኢሜይል በዚህ ይታያል */}
                          <p className="text-xs text-slate-500 md:hidden">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">{s.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {s.isActive ? t('active') : t('pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleStatus(s)}
                        disabled={processingId === s._id}
                        className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          s.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {processingId === s._id ? '...' : (s.isActive ? t('deactivate') || 'Deactivate' : t('approve') || 'Approve')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}