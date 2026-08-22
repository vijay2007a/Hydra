import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export const TopNavBar = () => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Map', path: '/intelligence-map' },
    { label: 'Predict', path: '/predictions' },
    { label: 'Rainfall', path: '/rainfall' },
    { label: 'Urban Intel', path: '/urban-intelligence' },
    { label: 'Protocol', path: '/protocol' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-outline-variant/30 bg-glass-surface backdrop-blur-xl shadow-[0_0_20px_rgba(0,219,231,0.15)] flex justify-between items-center px-margin-desktop py-4 h-[72px]">
      {/* Brand */}
      <NavLink to="/" className="flex items-center gap-4 cursor-pointer group">
        <span 
          className="material-symbols-outlined text-primary-container text-3xl group-hover:scale-110 transition-transform" 
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          water_drop
        </span>
        <span className="font-display-lg text-[24px] tracking-tighter text-primary-container drop-shadow-glow-cyan leading-none">
          HYDROCAST
        </span>
      </NavLink>

      {/* Navigation Links (Desktop) */}
      <nav className="hidden lg:flex items-center gap-8 font-label-caps text-label-caps">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `transition-all duration-200 px-3 py-1.5 rounded-DEFAULT cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-primary-container border-b-2 border-primary-container pb-1 drop-shadow-glow-cyan font-bold bg-surface-bright/20'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-bright/20'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Search & Actions */}
      <div className="flex items-center gap-5">
        {/* Search Bar */}
        <div className="relative hidden xl:block group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary-container transition-colors text-sm">
            search
          </span>
          <input 
            className="bg-absolute-black border border-outline-variant/50 text-on-surface font-data-mono text-data-mono rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-primary-container focus:shadow-[0_0_10px_rgba(0,242,255,0.3)] transition-all w-56 focus:w-64" 
            placeholder="Search coordinates..." 
            type="text"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/intelligence-map?q=${encodeURIComponent(e.target.value.trim())}`);
              }
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            aria-label="Settings" 
            onClick={() => navigate('/protocol')}
            className="text-on-surface-variant hover:text-primary-container transition-colors cursor-pointer active:scale-95 p-2 rounded-full hover:bg-surface-bright/20"
            title="System Settings & Protocol"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
          
          <button 
            aria-label="Notifications" 
            onClick={() => navigate('/intelligence-map')}
            className="text-on-surface-variant hover:text-primary-container transition-colors cursor-pointer active:scale-95 p-2 rounded-full hover:bg-surface-bright/20 relative"
            title="Active Incident Alerts"
          >
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full shadow-[0_0_8px_rgba(255,180,171,0.8)] animate-pulse"></span>
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>

          <div className="w-9 h-9 rounded-full border border-primary-container overflow-hidden ml-1 shadow-[0_0_10px_rgba(0,242,255,0.3)]">
            <img 
              alt="Operator Profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRPikP9Zk-g61ganSQ_coO-HlQx4tQxTV6y0vYAzGaEMx5pOAeIaiKrxpNkTD0gF3JhgFL4LUNXTe-wjMcl-90sR31lLhlj0sRpe9XUp4e4yMZFSSz8LJ1KWnEnDn858LrW6vB6b3YoIkAuxhPzVQ-3vDFqe-MdT4i03jvax51qnT9vqWmVMQU9Lk4y0ZSWCAeEs-1AAP2d9GMQmgrPwcr_ZPWZwB3j9SVPD227TKqi53s03g1Flk4"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
