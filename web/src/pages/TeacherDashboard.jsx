import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useLanguage } from '../context/useLanguage'; 
import NotificationBell from '../components/NotificationBell';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 👇 ይህ መስመር በጣም አስፈላጊ ነው
  const { language, toggleLanguage, t } = useLanguage(); 

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md bg-white p-0.5">
              <img 
                src="/teacher-logo.png" 
                alt="Teacher" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Wachemo</h2>
              <p className="text-xs text-slate-500 font-medium">Teacher Portal</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
          
          <SidebarLink to="/teacher" icon={<DashboardIcon />} active={location.pathname === '/teacher'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('dashboard')}
          </SidebarLink>
          <SidebarLink to="/teacher/attendance" icon={<AttendanceIcon />} active={location.pathname === '/teacher/attendance'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('markAttendance') || 'Mark Attendance'}
          </SidebarLink>
          <SidebarLink to="/teacher/grades" icon={<GradesIcon />} active={location.pathname === '/teacher/grades'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('enterGrades') || 'Enter Grades'}
          </SidebarLink>
          <SidebarLink to="/teacher/resources" icon={<ResourcesIcon />} active={location.pathname === '/teacher/resources'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('uploadResources') || 'Upload Resources'}
          </SidebarLink>
          <SidebarLink to="/teacher/announcements" icon={<AnnouncementsIcon />} active={location.pathname === '/teacher/announcements'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('classAnnouncements') || 'Class Announcements'}
          </SidebarLink>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              {user?.name?.charAt(0) || 'T'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex-1 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg transition font-medium"
            >
              Password
            </button>
            <button
              onClick={logout}
              className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg transition font-medium"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 h-20 px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-slate-600 hover:text-emerald-600 p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{t('teacherDashboard') || 'Teacher Dashboard'}</h1>
              <p className="text-sm text-slate-500 hidden sm:block">{t('welcomeBack')}, {user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 👇 የማሳወቂያ ደወል */}
            <NotificationBell />

            {/* 👇 የቋንቋ መቀያየሪያ ቁልፍ */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {language === 'en' ? 'አማ' : 'Eng'}
            </button>

            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>
        
        <div className="p-6 md:p-8 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

// --- የሜኑ አማራጭ (Sidebar Link) ኮምፖኔንት ---
function SidebarLink({ to, icon, children, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
        ${active 
          ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
        }
      `}
    >
      <div className={`transition-colors ${active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon}
      </div>
      <span>{children}</span>
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
      )}
    </Link>
  );
}

// --- Icons ---
function DashboardIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
}
function AttendanceIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>;
}
function GradesIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;
}
function ResourcesIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>;
}
function AnnouncementsIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>;
}