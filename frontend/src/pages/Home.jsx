import { useEffect } from 'react';

import React, { useState } from 'react';
import Bot from './Bot';
import ChatBot from './ChatBot';
import CarouselComp from '../components/CarouselComp';

const Home = () => {
	 useEffect(() => {
		 // Always play greeting and activate chatbot on mount
		 const audio = new Audio('/assets/chacha-cahaudhary/Greeting.wav');
		 audio.play().then(() => {
			 setTimeout(() => {
				 window.dispatchEvent(new CustomEvent('activate-chatbot-voice', { detail: { message: 'hello' } }));
			 }, 2000);
		 }).catch(() => {
			 // If autoplay is blocked, wait for user gesture
			 const gestureHandler = () => {
				 audio.play();
				 setTimeout(() => {
					 window.dispatchEvent(new CustomEvent('activate-chatbot-voice', { detail: { message: 'hello' } }));
				 }, 2000);
				 window.removeEventListener('click', gestureHandler);
				 window.removeEventListener('keydown', gestureHandler);
			 };
			 window.addEventListener('click', gestureHandler);
			 window.addEventListener('keydown', gestureHandler);
		 });
		 return () => {
			 audio.pause();
			 audio.currentTime = 0;
		 };
	 }, []);
	const [showChat, setShowChat] = useState(false);

	// Redesign: main container is a flex row, left column is flex col (slideshow + text), right is 3D model
	const mainContainerStyle = {
		minHeight: '600px',
		minWidth: '1200px',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '2rem',
		width: '100%',
		height: '100%',
	};

	return (
			<section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-blue-50 to-yellow-200">
				{/* Top right chat button */}
				<button
					className="absolute top-8 right-8 z-20 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition"
					onClick={() => setShowChat(true)}
				>
					Chat
				</button>

				{/* Main redesigned container */}
				<div style={mainContainerStyle}>
					{/* Left column: slideshow + text */}
					<div className="flex flex-col justify-between gap-8" style={{ flex: 1, height: '700px', maxWidth: '600px' }}>
						{/* Slideshow container */}
						<div className="bg-white/80 rounded-3xl shadow-xl flex items-center justify-center" style={{ height: '320px', width: '100%' }}>
							<CarouselComp />
						</div>
						{/* Text container */}
						<div className="bg-white/80 rounded-3xl shadow-xl flex items-center justify-center p-8" style={{ height: '220px', width: '100%' }}>
							<div className="text-center text-lg font-medium">
								<p className='text-3xl font-extrabold text-blue-700 mb-4 drop-shadow-lg text-center'>Welcome to the Ganga Knowledge Portal</p>
								To know more about the holy river Ganga—its history, significance, and beyond—try a conversation with <span className="text-blue-700 font-bold">Chacha Chaudhary</span> by clicking on him.
							</div>
						</div>
					</div>
					{/* Right column: 3D model only */}
					<div className="bg-white/80 rounded-3xl shadow-xl flex items-center justify-center" style={{ flex: 1.2, height: '700px', maxWidth: '700px' }}>
						<Bot />
					</div>
					   {/* Chat side-by-side removed. Only popup modal remains. */}
				</div>

				{/* Chat popup modal */}
				{showChat && (
					<div
						className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
						onClick={e => {
							// Only close if clicking the backdrop, not the modal or its children
							if (e.target === e.currentTarget) setShowChat(false);
						}}
					>
						<div
							className="relative bg-gradient-to-br from-white via-blue-50 to-yellow-50 rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col items-center justify-center p-10 border border-blue-200"
						>
							<button
								className="absolute top-6 right-6 text-3xl font-bold text-gray-400 hover:text-blue-600 transition-all duration-200"
								style={{ background: 'transparent', border: 'none', zIndex: 10 }}
								onClick={() => setShowChat(false)}
								aria-label="Close chat"
							>
								&times;
							</button>
							<div className="w-full h-full flex items-center justify-center">
								<ChatBot />
							</div>
						</div>
					</div>
				)}
			</section>
	);
};

export default Home;
