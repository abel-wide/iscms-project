import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function StudentApprovals() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [filterGrade, setFilterGrade] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const fetchStudents = async () => {
      try {
        // 👇 ያልተረጋገጡ ተማሪዎችን ብቻ አምጣ
        const res = await API.get('/auth/users?role=student&isActive=false');
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
    return () => { cancelled = true; };
  }, []);

  const refresh = async () => {
    try {
      const res = await API.get('/auth/users?role=student&isActive=false');
      setStudents(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (student) => {
    setProcessingId(student._id);
    try {
      await API.put(`/auth/users/${student._id}`, { isActive: true });
      setMessage({
        type: 'success',
        text: `${student.fullName} ${t('approvedSuccess') || 'has been approved'}`
      });
      refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || t('failedToUpdate') || 'Failed to update'
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  // 👇 በክፍል መሰረት ማጣራት
  const filteredStudents = filterGrade === 'all' 
    ? students 
    : students.filter(s => s.gradeLevel === filterGrade);

  // 👇 ያሉትን የክፍል ደረጃዎች ማውጣት
  const gradeLevels = ['all', ...new Set(students.map(s => s.gradeLevel).filter(Boolean))];

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

      {/* 👇 የክፍል ማጣሪያ */}
      <div className="flex flex-wrap gap-2">
        {gradeLevels.map((grade) => (
          <button
            key={grade}
            onClick={() => setFilterGrade(grade)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filterGrade === grade 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {grade === 'all' ? (t('all') || 'All Classes') : grade}
          </button>
        ))}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">{t('student') || 'Student'}</th>
                <th className="px-6 py-4 hidden md:table-cell">{t('gradeLevel') || 'Grade'}</th>
                <th className="px-6 py-4 text-center">{t('action') || 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    {t('noPendingStudents') || 'No pending students to approve.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                          {s.fullName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{s.fullName}</p>
                          <p className="text-xs text-slate-500 md:hidden">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">{s.gradeLevel || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleApprove(s)}
                        disabled={processingId === s._id}
                        className="text-xs px-4 py-1.5 rounded-lg font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {processingId === s._id ? '...' : (t('approve') || 'Approve')}
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