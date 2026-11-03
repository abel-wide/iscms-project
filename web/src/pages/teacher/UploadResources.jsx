import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/useLanguage';

export default function UploadResources() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('url'); 
  const [classSearch, setClassSearch] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'PDF',
    url: '',
    classroomId: '',
    subject: ''
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [classesRes, myRes] = await Promise.all([
          API.get('/classes').catch(() => ({ data: { classes: [] } })),
          API.get('/resources/teacher/mine').catch(() => ({ data: { resources: [] } }))
        ]);

        if (!cancelled) {
          const myClasses = (classesRes.data.classes || []).filter(
            (c) => c.homeroomTeacher?._id === user.id
          );
          setClasses(myClasses);
          setResources(myRes.data.resources || []);
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
      const res = await API.get('/resources/teacher/mine');
      setResources(res.data.resources || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (uploadMethod === 'file') {
        if (!file) {
          setMessage({ type: 'error', text: t('selectFileError') || 'Please select a file to upload.' });
          setSaving(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('type', form.type);
        formData.append('classroomId', form.classroomId);
        formData.append('subject', form.subject);

        await API.post('/resources/upload-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await API.post('/resources/upload', form);
      }

      setMessage({ type: 'success', text: t('resourceUploaded') || 'Resource uploaded successfully' });
      setShowForm(false);
      setForm({ title: '', description: '', type: 'PDF', url: '', classroomId: '', subject: '' });
      setFile(null);
      setClassSearch('');
      refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('uploadFailed') || 'Upload failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteResource') || 'Delete this resource?')) return;
    try {
      await API.delete(`/resources/${id}`);
      setMessage({ type: 'success', text: t('deleted') || 'Deleted' });
      refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('failed') || 'Failed' });
    }
  };

  const filteredClasses = classes.filter((c) =>
    c.className.toLowerCase().includes(classSearch.toLowerCase()) ||
    c.gradeLevel?.toLowerCase().includes(classSearch.toLowerCase())
  );

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('uploadResources') || 'Upload Resources'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('uploadResourcesSubtitle') || 'Share PDFs, videos, and links with your students'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors text-white ${showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {showForm ? t('cancel') : `+ ${t('newResource') || 'New Resource'}`}
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 space-y-4">
          <div className="flex gap-4 mb-4 border-b pb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="url" checked={uploadMethod === 'url'} onChange={() => setUploadMethod('url')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">{t('urlLink') || 'URL Link (e.g., YouTube, Google Drive)'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="file" checked={uploadMethod === 'file'} onChange={() => setUploadMethod('file')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">{t('uploadFile') || 'Upload File (from computer)'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('title') || 'Title'}</label>
              <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('type') || 'Type'}</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="PDF">PDF</option>
                <option value="Video">Video</option>
                <option value="Link">Link</option>
                <option value="Note">Note</option>
                <option value="Image">Image</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              {uploadMethod === 'url' ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('url') || 'URL (Google Drive, YouTube, etc.)'}</label>
                  <input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chooseFile') || 'Choose File'}</label>
                  <input required type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                </>
              )}
            </div>

            {/* 👇 የክፍል መምረጫ እና ፍለጋ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('class') || 'Class'}</label>
              <input
                type="text"
                placeholder={t('searchClass') || 'Search class...'}
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <select required value={form.classroomId} onChange={(e) => setForm({ ...form, classroomId: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                {/* 👇 የ "Select Class" አማራጭ ተወግዷል */}
                {filteredClasses.map((c) => (
                  <option key={c._id} value={c._id}>{c.className} ({c.gradeLevel})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('subject') || 'Subject'} ({t('optional') || 'optional'})</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('description') || 'Description'} ({t('optional') || 'optional'})</label>
              <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium">
            {saving ? t('uploading') || 'Uploading...' : t('uploadResource') || 'Upload Resource'}
          </button>
        </form>
      )}

      {/* Resources list */}
      {resources.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center text-gray-500 border border-dashed border-gray-300">
          <span className="text-4xl mb-3 block">📂</span>
          {t('noResourcesUploaded') || 'No resources uploaded yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <div key={r._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">{r.type}</span>
                <button onClick={() => handleDelete(r._id)} className="text-xs text-red-600 hover:text-red-800 hover:underline font-medium">{t('delete') || 'Delete'}</button>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">{r.title}</h3>
              {r.description && <p className="text-sm text-gray-500 mb-3 flex-1">{r.description}</p>}
              <p className="text-xs text-gray-400 mb-4">
                {r.classroom?.className} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-block text-center bg-slate-50 hover:bg-indigo-50 text-indigo-600 font-medium text-sm py-2 rounded-lg transition-colors">
                {t('open') || 'Open'} →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}