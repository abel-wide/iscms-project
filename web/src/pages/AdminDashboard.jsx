import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useLanguage } from '../context/useLanguage';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage(); 

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* 2. Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3 w-full">
             <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md bg-white p-0.5">
              <img 
                src="/admin-logo.png" 
                alt="Admin" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Wachemo</h2>
              <p className="text-xs text-slate-500 font-medium">Admin Portal</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
          
          <SidebarLink to="/admin" icon={<DashboardIcon />} active={location.pathname === '/admin'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('dashboard')}
          </SidebarLink>
          <SidebarLink to="/admin/users" icon={<UsersIcon />} active={location.pathname === '/admin/users'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('manageUsers')}
          </SidebarLink>
          <SidebarLink to="/admin/classes" icon={<ClassesIcon />} active={location.pathname === '/admin/classes'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('manageClasses')}
          </SidebarLink>
          <SidebarLink to="/admin/reports" icon={<ReportsIcon />} active={location.pathname === '/admin/reports'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('reports')}
          </SidebarLink>
          <SidebarLink to="/admin/payments" icon={<PaymentsIcon />} active={location.pathname === '/admin/payments'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('payments')}
          </SidebarLink>
          <SidebarLink to="/admin/announcements" icon={<AnnouncementsIcon />} active={location.pathname === '/admin/announcements'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('announcements')}
          </SidebarLink>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Settings</p>
            <SidebarLink to="/admin/settings" icon={<SettingsIcon />} active={location.pathname === '/admin/settings'} onClick={() => setIsMobileMenuOpen(false)}>
              {t('settings')}
            </SidebarLink>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {user?.name?.charAt(0) || 'A'}
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

      {/* 3. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 h-20 px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-slate-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{t('dashboard')}</h1>
              <p className="text-sm text-slate-500 hidden sm:block">
                  {t('welcomeBack')}, {user?.name}
                </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
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
          ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
        }
      `}
    >
      <div className={`transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon}
      </div>
      <span>{children}</span>
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
      )}
    </Link>
  );
}

// --- የ SVG አዶዎች ---
function DashboardIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
}
function UsersIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>;
}
function ClassesIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>;
}
function ReportsIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>;
}
function PaymentsIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>;
}
function AnnouncementsIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>;
}
function SettingsIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
}