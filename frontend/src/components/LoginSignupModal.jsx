import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const LoginSignupModal = ({ isOpen, onClose, onAuthenticate }) => {
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const details = isSignup ? { name, email, password } : { email, password };
    await onAuthenticate(details, isSignup);
  };

  const handleGoogleAuth = async (credentialResponse) => {
    try {
      const googleToken = credentialResponse.credential;

      // Close the popup immediately upon successful Google OAuth response
      // to ensure a snappy UX as requested.
      onClose();
      window.dispatchEvent(
        new CustomEvent('auth-success', { detail: { provider: 'google' } })
      );

      // Proceed with backend login/signup in the background.
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
      } else {
        // Non-blocking notice; the popup is already closed.
        console.warn('Google auth backend call did not succeed:', data);
      }
    } catch (err) {
      console.error('Google auth error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <GoogleOAuthProvider clientId="77992688871-f1c03ogid6ofcm6jienapoj4gpgunv3d.apps.googleusercontent.com">
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-10 border border-gray-300">
          <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">{isSignup ? 'Create an Account' : 'Welcome Back'}</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            {isSignup && (
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
                required
              />
            </div>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-blue-600 hover:text-blue-800 text-lg underline"
              >
                {isSignup ? 'Already have an account? Log In' : 'Don’t have an account? Sign Up'}
              </button>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg"
                >
                  {isSignup ? 'Sign Up' : 'Log In'}
                </button>
              </div>
            </div>
          </form>
          <div className="mt-8">
            <GoogleLogin
              onSuccess={handleGoogleAuth}
              onError={() => alert('Google authentication failed')}
              useOneTap
              className="w-full flex justify-center"
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginSignupModal;