import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'hooks/useTranslation';

const NavBar = ({ isDark = false }) => {
	const { t } = useTranslation();
	const [menuOpen, setMenuOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [profile, setProfile] = useState(null);
	const [loggedIn, setLoggedIn] = useState(false);
	const [avatarError, setAvatarError] = useState(false);
	const [avatarRetryKey, setAvatarRetryKey] = useState(0);
	const navigate = useNavigate();
	const location = useLocation();

	const links = [
		{ link: '/#about', label: t('nav.about') },
		{ link: '/navigation', label: t('nav.navigation') },
		{ link: '/riverine_ecology', label: t('nav.ecology') },
		{ link: '/warRoom_museum', label: t('nav.warroom') },
		{ link: '/games', label: t('nav.games') },
	];

	useEffect(() => {
		setMounted(true);
		try {
			const p = JSON.parse(localStorage.getItem('userProfile') || 'null');
			if (p) setProfile(p);
		} catch { /* ignore */ }
		try { setLoggedIn(!!localStorage.getItem('userToken') || !!localStorage.getItem('userProfile')); } catch { setLoggedIn(false); }
	}, []);

	useEffect(() => {
		const onStorage = (e) => {
			if (e.key === 'userProfile') {
				try { setProfile(JSON.parse(e.newValue || 'null')) } catch { /* ignore */ }
			}
		}
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);

	useEffect(() => {
		setAvatarError(false);
		setAvatarRetryKey((k) => k + 1);
	}, [profile?.picture]);

	useEffect(() => {
		const onLogin = () => setLoggedIn(true);
		const onLogout = () => {
			try { localStorage.removeItem('userToken'); localStorage.removeItem('userProfile'); } catch (e) { /* ignore */ }
			setLoggedIn(false);
			setProfile(null);
		};
		const onProfile = (e) => { setProfile(e.detail); setLoggedIn(true); };
		window.addEventListener('user-logged-in', onLogin);
		window.addEventListener('user-logged-out', onLogout);
		window.addEventListener('profile-updated', onProfile);
		return () => {
			window.removeEventListener('user-logged-in', onLogin);
			window.removeEventListener('user-logged-out', onLogout);
			window.removeEventListener('profile-updated', onProfile);
		};
	}, []);

	useEffect(() => {
		if (menuOpen) setMenuOpen(false);
		if (location.hash) {
			const id = location.hash.replace('#', '');
			setTimeout(() => {
				const el = document.getElementById(id);
				if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 50);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.pathname, location.hash]);

	const handleLogoClick = () => navigate('/');

	const isActive = (to) => {
		const [path, hash] = to.split('#');
		if (hash) return location.pathname === path && location.hash === `#${hash}`;
		return location.pathname === to;
	};

	const handleNavClick = (to) => (e) => {
		const [path, hash] = to.split('#');
		if (hash) {
			e.preventDefault();
			if (location.pathname !== path) {
				navigate(to);
			} else {
				const el = document.getElementById(hash);
				if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	};

	const openChat = () => navigate('/chat');

	return (
		<header className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md ${isDark ? 'bg-gray-900/80 border-b border-gray-800 text-gray-100' : 'bg-white/80 border-b border-gray-200/50 text-gray-800'}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center gap-3">
						<img
							className="w-9 h-9 cursor-pointer hover:scale-110 transition-transform duration-300"
							src="https://nmcg.nic.in/images/nmcgGif.gif"
							alt="NMCG"
							loading="lazy"
							onClick={handleLogoClick}
							style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
						/>
						<span className={`font-headline text-lg font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
							{t('nav.title')}
						</span>
					</div>

					<nav className="hidden md:flex md:space-x-1 items-center">
						{links.map((link) => (
							<Link
								key={link.label}
								to={link.link}
								onClick={(e) => {
									handleNavClick(link.link)(e);
									if (location.pathname !== '/' && link.link.startsWith('/#')) navigate('/');
								}}
								className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.link)
										? 'text-blue-600 bg-blue-50/50'
										: isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
									}`}
							>
								{link.label}
							</Link>
						))}

						{mounted && (
							<div className='flex items-center gap-3 ml-4 pl-4 border-l border-gray-200/20'>
								<button
									onClick={openChat}
									className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 shadow-sm hover:shadow-md ${isDark
											? 'bg-emerald-600 text-white hover:bg-emerald-500'
											: 'bg-white text-blue-600 border border-blue-100 hover:border-blue-200 hover:bg-blue-50'
										}`}
								>
									{t('nav.chat')}
								</button>

								<Link
									to='/account'
									className={`flex items-center gap-2 text-sm font-medium px-1 py-1 pr-3 rounded-full transition-all duration-300 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
										}`}
								>
									{profile?.picture && !avatarError ? (
										<img
											key={avatarRetryKey}
											src={`${profile.picture}${profile.picture.includes('?') ? '&' : '?'}cb=${avatarRetryKey}`}
											alt={profile.name}
											className="w-8 h-8 rounded-full border border-gray-200 object-cover"
											crossOrigin="anonymous"
											onLoad={() => setAvatarError(false)}
											onError={() => { if (!avatarError) { setAvatarRetryKey(k => k + 1); setAvatarError(true); } else setAvatarError(true); }}
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
											{(profile?.name || 'U').split(' ').map(n => n[0] || '').slice(0, 2).join('').toUpperCase()}
										</div>
									)}
									<span className={isDark ? 'text-gray-200' : 'text-gray-700'}>
										{profile?.name ? t('nav.myAccount') : t('nav.account')}
									</span>
								</Link>
							</div>
						)}
					</nav>

					<button
						className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none"
						onClick={() => setMenuOpen((v) => !v)}
					>
						<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							{menuOpen ? (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							) : (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							)}
						</svg>
					</button>
				</div>
			</div>

			{menuOpen && (
				<div className={`md:hidden border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
					<div className="px-4 py-3 space-y-1">
						{links.map((link) => (
							<Link
								key={link.label}
								to={link.link}
								onClick={(e) => { handleNavClick(link.link)(e); setMenuOpen(false); }}
								className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.link)
										? 'bg-blue-50 text-blue-600'
										: isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'
									}`}
							>
								{link.label}
							</Link>
						))}
						<button
							onClick={() => { openChat(); setMenuOpen(false); }}
							className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
						>
							{t('nav.chat')}
						</button>
						<Link
							to='/account'
							onClick={() => setMenuOpen(false)}
							className='block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white mt-4 text-center'
						>
							{t('nav.account')}
						</Link>
					</div>
				</div>
			)}
		</header>
	);
};

export default NavBar;
