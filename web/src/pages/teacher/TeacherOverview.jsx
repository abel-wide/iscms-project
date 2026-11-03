import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // 👈 ለClickable
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/useLanguage'; 

export default function TeacherOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [classesRes, announceRes] = await Promise.all([
          API.get('/classes').catch(() => ({ data: { classes: [] } })),
          API.get('/announcements/active').catch(() => ({ data: { announcements: [] } }))
        ]);

        if (!cancelled) {
          const myClasses = (classesRes.data.classes || []).filter(
            (c) => c.homeroomTeacher?._id === user.id
          );
          setClasses(myClasses);
          setAnnouncements(announceRes.data.announcements || []);
        }
      } catch (err) {
        console.error('Failed to load teacher overview:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;
  }

  const totalStudents = classes.reduce(
    (sum, c) => sum + (c.students?.length || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('teacherDashboard') || 'Teacher Dashboard'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('teacherOverviewSubtitle') || 'Overview of your classes and activities'}
        </p>
      </div>

      {/* 👇 ስታቲስቲክስ ካርዶች (Clickable & Hover) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link to="/teacher/attendance" className="block">
          <StatCard 
            title={t('myClasses') || 'My Classes'} 
            value={classes.length} 
            color="bg-blue-500" 
            icon="🏫"
          />
        </Link>
        <Link to="/teacher/grades" className="block">
          <StatCard 
            title={t('totalStudents') || 'Total Students'} 
            value={totalStudents} 
            color="bg-green-500" 
            icon="🎓"
          />
        </Link>
        <Link to="/teacher/announcements" className="block">
          <StatCard 
            title={t('announcements') || 'Announcements'} 
            value={announcements.length} 
            color="bg-orange-500" 
            icon="📢"
          />
        </Link>
      </div>

      {/* My Classes */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>🏫</span> {t('myClasses') || 'My Classes'}
        </h2>
        {classes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
            {t('noClassesAssigned') || 'You are not assigned to any class as homeroom teacher yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-800">{cls.className}</h3>
                <p className="text-sm text-gray-500">
                  {cls.gradeLevel} - Section {cls.section}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1">🎓 {cls.students?.length || 0} {t('students') || 'students'}</span>
                  <span className="flex items-center gap-1">📅 {cls.academicYear}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active announcements */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>📢</span> {t('recentAnnouncements') || 'Recent Announcements'}
        </h2>
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
            {t('noAnnouncements') || 'No active announcements.'}
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div key={a._id} className="bg-white rounded-xl shadow-sm border-l-4 border-l-blue-500 p-4 border border-slate-100">
                <h3 className="font-bold text-gray-800">{a.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {t('by') || 'By'} {a.publishedBy?.fullName} · {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// 👇 አዲሱ ስታቲስቲክስ ካርድ (Hover እና Clickable)
function StatCard({ title, value, color, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-sm text-white`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">{value ?? 0}</div>
      <div className="text-sm text-gray-500 font-medium">{title}</div>
    </div>
  );
}