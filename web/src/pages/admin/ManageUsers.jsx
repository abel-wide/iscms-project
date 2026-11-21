import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage'; // 👈 ተጨምሯል

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState(null);
  
  // 👇 ንቁ የሆነውን ሮል ለመከታተል (Default: student)
  const [activeTab, setActiveTab] = useState('student');

  const { t } = useLanguage(); // 👈 ተጨምሯል

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    gradeLevel: 'Grade 1'
  });

  // Parent Linking Modal state
  const [linkingStudent, setLinkingStudent] = useState(null);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [savingParent, setSavingParent] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      try {
        const res = await API.get('/auth/users');
        if (!cancelled) {
          setUsers(res.data.users || []);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUsers = async () => {
    try {
      const res = await API.get('/auth/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to refresh users:', err);
    }
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setForm({ fullName: '', email: '', password: '', role: activeTab, gradeLevel: 'Grade 1' }); // 👈 አሁን ባለው Tab መሰረት ይፈጥራል
    setShowForm(true);
    setMessage(null);
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      gradeLevel: user.gradeLevel || 'Grade 1'
    });
    setShowForm(true);
    setMessage(null);
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
      refreshUsers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update parent link'
      });
    } finally {
      setSavingParent(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      if (editingUser) {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await API.put(`/auth/users/${editingUser._id}`, updateData);
        setMessage({ type: 'success', text: 'User updated successfully' });
      } else {
        await API.post('/auth/register', form);
        setMessage({ type: 'success', text: 'User created successfully' });
      }

      setShowForm(false);
      setEditingUser(null);
      setForm({ fullName: '', email: '', password: '', role: 'student' });
      refreshUsers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Operation failed'
      });
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.fullName}?`)) return;

    try {
      await API.delete(`/auth/users/${user._id}`);
      setMessage({ type: 'success', text: 'User deleted' });
      refreshUsers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Delete failed'
      });
    }
  };

  // 👇 በሮል እና በፍለጋ መሰረት ማጣራት
  const filtered = users.filter((u) => {
    const matchesRole = u.role === activeTab;
    const matchesSearch = 
      u.fullName?.toLowerCase().includes(filter.toLowerCase()) ||
      u.email?.toLowerCase().includes(filter.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('manageUsers')}</h1>
          <p className="text-sm text-slate-500">ተጠቃሚዎችን በሮል መሰረት እዚህ ማስተዳደር ይችላሉ።</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          + አዲስ ተጠቃሚ ጨምር
        </button>
      </div>

      {/* 👇 የሮል መለያያ Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('student')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'student' 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          🎓 Students
        </button>
        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'teacher' 
              ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          👩‍🏫 Teachers
        </button>
        <button
          onClick={() => setActiveTab('parent')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'parent' 
              ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          👨‍👩‍👧 Parents
        </button>
        <button
          onClick={() => setActiveTab('registrar')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'registrar' 
              ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          📝 Registrar
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder={t('searchUser') || "Search by name or email..."}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">{t('loading')}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('email')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('role')}</th>
                {activeTab === 'student' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('linkedParent') || 'Parent'}</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'student' ? "6" : "5"} className="px-4 py-8 text-center text-gray-500">
                    በዚህ ምድብ ውስጥ ምንም ተጠቃሚ አልተገኘም።
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                          u.role === 'student' ? 'bg-indigo-500' :
                          u.role === 'teacher' ? 'bg-purple-500' :
                          u.role === 'parent' ? 'bg-amber-500' :
                          'bg-teal-500'
                        }`}>
                          {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="text-sm font-medium block">{u.fullName}</span>
                          {u.gradeLevel && (
                            <span className="text-[11px] text-gray-500 font-medium">{u.gradeLevel}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    {activeTab === 'student' && (
                      <td className="px-4 py-3 text-sm">
                        {u.parent ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                              👨‍👦 {u.parent.fullName || u.parent.email || 'Linked'}
                            </span>
                            <button
                              onClick={() => handleOpenLinkParent(u)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenLinkParent(u)}
                            className="text-xs px-2.5 py-1 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition"
                          >
                            + {t('linkParent') || 'Link Parent'}
                          </button>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm">
                      {u.isActive ? (
                        <span className="text-green-600 text-xs font-medium">● ንቁ</span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">● ያልተንቀሳቀሰ</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => openEditForm(u)}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingUser ? 'ተጠቃሚ አስተካክል' : 'አዲስ ተጠቃሚ ፍጠር'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ፓስወርድ {editingUser && '(ባዶ ከሆነ አይቀየርም)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="student"> ተማሪ (Student)</option>
                  <option value="teacher"> መምህር (Teacher)</option>
                  <option value="parent"> ወላጅ (Parent)</option>
                  <option value="registrar"> ሬጅስትራር (Registrar)</option>
                  <option value="admin"> አድሚን (Admin)</option>
                </select>
              </div>

              {form.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('gradeLevel') || 'Grade Level'}</label>
                  <select
                    value={form.gradeLevel}
                    onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {['KG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg"
                >
                  {editingUser ? 'አስቀምጥ' : 'ፍጠር'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ሰርዝ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Linking Modal */}
      {linkingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- {t('noParentLinked') || 'No Parent Linked (None / Unlink)'} --</option>
                  {users.filter(u => u.role === 'parent').map((p) => (
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
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
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

// 👇 የሮል ባጅ (Role Badge)
function RoleBadge({ role }) {
  const colors = {
    admin: 'bg-purple-100 text-purple-800',
    teacher: 'bg-blue-100 text-blue-800',
    student: 'bg-green-100 text-green-800',
    parent: 'bg-orange-100 text-orange-800',
    registrar: 'bg-indigo-100 text-indigo-800'
  };

  const labels = {
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
    registrar: 'Registrar'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
      {labels[role] || role}
    </span>
  );
}