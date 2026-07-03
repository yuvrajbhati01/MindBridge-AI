import { useLocation } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';

const ROUTE_NAMES: Record<string, string> = {
  '/':          'Patient Chat',
  '/dashboard': 'Therapist Dashboard',
  '/history':   'Session History',
};

export default function Navbar() {
  const location = useLocation();
  const routeName = ROUTE_NAMES[location.pathname] || 'TheraAssist AI';

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between h-16 px-6"
      style={{
        background: 'rgba(13, 13, 43, 0.6)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 text-sm">TheraAssist AI</span>
        <span className="text-white/20">/</span>
        <span className="text-white/90 text-sm font-medium">{routeName}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          id="navbar-search"
          className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          id="navbar-notifications"
          className="relative p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary-500 rounded-full animate-pulse-soft" />
        </button>

        {/* User Avatar */}
        <div
          id="navbar-user"
          className="flex items-center gap-2 pl-3 ml-1 border-l border-white/10"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white/80">Dr. Therapist</p>
            <p className="text-[10px] text-white/40">Clinician</p>
          </div>
        </div>
      </div>
    </header>
  );
}
