import 'regenerator-runtime/runtime';
import React, { useState, Suspense, createContext, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MantineProvider } from '@mantine/core';
import MessageProvider from 'context/MessageProvider';
import { BotStateContext } from 'context/BotState';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
const Home = React.lazy(() => import('pages/Home'));
const Navigation = React.lazy(() => import('pages/Navigation'));
const Games = React.lazy(() => import('pages/Games'));
const RiverineEcology = React.lazy(() => import('pages/RiverineEcology'));
const WarRoom_museum = React.lazy(() => import('pages/WarRoom_museum'));
const Chat = React.lazy(() => import('pages/Chat'));
const Account = React.lazy(() => import('pages/Account'));
import bhashini from 'bhashini-translation';
import { AuthorizationToken, userId, ulcaApiKey } from '../config'
const UserDetailsModal = React.lazy(() => import('./components/UserDetailsModal'));
const LoginSignupModal = React.lazy(() => import('./components/LoginSignupModal'));
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import { SettingsProvider } from 'context/SettingsContext';
import ScrollToTop from 'components/ScrollToTop';
import RouteSkeleton from 'components/SkullLoader';
import ScrollToTopButton from 'components/ScrollToTopButton';
import PropTypes from 'prop-types';
import { AuthUIContext } from 'context/AuthUIContext';

const RouteDirectionContext = createContext('forward');

const App = () => {
	const [botState, setBotState] = useState('idle');
	const [showModal, setShowModal] = useState(false);
	const [showLoginSignupModal, setShowLoginSignupModal] = useState(false);

	React.useEffect(() => {
		// Show modal if no user token in localStorage
		const userToken = localStorage.getItem('userToken');
		if (!userToken) {
			setShowLoginSignupModal(true);
		}
	}, []);

	const handleSaveUserDetails = (details) => {
		// Save details as a token (simple base64 for demo)
		const token = btoa(JSON.stringify(details));
		localStorage.setItem('userToken', token);
	};

	const handleLoginSignup = async (details, isSignup) => {
		const endpoint = isSignup ? '/auth/register' : '/auth/login';
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(details),
		});
		const data = await response.json();
		if (response.ok) {
			localStorage.setItem('userToken', data.token);
			setShowLoginSignupModal(false);
		} else {
			alert(data.error || 'Failed to authenticate');
		}
	};

	const token = AuthorizationToken;
	const user_Id = userId;
	const apiKey = ulcaApiKey;
	bhashini.auth(user_Id, apiKey, token);
		return (
			<MessageProvider>
				<BotStateContext.Provider value={{ botState, setBotState }} >
					<MantineProvider
						withGlobalStyles
						withNormalizeCSS
						theme={{
							fontFamily: 'Poppins',
							headings: { fontFamily: 'Greycliff CF, sans-serif' }
						}}>
							<AuthUIContext.Provider value={{
								openLoginModal: () => setShowLoginSignupModal(true),
								closeLoginModal: () => setShowLoginSignupModal(false),
							}}>
								<SettingsProvider>
									<Router>
										<ScrollToTop />
										<Suspense fallback={<RouteSkeleton /> }>
											<RouteContainer />
										</Suspense>
									</Router>
								</SettingsProvider>
								<Suspense fallback={null}>
								<UserDetailsModal
									isOpen={showModal}
									onClose={() => setShowModal(false)}
									onSave={handleSaveUserDetails}
								/>
								</Suspense>
								<Suspense fallback={null}>
								<LoginSignupModal
									isOpen={showLoginSignupModal}
									onClose={() => setShowLoginSignupModal(false)}
									onAuthenticate={handleLoginSignup}
								/>
								</Suspense>
							</AuthUIContext.Provider>
					</MantineProvider>
				</BotStateContext.Provider>
			</MessageProvider>
		);
};

export default App;

// Page transition container
const RouteContainer = () => {
	const location = useLocation();
	// Detect navigation direction using history index.
	const lastIndexRef = useRef(window.history.state?.idx ?? 0);
	const currentIndex = window.history.state?.idx ?? 0;
	const direction = currentIndex >= lastIndexRef.current ? 'forward' : 'back';
	lastIndexRef.current = currentIndex;

	const ctx = useMemo(() => direction, [direction]);

	// Determine if the current route should use dark header/footer styling
	const isGames = location.pathname.startsWith('/games') || location.pathname === '/chat' || location.pathname === '/account';

	return (
		<RouteDirectionContext.Provider value={ctx}>
				<div className="min-h-screen flex flex-col">
					{/* Pass dark-mode flag to NavBar/Footer when on /games or /chat */}
					<NavBar isDark={isGames} />
				<main className="flex-1 overflow-x-hidden">
					<AnimatePresence mode="wait">
							<Routes location={location} key={location.pathname}>
							<Route path='/' element={<Page><Home /></Page>} />
							<Route path='/home' element={<Page><Home /></Page>} />
							<Route path='/navigation' element={<Page><Navigation /></Page>} />
							<Route path='/riverine_ecology' element={<Page><RiverineEcology /></Page>} />
							<Route path='/warRoom_museum' element={<Page><WarRoom_museum /></Page>} />
							<Route path='/games' element={<Page><Games /></Page>} />
								<Route path='/chat' element={<Page variant="scale"><Chat /></Page>} />
								<Route path='/account' element={<Page><Account /></Page>} />
						</Routes>
					</AnimatePresence>
				</main>
				<Footer isDark={isGames} />
						<ScrollToTopButton />
			</div>
		</RouteDirectionContext.Provider>
	);
};

const Page = ({ children, variant = 'slide' }) => {
	const dir = React.useContext(RouteDirectionContext);
	// Polished transitions: subtle fade + lift + scale for regular pages,
	// and a refined scale+fade for the Chat route.
	const slide = {
		forward: {
			initial: { opacity: 0, y: 12, scale: 0.995 },
			animate: { opacity: 1, y: 0, scale: 1 },
			exit: { opacity: 0, y: -8, scale: 0.995 },
		},
		back: {
			initial: { opacity: 0, y: -12, scale: 0.995 },
			animate: { opacity: 1, y: 0, scale: 1 },
			exit: { opacity: 0, y: 8, scale: 0.995 },
		},
	};

	const scale = {
		forward: {
			initial: { opacity: 0, y: 8, scale: 0.96 },
			animate: { opacity: 1, y: 0, scale: 1 },
			exit: { opacity: 0, y: 8, scale: 0.98 },
		},
		back: {
			initial: { opacity: 0, y: -8, scale: 0.96 },
			animate: { opacity: 1, y: 0, scale: 1 },
			exit: { opacity: 0, y: -8, scale: 0.98 },
		},
	};

	const all = variant === 'scale' ? scale : slide;
	const v = all[dir] || all.forward;
	// Slightly longer duration and gentle cubic-bezier easing for a polished feel
	const TRANS = { duration: 0.52, ease: [0.16, 1, 0.3, 1] };

	return (
		<motion.div
			initial={v.initial}
			animate={v.animate}
			exit={v.exit}
			transition={TRANS}
			className="h-full"
		>
			{children}
		</motion.div>
	);
};

Page.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.string,
};
