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
  const { jobs, enquiries } = useAppData();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const counts = useMemo(
    () => ({
      activeJobs: jobs.filter((j) => j.status === 'In progress' || j.status === 'Upcoming').length,
      openEnquiries: enquiries.filter((e) => !['Converted', 'Lost'].includes(e.status)).length,
    }),
    [jobs, enquiries],
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
        <Header title={titleFor(pathname)} user={user} onOpenMenu={() => setMobileOpen(true)} onLogout={handleLogout} />
        <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 pb-28 pt-5 md:px-7 md:pb-10 md:pt-7">
          <Outlet />
        </main>
      </div>
      <MobileTabBar onOpenMenu={() => setMobileOpen(true)} />
    </div>
  );
}
