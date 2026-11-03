import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/useLanguage'; // 👈 ተጨምሯል

export default function LearningHub() {
  const { user } = useAuth();
  const { t } = useLanguage(); // 👈 ተጨምሯል
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const classesRes = await API.get('/classes');
        if (!cancelled) {
          const myClasses = classesRes.data.classes || [];
          setClasses(myClasses);

          if (myClasses.length > 0) {
            setSelectedClass(myClasses[0]._id);
            const resRes = await API.get(`/resources/class/${myClasses[0]._id}`);
            // 👇 በቀን መሰረት ደርቦ (አዲሱ መጀመሪያ) እንዲመጣ ማድረግ
            const sortedResources = (resRes.data.resources || []).sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setResources(sortedResources);
          }
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const handleClassChange = async (classId) => {
    setSelectedClass(classId);
    try {
      const res = await API.get(`/resources/class/${classId}`);
      const sortedResources = (res.data.resources || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setResources(sortedResources);
    } catch (err) {
      console.error(err);
      setResources([]);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await API.get(`/resources/${id}/download`);
      window.open(res.data.url, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;
  }

  // 👇 በአይነት መለየት
  const filtered =
    filterType === 'all'
      ? resources
      : resources.filter((r) => r.type === filterType);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('learningHub') || 'Learning Hub'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Download study materials shared by your teachers
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('class') || 'Class'}
          </label>
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('type') || 'Type'}
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">{t('allTypes') || 'All Types'}</option>
            <option value="PDF">PDF</option>
            <option value="Video">Video</option>
            <option value="Link">Link</option>
            <option value="Note">Note</option>
            <option value="Image">Image</option>
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center text-gray-500 border border-dashed border-gray-300">
          <span className="text-4xl mb-3 block">📂</span>
          {t('noResources') || 'No resources yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r) => (
            <div key={r._id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden group">
              {/* Card Header (Icon & Type) */}
              <div className="p-5 flex items-start justify-between bg-slate-50 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {resourceIcon(r.type)}
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm">
                  {r.type}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{r.title}</h3>
                {r.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{r.description}</p>
                )}
                
                <div className="mt-auto">
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    👨‍🏫 By {r.teacher?.fullName || 'Teacher'} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      ⬇ {r.downloads || 0} {t('downloads') || 'downloads'}
                    </span>
                    <button
                      onClick={() => handleDownload(r._id)}
                      className="text-sm font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      {t('download') || 'Download'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 👇 የአይነት አይኮን
function resourceIcon(type) {
  const icons = {
    PDF: '📄',
    Video: '🎥',
    Link: '🔗',
    Note: '📝',
    Image: '🖼️',
    Audio: '🎵',
    Other: '📦'
  };
  return icons[type] || '📄';
}