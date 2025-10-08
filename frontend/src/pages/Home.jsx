import { useEffect } from 'react';

import React, { useState } from 'react';
import Bot from './Bot';
import ChatBot from './ChatBot';
import CarouselComp from '../components/CarouselComp';
import GreetingPopup from './Greeting';

const Home = () => {
	   useEffect(() => {
		   // Always play greeting and activate chatbot on mount
		   const audio = new Audio('/assets/chacha-cahaudhary/Greeting.wav');
		   let played = false;
		   const playGreeting = () => {
			   if (!played) {
				   played = true;
				   audio.play();
				   setTimeout(() => {
					   window.dispatchEvent(new CustomEvent('activate-chatbot-voice', { detail: { message: 'hello' } }));
				   }, 2000);
				   window.removeEventListener('click', playGreeting);
				   window.removeEventListener('keydown', playGreeting);
			   }
		   };
		   audio.play().then(() => {
			   played = true;
			   setTimeout(() => {
				   window.dispatchEvent(new CustomEvent('activate-chatbot-voice', { detail: { message: 'hello' } }));
			   }, 2000);
		   }).catch(() => {
			   window.addEventListener('click', playGreeting);
			   window.addEventListener('keydown', playGreeting);
		   });
		   return () => {
			   audio.pause();
			   audio.currentTime = 0;
			   window.removeEventListener('click', playGreeting);
			   window.removeEventListener('keydown', playGreeting);
		   };
	   }, []);
	 const [showChat, setShowChat] = useState(false);
	 const [modelTransition, setModelTransition] = useState(false);
	 const [showGreeting, setShowGreeting] = useState(true);

	// Full screen canvas for Bot, positioned with transition
	const botCanvasStyle = {
		position: 'fixed',
		top: 0,
		left: 0,
		width: '100vw',
		height: '100vh',
		pointerEvents: 'none',
		zIndex: 5,
	};

	// Animate Bot from right edge to just left of the right container
	const botModelStyle = modelTransition
		? {
			position: 'absolute',
			top: '48%',
			right: '58vw', // Destination: just left of right container
			transform: 'translateY(-50%)',
			width: '500px',
			height: '600px',
			maxWidth: '500px',
			pointerEvents: 'none',
			transition: 'all 0.7s linear',
			zIndex: 20, // Make model above containers
		}
		: {
			position: 'absolute',
			top: '48%',
			right: '10vw', // Start: right edge
			transform: 'translateY(-50%)',
			width: '500px',
			height: '600px',
			maxWidth: '500px',
			pointerEvents: 'none',
			transition: 'all 0.7s cubic-bezier(0.77,0,0.175,1)',
			zIndex: 20, // Make model above containers
		};

	// Main content container, layered above Bot canvas
	const mainContainerStyle = {
		position: 'relative',
		zIndex: 2, // Lower than bot model
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

	// Style for right column (now just a spacer)
	const rightColumnStyle = {
		flex: 1.7,
		height: '700px',
		maxWidth: '700px',
		background: 'rgba(255,255,255,0.0)',
		borderRadius: '1.5rem',
		boxShadow: 'none',
		overflow: 'hidden',
	};
	return (
		<section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-blue-50 to-yellow-200">
			{/* Full screen Bot canvas, always visible on right */}
			{!showChat && (
				<div style={botCanvasStyle}>
					<div style={botModelStyle}>
						<Bot />
					</div>
				</div>
			)}

			{/* Top right chat button */}
			<button
				className="absolute top-8 right-8 z-20 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition"
				onClick={() => {
					setModelTransition(true); // Start model animation immediately
					setTimeout(() => setShowChat(true), 700); // Show popup after delay
				}}
			>
				Chat
			</button>

			{/* Main content container, layered above Bot */}
			<div style={mainContainerStyle}>
				{/* Left column: slideshow + text */}
				<div className="flex flex-col justify-between gap-8" style={{ flex: 1.2, height: '700px', maxWidth: '1000px', transform: 'scale(0.85)', marginLeft: '0vw', marginRight: '-13vw' }}>
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
				{/* Right column: just a spacer now */}
				<div style={rightColumnStyle}></div>
			</div>

			{/* Chat popup, controlled by showChat state */}
			{showChat && (
				<div
					className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-opacity-95"
					onClick={e => {
						if (e.target === e.currentTarget) {
							setShowChat(false);
							setModelTransition(false);
						}
					}}
				>
					<div
						className="relative rounded-3xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-row items-stretch justify-center p-0 border border-gray-700 bg-gray-900"
					>
						<button
							className="absolute top-6 right-6 text-3xl font-bold text-gray-400 hover:text-blue-400 transition-all duration-200"
							style={{ background: 'transparent', border: 'none', zIndex: 10 }}
							onClick={() => {
								setShowChat(false);
								setModelTransition(false);
							}}
							aria-label="Close chat"
						>
							&times;
						</button>
						{/* Left: Character and controls */}
						<div className="flex flex-col items-center justify-between bg-gray-800 rounded-l-3xl p-8 w-1/3 min-w-[260px]" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.15)', height: '100%' }}>
							{/* Character model centered vertically */}
							<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
								<div style={{ width: '220px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Bot />
								</div>
							</div>
							{/* Controls below character, with extra bottom padding */}
							<div className="w-full flex flex-col items-center gap-4 pb-4">
							</div>
						</div>
						{/* Right: Chat area */}
						<div className="flex flex-col flex-grow justify-end p-8 w-2/3 bg-gray-900 rounded-r-3xl" style={{ minHeight: '100%' }}>
							<ChatBot />
						</div>
					</div>
				</div>
			)}

			{/* Greeting popup, shown on initial load */}
			{showGreeting && (
				<GreetingPopup onClose={() => setShowGreeting(false)} />
			)}
		</section>
	);
};

export default Home;
