
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// GTMS-like Header component for the Capstone project
const links = [
	{ link: '/#about', label: 'About' },
	{ link: '/navigation', label: 'Navigation' },
	{ link: '/riverine_ecology', label: 'Ecology' },
	{ link: '/warRoom_museum', label: 'War Room' },
	{ link: '/games', label: 'Games' },
];

const NavBar = ({ isDark = false }) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [profile, setProfile] = useState(null);
		const [loggedIn, setLoggedIn] = useState(false);
		// Avatar load state: error/retry key
		const [avatarError, setAvatarError] = useState(false);
		const [avatarRetryKey, setAvatarRetryKey] = useState(0);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		setMounted(true);
		try {
			const p = JSON.parse(localStorage.getItem('userProfile') || 'null');
			if (p) setProfile(p);
		} catch { /* ignore */ }
			try { setLoggedIn(!!localStorage.getItem('userToken') || !!localStorage.getItem('userProfile')); } catch { setLoggedIn(false); }
	}, []);

	// Sync localStorage changes from other tabs (helps when profile updated elsewhere)
	useEffect(() => {
		const onStorage = (e) => {
			if (e.key === 'userProfile') {
				try {
					setProfile(JSON.parse(e.newValue || 'null'))
				} catch { /* ignore */ }
			}
		}
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);

		// Reset avatar state when profile changes
		useEffect(() => {
			setAvatarError(false);
			setAvatarRetryKey((k) => k + 1);
		}, [profile?.picture]);

		useEffect(() => {
			const onLogin = () => setLoggedIn(true);
			const onLogout = () => {
				// Be defensive: clear any local profile/token that might remain so avatar is removed
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
  
		// Close mobile menu on any route change
		useEffect(() => {
			if (menuOpen) setMenuOpen(false);
			// Smooth-scroll to in-page anchor when hash changes
			if (location.hash) {
				const id = location.hash.replace('#', '');
				// slight delay to ensure target is in DOM
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
			if (hash) {
				return location.pathname === path && location.hash === `#${hash}`;
			}
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

		const openChat = () => {
			navigate('/chat');
		};

	return (
		<header className={`sticky top-0 z-50 transition-colors duration-450 ${isDark ? 'bg-gray-900/95 border-b border-gray-800 text-gray-100' : 'bg-white/95 border-b text-gray-800'}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center gap-2">
					<img
						className="w-8 h-8 cursor-pointer transition-transform duration-300"
						src="https://nmcg.nic.in/images/nmcgGif.gif"
						alt="NMCG"
						loading="lazy"
						onClick={handleLogoClick}
						style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
					/>
					<span className={`font-headline text-lg font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Ganga Knowledge Portal</span>
					</div>
						<nav className="hidden md:flex md:space-x-6 items-center">
										{links.map((link) => (
										<Link
											key={link.label}
											to={link.link}
											onClick={(e) => {
												handleNavClick(link.link)(e);
												// If on another page and navigating to an in-page anchor, ensure we land on root then scroll
												if (location.pathname !== '/' && link.link.startsWith('/#')) {
													navigate('/');
												}
											}}
											aria-current={isActive(link.link) ? 'page' : undefined}
											className={`text-sm font-medium transition-colors ${
												isActive(link.link)
													? 'text-blue-700'
													: isDark ? 'text-gray-300 hover:text-emerald-300' : 'text-gray-600 hover:text-blue-600'
											}`}
										>
											{link.label}
										</Link>
									))}
										{mounted && (
											<div className='flex items-center gap-3'>
												<button
													onClick={openChat}
													className={`text-sm font-medium px-3 py-2 rounded transition-colors duration-300 ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'hover:bg-blue-50 hover:text-blue-700'}`}
												>
													Chat
												</button>
																								<div className='flex items-center gap-3'>
																									<Link to='/account' className={`text-sm font-medium px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-300`}> 
																										{profile?.name ? 'My Account' : 'Account'}
																									</Link>
																										{profile?.picture && !avatarError && (
																											<img
																												key={avatarRetryKey}
																												loading="eager"
																												src={`${profile.picture}${profile.picture.includes('?') ? '&' : '?'}cb=${avatarRetryKey}`}
																												alt={profile.name || 'Profile'}
																												className="w-8 h-8 rounded-full border border-gray-700 object-cover"
																												crossOrigin="anonymous"
																												referrerPolicy="no-referrer"
																												onLoad={() => { /* clear error if previously set */ setAvatarError(false); }}
																												onError={() => {
																												// first attempt: bump retry key to force cache-busted reload; second attempt: show initials
																												if (!avatarError) {
																													setAvatarRetryKey((k) => k + 1);
																													setAvatarError(true);
																												} else {
																													setAvatarError(true);
																												}
																											}}
																											/>
																										)}
																										{(!profile?.picture || avatarError) && (
																											<div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center font-medium">
																												{(profile?.name || 'U').split(' ').map(n=>n[0]||'').slice(0,2).join('').toUpperCase()}
																											</div>
																										)}
																								</div>
											</div>
										)}
								</nav>
					<button
						className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-100 focus:outline-none"
						aria-label="Toggle menu"
						onClick={() => setMenuOpen((v) => !v)}
					>
						<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							{menuOpen ? (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
							) : (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
							)}
						</svg>
					</button>
				</div>
			</div>
			{menuOpen && (
				<div className={`md:hidden border-t shadow-sm ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white'}`}>
					<div className="px-4 py-3 space-y-1">
									{links.map((link) => (
										<Link
											key={link.label}
											to={link.link}
											onClick={(e) => { handleNavClick(link.link)(e); setMenuOpen(false); }}
											aria-current={isActive(link.link) ? 'page' : undefined}
											className={`block px-3 py-2 rounded-md text-sm font-medium ${
												isActive(link.link)
													? (isDark ? 'bg-gray-800 text-emerald-300' : 'bg-blue-50 text-blue-700')
													: (isDark ? 'text-gray-200 hover:bg-gray-800 hover:text-emerald-300' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700')
											}`}
										>
											{link.label}
										</Link>
									))}
						<button
							onClick={() => { openChat(); setMenuOpen(false); }}
							className="block px-3 py-2 rounded-md text-sm font-medium text-left hover:bg-blue-50 hover:text-blue-700"
						>
							Chat
						</button>
						<Link to='/account' onClick={() => setMenuOpen(false)} className='block px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white'>Account</Link>
					</div>
				</div>
			)}
		</header>
	);
};

export default NavBar;
