import { Carousel, NavBar } from 'components';
import React from 'react';
import Bot from './Bot';
import chachaImg from '../assets/chacha-cahaudhary/chacha.webp';

const Home = () => {
	return (
		<section className="w-full min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 via-blue-50 to-yellow-200 relative">
			<NavBar />
			{/* Hero Section */}
			<div className="flex-1 flex flex-col items-center justify-center py-8 px-2 relative">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 to-yellow-100/80 pointer-events-none" />
				<div className="relative z-10 flex flex-col items-center w-full">
					<h1 className="text-4xl sm:text-5xl font-extrabold text-blue-900 mb-4 text-center drop-shadow-lg">Welcome to Namami Gange</h1>
					<p className="text-lg sm:text-xl text-blue-800 mb-8 text-center max-w-2xl font-medium">Explore the history, significance, and wonders of the holy river Ganga. Dive into interactive learning and connect with Chacha Chaudhary for a unique experience!</p>
					<div className="w-full max-w-3xl mb-8 rounded-2xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur">
						<Carousel />
					</div>
					<div className="w-full max-w-2xl mb-8">
						<div className="bg-white/95 rounded-xl shadow-lg p-6 text-center text-lg font-medium text-gray-700 border border-blue-100 flex flex-col items-center gap-2">
							<span>To know more about the holy river Ganga—its history, significance, and beyond—try a conversation with</span>
							<span className="text-blue-700 font-bold cursor-pointer hover:underline text-xl">Chacha Chaudhary</span>
							<span className="text-gray-500 text-sm">Click on Chacha Chaudhary below to start!</span>
						</div>
					</div>
				</div>
				{/* Mascot Floating Button */}
				<img
					src={chachaImg}
					alt="Chacha Chaudhary"
					className="w-24 sm:w-28 fixed bottom-8 left-8 z-50 drop-shadow-xl transition-transform hover:scale-110 cursor-pointer animate-bounce"
					title="Talk to Chacha Chaudhary!"
				/>
			</div>
			{/* Bot Section */}
			<div className="max-w-5xl mx-auto w-full pb-8">
				<Bot />
			</div>
		</section>
	);
};

export default Home;
