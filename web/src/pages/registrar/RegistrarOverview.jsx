import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function RegistrarOverview() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          API.get('/reports/dashboard').catch(() => ({ data: {} })),
          API.get('/auth/users?limit=5').catch(() => ({ data: { users: [] } }))
        ]);
        setStats(statsRes.data);
        setRecentUsers(usersRes.data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 👇 Welcome Header - እንደ ምስሉ */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {t('welcomeBack') || 'Welcome back'}, Admin! 👋
          </h1>
          <p className="text-indigo-100 text-sm md:text-base">
            {t('registrarOverviewSubtitle') || "Here's what's happening at your school today."}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 text-9xl">🏫</div>
      </div>

      {/* 👇 Stats Grid - እንደ ምስሉ (4 ካርዶች) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('totalStudents') || 'Total Students'} 
          value={stats?.users?.students || 0} 
          icon="🎓"
          color="bg-blue-50 text-blue-600 border-blue-100"
          linkTo="/registrar/approvals"
          trend="+5%"
        />
        <StatCard 
          title={t('totalTeachers') || 'Total Teachers'} 
          value={stats?.users?.teachers || 0} 
          icon="👨‍🏫"
          color="bg-emerald-50 text-emerald-600 border-emerald-100"
          linkTo="/admin/teachers"
          trend="+2%"
        />
        <StatCard 
          title={t('attendanceRate') || 'Attendance Rate'} 
          value={stats?.academics?.attendanceRate || '94%'} 
          icon="📅"
          color="bg-purple-50 text-purple-600 border-purple-100"
          linkTo="/admin/attendance"
          trend="+1%"
        />
        <StatCard 
          title={t('marksEntered') || 'Marks Entered'} 
          value={stats?.academics?.marksEntered || 0} 
          icon="🏆"
          color="bg-amber-50 text-amber-600 border-amber-100"
          linkTo="/admin/reports"
          trend="+0%"
        />
      </div>

      {/* 👇 Quick Actions & Recent Activity - እንደ ምስሉ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            ⚡ {t('quickActions') || 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/registrar/approvals" icon="✅" label={t('approveStudents') || 'Approve Students'} color="bg-blue-50 text-blue-600 hover:bg-blue-100" />
            <QuickAction to="/admin/users" icon="👥" label={t('manageUsers') || 'Manage Users'} color="bg-emerald-50 text-emerald-600 hover:bg-emerald-100" />
            <QuickAction to="/admin/classes" icon="🏫" label={t('manageClasses') || 'Manage Classes'} color="bg-purple-50 text-purple-600 hover:bg-purple-100" />
            <QuickAction to="/admin/reports" icon="📊" label={t('viewReports') || 'View Reports'} color="bg-amber-50 text-amber-600 hover:bg-amber-100" />
          </div>
        </div>

        {/* Recent Users */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              👥 {t('recentActivity') || 'Recent Activity'}
            </h2>
            <Link to="/admin/users" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              {t('viewAll') || 'View All'} →
            </Link>
          </div>
          
          {recentUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('noUsersFound') || 'No users found.'}</div>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {u.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{u.fullName}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      u.role === 'student' ? 'bg-emerald-100 text-emerald-700' :
                      u.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {u.role}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
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

// 👇 StatCard (Smart & Clickable)
function StatCard({ title, value, icon, color, linkTo, trend }) {
  return (
    <Link 
      to={linkTo}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group block"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color} border group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
            {trend} ↑
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{value}</div>
        <div className="text-sm font-medium text-gray-500 mt-1">{title}</div>
      </div>
    </Link>
  );
}

// 👇 QuickAction Button
function QuickAction({ to, icon, label, color }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 ${color}`}
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-xs font-bold text-center">{label}</span>
    </Link>
  );
}