import { useMemo, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import PropTypes from 'prop-types';
import { decodeJwt, passwordStrength } from 'utils/jwt';
import AgePromptModal from './AgePromptModal';

const LoginSignupModal = ({ isOpen, onClose, onAuthenticate }) => {
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [name, setName] = useState('');
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const details = isSignup ? { name, email, password, age: age ? Number(age) : undefined } : { email, password };
    await onAuthenticate(details, isSignup);
    // Persist a lightweight profile locally (backend wiring later)
    try {
      const profile = {
        name: isSignup ? name : email.split('@')[0],
        email,
        picture: null,
        age: age ? Number(age) : null,
        provider: 'password',
        updatedAt: Date.now(),
      };
      localStorage.setItem('userProfile', JSON.stringify(profile));
      // notify app that profile is available (treat as logged in for UI)
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: profile }));
      window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { provider: profile.provider } }));
    } catch {/* ignore */}
  };

  const handleGoogleAuth = async (credentialResponse) => {
    try {
      const googleToken = credentialResponse.credential;

      // Decode profile info from ID token and persist locally for UI personalization
      const payload = decodeJwt(googleToken) || {};
      let profile = {
        name: payload.name || payload.given_name || payload.email?.split('@')[0] || 'User',
        email: payload.email || '',
        picture: payload.picture || null,
        // Google does not expose age directly; keep null and we can ask user later
        age: null,
        provider: 'google',
        updatedAt: Date.now(),
      };
      localStorage.setItem('userProfile', JSON.stringify(profile));

      // notify app that profile is available
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: profile }));
      // mark user as logged in for UI purposes even if backend token absent
      window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { provider: 'google' } }));
      // Prefill the auth form inputs (editable by the user)
      try {
        if (profile.name) setName(profile.name);
        if (profile.email) setEmail(profile.email);
      } catch { /* ignore */ }

      // Proceed with backend login/signup in the background (optional)
      // If your backend doesn’t yet implement these endpoints, this will
      // fail quietly without blocking the UI.
      const endpoint = isSignup ? '/auth/google-signup' : '/auth/google-login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.token) {
        localStorage.setItem('userToken', data.token);
        // notify app that user is logged in
        window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { token: data.token } }));

        // If backend JWT already includes age/name, update local profile and skip modal
        const jwtPayload = decodeJwt(data.token) || {};
        const claimedAge = typeof jwtPayload.age === 'number' ? jwtPayload.age : null;
        const claimedName = jwtPayload.name || profile.name;
        if (claimedAge != null) {
          const merged = { ...profile, name: claimedName, age: claimedAge, updatedAt: Date.now() };
          localStorage.setItem('userProfile', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('profile-updated', { detail: merged }));
          // Close the auth modal since we're fully set up
          onClose();
          return;
        }
      } else {
        // Non-blocking notice; the popup is already closed.
        console.warn('Google auth backend call did not succeed:', data);
      }

      // Ask for both (name+age) only if age is still missing
      setPendingProfile(profile);
      setShowAgeModal(true);

    } catch (err) {
      console.error('Google auth error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <GoogleOAuthProvider clientId="77992688871-f1c03ogid6ofcm6jienapoj4gpgunv3d.apps.googleusercontent.com">
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md md:max-w-lg border border-gray-200">
          <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-4 text-center">{isSignup ? 'Create an Account' : 'Welcome Back'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                  required
                />
              </div>
            )}
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Your Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">We’ll use age to tailor games and chat difficulty.</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                required
              />
              {isSignup && (
                <PasswordMeter password={password} />
              )}
            </div>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {isSignup ? 'Already have an account? Log In' : 'Don’t have an account? Sign Up'}
              </button>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  {isSignup ? 'Sign Up' : 'Log In'}
                </button>
              </div>
            </div>
          </form>
          <div className="mt-4">
            <GoogleLogin
              onSuccess={handleGoogleAuth}
              onError={() => alert('Google authentication failed')}
              useOneTap
              className="w-full flex justify-center"
            />
          </div>
          </div>
        </div>
      </div>

      {/* Age/Name prompt modal for Google auth flow */}
      <AgePromptModal
        isOpen={showAgeModal}
        defaultName={pendingProfile?.name || ''}
        defaultAvatar={pendingProfile?.picture || ''}
        onSave={async ({ name: newName, age: newAge }) => {
          try {
            // Merge and persist locally
            const merged = { ...(pendingProfile || {}), name: newName, age: newAge, updatedAt: Date.now() };
            localStorage.setItem('userProfile', JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent('profile-updated', { detail: merged }));

            // Persist to backend if token available and refresh JWT
            const userToken = localStorage.getItem('userToken');
            if (userToken) {
              const upd = await fetch('/auth/update_profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
                body: JSON.stringify({ age: newAge, name: newName }),
              });
              const updData = await upd.json().catch(() => ({}));
              if (upd.ok && updData?.token) {
                localStorage.setItem('userToken', updData.token);
                window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { token: updData.token } }));
              }
            }
          } catch (e) {
            console.warn('Failed to persist profile:', e);
          } finally {
            setShowAgeModal(false);
            setPendingProfile(null);
            onClose();
          }
        }}
        onCancel={() => {
          setShowAgeModal(false);
          setPendingProfile(null);
          // Close the auth modal; user can continue without age if they choose
          onClose();
        }}
      />
    </GoogleOAuthProvider>
  );
};

export default LoginSignupModal;

LoginSignupModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAuthenticate: PropTypes.func.isRequired,
};

function PasswordMeter({ password }) {
  const s = useMemo(() => passwordStrength(password), [password]);
  const percent = Math.min(100, (s.score / 5) * 100);
  const color = percent > 75 ? 'bg-emerald-500' : percent > 50 ? 'bg-yellow-500' : 'bg-rose-500';
  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-gray-200 rounded">
        <div className={`h-2 ${color} rounded`} style={{ width: `${percent}%` }} />
      </div>
      <div className="text-xs text-gray-600 mt-1">Strength: {s.label}</div>
    </div>
  );
}

PasswordMeter.propTypes = {
  password: PropTypes.string,
};
