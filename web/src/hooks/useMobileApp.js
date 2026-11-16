import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export function useMobileApp() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Configure native status bar if running inside Android app
    try {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#4f46e5' }).catch(() => {});
    } catch {
      // Ignored if not running natively
    }

    // Android hardware back button handler
    let backListener;
    try {
      backListener = CapApp.addListener('backButton', () => {
        const rootPaths = ['/', '/login', '/admin', '/teacher', '/student', '/parent', '/registrar'];
        if (rootPaths.includes(location.pathname)) {
          CapApp.exitApp();
        } else {
          navigate(-1);
        }
      });
    } catch {
      // Ignored if not running natively
    }

    return () => {
      if (backListener && typeof backListener.then === 'function') {
        backListener.then((listener) => listener.remove?.()).catch(() => {});
      }
    };
  }, [location.pathname, navigate]);
}
