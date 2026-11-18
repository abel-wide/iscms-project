import { useState, useEffect } from 'react';
import API from '../../services/api';

export default function HeadOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch basic stats from admin-level endpoints
    Promise.allSettled([
      API.get('/users?role=teacher'),
      API.get('/users?role=student'),
      API.get('/users?role=parent'),
      API.get('/classes'),
    ]).then(([teachers, students, parents, classes]) => {
      setStats({
        teachers: teachers.value?.data?.length || teachers.value?.data?.total || '—',
        students: students.value?.data?.length || students.value?.data?.total || '—',
        parents: parents.value?.data?.length || parents.value?.data?.total || '—',
        classes: classes.value?.data?.length || '—',
      });
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Teachers', value: stats?.teachers, icon: '👩‍🏫', color: 'purple' },
    { label: 'Total Students', value: stats?.students, icon: '🎓', color: 'blue' },
    { label: 'Total Parents', value: stats?.parents, icon: '👨‍👩‍👧', color: 'green' },
    { label: 'Active Classes', value: stats?.classes, icon: '🏫', color: 'amber' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">School Overview</h2>
        <p className="text-gray-500 text-sm mt-1">Real-time snapshot of the school's status</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition`}>
            <div className="text-3xl mb-3">{card.icon}</div>
            <p className={`text-2xl font-bold text-${card.color}-600`}>
              {loading ? <span className="animate-pulse">...</span> : card.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'View Reports', href: '/head/reports', icon: '📊' },
            { label: 'Timetables', href: '/head/timetable', icon: '📅' },
            { label: 'Teacher Performance', href: '/head/teachers', icon: '📈' },
            { label: 'Announcements', href: '/head/announcements', icon: '📢' },
          ].map(link => (
            <a key={link.label} href={link.href}
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition text-center">
              <span className="text-2xl">{link.icon}</span>
              <span className="text-xs font-medium text-purple-700">{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
