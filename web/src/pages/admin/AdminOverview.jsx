import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/reports/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. የስታቲስቲክስ ካርዶች (የተሻሻሉ - ሲነኩ ይሄዳሉ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Total Users" 
          value={stats?.users?.total} 
          icon="👥" 
          color="bg-blue-500" 
          hoverColor="group-hover:bg-blue-600" 
          linkTo="/admin/users"
        />
        <StatCard 
          title="Students" 
          value={stats?.users?.students} 
          icon="🎓" 
          color="bg-green-500" 
          hoverColor="group-hover:bg-green-600" 
          linkTo="/admin/students" 
        />
        <StatCard 
          title="Teachers" 
          value={stats?.users?.teachers} 
          icon="👩‍🏫" 
          color="bg-purple-500" 
          hoverColor="group-hover:bg-purple-600" 
          linkTo="/admin/teachers"
        />
        <StatCard 
          title="Classes" 
          value={stats?.academics?.classes} 
          icon="🏫" 
          color="bg-orange-500" 
          hoverColor="group-hover:bg-orange-600" 
          linkTo="/admin/classes"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Attendance" 
          value={stats?.academics?.attendanceRecords} 
          icon="📅" 
          color="bg-indigo-500" 
          hoverColor="group-hover:bg-indigo-600" 
          linkTo="/admin/attendance"
        />
        <StatCard 
          title="Marks Entered" 
          value={stats?.academics?.marksEntered} 
          icon="📝" 
          color="bg-pink-500" 
          hoverColor="group-hover:bg-pink-600" 
          linkTo="/admin/marks"
        />
        <StatCard 
          title="Resources" 
          value={stats?.academics?.resourcesUploaded} 
          icon="📚" 
          color="bg-teal-500" 
          hoverColor="group-hover:bg-teal-600" 
          linkTo="/admin/resources"
        />
        <StatCard 
          title="Fees Collected" 
          value={`${stats?.finance?.totalCollected || 0} Birr`} 
          icon="💰" 
          color="bg-emerald-500" 
          hoverColor="group-hover:bg-emerald-600" 
          linkTo="/admin/payments"
        />
      </div>

      {/* 2. የምስል ክፍል */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-xl group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
        <img
          src="/wachemo-school.jpg"
          alt="Wachemo School Campus"
          className="w-full h-48 sm:h-64 md:h-80 object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Wachemo Community Excellency School</h2>
          <p className="text-gray-200 text-xs md:text-sm">Integrated School Community Management System</p>
        </div>
      </div>

      {/* 3. የፈጣን ተግባራት ክፍል */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
        <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
          <span>⚡</span> Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <QuickAction to="/admin/users" label="Manage Users" icon="👥" color="text-blue-600" bg="bg-blue-50" hoverBg="hover:bg-blue-100" />
          <QuickAction to="/admin/classes" label="Manage Classes" icon="🏫" color="text-orange-600" bg="bg-orange-50" hoverBg="hover:bg-orange-100" />
          <QuickAction to="/admin/reports" label="View Reports" icon="📈" color="text-green-600" bg="bg-green-50" hoverBg="hover:bg-green-100" />
          <QuickAction to="/admin/announcements" label="Announcements" icon="📢" color="text-purple-600" bg="bg-purple-50" hoverBg="hover:bg-purple-100" />
        </div>
      </div>
    </div>
  );
}

// 👇 የስታቲስቲክስ ካርድ (አሁን Link ሆኗል)
function StatCard({ title, value, icon, color, hoverColor, linkTo }) {
  return (
    <Link 
      to={linkTo}
      className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 p-4 md:p-5 border border-gray-100 cursor-pointer flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xl md:text-2xl text-white ${color} ${hoverColor} transition-colors`}>
          {icon}
        </div>
        <div className="text-gray-300 group-hover:text-indigo-500 transition-colors hidden sm:block">
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div>
        <div className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{value ?? 0}</div>
        <div className="text-xs md:text-sm text-gray-500 font-medium mt-1">{title}</div>
      </div>
    </Link>
  );
}

function QuickAction({ to, label, icon, color, bg, hoverBg }) {
  return (
    <Link 
      to={to} 
      className={`${bg} ${hoverBg} p-3 md:p-4 rounded-xl text-center transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md border border-transparent hover:border-gray-200 flex flex-col items-center justify-center gap-1 md:gap-2`}
    >
      <div className={`text-2xl md:text-3xl ${color}`}>{icon}</div>
      <div className={`text-xs md:text-sm font-semibold ${color}`}>{label}</div>
    </Link>
  );
}