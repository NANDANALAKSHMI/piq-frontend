import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import MobileTabBar from './MobileTabBar.jsx';
import { PAGE_TITLES } from './navConfig.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

function titleFor(pathname) {
  const match = PAGE_TITLES.find(([prefix]) => (prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)));
  return match?.[1] ?? 'PIQ';
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { projects, enquiries, notifications } = useAppData();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const counts = useMemo(
    () => ({
      activeProjects: projects.filter((p) => p.status === 'In progress' || p.status === 'Upcoming').length,
      openEnquiries: enquiries.filter((e) => !['Converted', 'Lost'].includes(e.status)).length,
      unreadNotifications: notifications.filter((n) => !n.read).length,
    }),
    [projects, enquiries, notifications],
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        counts={counts}
        user={user}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={titleFor(pathname)} onOpenMenu={() => setMobileOpen(true)} />
        <main className="w-full flex-1 px-4  pt-5 md:px-7  md:pt-7">
          <Outlet />
        </main>
      </div>
      <MobileTabBar onOpenMenu={() => setMobileOpen(true)} />
    </div>
  );
}
