import { Fragment, useEffect, useState } from 'react';
import greetImg from '../assets/chacha-cahaudhary/chacha.webp';
import LoginSignupModal from '../components/LoginSignupModal';
import PropTypes from 'prop-types';

function GreetingPopup({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="max-w-6xl w-full rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-300 flex flex-col items-center" style={{ maxHeight: '80vh', backdropFilter: 'blur(10px)', background: 'rgba(255, 255, 255, 0.8)' }}>
                <button
                    className="absolute top-6 right-6 text-3xl font-bold text-gray-400 hover:text-blue-400 transition-all duration-200"
                    style={{ background: 'transparent', border: 'none', zIndex: 10 }}
                    onClick={onClose}
                    aria-label="Close greeting"
                >
                    &times;
                </button>
                <div className="w-36 h-36 sm:w-48 sm:h-48 mb-6 rounded-full shadow-lg border-4 border-blue-300 bg-white overflow-hidden flex items-center justify-center">
                    <img src={greetImg} alt="Chacha Chaudhary" loading="lazy" className="w-[115%] h-[108%] object-cover" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 mb-6 text-center">Welcome to Namami Gange Interactive Experience</h1>
                <p className="text-gray-600 text-sm sm:text-base mb-6 text-center">To get started:</p>
                <ul className="text-gray-700 text-sm sm:text-base list-disc list-inside mb-6">
                    <li>Click on the avatar to interact with Chacha Chaudhary.</li>
                    <li>Use the text box to type your questions.</li>
                    <li>Enable your microphone to talk directly to Chacha Chaudhary.</li>
                </ul>
                <p className="text-gray-600 text-sm sm:text-base text-center">Close this popup to begin your journey!</p>
            </div>
        </div>
    );
}
GreetingPopup.propTypes = { onClose: PropTypes.func.isRequired };

function Greeting() {
    const [showPopup, setShowPopup] = useState(true);
    const [showLoginSignupModal, setShowLoginSignupModal] = useState(false);

    // Close any open popups when auth succeeds (Google or email/password)
    useEffect(() => {
        const onAuthSuccess = () => {
            setShowLoginSignupModal(false);
            setShowPopup(false);
        };
        window.addEventListener('auth-success', onAuthSuccess);
        return () => window.removeEventListener('auth-success', onAuthSuccess);
    }, []);

    const handleAuthenticate = async (details, isSignup) => {
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

    return (
        <Fragment>
            {showPopup && (
                <GreetingPopup
                    onClose={() => {
                        setShowPopup(false);
                        setShowLoginSignupModal(true);
                    }}
                />
            )}
            {showLoginSignupModal && (
                <LoginSignupModal
                    isOpen={showLoginSignupModal}
                    onClose={() => setShowLoginSignupModal(false)}
                    onAuthenticate={handleAuthenticate}
                />
            )}
        </Fragment>
    );
}

export default Greeting;
