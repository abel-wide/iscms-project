import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function StudentApprovals() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'
  const [pendingStudents, setPendingStudents] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [message, setMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [filterGrade, setFilterGrade] = useState('all');

  // Parent Linking Modal state
  const [linkingStudent, setLinkingStudent] = useState(null);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [savingParent, setSavingParent] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes, parentsRes] = await Promise.all([
        API.get('/auth/users?role=student&isActive=false'),
        API.get('/auth/users?role=student&isActive=true'),
        API.get('/auth/users?role=parent')
      ]);

      setPendingStudents(pendingRes.data.users || []);
      setApprovedStudents(approvedRes.data.users || []);
      setParents(parentsRes.data.users || []);
    } catch (err) {
      console.error('Failed to load student approvals data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleToggleStatus = async (student, newStatus) => {
    setProcessingId(student._id);
    try {
      await API.put(`/auth/users/${student._id}`, { isActive: newStatus });
      setMessage({
        type: 'success',
        text: `${student.fullName} ${newStatus ? (t('approvedSuccess') || 'has been approved') : 'has been deactivated'}`
      });
      await fetchAllData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || t('failedToUpdate') || 'Failed to update'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenLinkParent = (student) => {
    setLinkingStudent(student);
    const existingParentId = student.parent?._id || student.parent || '';
    setSelectedParentId(existingParentId);
  };

  const handleSaveParentLink = async (e) => {
    e.preventDefault();
    if (!linkingStudent) return;

    setSavingParent(true);
    try {
      await API.put(`/auth/students/${linkingStudent._id}/parent`, {
        parentId: selectedParentId || 'none'
      });

      setMessage({
        type: 'success',
        text: selectedParentId 
          ? (t('parentLinkedSuccess') || 'Parent linked to student successfully')
          : (t('parentUnlinkedSuccess') || 'Parent unlinked successfully')
      });
      setLinkingStudent(null);
      await fetchAllData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update parent link'
      });
    } finally {
      setSavingParent(false);
    }
  };

  const currentList = activeTab === 'pending' ? pendingStudents : approvedStudents;

  // Grade filter
  const filteredStudents = filterGrade === 'all' 
    ? currentList 
    : currentList.filter(s => s.gradeLevel === filterGrade);

  const gradeLevels = ['all', ...new Set(currentList.map(s => s.gradeLevel).filter(Boolean))];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('studentApprovals') || 'Student Approvals'}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('approvalsSubtitle') || 'Approve or manage student registrations and enrollments'}</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => { setActiveTab('pending'); setFilterGrade('all'); }}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>⏳ {t('pendingApprovals') || 'Pending Approvals'}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            pendingStudents.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {pendingStudents.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('approved'); setFilterGrade('all'); }}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'approved'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>✅ {t('approvedStudents') || 'Active / Approved Students'}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
            {approvedStudents.length}
          </span>
        </button>
      </div>

      {/* Grade Filter */}
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
            {grade === 'all' ? (t('allClasses') || 'All Classes') : grade}
          </button>
        ))}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">{t('student') || 'Student'}</th>
                  <th className="px-6 py-4">{t('gradeLevel') || 'Grade'}</th>
                  <th className="px-6 py-4">{t('linkedParent') || 'Parent'}</th>
                  <th className="px-6 py-4 text-center">{t('action') || 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      {activeTab === 'pending'
                        ? (t('noPendingStudents') || 'No pending students to approve.')
                        : 'No approved students found.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {s.fullName?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{s.fullName}</p>
                            <p className="text-xs text-slate-500">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {s.gradeLevel || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {s.parent ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                              👨‍👦 {s.parent.fullName || s.parent.email || 'Linked'}
                            </span>
                            <button
                              onClick={() => handleOpenLinkParent(s)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenLinkParent(s)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium transition"
                          >
                            + {t('linkParent') || 'Link Parent'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleToggleStatus(s, true)}
                            disabled={processingId === s._id}
                            className="text-xs px-4 py-2 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                          >
                            {processingId === s._id ? '...' : (t('approve') || 'Approve')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(s, false)}
                            disabled={processingId === s._id}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium text-rose-600 hover:bg-rose-50 transition border border-rose-200 disabled:opacity-50"
                          >
                            {processingId === s._id ? '...' : (t('deactivate') || 'Deactivate')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Parent Linking Modal */}
      {linkingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {t('linkParent') || 'Link Parent'}
                </h3>
                <p className="text-xs text-slate-500">
                  ተማሪ: {linkingStudent.fullName} ({linkingStudent.gradeLevel || 'Student'})
                </p>
              </div>
              <button
                onClick={() => setLinkingStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveParentLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('selectParent') || 'Select Parent'}
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- {t('noParentLinked') || 'No Parent Linked (None)'} --</option>
                  {parents.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingParent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {savingParent ? 'Saving...' : 'Save Parent Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setLinkingStudent(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 text-slate-700"
                >
                  {t('cancel') || 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}