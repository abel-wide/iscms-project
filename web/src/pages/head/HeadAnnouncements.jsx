import { useState, useEffect } from 'react';
import API from '../../services/api';

export default function HeadAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'all' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchAnnouncements = () => {
    API.get('/announcements')
      .then(r => setAnnouncements(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await API.post('/announcements', {
        title: form.title,
        message: form.message,
        targetRole: form.targetRole === 'all' ? undefined : form.targetRole,
      });
      setSuccess('✅ Announcement sent!');
      setForm({ title: '', message: '', targetRole: 'all' });
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send announcement.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📢 Announcements</h2>

      {/* New Announcement Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Send New Announcement</h3>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mb-3">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-sm mb-3">{success}</div>}
        <form onSubmit={handleSend} className="space-y-3">
          <input
            type="text"
            required
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
            placeholder="Announcement title..."
          />
          <textarea
            required
            rows={3}
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none resize-none"
            placeholder="Announcement message..."
          />
          <div className="flex items-center gap-3">
            <select
              value={form.targetRole}
              onChange={e => setForm({ ...form, targetRole: e.target.value })}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white"
            >
              <option value="all">All Users</option>
              <option value="teacher">Teachers Only</option>
              <option value="student">Students Only</option>
              <option value="parent">Parents Only</option>
              <option value="registrar">Registrars Only</option>
            </select>
            <button
              type="submit"
              disabled={sending}
              className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
            >
              {sending ? 'Sending...' : '📤 Send'}
            </button>
          </div>
        </form>
      </div>

      {/* Announcement List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            No announcements yet.
          </div>
        ) : (
          announcements.map(a => (
            <div key={a._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-800">{a.title}</h4>
                <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600">{a.message}</p>
              {a.targetRole && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                  {a.targetRole}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
