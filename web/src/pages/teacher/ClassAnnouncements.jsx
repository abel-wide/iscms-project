import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/useLanguage';

export default function ClassAnnouncements() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [classSearch, setClassSearch] = useState(''); // 👈 የክፍል ፍለጋ

  const [form, setForm] = useState({
    title: '',
    message: '',
    priority: 'normal',
    category: 'general',
    classroomId: ''
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [classesRes, annRes] = await Promise.all([
          API.get('/classes').catch(() => ({ data: { classes: [] } })),
          API.get('/announcements').catch(() => ({ data: { announcements: [] } }))
        ]);

        if (!cancelled) {
          const myClasses = (classesRes.data.classes || []).filter(
            (c) => c.homeroomTeacher?._id === user.id
          );
          setClasses(myClasses);
          setAnnouncements(annRes.data.announcements || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [user.id]);

  const refresh = async () => {
    try {
      const res = await API.get('/announcements');
      setAnnouncements(res.data.announcements || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const selectedClass = classes.find((c) => c._id === form.classroomId);
      const messageText = selectedClass
        ? `[${selectedClass.className}] ${form.message}`
        : form.message;

      await API.post('/announcements', {
        title: form.title,
        message: messageText,
        priority: form.priority,
        category: form.category,
        audience: 'all'
      });

      setMessage({ type: 'success', text: t('announcementSent') || 'Announcement sent successfully' });
      setForm({ title: '', message: '', priority: 'normal', category: 'general', classroomId: '' });
      setClassSearch(''); // ፍለጋውን አጽዳ
      refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('announcementFailed') || 'Failed to send announcement' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteAnnouncement') || 'Delete this announcement?')) return;
    try {
      await API.delete(`/announcements/${id}`);
      setMessage({ type: 'success', text: t('deleted') || 'Deleted' });
      refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('failed') || 'Failed to delete' });
    }
  };

  // 👇 በፍለጋ ሳጥኑ መሰረት ክፍሎችን ማጣራት
  const filteredClasses = classes.filter((c) =>
    c.className.toLowerCase().includes(classSearch.toLowerCase()) ||
    c.gradeLevel?.toLowerCase().includes(classSearch.toLowerCase())
  );

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('classAnnouncements') || 'Class Announcements'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('classAnnouncementsSubtitle') || 'Send messages to your students and their parents'}
        </p>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">
            📢 {t('sendNewAnnouncement') || 'Send New Announcement'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('classOptional') || 'Class (optional)'}</label>
              {/* 👇 የክፍል ፍለጋ ሳጥን */}
              <input
                type="text"
                placeholder={t('searchClass') || 'Search class...'}
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
              <select
                value={form.classroomId}
                onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">-- {t('allMyClasses') || 'All my classes'} --</option>
                {filteredClasses.map((c) => (
                  <option key={c._id} value={c._id}>{c.className} ({c.gradeLevel})</option>
                ))}
              </select>
              {classes.length === 0 && (
                <p className="text-xs text-yellow-600 mt-1">{t('notAssignedToClass') || 'You are not assigned to any class yet.'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('title') || 'Title'}</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('titlePlaceholder') || 'e.g., Math Test Next Week'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('message') || 'Message'}</label>
              <textarea
                required
                rows="4"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t('messagePlaceholder') || 'Write your message...'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('priority') || 'Priority'}</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="normal">{t('normal') || 'Normal'}</option>
                  <option value="high">{t('high') || 'High'}</option>
                  <option value="urgent">{t('urgent') || 'Urgent'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('category') || 'Category'}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="general">{t('general') || 'General'}</option>
                  <option value="exam">{t('exam') || 'Exam'}</option>
                  <option value="meeting">{t('meeting') || 'Meeting'}</option>
                  <option value="event">{t('event') || 'Event'}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl font-medium transition-colors flex justify-center items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {t('sending') || 'Sending...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  {t('sendAnnouncement') || 'Send Announcement'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Recent announcements */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> {t('recentAnnouncements') || 'Recent Announcements'}
          </h2>
          {announcements.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
              <span className="text-4xl mb-3 block">📭</span>
              {t('noAnnouncements') || 'No announcements yet.'}
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-auto pr-2">
              {announcements.slice(0, 10).map((a) => (
                <div key={a._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-lg pr-4">{a.title}</h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      a.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      a.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {a.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">{a.message}</p>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      {a.publishedBy?.fullName || 'Teacher'} · {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                    {a.publishedBy?._id === user.id && (
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="text-red-500 hover:text-red-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        {t('delete') || 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}