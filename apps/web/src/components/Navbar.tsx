import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Truck,
  Smartphone,
  BarChart3,
  Settings,
  Zap,
  Users,
  AlertOctagon,
  ChevronDown,
  Menu,
  X,
  Award,
  Check,
  Radio,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { NotificationDropdown } from './NotificationDropdown';
import { UserRole } from '@resqgrid/types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentRole, setCurrentRole } = useAuth();
  const { setShowModal } = useDemo();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hackathonModalOpen, setHackathonModalOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/command', label: 'Command', fullLabel: 'Command Center', icon: LayoutDashboard },
    { path: '/incidents', label: 'Incidents', fullLabel: 'Incident Queue', icon: ShieldAlert },
    { path: '/resources', label: 'Resources', fullLabel: 'Resource Grid', icon: Truck },
    { path: '/responder', label: 'Responder', fullLabel: 'Responder MDT', icon: Smartphone },
    { path: '/analytics', label: 'Analytics', fullLabel: 'Analytics & KPIs', icon: BarChart3 },
    { path: '/admin', label: 'Admin', fullLabel: 'System Admin', icon: Settings },
  ];

  const roleConfigs: Record<
    UserRole,
    { label: string; name: string; icon: string; desc: string; color: string }
  > = {
    [UserRole.OPERATOR]: {
      label: 'Operator',
      name: 'Sarah Jenkins',
      icon: '👤',
      desc: 'Command & Dispatch',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    [UserRole.RESPONDER]: {
      label: 'Responder',
      name: 'Capt. Miller',
      icon: '🚒',
      desc: 'Engine 02 MDT',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    [UserRole.CITIZEN]: {
      label: 'Citizen',
      name: 'Lucas Scott',
      icon: '📱',
      desc: 'Public Reporting',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    [UserRole.ADMIN]: {
      label: 'Admin',
      name: 'Dr. Vance',
      icon: '🛡️',
      desc: 'System Configuration',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
  };

  const activeRoleConfig = roleConfigs[currentRole] || roleConfigs[UserRole.OPERATOR];

  return (
    <>
      <header className="sticky top-0 z-[1000] w-full border-b border-slate-800/90 bg-[#090d16]/95 backdrop-blur-md">
        <div className="w-full max-w-[1920px] mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
          {/* Left: Brand & Desktop Navigation */}
          <div className="flex items-center gap-3 xl:gap-6 min-w-0">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.35)] group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#090d16] animate-ping" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-mono">
                    RESQ<span className="text-cyan-400">GRID</span>
                  </span>
                  {/* Hackathon Pill */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setHackathonModalOpen(true);
                    }}
                    title="Click for Hackathon & Author Information"
                    className="hidden sm:inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-950/70 hover:bg-blue-900 border border-blue-500/40 text-cyan-300 transition-colors"
                  >
                    <Award size={10} className="text-yellow-400" />
                    <span>Devengers 2.0</span>
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 hidden 2xl:block truncate max-w-[210px] -mt-0.5">
                  by <strong className="text-slate-300">P. Kailash Sharma</strong>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 shrink-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-950/70 text-cyan-300 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Socket Status Badge */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SOCKET LIVE</span>
            </div>

            {/* Quick Report Emergency Button */}
            <Link
              to="/report"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(239,68,68,0.35)] transition-all hover:scale-102 shrink-0"
              title="Report Emergency"
            >
              <AlertOctagon size={13} />
              <span>Report</span>
            </Link>

            {/* Live Demo Simulation Trigger */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all shrink-0"
              title="Run Live Emergency Demo"
            >
              <Zap size={13} className="text-yellow-300 animate-pulse" />
              <span className="hidden sm:inline">Live Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Role Persona Switcher Dropdown */}
            <div className="relative" ref={roleMenuRef}>
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors shadow-sm"
                title="Switch Evaluation Role"
              >
                <span>{activeRoleConfig.icon}</span>
                <span className="font-medium hidden md:inline">{activeRoleConfig.label}</span>
                <ChevronDown
                  size={12}
                  className={`text-slate-400 transition-transform ${
                    roleDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl p-2 z-[1100] animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1">
                    <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                      Switch Role Persona
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Simulate system access and role-specific views
                    </p>
                  </div>
                  <div className="space-y-1">
                    {(Object.keys(roleConfigs) as UserRole[]).map((roleKey) => {
                      const cfg = roleConfigs[roleKey];
                      const isSelected = currentRole === roleKey;
                      return (
                        <button
                          key={roleKey}
                          onClick={() => {
                            setCurrentRole(roleKey);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-950/60 border border-blue-500/40 text-white'
                              : 'hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{cfg.icon}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-200">
                                  {cfg.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                  {cfg.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">{cfg.desc}</p>
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Dropdown */}
            <div className="shrink-0">
              <NotificationDropdown />
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-[#090d16] px-4 py-3 space-y-2 shadow-2xl">
            <div className="grid grid-cols-2 gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-950/80 text-cyan-300 border border-blue-500/40'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                    <span>{link.fullLabel}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setHackathonModalOpen(true)}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-[11px]"
              >
                <Award size={13} className="text-yellow-400" />
                <span>Hack Devengers 2.0 Credits</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono">v1.0 Production</span>
            </div>
          </div>
        )}
      </header>

      {/* Hackathon Attribution Modal */}
      {hackathonModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0d1527] border border-blue-500/40 p-6 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
            <button
              onClick={() => setHackathonModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                <Award className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  Hackathon Entry
                </span>
                <h3 className="text-lg font-bold text-white">Hack Devengers 2.0</h3>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Lead Architect & Developer
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  POCHIRAJU KAILASH RAM MARKANDEYA SHARMA
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Project Title
                </p>
                <p className="text-white font-medium">
                  ResQGrid — AI-Powered Emergency Intelligence & Response Coordination
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-800/50">
                  <span className="text-slate-400 block text-[10px]">Database</span>
                  <span className="text-cyan-300 font-semibold">Neon DB (PgBouncer)</span>
                </div>
                <div className="p-2 rounded bg-slate-800/50">
                  <span className="text-slate-400 block text-[10px]">File Storage</span>
                  <span className="text-blue-300 font-semibold">AWS S3 Presigned</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setHackathonModalOpen(false)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              Return to Platform
            </button>
          </div>
        </div>
      )}
    </>
  );
};
