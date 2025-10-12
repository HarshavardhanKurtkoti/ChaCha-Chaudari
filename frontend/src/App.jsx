import 'regenerator-runtime/runtime';
import React, { useState, Suspense } from 'react';
import { MantineProvider } from '@mantine/core';
import MessageProvider from 'context/MessageProvider';
import { BotStateContext } from 'context/BotState';
import { BrowserRouter as Router } from 'react-router-dom';
// Lazy-load the RouteContainer so framer-motion is not in the initial App bundle
const RouteContainer = React.lazy(() => import('./RouteContainer'));
import bhashini from 'bhashini-translation';
import { AuthorizationToken, userId, ulcaApiKey } from '../config'
const UserDetailsModal = React.lazy(() => import('./components/UserDetailsModal'));
const LoginSignupModal = React.lazy(() => import('./components/LoginSignupModal'));
import { SettingsProvider } from 'context/SettingsContext';
import ScrollToTop from 'components/ScrollToTop';
import RouteSkeleton from 'components/SkullLoader';
import PropTypes from 'prop-types';
import { AuthUIContext } from 'context/AuthUIContext';

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

	const handleSaveUserDetails = async (details) => {
		// Persist locally as profile; do not overwrite JWT
		try {
			const prev = JSON.parse(localStorage.getItem('userProfile') || 'null') || {};
			const profile = { ...prev, ...details, updatedAt: Date.now() };
			localStorage.setItem('userProfile', JSON.stringify(profile));
			window.dispatchEvent(new CustomEvent('profile-updated', { detail: profile }));
			// If JWT exists, update backend as well and refresh token
			const userToken = localStorage.getItem('userToken');
			if (userToken) {
				try {
					const res = await fetch('/auth/update_profile', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
						body: JSON.stringify({ name: profile.name, age: profile.age }),
					});
					const data = await res.json().catch(() => ({}));
					if (res.ok && data?.token) {
						localStorage.setItem('userToken', data.token);
						window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { token: data.token } }));
					}
				} catch {/* ignore */}
			}
		} catch {/* ignore */}
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
