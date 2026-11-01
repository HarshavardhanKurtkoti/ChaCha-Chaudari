import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'hooks/useTranslation';
import { useAuth } from 'context/AuthContext';
import {
  MessageSquare,
  Compass,
  Waves,
  Landmark,
  Gamepad2,
  User,
  Languages,
  Menu,
  X,
  Sparkles,
  Award
} from 'lucide-react';

const NavBar = ({ isDark = true }) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { to: '/navigation', label: t('nav.navigation') || 'Ghats Radar', icon: Compass },
    { to: '/riverine_ecology', label: t('nav.ecology') || 'Ecology', icon: Waves },
    { to: '/warRoom_museum', label: t('nav.warroom') || 'Museum', icon: Landmark },
    { to: '/games', label: t('nav.games') || 'Quests', icon: Gamepad2 },
  ];

  const toggleLanguage = () => {
    const nextLang = i18n?.language === 'hi' ? 'en' : 'hi';
    if (i18n?.changeLanguage) {
      i18n.changeLanguage(nextLang);
    }
    try {
      localStorage.setItem('i18nextLng', nextLang);
    } catch { /* ignore */ }
  };

  const isActive = (path) => {
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.substring(1);
    }
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pt-4 pointer-events-none transition-all duration-300">
      <div
        className={`pointer-events-auto w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-2xl transition-all duration-500 ${
          scrolled
            ? 'bg-surface-950/85 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
            : 'bg-surface-900/60 backdrop-blur-lg border border-white/8 shadow-lg'
        }`}
      >
        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 group"
          aria-label="SmartGanga Home"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-ganga-600 to-cyan-400 p-0.5 shadow-glow-cyan transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-surface-950 rounded-[10px] flex items-center justify-center overflow-hidden">
              <img
                src="https://nmcg.nic.in/images/nmcgGif.gif"
                alt="NMCG Mascot"
                className="w-7 h-7 object-contain brightness-110"
                loading="eager"
              />
            </div>
            {/* Live pulsating status dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-surface-950"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-ganga-300 bg-clip-text text-transparent">
                SmartGanga
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-ganga-500/15 text-ganga-300 border border-ganga-500/30">
                v2.0
              </span>
            </div>
            <span className="text-[10px] font-sans text-slate-400 -mt-0.5 tracking-wider hidden sm:inline">
              Chacha Chaudhary AI Avatar
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-950/40 p-1 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-white bg-white/10 shadow-sm border border-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-cyan-400 to-ganga-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Language / Profile Controls */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle Pill */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all duration-200"
            title="Toggle Hindi / English"
          >
            <Languages className="w-3.5 h-3.5 text-ganga-400" />
            <span className="uppercase">{i18n?.language === 'hi' ? 'HI' : 'EN'}</span>
          </button>

          {/* Ask Chacha Primary Button */}
          <button
            onClick={() => navigate('/chat')}
            className="relative group overflow-hidden flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-ganga-600 via-cyan-500 to-ganga-600 bg-[length:200%_auto] hover:bg-right text-white text-xs sm:text-sm font-semibold shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageSquare className="w-4 h-4 text-white animate-pulse" />
            <span className="tracking-wide">Ask Chacha</span>
            <Sparkles className="w-3 h-3 text-cyan-200 opacity-80" />
          </button>

          {/* User Profile / Account */}
          <Link
            to="/account"
            className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-surface-950/80 border border-white/10 hover:border-ganga-400/50 text-slate-300 hover:text-white transition-all duration-200 overflow-hidden"
            title={isAuthenticated ? user?.name || 'My Account' : 'Sign In'}
          >
            {user?.picture ? (
              <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-slate-300" />
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-surface-950/80 border border-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="pointer-events-auto md:hidden absolute top-20 left-4 right-4 bg-surface-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-ganga-600/20 text-cyan-300 border border-ganga-500/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => {
                toggleLanguage();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 text-xs text-slate-400 px-3 py-2 rounded-lg bg-white/5"
            >
              <Languages className="w-4 h-4 text-cyan-400" />
              <span>Language: {i18n?.language === 'hi' ? 'Hindi' : 'English'}</span>
            </button>
            <Link
              to="/account"
              onClick={() => setMenuOpen(false)}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Quests & XP</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

NavBar.propTypes = {
  isDark: PropTypes.bool,
};

export default NavBar;
