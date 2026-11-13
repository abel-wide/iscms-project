import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useLanguage } from '../context/useLanguage';
import NotificationBell from '../components/NotificationBell';

// ... በ Header ውስጥ
<div className="flex items-center gap-4">
  <NotificationBell />
  {/* የቋንቋ ቁልፍ */}
</div>

export default function RegistrarDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage(); // 👈 አሁን ጥቅም ላይ ይውላሉ
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              📋
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Wachemo</h2>
              <p className="text-xs text-slate-500 font-medium">Registrar Portal</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
          
          {/* 👇 የሜኑ ቃላት በ t() ተተርጉመዋል */}
          <SidebarLink to="/registrar" icon="📊" active={location.pathname === '/registrar'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('dashboard')}
          </SidebarLink>
          <SidebarLink to="/registrar/approvals" icon="✅" active={location.pathname === '/registrar/approvals'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('studentApprovals') || 'Student Approvals'}
          </SidebarLink>
          <SidebarLink to="/registrar/rules" icon="📜" active={location.pathname === '/registrar/rules'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('academicRules') || 'Academic Rules'}
          </SidebarLink>
          <SidebarLink to="/registrar/reports" icon="📈" active={location.pathname === '/registrar/reports'} onClick={() => setIsMobileMenuOpen(false)}>
            {t('reports')}
          </SidebarLink>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user?.name?.charAt(0) || 'R'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPasswordModal(true)} className="flex-1 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg transition font-medium">
              {t('password')}
            </button>
            <button onClick={logout} className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg transition font-medium">
              {t('logout')}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 h-20 px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{t('registrarDashboard') || 'Registrar Dashboard'}</h1>
              <p className="text-sm text-slate-500 hidden sm:block">{t('welcomeBack')}, {user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 👇 የቋንቋ መቀያየሪያ ቁልፍ - አሁን language እና toggleLanguage ጥቅም ላይ ውለዋል */}
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

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}

function SidebarLink({ to, icon, children, active, onClick }) {
  return (
    <Link to={to} onClick={onClick} className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}>
      <span className="text-lg">{icon}</span>
      <span>{children}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
    </Link>
  );
}